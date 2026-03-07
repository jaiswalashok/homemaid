import { auth } from './firebase';

const BASE_URL = 'https://jaiswals.live';

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function apiPost(endpoint: string, body: any): Promise<any> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'API request failed');
  }
  return res.json();
}

export async function parseRecipeFromText(text: string): Promise<any> {
  return apiPost('/api/gemini/parse-recipe', { text });
}

export async function parseRecipeFromUrl(url: string): Promise<any> {
  return apiPost('/api/gemini/parse-recipe', { url });
}

export async function parseReceiptImage(base64Image: string): Promise<any> {
  return apiPost('/api/gemini/parse-receipt', { image: base64Image });
}

export async function formatGroceryList(text: string): Promise<any> {
  return apiPost('/api/gemini/format-grocery', { text });
}

export async function translateText(text: string, targetLanguage: string): Promise<any> {
  return apiPost('/api/gemini/translate', { text, targetLanguage });
}

export async function generateRecipeImage(recipeName: string): Promise<any> {
  return apiPost('/api/gemini/generate-image', { recipeName });
}
