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
    const { text, targetLanguage } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    if (!targetLanguage || typeof targetLanguage !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'targetLanguage' parameter" },
        { status: 400 }
      );
    }

    if (targetLanguage === "English") {
      return NextResponse.json({ translatedText: text });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else.\n\nText: "${text}"`;
    
    const result = await retryWithBackoff(() => model.generateContent(prompt));
    const translatedText = result.response.text().trim();

    return NextResponse.json({ translatedText });
  } catch (err: any) {
    console.error("[API] translate error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to translate text" },
      { status: 500 }
    );
  }
}
