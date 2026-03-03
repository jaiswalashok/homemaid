import { GoogleGenerativeAI } from "@google/generative-ai";

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 10,
  requestsPerHour: 100,
  windowMs: 60 * 1000, // 1 minute
  hourWindowMs: 60 * 60 * 1000, // 1 hour
};

function checkRateLimit(identifier: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const minuteKey = `${identifier}:minute:${Math.floor(now / RATE_LIMIT.windowMs)}`;
  const hourKey = `${identifier}:hour:${Math.floor(now / RATE_LIMIT.hourWindowMs)}`;

  // Check minute rate limit
  const minuteStats = rateLimitStore.get(minuteKey) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };
  if (minuteStats.count >= RATE_LIMIT.requestsPerMinute) {
    return { allowed: false, error: "Rate limit exceeded: Too many requests per minute" };
  }

  // Check hour rate limit
  const hourStats = rateLimitStore.get(hourKey) || { count: 0, resetTime: now + RATE_LIMIT.hourWindowMs };
  if (hourStats.count >= RATE_LIMIT.requestsPerHour) {
    return { allowed: false, error: "Rate limit exceeded: Too many requests per hour" };
  }

  // Update counters
  minuteStats.count++;
  hourStats.count++;
  rateLimitStore.set(minuteKey, minuteStats);
  rateLimitStore.set(hourKey, hourStats);

  return { allowed: true };
}

// Fallback responses for common recipe patterns
const FALLBACK_RECIPES = {
  default: {
    en: {
      title: "Simple Recipe",
      description: "A delicious homemade dish",
      cuisine: "International",
      prepTime: "15 mins",
      cookTime: "30 mins",
      servings: 4,
      ingredients: [
        { item: "Main ingredient", quantity: "2", unit: "cups" },
        { item: "Salt", quantity: "1", unit: "tsp" },
        { item: "Pepper", quantity: "1", unit: "tsp" },
        { item: "Oil", quantity: "2", unit: "tbsp" },
        { item: "Water", quantity: "1", unit: "cup" }
      ],
      steps: [
        { stepNumber: 1, instruction: "Prepare all ingredients", duration: "5 mins" },
        { stepNumber: 2, instruction: "Heat oil in a pan", duration: "2 mins" },
        { stepNumber: 3, instruction: "Cook main ingredients", duration: "15 mins" },
        { stepNumber: 4, instruction: "Season with salt and pepper", duration: "1 min" },
        { stepNumber: 5, instruction: "Serve hot", duration: "2 mins" }
      ]
    },
    hi: {
      title: "सरल रेसिपी",
      description: "एक स्वादिष्ट घरेलू व्यंजन",
      cuisine: "अंतरराष्ट्रीय",
      prepTime: "15 मिनट",
      cookTime: "30 मिनट",
      servings: 4,
      ingredients: [
        { item: "मुख्य सामग्री", quantity: "2", unit: "कप" },
        { item: "नमक", quantity: "1", unit: "चम्मच" },
        { item: "काली मिर्च", quantity: "1", unit: "चम्मच" },
        { item: "तेल", quantity: "2", unit: "बड़ा चम्मच" },
        { item: "पानी", quantity: "1", unit: "कप" }
      ],
      steps: [
        { stepNumber: 1, instruction: "सभी सामग्री तैयार करें", duration: "5 मिनट" },
        { stepNumber: 2, instruction: "पैन में तेल गर्म करें", duration: "2 मिनट" },
        { stepNumber: 3, instruction: "मुख्य सामग्री पकाएं", duration: "15 मिनट" },
        { stepNumber: 4, instruction: "नमक और काली मिर्च से सीजन करें", duration: "1 मिनट" },
        { stepNumber: 5, instruction: "गर्म परोसें", duration: "2 मिनट" }
      ]
    }
  }
};

