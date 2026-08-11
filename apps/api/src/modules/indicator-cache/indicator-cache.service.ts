import { Injectable, Logger, Optional } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { IndicatorResult, OHLCV, Timeframe } from '../indicators/indicator.types';
import {
  INDICATOR_CACHE_DEFAULT_TTL_SECONDS,
  INDICATOR_CACHE_NAMESPACE,
  INDICATOR_CACHE_TTL_SECONDS,
  IndicatorCacheMetrics,
  indicatorCacheKey,
} from './indicator-cache.types';

@Injectable()
export class IndicatorCacheService {
  private readonly logger = new Logger(IndicatorCacheService.name);
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private calculations = 0;

  constructor(
    private readonly cache: CacheService,
    @Optional() private readonly engine?: IndicatorEngine,
  ) {}

  getOrCalculate(
    symbol: string,
    timeframe: Timeframe,
    ohlcv: OHLCV[],
    compute?: (data: OHLCV[], tf: Timeframe) => IndicatorResult[],
  ): IndicatorResult[] {
    if (!ohlcv || ohlcv.length === 0) return [];

    const lastBar = ohlcv[ohlcv.length - 1];
    const key = indicatorCacheKey(symbol, timeframe, lastBar.timestamp);
    const ttlMs = (INDICATOR_CACHE_TTL_SECONDS[timeframe] ?? INDICATOR_CACHE_DEFAULT_TTL_SECONDS) * 1000;

    const cached = this.cache.get<IndicatorResult[]>(key, INDICATOR_CACHE_NAMESPACE);
    if (cached !== undefined) {
      this.hits++;
      return cached;
    }
    this.misses++;

    const calculated = compute
      ? compute(ohlcv, timeframe)
      : this.engine
        ? this.engine.calculateAll(ohlcv, timeframe)
        : [];

    this.calculations++;
    if (calculated.length > 0) {
      this.cache.set(key, calculated, ttlMs, INDICATOR_CACHE_NAMESPACE);
      this.sets++;
    }
    return calculated;
  }

  getStats(): IndicatorCacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      calculations: this.calculations,
      calculationsSaved: this.hits,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}
