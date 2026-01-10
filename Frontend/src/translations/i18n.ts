// Frontend-safe i18n with a Node-i18n-like configure API
// Loads JSON resources and exposes t/__/configure/setLocale/getLocale

import en from "./en.json";
import ru from "./ru.json";

export type LocaleBundle = Record<string, string>;

type Registry = Record<string, LocaleBundle>;

const registry: Registry = { en, ru };

export interface SupportedLanguage {
  value: string;
  label: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "ru", label: "RU", name: "???????" },
];

export type TranslationKey = keyof typeof en;
export type Translator = (key: TranslationKey) => string;

export function createTranslator(language: string = "en"): Translator {
  const locale = registry[language] || en;
  return function t(key: TranslationKey): string {
    return locale[key] ?? en[key] ?? key;
  };
}

let currentLang = "en";
let locales = Object.keys(registry);
let defaultLocale = "en";
const listeners = new Set<(lang: string) => void>();

export interface ConfigureOptions {
  locales?: string[];
  defaultLocale?: string;
  resources?: Record<string, LocaleBundle>;
}

export interface I18nAPI {
  configure: (opts?: ConfigureOptions) => void;
  setLocale: (lang: string) => void;
  getLocale: () => string;
  __: (key: string) => string;
  t: (key: string) => string;
  on: (event: "change", handler: (lang: string) => void) => void;
  off: (event: "change", handler: (lang: string) => void) => void;
}

export const i18n: I18nAPI = {
  configure(opts: ConfigureOptions = {}): void {
    if (Array.isArray(opts.locales) && opts.locales.length) {
      locales = [...opts.locales];
    }
    if (opts.defaultLocale && typeof opts.defaultLocale === "string") {
      defaultLocale = opts.defaultLocale;
      if (!locales.includes(defaultLocale)) locales.push(defaultLocale);
    }
    if (opts.resources && typeof opts.resources === "object") {
      for (const [lng, res] of Object.entries(opts.resources)) {
        registry[lng] = { ...(registry[lng] || {}), ...(res || {}) };
      }
    }
    // Fallback: merge EN keys into every registered locale
    Object.keys(registry).forEach((lang) => {
      if (lang === "en") return;
      registry[lang] = { ...en, ...(registry[lang] || {}) };
    });
  },
  setLocale(lang: string): void {
    const next = locales.includes(lang) ? lang : defaultLocale;
    if (currentLang !== next) {
      currentLang = next;
      for (const fn of listeners) {
        try {
          fn(currentLang);
        } catch {
          // ignore listener errors
        }
      }
    }
  },
  getLocale(): string {
    return currentLang;
  },
  __: (key: TranslationKey): string => {
    return createTranslator(currentLang)(key);
  },
  t: (key: TranslationKey): string => {
    return createTranslator(currentLang)(key);
  },
  on(event: "change", handler: (lang: string) => void): void {
    if (event === "change" && typeof handler === "function") {
      listeners.add(handler);
    }
  },
  off(event: "change", handler: (lang: string) => void): void {
    if (event === "change") {
      listeners.delete(handler);
    }
  },
};

export function setLanguage(lang: string): void {
  i18n.setLocale(lang);
}

export function getLanguage(): string {
  return i18n.getLocale();
}

export function t(key: TranslationKey): string {
  return i18n.t(key);
}

export default i18n;
