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

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  emoji: string;
  purchased: boolean;
  source: 'manual' | 'voice' | 'telegram' | 'recipe';
  createdAt: Timestamp | null;
  userId?: string;
}

const COLLECTION = 'groceries';

function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  return user;
}

export async function getAllGroceries(): Promise<GroceryItem[]> {
  requireAuth();
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as GroceryItem[];
  return items.sort((a, b) => {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
}

export async function addGroceryItem(
  item: Omit<GroceryItem, 'id' | 'createdAt' | 'userId'>
): Promise<string> {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...item,
    createdAt: serverTimestamp(),
    userId: user.uid,
  });
  return docRef.id;
}

export async function toggleGroceryPurchased(
  id: string,
  purchased: boolean
): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { purchased });
}

export async function deleteGroceryItem(id: string): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

export async function clearPurchasedGroceries(): Promise<number> {
  requireAuth();
  const items = await getAllGroceries();
  const purchased = items.filter((i) => i.purchased);
  for (const item of purchased) {
    await deleteDoc(doc(db, COLLECTION, item.id));
  }
  return purchased.length;
}
