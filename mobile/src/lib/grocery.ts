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
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
  userId?: string;
  createdAt: Timestamp | null;
}

const COLLECTION = 'groceries';

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user;
}

export async function getAllGroceries(): Promise<GroceryItem[]> {
  const user = requireUser();
  const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GroceryItem));
}

export async function addGroceryItem(name: string, quantity?: string, category?: string): Promise<string> {
  const user = requireUser();
  const ref = await addDoc(collection(db, COLLECTION), {
    name,
    quantity: quantity || '',
    category: category || 'General',
    checked: false,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function toggleGroceryItem(id: string, checked: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { checked });
}

export async function deleteGroceryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function clearCheckedItems(): Promise<void> {
  const user = requireUser();
  const q = query(collection(db, COLLECTION), where('userId', '==', user.uid), where('checked', '==', true));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

export async function addGroceryItemsBatch(items: { name: string; quantity?: string; category?: string }[]): Promise<void> {
  const user = requireUser();
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(collection(db, COLLECTION));
    batch.set(ref, {
      name: item.name,
      quantity: item.quantity || '',
      category: item.category || 'General',
      checked: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
}
