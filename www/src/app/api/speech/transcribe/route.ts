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
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = formData.get("language") as string || "English";

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    // Convert audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await retryWithBackoff(async () => {
      return await model.generateContent([
        {
          inlineData: {
            mimeType: audioFile.type || "audio/webm",
            data: base64Audio,
          },
        },
        {
          text: `Transcribe this audio to text in ${language}. Return ONLY the transcribed text, nothing else.`,
        },
      ]);
    });

    const transcription = result.response.text().trim();

    return NextResponse.json({ transcription });
  } catch (err: any) {
    console.error("[API] transcribe error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
