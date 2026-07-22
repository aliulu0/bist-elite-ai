import { tr, type TrTranslation } from './tr';
import { en, type EnTranslation } from './en';

export type SupportedLocale = 'tr' | 'en';
export type Translation = TrTranslation | EnTranslation;

export const DEFAULT_LOCALE: SupportedLocale = 'tr';
export const FALLBACK_LOCALE: SupportedLocale = 'tr';
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['tr', 'en'] as const;

const locales: Record<SupportedLocale, Translation> = { tr, en };

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: K | `${K}.${NestedKeyOf<T[K]>}` }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TrTranslation>;

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let value = obj;
  for (const k of keys) {
    if (value === undefined || value === null) return undefined;
    value = value[k];
  }
  return typeof value === 'string' ? value : undefined;
}

export class LocalizationProvider {
  private _locale: SupportedLocale;
  private _cache: Map<string, string> = new Map();

  constructor(locale: SupportedLocale = DEFAULT_LOCALE) {
    this._locale = locale;
  }

  get locale(): SupportedLocale {
    return this._locale;
  }

  set locale(value: SupportedLocale) {
    if (!SUPPORTED_LOCALES.includes(value)) {
      throw new Error(`Unsupported locale: ${value}. Supported: ${SUPPORTED_LOCALES.join(', ')}`);
    }
    this._locale = value;
    this._cache.clear();
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const cacheKey = `${this._locale}:${key}:${JSON.stringify(params || {})}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)!;
    }

    let value = getNestedValue(locales[this._locale], key);

    if (value === undefined) {
      value = getNestedValue(locales[FALLBACK_LOCALE], key);
    }

    if (value === undefined) {
      value = key;
    }

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }

    this._cache.set(cacheKey, value);
    return value;
  }

  tArray(key: string): any[] {
    const keys = key.split('.');
    let value: any = locales[this._locale];

    for (const k of keys) {
      if (value === undefined || value === null) return [];
      value = value[k];
    }

    return Array.isArray(value) ? value : [];
  }

  getLocaleData(locale?: SupportedLocale): Translation {
    return locales[locale || this._locale];
  }

  hasTranslation(key: string): boolean {
    const primary = getNestedValue(locales[this._locale], key);
    if (primary !== undefined) return true;
    const fallback = getNestedValue(locales[FALLBACK_LOCALE], key);
    return fallback !== undefined;
  }

  getMissingKeys(targetLocale: SupportedLocale): string[] {
    const baseKeys = this._extractKeys(locales[FALLBACK_LOCALE], '');
    const missing: string[] = [];

    for (const key of baseKeys) {
      const value = getNestedValue(locales[targetLocale], key);
      if (value === undefined) {
        missing.push(key);
      }
    }

    return missing;
  }

  private _extractKeys(obj: any, prefix: string): string[] {
    const keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        keys.push(...this._extractKeys(v, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  clearCache(): void {
    this._cache.clear();
  }
}

let _globalProvider: LocalizationProvider | null = null;

export function getLocalizationProvider(): LocalizationProvider {
  if (!_globalProvider) {
    _globalProvider = new LocalizationProvider(DEFAULT_LOCALE);
  }
  return _globalProvider;
}

export function setLocalizationProvider(provider: LocalizationProvider): void {
  _globalProvider = provider;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  return getLocalizationProvider().t(key, params);
}
