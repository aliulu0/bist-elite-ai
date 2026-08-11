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
import { MarketDataOrchestrator } from './orchestrator/market-data-orchestrator';
import { ProviderHealthMonitorEngine } from '../provider-health-monitor/provider-health-monitor.engine';
import { ProviderName } from '../provider-health-monitor/provider-health-monitor.types';

export const DATA_PROVIDER = 'DATA_PROVIDER';

const PROVIDER_NAME_MAP: Record<string, ProviderName> = {
  'yahoo-finance': 'yahoo_finance',
  'fintables': 'fintables',
};

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly validationService: MarketDataValidationService,
    private readonly registry: MarketDataProviderRegistry,
    @Optional() @Inject(DATA_PROVIDER) private readonly defaultProvider?: IDataProvider,
    @Optional() private readonly healthMonitor?: ProviderHealthMonitorEngine,
    @Optional() private readonly orchestrator?: MarketDataOrchestrator,
  ) {}

  async fetchData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    if (this.orchestrator) {
      const result = await this.orchestrator.fetchHistoricalData(symbol, timeframe, options);
      return result?.data ?? [];
    }

    const provider = this.defaultProvider ?? (await this.registry.getActiveProvider());

    if (!provider) {
      this.logger.warn(`No active provider available for ${symbol}`);
      return [];
    }

    const startTime = Date.now();
    try {
      const raw = await provider.getHistoricalData(symbol, timeframe, options);
      const latencyMs = Date.now() - startTime;
      this.recordProviderRequest(provider.name, latencyMs, true);
      return this.validationService.validateDataPoints(raw);
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.recordProviderRequest(provider.name, latencyMs, false, errorMsg);
      this.logger.error(
        `Failed to fetch data for ${symbol} (${timeframe}) from ${provider.name}: ${errorMsg}`,
      );
      return [];
    }
  }

  async fetchLatest(symbol: string): Promise<MarketDataPoint | null> {
    if (this.orchestrator) {
      const result = await this.orchestrator.fetchLatestPrice(symbol);
      return result?.data ?? null;
    }

    const provider = this.defaultProvider ?? (await this.registry.getActiveProvider());

    if (!provider) {
      this.logger.warn(`No active provider available for ${symbol}`);
      return null;
    }

    const startTime = Date.now();
    try {
      const point = await provider.getLatestPrice(symbol);
      const latencyMs = Date.now() - startTime;
      this.recordProviderRequest(provider.name, latencyMs, true);
      if (!point) return null;

      const validated = this.validationService.validateDataPoints([point]);
      return validated[0] ?? null;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.recordProviderRequest(provider.name, latencyMs, false, errorMsg);
      this.logger.error(
        `Failed to fetch latest price for ${symbol} from ${provider.name}: ${errorMsg}`,
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

  private recordProviderRequest(
    providerName: string,
    latencyMs: number,
    success: boolean,
    error?: string,
  ): void {
    if (!this.healthMonitor) return;

    const monitorName = PROVIDER_NAME_MAP[providerName];
    if (!monitorName) return;

    try {
      this.healthMonitor.recordRequest(monitorName, latencyMs, success, false, error);
    } catch {
      // Health monitoring is optional - don't fail the main request
    }
  }
}
