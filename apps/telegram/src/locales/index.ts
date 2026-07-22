import { en } from './en';
import { tr } from './tr';

export type Locale = typeof en;
export type LocaleKey = keyof Locale;

const locales = { en, tr } as const;

export function getLocale(lang: 'en' | 'tr' = 'en'): Locale {
  return locales[lang];
}

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = locale;

  for (const k of keys) {
    if (value === undefined) return key;
    value = value[k];
  }

  return typeof value === 'string' ? value : key;
}
