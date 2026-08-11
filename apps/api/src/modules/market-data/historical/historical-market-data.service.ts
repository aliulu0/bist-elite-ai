import { Injectable, Logger, Optional, BadRequestException } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { MarketDataValidationService } from '../market-data-validation.service';
import { IncrementalMarketDataService } from '../incremental/incremental-market-data.service';
import { SymbolNormalizerService } from '../symbol-normalizer/symbol-normalizer.service';
import { SymbolRegistryService } from '../symbol-registry/symbol-registry.service';
import { RequestDeduplicatorService } from '../dedup/request-deduplicator.service';
import {
  IncrementalMarketDataState,
  computeFreshness,
  getIncrementalConfig,
  isWorkableTimeframe,
  resolveFetchableTimeframe,
  HISTORICAL_META_NAMESPACE,
} from '../incremental/incremental-timeframe.config';
import { MarketDataPoint } from '../interfaces';
import { HistoricalMarketDataConfig, getHistoricalMarketDataConfig } from './historical-market-data.config';
import * as calendar from './bist-trading-calendar';
import {
  HistoricalAllSymbolsReport,
  HistoricalBackfillInfo,
  HistoricalBackfillOptions,
  HistoricalBackfillResult,
  HistoricalBackfillRunRecord,
  HistoricalBackfillStatus,
  HistoricalCoverage,
  HistoricalQuality,
  HistoricalRange,
  SymbolHistoricalSource,
  SymbolHistoricalStatus,
  SymbolHistoricalSummary,
} from './historical-market-data.types';

export const HISTORICAL_BACKFILL_NAMESPACE = 'historicalBackfill';

const CACHE_TYPE_HISTORICAL = 'historical';
const CACHE_PROVIDER_ANY = 'any';

const DAY_MS = 24 * 3_600_000;

export interface HistoricalGapReport {
  symbol: string;
  timeframe: string;
  missingRanges: HistoricalRange[];
  gapCount: number;
  largestGap: number;
  duplicateTimestamps: number;
  outOfOrderCount: number;
  invalidOhlcCount: number;
  zeroOrNegativePriceCount: number;
  invalidVolumeCount: number;
  abnormalGaps: HistoricalRange[];
  providerDiscontinuities: number;
}

export interface HistoricalBackfillAllResult {
  timeframe: string;
  results: HistoricalBackfillResult[];
  failedSymbols: string[];
}

export interface HistoricalStatusOptions {
  startDate?: string;
  endDate?: string;
  now?: number;
}

