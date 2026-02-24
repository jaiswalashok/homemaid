import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface RecipeContent {
  title: string;
  description: string;
  cuisine: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: { item: string; quantity: string; unit: string }[];
  steps: { stepNumber: number; instruction: string; duration?: string }[];
}

export interface ParsedRecipe {
  en: RecipeContent;
  hi: RecipeContent;
}

export interface Recipe extends ParsedRecipe {
  id: string;
  images: string[];
  userId?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

const COLLECTION = 'recipes';

function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  return user;
}

function normalizeRecipe(raw: any): Omit<Recipe, 'id'> {
  if (raw.en && raw.en.title) {
    return raw;
  }
  const content: RecipeContent = {
    title: raw.title || '',
    description: raw.description || '',
    cuisine: raw.cuisine || '',
    prepTime: raw.prepTime || '',
    cookTime: raw.cookTime || '',
    servings: raw.servings || 4,
    ingredients: raw.ingredients || [],
    steps: raw.steps || [],
  };
  return { ...raw, en: content, hi: content };
}

export async function getAllRecipes(): Promise<Recipe[]> {
  requireAuth();
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...normalizeRecipe(d.data()),
  })) as Recipe[];
}

export async function addRecipe(
  parsed: ParsedRecipe,
  images: string[]
): Promise<string> {
  const user = requireAuth();
  const recipeData = {
    ...parsed,
    images,
    userId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTION), recipeData);
  return docRef.id;
}

export async function updateRecipe(
  id: string,
  data: Partial<ParsedRecipe> & { images?: string[] }
): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteRecipe(id: string): Promise<void> {
  requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}
