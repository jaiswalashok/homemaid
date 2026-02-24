import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Firebase Admin (server-side) ---
// We use the client-side Firebase config for admin since we don't have a service account
// For the webhook, we'll use the REST API approach with Gemini
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- Telegram helpers ---
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const data = await res.json();
    if (data.ok) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
    }
  } catch (err) {
    console.error("[Telegram] getFile failed:", err);
  }
  return null;
}

async function downloadFileAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// --- Firestore REST API (server-side, using Firebase client API key) ---
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const FIREBASE_EMAIL = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL || "";
const FIREBASE_PASSWORD = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD || "";

let cachedIdToken: string | null = null;
let tokenExpiry = 0;

async function getFirebaseIdToken(): Promise<string> {
  if (cachedIdToken && Date.now() < tokenExpiry) return cachedIdToken;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: FIREBASE_EMAIL,
        password: FIREBASE_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (data.idToken) {
    cachedIdToken = data.idToken;
    tokenExpiry = Date.now() + 3500 * 1000; // ~1hr
    return data.idToken;
  }
  throw new Error("Firebase auth failed: " + JSON.stringify(data));
}

async function firestoreAdd(collectionName: string, docData: any) {
  const token = await getFirebaseIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}`;

  // Convert to Firestore document format
  const fields: any = {};
  for (const [key, value] of Object.entries(docData)) {
    if (typeof value === "string") fields[key] = { stringValue: value };
    else if (typeof value === "number") fields[key] = { doubleValue: value };
    else if (typeof value === "boolean") fields[key] = { booleanValue: value };
    else if (value === null) fields[key] = { nullValue: null };
    else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) => {
            if (typeof v === "string") return { stringValue: v };
            if (typeof v === "number") return { doubleValue: v };
            if (typeof v === "object" && v !== null) {
              const mapFields: any = {};
              for (const [mk, mv] of Object.entries(v)) {
                if (typeof mv === "string") mapFields[mk] = { stringValue: mv };
                else if (typeof mv === "number") mapFields[mk] = { doubleValue: mv };
              }
              return { mapValue: { fields: mapFields } };
            }
            return { stringValue: String(v) };
          }),
        },
      };
    } else if (typeof value === "object") {
      const mapFields: any = {};
      for (const [mk, mv] of Object.entries(value as any)) {
        if (typeof mv === "string") mapFields[mk] = { stringValue: mv };
        else if (typeof mv === "number") mapFields[mk] = { doubleValue: mv };
        else if (typeof mv === "boolean") mapFields[mk] = { booleanValue: mv };
      }
      fields[key] = { mapValue: { fields: mapFields } };
    }
  }

  // Add timestamp
  fields.createdAt = { timestampValue: new Date().toISOString() };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
  });

  const result = await res.json();
  if (result.error) {
    console.error("[Firestore] Add failed:", result.error);
    throw new Error(result.error.message);
  }
  return result;
}

// --- Firestore REST API: List documents ---
async function firestoreList(collectionName: string, limit = 20): Promise<any[]> {
  const token = await getFirebaseIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc: any) => {
    const fields = doc.fields || {};
    const parsed: any = { _id: doc.name.split("/").pop() };
    for (const [key, val] of Object.entries(fields) as any) {
      if (val.stringValue !== undefined) parsed[key] = val.stringValue;
      else if (val.doubleValue !== undefined) parsed[key] = val.doubleValue;
      else if (val.integerValue !== undefined) parsed[key] = Number(val.integerValue);
      else if (val.booleanValue !== undefined) parsed[key] = val.booleanValue;
      else if (val.timestampValue !== undefined) parsed[key] = val.timestampValue;
      else if (val.mapValue?.fields) {
        const map: any = {};
        for (const [mk, mv] of Object.entries(val.mapValue.fields) as any) {
          if (mv.stringValue !== undefined) map[mk] = mv.stringValue;
          else if (mv.doubleValue !== undefined) map[mk] = mv.doubleValue;
          else if (mv.integerValue !== undefined) map[mk] = Number(mv.integerValue);
        }
        parsed[key] = map;
      } else if (val.arrayValue?.values) {
        parsed[key] = val.arrayValue.values.map((v: any) => {
          if (v.stringValue !== undefined) return v.stringValue;
          if (v.mapValue?.fields) {
            const m: any = {};
            for (const [mk, mv] of Object.entries(v.mapValue.fields) as any) {
              if (mv.stringValue !== undefined) m[mk] = mv.stringValue;
              else if (mv.doubleValue !== undefined) m[mk] = mv.doubleValue;
            }
            return m;
          }
          return v;
        });
      }
    }
    return parsed;
  });
}

// --- Gemini helpers ---
async function classifyMessage(text: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Classify this household message and extract data. Return ONLY valid JSON.

Message: "${text}"

{
  "intent": "add_task|add_grocery|add_expense|add_recipe|chat|unknown",
  "items": ["formatted item with emoji"],
  "expense": {"vendor":"","amount":0,"type":"","emoji":"","displayDate":"","date":"","paymentMethod":"","items":[{"name":"","price":0}]},
  "reply": "a friendly response to send back to the user"
}

IMPORTANT: If the message is a food/dish name (like "Butter Chicken", "Rajma Chawal", "Pasta Carbonara", "Biryani", etc.), classify as "add_recipe" and put the dish name in items.

For tasks: items = ["🧒 Pick up kids 🚌"]
For grocery: items = ["🥛 2L Milk", "🥚 Eggs"]
For expense: fill expense + reply
For recipe: items = ["Butter Chicken"] (just the dish name, no emoji)
For chat: reply with helpful answer`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function parseReceiptFromImage(base64: string, mimeType: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Analyze this receipt image. Return ONLY valid JSON:
{
  "vendor": "store name abbreviated",
  "vendorFullName": "full name",
  "type": "Grocery|Restaurant|Shopping|Other",
  "amount": 0.00,
  "emoji": "🛒",
  "discount": 0,
  "displayDate": "27th Mar",
  "date": "2024-03-27",
  "address": "",
  "paymentMethod": "Cash",
  "items": [{"name": "item 🏷️", "price": 0.00}]
}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64 } },
  ]);
  const response = result.response.text();
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function transcribeVoice(base64: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent([
    "Transcribe this audio message. Return ONLY the transcribed text, nothing else.",
    { inlineData: { mimeType: "audio/ogg", data: base64 } },
  ]);
  return result.response.text().trim();
}

