/* eslint-disable react-refresh/only-export-components */
import { createContext, useMemo, useState, type ReactNode } from "react";
import fr from "../locales/fr";
import en from "../locales/en";
import pt from "../locales/pt";
import type { Language } from "../types";

const dictionaries = { fr, en, pt } as Record<Language, Record<string, string>>;

function normalizeLanguage(value: string | null): Language {
  return value === "fr" || value === "en" || value === "pt" ? value : "pt";
}

export const LanguageContext = createContext({
  language: "pt" as Language,
  setLanguage: (language: Language) => {
    void language;
  },
  t: pt as Record<string, string>,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    normalizeLanguage(localStorage.getItem("ak_language")),
  );
  const t = useMemo(() => dictionaries[language], [language]);

  const update = (next: Language) => {
    const normalized = normalizeLanguage(next);
    localStorage.setItem("ak_language", normalized);
    setLanguage(normalized);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: update, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
