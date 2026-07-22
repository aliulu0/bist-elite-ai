import type { SupportedLocale } from './provider';
import { DEFAULT_LOCALE } from './provider';

const TURKISH_LIRA = '\u20BA';

export interface FormatConfig {
  locale: SupportedLocale;
  timezone: string;
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  decimalSeparator: ',' | '.';
  thousandsSeparator: '.' | ',';
}

const FORMAT_CONFIGS: Record<SupportedLocale, FormatConfig> = {
  tr: {
    locale: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD.MM.YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  en: {
    locale: 'en',
    timezone: 'Europe/Istanbul',
    dateFormat: 'MM/DD/YYYY',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
};

export function getFormatConfig(locale: SupportedLocale = DEFAULT_LOCALE): FormatConfig {
  return FORMAT_CONFIGS[locale];
}

export function formatCurrency(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  currency: string = 'TRY',
): string {
  const config = FORMAT_CONFIGS[locale];
  const formatted = formatNumber(Math.abs(value), locale, 2);
  const sign = value < 0 ? '-' : '';

  if (currency === 'TRY' || currency === 'TL') {
    return `${sign}${TURKISH_LIRA}${formatted}`;
  }
  return `${sign}${currency} ${formatted}`;
}

export function formatPercent(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  decimals: number = 2,
): string {
  const config = FORMAT_CONFIGS[locale];
  const absValue = Math.abs(value);
  let formatted: string;

  if (locale === 'tr') {
    formatted = absValue.toFixed(decimals).replace('.', ',');
  } else {
    formatted = absValue.toFixed(decimals);
  }

  const sign = value < 0 ? '-' : value > 0 ? '+' : '';
  return `${sign}%${formatted}`;
}

export function formatNumber(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  decimals: number = 2,
): string {
  const config = FORMAT_CONFIGS[locale];
  const parts = value.toFixed(decimals).split('.');
  const intPart = parts[0];
  const decPart = parts[1] || '';

  let formatted = '';
  const digits = intPart.replace('-', '');
  const isNegative = intPart.startsWith('-');

  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      formatted += config.thousandsSeparator;
    }
    formatted += digits[i];
  }

  if (isNegative) {
    formatted = '-' + formatted;
  }

  if (decimals > 0) {
    formatted += config.decimalSeparator + decPart;
  }

  return formatted;
}

export function formatLargeNumber(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    const formatted = (absValue / 1_000_000_000).toFixed(2);
    return `${sign}${formatted}Milyar`;
  }
  if (absValue >= 1_000_000) {
    const formatted = (absValue / 1_000_000).toFixed(2);
    return `${sign}${formatted}M`;
  }
  if (absValue >= 1_000) {
    const formatted = (absValue / 1_000).toFixed(1);
    return `${sign}${formatted}K`;
  }
  return formatNumber(value, locale, 0);
}

export function formatDate(
  date: Date | string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const config = FORMAT_CONFIGS[locale];

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (config.dateFormat) {
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}.${month}.${year}`;
  }
}

export function formatDateTime(
  date: Date | string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d, locale);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

export function formatTime(
  date: Date | string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatRelativeTime(
  date: Date | string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  const translations: Record<string, Record<SupportedLocale, string>> = {
    now: { tr: 'şimdi', en: 'now' },
    seconds: { tr: '{n} saniye önce', en: '{n} seconds ago' },
    minutes: { tr: '{n} dakika önce', en: '{n} minutes ago' },
    hours: { tr: '{n} saat önce', en: '{n} hours ago' },
    days: { tr: '{n} gün önce', en: '{n} days ago' },
    weeks: { tr: '{n} hafta önce', en: '{n} weeks ago' },
    months: { tr: '{n} ay önce', en: '{n} months ago' },
  };

  if (diffSec < 10) return translations.now[locale];
  if (diffSec < 60) return translations.seconds[locale].replace('{n}', String(diffSec));
  if (diffMin < 60) return translations.minutes[locale].replace('{n}', String(diffMin));
  if (diffHour < 24) return translations.hours[locale].replace('{n}', String(diffHour));
  if (diffWeek < 4) return translations.days[locale].replace('{n}', String(diffDay));
  if (diffWeek < 12) return translations.weeks[locale].replace('{n}', String(diffWeek));
  return translations.months[locale].replace('{n}', String(diffMonth));
}

export function formatScore(
  score: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  return formatNumber(score, locale, 1);
}

export function formatVolume(
  volume: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}Mlyr`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return formatNumber(volume, locale, 0);
}

export function formatConfidence(
  confidence: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  return formatPercent(confidence * 100, locale, 1);
}
