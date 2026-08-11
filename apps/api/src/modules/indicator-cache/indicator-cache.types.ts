import { Timeframe } from '../indicators/indicator.types';

export const INDICATOR_CACHE_NAMESPACE = 'indicatorCache';

export const INDICATOR_CACHE_TTL_SECONDS: Record<string, number> = {
  '1h': 60,
  '2h': 60,
  '4h': 120,
  '1d': 300,
  '1w': 600,
  '1m': 900,
  '3m': 1800,
  '6m': 3600,
};

export const INDICATOR_CACHE_DEFAULT_TTL_SECONDS = 300;

export interface IndicatorCacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  calculations: number;
  calculationsSaved: number;
  hitRate: number;
}

export function indicatorCacheKey(symbol: string, timeframe: Timeframe, lastBarTimestamp: string): string {
  return `${symbol.toUpperCase()}:${timeframe}:${lastBarTimestamp}`;
}