class AIService {
  private genAI: GoogleGenerativeAI;
  private fallbackMode = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
  }

  async parseRecipe(text: string, language: string = "English"): Promise<any> {
    const identifier = "recipe-parser";
    const rateLimit = checkRateLimit(identifier);
    
    if (!rateLimit.allowed) {
      console.warn("[AI] Rate limit hit, using fallback recipe");
      return this.getFallbackRecipe(text);
    }

    if (this.fallbackMode) {
      return this.getFallbackRecipe(text);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use more stable model
      
      const prompt = `Parse this recipe description into JSON. Provide both English and Hindi versions.

Input: "${text}"

Return ONLY this JSON format:
{
  "en": {
    "title": "recipe name",
    "description": "brief description", 
    "cuisine": "cuisine type",
    "prepTime": "15 mins",
    "cookTime": "30 mins", 
    "servings": 4,
    "ingredients": [{"item": "name", "quantity": "2", "unit": "cups"}],
    "steps": [{"stepNumber": 1, "instruction": "step", "duration": "5 mins"}]
  },
  "hi": {
    "title": "रेसिपी नाम",
    "description": "संक्षिप्त विवरण",
    "cuisine": "व्यंजन प्रकार", 
    "prepTime": "15 मिनट",
    "cookTime": "30 मिनट",
    "servings": 4,
    "ingredients": [{"item": "नाम", "quantity": "2", "unit": "कप"}],
    "steps": [{"stepNumber": 1, "instruction": "चरण", "duration": "5 मिनट"}]
  }
}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Clean and parse JSON
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      
      return parsed;
    } catch (error: any) {
      console.error("[AI] Gemini API error:", error.message);
      
      // If rate limited, enable fallback mode temporarily
      if (error.message?.includes("429") || error.message?.includes("Resource exhausted")) {
        this.fallbackMode = true;
        setTimeout(() => { this.fallbackMode = false; }, 60000); // Reset after 1 minute
      }
      
      return this.getFallbackRecipe(text);
    }
  }

  private getFallbackRecipe(text: string): any {
    // Try to extract some information from the text for a smarter fallback
    const lowerText = text.toLowerCase();
    let title = "Simple Recipe";
    
    // Basic keyword detection for common dishes
    if (lowerText.includes("curry") || lowerText.includes("सब्जी")) {
      title = "Simple Curry";
    } else if (lowerText.includes("rice") || lowerText.includes("चावल")) {
      title = "Rice Dish";
    } else if (lowerText.includes("dal") || lowerText.includes("दाल")) {
      title = "Dal Recipe";
    } else if (lowerText.includes("chicken") || lowerText.includes("मुर्गा")) {
      title = "Chicken Dish";
    } else if (lowerText.includes("vegetable") || lowerText.includes("सब्जी")) {
      title = "Vegetable Dish";
    }

    const fallback = JSON.parse(JSON.stringify(FALLBACK_RECIPES.default));
    fallback.en.title = title;
    fallback.hi.title = this.getHindiTitle(title);
    
    return fallback;
  }

  private getHindiTitle(englishTitle: string): string {
    const translations: { [key: string]: string } = {
      "Simple Recipe": "सरल रेसिपी",
      "Simple Curry": "सरल करी",
      "Rice Dish": "चावल का व्यंजन",
      "Dal Recipe": "दाल की रेसिपी",
      "Chicken Dish": "चिकन डिश",
      "Vegetable Dish": "सब्जी का व्यंजन"
    };
    
    return translations[englishTitle] || "सरल रेसिपी";
  }

  async formatGrocery(text: string): Promise<any> {
    const identifier = "grocery-formatter";
    const rateLimit = checkRateLimit(identifier);
    
    if (!rateLimit.allowed) {
      console.warn("[AI] Rate limit hit for grocery, using fallback");
      return this.getFallbackGrocery(text);
    }

    if (this.fallbackMode) {
      return this.getFallbackGrocery(text);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Parse this grocery list into items with emojis.

Input: "${text}"

Return ONLY this JSON format:
{
  "items": ["🥛 2L Milk", "🍞 1 Loaf Bread", "🥚 1 Dozen Eggs"]
}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      
      return parsed;
    } catch (error: any) {
      console.error("[AI] Gemini grocery error:", error.message);
      
      if (error.message?.includes("429") || error.message?.includes("Resource exhausted")) {
        this.fallbackMode = true;
        setTimeout(() => { this.fallbackMode = false; }, 60000);
      }
      
      return this.getFallbackGrocery(text);
    }
  }

  private getFallbackGrocery(text: string): any {
    // Simple fallback - split by common separators and add basic emojis
    const items = text.split(/[,;]/).map(item => item.trim()).filter(item => item);
    const emojiItems = items.map(item => {
      if (item.toLowerCase().includes("milk")) return `🥛 ${item}`;
      if (item.toLowerCase().includes("bread")) return `🍞 ${item}`;
      if (item.toLowerCase().includes("egg")) return `🥚 ${item}`;
      if (item.toLowerCase().includes("tomato")) return `🍅 ${item}`;
      if (item.toLowerCase().includes("onion")) return `🧅 ${item}`;
      if (item.toLowerCase().includes("potato")) return `🥔 ${item}`;
      if (item.toLowerCase().includes("apple")) return `🍎 ${item}`;
      if (item.toLowerCase().includes("banana")) return `🍌 ${item}`;
      return `🛒 ${item}`;
    });
    
    return { items: emojiItems };
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    // Simple translation fallback
    return text;
  }
}

export const aiService = new AIService();
