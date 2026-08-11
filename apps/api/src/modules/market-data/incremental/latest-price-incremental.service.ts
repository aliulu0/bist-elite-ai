import { Injectable, Logger, Optional } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataValidationService } from '../market-data-validation.service';
import { SymbolNormalizerService } from '../symbol-normalizer/symbol-normalizer.service';
import { CacheService } from '../../../common/cache/cache.service';
import { MarketDataPoint } from '../interfaces';
import {
  DataFreshness,
  LATEST_PRICE_NAMESPACE,
  getLatestPriceTtl,
} from './latest-price-freshness.config';
import { LatestPriceState } from './latest-price.types';

export function latestPriceStateToDataPoint(state: LatestPriceState): MarketDataPoint {
  return {
    symbol: state.symbol,
    timeframe: state.timeframe as MarketDataPoint['timeframe'],
    open: state.previousPrice,
    high: Math.max(state.price, state.previousPrice),
    low: Math.min(state.price, state.previousPrice),
    close: state.price,
    volume: state.volume ?? 0,
    timestamp: state.timestamp,
    validationStatus: 'valid',
  };
}

function extractLatestPrice(point: MarketDataPoint): {
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
} {
  const price = point.close;
  const previousPrice = point.open;
  const change = price - previousPrice;
  const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
  return { price, previousPrice, change, changePercent };
}

const TIMEFRAME_MAPPING: Record<string, string> = {
  '1h': '4h',
  '2h': '4h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
  '1m': '1m',
  '3m': '3m',
  '6m': '6m',
};

@Injectable()
export class LatestPriceIncrementalService {
  private readonly logger = new Logger(LatestPriceIncrementalService.name);

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly cache: CacheService,
    private readonly validationService: MarketDataValidationService,
    @Optional() private readonly normalizer?: SymbolNormalizerService,
  ) {}

  async getLatestPriceIncremental(
    symbol: string,
    timeframe: string,
    options?: { forceRefresh?: boolean; cacheEnabled?: boolean },
  ): Promise<LatestPriceState | null> {
    const normalized = this.normalizeSymbol(symbol);
    const tf = this.normalizeTimeframe(timeframe);
    const cacheKey = `${normalized}:${tf}`;
    const cacheEnabled = options?.cacheEnabled ?? this.cacheEnabled();

    const now = Date.now();

    if (cacheEnabled) {
      const cached = this.cache.get<LatestPriceState>(cacheKey, LATEST_PRICE_NAMESPACE);
      if (cached) {
        const ageMs = now - new Date(cached.lastSuccessfulUpdate).getTime();
        const ttl = getLatestPriceTtl(tf);
        if (ageMs < ttl) {
          this.logger.debug(`Latest price cache hit for ${normalized} (${tf})`);
          return { ...cached, dataFreshness: DataFreshness.Fresh };
        }
        this.logger.debug(`Latest price cache stale for ${normalized} (${tf}), age=${ageMs}ms, ttl=${ttl}ms`);
      }
    }

    const forceRefresh = options?.forceRefresh ?? false;
    const orchestratorResult = await this.orchestrator.fetchLatestPrice(normalized, forceRefresh);

    if (orchestratorResult && orchestratorResult.data) {
      const validated = this.validateLatestPrice(orchestratorResult.data);
      if (validated) {
        const state = this.buildState(normalized, tf, validated, orchestratorResult.provider);
        if (cacheEnabled) {
          const ttl = getLatestPriceTtl(tf);
          this.cache.set(cacheKey, state, ttl, LATEST_PRICE_NAMESPACE);
        }
        return state;
      }
    }

    if (cacheEnabled) {
      const cached = this.cache.get<LatestPriceState>(cacheKey, LATEST_PRICE_NAMESPACE);
      if (cached) {
        this.logger.warn(`Provider failed for ${normalized} (${tf}), returning stale-but-valid cache`);
        return { ...cached, dataFreshness: DataFreshness.Stale };
      }
    }

    return null;
  }

  private validateLatestPrice(point: MarketDataPoint): MarketDataPoint | null {
    if (!point || typeof point.close !== 'number' || point.close <= 0) {
      this.logger.warn(`Latest price invalid (close <= 0 or missing) for ${point?.symbol ?? 'unknown'}`);
      return null;
    }
    if (!point.timestamp || Number.isNaN(new Date(point.timestamp).getTime())) {
      this.logger.warn(`Latest price invalid timestamp for ${point.symbol}`);
      return null;
    }
    if (!point.symbol || point.symbol.trim().length === 0) {
      this.logger.warn('Latest price missing symbol');
      return null;
    }
    return point;
  }

  private buildState(
    symbol: string,
    timeframe: string,
    point: MarketDataPoint,
    provider: string,
  ): LatestPriceState {
    const { price, previousPrice, change, changePercent } = extractLatestPrice(point);
    return {
      symbol,
      timeframe,
      price,
      previousPrice,
      change,
      changePercent,
      timestamp: point.timestamp,
      provider,
      sourceTimeframe: point.timeframe,
      dataFreshness: DataFreshness.Fresh,
      lastSuccessfulUpdate: new Date().toISOString(),
      volume: typeof point.volume === 'number' ? point.volume : undefined,
    };
  }

  private normalizeSymbol(symbol: string): string {
    return this.normalizer ? this.normalizer.normalize(symbol) : symbol.toUpperCase();
  }

  private normalizeTimeframe(timeframe: string): string {
    const tf = timeframe?.toLowerCase?.() ?? timeframe;
    return TIMEFRAME_MAPPING[tf] ?? '1d';
  }

  private cacheEnabled(): boolean {
    return this.cache.isEnabled();
  }

  getFreshnessMessage(freshness: string): string {
    switch (freshness) {
      case DataFreshness.Fresh:
        return 'Veri güncel.';
      case DataFreshness.Stale:
        return 'Veri gecikmeli.';
      case DataFreshness.NoData:
      default:
        return 'Veri yok.';
    }
  }

  getStaleProviderMessage(): string {
    return 'Provider yanıt vermedi, son geçerli veri kullanılıyor.';
  }

  getLastUpdateMessage(state: LatestPriceState): string {
    const dt = new Date(state.lastSuccessfulUpdate);
    return `Son güncelleme: ${dt.toLocaleString('tr-TR')}`;
  }
}
