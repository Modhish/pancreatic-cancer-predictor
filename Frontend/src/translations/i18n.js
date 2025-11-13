// Frontend-safe i18n with a Node-i18n-like configure API
// Loads JSON resources and exposes t/__/configure/setLocale/getLocale

import en from './en.json';
import ruRaw from './ru.json';

// Merge RU over EN to guarantee fallback
const ru = { ...en, ...(ruRaw || {}) };

const registry = { en, ru };

export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'ru', label: 'RU', name: 'Русский' },
];

export function createTranslator(language = 'en') {
  const locale = registry[language] || en;
  return function t(key) {
    if (!key || typeof key !== 'string') return key;
    return locale[key] ?? en[key] ?? key;
  };
}

let currentLang = 'en';
let locales = Object.keys(registry);
let defaultLocale = 'en';
const listeners = new Set();

export const i18n = {
  configure(opts = {}) {
    if (Array.isArray(opts.locales) && opts.locales.length) {
      locales = [...opts.locales];
    }
    if (opts.defaultLocale && typeof opts.defaultLocale === 'string') {
      defaultLocale = opts.defaultLocale;
      if (!locales.includes(defaultLocale)) locales.push(defaultLocale);
    }
    if (opts.resources && typeof opts.resources === 'object') {
      for (const [lng, res] of Object.entries(opts.resources)) {
        registry[lng] = { ...(registry[lng] || {}), ...(res || {}) };
      }
    }
    // Keep RU fallback to EN
    if (registry.ru) registry.ru = { ...en, ...registry.ru };
  },
  setLocale(lang) {
    const next = locales.includes(lang) ? lang : defaultLocale;
    if (currentLang !== next) {
      currentLang = next;
      for (const fn of listeners) try { fn(currentLang); } catch {}
    }
  },
  getLocale() { return currentLang; },
  __(key) { return createTranslator(currentLang)(key); },
  t(key) { return createTranslator(currentLang)(key); },
  on(event, handler) { if (event === 'change' && typeof handler === 'function') listeners.add(handler); },
  off(event, handler) { if (event === 'change') listeners.delete(handler); },
};

export function setLanguage(lang) { i18n.setLocale(lang); }
export function getLanguage() { return i18n.getLocale(); }
export function t(key) { return i18n.t(key); }

export default i18n;

