import React, { createContext, useContext, useEffect, useState } from "react";
import { SupportedLang, regionalTranslations } from "@/lib/regionalTranslations";

interface LanguageContextType {
  language: SupportedLang;
  setLanguage: (lang: SupportedLang) => void;
  toggleLanguage: () => void;
  isHindi: boolean;
  dict: (typeof regionalTranslations)[SupportedLang];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "preferred_tool_lang";

export function LanguageProvider({
  children,
  defaultLang = "en",
}: {
  children: React.ReactNode;
  defaultLang?: SupportedLang;
}) {
  const [language, setLanguageState] = useState<SupportedLang>(() => {
    if (typeof window !== "undefined") {
      try {
        // First check URL query parameter (e.g. ?lang=hi or ?hl=hi)
        const params = new URLSearchParams(window.location.search);
        const queryLang = (params.get("lang") || params.get("hl") || "").toLowerCase();
        if (queryLang === "hi" || queryLang.startsWith("hi-")) {
          return "hi";
        }
        if (queryLang === "en" || queryLang.startsWith("en-")) {
          return "en";
        }

        // Fallback to persisted guarded localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "hi") {
          return stored;
        }
      } catch {
        // Local storage or URL parsing inaccessible in sandboxed environment
      }
    }
    return defaultLang;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, language);
        document.cookie = `app_lang=${language};path=/;max-age=31536000;SameSite=Lax`;
      } catch {
        // Storage write ignored in restricted environments
      }
    }
  }, [language]);

  const setLanguage = (lang: SupportedLang) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "hi" : "en"));
  };

  const dict = regionalTranslations[language];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isHindi: language === "hi",
        dict,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
