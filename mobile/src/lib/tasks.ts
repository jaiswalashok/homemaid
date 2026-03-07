import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export type TaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed';
export type TaskRecurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  isUrgent: boolean;
  isDaily: boolean;
  date: string;
  order: number;
  createdAt: Timestamp | null;
  startedAt: Timestamp | null;
  pausedAt: Timestamp | null;
  completedAt: Timestamp | null;
  elapsedMs: number;
  userId?: string;
}

export interface DailyTaskTemplate {
  id: string;
  title: string;
  order: number;
  enabled: boolean;
  recurrence?: TaskRecurrence;
  dayOfWeek?: number;
  dayOfMonth?: number;
  userId?: string;
  category?: string;
  description?: string;
}

const COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'dailyTaskTemplates';

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user;
}

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function getDailyTaskTemplates(): Promise<DailyTaskTemplate[]> {
  const user = requireUser();
  const q = query(collection(db, TEMPLATES_COLLECTION), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DailyTaskTemplate));
}

function shouldTemplateRunToday(tmpl: DailyTaskTemplate, date: string): boolean {
  const recurrence = tmpl.recurrence || 'daily';
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const dayOfMonth = d.getDate();

  if (recurrence === 'daily') return true;

  if (recurrence === 'weekly') {
    return tmpl.dayOfWeek !== undefined ? dayOfWeek === tmpl.dayOfWeek : dayOfWeek === 1;
  }

  if (recurrence === 'biweekly') {
    const targetDay = tmpl.dayOfWeek !== undefined ? tmpl.dayOfWeek : 1;
    if (dayOfWeek !== targetDay) return false;
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return weekNum % 2 === 0;
  }

  if (recurrence === 'monthly') {
    return tmpl.dayOfMonth !== undefined ? dayOfMonth === tmpl.dayOfMonth : dayOfMonth === 1;
  }

  return false;
}

export async function seedDailyTasks(date: string): Promise<void> {
  const user = requireUser();
  const templates = await getDailyTaskTemplates();
  const eligible = templates.filter(t => t.enabled && shouldTemplateRunToday(t, date));
  if (eligible.length === 0) return;

  const existingQ = query(
    collection(db, COLLECTION),
    where('date', '==', date),
    where('userId', '==', user.uid),
    where('isDaily', '==', true)
  );
  const existingSnap = await getDocs(existingQ);
  const existingTitles = new Set(existingSnap.docs.map(d => d.data().title));

  const toAdd = eligible.filter(t => !existingTitles.has(t.title));
  if (toAdd.length === 0) return;

  const batch = writeBatch(db);
  toAdd.forEach((tmpl, i) => {
    const ref = doc(collection(db, COLLECTION));
    batch.set(ref, {
      title: tmpl.title,
      status: 'pending',
      isUrgent: false,
      isDaily: true,
      date,
      order: tmpl.order ?? i + 1,
      createdAt: serverTimestamp(),
      startedAt: null,
      pausedAt: null,
      completedAt: null,
      elapsedMs: 0,
      userId: user.uid,
    });
  });
  await batch.commit();
}

export function onTasksForDate(date: string, userId: string, callback: (tasks: Task[]) => void) {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', date),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const tasks = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Task))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    callback(tasks);
  });
}

export async function addTask(date: string, title: string): Promise<Task> {
  const user = requireUser();
  const ref = await addDoc(collection(db, COLLECTION), {
    title,
    status: 'pending',
    isUrgent: false,
    isDaily: false,
    date,
    order: Date.now(),
    createdAt: serverTimestamp(),
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    elapsedMs: 0,
    userId: user.uid,
  });
  return { id: ref.id, title, status: 'pending', isUrgent: false, isDaily: false, date, order: 0, createdAt: null, startedAt: null, pausedAt: null, completedAt: null, elapsedMs: 0 };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, elapsedMs?: number): Promise<void> {
  const ref = doc(db, COLLECTION, taskId);
  const updates: any = { status };
  if (status === 'in_progress') updates.startedAt = serverTimestamp();
  if (status === 'paused') updates.pausedAt = serverTimestamp();
  if (status === 'completed') updates.completedAt = serverTimestamp();
  if (elapsedMs !== undefined) updates.elapsedMs = elapsedMs;
  await updateDoc(ref, updates);
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, taskId));
}

