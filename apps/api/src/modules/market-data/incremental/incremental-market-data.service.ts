import { Injectable, Logger, Optional } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { MarketDataValidationService } from '../market-data-validation.service';
import { SymbolNormalizerService } from '../symbol-normalizer/symbol-normalizer.service';
import { MarketDataConfig, getMarketDataConfig } from '../config/market-data.config';
import { CacheService } from '../../../common/cache/cache.service';
import { getCacheConfig } from '../../../common/cache/cache.config';
import { MarketDataPoint, FetchOptions } from '../interfaces';
import { IncrementalQualityReport, MarketDataResult, IncrementalUpdate } from '../interfaces/unified-domain.types';
import {
  IncrementalMarketDataState,
  IncrementalTimeframeConfig,
  getIncrementalConfig,
  isSupportedTimeframe,
  resolveFetchableTimeframe,
  isWorkableTimeframe,
  computeFreshness,
  HISTORICAL_META_NAMESPACE,
} from './incremental-timeframe.config';

export interface IncrementalFetchOptions extends FetchOptions {
  forceRefresh?: boolean;
}

function tsOf(point: MarketDataPoint): number {
  return new Date(point.timestamp).getTime();
}

function latestTimestamp(points: MarketDataPoint[]): string | number | null {
  if (!points || points.length === 0) return null;
  let best = points[0];
  for (const p of points) if (tsOf(p) > tsOf(best)) best = p;
  return best.timestamp;
}

function earliestTimestamp(points: MarketDataPoint[]): string | null {
  if (!points || points.length === 0) return null;
  let best = points[0];
  for (const p of points) if (tsOf(p) < tsOf(best)) best = p;
  return best.timestamp;
}

const NOW = new Date().toISOString();

interface QualityAssessor {
  assess(context: {
    price: MarketDataPoint | null;
    history: MarketDataPoint[];
    fundamental?: unknown;
    consensus?: unknown;
    priceProvider?: string;
    priceTimestamp?: string;
    providers: string[];
    now: number;
  }): Promise<{
    status: string;
    qualityScore: number;
    marketIntegrity: { valid: boolean; errors: string[]; warnings: string[] };
    freshness: { overall: string };
  }>;
}

