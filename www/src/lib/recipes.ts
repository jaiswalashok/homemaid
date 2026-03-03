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
  Timestamp,
} from "firebase/firestore";
import { db, auth, ensureAuth } from "./firebase";
import { ParsedRecipe, RecipeContent } from "./gemini";
import { RecipeVideos } from "./youtube";

export interface Recipe extends ParsedRecipe {
  id: string;
  images: string[];
  videos?: RecipeVideos;
  userId?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

const COLLECTION = "recipes";

async function requireAuth() {
  let user = auth.currentUser;
  if (!user) {
    user = await ensureAuth();
  }
  if (!user) {
    throw new Error("You must be signed in to perform this action.");
  }
  return user;
}

// Migrate old flat-format recipes to the new bilingual en/hi structure
function normalizeRecipe(raw: any): Omit<Recipe, "id"> {
  if (raw.en && raw.en.title) {
    // Already in new format
    return raw;
  }
  // Old flat format — wrap into en, copy to hi as placeholder
  const content: RecipeContent = {
    title: raw.title || "",
    description: raw.description || "",
    cuisine: raw.cuisine || "",
    prepTime: raw.prepTime || "",
    cookTime: raw.cookTime || "",
    servings: raw.servings || 4,
    ingredients: raw.ingredients || [],
    steps: raw.steps || [],
  };
  return {
    ...raw,
    en: content,
    hi: content,
  };
}

export async function getAllRecipes(): Promise<Recipe[]> {
  console.log("[getAllRecipes] Starting to fetch recipes...");
  try {
    const user = await requireAuth();
    console.log("[getAllRecipes] Auth successful, user:", user.uid);
    
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    console.log("[getAllRecipes] Query created, executing...");
    
    const snapshot = await getDocs(q);
    console.log("[getAllRecipes] Query successful, docs count:", snapshot.docs.length);
    
    const recipes = snapshot.docs.map((d) => {
      const data = d.data();
      console.log("[getAllRecipes] Recipe data:", { id: d.id, userId: data.userId, hasData: !!data });
      return {
        id: d.id,
        ...normalizeRecipe(data),
      };
    }) as Recipe[];
    
    console.log("[getAllRecipes] Successfully processed", recipes.length, "recipes");
    return recipes;
  } catch (error: any) {
    console.error("[getAllRecipes] Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function addRecipe(
  parsed: ParsedRecipe,
  images: string[],
  videos?: RecipeVideos
): Promise<string> {
  console.log("[addRecipe] Starting recipe save...");
  try {
    const user = await requireAuth();
    console.log("[addRecipe] Auth successful, user:", user.uid);
    
    const recipeData = {
      ...parsed,
      images,
      ...(videos ? { videos } : {}),
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    console.log("[addRecipe] Recipe data prepared, adding to Firestore...");
    
    const docRef = await addDoc(collection(db, COLLECTION), recipeData);
    console.log("[addRecipe] Successfully added to Firestore with ID:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("[addRecipe] Error:", err);
    throw err;
  }
}

export async function updateRecipe(
  id: string,
  data: Partial<ParsedRecipe> & { images?: string[] }
): Promise<void> {
  await requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  await requireAuth();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}
