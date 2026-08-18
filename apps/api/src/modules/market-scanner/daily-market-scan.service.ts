import { Injectable, Logger, Optional } from '@nestjs/common';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { MarketScannerEngine } from './market-scanner.engine';
import { OpportunityRadarService } from './opportunity-radar.service';
import { CacheService } from '../../common/cache/cache.service';
import { AnalysisService } from '../analysis-pipeline/analysis.service';
import { mapToSymbolAnalysis } from '../scheduler/jobs/analysis-result.mapper';
import { DailyScanNotifierService } from './daily-scan.notifier.service';
import { MarketDataPoint, Timeframe } from '../market-data/interfaces';
import {
  SymbolAnalysis,
  ScannerResult,
  ScannerProvenance,
  DataStatus,
} from './market-scanner.types';
import {
  DailyScanRunOptions,
  DailyScanResponse,
  DailyScanSummary,
  DailyScanStatus,
  OpportunityRadarEvent,
  ProviderScanSummary,
  ScannerRankingResultEntry,
  ScannerRankingSnapshot,
} from './daily-scan.types';
import {
  computeReturn1D,
  computeReturnMultiDay,
  computeSMA,
  computeRSI,
  computeMACD,
  computeBreakoutFeatures,
  determineMarketRegime,
  determineMultiTimeframeConfluence,
  determineEarlyOpportunityClassification,
  determineScannerSignalQuality,
  buildTimeframeData,
  MultiTimeframeAnalysis,
} from '../market-data/services/scanner-features.service';
import {
  DailyScanConfig,
  getDailyScanConfig,
  parseDailyScanConfigFromEnv,
} from './daily-scan.config';
import { EarlyOpportunityClassification, ScannerSignalQuality } from './market-scanner.types';

const SCANNER_TIMEFRAMES: Timeframe[] = ['1d', '1w'];
const OPPORTUNITY_STATES = new Set<EarlyOpportunityClassification>([
  'EARLY_ACCUMULATION',
  'PRE_BREAKOUT',
  'BREAKOUT',
  'MOMENTUM',
]);

interface DiscoveredCandidate {
  ticker: string;
  yahooTicker: string;
  instrumentType: unknown;
  sector: string | null;
  currency: string;
}

interface AnalyzedCandidate {
  analysis: SymbolAnalysis;
  entry: ScannerRankingResultEntry;
}

/**
 * R2-078 — Full BIST Daily Scan.
 *
 * Single entry point for the production daily scan. Reuses:
 *   - MarketDataOrchestrator (universe discovery + market data + cache + dedup)
 *   - AnalysisService (existing Elite Score pipeline)
 *   - MarketScannerEngine (ranking / filters)
 *   - OpportunityRadarService (previous/current comparison + radar events)
 *   - CacheService (snapshot persistence namespace — NOT a second market-data cache)
 *
 * It NEVER fabricates data. Unavailable values stay null / UNAVAILABLE.
 * Provider budget is respected through bounded concurrency and orchestrator
 * caching/deduplication.
 */
@Injectable()
export class DailyMarketScanService {
  private readonly logger = new Logger(DailyMarketScanService.name);
  private readonly config: DailyScanConfig;

  constructor(
    private readonly engine: MarketScannerEngine,
    private readonly radarService: OpportunityRadarService,
    @Optional() private readonly orchestrator?: MarketDataOrchestrator,
    @Optional() private readonly cacheService?: CacheService,
    @Optional() private readonly analysisService?: AnalysisService,
    @Optional() private readonly notifier?: DailyScanNotifierService,
    @Optional() config?: Partial<DailyScanConfig>,
  ) {
    this.config = getDailyScanConfig({ ...parseDailyScanConfigFromEnv(), ...config });
  }

  getConfig(): DailyScanConfig {
    return this.config;
  }