// --- Gemini recipe generation ---
async function generateRecipe(name: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Generate a detailed recipe for "${name}". Return ONLY valid JSON:
{
  "en": {
    "title": "Recipe Title",
    "description": "Short description",
    "cuisine": "Indian/Italian/etc",
    "prepTime": "15 min",
    "cookTime": "30 min",
    "servings": 4,
    "ingredients": [{"item": "Chicken", "quantity": "500", "unit": "g"}],
    "steps": [{"stepNumber": 1, "instruction": "Step description", "duration": "5 min"}]
  },
  "hi": {
    "title": "Hindi title",
    "description": "Hindi description",
    "cuisine": "Hindi cuisine name",
    "prepTime": "15 मिनट",
    "cookTime": "30 मिनट",
    "servings": 4,
    "ingredients": [{"item": "चिकन", "quantity": "500", "unit": "ग्राम"}],
    "steps": [{"stepNumber": 1, "instruction": "Hindi step", "duration": "5 मिनट"}]
  }
}`;
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// --- Gemini image understanding ---
async function understandImage(base64: string, mimeType: string, caption?: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Analyze this image. Determine what it is and return ONLY valid JSON:
{
  "type": "receipt|food|grocery_list|other",
  "description": "brief description of the image",
  "receipt": { only if type=receipt: "vendor":"","vendorFullName":"","type":"Grocery","amount":0,"emoji":"🛒","discount":0,"displayDate":"","date":"YYYY-MM-DD","address":"","paymentMethod":"Cash","items":[{"name":"","price":0}] },
  "food": { only if type=food: "name":"dish name","cuisine":"" },
  "groceryItems": [ only if type=grocery_list: "🥛 Milk", "🍞 Bread" ]
}
${caption ? `User caption: "${caption}"` : ""}`;
  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64 } },
  ]);
  const response = result.response.text();
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// --- Keyboards ---
const MAIN_MENU = {
  inline_keyboard: [
    [
      { text: "🍽️ Recipes", callback_data: "menu:recipes" },
      { text: "📝 Tasks", callback_data: "menu:tasks" },
    ],
    [
      { text: "🧾 Expenses", callback_data: "menu:expenses" },
      { text: "🛒 Groceries", callback_data: "menu:groceries" },
    ],
    [
      { text: "📸 Scan Receipt", callback_data: "menu:scan" },
      { text: "💬 Chat", callback_data: "menu:chat" },
    ],
    [
      { text: "❓ Help", callback_data: "menu:help" },
    ],
  ],
};

