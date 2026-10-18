import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './resources/en.json';
import hi from './resources/hi.json';
import mr from './resources/mr.json';
import ta from './resources/ta.json';
import te from './resources/te.json';
import kn from './resources/kn.json';
import bn from './resources/bn.json';
import gu from './resources/gu.json';
import pa from './resources/pa.json';
import ml from './resources/ml.json';

export const LANGUAGE_STORAGE_KEY = '@setu/language';

export const SUPPORTED_LANGUAGE_CODES = [
  'en',
  'hi',
  'mr',
  'ta',
  'te',
  'kn',
  'bn',
  'gu',
  'pa',
  'ml',
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const LANGUAGE_NATIVE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  bn: 'বাংলা',
  gu: 'ગુજરાતી',
  pa: 'ਪੰਜਾਬੀ',
  ml: 'മലയാളം',
};

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  bn: { translation: bn },
  gu: { translation: gu },
  pa: { translation: pa },
  ml: { translation: ml },
};

export function isSupportedLanguage(code?: string | null): code is LanguageCode {
  return !!code && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(code);
}

export function getInitialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(saved)) return saved;
  } catch {}
  // English is the strict default for all new users and first-time visitors.
  // Device language or location must NOT automatically override this.
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false, bindI18n: 'languageChanged loaded' },
});


export async function initLanguage(): Promise<LanguageCode> {
  const lang = getInitialLanguage();
  await i18n.changeLanguage(lang);
  return lang;
}

export async function changeAppLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch (err) {
    console.error('Failed to save language to localStorage', err);
  }
}

export function formatInr(amount: number): string {
  return amount.toLocaleString('en-IN');
}

export default i18n;
