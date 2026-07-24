import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import {
  MarketDataPoint,
  FetchOptions,
  IDataProvider,
  Timeframe,
  SUPPORTED_TIMEFRAMES,
} from './interfaces';
import { MarketDataValidationService } from './market-data-validation.service';
import { MarketDataProviderRegistry } from './market-data.provider-registry';

export const DATA_PROVIDER = 'DATA_PROVIDER';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly validationService: MarketDataValidationService,
    private readonly registry: MarketDataProviderRegistry,
    @Optional() @Inject(DATA_PROVIDER) private readonly defaultProvider?: IDataProvider,
  ) {}

  async fetchData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    const provider = this.defaultProvider ?? (await this.registry.getActiveProvider());

    if (!provider) {
      this.logger.warn(`No active provider available for ${symbol}`);
      return [];
    }

    try {
      const raw = await provider.getHistoricalData(symbol, timeframe, options);
      return this.validationService.validateDataPoints(raw);
    } catch (error) {
      this.logger.error(
        `Failed to fetch data for ${symbol} (${timeframe}) from ${provider.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async fetchLatest(symbol: string): Promise<MarketDataPoint | null> {
    const provider = this.defaultProvider ?? (await this.registry.getActiveProvider());

    if (!provider) {
      this.logger.warn(`No active provider available for ${symbol}`);
      return null;
    }

    try {
      const point = await provider.getLatestPrice(symbol);
      if (!point) return null;

      const validated = this.validationService.validateDataPoints([point]);
      return validated[0] ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch latest price for ${symbol} from ${provider.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  getSupportedTimeframes(): string[] {
    return [...SUPPORTED_TIMEFRAMES];
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    return this.registry.healthCheck();
  }

  getAvailableProviders(): string[] {
    return this.registry.getSupportedProviders();
  }

  isTimeframeSupported(timeframe: string): boolean {
    return (SUPPORTED_TIMEFRAMES as readonly string[]).includes(timeframe);
  }
}
