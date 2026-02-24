import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("Resource exhausted");
      if (is429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Gemini rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

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

export async function parseRecipeFromText(
  text: string,
  language: string = "English"
): Promise<ParsedRecipe> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a recipe parser. Parse the following recipe description into a structured JSON format.
Provide the recipe in BOTH English and Hindi in a single response.

Input: "${text}"

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "en": {
    "title": "recipe name in English",
    "description": "brief description in English",
    "cuisine": "cuisine type in English",
    "prepTime": "e.g. 15 mins",
    "cookTime": "e.g. 30 mins",
    "servings": 4,
    "ingredients": [
      {"item": "ingredient name in English", "quantity": "2", "unit": "cups"}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "detailed step in English", "duration": "5 mins"}
    ]
  },
  "hi": {
    "title": "recipe name in Hindi",
    "description": "brief description in Hindi",
    "cuisine": "cuisine type in Hindi",
    "prepTime": "e.g. 15 मिनट",
    "cookTime": "e.g. 30 मिनट",
    "servings": 4,
    "ingredients": [
      {"item": "ingredient name in Hindi", "quantity": "2", "unit": "कप"}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "detailed step in Hindi", "duration": "5 मिनट"}
    ]
  }
}

Be thorough - if the user gives a vague description, use your knowledge to fill in reasonable ingredients and steps for that dish. Always provide at least 3-5 ingredients and 3-6 steps. The Hindi translation should be natural and idiomatic, not a literal translation.`;

  const result = await retryWithBackoff(() => model.generateContent(prompt));
  const response = result.response.text();
  console.log("[Gemini] parseRecipeFromText raw response:", response);
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  console.log("[Gemini] parseRecipeFromText parsed:", cleaned);
  return JSON.parse(cleaned);
}

export async function generateFoodImagePrompt(
  recipeName: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Generate a short, vivid image description (1-2 sentences) for a professional food photograph of "${recipeName}". The description should be suitable for an AI image generator. Focus on plating, lighting, and appetizing presentation. Return ONLY the description text, nothing else.`;
  const result = await retryWithBackoff(() => model.generateContent(prompt));
  return result.response.text().trim();
}

export async function generateRecipeImage(
  recipeName: string
): Promise<Uint8Array | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  // Try available image generation models in order
  const models = [
    "gemini-2.0-flash-exp-image-generation",
    "gemini-2.5-flash-image",
  ];

  for (const model of models) {
    try {
      console.log(`[Gemini Image] Trying model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [
          {
            parts: [
              {
                text: `Generate a stunning photorealistic image of ${recipeName} as it would be served in a premium 5-star hotel restaurant. The dish should be elegantly plated on fine china or artisan ceramics, with garnishes and microgreens. Shot from a 45-degree angle with soft warm golden lighting, shallow depth of field, on a luxurious marble or dark wood table setting with premium cutlery. Michelin-star presentation, food magazine cover quality.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      };

      const res = await retryWithBackoff(async () => {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        console.log(`[Gemini Image] ${model} response status:`, response.status);
        if (response.status === 429) {
          throw { status: 429, message: "Resource exhausted" };
        }
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Gemini Image] ${model} error body:`, errText);
          throw new Error(`Gemini image API error: ${response.status}`);
        }
        return response.json();
      });

      // Log the full response structure for debugging
      console.log(`[Gemini Image] ${model} response keys:`, JSON.stringify(Object.keys(res)));
      console.log(`[Gemini Image] ${model} candidates count:`, res.candidates?.length);
      if (res.candidates?.[0]) {
        const candidate = res.candidates[0];
        console.log(`[Gemini Image] ${model} candidate finishReason:`, candidate.finishReason);
        const parts = candidate.content?.parts || [];
        console.log(`[Gemini Image] ${model} parts count:`, parts.length);
        parts.forEach((part: any, i: number) => {
          console.log(`[Gemini Image] ${model} part[${i}] keys:`, Object.keys(part));
          if (part.inlineData) {
            console.log(`[Gemini Image] ${model} part[${i}] mimeType:`, part.inlineData.mimeType, "dataLength:", part.inlineData.data?.length);
          }
          if (part.text) {
            console.log(`[Gemini Image] ${model} part[${i}] text:`, part.text.substring(0, 200));
          }
        });

        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            const base64 = part.inlineData.data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            console.log(`[Gemini Image] SUCCESS - Generated image with ${model} for:`, recipeName, "size:", bytes.length);
            return bytes;
          }
        }
      } else {
        console.warn(`[Gemini Image] ${model} no candidates in response:`, JSON.stringify(res).substring(0, 500));
      }
      console.warn(`[Gemini Image] ${model} returned no image data, trying next...`);
    } catch (err) {
      console.warn(`[Gemini Image] ${model} failed:`, err);
    }
  }

  console.error("[Gemini Image] All models failed for:", recipeName);
  return null;
}

// Fallback placeholder image URL when Gemini image generation fails
export function getFallbackImageUrl(recipeName: string): string {
  const encoded = encodeURIComponent(recipeName);
  return `https://placehold.co/800x600/f97316/ffffff?text=${encoded}`;
}

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (targetLanguage === "English") return text;
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else.\n\nText: "${text}"`;
  const result = await retryWithBackoff(() => model.generateContent(prompt));
  return result.response.text().trim();
}

export async function translateRecipe(
  recipe: ParsedRecipe,
  targetLanguage: string
): Promise<ParsedRecipe> {
  if (targetLanguage === "English") return recipe;
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Translate this entire recipe JSON to ${targetLanguage}. Keep the JSON structure exactly the same, only translate the text values. Return ONLY valid JSON, no markdown.

${JSON.stringify(recipe)}`;
  const result = await retryWithBackoff(() => model.generateContent(prompt));
  const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function getFollowAlongScript(
  recipe: RecipeContent,
  language: string
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Create a friendly, conversational cooking follow-along script for this recipe in ${language}. 
Break it into individual spoken instructions (one per array element).
Start with a greeting and overview, then go through each step clearly.
Include timing cues and helpful tips.
End with a completion message.

Recipe: ${JSON.stringify(recipe)}

Return ONLY a JSON array of strings, no markdown. Each string is one spoken instruction.`;

  const result = await retryWithBackoff(() => model.generateContent(prompt));
  const cleaned = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}
