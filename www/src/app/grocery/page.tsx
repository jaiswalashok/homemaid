"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  ShoppingCart,
  Check,
  Mic,
  MicOff,
  CircleDot,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { ensureAuth } from "@/lib/firebase";
import {
  GroceryItem,
  getAllGroceries,
  addGroceryItem,
  toggleGroceryPurchased,
  deleteGroceryItem,
  clearPurchasedGroceries,
} from "@/lib/grocery";
import { formatGroceryItems } from "@/lib/gemini-commands";
import NavBar from "@/components/NavBar";
import toast from "react-hot-toast";

export default function GroceryPage() {
  const { language } = useLanguage();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const loadItems = useCallback(async () => {
    try {
      await ensureAuth();
      const data = await getAllGroceries();
      setItems(data);
    } catch (err) {
      console.error("Failed to load groceries:", err);
      toast.error("Failed to load grocery list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAdd = async () => {
    if (!newItemText.trim()) return;
    setAdding(true);
    try {
      // Use Gemini to format items with emoji
      const formatted = await formatGroceryItems(newItemText.trim());
      for (const item of formatted) {
        await addGroceryItem({
          name: item,
          quantity: "",
          emoji: "",
          purchased: false,
          source: "manual",
        });
      }
      setNewItemText("");
      await loadItems();
      toast.success(`Added ${formatted.length} item(s)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: GroceryItem) => {
    try {
      await toggleGroceryPurchased(item.id, !item.purchased);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, purchased: !i.purchased } : i
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroceryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleClearPurchased = async () => {
    try {
      const count = await clearPurchasedGroceries();
      if (count > 0) {
        await loadItems();
        toast.success(`Cleared ${count} purchased item(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to clear");
    }
  };

  // Voice input
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech not supported"); return; }
    const recognition = new SR();
    recognition.lang = language === "Hindi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      setNewItemText(event.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const unpurchased = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <NavBar />

      {/* Add Item Bar */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder={language === "Hindi" ? "किराना सामान जोड़ें... (जैसे: दूध, अंडे, ब्रेड)" : "Add groceries... (e.g. milk, eggs, bread)"}
              disabled={adding}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent shadow-sm disabled:opacity-50"
            />
            <button
              onClick={listening ? () => { recognitionRef.current?.stop(); setListening(false); } : startListening}
              disabled={adding}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                listening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newItemText.trim()}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {language === "Hindi" ? "जोड़ें" : "Add"}
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">
            {unpurchased.length} {language === "Hindi" ? "बाकी" : "remaining"} • {purchased.length} {language === "Hindi" ? "खरीदे" : "purchased"}
          </span>
          {purchased.length > 0 && (
            <button
              onClick={handleClearPurchased}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <XCircle className="w-3 h-3" />
              {language === "Hindi" ? "खरीदे हुए हटाएं" : "Clear purchased"}
            </button>
          )}
        </div>
      </div>

      {/* Grocery List */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
            <p className="text-gray-400 mt-4 text-sm">Loading grocery list...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400">{language === "Hindi" ? "किराना सूची खाली है" : "Grocery list is empty"}</p>
            <p className="text-gray-300 text-sm mt-1">{language === "Hindi" ? "ऊपर आइटम जोड़ें या वॉइस कमांड दें" : "Add items above or use voice command"}</p>
          </div>
        ) : (
          <>
            {/* Unpurchased items */}
            {unpurchased.length > 0 && (
              <div className="space-y-1.5 mb-4">
                {unpurchased.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    onClick={() => handleToggle(item)}
                  >
                    <CircleDot className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-800 font-medium">{item.name}</span>
                    {item.source === "telegram" && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-medium rounded">
                        Telegram
                      </span>
                    )}
                    {item.source === "recipe" && (
                      <span className="px-1.5 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-medium rounded">
                        Recipe
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Purchased items */}
            {purchased.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2 mt-6">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    {language === "Hindi" ? "खरीदे गए" : "Purchased"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {purchased.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-green-50/50 rounded-xl border border-green-100 transition-all cursor-pointer opacity-60"
                      onClick={() => handleToggle(item)}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
