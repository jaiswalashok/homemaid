"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { translateText } from "./gemini";

export type Language = "English" | "Hindi";

export const LANGUAGES: Language[] = [
  "English",
  "Hindi",
];

// Language codes for speech synthesis
export const LANGUAGE_CODES: Record<Language, string> = {
  English: "en-US",
  Hindi: "hi-IN",
};

// UI labels for each language
export const UI_LABELS: Record<Language, Record<string, string>> = {
  English: {
    appName: "Annapurna",
    addRecipe: "Add Recipe",
    editRecipe: "Edit Recipe",
    deleteRecipe: "Delete",
    printRecipe: "Print",
    followAlong: "Follow",
    ingredients: "Ingredients",
    steps: "Steps",
    prepTime: "Prep Time",
    cookTime: "Cook Time",
    servings: "Servings",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    typeOrSpeak: "Type or speak your recipe...",
    processing: "Processing with AI...",
    noRecipes: "No recipes yet. Add your first recipe!",
    confirmDelete: "Are you sure you want to delete this recipe?",
    listening: "Listening...",
    stopListening: "Stop",
    language: "Language",
    search: "Search recipes...",
  },
  Hindi: {
    appName: "अन्नपूर्णा",
    addRecipe: "रेसिपी जोड़ें",
    editRecipe: "रेसिपी संपादित करें",
    deleteRecipe: "हटाएं",
    printRecipe: "प्रिंट",
    followAlong: "साथ में बनाएं",
    ingredients: "सामग्री",
    steps: "चरण",
    prepTime: "तैयारी का समय",
    cookTime: "पकाने का समय",
    servings: "सर्विंग्स",
    cancel: "रद्द करें",
    save: "सहेजें",
    close: "बंद करें",
    typeOrSpeak: "अपनी रेसिपी टाइप करें या बोलें...",
    processing: "AI प्रोसेसिंग...",
    noRecipes: "अभी कोई रेसिपी नहीं है। अपनी पहली रेसिपी जोड़ें!",
    confirmDelete: "क्या आप वाकई इस रेसिपी को हटाना चाहते हैं?",
    listening: "सुन रहे हैं...",
    stopListening: "रुकें",
    language: "भाषा",
    search: "रेसिपी खोजें...",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  langCode: string;
  translateAsync: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "English",
  setLanguage: () => {},
  t: (key: string) => key,
  langCode: "en-US",
  translateAsync: async (text: string) => text,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("English");

  const t = useCallback(
    (key: string) => {
      return UI_LABELS[language]?.[key] || UI_LABELS["English"]?.[key] || key;
    },
    [language]
  );

  const langCode = LANGUAGE_CODES[language];

  const translateAsync = useCallback(
    async (text: string) => {
      return translateText(text, language);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, langCode, translateAsync }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
