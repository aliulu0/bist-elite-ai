import { resolveFetchableTimeframe } from './incremental-timeframe.config';

export const LATEST_PRICE_NAMESPACE = 'latestPrice';

export const LATEST_PRICE_TTL_MS: Record<string, number> = {
  '1h': 60_000,
  '2h': 60_000,
  '4h': 120_000,
  '1d': 300_000,
  '1w': 600_000,
  '1m': 900_000,
  '3m': 1_800_000,
  '6m': 3_600_000,
};

export function getLatestPriceTtl(timeframe: string): number {
  const tf = timeframe?.toLowerCase?.() ?? timeframe;
  const direct = LATEST_PRICE_TTL_MS[tf];
  if (direct) return direct;
  const resolved = resolveFetchableTimeframe(tf);
  if (LATEST_PRICE_TTL_MS[resolved]) return LATEST_PRICE_TTL_MS[resolved];
  return LATEST_PRICE_TTL_MS['1d'] ?? 300_000;
}

export enum DataFreshness {
  Fresh = 'fresh',
  Stale = 'stale',
  NoData = 'no-data',
}

export function isFresh(freshness: DataFreshness): boolean {
  return freshness === DataFreshness.Fresh;
}
