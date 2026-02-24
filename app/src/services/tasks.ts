import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type TaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed';

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
  source?: 'manual' | 'voice' | 'telegram';
  userId?: string;
}

const COLLECTION = 'tasks';

function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  return user;
}

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const DEFAULT_DAILY_TASKS = [
  'Make the beds',
  'Open windows for fresh air',
  'Prepare breakfast',
  'Wash breakfast dishes',
  'Wipe kitchen counters and stove',
  'Sort and start laundry',
  'Hang or dry clothes',
  'Fold and put away dry clothes',
  'Iron clothes for tomorrow',
  'Sweep all floors',
  'Mop the floors',
  'Vacuum carpets and rugs',
  'Dust furniture and shelves',
  'Clean bathroom sink and toilet',
  'Wipe bathroom mirror',
  'Clean kitchen sink',
  'Wipe dining table',
  'Prepare lunch',
  'Wash lunch dishes',
  'Prepare snacks for kids',
  'Plan and prepare dinner',
  'Wash dinner dishes',
  'Clean stove and kitchen after dinner',
  'Prepare lunch boxes for tomorrow',
  'Organize shoes at entryway',
  'Tidy up living room',
  'Tidy up children\'s room',
  'Put toys back in place',
  'Sort and handle mail/papers',
  'Take out the trash',
  'Replace trash bags',
  'Water indoor plants',
  'Check and restock groceries',
  'Wipe light switches and door handles',
  'Set out clothes for tomorrow',
  'Quick tidy-up before bed',
  'Lock all doors and windows',
  'Turn off all lights and appliances',
];

const TEMPLATES_COLLECTION = 'dailyTaskTemplates';

export type TaskRecurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface DailyTaskTemplate {
  id: string;
  title: string;
  order: number;
  enabled: boolean;
  recurrence?: TaskRecurrence;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isRecipe?: boolean;
  recipeId?: string;
}

export async function getDailyTaskTemplates(): Promise<DailyTaskTemplate[]> {
  requireAuth();
  const q = query(collection(db, TEMPLATES_COLLECTION));
  const snapshot = await getDocs(q);
  const templates = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DailyTaskTemplate[];
  return templates.sort((a, b) => a.order - b.order);
}

export async function seedDailyTaskTemplates(): Promise<boolean> {
  requireAuth();
  const existing = await getDailyTaskTemplates();
  if (existing.length > 0) return false;

  const batch = writeBatch(db);
  DEFAULT_DAILY_TASKS.forEach((title, idx) => {
    const docRef = doc(collection(db, TEMPLATES_COLLECTION));
    batch.set(docRef, {
      title,
      order: idx + 1,
      enabled: true,
    });
  });
  await batch.commit();
  return true;
}

function shouldTemplateRunOnDate(tmpl: DailyTaskTemplate, date: string): boolean {
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

export async function getTasksForDate(date: string): Promise<Task[]> {
  requireAuth();
  console.log('[Tasks] Fetching tasks for date:', date);
  const q = query(collection(db, COLLECTION), where('date', '==', date));
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Task[];
  console.log('[Tasks] Retrieved tasks:', tasks.length);
  return tasks.sort((a, b) => a.order - b.order);
}

export function onTasksForDate(
  date: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where('date', '==', date));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Task[];
    tasks.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.order - b.order;
    });
    callback(tasks);
  });
}

export async function getCarryOverTasks(today: string): Promise<Task[]> {
  requireAuth();
  const q = query(collection(db, COLLECTION), where('isDaily', '==', false));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Task[];
  return all.filter((t) => t.date < today && t.status !== 'completed');
}

export async function seedDailyTasks(date: string): Promise<boolean> {
  const user = requireAuth();
  const existing = await getTasksForDate(date);
  const hasDailyTasks = existing.some((t) => t.isDaily);
  if (hasDailyTasks) return false;

  await seedDailyTaskTemplates();

  const templates = await getDailyTaskTemplates();
  const eligible = templates.filter((t) => t.enabled && shouldTemplateRunOnDate(t, date));
  if (eligible.length === 0) return false;

  const batch = writeBatch(db);
  eligible.forEach((tmpl, idx) => {
    const docRef = doc(collection(db, COLLECTION));
    batch.set(docRef, {
      title: tmpl.isRecipe ? `🍳 ${tmpl.title}` : tmpl.title,
      status: 'pending',
      isUrgent: false,
      isDaily: true,
      date,
      order: idx + 1,
      createdAt: serverTimestamp(),
      startedAt: null,
      pausedAt: null,
      completedAt: null,
      elapsedMs: 0,
      userId: user.uid,
    });
  });
  await batch.commit();
  return true;
}

export async function addTask(
  title: string,
  date: string,
  isUrgent: boolean = false
): Promise<string> {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, COLLECTION), {
    title,
    status: 'pending',
    isUrgent,
    isDaily: false,
    date,
    order: isUrgent ? -Date.now() : Date.now(),
    createdAt: serverTimestamp(),
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    elapsedMs: 0,
    userId: user.uid,
  });
  return docRef.id;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  extraData: Partial<Task> = {}
): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { status, ...extraData });
}

export async function deleteTask(id: string): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

export async function carryOverTasks(today: string): Promise<number> {
  const carryOvers = await getCarryOverTasks(today);
  if (carryOvers.length === 0) return 0;

  requireAuth();
  const batch = writeBatch(db);
  carryOvers.forEach((task) => {
    const docRef = doc(db, COLLECTION, task.id);
    batch.update(docRef, {
      date: today,
      status: 'pending',
      startedAt: null,
      pausedAt: null,
    });
  });
  await batch.commit();
  return carryOvers.length;
}
