import { SUPPORTED_TIMEFRAMES } from '../interfaces/market-data.types';
import { PREDICTION_TIMEFRAME_MAPPING, PLATFORM_TIMEFRAMES } from '../coverage/coverage-report.types';

export interface IncrementalTimeframeConfig {
  timeframe: string;
  intervalMs: number;
  ttlMs: number;
  staleFactor: number;
}

export interface IncrementalMarketDataState {
  ticker: string;
  timeframe: string;
  lastTimestamp: string | null;
  firstTimestamp: string | null;
  barCount: number;
  provider: string;
  updatedAt: string;
  dataVersion: string;
  stale: boolean;
}

export const INCREMENTAL_TIMEFRAME_CONFIG: Record<string, IncrementalTimeframeConfig> = {
  '4h': { timeframe: '4h', intervalMs: 4 * 3_600_000, ttlMs: 12 * 3_600_000, staleFactor: 1.5 },
  '1d': { timeframe: '1d', intervalMs: 24 * 3_600_000, ttlMs: 48 * 3_600_000, staleFactor: 1.5 },
  '1w': { timeframe: '1w', intervalMs: 7 * 24 * 3_600_000, ttlMs: 14 * 24 * 3_600_000, staleFactor: 1.5 },
  '1m': { timeframe: '1m', intervalMs: 30 * 24 * 3_600_000, ttlMs: 60 * 24 * 3_600_000, staleFactor: 1.5 },
  '3m': { timeframe: '3m', intervalMs: 91 * 24 * 3_600_000, ttlMs: 182 * 24 * 3_600_000, staleFactor: 1.5 },
  '6m': { timeframe: '6m', intervalMs: 182 * 24 * 3_600_000, ttlMs: 365 * 24 * 3_600_000, staleFactor: 1.5 },
};

export const HISTORICAL_META_NAMESPACE = 'historicalMeta';

export function getIncrementalConfig(timeframe: string): IncrementalTimeframeConfig | undefined {
  return INCREMENTAL_TIMEFRAME_CONFIG[timeframe];
}

export function isSupportedTimeframe(timeframe: string): boolean {
  return (SUPPORTED_TIMEFRAMES as readonly string[]).includes(timeframe);
}

/**
 * Resolves a requested platform timeframe to the timeframe that must actually
 * be fetched from providers. The platform normalises derived intraday
 * timeframes (1h, 2h) to a fetchable source timeframe (4h) via the existing
 * PREDICTION_TIMEFRAME_MAPPING. This reuses the platform's existing
 * normalisation rather than introducing a second conversion layer, and keeps
 * 1h/2h and 4h requests on a single shared cache key (no duplicated data).
 */
export function resolveFetchableTimeframe(timeframe: string): string {
  return PREDICTION_TIMEFRAME_MAPPING[timeframe] ?? timeframe;
}

/**
 * A platform timeframe is "workable" by the incremental pipeline when its
 * resolved/fetchable form is natively fetchable (one of the 6 native
 * timeframes), or when it is a platform timeframe that normalises to one.
 */
export function isWorkableTimeframe(timeframe: string): boolean {
  if (PLATFORM_TIMEFRAMES.includes(timeframe)) return true;
  return isSupportedTimeframe(timeframe);
}

const TR_TIMEZONE_OFFSET_MS = 3 * 3_600_000;
const MARKET_OPEN_HOUR_TR = 10;
const MARKET_CLOSE_HOUR_TR = 18;

export function toTrTime(date: Date): Date {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60_000) + TR_TIMEZONE_OFFSET_MS);
}

export function isMarketOpen(date: Date): boolean {
  const tr = toTrTime(date);
  const day = tr.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = tr.getUTCHours();
  return hour >= MARKET_OPEN_HOUR_TR && hour <= MARKET_CLOSE_HOUR_TR;
}

export function computeFreshness(
  lastTimestamp: string | null,
  timeframe: string,
  now: number,
): 'fresh' | 'stale' | 'no-data' {
  if (!lastTimestamp) return 'no-data';
  const cfg = getIncrementalConfig(timeframe);
  if (!cfg) return 'no-data';

  const lastMs = new Date(lastTimestamp).getTime();
  if (Number.isNaN(lastMs)) return 'no-data';

  const age = now - lastMs;
  if (age <= cfg.intervalMs * cfg.staleFactor) return 'fresh';

  if (isMarketOpen(new Date(now))) return 'stale';
  return 'fresh';
}
