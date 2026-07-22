'use client';

import { useStore } from '@/stores';
import en from '@/locales/en.json';
import tr from '@/locales/tr.json';

const locales = { en, tr } as const;

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: K | `${K}.${NestedKeyOf<T[K]>}` }[keyof T & string]
  : never;

type TranslationKey = NestedKeyOf<typeof en>;

export function useI18n() {
  const locale = useStore((s) => s.language);

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = locales[locale];

    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, locale };
}
