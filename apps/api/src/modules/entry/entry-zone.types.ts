import { Zone, TrendDirection } from '../market-structure/market-structure.types';

export const ENTRY_ZONE_ENGINE_VERSION = '1.0.0';

export interface EntryZoneContext {
  aiScore?: number | null;
  aiConfidence?: number | null;
  decisionScore?: number | null;
  decisionConfidence?: number | null;
  opportunityScore?: number | null;
  opportunityConfidence?: number | null;
  eliteDaily?: number | null;
  eliteConfidence?: number | null;
  tomorrowScore?: number | null;
  momentum?: number | null;
  risk?: number | null;
  volume?: number | null;
}

export interface EntryZoneInput {
  ticker: string;
  company: string | null;
  price: number | null;
  atr: number | null;
  bollinger: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
  };
  ema: {
    ema20: number | null;
    ema50: number | null;
    ema200: number | null;
  };
  rsi: number | null;
  relativeVolume: number | null;
  supportZones: Zone[];
  resistanceZones: Zone[];
  trend: TrendDirection;
  context?: EntryZoneContext | null;
}

export type EntryTrendDirection = 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';

export type EntryQualityLevel =
  | 'PERFECT'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'AVERAGE'
  | 'WEAK';

export interface EntryQuality {
  level: EntryQualityLevel;
  label: string;
  stars: string;
}

export interface EntryZoneRange {
  min: number;
  max: number;
}

export interface EntryZoneResult {
  ticker: string;
  company: string | null;
  price: number | null;
  idealEntryZone: EntryZoneRange | null;
  aggressiveEntry: number | null;
  conservativeEntry: number | null;
  support1: number | null;
  support2: number | null;
  resistance1: number | null;
  resistance2: number | null;
  stopLoss: number | null;
  target1: number | null;
  target2: number | null;
  target3: number | null;
  riskRewardRatio: number | null;
  riskRewardLabel: string | null;
  entryConfidence: number;
  trendDirection: EntryTrendDirection;
  entryQuality: EntryQuality;
  reasons: string[];
  warnings: string[];
  evaluatedAt: string;
}

export interface EntryRegistryEntry {
  ticker: string;
  input: EntryZoneInput;
  result: EntryZoneResult;
  evaluatedAt: string;
}
