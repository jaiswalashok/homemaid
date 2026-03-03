import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const { text, language = "English" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    console.log("[API] parseRecipe request:", { text: text.substring(0, 100), language });
    
    const result = await aiService.parseRecipe(text, language);
    console.log("[API] parseRecipe success:", { title: result.en?.title, fallbackMode: result.isFallback });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API] parseRecipe error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse recipe" },
      { status: 500 }
    );
  }
}
