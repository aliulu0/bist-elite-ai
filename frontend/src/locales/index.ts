import tr from "./tr.json";
import en from "./en.json";

export type Locale = "tr" | "en";

export const locales: Locale[] = ["tr", "en"];
export const defaultLocale: Locale = "tr";

const translations: Record<Locale, Record<string, unknown>> = {
  tr,
  en,
};

export function getTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale];
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split(".");
  let value: unknown = translations[locale] || translations[defaultLocale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  if (params) {
    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) =>
        result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue)),
      value
    );
  }

  return value;
}
