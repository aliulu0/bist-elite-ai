import { EntryQualityLevel } from './entry-zone.types';

export interface EntryQualityMeta {
  level: EntryQualityLevel;
  label: string;
  stars: string;
  minConfidence: number;
}

export const ENTRY_QUALITY_LEVELS: EntryQualityMeta[] = [
  { level: 'PERFECT', label: 'Mükemmel', stars: '★★★★★', minConfidence: 85 },
  { level: 'VERY_GOOD', label: 'Çok İyi', stars: '★★★★☆', minConfidence: 70 },
  { level: 'GOOD', label: 'İyi', stars: '★★★☆☆', minConfidence: 55 },
  { level: 'AVERAGE', label: 'Orta', stars: '★★☆☆☆', minConfidence: 40 },
  { level: 'WEAK', label: 'Zayıf', stars: '★☆☆☆☆', minConfidence: 0 },
];

export const ENTRY_HISTORICAL_LIMIT = 260;
export const ENTRY_TIMEFRAME = '1d' as const;
export const ENTRY_TOP_UNIVERSE_LIMIT = 40;
export const ENTRY_DEFAULT_TOP_LIMIT = 10;

export const ENTRY_ATR_FALLBACK_RATIO = 0.02;
export const ENTRY_STOP_ATR_FACTOR = 0.6;
export const ENTRY_CONSERVATIVE_ATR_FACTOR = 1.0;
export const ENTRY_AGGRESSIVE_ATR_FACTOR = 0.25;
export const ENTRY_TARGET_EXTENSION = 1.5;
