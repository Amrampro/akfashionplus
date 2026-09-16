import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "../types";
import en from "../locales/en";
import fr from "../locales/fr";
import pt from "../locales/pt";

type Dictionary = Record<string, unknown>;
type TranslationParams = Record<string, number | string>;

type LanguageContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language | string | null | undefined) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const dictionaries: Record<Language, Dictionary> = { fr, en, pt };
const localeByLanguage: Record<Language, string> = {
  fr: "fr-FR",
  en: "en-US",
  pt: "pt-PT",
};

export function normalizeLanguage(language?: Language | string | null): Language {
  if (language === "en" || language === "pt") return language;
  return "pt";
}

function readTranslation(dictionary: Dictionary, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dictionary);

  return typeof value === "string" ? value : undefined;
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template;

  return Object.entries(params).reduce(
    (text, [key, value]) => text.split(`{{${key}}}`).join(String(value)),
    template,
  );
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: "pt",
  locale: "pt-PT",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>("pt");

  const setLanguage = useCallback((nextLanguage?: Language | string | null) => {
    updateLanguage(normalizeLanguage(nextLanguage));
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const translated =
        readTranslation(dictionaries[language], key) ||
        readTranslation(dictionaries.fr, key) ||
        key;

      return interpolate(translated, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      locale: localeByLanguage[language],
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
