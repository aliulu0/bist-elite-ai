import { DataFreshness } from './latest-price-freshness.config';
export { DataFreshness } from './latest-price-freshness.config';

export interface LatestPriceState {
  symbol: string;
  timeframe: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  timestamp: string;
  provider: string;
  sourceTimeframe: string;
  dataFreshness: DataFreshness;
  lastSuccessfulUpdate: string;
  volume?: number;
}

export interface LatestPriceResult {
  success: boolean;
  state: LatestPriceState | null;
  providerCalls: number;
}

export interface ProviderMetricsSnapshot {
  provider: string;
  requestCount: number;
}
