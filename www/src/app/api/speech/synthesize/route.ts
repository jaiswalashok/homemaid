import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, language = "English" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' parameter" },
        { status: 400 }
      );
    }

    // Use Google Cloud Text-to-Speech API
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const languageCode = language === "Hindi" ? "hi-IN" : "en-US";
    const voiceName = language === "Hindi" ? "hi-IN-Wavenet-A" : "en-US-Wavenet-D";

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API] TTS error:", errorText);
      throw new Error(`Text-to-speech API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error("No audio content in response");
    }

    // Return base64 audio
    return NextResponse.json({
      audioBase64: data.audioContent,
      mimeType: "audio/mp3",
    });
  } catch (err: any) {
    console.error("[API] synthesize error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}
