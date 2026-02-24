// Cuisine → Flag emoji + tag mapping
export const CUISINE_FLAGS: Record<string, { flag: string; label: string }> = {
  // Asian
  "indian": { flag: "🇮🇳", label: "Indian" },
  "chinese": { flag: "🇨🇳", label: "Chinese" },
  "japanese": { flag: "🇯🇵", label: "Japanese" },
  "korean": { flag: "🇰🇷", label: "Korean" },
  "thai": { flag: "🇹🇭", label: "Thai" },
  "vietnamese": { flag: "🇻🇳", label: "Vietnamese" },
  "malaysian": { flag: "🇲🇾", label: "Malaysian" },
  "indonesian": { flag: "🇮🇩", label: "Indonesian" },
  "filipino": { flag: "🇵🇭", label: "Filipino" },
  "singaporean": { flag: "🇸🇬", label: "Singaporean" },
  "nepali": { flag: "🇳🇵", label: "Nepali" },
  "sri lankan": { flag: "🇱🇰", label: "Sri Lankan" },
  "bangladeshi": { flag: "🇧🇩", label: "Bangladeshi" },
  "pakistani": { flag: "🇵🇰", label: "Pakistani" },
  // Western
  "american": { flag: "🇺🇸", label: "American" },
  "italian": { flag: "🇮🇹", label: "Italian" },
  "french": { flag: "🇫🇷", label: "French" },
  "spanish": { flag: "🇪🇸", label: "Spanish" },
  "greek": { flag: "🇬🇷", label: "Greek" },
  "british": { flag: "🇬🇧", label: "British" },
  "german": { flag: "🇩🇪", label: "German" },
  "portuguese": { flag: "🇵🇹", label: "Portuguese" },
  "western": { flag: "🌍", label: "Western" },
  "european": { flag: "🇪🇺", label: "European" },
  "continental": { flag: "🇪🇺", label: "Continental" },
  // Americas
  "mexican": { flag: "🇲🇽", label: "Mexican" },
  "brazilian": { flag: "🇧🇷", label: "Brazilian" },
  "peruvian": { flag: "🇵🇪", label: "Peruvian" },
  "argentinian": { flag: "🇦🇷", label: "Argentinian" },
  "caribbean": { flag: "🏝️", label: "Caribbean" },
  // Middle East & Africa
  "turkish": { flag: "🇹🇷", label: "Turkish" },
  "lebanese": { flag: "🇱🇧", label: "Lebanese" },
  "middle eastern": { flag: "🕌", label: "Middle Eastern" },
  "arab": { flag: "🕌", label: "Arab" },
  "moroccan": { flag: "🇲🇦", label: "Moroccan" },
  "ethiopian": { flag: "🇪🇹", label: "Ethiopian" },
  "african": { flag: "🌍", label: "African" },
  // Fusion & Other
  "mediterranean": { flag: "🫒", label: "Mediterranean" },
  "fusion": { flag: "🌐", label: "Fusion" },
  "asian": { flag: "🌏", label: "Asian" },
  "tex-mex": { flag: "🇺🇸", label: "Tex-Mex" },
  "cajun": { flag: "🇺🇸", label: "Cajun" },
};

// Get flag for a cuisine string (fuzzy match)
export function getCuisineFlag(cuisine: string): string {
  if (!cuisine) return "🍽️";
  const lower = cuisine.toLowerCase().trim();
  // Direct match
  if (CUISINE_FLAGS[lower]) return CUISINE_FLAGS[lower].flag;
  // Partial match
  for (const [key, val] of Object.entries(CUISINE_FLAGS)) {
    if (lower.includes(key) || key.includes(lower)) return val.flag;
  }
  return "🍽️";
}

// Get the normalized cuisine tag label
export function getCuisineTag(cuisine: string): string {
  if (!cuisine) return "Other";
  const lower = cuisine.toLowerCase().trim();
  if (CUISINE_FLAGS[lower]) return CUISINE_FLAGS[lower].label;
  for (const [key, val] of Object.entries(CUISINE_FLAGS)) {
    if (lower.includes(key) || key.includes(lower)) return val.label;
  }
  return cuisine; // return original if no match
}

// Default selected cuisine tags
export const DEFAULT_SELECTED_TAGS: string[] = [];

// All known cuisine tags (for the filter bar)
export const ALL_CUISINE_TAGS = [
  "Chinese", "American", "Western", "Indian", "Italian", "Japanese",
  "Korean", "Thai", "Mexican", "French", "Mediterranean", "Middle Eastern",
  "Vietnamese", "Greek", "Turkish", "British", "German", "Spanish",
  "Brazilian", "Ethiopian", "Caribbean", "Fusion",
];
