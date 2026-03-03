import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiService } from "./ai-service";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

// Detect intent from a user message (text or voice transcription)
export type CommandIntent =
  | "add_task"
  | "add_grocery"
  | "add_expense"
  | "add_recipe"
  | "scan_receipt"
  | "unknown";

export interface ParsedCommand {
  intent: CommandIntent;
  data: any;
  rawText: string;
}

export async function parseUserCommand(text: string): Promise<ParsedCommand> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are an AI assistant for a household management app. Classify the user's message into one of these intents and extract structured data.

Intents:
- "add_task": User wants to add a task/chore (e.g. "pick up kids from school", "clean the garage")
- "add_grocery": User wants to add grocery items (e.g. "buy milk and eggs", "need tomatoes and bread")
- "add_expense": User wants to log an expense manually (e.g. "spent $50 at walmart on groceries")
- "add_recipe": User wants to find/add a recipe (e.g. "make butter chicken", "recipe for pasta")
- "unknown": Can't determine intent

User message: "${text}"

Return ONLY valid JSON (no markdown):
{
  "intent": "add_task|add_grocery|add_expense|add_recipe|unknown",
  "items": ["item1", "item2"],
  "expense": { "vendor": "", "amount": 0, "type": "", "items": [{"name": "", "price": 0}] }
}

For add_task: items = array of task descriptions
For add_grocery: items = array of grocery items with emoji (e.g. "🥛 Milk", "🥚 Eggs")
For add_expense: fill expense object
For add_recipe: items = array of recipe names
For unknown: items = []`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      intent: parsed.intent || "unknown",
      data: parsed,
      rawText: text,
    };
  } catch (err) {
    console.error("[Gemini Commands] Failed to parse:", err);
    return { intent: "unknown", data: {}, rawText: text };
  }
}

// Parse receipt image using Gemini Vision
export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Analyze this receipt image and extract the following information into a JSON structure.

Return ONLY valid JSON (no markdown):
{
  "vendor": "abbreviated store name",
  "vendorFullName": "full store name",
  "type": "Grocery|Restaurant|Shopping|Transport|Entertainment|Utilities|Healthcare|Other",
  "amount": 0.00,
  "emoji": "relevant emoji for the type",
  "discount": 0.00,
  "displayDate": "e.g. 27th Mar",
  "date": "YYYY-MM-DD",
  "address": "store address if visible",
  "paymentMethod": "Cash|Card|etc",
  "items": [
    {"name": "item name with emoji", "price": 0.00}
  ]
}

If you can't read something, make your best guess. Always return valid JSON.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);
    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[Gemini Receipt] Failed to parse receipt:", err);
    return null;
  }
}

// Format grocery items with emoji using Gemini
export async function formatGroceryItems(text: string): Promise<string[]> {
  try {
    // Use AI service for rate limiting and fallbacks
    const result = await aiService.formatGrocery(text);
    return result.items || [text];
  } catch (err) {
    console.error("[Gemini Grocery] Failed to format:", err);
    // Simple fallback - split by common separators and add basic emojis
    const items = text.split(/[,;]/).map(item => item.trim()).filter(item => item);
    return items.map(item => {
      if (item.toLowerCase().includes("milk")) return `🥛 ${item}`;
      if (item.toLowerCase().includes("bread")) return `🍞 ${item}`;
      if (item.toLowerCase().includes("egg")) return `🥚 ${item}`;
      if (item.toLowerCase().includes("tomato")) return `🍅 ${item}`;
      if (item.toLowerCase().includes("onion")) return `🧅 ${item}`;
      return `🛒 ${item}`;
    });
  }
}

// Format tasks with emoji using Gemini
export async function formatTaskItems(text: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are a helpful home assistant. The user wants to add tasks/chores. Parse their message and return each task as a separate entry with relevant emojis.

User message: "${text}"

Return ONLY a JSON array of strings, each task with emojis.
Example: ["🧒 Pick up kids from school 🚌", "🚗 Get car from garage 🔧"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[Gemini Tasks] Failed to format:", err);
    return [text];
  }
}
