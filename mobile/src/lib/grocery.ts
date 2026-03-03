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
import { GroceryItem } from '../types';

const COLLECTION = 'groceries';

export async function getAllGroceries(): Promise<GroceryItem[]> {
  const user = await ensureAuth();
  const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GroceryItem));
}

export async function addGroceryItem(item: Omit<GroceryItem, 'id' | 'userId' | 'createdAt'>): Promise<void> {
  const user = await ensureAuth();
  await addDoc(collection(db, COLLECTION), {
    ...item,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), updates);
}

export async function deleteGroceryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
