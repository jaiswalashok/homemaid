import { NextRequest, NextResponse } from "next/server";
import { formatGroceryItems } from "@/lib/gemini-commands";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    const items = await formatGroceryItems(text);

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("[API] formatGrocery error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to format grocery items" },
      { status: 500 }
    );
  }
}
