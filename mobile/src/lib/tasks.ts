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
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { Task, DailyTaskTemplate } from '../types';

const COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'dailyTaskTemplates';

export async function getDailyTaskTemplates(): Promise<DailyTaskTemplate[]> {
  const user = await ensureAuth();
  const q = query(collection(db, TEMPLATES_COLLECTION), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DailyTaskTemplate));
}

export async function addDailyTaskTemplate(template: Omit<DailyTaskTemplate, 'id' | 'userId' | 'createdAt'>): Promise<void> {
  const user = await ensureAuth();
  await addDoc(collection(db, TEMPLATES_COLLECTION), {
    ...template,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function deleteDailyTaskTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  const user = await ensureAuth();
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', user.uid),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task));
}

export async function addTask(task: Omit<Task, 'id' | 'userId' | 'createdAt'>): Promise<void> {
  const user = await ensureAuth();
  await addDoc(collection(db, COLLECTION), {
    ...task,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function updateTaskStatus(id: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { completed });
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export function shouldTemplateRunOnDate(template: DailyTaskTemplate, date: Date): boolean {
  const dayOfWeek = date.getDay();
  
  if (template.frequency === 'daily') return true;
  if (template.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (template.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
  if (template.frequency === 'custom' && template.daysOfWeek) {
    return template.daysOfWeek.includes(dayOfWeek);
  }
  
  return false;
}

export async function seedDailyTasks(date: string): Promise<void> {
  const templates = await getDailyTaskTemplates();
  const dateObj = new Date(date);
  
  for (const template of templates) {
    if (shouldTemplateRunOnDate(template, dateObj)) {
      await addTask({
        title: template.title,
        completed: false,
        date,
        isDaily: true,
      });
    }
  }
}
