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
    const { recipe, language = "English" } = await req.json();

    if (!recipe || typeof recipe !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid 'recipe' parameter" },
        { status: 400 }
      );
    }

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
    const script = JSON.parse(cleaned);

    return NextResponse.json({ script });
  } catch (err: any) {
    console.error("[API] followAlong error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate follow-along script" },
      { status: 500 }
    );
  }
}
