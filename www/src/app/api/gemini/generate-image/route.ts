import { NextRequest, NextResponse } from "next/server";

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
    const { recipeName } = await req.json();

    if (!recipeName || typeof recipeName !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'recipeName' parameter" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const models = [
      "gemini-2.0-flash-exp-image-generation",
      "gemini-2.5-flash-image",
    ];

    for (const model of models) {
      try {
        console.log(`[API] Trying image model: ${model}`);
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
          console.log(`[API] ${model} response status:`, response.status);
          if (response.status === 429) {
            throw { status: 429, message: "Resource exhausted" };
          }
          if (!response.ok) {
            const errText = await response.text();
            console.error(`[API] ${model} error:`, errText);
            throw new Error(`Gemini image API error: ${response.status}`);
          }
          return response.json();
        });

        console.log(`[API] ${model} response keys:`, Object.keys(res));
        if (res.candidates?.[0]) {
          const parts = res.candidates[0].content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              const base64 = part.inlineData.data;
              console.log(`[API] SUCCESS - Generated image with ${model}, size:`, base64.length);
              
              // Return base64 directly
              return NextResponse.json({
                success: true,
                imageBase64: base64,
                mimeType: part.inlineData.mimeType,
              });
            }
          }
        }
        console.warn(`[API] ${model} returned no image, trying next...`);
      } catch (err) {
        console.warn(`[API] ${model} failed:`, err);
      }
    }

    console.error("[API] All image models failed for:", recipeName);
    return NextResponse.json(
      { error: "Failed to generate image with all available models" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[API] generateImage error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
