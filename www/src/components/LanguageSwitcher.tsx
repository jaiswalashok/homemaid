"use client";

import { Globe } from "lucide-react";
import { useLanguage, LANGUAGES } from "@/lib/language-context";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{language}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 min-w-[160px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors ${
                lang === language
                  ? "text-orange-600 font-semibold bg-orange-50"
                  : "text-gray-700"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
