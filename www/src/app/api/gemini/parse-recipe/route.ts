import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

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

export async function POST(req: NextRequest) {
  try {
    const { text, language = "English" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

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
    console.log("[API] parseRecipe raw response:", response);
    
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[API] parseRecipe error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse recipe" },
      { status: 500 }
    );
  }
}
