import { tr } from './tr';
import { en } from './en';
import type { SupportedLocale } from './provider';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './provider';

export interface ValidationResult {
  valid: boolean;
  missingKeys: string[];
  extraKeys: string[];
  mismatchedTypes: string[];
  emptyValues: string[];
}

function extractKeys(obj: any, prefix: string = ''): Map<string, string> {
  const keys = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v === null || v === undefined) {
      keys.set(fullKey, 'null');
    } else if (typeof v === 'object' && !Array.isArray(v)) {
      const nested = extractKeys(v, fullKey);
      for (const [nk, nv] of nested) {
        keys.set(nk, nv);
      }
    } else if (Array.isArray(v)) {
      keys.set(fullKey, 'array');
    } else {
      keys.set(fullKey, typeof v);
    }
  }
  return keys;
}

export function validateTranslationStructure(
  source: any,
  target: any,
  sourceName: string = 'source',
  targetName: string = 'target',
): ValidationResult {
  const sourceKeys = extractKeys(source);
  const targetKeys = extractKeys(target);

  const missingKeys: string[] = [];
  const extraKeys: string[] = [];
  const mismatchedTypes: string[] = [];
  const emptyValues: string[] = [];

  for (const [key, sourceType] of sourceKeys) {
    if (!targetKeys.has(key)) {
      missingKeys.push(key);
    } else {
      const targetType = targetKeys.get(key)!;
      if (sourceType !== targetType && sourceType !== 'null' && targetType !== 'null') {
        mismatchedTypes.push(`${key}: ${sourceName}.${sourceType} vs ${targetName}.${targetType}`);
      }
    }
  }

  for (const key of targetKeys.keys()) {
    if (!sourceKeys.has(key)) {
      extraKeys.push(key);
    }
  }

  for (const [key, value] of targetKeys) {
    if (value === 'null' || value === 'undefined') {
      emptyValues.push(key);
    }
  }

  return {
    valid: missingKeys.length === 0 && mismatchedTypes.length === 0 && emptyValues.length === 0,
    missingKeys,
    extraKeys,
    mismatchedTypes,
    emptyValues,
  };
}

export function validateAllTranslations(): Record<SupportedLocale, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  const sourceKeys = extractKeys(tr);

  for (const locale of SUPPORTED_LOCALES) {
    const targetData = locale === 'tr' ? tr : en;
    const targetKeys = extractKeys(targetData);

    const missingKeys: string[] = [];
    const extraKeys: string[] = [];
    const mismatchedTypes: string[] = [];
    const emptyValues: string[] = [];

    for (const [key, sourceType] of sourceKeys) {
      if (!targetKeys.has(key)) {
        missingKeys.push(key);
      } else {
        const targetType = targetKeys.get(key)!;
        if (sourceType !== targetType) {
          mismatchedTypes.push(`${key}: tr.${sourceType} vs ${locale}.${targetType}`);
        }
      }
    }

    for (const key of targetKeys.keys()) {
      if (!sourceKeys.has(key)) {
        extraKeys.push(key);
      }
    }

    results[locale] = {
      valid: missingKeys.length === 0 && mismatchedTypes.length === 0,
      missingKeys,
      extraKeys,
      mismatchedTypes,
      emptyValues,
    };
  }

  return results as Record<SupportedLocale, ValidationResult>;
}

export function getTranslationCoverage(locale: SupportedLocale): number {
  const sourceKeys = extractKeys(tr);
  const targetData = locale === 'tr' ? tr : en;
  const targetKeys = extractKeys(targetData);

  if (sourceKeys.size === 0) return 0;

  let matched = 0;
  for (const key of sourceKeys.keys()) {
    if (targetKeys.has(key)) {
      matched++;
    }
  }

  return matched / sourceKeys.size;
}

export function getTranslationStats(locale: SupportedLocale): {
  totalKeys: number;
  translatedKeys: number;
  coverage: number;
  missingKeys: string[];
} {
  const sourceKeys = extractKeys(tr);
  const targetData = locale === 'tr' ? tr : en;
  const targetKeys = extractKeys(targetData);

  const missingKeys: string[] = [];
  let translated = 0;

  for (const key of sourceKeys.keys()) {
    if (targetKeys.has(key)) {
      translated++;
    } else {
      missingKeys.push(key);
    }
  }

  return {
    totalKeys: sourceKeys.size,
    translatedKeys: translated,
    coverage: sourceKeys.size > 0 ? translated / sourceKeys.size : 0,
    missingKeys,
  };
}
