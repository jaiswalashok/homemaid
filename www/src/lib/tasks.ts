import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
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

export async function requireAuth() {
  let user = auth.currentUser;
  if (!user) {
    user = await ensureAuth();
  }
  if (!user) throw new Error("Authentication required");
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
  userId?: string;
  category?: string;
  description?: string;
}

// Get all daily task templates for current user
export async function getDailyTaskTemplates(): Promise<DailyTaskTemplate[]> {
  const user = await requireAuth();
  const q = query(
    collection(db, TEMPLATES_COLLECTION),
    where("userId", "==", user.uid)
  );
  const snapshot = await getDocs(q);
  const templates = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DailyTaskTemplate[];
  return templates.sort((a, b) => a.order - b.order);
}

// Get all master task templates (shared across all users)
export async function getMasterTaskTemplates(): Promise<DailyTaskTemplate[]> {
  await requireAuth();
  const q = query(collection(db, "masterTaskTemplates"));
  const snapshot = await getDocs(q);
  const templates = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DailyTaskTemplate[];
  return templates.sort((a, b) => a.order - b.order);
}

// Copy a master template to user's personal templates
export async function copyMasterTemplateToUser(masterTemplateId: string): Promise<string> {
  const user = await requireAuth();
  
  // Get the master template
  const masterDoc = await getDoc(doc(db, "masterTaskTemplates", masterTemplateId));
  if (!masterDoc.exists()) {
    throw new Error("Master template not found");
  }
  
  const masterData = masterDoc.data();
  
  // Create user template
  const userTemplateRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
    title: masterData.title,
    order: masterData.order,
    enabled: masterData.enabled,
    userId: user.uid,
    recurrence: masterData.recurrence || "daily",
    ...(masterData.dayOfWeek !== undefined && { dayOfWeek: masterData.dayOfWeek }),
    ...(masterData.dayOfMonth !== undefined && { dayOfMonth: masterData.dayOfMonth }),
    category: masterData.category,
    description: masterData.description,
  });
  
  return userTemplateRef.id;
}