// Cuisine flag helper (server-side version)
const CUISINE_FLAG_MAP: Record<string, string> = {
  indian: "🇮🇳", chinese: "🇨🇳", japanese: "🇯🇵", korean: "🇰🇷", thai: "🇹🇭",
  vietnamese: "🇻🇳", italian: "🇮🇹", french: "🇫🇷", american: "🇺🇸", mexican: "🇲🇽",
  spanish: "🇪🇸", greek: "🇬🇷", british: "🇬🇧", german: "🇩🇪", turkish: "🇹🇷",
  lebanese: "🇱🇧", moroccan: "🇲🇦", ethiopian: "🇪🇹", brazilian: "🇧🇷",
  western: "🌍", mediterranean: "🫒", asian: "🌏", "middle eastern": "🕌",
  continental: "🇪🇺", european: "🇪🇺", fusion: "🌐",
};
function getCuisineFlagServer(cuisine: string): string {
  if (!cuisine) return "🍽️";
  const lower = cuisine.toLowerCase().trim();
  if (CUISINE_FLAG_MAP[lower]) return CUISINE_FLAG_MAP[lower];
  for (const [key, flag] of Object.entries(CUISINE_FLAG_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return flag;
  }
  return "🍽️";
}

const RECIPES_MENU = {
  inline_keyboard: [
    [{ text: "🍳 Generate a Recipe", callback_data: "action:recipe_prompt" }],
    [{ text: "🔙 Main Menu", callback_data: "action:main" }],
  ],
};

const TASKS_MENU = {
  inline_keyboard: [
    [{ text: "➕ Add Tasks", callback_data: "action:task_prompt" }],
    [{ text: "🔙 Main Menu", callback_data: "action:main" }],
  ],
};

const EXPENSES_MENU = {
  inline_keyboard: [
    [{ text: "📸 Scan Receipt Photo", callback_data: "action:expense_scan" }],
    [{ text: "✍️ Log Expense Manually", callback_data: "action:expense_prompt" }],
    [{ text: "🔙 Main Menu", callback_data: "action:main" }],
  ],
};

const GROCERIES_MENU = {
  inline_keyboard: [
    [{ text: "➕ Add Grocery Items", callback_data: "action:grocery_prompt" }],
    [{ text: "🔙 Main Menu", callback_data: "action:main" }],
  ],
};

// --- Webhook handler ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Telegram Webhook] Received:", JSON.stringify(body).substring(0, 500));

    // Handle callback queries (button presses)
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;
      const firstName = cb.from.first_name || "Friend";
      await answerCallbackQuery(cb.id);

      // Main menu buttons — fetch existing items and show them
      if (data === "menu:recipes") {
        try {
          const recipes = await firestoreList("recipes", 20);
          if (recipes.length > 0) {
            let list = "<b>📖 Your Recipes:</b>\n\n";
            list += recipes.map((r: any, i: number) => {
              const title = r.en?.title || r.title || "Untitled";
              const cuisine = r.en?.cuisine || "";
              const flag = getCuisineFlagServer(cuisine);
              return `${flag} <b>${i + 1}.</b> ${title}${cuisine ? ` <i>(${cuisine})</i>` : ""}`;
            }).join("\n");
            // Build inline keyboard with recipe buttons (2 per row)
            const recipeButtons: any[][] = [];
            for (let i = 0; i < recipes.length; i += 2) {
              const row: any[] = [];
              const r1 = recipes[i];
              const t1 = r1.en?.title || r1.title || "Untitled";
              row.push({ text: `${i + 1}. ${t1.substring(0, 25)}`, callback_data: `recipe:${r1._id}` });
              if (i + 1 < recipes.length) {
                const r2 = recipes[i + 1];
                const t2 = r2.en?.title || r2.title || "Untitled";
                row.push({ text: `${i + 2}. ${t2.substring(0, 25)}`, callback_data: `recipe:${r2._id}` });
              }
              recipeButtons.push(row);
            }
            recipeButtons.push([{ text: "🍳 Generate a Recipe", callback_data: "action:recipe_prompt" }]);
            recipeButtons.push([{ text: "🔙 Main Menu", callback_data: "action:main" }]);
            await sendMessage(chatId, `🍽️ <b>Recipes</b>\n\n${list}\n\n👆 Tap a recipe to see details`, { inline_keyboard: recipeButtons });
          } else {
            await sendMessage(chatId, `🍽️ <b>Recipes</b>\n\n📭 No recipes yet. Let me generate one for you!`, RECIPES_MENU);
          }
        } catch (err) {
          console.error("[Telegram] Recipe list error:", err);
          await sendMessage(chatId, `🍽️ <b>Recipes</b>\n\nSend me a recipe name to generate!`, RECIPES_MENU);
        }
      } else if (data.startsWith("recipe:")) {
        // Show individual recipe detail
        const recipeId = data.slice(7);
        try {
          const recipes = await firestoreList("recipes", 30);
          const recipe = recipes.find((r: any) => r._id === recipeId);
          if (recipe) {
            const en = recipe.en || {};
            const flag = getCuisineFlagServer(en.cuisine || "");
            const ingredientsList = en.ingredients?.map((i: any) => `  • ${i.quantity} ${i.unit} ${i.item}`).join("\n") || "No ingredients listed";
            const stepsList = en.steps?.map((s: any) => `  ${s.stepNumber}. ${s.instruction}${s.duration ? ` (${s.duration})` : ""}`).join("\n") || "No steps listed";
            const msg =
              `${flag} <b>${en.title || "Untitled"}</b>\n\n` +
              `${en.description || ""}\n\n` +
              `🍽️ ${en.cuisine || "Unknown"} • ⏱️ ${en.prepTime || "?"} prep + ${en.cookTime || "?"} cook • 👥 ${en.servings || "?"} servings\n\n` +
              `<b>📋 Ingredients:</b>\n${ingredientsList}\n\n` +
              `<b>👨‍🍳 Steps:</b>\n${stepsList}`;
            await sendMessage(chatId, msg, {
              inline_keyboard: [
                [{ text: "🚨 Cook Now (Urgent Task)", callback_data: `cooknow:${recipeId}` }],
                [{ text: "🛒 Add Ingredients to Grocery", callback_data: `grocery_all:${recipeId}` }],
                [{ text: "🍽️ Back to Recipes", callback_data: "menu:recipes" }],
                [{ text: "🔙 Main Menu", callback_data: "action:main" }],
              ],
            });
          } else {
            await sendMessage(chatId, `❌ Recipe not found.`, RECIPES_MENU);
          }
        } catch (err) {
          console.error("[Telegram] Recipe detail error:", err);
          await sendMessage(chatId, `❌ Failed to load recipe details.`, RECIPES_MENU);
        }
      } else if (data.startsWith("cooknow:")) {
        // Add recipe as urgent cooking task
        const recipeId = data.slice(8);
        try {
          const recipes = await firestoreList("recipes", 30);
          const recipe = recipes.find((r: any) => r._id === recipeId);
          if (recipe) {
            const en = recipe.en || {};
            const flag = getCuisineFlagServer(en.cuisine || "");
            const title = `🍳 Cook: ${en.title || "Recipe"}`;
            const totalTime = `${en.prepTime || "?"} prep + ${en.cookTime || "?"} cook`;
            await firestoreAdd("tasks", {
              title: `${title} | ${totalTime}`,
              status: "pending",
              isUrgent: true,
              isDaily: false,
              date: new Date().toISOString().split("T")[0],
              order: 0,
              elapsedMs: 0,
              source: "telegram",
            });
            await sendMessage(
              chatId,
              `🚨 <b>Urgent Task Added!</b>\n\n${flag} <b>${en.title}</b>\n⏱️ ${totalTime}\n\nThis will appear at the top of your tasks list with a beep alert! 🔔`,
              { inline_keyboard: [
                [{ text: "🍽️ Back to Recipes", callback_data: "menu:recipes" }],
                [{ text: "📝 View Tasks", callback_data: "menu:tasks" }],
                [{ text: "🔙 Main Menu", callback_data: "action:main" }],
              ]}
            );
          } else {
            await sendMessage(chatId, `❌ Recipe not found.`, RECIPES_MENU);
          }
        } catch (err) {
          console.error("[Telegram] Cook now error:", err);
          await sendMessage(chatId, `❌ Failed to add cooking task.`, MAIN_MENU);
        }
      } else if (data.startsWith("grocery_all:")) {
        // Add all recipe ingredients to grocery list
        const recipeId = data.slice(12);
        try {
          const recipes = await firestoreList("recipes", 30);
          const recipe = recipes.find((r: any) => r._id === recipeId);
          if (recipe && recipe.en?.ingredients?.length > 0) {
            const en = recipe.en;
            let count = 0;
            for (const ing of en.ingredients) {
              await firestoreAdd("groceries", {
                name: `${ing.quantity || ""} ${ing.unit || ""} ${ing.item || ""}`.trim(),
                quantity: ing.quantity || "",
                emoji: "",
                purchased: false,
                source: "telegram",
              });
              count++;
            }
            await sendMessage(
              chatId,
              `🛒 <b>Added ${count} ingredients to grocery list!</b>\n\nFrom: ${getCuisineFlagServer(en.cuisine || "")} ${en.title}\n\n${en.ingredients.map((i: any) => `• ${i.quantity} ${i.unit} ${i.item}`).join("\n")}`,
              { inline_keyboard: [
                [{ text: "🛒 View Grocery List", callback_data: "menu:groceries" }],
                [{ text: "🍽️ Back to Recipes", callback_data: "menu:recipes" }],
                [{ text: "🔙 Main Menu", callback_data: "action:main" }],
              ]}
            );
          } else {
            await sendMessage(chatId, `❌ No ingredients found for this recipe.`, RECIPES_MENU);
          }
        } catch (err) {
          console.error("[Telegram] Grocery all error:", err);
          await sendMessage(chatId, `❌ Failed to add ingredients.`, MAIN_MENU);
        }
      } else if (data === "menu:tasks") {
        try {
          const today = new Date().toISOString().split("T")[0];
          const allTasks = await firestoreList("tasks", 30);
          const todayTasks = allTasks.filter((t: any) => t.date === today);
          let list = "";
          if (todayTasks.length > 0) {
            const pending = todayTasks.filter((t: any) => t.status !== "completed");
            const done = todayTasks.filter((t: any) => t.status === "completed");
            if (pending.length > 0) {
              list += "\n\n<b>⏳ Pending:</b>\n" + pending.map((t: any) => `${t.isUrgent ? "🚨" : "⬜"} ${t.title}`).join("\n");
            }
            if (done.length > 0) {
              list += "\n\n<b>✅ Done:</b>\n" + done.map((t: any) => `✅ ${t.title}`).join("\n");
            }
            list += `\n\n📊 ${done.length}/${todayTasks.length} completed`;
          } else {
            list = "\n\n📭 No tasks for today.";
          }
          await sendMessage(chatId, `📝 <b>Today's Tasks</b>${list}`, TASKS_MENU);
        } catch { await sendMessage(chatId, `📝 <b>Tasks</b>\n\nSend me tasks to add!`, TASKS_MENU); }
      } else if (data === "menu:groceries") {
        try {
          const groceries = await firestoreList("groceries", 30);
          let list = "";
          if (groceries.length > 0) {
            const toBuy = groceries.filter((g: any) => !g.purchased);
            const bought = groceries.filter((g: any) => g.purchased);
            if (toBuy.length > 0) {
              list += "\n\n<b>🛒 To Buy:</b>\n" + toBuy.map((g: any) => `⬜ ${g.name}`).join("\n");
            }
            if (bought.length > 0) {
              list += "\n\n<b>✅ Purchased:</b>\n" + bought.map((g: any) => `☑️ <s>${g.name}</s>`).join("\n");
            }
          } else {
            list = "\n\n📭 Grocery list is empty.";
          }
          await sendMessage(chatId, `🛒 <b>Grocery List</b>${list}`, GROCERIES_MENU);
        } catch { await sendMessage(chatId, `🛒 <b>Grocery List</b>\n\nTell me what to buy!`, GROCERIES_MENU); }
      } else if (data === "menu:expenses") {
        try {
          const expenses = await firestoreList("expenses", 10);
          let list = "";
          if (expenses.length > 0) {
            const total = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            list = "\n\n<b>💳 Recent Expenses:</b>\n" + expenses.slice(0, 8).map((e: any) => {
              return `${e.emoji || "💰"} ${e.vendor || "Unknown"} — $${e.amount || 0}${e.displayDate ? ` (${e.displayDate})` : ""}`;
            }).join("\n");
            list += `\n\n💰 <b>Total: $${total.toFixed(2)}</b>`;
          } else {
            list = "\n\n📭 No expenses logged yet.";
          }
          await sendMessage(chatId, `🧾 <b>Expenses</b>${list}`, EXPENSES_MENU);
        } catch { await sendMessage(chatId, `🧾 <b>Expenses</b>\n\nTrack your spending!`, EXPENSES_MENU); }
      } else if (data === "menu:scan") {
        await sendMessage(chatId, `📸 <b>Scan Receipt</b>\n\n${firstName}, send me a photo of your receipt and I'll:\n\n• Extract the store name\n• List all items & prices\n• Log the total expense\n\nJust snap a photo and send it! 📷`);
      } else if (data === "menu:chat") {
        await sendMessage(chatId, `💬 <b>Chat</b>\n\n${firstName}, ask me anything! I can help with:\n\n• Cooking tips 🍳\n• Household advice 🏠\n• Shopping suggestions 🛍️\n• General questions ❓\n\nJust type your question!`);
      } else if (data === "menu:help") {
        await sendMessage(
          chatId,
          `❓ <b>Annapurna Bot Help</b>\n\n` +
          `<b>🔤 Commands:</b>\n` +
          `/start - Main menu\n` +
          `/task <text> - Add tasks\n` +
          `/grocery <items> - Add grocery items\n` +
          `/expense <details> - Log expense\n` +
          `/recipe <name> - Generate a recipe\n\n` +
          `<b>📸 Photos:</b>\n` +
          `Send a receipt photo → auto-logs expense\n` +
          `Send a food photo → identifies the dish\n` +
          `Send a grocery list photo → adds items\n\n` +
          `<b>🎙️ Voice:</b>\n` +
          `Send a voice message for any command\n\n` +
          `<b>✍️ Natural Text:</b>\n` +
          `Just type naturally and I'll understand!\n` +
          `e.g. "buy milk and eggs" → adds to grocery`,
          MAIN_MENU
        );
      // Action buttons (sub-menus)
      } else if (data === "action:main") {
        await sendMessage(chatId, `🏁 ${firstName}, how can I help? 👇`, MAIN_MENU);
      } else if (data === "action:recipe_prompt") {
        await sendMessage(chatId, `🍳 ${firstName}, type the name of a dish and I'll generate a full recipe!\n\nExample: "butter chicken" or "pasta carbonara"`);
      } else if (data === "action:task_prompt") {
        await sendMessage(chatId, `📝 ${firstName}, type your tasks (comma-separated for multiple):\n\nExample: "pick up kids, clean kitchen, buy groceries"`);
      } else if (data === "action:expense_scan") {
        await sendMessage(chatId, `📸 ${firstName}, send me a photo of your receipt now!`);
      } else if (data === "action:expense_prompt") {
        await sendMessage(chatId, `✍️ ${firstName}, type your expense:\n\nExample: "spent $45 at restaurant for dinner"`);
      } else if (data === "action:grocery_prompt") {
        await sendMessage(chatId, `🛒 ${firstName}, type the items to add:\n\nExample: "milk, eggs, 2kg rice, bread"`);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle messages
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const firstName = message.from?.first_name || "Friend";
    const text = message.text || "";

    // Handle /start command
    if (text === "/start") {
      await sendMessage(
        chatId,
        `🏁 Hey ${firstName}! How can I help you? 👇`,
        MAIN_MENU
      );
      return NextResponse.json({ ok: true });
    }

    // Handle slash commands
    if (text.startsWith("/task ")) {
      const taskText = text.slice(6).trim();
      const classified = await classifyMessage(taskText);
      const items = classified.items || [taskText];
      for (const item of items) {
        await firestoreAdd("tasks", {
          title: item,
          status: "pending",
          isUrgent: true,
          isDaily: false,
          date: new Date().toISOString().split("T")[0],
          order: 0,
          elapsedMs: 0,
          source: "telegram",
        });
      }
      await sendMessage(chatId, `🚨 Added ${items.length} URGENT task(s):\n${items.map((i: string) => `• ${i}`).join("\n")}`, MAIN_MENU);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/grocery ")) {
      const groceryText = text.slice(9).trim();
      const classified = await classifyMessage(groceryText);
      const items = classified.items || [groceryText];
      for (const item of items) {
        await firestoreAdd("groceries", {
          name: item,
          quantity: "",
          emoji: "",
          purchased: false,
          source: "telegram",
        });
      }
      await sendMessage(chatId, `🛒 Added ${items.length} item(s) to grocery list:\n${items.map((i: string) => `• ${i}`).join("\n")}`, MAIN_MENU);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/expense ")) {
      const expenseText = text.slice(9).trim();
      const classified = await classifyMessage(expenseText);
      if (classified.expense && classified.expense.amount > 0) {
        await firestoreAdd("expenses", {
          ...classified.expense,
          source: "telegram",
          vendorFullName: classified.expense.vendorFullName || classified.expense.vendor || "",
          address: classified.expense.address || "",
          discount: classified.expense.discount || 0,
        });
        await sendMessage(chatId, `💰 Expense logged: $${classified.expense.amount} at ${classified.expense.vendor}\n${classified.reply || ""}`, MAIN_MENU);
      } else {
        await sendMessage(chatId, `❌ Couldn't parse expense. Try: /expense spent $50 at Walmart on groceries`, MAIN_MENU);
      }
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/recipe ")) {
      const recipeName = text.slice(8).trim();
      await sendMessage(chatId, `🍳 Generating recipe for "${recipeName}"... please wait ⏳`);
      try {
        const recipe = await generateRecipe(recipeName);
        await firestoreAdd("recipes", {
          en: recipe.en || {},
          hi: recipe.hi || {},
          images: [],
          source: "telegram",
        });
        const en = recipe.en;
        const ingredientsList = en.ingredients?.map((i: any) => `  • ${i.quantity} ${i.unit} ${i.item}`).join("\n") || "";
        const stepsList = en.steps?.map((s: any) => `  ${s.stepNumber}. ${s.instruction}`).join("\n") || "";
        await sendMessage(
          chatId,
          `✅ <b>${en.title}</b>\n\n` +
          `${en.description}\n\n` +
          `🍽️ ${en.cuisine} • ⏱️ ${en.prepTime} prep + ${en.cookTime} cook • 👥 ${en.servings} servings\n\n` +
          `<b>📋 Ingredients:</b>\n${ingredientsList}\n\n` +
          `<b>👨‍🍳 Steps:</b>\n${stepsList}\n\n` +
          `💡 Full recipe saved to Annapurna app!`,
          MAIN_MENU
        );
      } catch (err: any) {
        console.error("[Telegram] Recipe generation failed:", err);
        await sendMessage(chatId, `❌ Failed to generate recipe: ${err.message}`, MAIN_MENU);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle photo (smart image understanding)
    if (message.photo) {
      const photo = message.photo[message.photo.length - 1]; // highest res
      const fileUrl = await getFileUrl(photo.file_id);
      if (fileUrl) {
        await sendMessage(chatId, `📸 Analyzing image... please wait ⏳`);
        try {
          const base64 = await downloadFileAsBase64(fileUrl);
          const analysis = await understandImage(base64, "image/jpeg", message.caption);
          console.log("[Telegram] Image analysis:", JSON.stringify(analysis).substring(0, 300));

          if (analysis.type === "receipt" && analysis.receipt) {
            const receipt = analysis.receipt;
            await firestoreAdd("expenses", { ...receipt, source: "telegram" });
            const itemsList = receipt.items?.map((i: any) => `  ${i.name}: $${i.price}`).join("\n") || "";
            await sendMessage(
              chatId,
              `✅ <b>Receipt Scanned!</b>\n\n` +
              `🏪 <b>${receipt.vendorFullName || receipt.vendor}</b>\n` +
              `📅 ${receipt.displayDate} • 💳 ${receipt.paymentMethod}\n\n` +
              `${itemsList}\n\n` +
              `💰 <b>Total: $${receipt.amount}</b>${receipt.discount ? ` (Discount: $${receipt.discount})` : ""}`,
              MAIN_MENU
            );
          } else if (analysis.type === "food" && analysis.food) {
            await sendMessage(
              chatId,
              `🍽️ That looks like <b>${analysis.food.name}</b>!\n${analysis.food.cuisine ? `Cuisine: ${analysis.food.cuisine}\n` : ""}\nWant me to generate the recipe?`,
              { inline_keyboard: [
                [{ text: `🍳 Generate Recipe for ${analysis.food.name}`, callback_data: `action:recipe_prompt` }],
                [{ text: "🔙 Main Menu", callback_data: "action:main" }],
              ]}
            );
          } else if (analysis.type === "grocery_list" && analysis.groceryItems?.length > 0) {
            for (const item of analysis.groceryItems) {
              await firestoreAdd("groceries", { name: item, quantity: "", emoji: "", purchased: false, source: "telegram" });
            }
            await sendMessage(
              chatId,
              `🛒 <b>Grocery list detected!</b>\n\nAdded ${analysis.groceryItems.length} items:\n${analysis.groceryItems.map((i: string) => `• ${i}`).join("\n")}`,
              MAIN_MENU
            );
          } else {
            await sendMessage(chatId, `🖼️ ${analysis.description || "I see an image but I'm not sure what to do with it."}\n\nTip: Send a receipt, food photo, or grocery list!`, MAIN_MENU);
          }
        } catch (err: any) {
          console.error("[Telegram] Image analysis failed:", err);
          await sendMessage(chatId, `❌ Failed to analyze image: ${err.message}`, MAIN_MENU);
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Handle document (PDF receipts, etc.)
    if (message.document) {
      const doc = message.document;
      if (doc.mime_type?.startsWith("image/")) {
        const fileUrl = await getFileUrl(doc.file_id);
        if (fileUrl) {
          await sendMessage(chatId, `📄 Processing document... please wait ⏳`);
          try {
            const base64 = await downloadFileAsBase64(fileUrl);
            const analysis = await understandImage(base64, doc.mime_type, message.caption);
            if (analysis.type === "receipt" && analysis.receipt) {
              await firestoreAdd("expenses", { ...analysis.receipt, source: "telegram" });
              await sendMessage(chatId, `✅ Receipt from document processed! Total: $${analysis.receipt.amount}`, MAIN_MENU);
            } else {
              await sendMessage(chatId, `📄 ${analysis.description || "Document processed."}`, MAIN_MENU);
            }
          } catch (err: any) {
            await sendMessage(chatId, `❌ Failed to process document: ${err.message}`, MAIN_MENU);
          }
        }
      } else {
        await sendMessage(chatId, `📄 I can only process image documents for now. Try sending a photo instead!`, MAIN_MENU);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle voice message
    if (message.voice) {
      try {
        const fileUrl = await getFileUrl(message.voice.file_id);
        if (fileUrl) {
          const base64 = await downloadFileAsBase64(fileUrl);
          const transcription = await transcribeVoice(base64);
          await sendMessage(chatId, `🎙️ I heard: "${transcription}"\n\nProcessing...`);

          // Process the transcribed text as a regular message
          const classified = await classifyMessage(transcription);
          await handleClassifiedMessage(chatId, firstName, transcription, classified);
        }
      } catch (err: any) {
        console.error("[Telegram] Voice processing failed:", err);
        await sendMessage(chatId, `❌ Couldn't process voice message. Try again.`, MAIN_MENU);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle plain text - classify with Gemini
    if (text && !text.startsWith("/")) {
      try {
        const classified = await classifyMessage(text);
        await handleClassifiedMessage(chatId, firstName, text, classified);
      } catch (err: any) {
        console.error("[Telegram] Classification failed:", err);
        await sendMessage(chatId, `Sorry ${firstName}, I couldn't understand that. Try /start for options.`, MAIN_MENU);
      }
      return NextResponse.json({ ok: true });
    }

    // Default: show menu
    await sendMessage(chatId, `🏁 ${firstName}, how can I help? 👇`, MAIN_MENU);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}

// Handle classified message
async function handleClassifiedMessage(
  chatId: number,
  firstName: string,
  text: string,
  classified: any
) {
  const intent = classified.intent;
  const items = classified.items || [];

  if (intent === "add_task" && items.length > 0) {
    for (const item of items) {
      await firestoreAdd("tasks", {
        title: item,
        status: "pending",
        isUrgent: true,
        isDaily: false,
        date: new Date().toISOString().split("T")[0],
        order: 0,
        elapsedMs: 0,
        source: "telegram",
      });
    }
    await sendMessage(chatId, `🚨 Added ${items.length} URGENT task(s):\n${items.map((i: string) => `• ${i}`).join("\n")}`, MAIN_MENU);
  } else if (intent === "add_grocery" && items.length > 0) {
    for (const item of items) {
      await firestoreAdd("groceries", {
        name: item,
        quantity: "",
        emoji: "",
        purchased: false,
        source: "telegram",
      });
    }
    await sendMessage(chatId, `🛒 Added to grocery list:\n${items.map((i: string) => `• ${i}`).join("\n")}`, MAIN_MENU);
  } else if (intent === "add_expense" && classified.expense?.amount > 0) {
    const exp = classified.expense;
    await firestoreAdd("expenses", {
      vendor: exp.vendor || "",
      vendorFullName: exp.vendorFullName || exp.vendor || "",
      type: exp.type || "Other",
      amount: exp.amount,
      emoji: exp.emoji || "💰",
      discount: exp.discount || 0,
      displayDate: exp.displayDate || "",
      date: exp.date || new Date().toISOString().split("T")[0],
      address: exp.address || "",
      paymentMethod: exp.paymentMethod || "Unknown",
      items: exp.items || [],
      source: "telegram",
    });
    await sendMessage(chatId, `💰 Expense logged: $${exp.amount} at ${exp.vendor}\n${classified.reply || ""}`, MAIN_MENU);
  } else if (intent === "add_recipe" && items.length > 0) {
    const recipeName = items[0];
    await sendMessage(chatId, `🍳 Generating recipe for "${recipeName}"... ⏳`);
    try {
      const recipe = await generateRecipe(recipeName);
      await firestoreAdd("recipes", { en: recipe.en || {}, hi: recipe.hi || {}, images: [], source: "telegram" });
      const en = recipe.en;
      const ingredientsList = en.ingredients?.map((i: any) => `  • ${i.quantity} ${i.unit} ${i.item}`).join("\n") || "";
      await sendMessage(
        chatId,
        `✅ <b>${en.title}</b>\n\n${en.description}\n\n<b>📋 Ingredients:</b>\n${ingredientsList}\n\n💡 Full recipe saved to Annapurna app!`,
        MAIN_MENU
      );
    } catch (err: any) {
      await sendMessage(chatId, `❌ Failed to generate recipe: ${err.message}`, MAIN_MENU);
    }
  } else {
    // Chat or unknown - use the reply from Gemini
    const reply = classified.reply || `${firstName}, I'm not sure what you mean. Try /start for options.`;
    await sendMessage(chatId, reply, MAIN_MENU);
  }
}

// GET handler for webhook verification
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "Annapurna Telegram Bot Webhook Active",
    timestamp: new Date().toISOString(),
  });
}
