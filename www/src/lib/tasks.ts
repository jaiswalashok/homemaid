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
} from "firebase/firestore";
import { db, auth, ensureAuth } from "./firebase";

export type TaskStatus = "pending" | "in_progress" | "paused" | "completed";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  isUrgent: boolean;
  isDaily: boolean; // recurring daily task vs one-off
  date: string; // YYYY-MM-DD
  order: number; // position in list
  createdAt: Timestamp | null;
  startedAt: Timestamp | null;
  pausedAt: Timestamp | null;
  completedAt: Timestamp | null;
  elapsedMs: number; // total time spent (excluding pauses)
  source?: "manual" | "voice" | "telegram";
  userId?: string;
}

const COLLECTION = "tasks";

async function requireAuth() {
  let user = auth.currentUser;
  if (!user) {
    user = await ensureAuth();
  }
  if (!user) {
    throw new Error("You must be signed in.");
  }
  return user;
}

// Get today's date string in YYYY-MM-DD
export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Comprehensive default household daily tasks
export const DEFAULT_DAILY_TASKS = [
  // Morning routine
  "Make the beds",
  "Open windows for fresh air",
  "Prepare breakfast",
  "Wash breakfast dishes",
  "Wipe kitchen counters and stove",
  // Laundry
  "Sort and start laundry",
  "Hang or dry clothes",
  "Fold and put away dry clothes",
  "Iron clothes for tomorrow",
  // Cleaning
  "Sweep all floors",
  "Mop the floors",
  "Vacuum carpets and rugs",
  "Dust furniture and shelves",
  "Clean bathroom sink and toilet",
  "Wipe bathroom mirror",
  "Clean kitchen sink",
  "Wipe dining table",
  // Kitchen & meals
  "Prepare lunch",
  "Wash lunch dishes",
  "Prepare snacks for kids",
  "Plan and prepare dinner",
  "Wash dinner dishes",
  "Clean stove and kitchen after dinner",
  "Prepare lunch boxes for tomorrow",
  // Organizing
  "Organize shoes at entryway",
  "Tidy up living room",
  "Tidy up children's room",
  "Put toys back in place",
  "Sort and handle mail/papers",
  // Maintenance
  "Take out the trash",
  "Replace trash bags",
  "Water indoor plants",
  "Check and restock groceries",
  "Wipe light switches and door handles",
  // Evening routine
  "Set out clothes for tomorrow",
  "Quick tidy-up before bed",
  "Lock all doors and windows",
  "Turn off all lights and appliances",
];

// ---- Daily Task Templates (stored in Firestore) ----
const TEMPLATES_COLLECTION = "dailyTaskTemplates";

export type TaskRecurrence = "daily" | "weekly" | "biweekly" | "monthly";

export interface DailyTaskTemplate {
  id: string;
  title: string;
  order: number;
  enabled: boolean;
  recurrence?: TaskRecurrence; // default "daily" for backward compat
  dayOfWeek?: number; // 0=Sun..6=Sat (for weekly/biweekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  isRecipe?: boolean; // true if this template is from a recipe
  recipeId?: string; // linked recipe ID
}

// Get all daily task templates from Firestore
export async function getDailyTaskTemplates(): Promise<DailyTaskTemplate[]> {
  const user = await requireAuth();
  const q = query(collection(db, TEMPLATES_COLLECTION), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  const templates = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DailyTaskTemplate[];
  return templates.sort((a, b) => a.order - b.order);
}

// Seed the templates collection with defaults (run once)
export async function seedDailyTaskTemplates(): Promise<boolean> {
  const user = await requireAuth();
  const existing = await getDailyTaskTemplates();
  if (existing.length > 0) return false; // already seeded

  const batch = writeBatch(db);
  DEFAULT_DAILY_TASKS.forEach((title, idx) => {
    const docRef = doc(collection(db, TEMPLATES_COLLECTION));
    batch.set(docRef, {
      title,
      order: idx + 1,
      enabled: true,
      userId: user.uid,
    });
  });
  await batch.commit();
  console.log("[Tasks] Seeded", DEFAULT_DAILY_TASKS.length, "daily task templates");
  return true;
}

// Add a new task template with recurrence options
export async function addDailyTaskTemplate(
  title: string,
  options?: {
    recurrence?: TaskRecurrence;
    dayOfWeek?: number;
    dayOfMonth?: number;
    isRecipe?: boolean;
    recipeId?: string;
  }
): Promise<string> {
  const user = await requireAuth();
  const templates = await getDailyTaskTemplates();
  const maxOrder = templates.length > 0 ? Math.max(...templates.map((t) => t.order)) : 0;
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
    title,
    order: maxOrder + 1,
    enabled: true,
    userId: user.uid,
    recurrence: options?.recurrence || "daily",
    ...(options?.dayOfWeek !== undefined && { dayOfWeek: options.dayOfWeek }),
    ...(options?.dayOfMonth !== undefined && { dayOfMonth: options.dayOfMonth }),
    ...(options?.isRecipe && { isRecipe: true, recipeId: options.recipeId || "" }),
  });
  return docRef.id;
}