@Injectable()
export class HistoricalMarketDataService {
  private readonly logger = new Logger(HistoricalMarketDataService.name);
  private readonly resolvedConfig: HistoricalMarketDataConfig;

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly cache: MarketDataCacheService,
    private readonly validationService: MarketDataValidationService,
    @Optional() private readonly incremental?: IncrementalMarketDataService,
    @Optional() private readonly normalizer?: SymbolNormalizerService,
    @Optional() private readonly symbolRegistry?: SymbolRegistryService,
    @Optional() private readonly deduplicator?: RequestDeduplicatorService,
    @Optional() config?: HistoricalMarketDataConfig,
  ) {
    this.resolvedConfig = config ?? getHistoricalMarketDataConfig();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async getSymbolStatus(symbol: string, timeframe: string, options?: HistoricalStatusOptions): Promise<SymbolHistoricalStatus> {
    const analysis = await this.analyze(symbol, timeframe, options);
    return analysis.status;
  }

  async getAllStatus(timeframe = '1d', options?: HistoricalStatusOptions): Promise<HistoricalAllSymbolsReport> {
    const fetchable = resolveFetchableTimeframe(timeframe);
    const now = options?.now ?? Date.now();
    const today = calendar.todayTrDate(now);
    const targetStart = options?.startDate ?? this.resolvedConfig.defaultStartDate;
    const targetEnd = options?.endDate ?? today;
    const symbols = this.activeSymbols();
    const minBars = this.minBarsFor(fetchable);

    const summaries: SymbolHistoricalSummary[] = [];
    let withHistory = 0;
    let withoutHistory = 0;
    let complete = 0;
    let incomplete = 0;
    let stale = 0;
    let invalid = 0;
    let coverageSum = 0;

    for (const ticker of symbols) {
      const normalized = this.normalizeSymbol(ticker);
      const cacheKey = this.cacheKeyFor(normalized, fetchable);
      const state = this.cache.get<IncrementalMarketDataState>(CACHE_PROVIDER_ANY, HISTORICAL_META_NAMESPACE, cacheKey);
      const barCount = state?.barCount ?? 0;
      const freshness = state?.lastTimestamp ? computeFreshness(state.lastTimestamp as string, fetchable, now) : 'no-data';
      const expected = this.expectedPeriods(targetStart, targetEnd, fetchable, now).length;
      const coveragePct =
        expected > 0 ? Math.min(100, Math.round(((barCount / expected) * 1000)) / 10) : 0;
      const usableForBacktest =
        barCount >= minBars && freshness !== 'no-data' && coveragePct >= this.resolvedConfig.minCoveragePctForBacktest;

      const summary: SymbolHistoricalSummary = {
        symbol: normalized,
        timeframe,
        status: freshness === 'no-data' ? 'empty' : freshness === 'stale' ? 'partial' : 'complete',
        barCount,
        firstTimestamp: state?.firstTimestamp ?? null,
        lastTimestamp: state?.lastTimestamp ?? null,
        provider: state?.provider ?? 'none',
        usableForBacktest,
      };
      summaries.push(summary);

      if (barCount > 0) {
        withHistory++;
        coverageSum += coveragePct;
      } else {
        withoutHistory++;
      }
      if (summary.status === 'complete') complete++;
      else if (summary.status === 'partial') incomplete++;
      if (freshness === 'stale') stale++;
      if (barCount > 0 && coveragePct < 50) invalid++;
    }

    return {
      generatedAt: new Date().toISOString(),
      timeframe,
      totalSymbols: symbols.length,
      symbolsWithHistory: withHistory,
      symbolsWithoutHistory: withoutHistory,
      averageCoverage: withHistory > 0 ? Math.round((coverageSum / withHistory) * 10) / 10 : 0,
      completeSymbols: complete,
      incompleteSymbols: incomplete,
      staleSymbols: stale,
      invalidSymbols: invalid,
      symbols: summaries,
    };
  }

  async getGaps(symbol: string, timeframe: string, options?: HistoricalStatusOptions): Promise<HistoricalGapReport> {
    const analysis = await this.analyze(symbol, timeframe, options);
    const { points, coverage } = analysis;
    const anomalies = this.analyzeAnomalies(points, timeframe, coverage.missingRanges);
    return {
      symbol: analysis.status.symbol,
      timeframe,
      missingRanges: coverage.missingRanges,
      gapCount: coverage.gapCount,
      largestGap: coverage.largestGap,
      ...anomalies,
    };
  }

  async getQuality(symbol: string, timeframe: string, options?: HistoricalStatusOptions): Promise<HistoricalQuality> {
    const analysis = await this.analyze(symbol, timeframe, options);
    return analysis.status.quality;
  }

  async getBackfillStatus(symbol: string, timeframe: string): Promise<HistoricalBackfillInfo> {
    const normalized = this.normalizeSymbol(symbol);
    const fetchable = resolveFetchableTimeframe(timeframe);
    const now = Date.now();
    const { points, state } = this.readData(normalized, fetchable);
    const coverage =
      points.length > 0
        ? this.computeCoverage(points, fetchable, this.resolvedConfig.defaultStartDate, calendar.todayTrDate(now), now)
        : { expectedBarCount: 0, actualBarCount: 0, coveragePercent: 0, gapCount: 0, largestGap: 0, missingRanges: [] };
    const info = this.computeBackfillInfo(normalized, fetchable, state, coverage, now);
    return info;
  }

  async backfill(symbol: string, timeframe: string, options: HistoricalBackfillOptions = {}): Promise<HistoricalBackfillResult> {
    const normalized = this.normalizeSymbol(symbol);
    if (!isWorkableTimeframe(timeframe)) {
      return {
        symbol: normalized,
        timeframe,
        status: 'failed',
        fetchedBars: 0,
        requestedRanges: 0,
        completedRanges: 0,
        failedRanges: 0,
        remainingRanges: 0,
        barCount: 0,
        message: 'Desteklenmeyen periyot.',
        missingRanges: [],
        warnings: [],
        actualProvider: null,
        fallbackUsed: false,
        providerAttempts: 0,
      };
    }
    const fetchable = resolveFetchableTimeframe(timeframe);
    const cacheKey = this.cacheKeyFor(normalized, fetchable);
    return this.dedupe(`backfill:${cacheKey}`, () => this.doBackfill(normalized, timeframe, fetchable, cacheKey, options));
  }

  async backfillAll(
    options: HistoricalBackfillOptions & { symbols?: string[]; timeframe?: string } = {},
  ): Promise<HistoricalBackfillAllResult> {
    const timeframe = options.timeframe ?? '1d';
    const symbols = options.symbols?.length ? options.symbols.map((s) => s.toUpperCase()) : this.activeSymbols();
    const results: HistoricalBackfillResult[] = [];
    const failedSymbols: string[] = [];
    for (const symbol of symbols) {
      try {
        results.push(await this.backfill(symbol, timeframe, options));
      } catch (error) {
        failedSymbols.push(symbol);
        this.logger.warn(`Bulk backfill failed for ${symbol}: ${this.describe(error)}`);
      }
    }
    return { timeframe, results, failedSymbols };
  }

  /**
   * Validated-history path for the Backtest Engine (cache + incremental only,
   * never a second provider pipeline). Returns null when no usable series is
   * available so the caller falls back to its existing data source.
   */
  async getValidatedHistory(symbol: string, timeframe: string, options?: HistoricalBackfillOptions): Promise<MarketDataPoint[] | null> {
    const normalized = this.normalizeSymbol(symbol);
    const fetchable = resolveFetchableTimeframe(timeframe);
    if (!isWorkableTimeframe(timeframe)) return null;

    const { points } = this.readData(normalized, fetchable);
    const cached = this.validatedPoints(points);
    if (cached.length >= 2) return cached;

    if (this.incremental) {
      try {
        const result = await this.incremental.fetchHistoricalData(normalized, timeframe, {
          startDate: options?.startDate,
          endDate: options?.endDate,
        });
        const data = this.validatedPoints(result?.data ?? []);
        if (data.length >= 2) return data;
      } catch (error) {
        this.logger.debug(`Incremental history unavailable for ${normalized}: ${this.describe(error)}`);
      }
    }
    return null;
  }

  // ── Analysis ───────────────────────────────────────────────────────────────

  private async analyze(
    symbol: string,
    timeframe: string,
    options?: HistoricalStatusOptions,
  ): Promise<{ status: SymbolHistoricalStatus; points: MarketDataPoint[]; coverage: HistoricalCoverage }> {
    const normalized = this.normalizeSymbol(symbol);
    const fetchable = resolveFetchableTimeframe(timeframe);
    const now = options?.now ?? Date.now();
    const today = calendar.todayTrDate(now);
    const targetStart = options?.startDate ?? this.resolvedConfig.defaultStartDate;
    const rawEnd = options?.endDate ?? today;
    const targetEnd = rawEnd > today ? today : rawEnd;

    const { points, state } = this.readData(normalized, fetchable);

    const firstPeriod = points.length > 0 ? this.periodKeyOf(points[0].timestamp, fetchable) : null;
    const lastPeriod = points.length > 0 ? this.periodKeyOf(points[points.length - 1].timestamp, fetchable) : null;
    const windowStart = firstPeriod ? calendar.maxDate(targetStart, firstPeriod) : targetStart;
    const windowEnd = lastPeriod ? calendar.minDate(targetEnd, lastPeriod) : targetEnd;

    const coverage = this.computeCoverage(points, fetchable, windowStart, windowEnd, now);
    const quality = this.computeQuality(points, fetchable, coverage, state, now);
    const backfill = this.computeBackfillInfo(normalized, fetchable, state, coverage, now);
    const statusLabel: SymbolHistoricalStatus['status'] =
      points.length === 0 ? 'empty' : coverage.gapCount === 0 ? 'complete' : 'partial';

    const status: SymbolHistoricalStatus = {
      symbol: normalized,
      timeframe,
      status: statusLabel,
      hasData: points.length > 0,
      barCount: points.length,
      firstTimestamp: points.length > 0 ? points[0].timestamp : null,
      lastTimestamp: points.length > 0 ? points[points.length - 1].timestamp : null,
      lastUpdated: state?.updatedAt ?? null,
      coverage,
      quality,
      source: this.buildSource(state),
      backfill,
    };
    return { status, points, coverage };
  }

  private computeCoverage(points: MarketDataPoint[], timeframe: string, windowStart: string, windowEnd: string, now: number): HistoricalCoverage {
    const expected = this.expectedPeriods(windowStart, windowEnd, timeframe, now);
    const expectedSet = new Set(expected);
    const present = new Set<string>();
    for (const point of points) {
      const key = this.periodKeyOf(point.timestamp, timeframe);
      if (expectedSet.has(key)) present.add(key);
    }
    const expectedBarCount = expected.length;
    const actualBarCount = present.size;
    const coveragePercent = expectedBarCount > 0 ? Math.round((actualBarCount / expectedBarCount) * 1000) / 10 : 0;
    const missingRanges = this.groupMissingIntoRanges(expected.filter((k) => !present.has(k)), timeframe);
    const largestGap = missingRanges.reduce((max, range) => Math.max(max, this.calendarDaysBetween(range.start, range.end)), 0);
    return {
      expectedBarCount,
      actualBarCount,
      coveragePercent,
      gapCount: missingRanges.length,
      largestGap,
      missingRanges,
    };
  }

  private computeQuality(
    points: MarketDataPoint[],
    timeframe: string,
    coverage: HistoricalCoverage,
    state: IncrementalMarketDataState | undefined,
    now: number,
  ): HistoricalQuality {
    if (points.length === 0) {
      return {
        qualityScore: 0,
        validationStatus: 'unknown',
        integrityValid: false,
        freshness: 'no-data',
        reason: 'Geçmiş veri yok.',
        usableForBacktest: false,
        lastAssessmentAt: null,
      };
    }
    const integrityValid = points.every((p) => p.validationStatus !== 'invalid');
    const validationStatus: HistoricalQuality['validationStatus'] = !integrityValid
      ? 'invalid'
      : points.some((p) => p.validationStatus === 'partial')
        ? 'partial'
        : 'valid';
    const lastTs = points[points.length - 1].timestamp;
    const freshness = computeFreshness(lastTs, timeframe, now);
    const minBars = this.minBarsFor(timeframe);
    const depthScore = Math.min(100, Math.round((coverage.actualBarCount / Math.max(1, minBars)) * 100));
    let qualityScore = Math.round((coverage.coveragePercent + depthScore) / 2);
    if (freshness === 'stale') qualityScore = Math.max(0, qualityScore - 10);

    const usableForBacktest =
      integrityValid &&
      coverage.coveragePercent >= this.resolvedConfig.minCoveragePctForBacktest &&
      points.length >= minBars;

    return {
      qualityScore,
      validationStatus,
      integrityValid,
      freshness,
      reason: usableForBacktest
        ? 'Backtest için yeterli tarihsel veri bulunuyor.'
        : this.backtestReason(coverage, points.length, minBars, integrityValid),
      usableForBacktest,
      lastAssessmentAt: state?.updatedAt ?? null,
    };
  }

  private backtestReason(coverage: HistoricalCoverage, barCount: number, minBars: number, integrityValid: boolean): string {
    if (!integrityValid) return 'Veri kalitesi yetersiz (OHLC doğrulama hatası).';
    if (coverage.coveragePercent < this.resolvedConfig.minCoveragePctForBacktest) return 'Veri aralığında boşluklar bulundu.';
    if (barCount < minBars) return 'Backtest için tarihsel veri yetersiz.';
    return 'Geçmiş veri eksik.';
  }

  private buildSource(state: IncrementalMarketDataState | undefined): SymbolHistoricalSource {
    return {
      provider: state?.provider ?? 'none',
      primaryProvider: state?.provider ?? null,
      fallbackUsed: false,
      providerAttempts: 0,
      cacheHit: !!state,
      lastUpdated: state?.updatedAt ?? null,
    };
  }

  private computeBackfillInfo(
    normalized: string,
    fetchable: string,
    state: IncrementalMarketDataState | undefined,
    coverage: HistoricalCoverage,
    now: number,
  ): HistoricalBackfillInfo {
    const record = this.readRunRecord(normalized, fetchable);
    const remainingRanges = coverage.missingRanges?.length ?? 0;
    const status = record?.status ?? 'idle';
    return {
      status,
      lastRunAt: record?.startedAt ?? null,
      lastError:
        status === 'failed' || status === 'partial' || status === 'STALE_BUT_VALID' ? (record?.message ?? null) : null,
      fetchedBars: record?.fetchedBars ?? 0,
      requestedRanges: record?.requestedRanges ?? 0,
      completedRanges: record?.completedRanges ?? 0,
      failedRanges: record?.failedRanges ?? 0,
      remainingRanges,
      message: this.statusMessage(status, remainingRanges, state?.lastTimestamp ?? null),
    };
  }

  private statusMessage(status: HistoricalBackfillStatus, remainingRanges: number, lastTimestamp: string | null): string {
    switch (status) {
      case 'running':
        return 'Backfill sürüyor.';
      case 'completed':
        return 'Backfill tamamlandı.';
      case 'partial':
        return 'Backfill kısmen tamamlandı; önceki geçerli veri korunarak kullanıldı.';
      case 'failed':
        return 'Backfill başarısız; önceki geçerli veri korunarak kullanıldı.';
      case 'STALE_BUT_VALID':
        return 'Önceki geçerli veri korunarak kullanıldı.';
      case 'no-data':
        return 'Sağlayıcılardan veri alınamadı.';
      default:
        if (remainingRanges > 0) return 'Veri aralığında boşluklar bulundu.';
        return lastTimestamp ? 'Geçmiş veri mevcut.' : 'Geçmiş veri bulunamadı.';
    }
  }

  // ── Gap detection ──────────────────────────────────────────────────────────

  private analyzeAnomalies(points: MarketDataPoint[], timeframe: string, missingRanges: HistoricalRange[]) {
    const seen = new Set<string>();
    let duplicateTimestamps = 0;
    let outOfOrderCount = 0;
    let invalidOhlcCount = 0;
    let zeroOrNegativePriceCount = 0;
    let invalidVolumeCount = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (seen.has(p.timestamp)) duplicateTimestamps++;
      seen.add(p.timestamp);
      if (i > 0 && new Date(p.timestamp).getTime() <= new Date(points[i - 1].timestamp).getTime()) outOfOrderCount++;
      if (p.validationStatus === 'invalid') invalidOhlcCount++;
      if (p.open <= 0 || p.high <= 0 || p.low <= 0 || p.close <= 0) zeroOrNegativePriceCount++;
      if (p.volume < 0) invalidVolumeCount++;
    }

    const intervalDays = (getIncrementalConfig(timeframe)?.intervalMs ?? 24 * 3_600_000) / DAY_MS;
    const abnormalGapThresholdDays = Math.max(intervalDays * 3, 3);
    const abnormalGaps = missingRanges.filter((range) => {
      return this.calendarDaysBetween(range.start, range.end) >= abnormalGapThresholdDays;
    });

    return {
      duplicateTimestamps,
      outOfOrderCount,
      invalidOhlcCount,
      zeroOrNegativePriceCount,
      invalidVolumeCount,
      abnormalGaps,
      providerDiscontinuities: 0,
    };
  }

  // ── Backfill ───────────────────────────────────────────────────────────────

  private async doBackfill(
    normalized: string,
    timeframe: string,
    fetchable: string,
    cacheKey: string,
    options: HistoricalBackfillOptions,
  ): Promise<HistoricalBackfillResult> {
    const now = options.now ?? Date.now();
    const today = calendar.todayTrDate(now);
    const targetStart = options.startDate ?? this.resolvedConfig.defaultStartDate;
    const rawEnd = options.endDate ?? today;
    const targetEnd = rawEnd > today ? today : rawEnd;
    if (targetStart > targetEnd) {
      throw new BadRequestException('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
    }

    const { points: existing, state } = this.readData(normalized, fetchable);
    const warnings: string[] = [];

    let missingRanges: HistoricalRange[];
    if (options.force) {
      missingRanges = [{ start: targetStart, end: targetEnd }];
    } else {
      missingRanges = this.computeCoverage(existing, fetchable, targetStart, targetEnd, now).missingRanges;
    }

    if (missingRanges.length === 0) {
      const record: HistoricalBackfillRunRecord = {
        status: 'completed',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        message: 'Veri zaten eksiksiz (boşluk bulunamadı).',
        fetchedBars: 0,
        requestedRanges: 0,
        completedRanges: 0,
        failedRanges: 0,
        missingRanges: [],
      };
      this.cacheRunRecord(normalized, fetchable, record);
      return {
        symbol: normalized,
        timeframe,
        status: 'completed',
        fetchedBars: 0,
        requestedRanges: 0,
        completedRanges: 0,
        failedRanges: 0,
        remainingRanges: 0,
        barCount: existing.length,
        message: record.message,
        missingRanges: [],
        warnings,
        actualProvider: state?.provider ?? null,
        fallbackUsed: false,
        providerAttempts: 0,
      };
    }

    if (missingRanges.length > this.resolvedConfig.maxRangesPerBackfill) {
      warnings.push(`Aşırı boşluk sayısı (${missingRanges.length}) tespit edildi; ilk ${this.resolvedConfig.maxRangesPerBackfill} aralık işlenecek.`);
      missingRanges = missingRanges.slice(0, this.resolvedConfig.maxRangesPerBackfill);
    }

    const concurrency = Math.max(
      1,
      Math.min(options.concurrency ?? this.resolvedConfig.defaultConcurrency, this.resolvedConfig.maxConcurrency),
    );

    const startedAt = new Date().toISOString();
    const runningRecord: HistoricalBackfillRunRecord = {
      status: 'running',
      startedAt,
      finishedAt: null,
      message: 'Backfill sürüyor.',
      fetchedBars: 0,
      requestedRanges: missingRanges.length,
      completedRanges: 0,
      failedRanges: 0,
      missingRanges,
    };
    this.cacheRunRecord(normalized, fetchable, runningRecord);

    let merged = [...existing];
    let fetchedBars = 0;
    let completedRanges = 0;
    let failedRanges = 0;
    const providersUsed = new Set<string>();
    let fallbackUsed = false;
    let providerAttempts = 0;

    const worker = async (range: HistoricalRange): Promise<void> => {
      try {
        const result = await this.orchestrator.fetchHistoricalRange(normalized, fetchable, {
          startDate: range.start,
          endDate: range.end,
        });
        if (result && result.data.length > 0) {
          merged = this.mergeAndDedupe(merged, result.data);
          fetchedBars += result.data.length;
          if (result.provider) providersUsed.add(result.provider);
          fallbackUsed = fallbackUsed || !!result.fallbackUsed;
          providerAttempts += result.attemptedProviders?.length ?? 1;
        }
        completedRanges++;
      } catch (error) {
        failedRanges++;
        warnings.push(`Aralık ${range.start} → ${range.end} alınamadı: ${this.describe(error)}`);
      }
    };

    await this.runWithConcurrency(missingRanges, concurrency, worker);

    const finalPoints = this.mergeAndDedupe(merged, []);
    const hadExisting = existing.length > 0;
    const failedAll = completedRanges === 0 && failedRanges > 0;

    let status: HistoricalBackfillStatus;
    if (finalPoints.length === 0) status = 'no-data';
    else if (failedAll) status = hadExisting ? 'STALE_BUT_VALID' : 'failed';
    else if (failedRanges > 0) status = hadExisting && fetchedBars === 0 ? 'STALE_BUT_VALID' : 'partial';
    else status = 'completed';

    const finalCoverage = this.computeCoverage(finalPoints, fetchable, targetStart, targetEnd, now);
    if (status === 'completed' && finalCoverage.missingRanges.length > 0) {
      // Provider returned less data than requested: never claim full success.
      status = 'partial';
    }

    const message = this.backfillResultMessage(status, fetchedBars, finalCoverage.missingRanges.length > 0);

    const actualProvider = Array.from(providersUsed)[0] ?? state?.provider ?? 'unknown';
    if (fetchedBars > 0 && finalPoints.length > 0) {
      const ttl = this.ttlFor(fetchable);
      this.cache.set(CACHE_PROVIDER_ANY, CACHE_TYPE_HISTORICAL, cacheKey, finalPoints, ttl);
      this.cache.set(CACHE_PROVIDER_ANY, HISTORICAL_META_NAMESPACE, cacheKey, this.buildState(finalPoints, actualProvider), ttl);
    }

    const record: HistoricalBackfillRunRecord = {
      status,
      startedAt,
      finishedAt: new Date().toISOString(),
      message,
      fetchedBars,
      requestedRanges: missingRanges.length,
      completedRanges,
      failedRanges,
      missingRanges: finalCoverage.missingRanges,
    };
    this.cacheRunRecord(normalized, fetchable, record);

    return {
      symbol: normalized,
      timeframe,
      status,
      fetchedBars,
      requestedRanges: missingRanges.length,
      completedRanges,
      failedRanges,
      remainingRanges: finalCoverage.missingRanges.length,
      barCount: finalPoints.length,
      message,
      missingRanges: finalCoverage.missingRanges,
      warnings,
      actualProvider: Array.from(providersUsed)[0] ?? state?.provider ?? null,
      fallbackUsed,
      providerAttempts,
    };
  }

  private backfillResultMessage(status: HistoricalBackfillStatus, fetchedBars: number, stillMissing = false): string {
    switch (status) {
      case 'no-data':
        return 'Sağlayıcılardan veri alınamadı.';
      case 'failed':
        return 'Backfill başarısız; veri korunamadı.';
      case 'STALE_BUT_VALID':
        return 'Önceki geçerli veri korunarak kullanıldı.';
      case 'partial':
        return stillMissing ? 'Provider yanıtı eksik; boşluklar korundu.' : 'Backfill kısmen tamamlandı; önceki geçerli veri korunarak kullanıldı.';
      case 'completed':
        return fetchedBars > 0 ? `${fetchedBars} yeni bar eklendi.` : 'Veri zaten eksiksiz (boşluk bulunamadı).';
      default:
        return 'Backfill sürüyor.';
    }
  }

  // ── Period / calendar helpers ─────────────────────────────────────────────

  private periodStartOf(dayKey: string, timeframe: string): string {
    switch (timeframe) {
      case '1w':
        return calendar.mondayOfWeek(dayKey);
      case '1m':
        return calendar.firstOfMonth(dayKey);
      case '3m':
        return calendar.firstOfQuarter(dayKey);
      case '6m':
        return calendar.firstOfHalf(dayKey);
      default:
        return dayKey;
    }
  }

  private periodEndOf(periodStart: string, timeframe: string): string {
    switch (timeframe) {
      case '1w':
        return calendar.sundayOfWeek(periodStart);
      case '1m':
        return calendar.lastOfMonth(periodStart);
      case '3m':
        return calendar.lastOfQuarter(periodStart);
      case '6m':
        return calendar.lastOfHalf(periodStart);
      default:
        return periodStart;
    }
  }

  private nextPeriodStart(periodStart: string, timeframe: string): string {
    switch (timeframe) {
      case '1w':
        return calendar.addDays(periodStart, 7);
      case '1m':
        return calendar.firstOfMonth(calendar.addDays(calendar.lastOfMonth(periodStart), 1));
      case '3m':
        return calendar.firstOfQuarter(calendar.addDays(calendar.lastOfQuarter(periodStart), 1));
      case '6m':
        return calendar.firstOfHalf(calendar.addDays(calendar.lastOfHalf(periodStart), 1));
      default:
        return calendar.nextTradingDay(periodStart);
    }
  }

  private expectedPeriodStarts(windowStart: string, windowEnd: string, timeframe: string): string[] {
    if (windowStart > windowEnd) return [];
    if (timeframe === '4h' || timeframe === '1d') {
      return calendar.eachTradingDay(windowStart, windowEnd);
    }
    const periods: string[] = [];
    let cursor = this.periodStartOf(windowStart, timeframe);
    while (cursor <= windowEnd) {
      periods.push(cursor);
      cursor = this.nextPeriodStart(cursor, timeframe);
    }
    return periods;
  }

  private expectedPeriods(windowStart: string, windowEnd: string, timeframe: string, now: number): string[] {
    const today = calendar.todayTrDate(now);
    return this.expectedPeriodStarts(windowStart, windowEnd, timeframe).filter((periodStart) => {
      return this.periodEndOf(periodStart, timeframe) < today;
    });
  }

  private periodKeyOf(timestamp: string, timeframe: string): string {
    return this.periodStartOf(calendar.toTrDate(timestamp), timeframe);
  }

  private groupMissingIntoRanges(missing: string[], timeframe: string): HistoricalRange[] {
    if (missing.length === 0) return [];
    const ranges: HistoricalRange[] = [];
    let start = missing[0];
    let prev = start;
    for (let i = 1; i < missing.length; i++) {
      const current = missing[i];
      if (current === this.nextPeriodStart(prev, timeframe)) {
        prev = current;
      } else {
        ranges.push({ start, end: this.periodEndOf(prev, timeframe) });
        start = current;
        prev = current;
      }
    }
    ranges.push({ start, end: this.periodEndOf(prev, timeframe) });
    return ranges;
  }

  private calendarDaysBetween(start: string, end: string): number {
    const from = new Date(`${start}T00:00:00Z`).getTime();
    const to = new Date(`${end}T00:00:00Z`).getTime();
    return Math.max(0, Math.round((to - from) / DAY_MS)) + 1;
  }

  // ── Data / cache helpers ───────────────────────────────────────────────────

  private readData(normalized: string, fetchable: string): { points: MarketDataPoint[]; state: IncrementalMarketDataState | undefined } {
    const cacheKey = this.cacheKeyFor(normalized, fetchable);
    const cached = this.cache.get<MarketDataPoint[]>(CACHE_PROVIDER_ANY, CACHE_TYPE_HISTORICAL, cacheKey);
    const state = this.cache.get<IncrementalMarketDataState>(CACHE_PROVIDER_ANY, HISTORICAL_META_NAMESPACE, cacheKey);
    const points = Array.isArray(cached) ? cached : [];
    return { points, state };
  }

  private readRunRecord(normalized: string, fetchable: string): HistoricalBackfillRunRecord | undefined {
    return this.cache.get<HistoricalBackfillRunRecord>(CACHE_PROVIDER_ANY, HISTORICAL_BACKFILL_NAMESPACE, this.cacheKeyFor(normalized, fetchable));
  }

  private cacheRunRecord(normalized: string, fetchable: string, record: HistoricalBackfillRunRecord): void {
    this.cache.set(CACHE_PROVIDER_ANY, HISTORICAL_BACKFILL_NAMESPACE, this.cacheKeyFor(normalized, fetchable), record, this.ttlFor(fetchable));
  }

  private buildState(points: MarketDataPoint[], provider: string): IncrementalMarketDataState {
    return {
      ticker: points[0]?.symbol ?? '',
      timeframe: points[0]?.timeframe ?? '',
      lastTimestamp: points.length > 0 ? points[points.length - 1].timestamp : null,
      firstTimestamp: points.length > 0 ? points[0].timestamp : null,
      barCount: points.length,
      provider,
      updatedAt: new Date().toISOString(),
      dataVersion: 'v1',
      stale: false,
    };
  }

  private mergeAndDedupe(existing: MarketDataPoint[], incoming: MarketDataPoint[]): MarketDataPoint[] {
    const validatedIncoming = this.validationService
      ? this.validationService.validateDataPoints(incoming).filter((p) => p.validationStatus !== 'invalid')
      : incoming;
    const byTs = new Map<string, MarketDataPoint>();
    for (const p of existing) byTs.set(p.timestamp, p);
    for (const p of validatedIncoming) byTs.set(p.timestamp, p);
    const merged = Array.from(byTs.values());
    merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (this.validationService && merged.length > 0) {
      try {
        return this.validationService.validateDataPoints(merged).filter((p) => p.validationStatus !== 'invalid');
      } catch {
        return merged;
      }
    }
    return merged;
  }

  private validatedPoints(points: MarketDataPoint[]): MarketDataPoint[] {
    return points.filter((p) => p.validationStatus !== 'invalid');
  }

  private minBarsFor(timeframe: string): number {
    return this.resolvedConfig.minBarsForBacktest[timeframe] ?? 1;
  }

  private ttlFor(timeframe: string): number {
    return getIncrementalConfig(timeframe)?.ttlMs ?? 24 * 3_600_000;
  }

  private activeSymbols(): string[] {
    const entries = this.symbolRegistry ? this.symbolRegistry.getActiveSymbols() : [];
    if (entries.length === 0) return [];
    return entries.map((e) => e.canonicalTicker).filter(Boolean);
  }

  private normalizeSymbol(symbol: string): string {
    return this.normalizer ? this.normalizer.normalize(symbol) : symbol.trim().toUpperCase();
  }

  private cacheKeyFor(normalized: string, fetchable: string): string {
    return `${normalized}|${fetchable}`;
  }

  private async runWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
    const queue = [...items];
    const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        await worker(item);
      }
    });
    await Promise.all(runners);
  }

  private dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
    return this.deduplicator ? this.deduplicator.execute(key, factory) : factory();
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
