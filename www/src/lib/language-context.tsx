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
    // Dashboard and Tasks
    addNewTask: "Add a new task...",
    today: "Today",
    upcoming: "Upcoming",
    completed: "Completed",
    taskCompleted: "Task completed!",
    errorUpdatingTask: "Error updating task",
    errorDeletingTask: "Error deleting task",
    taskDeleted: "Task deleted",
    editDailyTasks: "Edit Daily Tasks",
    // Expenses
    addExpense: "Add Expense",
    amount: "Amount",
    vendor: "Vendor",
    paymentMethod: "Payment Method",
    date: "Date",
    // Grocery
    addGroceries: "Add groceries... (e.g. milk, eggs, bread)",
    // General
    loading: "Loading...",
    error: "Error",
    success: "Success",
    // Auth
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    name: "Name",
    // Settings
    profile: "Profile",
    settings: "Settings",
    account: "Account",
    subscription: "Subscription",
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
    // Dashboard and Tasks
    addNewTask: "नया कार्य जोड़ें...",
    today: "आज",
    upcoming: "आने वाले",
    completed: "पूर्ण हुए",
    taskCompleted: "कार्य पूर्ण हुआ!",
    errorUpdatingTask: "कार्य अपडेट में त्रुटि",
    errorDeletingTask: "कार्य हटाने में त्रुटि",
    taskDeleted: "कार्य हटाया गया",
    editDailyTasks: "दैनिक कार्य संपादित करें",
    // Expenses
    addExpense: "खर्च जोड़ें",
    amount: "राशि",
    vendor: "विक्रेता",
    paymentMethod: "भुगतान विधि",
    date: "तिथि",
    // Grocery
    addGroceries: "किराना सामान जोड़ें... (जैसे: दूध, अंडे, ब्रेड)",
    // General
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    // Auth
    signIn: "साइन इन",
    signUp: "साइन अप",
    signOut: "साइन आउट",
    email: "ईमेल",
    password: "पासवर्ड",
    name: "नाम",
    // Settings
    profile: "प्रोफाइल",
    settings: "सेटिंग्स",
    account: "खाता",
    subscription: "सदस्यता",
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