@Injectable()
export class IncrementalMarketDataService {
  private readonly logger = new Logger(IncrementalMarketDataService.name);
  private qualityAssessor: QualityAssessor | null | undefined;

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly cache: MarketDataCacheService,
    private readonly validationService: MarketDataValidationService,
    @Optional() private readonly normalizer?: SymbolNormalizerService,
    @Optional() private readonly config?: MarketDataConfig,
  ) {}

  async fetchHistoricalData(
    symbol: string,
    timeframe: string,
    options?: IncrementalFetchOptions,
  ): Promise<MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate } | null> {
    if (!isWorkableTimeframe(timeframe)) {
      return null;
    }

    // Reuse the platform's existing timeframe normalisation: derived intraday
    // timeframes (1h, 2h) are served from their fetchable source (4h). This
    // keeps 1h/2h and 4h on a single shared cache key -> zero duplicated data.
    const fetchable = resolveFetchableTimeframe(timeframe);
    const normalizedForCache = isSupportedTimeframe(fetchable) ? fetchable : timeframe;
    if (!isSupportedTimeframe(normalizedForCache)) {
      return null;
    }
    const cfg: IncrementalTimeframeConfig | undefined = getIncrementalConfig(normalizedForCache);
    const cacheFetchable = normalizedForCache;
    const normalized = this.normalizer ? this.normalizer.normalize(symbol) : symbol.toUpperCase();
    const cacheKey = `${normalized}|${cacheFetchable}`;
    const now = Date.now();

    const cached = this.cache.get<MarketDataPoint[]>('any', 'historical', cacheKey);
    const state = this.cache.get<IncrementalMarketDataState>('any', HISTORICAL_META_NAMESPACE, cacheKey);
    const existing: MarketDataPoint[] = Array.isArray(cached) ? cached : [];
    const lastTs = state?.lastTimestamp ?? latestTimestamp(existing);
    const previousBarCount = existing.length;

    if (existing.length > 0 && !options?.forceRefresh) {
      const freshness = computeFreshness(lastTs as string, cacheFetchable, now);
      if (freshness === 'fresh') {
        return this.buildResult(existing, 'cache', fetchable !== timeframe ? fetchable : undefined, {
          cacheHit: true,
          incrementalUpdate: false,
          providerUsed: state?.provider ?? null,
          previousBarCount,
          newBarCount: 0,
          mergedBarCount: previousBarCount,
          lastCachedTimestamp: lastTs as string,
          latestTimestamp: latestTimestamp(existing) as string,
          dataFreshness: 'fresh',
          validationStatus: 'validated',
        });
      }
    }

    if (previousBarCount === 0) {
      const result = await this.doFullFetch(
        normalized,
        cacheFetchable,
        cacheKey,
        cfg,
        options,
        existing,
        previousBarCount,
        lastTs as string,
      );
      return this.withSourceTimeframe(result, fetchable, timeframe);
    }

    const result = await this.doIncrementalFetch(
      normalized,
      cacheFetchable,
      cacheKey,
      cfg,
      options,
      existing,
      previousBarCount,
      lastTs as string,
    );
    return this.withSourceTimeframe(result, fetchable, timeframe);
  }

  private withSourceTimeframe(
    result: MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate } | null,
    fetchable: string,
    requested: string,
  ): MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate } | null {
    if (!result) return result;
    if (fetchable !== requested) {
      result.sourceTimeframe = fetchable;
    }
     return result;
  }

  /**
   * Lazily loads FinancialDataQualityService to avoid a circular module
   * dependency (FinancialRulesModule imports MarketDataModule). Reuses the
   * existing service "where appropriate" by enriching the merged OHLCV series
   * with a market-integrity + freshness assessment. Never affects the hard
   * OHLCV validation performed by MarketDataValidationService above.
   */
  protected loadQualityAssessor(): QualityAssessor | null {
    if (this.qualityAssessor !== undefined) return this.qualityAssessor;
    this.qualityAssessor = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FinancialDataQualityService } = require('../../financial-rules/financial-data-quality.service');
      const disabledCache = getCacheConfig({ enabled: false });
      const assessor = new FinancialDataQualityService(new CacheService(disabledCache));
      this.qualityAssessor = assessor as unknown as QualityAssessor;
    } catch {
      this.qualityAssessor = null;
    }
    return this.qualityAssessor;
  }

  protected async enrichQuality(
    history: MarketDataPoint[],
    provider: string,
  ): Promise<IncrementalQualityReport | undefined> {
    const assessor = this.loadQualityAssessor();
    if (!assessor || history.length === 0) return undefined;
    const last = history[history.length - 1];
    try {
      const report = await assessor.assess({
        price: last,
        history,
        priceProvider: provider,
        priceTimestamp: last.timestamp,
        providers: [provider],
        fundamental: null,
        consensus: null,
        now: Date.now(),
      });
      return {
        score: report.qualityScore,
        status: report.status,
        integrityValid: report.marketIntegrity.valid,
        freshnessOverall: report.freshness.overall,
        warnings: report.marketIntegrity.warnings,
        errors: report.marketIntegrity.errors,
      };
    } catch (error) {
      this.logger.debug(`FinancialDataQualityService enrichment skipped: ${this.describe(error)}`);
      return undefined;
    }
  }

  private async doFullFetch(
    symbol: string,
    timeframe: string,
    cacheKey: string,
    cfg: IncrementalTimeframeConfig | undefined,
    options: IncrementalFetchOptions | undefined,
    existing: MarketDataPoint[],
    previousBarCount: number,
    lastTs: string,
  ): Promise<MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate }> {
    const providerOpts: FetchOptions = {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
    };

    let fetched: MarketDataResult<MarketDataPoint[]> | null;
    try {
      fetched = await this.orchestrator.fetchHistoricalData(symbol, timeframe, providerOpts);
    } catch (error) {
      this.logger.warn(`Incremental full fetch failed for ${symbol} (${timeframe}): ${this.describe(error)}`);
      if (existing.length > 0) {
        return this.buildStale(existing, previousBarCount, lastTs, 'network-failure');
      }
      return this.buildResult([], 'none', undefined, {
        cacheHit: false,
        incrementalUpdate: false,
        providerUsed: null,
        previousBarCount,
        newBarCount: 0,
        mergedBarCount: 0,
        lastCachedTimestamp: lastTs,
        latestTimestamp: null,
        dataFreshness: 'no-data',
        validationStatus: 'none',
      });
    }

    if (!fetched || fetched.data.length === 0) {
      if (existing.length > 0) {
        return this.buildStale(existing, previousBarCount, lastTs, 'no-new-data');
      }
      return this.buildResult([], fetched?.provider ?? 'none', undefined, {
        cacheHit: false,
        incrementalUpdate: false,
        providerUsed: fetched?.provider ?? null,
        previousBarCount,
        newBarCount: 0,
        mergedBarCount: 0,
        lastCachedTimestamp: lastTs,
        latestTimestamp: null,
        dataFreshness: 'no-data',
        validationStatus: 'none',
      });
    }

    const points = fetched.data;
    const ttl = cfg?.ttlMs ?? this.defaultTtlMs();
    this.cache.set('any', 'historical', cacheKey, points, ttl);
    this.cache.set('any', HISTORICAL_META_NAMESPACE, cacheKey, this.buildState(points, fetched.provider), ttl);
    const result = this.buildResult(points, fetched.provider, undefined, {
      cacheHit: false,
      incrementalUpdate: false,
      providerUsed: fetched.provider,
      previousBarCount,
      newBarCount: points.length,
      mergedBarCount: points.length,
      lastCachedTimestamp: lastTs,
      latestTimestamp: latestTimestamp(points) as string,
      dataFreshness: 'fresh',
      validationStatus: this.validationStatusOf(fetched),
    });
    result.quality = await this.enrichQuality(points, fetched.provider);
    return result;
  }

  private async doIncrementalFetch(
    symbol: string,
    timeframe: string,
    cacheKey: string,
    cfg: IncrementalTimeframeConfig | undefined,
    options: IncrementalFetchOptions | undefined,
    existing: MarketDataPoint[],
    previousBarCount: number,
    lastTs: string,
  ): Promise<MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate } | null> {
    const rangeOptions: FetchOptions = {
      startDate: lastTs,
      endDate: options?.endDate,
    };

    let rangeResult: MarketDataResult<MarketDataPoint[]> | null = null;
    try {
      rangeResult = await this.orchestrator.fetchHistoricalRange(symbol, timeframe, rangeOptions);
    } catch (error) {
      this.logger.warn(`Incremental range fetch failed for ${symbol} (${timeframe}): ${this.describe(error)}`);
    }

    if (rangeResult && rangeResult.data.length > 0) {
      const incoming = rangeResult.data;
      const lastTsEpoch = new Date(lastTs).getTime();
      const merged = this.mergeAndDedupe(existing, incoming);
      const newBars = incoming.filter((p) => tsOf(p) > lastTsEpoch + 1);
      const ttl = cfg?.ttlMs ?? this.defaultTtlMs();
      this.cache.set('any', 'historical', cacheKey, merged, ttl);
      this.cache.set('any', HISTORICAL_META_NAMESPACE, cacheKey, this.buildState(merged, rangeResult.provider), ttl);
      const result = this.buildResult(merged, rangeResult.provider, undefined, {
        cacheHit: false,
        incrementalUpdate: newBars.length > 0,
        providerUsed: rangeResult.provider,
        previousBarCount,
        newBarCount: newBars.length,
        mergedBarCount: merged.length,
        lastCachedTimestamp: lastTs,
        latestTimestamp: latestTimestamp(merged) as string,
        dataFreshness: 'stale',
        validationStatus: this.validationStatusOf(rangeResult),
      });
      result.quality = await this.enrichQuality(merged, rangeResult.provider);
      return result;
    }

    if (rangeResult && rangeResult.data.length === 0) {
      const freshness = computeFreshness(lastTs, timeframe, Date.now());
      if (freshness === 'fresh') {
        return this.buildResult(existing, 'cache', undefined, {
          cacheHit: true,
          incrementalUpdate: false,
          providerUsed: null,
          previousBarCount,
          newBarCount: 0,
          mergedBarCount: previousBarCount,
          lastCachedTimestamp: lastTs,
          latestTimestamp: latestTimestamp(existing) as string,
          dataFreshness: freshness,
          validationStatus: 'validated',
        });
      }
    }

    return this.doFullFetch(symbol, timeframe, cacheKey, cfg, options, existing, previousBarCount, lastTs);
  }

  private mergeAndDedupe(existing: MarketDataPoint[], incoming: MarketDataPoint[]): MarketDataPoint[] {
    const validatedIncoming = this.validationService
      ? this.validationService.validateDataPoints(incoming).filter((p) => p.validationStatus !== 'invalid')
      : incoming;
    const byTs = new Map<string, MarketDataPoint>();
    for (const p of existing) byTs.set(p.timestamp, p);
    for (const p of validatedIncoming) byTs.set(p.timestamp, p);
    const merged = Array.from(byTs.values());
    merged.sort((a, b) => tsOf(a) - tsOf(b));
    if (this.validationService && merged.length > 0) {
      try {
        return this.validationService.validateDataPoints(merged).filter((p) => p.validationStatus !== 'invalid');
      } catch {
        return merged;
      }
    }
    return merged;
  }

  private buildState(points: MarketDataPoint[], provider: string): IncrementalMarketDataState {
    return {
      ticker: points.length ? points[0].symbol : '',
      timeframe: points.length ? points[0].timeframe : '',
      lastTimestamp: latestTimestamp(points) as string,
      firstTimestamp: earliestTimestamp(points),
      barCount: points.length,
      provider,
      updatedAt: NOW,
      dataVersion: 'v1',
      stale: false,
    };
  }

  private buildStale(
    existing: MarketDataPoint[],
    previousBarCount: number,
    lastTs: string,
    reason: string,
  ): MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate } {
    return this.buildResult(existing, 'cache', undefined, {
      cacheHit: true,
      incrementalUpdate: false,
      providerUsed: null,
      previousBarCount,
      newBarCount: 0,
      mergedBarCount: existing.length,
      lastCachedTimestamp: lastTs,
      latestTimestamp: latestTimestamp(existing) as string,
      dataFreshness: 'stale',
      validationStatus: 'validated',
      stale: true,
    });
  }

  private buildResult(
    data: MarketDataPoint[],
    provider: string,
    sourceTimeframe: string | undefined,
    incremental: IncrementalUpdate,
  ): MarketDataResult<MarketDataPoint[]> & { incremental: IncrementalUpdate } {
    return {
      data,
      provider,
      cached: provider === 'cache',
      timestamp: NOW,
      sourceTimeframe,
      validated: incremental.validationStatus === 'validated',
      incremental,
    };
  }

  private validationStatusOf(result: MarketDataResult<MarketDataPoint[]>): 'validated' | 'unvalidated' | 'invalid' | 'none' {
    if (!result.validated) return 'unvalidated';
    if (result.dataQuality === 'INVALID') return 'invalid';
    return 'validated';
  }

  private defaultTtlMs(): number {
    return this.config?.cache.historicalTtlMs ?? getMarketDataConfig().cache.historicalTtlMs;
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
