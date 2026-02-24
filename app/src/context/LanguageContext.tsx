import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Language = 'English' | 'Hindi';

export const LANGUAGES: Language[] = ['English', 'Hindi'];

export const LANGUAGE_CODES: Record<Language, string> = {
  English: 'en-US',
  Hindi: 'hi-IN',
};

export const UI_LABELS: Record<Language, Record<string, string>> = {
  English: {
    appName: 'HomeHelp',
    tasks: 'Tasks',
    recipes: 'Recipes',
    expenses: 'Expenses',
    grocery: 'Grocery',
    settings: 'Settings',
    addRecipe: 'Add Recipe',
    editRecipe: 'Edit Recipe',
    deleteRecipe: 'Delete',
    ingredients: 'Ingredients',
    steps: 'Steps',
    prepTime: 'Prep Time',
    cookTime: 'Cook Time',
    servings: 'Servings',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    typeOrSpeak: 'Type or speak your recipe...',
    processing: 'Processing with AI...',
    noRecipes: 'No recipes yet. Add your first recipe!',
    confirmDelete: 'Are you sure you want to delete this?',
    listening: 'Listening...',
    search: 'Search...',
    addTask: 'Add task...',
    noTasks: 'No tasks for today',
    completed: 'Completed',
    pending: 'Pending',
    inProgress: 'In Progress',
    urgent: 'Urgent',
    daily: 'Daily',
    today: 'Today',
    summary: "Today's Summary",
    total: 'Total',
    transactions: 'Transactions',
    categories: 'Categories',
    scanReceipt: 'Scan Receipt',
    addManual: 'Add Manual',
    noExpenses: 'No expenses yet',
    remaining: 'remaining',
    purchased: 'purchased',
    clearPurchased: 'Clear purchased',
    noGroceries: 'Grocery list is empty',
    addGroceries: 'Add groceries...',
    signOut: 'Sign Out',
    profile: 'Profile',
    language: 'Language',
  },
  Hindi: {
    appName: 'होमहेल्प',
    tasks: 'कार्य',
    recipes: 'रेसिपी',
    expenses: 'खर्च',
    grocery: 'किराना',
    settings: 'सेटिंग्स',
    addRecipe: 'रेसिपी जोड़ें',
    editRecipe: 'रेसिपी संपादित करें',
    deleteRecipe: 'हटाएं',
    ingredients: 'सामग्री',
    steps: 'चरण',
    prepTime: 'तैयारी का समय',
    cookTime: 'पकाने का समय',
    servings: 'सर्विंग्स',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    close: 'बंद करें',
    typeOrSpeak: 'अपनी रेसिपी टाइप करें या बोलें...',
    processing: 'AI प्रोसेसिंग...',
    noRecipes: 'अभी कोई रेसिपी नहीं है। अपनी पहली रेसिपी जोड़ें!',
    confirmDelete: 'क्या आप वाकई इसे हटाना चाहते हैं?',
    listening: 'सुन रहे हैं...',
    search: 'खोजें...',
    addTask: 'कार्य जोड़ें...',
    noTasks: 'आज कोई कार्य नहीं',
    completed: 'पूर्ण',
    pending: 'बाकी',
    inProgress: 'जारी',
    urgent: 'तुरंत',
    daily: 'दैनिक',
    today: 'आज',
    summary: 'आज का सारांश',
    total: 'कुल',
    transactions: 'लेनदेन',
    categories: 'श्रेणियाँ',
    scanReceipt: 'रसीद स्कैन करें',
    addManual: 'मैन्युअल जोड़ें',
    noExpenses: 'कोई खर्च नहीं',
    remaining: 'बाकी',
    purchased: 'खरीदे',
    clearPurchased: 'खरीदे हुए हटाएं',
    noGroceries: 'किराना सूची खाली है',
    addGroceries: 'किराना सामान जोड़ें...',
    signOut: 'साइन आउट',
    profile: 'प्रोफ़ाइल',
    language: 'भाषा',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  langCode: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (key: string) => key,
  langCode: 'en-US',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English');

  const t = useCallback(
    (key: string) => {
      return UI_LABELS[language]?.[key] || UI_LABELS['English']?.[key] || key;
    },
    [language]
  );

  const langCode = LANGUAGE_CODES[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, langCode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
