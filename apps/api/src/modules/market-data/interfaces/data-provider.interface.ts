import { MarketDataPoint, FetchOptions } from './market-data.types';

export interface IDataProvider {
  readonly name: string;

  getHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]>;

  getLatestPrice(symbol: string): Promise<MarketDataPoint | null>;

  getAvailableTimeframes(): string[];

  validateConnection(): Promise<boolean>;
}
