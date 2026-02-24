import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface ExpenseItem {
  name: string;
  price: number;
}

export interface Expense {
  id: string;
  vendor: string;
  vendorFullName: string;
  type: string;
  amount: number;
  emoji: string;
  discount: number;
  displayDate: string;
  date: string;
  address: string;
  paymentMethod: string;
  items: ExpenseItem[];
  receiptImage?: string;
  source: 'manual' | 'receipt' | 'telegram';
  createdAt: Timestamp | null;
  userId?: string;
}

const COLLECTION = 'expenses';

function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  return user;
}

export async function getAllExpenses(): Promise<Expense[]> {
  requireAuth();
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  const expenses = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Expense[];
  return expenses.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
}

export async function addExpense(
  expense: Omit<Expense, 'id' | 'createdAt' | 'userId'>
): Promise<string> {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...expense,
    createdAt: serverTimestamp(),
    userId: user.uid,
  });
  return docRef.id;
}

export async function updateExpense(
  id: string,
  data: Partial<Expense>
): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function deleteExpense(id: string): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

export function getExpenseSummary(expenses: Expense[]) {
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const byType: Record<string, number> = {};
  expenses.forEach((e) => {
    const t = e.type || 'Other';
    byType[t] = (byType[t] || 0) + (e.amount || 0);
  });
  return { total, byType, count: expenses.length };
}
