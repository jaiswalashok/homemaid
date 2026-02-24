import Constants from 'expo-constants';
import { logAPI } from '../utils/logger';
import { checkNetworkStatus, getNetworkErrorMessage } from '../utils/network';

// Primary API base from config, with fallbacks
const API_BASES = [
  Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000',
  'http://localhost:3000',
  'https://annapurna-eight.vercel.app',
  'https://annapurna-alpha.vercel.app',
].filter(Boolean);

const API_BASE = API_BASES[0];

async function makeRequestWithFallback(endpoint: string, options: RequestInit) {
  // Check network status first
  const networkStatus = await checkNetworkStatus();
  if (!networkStatus.isConnected || !networkStatus.isInternetReachable) {
    const errorMessage = getNetworkErrorMessage(networkStatus);
    logAPI.error('Network not available', { status: networkStatus, errorMessage });
    return { success: false, message: errorMessage };
  }

  // Try each API base until one works
  for (const base of API_BASES) {
    const url = `${base}${endpoint}`;
    logAPI.info('Trying API endpoint', { url, method: options.method });
    
    try {
      const response = await fetch(url, options);
      logAPI.info('API response status', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        const errorText = await response.text();
        logAPI.warn('API endpoint failed', { 
          url, 
          status: response.status, 
          statusText: response.statusText, 
          errorText 
        });
        continue; // Try next endpoint
      }

      const data = await response.json();
      logAPI.info('API request successful', { url, success: data.success });
      return data;
    } catch (error: any) {
      logAPI.warn('Network error for endpoint', { 
        url, 
        message: error.message 
      });
      continue; // Try next endpoint
    }
  }

  // All endpoints failed
  logAPI.error('All API endpoints failed', { attemptedEndpoints: API_BASES });
  return { 
    success: false, 
    message: 'Unable to connect to server. Please check your internet connection and try again.' 
  };
}

export async function sendVerificationCode(email: string, name: string) {
  logAPI.info('Sending verification code', { email, name, apiBase: API_BASE });
  
  return makeRequestWithFallback('/api/mobile/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  logAPI.info('Sending welcome email', { email, name });
  
  return makeRequestWithFallback('/api/mobile/send-welcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
}

// Gemini AI APIs
export async function parseRecipe(text: string, language: string = 'English') {
  logAPI.info('Parsing recipe', { textLength: text.length, language });
  
  const result = await makeRequestWithFallback('/api/gemini/parse-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to parse recipe');
  }

  logAPI.info('Recipe parsed successfully', { hasTitle: !!result.en?.title });
  return result;
}

export async function generateRecipeImage(recipeName: string) {
  logAPI.info('Generating recipe image', { recipeName });
  
  const result = await makeRequestWithFallback('/api/gemini/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeName }),
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to generate image');
  }

  return result;
}

export async function translateText(text: string, targetLanguage: string) {
  logAPI.info('Translating text', { textLength: text.length, targetLanguage });
  
  const result = await makeRequestWithFallback('/api/gemini/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to translate');
  }

  return result;
}

export async function generateFollowAlongScript(recipe: any, language: string = 'English') {
  logAPI.info('Generating follow-along script', { recipeTitle: recipe.en?.title, language });
  
  const result = await makeRequestWithFallback('/api/gemini/follow-along', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe, language }),
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to generate script');
  }

  return result;
}

export async function synthesizeSpeech(text: string, language: string = 'English') {
  logAPI.info('Synthesizing speech', { textLength: text.length, language });
  
  const result = await makeRequestWithFallback('/api/speech/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to synthesize speech');
  }

  return result;
}

export async function transcribeAudio(audioUri: string, language: string = 'English') {
  logAPI.info('Transcribing audio', { audioUri, language });
  
  // For FormData, we need to handle differently - try primary endpoint only
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  formData.append('language', language);

  try {
    const response = await fetch(`${API_BASE}/api/speech/transcribe`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to transcribe: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    logAPI.error('Transcribe audio failed', error);
    throw error;
  }
}

// Parse receipt image via Gemini
export async function parseReceiptImage(base64: string, mimeType: string) {
  logAPI.info('Parsing receipt image', { mimeType, dataSize: base64.length });
  
  const result = await makeRequestWithFallback('/api/gemini/parse-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mimeType }),
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to parse receipt');
  }

  return result;
}

// Format grocery items via Gemini
export async function formatGroceryItems(text: string) {
  logAPI.info('Formatting grocery items', { textLength: text.length });
  
  try {
    const result = await makeRequestWithFallback('/api/gemini/format-grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (result.success && result.items) {
      return result.items;
    }
  } catch (error) {
    logAPI.warn('Format grocery items failed, using fallback', error);
  }
  
  // Fallback: split by comma
  return text.split(',').map((s: string) => s.trim()).filter(Boolean);
}