export async function copyTemplateToUser(template: DailyTaskTemplate): Promise<void> {
  const user = requireUser();
  const data: any = {
    title: template.title,
    order: template.order,
    enabled: template.enabled,
    userId: user.uid,
    recurrence: template.recurrence || 'daily',
  };
  if (template.dayOfWeek !== undefined) data.dayOfWeek = template.dayOfWeek;
  if (template.dayOfMonth !== undefined) data.dayOfMonth = template.dayOfMonth;
  if (template.category) data.category = template.category;
  if (template.description) data.description = template.description;
  await addDoc(collection(db, TEMPLATES_COLLECTION), data);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
}

export const MASTER_TEMPLATES: DailyTaskTemplate[] = [
  // Morning Routine
  { id: 'daily-1', title: 'Make the beds', recurrence: 'daily', category: 'Morning Routine', order: 1, enabled: true },
  { id: 'daily-2', title: 'Open windows for fresh air', recurrence: 'daily', category: 'Morning Routine', order: 2, enabled: true },
  { id: 'daily-3', title: 'Prepare breakfast', recurrence: 'daily', category: 'Morning Routine', order: 3, enabled: true },
  { id: 'daily-4', title: 'Wash breakfast dishes', recurrence: 'daily', category: 'Morning Routine', order: 4, enabled: true },
  { id: 'daily-5', title: 'Wipe kitchen counters and stove', recurrence: 'daily', category: 'Morning Routine', order: 5, enabled: true },
  // Laundry
  { id: 'daily-6', title: 'Sort and start laundry', recurrence: 'daily', category: 'Laundry', order: 6, enabled: true },
  { id: 'daily-7', title: 'Hang or dry clothes', recurrence: 'daily', category: 'Laundry', order: 7, enabled: true },
  { id: 'daily-8', title: 'Fold and put away dry clothes', recurrence: 'daily', category: 'Laundry', order: 8, enabled: true },
  { id: 'daily-9', title: 'Iron clothes for tomorrow', recurrence: 'daily', category: 'Laundry', order: 9, enabled: true },
  // Cleaning
  { id: 'daily-10', title: 'Sweep all floors', recurrence: 'daily', category: 'Cleaning', order: 10, enabled: true },
  { id: 'daily-11', title: 'Mop the floors', recurrence: 'daily', category: 'Cleaning', order: 11, enabled: true },
  { id: 'daily-12', title: 'Vacuum carpets and rugs', recurrence: 'daily', category: 'Cleaning', order: 12, enabled: true },
  { id: 'daily-13', title: 'Dust furniture and shelves', recurrence: 'daily', category: 'Cleaning', order: 13, enabled: true },
  { id: 'daily-14', title: 'Clean bathroom sink and toilet', recurrence: 'daily', category: 'Cleaning', order: 14, enabled: true },
  { id: 'daily-15', title: 'Wipe bathroom mirror', recurrence: 'daily', category: 'Cleaning', order: 15, enabled: true },
  { id: 'daily-16', title: 'Clean kitchen sink', recurrence: 'daily', category: 'Cleaning', order: 16, enabled: true },
  { id: 'daily-17', title: 'Wipe dining table', recurrence: 'daily', category: 'Cleaning', order: 17, enabled: true },
  // Kitchen & Meals
  { id: 'daily-18', title: 'Prepare lunch', recurrence: 'daily', category: 'Kitchen & Meals', order: 18, enabled: true },
  { id: 'daily-19', title: 'Wash lunch dishes', recurrence: 'daily', category: 'Kitchen & Meals', order: 19, enabled: true },
  { id: 'daily-20', title: 'Prepare snacks for kids', recurrence: 'daily', category: 'Kitchen & Meals', order: 20, enabled: true },
  { id: 'daily-21', title: 'Plan and prepare dinner', recurrence: 'daily', category: 'Kitchen & Meals', order: 21, enabled: true },
  { id: 'daily-22', title: 'Wash dinner dishes', recurrence: 'daily', category: 'Kitchen & Meals', order: 22, enabled: true },
  { id: 'daily-23', title: 'Clean stove and kitchen after dinner', recurrence: 'daily', category: 'Kitchen & Meals', order: 23, enabled: true },
  { id: 'daily-24', title: 'Prepare lunch boxes for tomorrow', recurrence: 'daily', category: 'Kitchen & Meals', order: 24, enabled: true },
  // Organizing
  { id: 'daily-25', title: 'Organize shoes at entryway', recurrence: 'daily', category: 'Organizing', order: 25, enabled: true },
  { id: 'daily-26', title: 'Tidy up living room', recurrence: 'daily', category: 'Organizing', order: 26, enabled: true },
  { id: 'daily-27', title: "Tidy up children's room", recurrence: 'daily', category: 'Organizing', order: 27, enabled: true },
  { id: 'daily-28', title: 'Put toys back in place', recurrence: 'daily', category: 'Organizing', order: 28, enabled: true },
  // Maintenance
  { id: 'daily-29', title: 'Take out the trash', recurrence: 'daily', category: 'Maintenance', order: 29, enabled: true },
  { id: 'daily-30', title: 'Water indoor plants', recurrence: 'daily', category: 'Maintenance', order: 30, enabled: true },
  // Evening Routine
  { id: 'daily-31', title: 'Set out clothes for tomorrow', recurrence: 'daily', category: 'Evening Routine', order: 31, enabled: true },
  { id: 'daily-32', title: 'Quick tidy-up before bed', recurrence: 'daily', category: 'Evening Routine', order: 32, enabled: true },
  { id: 'daily-33', title: 'Lock all doors and windows', recurrence: 'daily', category: 'Evening Routine', order: 33, enabled: true },
  { id: 'daily-34', title: 'Turn off all lights and appliances', recurrence: 'daily', category: 'Evening Routine', order: 34, enabled: true },
  // Weekly
  { id: 'weekly-1', title: 'Deep clean refrigerator', recurrence: 'weekly', category: 'Deep Cleaning', dayOfWeek: 1, order: 35, enabled: true },
  { id: 'weekly-2', title: 'Change bed sheets', recurrence: 'weekly', category: 'Laundry', dayOfWeek: 1, order: 36, enabled: true },
  { id: 'weekly-3', title: 'Clean bathroom thoroughly', recurrence: 'weekly', category: 'Deep Cleaning', dayOfWeek: 2, order: 37, enabled: true },
  { id: 'weekly-4', title: 'Vacuum under furniture', recurrence: 'weekly', category: 'Deep Cleaning', dayOfWeek: 3, order: 38, enabled: true },
  { id: 'weekly-5', title: 'Clean windows and mirrors', recurrence: 'weekly', category: 'Deep Cleaning', dayOfWeek: 4, order: 39, enabled: true },
  { id: 'weekly-6', title: 'Organize pantry and cabinets', recurrence: 'weekly', category: 'Organizing', dayOfWeek: 5, order: 40, enabled: true },
  { id: 'weekly-7', title: 'Meal prep for the week', recurrence: 'weekly', category: 'Kitchen & Meals', dayOfWeek: 0, order: 41, enabled: true },
  { id: 'weekly-8', title: 'Wash car', recurrence: 'weekly', category: 'Maintenance', dayOfWeek: 6, order: 42, enabled: true },
  // Bi-weekly
  { id: 'biweekly-1', title: 'Deep clean oven', recurrence: 'biweekly', category: 'Deep Cleaning', dayOfWeek: 6, order: 43, enabled: true },
  { id: 'biweekly-2', title: 'Clean ceiling fans', recurrence: 'biweekly', category: 'Deep Cleaning', dayOfWeek: 6, order: 44, enabled: true },
  { id: 'biweekly-3', title: 'Organize closets', recurrence: 'biweekly', category: 'Organizing', dayOfWeek: 0, order: 45, enabled: true },
  { id: 'biweekly-4', title: 'Clean baseboards and trim', recurrence: 'biweekly', category: 'Deep Cleaning', dayOfWeek: 6, order: 46, enabled: true },
  // Monthly
  { id: 'monthly-1', title: 'Deep clean oven and stove', recurrence: 'monthly', category: 'Deep Cleaning', dayOfMonth: 1, order: 47, enabled: true },
  { id: 'monthly-2', title: 'Clean ceiling fans and light fixtures', recurrence: 'monthly', category: 'Deep Cleaning', dayOfMonth: 5, order: 48, enabled: true },
  { id: 'monthly-3', title: 'Organize closets and wardrobes', recurrence: 'monthly', category: 'Organizing', dayOfMonth: 10, order: 49, enabled: true },
  { id: 'monthly-4', title: 'Check and replace air filters', recurrence: 'monthly', category: 'Maintenance', dayOfMonth: 15, order: 50, enabled: true },
  { id: 'monthly-5', title: 'Review and pay monthly bills', recurrence: 'monthly', category: 'Administrative', dayOfMonth: 25, order: 51, enabled: true },
  { id: 'monthly-6', title: 'Check smoke detectors and batteries', recurrence: 'monthly', category: 'Safety', dayOfMonth: 1, order: 52, enabled: true },
];
