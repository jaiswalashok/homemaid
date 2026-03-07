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
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  cuisine?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  userId?: string;
  createdAt: Timestamp | null;
}

const COLLECTION = 'recipes';

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user;
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const user = requireUser();
  const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
}

export async function addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<string> {
  const user = requireUser();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...recipe,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...recipe });
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
