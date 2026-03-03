import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import { Expense } from '../types';

const COLLECTION = 'expenses';

export async function getAllExpenses(): Promise<Expense[]> {
  const user = await ensureAuth();
  const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>): Promise<void> {
  const user = await ensureAuth();
  await addDoc(collection(db, COLLECTION), {
    ...expense,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export function getExpenseSummary(expenses: Expense[]) {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const byType: Record<string, number> = {};
  expenses.forEach((exp) => {
    byType[exp.type] = (byType[exp.type] || 0) + exp.amount;
  });
  return { total, count: expenses.length, byType };
}