  /**
   * Run the daily scan.
   *
   * Flow:
   *   universe discovery -> equity filtering -> per-symbol analysis
   *   (existing Elite Score) + real scanner features -> MarketScannerEngine
   *   -> snapshot -> previous/current comparison -> radar events.
   */
  async runDailyScan(options: DailyScanRunOptions = {}): Promise<DailyScanResponse> {
    const scanStart = Date.now();
    const scanId = this.generateScanId();
    const scanTimestamp = new Date().toISOString();

    const previous = this.loadCurrentSnapshot();

    const universe = await this.orchestrator!.discoverUniverse();
    const universeSize = universe.discoveredCount;
    const equityCandidates = universe.symbols.filter(
      (s) => s.status === 'AVAILABLE' && s.instrumentType !== null,
    ) as unknown as DiscoveredCandidate[];
    const equityCandidateCount = equityCandidates.length;

    const maxSymbols = options.maxSymbols ?? this.config.maxSymbolsPerScan;
    const candidates = maxSymbols > 0 ? equityCandidates.slice(0, maxSymbols) : equityCandidates;

    const analyzed = await this.analyzeBatch(candidates);
    const analyses = analyzed.map((a) => a.analysis);
    const rawEntries = analyzed.map((a) => a.entry);

    // Existing scanner engine ranks by its composite score; snapshot presents
    // the results with Elite Score as primary (deterministic tie-breakers).
    const scanResult = this.engine.scan(analyses);
    const statusBySymbol = new Map<string, 'TOP_CANDIDATE' | 'WATCHLIST' | 'REJECTED'>();
    for (const item of scanResult.topCandidates) statusBySymbol.set(item.symbol, 'TOP_CANDIDATE');
    for (const item of scanResult.watchlist) statusBySymbol.set(item.symbol, 'WATCHLIST');
    for (const item of scanResult.rejected) statusBySymbol.set(item.symbol, 'REJECTED');

    const ranked = this.radarService.rankEntries(rawEntries);
    ranked.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.status = statusBySymbol.get(entry.symbol) ?? 'REJECTED';
    });

    const eligibleCount = ranked.filter((r) => r.status === 'TOP_CANDIDATE').length;
    const signalCount = ranked.filter((r) =>
      OPPORTUNITY_STATES.has(r.earlyOpportunityClassification),
    ).length;
    const status: DailyScanStatus =
      analyzed.length === 0
        ? 'FAILED'
        : candidates.length > 0 && analyzed.length < candidates.length
          ? 'PARTIAL'
          : 'COMPLETE';

    const snapshot: ScannerRankingSnapshot = {
      scanId,
      scanTimestamp,
      marketTimestamp: scanTimestamp,
      version: '1.0.0',
      schemaVersion: 1,
      status,
      universeSize,
      equityCandidateCount,
      evaluatedCount: candidates.length,
      eligibleCount,
      signalCount,
      availableCount: analyzed.length,
      unavailableCount: universe.byStatus['UNAVAILABLE'] ?? 0,
      rateLimitedCount: universe.byStatus['RATE_LIMITED'] ?? 0,
      failedCount: candidates.length - analyzed.length,
      results: ranked,
      providerSummary: this.buildProviderSummary(universe.byStatus, analyzed.length),
      dataQuality: ranked.length > 0 ? 'VALID' : 'UNAVAILABLE',
      coverage:
        ranked.length >= equityCandidateCount && equityCandidateCount > 0
          ? 'FULL'
          : ranked.length > 0
            ? 'PARTIAL'
            : 'UNAVAILABLE',
      executionDurationMs: Date.now() - scanStart,
    };

    this.storeSnapshot(snapshot, previous);

    const events = this.radarService.detectRadarEvents(previous, snapshot, {
      radarEventThresholds: this.config.radarEventThresholds,
    });
    this.storeRadarEvents(snapshot.scanId, events);

    const summary = this.buildSummary(snapshot, events);
    this.logger.log(
      `Daily scan ${scanId} completed: ${analyzed.length}/${candidates.length} analyzed, ` +
        `${eligibleCount} eligible, ${signalCount} signals, ${events.length} radar events`,
    );

    // Telegram delivery is optional and isolated: a failure must never fail the scan.
    if (this.notifier) {
      this.notifier
        .notifyScanComplete({ scanId, status, summary, timestamp: scanTimestamp })
        .catch((error) => this.logger.warn(`Daily scan notification rejected: ${String(error)}`));
    }

    return {
      scanId,
      status,
      summary,
      timestamp: scanTimestamp,
    };
  }

  getLatestSnapshot(): ScannerRankingSnapshot | null {
    return (
      this.cacheService?.get<ScannerRankingSnapshot>('current', this.config.snapshotNamespace) ??
      null
    );
  }

  getLatestRadarEvents(): OpportunityRadarEvent[] {
    const snapshot = this.getLatestSnapshot();
    if (!snapshot) return [];
    return (
      this.cacheService?.get<OpportunityRadarEvent[]>(
        `events:${snapshot.scanId}`,
        this.config.snapshotNamespace,
      ) ?? []
    );
  }

  getScanSummary(): DailyScanSummary | null {
    const snapshot = this.getLatestSnapshot();
    if (!snapshot) return null;
    const events = this.getLatestRadarEvents();
    return this.buildSummary(snapshot, events);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async analyzeBatch(candidates: DiscoveredCandidate[]): Promise<AnalyzedCandidate[]> {
    const results: AnalyzedCandidate[] = [];
    const concurrency = this.config.concurrency;
    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      const settled = await Promise.allSettled(batch.map((c) => this.analyzeCandidate(c)));
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value) {
          results.push(r.value);
        }
      }
    }
    return results;
  }

  private async analyzeCandidate(
    candidate: DiscoveredCandidate,
  ): Promise<AnalyzedCandidate | null> {
    const ticker = candidate.ticker;
    const yahooTicker = candidate.yahooTicker;
    try {
      const symbolAnalysis = await this.obtainSymbolAnalysis(ticker);
      if (!symbolAnalysis) return null;

      const scanner = await this.buildScannerFeatures(ticker, yahooTicker);
      const entry = this.buildSnapshotEntry(ticker, symbolAnalysis, scanner);

      return { analysis: { ...symbolAnalysis, scanner: scanner?.scanner ?? undefined }, entry };
    } catch (error) {
      this.logger.warn(
        `Failed to analyze ${ticker} for daily scan: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async obtainSymbolAnalysis(ticker: string): Promise<SymbolAnalysis | null> {
    if (!this.analysisService) return null;
    const result = await this.analysisService.analyzeSymbol(ticker, '1d');
    if (!result) return null;
    return mapToSymbolAnalysis(result);
  }

  /**
   * Build real scanner features from orchestrator market data.
   * Returns null-safe feature data; never fabricates missing values.
   */
  private async buildScannerFeatures(
    ticker: string,
    yahooTicker: string,
  ): Promise<{
    scanner: ScannerResult | null;
    currentPrice: number | null;
    relativeVolume20: number | null;
    volumeSpike: boolean | null;
    momentum5D: number | null;
    breakoutStatus: 'PRE_BREAKOUT' | 'BREAKOUT' | 'NO_BREAKOUT' | 'UNAVAILABLE';
    momentumStatus: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN';
    marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null;
    multiTimeframeConfluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
    multiTimeframeScore: number | null;
    earlyOpportunityClassification: EarlyOpportunityClassification;
    scannerSignalQuality: ScannerSignalQuality;
    dataStatus: DataStatus;
    sourceProvenance: ScannerProvenance;
  }> {
    const retrievedAt = new Date().toISOString();
    const pointsByTimeframe = new Map<Timeframe, MarketDataPoint[]>();

    for (const timeframe of SCANNER_TIMEFRAMES) {
      const result = await this.orchestrator?.fetchHistoricalData(yahooTicker, timeframe);
      if (result && result.data && result.data.length > 0) {
        pointsByTimeframe.set(timeframe, result.data);
      }
    }

    const dailyPoints = pointsByTimeframe.get('1d') ?? [];
    const weeklyPoints = pointsByTimeframe.get('1w') ?? [];

    const currentPrice =
      dailyPoints.length > 0 ? (dailyPoints[dailyPoints.length - 1]?.close ?? null) : null;
    const marketTimestamp =
      dailyPoints.length > 0
        ? this.stringifyTimestamp(dailyPoints[dailyPoints.length - 1]!.timestamp)
        : retrievedAt;

    const volumeFeatures = this.computeVolumeFeatures(dailyPoints);
    const momentum5D = this.computeMomentum5D(dailyPoints);
    const breakout = this.computeBreakout(dailyPoints, currentPrice);
    const marketRegime = this.computeRegime(dailyPoints);
    const momentumStatus = this.computeMomentumStatus(dailyPoints, momentum5D);
    const dataStatus: DataStatus = currentPrice !== null ? 'AVAILABLE' : 'UNAVAILABLE';

    const sourceProvenance: ScannerProvenance = {
      symbol: ticker,
      provider: 'Yahoo',
      timeframe: '1d',
      retrievedAt,
      marketTimestamp,
      source: currentPrice !== null ? 'REAL' : 'UNAVAILABLE',
      validationStatus: currentPrice !== null ? 'VALID' : 'INVALID',
    };

    // Multi-timeframe confluence from real available timeframes.
    const confluence = this.computeConfluence(
      ticker,
      pointsByTimeframe,
      currentPrice,
      dataStatus,
      marketTimestamp,
      retrievedAt,
    );

    const multiTimeframeConfluence = confluence?.confluence ?? 'UNKNOWN';
    const multiTimeframeScore = confluence?.confluenceScore ?? null;
    const earlyOpportunityClassification =
      confluence && confluence.availableTimeframeCount > 0
        ? determineEarlyOpportunityClassification(confluence)
        : 'UNAVAILABLE';
    const scannerSignalQuality =
      confluence && confluence.availableTimeframeCount > 0
        ? determineScannerSignalQuality(confluence)
        : 'UNAVAILABLE';

    return {
      scanner: null,
      currentPrice,
      relativeVolume20: volumeFeatures.relativeVolume20,
      volumeSpike: volumeFeatures.volumeSpike,
      momentum5D,
      breakoutStatus: breakout.status,
      momentumStatus,
      marketRegime,
      multiTimeframeConfluence,
      multiTimeframeScore,
      earlyOpportunityClassification,
      scannerSignalQuality,
      dataStatus,
      sourceProvenance,
    };
  }

  private buildSnapshotEntry(
    ticker: string,
    analysis: SymbolAnalysis,
    features: Awaited<ReturnType<DailyMarketScanService['buildScannerFeatures']>>,
  ): ScannerRankingResultEntry {
    return {
      symbol: ticker,
      currentPrice: features.currentPrice,
      eliteScore: analysis.eliteScore,
      financialScore: analysis.financialScore,
      technicalScore: analysis.technicalScore,
      confluenceScore: analysis.confluenceScore,
      smartMoneyScore: analysis.smartMoneyScore,
      marketStructureScore: analysis.marketStructureScore,
      multiTimeframeConfluence: features.multiTimeframeConfluence,
      multiTimeframeScore: features.multiTimeframeScore,
      earlyOpportunityClassification: features.earlyOpportunityClassification,
      scannerSignalQuality: features.scannerSignalQuality,
      marketRegime: features.marketRegime,
      volumeStatus: this.toVolumeStatus(features.relativeVolume20),
      relativeVolume20: features.relativeVolume20,
      volumeSpike: features.volumeSpike,
      breakoutStatus: features.breakoutStatus,
      momentumStatus: features.momentumStatus,
      momentum5D: features.momentum5D,
      relativeStrength: null,
      rank: 0,
      status: 'REJECTED',
      dataStatus: features.dataStatus,
      sourceProvenance: features.sourceProvenance,
    };
  }

  private computeVolumeFeatures(points: MarketDataPoint[]): {
    relativeVolume20: number | null;
    volumeSpike: boolean | null;
  } {
    if (points.length < 2) return { relativeVolume20: null, volumeSpike: null };
    const volumes = points
      .map((p) => p.volume)
      .filter((v): v is number => v !== null && v !== undefined && v > 0);
    if (volumes.length < 2) return { relativeVolume20: null, volumeSpike: null };

    const current = volumes[volumes.length - 1];
    const window20 = volumes.slice(-20);
    const avg20 = window20.reduce((a, b) => a + b, 0) / window20.length;
    if (avg20 <= 0) return { relativeVolume20: null, volumeSpike: null };

    const relativeVolume20 = Number((current / avg20).toFixed(2));
    return {
      relativeVolume20,
      volumeSpike: relativeVolume20 >= 2.0,
    };
  }

  private computeMomentum5D(points: MarketDataPoint[]): number | null {
    if (points.length < 6) return null;
    const closes = points
      .map((p) => p.close)
      .filter((c): c is number => c !== null && c !== undefined);
    if (closes.length < 6) return null;
    const prev = closes[closes.length - 6];
    const curr = closes[closes.length - 1];
    if (!prev || prev === 0) return null;
    return Number((curr / prev - 1).toFixed(6));
  }

  private computeBreakout(
    points: MarketDataPoint[],
    currentPrice: number | null,
  ): { status: 'PRE_BREAKOUT' | 'BREAKOUT' | 'NO_BREAKOUT' | 'UNAVAILABLE' } {
    if (points.length < 21 || currentPrice === null || currentPrice <= 0) {
      return { status: 'UNAVAILABLE' };
    }
    const highs = points
      .slice(0, -1)
      .map((p) => p.high)
      .filter((h): h is number => h !== null && h !== undefined);
    if (highs.length < 20) return { status: 'UNAVAILABLE' };
    const high20 = Math.max(...highs.slice(-20));
    const distanceTo20DHigh = (currentPrice - high20) / high20;
    if (currentPrice > high20) return { status: 'BREAKOUT' };
    if (distanceTo20DHigh >= -0.03) return { status: 'PRE_BREAKOUT' };
    return { status: 'NO_BREAKOUT' };
  }

  private computeRegime(
    points: MarketDataPoint[],
  ): 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null {
    const closes = points
      .map((p) => p.close)
      .filter((c): c is number => c !== null && c !== undefined);
    if (closes.length < 20) return null;
    const close = closes[closes.length - 1];
    const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const sma9 = closes.slice(-9).reduce((a, b) => a + b, 0) / 9;
    const result = determineMarketRegime(close, sma20, sma9, new Date().toISOString());
    return result.regime;
  }

  private computeMomentumStatus(
    points: MarketDataPoint[],
    momentum5D: number | null,
  ): 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN' {
    const closes = points
      .map((p) => p.close)
      .filter((c): c is number => c !== null && c !== undefined);
    if (closes.length < 6) return 'UNKNOWN';
    if (momentum5D === null) return 'UNKNOWN';
    const prev5 = closes[closes.length - 6];
    const prev10 = closes.length >= 11 ? closes[closes.length - 11] : null;
    if (momentum5D > 0.01) {
      if (prev10 !== null && prev10 !== 0) {
        const prior5 = Number((prev5 / prev10 - 1).toFixed(6));
        if (momentum5D > prior5) return 'ACCELERATING';
      }
      return 'POSITIVE';
    }
    if (momentum5D < -0.01) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private computeConfluence(
    ticker: string,
    pointsByTimeframe: Map<Timeframe, MarketDataPoint[]>,
    _currentPrice: number | null,
    _dataStatus: DataStatus,
    marketTimestamp: string,
    retrievedAt: string,
  ): MultiTimeframeAnalysis {
    const allTimeframes: Timeframe[] = ['1H', '2H', '4h', '1d', '1w', '1m', '3m', '6m'];
    const timeframes = {} as Record<Timeframe, ReturnType<typeof buildTimeframeData>>;

    for (const tf of allTimeframes) {
      const points = pointsByTimeframe.get(tf);
      if (!points || points.length === 0) {
        timeframes[tf] = buildTimeframeData(tf, {
          currentPrice: null,
          rsi14: null,
          macd: null,
          sma9: null,
          sma20: null,
          sma50: null,
          volume20Average: null,
          volume50Average: null,
          relativeVolume20: null,
          relativeVolume50: null,
          volumeSpike: null,
          distanceTo20DHigh: null,
          distanceTo50DHigh: null,
          isBreakout: null,
          momentum5D: null,
          momentum20D: null,
          momentum60D: null,
          marketRegime: 'UNKNOWN',
          relativeStrength: null,
          relativeStrengthBenchmark: 'UNAVAILABLE',
          sourceProvenance: {
            source: 'UNAVAILABLE',
            retrievedAt,
            marketTimestamp,
          },
        });
        continue;
      }

      const closes = points
        .map((p) => p.close)
        .filter((c): c is number => c !== null && c !== undefined);
      const close = closes[closes.length - 1] ?? null;
      const sma9 = closes.length >= 9 ? computeSMA(closes, 9, retrievedAt).value : null;
      const sma20 = closes.length >= 20 ? computeSMA(closes, 20, retrievedAt).value : null;
      const sma50 = closes.length >= 50 ? computeSMA(closes, 50, retrievedAt).value : null;
      const rsi14 = computeRSI(closes, 14, retrievedAt).value;
      const macd = computeMACD(closes, 12, 26, 9, retrievedAt);
      const volume = points
        .map((p) => p.volume)
        .filter((v): v is number => v !== null && v !== undefined && v > 0);
      const volume20Average =
        volume.length >= 20
          ? volume.slice(-20).reduce((a, b) => a + b, 0) / 20
          : volume.length > 0
            ? volume.reduce((a, b) => a + b, 0) / volume.length
            : null;
      const volume50Average =
        volume.length >= 50
          ? volume.slice(-50).reduce((a, b) => a + b, 0) / 50
          : volume.length > 0
            ? volume.reduce((a, b) => a + b, 0) / volume.length
            : null;
      const relativeVolume20 =
        volume20Average !== null && volume20Average > 0 && volume.length > 0
          ? Number((volume[volume.length - 1] / volume20Average).toFixed(2))
          : null;
      const volumeSpike = relativeVolume20 !== null ? relativeVolume20 >= 2.0 : null;
      const highs = points
        .map((p) => p.high)
        .filter((h): h is number => h !== null && h !== undefined);
      const high20 = highs.length >= 20 ? Math.max(...highs.slice(-20)) : null;
      const high50 = highs.length >= 50 ? Math.max(...highs.slice(-50)) : null;
      const distanceTo20DHigh =
        close !== null && high20 !== null && high20 > 0
          ? Number(((close - high20) / high20).toFixed(6))
          : null;
      const distanceTo50DHigh =
        close !== null && high50 !== null && high50 > 0
          ? Number(((close - high50) / high50).toFixed(6))
          : null;
      const isBreakout = close !== null && high20 !== null ? close > high20 : null;
      const momentum5D =
        closes.length >= 6 && closes[closes.length - 6] !== 0
          ? Number((close! / closes[closes.length - 6] - 1).toFixed(6))
          : null;
      const momentum20D =
        closes.length >= 21 && closes[closes.length - 21] !== 0
          ? Number((close! / closes[closes.length - 21] - 1).toFixed(6))
          : null;
      const momentum60D =
        closes.length >= 61 && closes[closes.length - 61] !== 0
          ? Number((close! / closes[closes.length - 61] - 1).toFixed(6))
          : null;
      const regime =
        close !== null && sma20 !== null
          ? determineMarketRegime(close, sma20, sma9, retrievedAt).regime
          : null;

      timeframes[tf] = buildTimeframeData(tf, {
        currentPrice: close,
        rsi14,
        macd,
        sma9,
        sma20,
        sma50,
        volume20Average,
        volume50Average,
        relativeVolume20,
        relativeVolume50: null,
        volumeSpike,
        distanceTo20DHigh,
        distanceTo50DHigh,
        isBreakout,
        momentum5D,
        momentum20D,
        momentum60D,
        marketRegime: regime,
        relativeStrength: null,
        relativeStrengthBenchmark: 'UNAVAILABLE',
        sourceProvenance: {
          source: 'REAL',
          retrievedAt,
          marketTimestamp,
        },
      });
    }

    const confluence = determineMultiTimeframeConfluence(timeframes);
    return {
      ...confluence,
      symbol: ticker,
      timeframes,
    };
  }

  private stringifyTimestamp(timestamp: Date | string): string {
    if (typeof timestamp === 'string') return timestamp;
    return timestamp.toISOString();
  }

  private toVolumeStatus(
    relativeVolume20: number | null,
  ): 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE' {
    if (relativeVolume20 === null) return 'UNAVAILABLE';
    if (relativeVolume20 >= 1.5) return 'STRONG';
    if (relativeVolume20 >= 1.0) return 'MODERATE';
    return 'WEAK';
  }

  private buildProviderSummary(
    byStatus: Record<string, number>,
    analyzedCount: number,
  ): ProviderScanSummary[] {
    return [
      {
        provider: 'Yahoo',
        requested:
          (byStatus['AVAILABLE'] ?? 0) +
          (byStatus['UNAVAILABLE'] ?? 0) +
          (byStatus['RATE_LIMITED'] ?? 0),
        available: byStatus['AVAILABLE'] ?? 0,
        unavailable: byStatus['UNAVAILABLE'] ?? 0,
        rateLimited: byStatus['RATE_LIMITED'] ?? 0,
        failed: (byStatus['INVALID'] ?? 0) + (byStatus['RATE_LIMITED'] ?? 0),
        cacheHits: 0,
      },
    ];
  }

  private buildSummary(
    snapshot: ScannerRankingSnapshot,
    events: OpportunityRadarEvent[],
  ): DailyScanSummary {
    const byType = (type: OpportunityRadarEvent['type']) => events.filter((e) => e.type === type);
    return {
      scanId: snapshot.scanId,
      timestamp: snapshot.scanTimestamp,
      status: snapshot.status,
      universeSize: snapshot.universeSize,
      equityCount: snapshot.equityCandidateCount,
      evaluatedCount: snapshot.evaluatedCount,
      availableCount: snapshot.availableCount,
      unavailableCount: snapshot.unavailableCount,
      rateLimitedCount: snapshot.rateLimitedCount,
      failedCount: snapshot.failedCount,
      signalCount: snapshot.signalCount,
      eligibleCount: snapshot.eligibleCount,
      top10: snapshot.results.slice(0, 10),
      top20: snapshot.results.slice(0, 20),
      top50: snapshot.results.slice(0, 50),
      newOpportunities: byType('NEW_OPPORTUNITY'),
      strengtheningSignals: byType('OPPORTUNITY_STRENGTHENING'),
      rankImprovements: byType('RANK_IMPROVEMENT'),
      scoreSurges: byType('SCORE_SURGE'),
      volumeExpansions: byType('VOLUME_EXPANSION'),
      momentumAccelerations: byType('MOMENTUM_ACCELERATION'),
      breakoutDevelopments: byType('BREAKOUT_DEVELOPING'),
      multiTimeframeAlignments: byType('MULTI_TIMEFRAME_ALIGNMENT'),
      weakenedSignals: byType('SIGNAL_WEAKENING'),
      lostSignals: byType('SIGNAL_LOST'),
      providerSummary: snapshot.providerSummary,
      dataQuality: snapshot.dataQuality,
    };
  }

  private loadCurrentSnapshot(): ScannerRankingSnapshot | null {
    return (
      this.cacheService?.get<ScannerRankingSnapshot>('current', this.config.snapshotNamespace) ??
      null
    );
  }

  private storeSnapshot(
    snapshot: ScannerRankingSnapshot,
    previous: ScannerRankingSnapshot | null,
  ): void {
    if (!this.cacheService) return;
    if (previous) {
      this.cacheService.set(
        'previous',
        previous,
        this.config.snapshotTtlMs,
        this.config.snapshotNamespace,
      );
    }
    this.cacheService.set(
      'current',
      snapshot,
      this.config.snapshotTtlMs,
      this.config.snapshotNamespace,
    );
  }

  private storeRadarEvents(scanId: string, events: OpportunityRadarEvent[]): void {
    if (!this.cacheService) return;
    this.cacheService.set(
      `events:${scanId}`,
      events,
      this.config.snapshotTtlMs,
      this.config.snapshotNamespace,
    );
  }

  private generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
