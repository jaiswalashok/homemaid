import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, ensureAuth } from './firebase';
import { Recipe } from '../types';

const COLLECTION = 'recipes';

export async function getAllRecipes(): Promise<Recipe[]> {
  const user = await ensureAuth();
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Recipe));
}

export async function addRecipe(recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt'>): Promise<void> {
  const user = await ensureAuth();
  await addDoc(collection(db, COLLECTION), {
    ...recipe,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), updates);
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function uploadRecipeImage(uri: string, recipeId: string): Promise<string> {
  const user = await ensureAuth();
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `recipes/${user.uid}/${recipeId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

export async function deleteRecipeImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
