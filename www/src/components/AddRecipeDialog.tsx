"use client";

import { useState, useRef, useEffect } from "react";
import { X, Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { useLanguage, LANGUAGE_CODES } from "@/lib/language-context";
import { getFallbackImageUrl } from "@/lib/gemini";
import { addRecipe } from "@/lib/recipes";
import { uploadImageToStorage } from "@/lib/storage";
import { searchRecipeVideos } from "@/lib/youtube";
import toast from "react-hot-toast";

interface RecipeContent {
  title: string;
  description: string;
  cuisine: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: { item: string; quantity: string; unit: string }[];
  steps: { stepNumber: number; instruction: string; duration?: string }[];
}

interface ParsedRecipe {
  en: RecipeContent;
  hi: RecipeContent;
}

interface AddRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddRecipeDialog({
  open,
  onClose,
  onAdded,
}: AddRecipeDialogProps) {
  const { language, t, langCode } = useLanguage();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langCode;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      // Call API to parse recipe
      const parseRes = await fetch("/api/gemini/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      
      if (!parseRes.ok) {
        const errData = await parseRes.json();
        throw new Error(errData.error || "Failed to parse recipe");
      }
      
      const parsed: ParsedRecipe = await parseRes.json();

      // Generate image via API and upload to Firebase Storage
      const images: string[] = [];
      const imageRes = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeName: parsed.en.title }),
      });

      if (imageRes.ok) {
        const imageData = await imageRes.json();
        if (imageData.success && imageData.imageBase64) {
          // Convert base64 to Uint8Array
          const binary = atob(imageData.imageBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          
          const ts = Date.now();
          const url = await uploadImageToStorage(
            bytes,
            `recipes/${ts}_${parsed.en.title.replace(/\s+/g, "_")}.png`
          );
          images.push(url);
          console.log("[Image] Uploaded to Firebase Storage:", url);
        } else {
          images.push(getFallbackImageUrl(parsed.en.title));
          console.warn("[Image] Using fallback placeholder");
        }
      } else {
        // Fallback placeholder when image generation fails
        images.push(getFallbackImageUrl(parsed.en.title));
        console.warn("[Image] Using fallback placeholder");
      }

      // Search YouTube videos for English and Hindi
      const videos = await searchRecipeVideos(parsed.en.title, parsed.hi.title);
      console.log("[YouTube] Videos found:", videos);

      console.log("[Recipe] About to save recipe to Firestore...");
      const recipeId = await addRecipe(parsed, images, videos);
      console.log("[Recipe] Successfully saved with ID:", recipeId);
      
      toast.success(
        language === "English"
          ? `"${parsed.en.title}" added!`
          : `✓ ${parsed.hi.title}`
      );
      setText("");
      onAdded();
      onClose();
    } catch (err: any) {
      console.error("[Recipe] Error during save:", err);
      toast.error(err.message || "Failed to add recipe");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-red-500">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t("addRecipe")}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-3">
            {language === "English"
              ? "Describe your recipe in any way you like — the AI will structure it for you."
              : t("typeOrSpeak")}
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("typeOrSpeak")}
            rows={6}
            disabled={loading}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:opacity-50 bg-gray-50"
          />

          {/* Voice button */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={listening ? stopListening : startListening}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {listening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  {t("stopListening")}
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  {t("listening")}
                </>
              )}
            </button>
            {listening && (
              <span className="text-xs text-red-500 animate-pulse">
                ● {t("listening")}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t("addRecipe")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
