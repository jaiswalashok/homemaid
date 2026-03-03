// API client for Next.js Vercel backend at jaiswals.live
const API_BASE = process.env.EXPO_PUBLIC_APP_URL || 'https://jaiswals.live';

export async function parseRecipe(text: string, language: string = 'English') {
  const res = await fetch(`${API_BASE}/api/gemini/parse-recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error('Failed to parse recipe');
  return res.json();
}

export async function formatGrocery(text: string) {
  const res = await fetch(`${API_BASE}/api/gemini/format-grocery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to format grocery');
  return res.json();
}

export async function parseReceipt(imageBase64: string, mimeType: string = 'image/jpeg') {
  const res = await fetch(`${API_BASE}/api/gemini/parse-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, mimeType }),
  });
  if (!res.ok) throw new Error('Failed to parse receipt');
  return res.json();
}

export async function transcribeAudio(audioUri: string, language: string = 'English') {
  const formData = new FormData();
  const response = await fetch(audioUri);
  const blob = await response.blob();
  formData.append('audio', blob, 'recording.m4a');
  formData.append('language', language);

  const res = await fetch(`${API_BASE}/api/speech/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to transcribe');
  return res.json();
}

export async function parseUserCommand(text: string) {
  // Use Gemini directly for command parsing since it's a lightweight call
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant for a household management app. Classify the user's message into one of these intents and extract structured data.

Intents:
- "add_task": User wants to add a task/chore
- "add_grocery": User wants to add grocery items
- "add_expense": User wants to log an expense
- "add_recipe": User wants to find/add a recipe
- "unknown": Can't determine intent

User message: "${text}"

Return ONLY valid JSON (no markdown):
{
  "intent": "add_task|add_grocery|add_expense|add_recipe|unknown",
  "items": ["item1", "item2"],
  "expense": { "vendor": "", "amount": 0, "type": "", "items": [{"name": "", "price": 0}] }
}

For add_task: items = array of task descriptions with emojis
For add_grocery: items = array of grocery items with emoji (e.g. "🥛 Milk", "🥚 Eggs")
For add_expense: fill expense object
For add_recipe: items = array of recipe names
For unknown: items = []`
          }]
        }]
      }),
    }
  );
  const data = await res.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return { intent: parsed.intent || 'unknown', data: parsed, rawText: text };
  } catch {
    return { intent: 'unknown' as const, data: {}, rawText: text };
  }
}
