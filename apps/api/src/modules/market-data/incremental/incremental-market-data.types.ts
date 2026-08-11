export interface IncrementalMarketDataState {
  ticker: string;
  timeframe: string;
  lastTimestamp: string | null;
  firstTimestamp: string | null;
  barCount: number;
  provider: string | null;
  updatedAt: string;
  dataVersion: string;
  stale: boolean;
}
