import { NextRequest, NextResponse } from "next/server";
import { parseReceiptImage } from "@/lib/gemini-commands";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType = "image/jpeg" } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'image' parameter (base64 string expected)" },
        { status: 400 }
      );
    }

    const parsed = await parseReceiptImage(image, mimeType);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse receipt image" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[API] parseReceipt error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse receipt" },
      { status: 500 }
    );
  }
}