// Seed the templates collection with defaults (run once)
export async function seedDailyTaskTemplates(): Promise<boolean> {
  console.log("[seedDailyTaskTemplates] Starting template seeding...");
  const user = await requireAuth();
  console.log("[seedDailyTaskTemplates] Authenticated user:", user.uid);
  const existing = await getDailyTaskTemplates();
  console.log("[seedDailyTaskTemplates] Found", existing.length, "existing templates");
  if (existing.length > 0) {
    console.log("[seedDailyTaskTemplates] Templates already exist, skipping seeding");
    return false; // already seeded
  }

  const batch = writeBatch(db);
  
  // Daily tasks
  DEFAULT_DAILY_TASKS.forEach((title, idx) => {
    const docRef = doc(collection(db, TEMPLATES_COLLECTION));
    batch.set(docRef, {
      title,
      order: idx + 1,
      enabled: true,
      userId: user.uid,
      recurrence: "daily",
    });
  });
  
  // Weekly tasks (run on Mondays by default)
  const weeklyTasks = [
    { title: "Deep clean refrigerator", dayOfWeek: 1 }, // Monday
    { title: "Change bed sheets", dayOfWeek: 1 }, // Monday
    { title: "Clean bathroom thoroughly", dayOfWeek: 2 }, // Tuesday
    { title: "Vacuum under furniture", dayOfWeek: 3 }, // Wednesday
    { title: "Clean windows and mirrors", dayOfWeek: 4 }, // Thursday
    { title: "Organize pantry and cabinets", dayOfWeek: 5 }, // Friday
    { title: "Meal prep for the week", dayOfWeek: 0 }, // Sunday
  ];
  
  weeklyTasks.forEach((task, idx) => {
    const docRef = doc(collection(db, TEMPLATES_COLLECTION));
    batch.set(docRef, {
      title: task.title,
      order: DEFAULT_DAILY_TASKS.length + idx + 1,
      enabled: true,
      userId: user.uid,
      recurrence: "weekly",
      dayOfWeek: task.dayOfWeek,
    });
  });
  
  // Monthly tasks (run on 1st of month by default)
  const monthlyTasks = [
    { title: "Deep clean oven and stove", dayOfMonth: 1 },
    { title: "Clean ceiling fans and light fixtures", dayOfMonth: 5 },
    { title: "Organize closets and wardrobes", dayOfMonth: 10 },
    { title: "Check and replace air filters", dayOfMonth: 15 },
    { title: "Clean behind appliances", dayOfMonth: 20 },
    { title: "Review and pay monthly bills", dayOfMonth: 25 },
  ];
  
  monthlyTasks.forEach((task, idx) => {
    const docRef = doc(collection(db, TEMPLATES_COLLECTION));
    batch.set(docRef, {
      title: task.title,
      order: DEFAULT_DAILY_TASKS.length + weeklyTasks.length + idx + 1,
      enabled: true,
      userId: user.uid,
      recurrence: "monthly",
      dayOfMonth: task.dayOfMonth,
    });
  });
  
  await batch.commit();
  const totalTasks = DEFAULT_DAILY_TASKS.length + weeklyTasks.length + monthlyTasks.length;
  console.log("[seedDailyTaskTemplates] Successfully seeded", totalTasks, "task templates (daily, weekly, monthly)");
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

// Get all tasks for a specific date (filtered by current user)
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

// Real-time listener for tasks on a specific date (filtered by current user)
export function onTasksForDate(
  date: string,
  userId: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
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

// Get incomplete non-daily tasks from previous days (carry over) for current user
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
  console.log("[seedDailyTasks] Starting for date:", date);
  const user = await requireAuth();
  console.log("[seedDailyTasks] Authenticated user:", user.uid);
  
  // Check if daily tasks already exist for this date
  console.log("[seedDailyTasks] Checking existing tasks...");
  const existing = await getTasksForDate(date);
  console.log("[seedDailyTasks] Found", existing.length, "existing tasks:", existing);
  const hasDailyTasks = existing.some((t) => t.isDaily);
  if (hasDailyTasks) {
    console.log("[seedDailyTasks] Daily tasks already exist, skipping seeding");
    return false; // already seeded
  }
  
  // Additional check: if we have any tasks for today, don't seed
  if (existing.length > 0) {
    console.log("[seedDailyTasks] Tasks already exist for today, skipping seeding");
    return false;
  }

  // First ensure templates exist
  console.log("[seedDailyTasks] Ensuring templates exist...");
  await seedDailyTaskTemplates();

  // Get enabled templates that should run today
  console.log("[seedDailyTasks] Getting templates for today...");
  const templates = await getDailyTaskTemplates();
  console.log("[seedDailyTasks] Found", templates.length, "templates:", templates);
  const eligible = templates.filter((t) => t.enabled && shouldTemplateRunOnDate(t, date));
  console.log("[seedDailyTasks] Found", eligible.length, "eligible templates for today:", eligible);
  if (eligible.length === 0) {
    console.log("[seedDailyTasks] No eligible templates for today");
    return false;
  }
  
  // Filter out templates that already have tasks with the same title for today
  const existingTitles = new Set(existing.map(t => t.title));
  const filteredEligible = eligible.filter(tmpl => !existingTitles.has(tmpl.title));
  console.log("[seedDailyTasks] After filtering existing titles:", filteredEligible.length, "tasks to create");
  
  if (filteredEligible.length === 0) {
    console.log("[seedDailyTasks] All eligible tasks already exist for today");
    return false;
  }

  const batch = writeBatch(db);
  filteredEligible.forEach((tmpl, idx) => {
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
  console.log("[seedDailyTasks] Committing batch with", filteredEligible.length, "tasks");
  await batch.commit();
  console.log("[seedDailyTasks] Successfully seeded", filteredEligible.length, "daily tasks for", date);
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
