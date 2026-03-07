import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  receiptUrl?: string;
  userId?: string;
  createdAt: Timestamp | null;
}

const COLLECTION = 'expenses';

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user;
}

export async function getAllExpenses(): Promise<Expense[]> {
  const user = requireUser();
  const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Expense))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
  const user = requireUser();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...expense,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