// Update a daily task template
export async function updateDailyTaskTemplate(
  id: string,
  data: Partial<DailyTaskTemplate>
): Promise<void> {
  await requireAuth();
  const docRef = doc(db, TEMPLATES_COLLECTION, id);
  await updateDoc(docRef, data);
}

// Delete a daily task template
export async function deleteDailyTaskTemplate(id: string): Promise<void> {
  await requireAuth();
  const docRef = doc(db, TEMPLATES_COLLECTION, id);
  await deleteDoc(docRef);
}

// Get all tasks for a specific date
export async function getTasksForDate(date: string): Promise<Task[]> {
  const user = await requireAuth();
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Task[];
  // Sort client-side to avoid composite index requirement
  return tasks.sort((a, b) => a.order - b.order);
}

// Real-time listener for tasks on a specific date
export function onTasksForDate(
  date: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in");
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid),
    where("date", "==", date)
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Task[];
    // Sort: urgent first, then by order
    tasks.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.order - b.order;
    });
    callback(tasks);
  });
}

// Get incomplete non-daily tasks from previous days (carry over)
// Uses simple query + client-side filtering to avoid composite index
export async function getCarryOverTasks(today: string): Promise<Task[]> {
  const user = await requireAuth();
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid),
    where("isDaily", "==", false)
  );
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Task[];
  // Filter client-side: older than today + not completed
  return all.filter(
    (t) => t.date < today && t.status !== "completed"
  );
}

// Check if a template should run on a given date
function shouldTemplateRunOnDate(tmpl: DailyTaskTemplate, date: string): boolean {
  const recurrence = tmpl.recurrence || "daily";
  const d = new Date(date + "T00:00:00");
  const dayOfWeek = d.getDay(); // 0=Sun..6=Sat
  const dayOfMonth = d.getDate(); // 1-31

  if (recurrence === "daily") return true;

  if (recurrence === "weekly") {
    return tmpl.dayOfWeek !== undefined ? dayOfWeek === tmpl.dayOfWeek : dayOfWeek === 1; // default Monday
  }

  if (recurrence === "biweekly") {
    // Run on the specified day of week, every other week (using ISO week number)
    const targetDay = tmpl.dayOfWeek !== undefined ? tmpl.dayOfWeek : 1;
    if (dayOfWeek !== targetDay) return false;
    // Use week number to determine odd/even week
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return weekNum % 2 === 0; // even weeks
  }

  if (recurrence === "monthly") {
    return tmpl.dayOfMonth !== undefined ? dayOfMonth === tmpl.dayOfMonth : dayOfMonth === 1; // default 1st
  }

  return false;
}

// Seed recurring tasks for today from templates (if they don't exist yet)
export async function seedDailyTasks(date: string): Promise<boolean> {
  const user = await requireAuth();
  
  // Check if daily tasks already exist for this date
  const existing = await getTasksForDate(date);
  const hasDailyTasks = existing.some((t) => t.isDaily);
  if (hasDailyTasks) return false; // already seeded

  // First ensure templates exist
  await seedDailyTaskTemplates();

  // Get enabled templates that should run today
  const templates = await getDailyTaskTemplates();
  const eligible = templates.filter((t) => t.enabled && shouldTemplateRunOnDate(t, date));
  if (eligible.length === 0) return false;

  const batch = writeBatch(db);
  eligible.forEach((tmpl, idx) => {
    const docRef = doc(collection(db, COLLECTION));
    batch.set(docRef, {
      title: tmpl.isRecipe ? `🍳 ${tmpl.title}` : tmpl.title,
      status: "pending",
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

// Add a new task (urgent tasks go to top with order 0)
export async function addTask(
  title: string,
  date: string,
  isUrgent: boolean = false
): Promise<string> {
  const user = await requireAuth();
  const docRef = await addDoc(collection(db, COLLECTION), {
    title,
    status: "pending",
    isUrgent,
    isDaily: false,
    date,
    order: isUrgent ? -Date.now() : Date.now(), // urgent = negative for top sort
    createdAt: serverTimestamp(),
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    elapsedMs: 0,
    userId: user.uid,
  });
  return docRef.id;
}

// Update task status
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  extraData: Partial<Task> = {}
): Promise<void> {
  await requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    status,
    ...extraData,
  });
}

// Update task fields
export async function updateTask(
  id: string,
  data: Partial<Task>
): Promise<void> {
  await requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, data);
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
  await requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

// Carry over incomplete non-daily tasks to today
export async function carryOverTasks(today: string): Promise<number> {
  const carryOvers = await getCarryOverTasks(today);
  if (carryOvers.length === 0) return 0;

  await requireAuth();
  const batch = writeBatch(db);
  
  carryOvers.forEach((task) => {
    // Update the old task's date to today
    const docRef = doc(db, COLLECTION, task.id);
    batch.update(docRef, {
      date: today,
      status: "pending",
      startedAt: null,
      pausedAt: null,
    });
  });

  await batch.commit();
  return carryOvers.length;
}
