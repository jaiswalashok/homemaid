const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export interface RecipeVideos {
  en: string | null;
  hi: string | null;
}

export async function searchRecipeVideo(
  recipeName: string,
  language: "en" | "hi" = "en"
): Promise<string | null> {
  const suffix = language === "hi" ? "recipe hindi" : "recipe";
  const query = encodeURIComponent(`${recipeName} ${suffix}`);
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${API_KEY}`
    );
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;
    return videoId ? videoId : null;
  } catch (err) {
    console.error(`[YouTube] Failed to search for "${recipeName}" (${language}):`, err);
    return null;
  }
}

export async function searchRecipeVideos(
  enTitle: string,
  hiTitle: string
): Promise<RecipeVideos> {
  const [en, hi] = await Promise.all([
    searchRecipeVideo(enTitle, "en"),
    searchRecipeVideo(hiTitle, "hi"),
  ]);
  return { en, hi };
}
