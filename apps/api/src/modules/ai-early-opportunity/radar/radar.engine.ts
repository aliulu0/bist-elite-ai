import { EarlyOpportunityIntelligenceResult } from '../early-opportunity.types';
import { EarlySignalScannerResult } from '../signals/early-signal.types';
import { LatestPriceState } from '../../market-data/incremental/latest-price.types';
import { BistSymbolEntry } from '../../market-data/symbol-registry/symbol-registry.types';
import { toTrTime } from '../../market-data/incremental/incremental-timeframe.config';
import { RadarConfig } from './radar.config';
import {
  OpportunityRadarSnapshot,
  OpportunityRadarItem,
  RadarMetrics,
  RadarRunStats,
  RadarRunOptions,
  RadarMarketSession,
  OpportunityRadarEvent,
  RadarState,
} from './radar.types';
import { deriveRadarState } from './radar-state-machine';
import { stateToEventKind } from './radar.events';

/**
 * R2-048 — Radar engine.
 *
 * Reuses the existing intelligence pipeline (incremental latest price, signal
 * scanner, EarlyOpportunityIntelligenceService) and applies a deterministic
 * staged pipeline:
 *
 *   Stage 1 (cheap): latest price (incremental cache) + early-signal scan.
 *   Stage 2/3 (deep): only candidates + previously-active symbols run the full
 *                      EarlyOpportunity intelligence (expensive provider calls).
 *
 * Warm reuse: when a symbol's latest-price timestamp is unchanged and no force
 * refresh is requested, the previous radar item is reused with ZERO provider
 * calls (cache hit). This keeps repeated radar runs cheap.
 */
export interface RadarEngineDeps {
  intelligence: {
    getEarlyOpportunity(ticker: string): Promise<EarlyOpportunityIntelligenceResult | null>;
  };
  signalScanner?: {
    scan(ticker: string, opts?: Record<string, unknown>): Promise<EarlySignalScannerResult | null>;
  };
  latestPrice: {
    getLatestPriceIncremental(
      symbol: string,
      timeframe: string,
      opts?: { forceRefresh?: boolean; cacheEnabled?: boolean },
    ): Promise<LatestPriceState | null>;
  };
  symbolRegistry: {
    getActiveSymbols(): BistSymbolEntry[];
    getSymbolsBySector(sector: string): BistSymbolEntry[];
    getCompanyName(ticker: string): string | undefined;
    getSector(ticker: string): string | undefined;
  };
  config: RadarConfig;
  now?: () => number;
}

const CONFIRM_DECISION_STATUSES: ReadonlyArray<string> = [
  'STRONG_EARLY_OPPORTUNITY',
  'EARLY_OPPORTUNITY',
  'CONFIRMED_OPPORTUNITY',
];

const ACTIVE_STATES: ReadonlyArray<RadarState> = ['NEW', 'STRENGTHENING', 'CONFIRMED', 'WEAKENING'];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getMarketSession(now: number): {
  session: RadarMarketSession;
  label: string;
  freshnessNote: string;
} {
  const tr = toTrTime(new Date(now));
  const day = tr.getUTCDay();
  if (day === 0 || day === 6) {
    return { session: 'CLOSED', label: 'Kapalı', freshnessNote: 'Piyasa kapalı (hafta sonu).' };
  }
  const hour = tr.getUTCHours();
  if (hour >= 10 && hour <= 18) {
    return { session: 'OPEN', label: 'Açık', freshnessNote: 'Piyasa açık.' };
  }
  if (hour < 10) {
    return {
      session: 'PRE_MARKET',
      label: 'Seans Öncesi',
      freshnessNote: 'Piyasa şu anda kapalı. Önceki geçerli piyasa verisi kullanılıyor.',
    };
  }
  return {
    session: 'CLOSED',
    label: 'Kapalı',
    freshnessNote: 'Piyasa şu anda kapalı. Önceki geçerli piyasa verisi kullanılıyor.',
  };
}

function extractRadarMetrics(
  result: EarlyOpportunityIntelligenceResult,
  dataTimestamp: string,
): RadarMetrics {
  return {
    earlyOpportunityScore: result.earlyOpportunityScore,
    eliteScore: result.eliteScore,
    signalConvergence: result.signalConvergenceScore,
    confidence: result.confidence,
    expectedReturn: result.expectedReturn,
    risk: result.risk ?? 'unknown',
    smartMoneyScore: result.smartMoney?.score ?? null,
    catalystScore: result.catalyst?.score ?? null,
    fundamentalScore: (result.fundamentals as { score?: number } | null)?.score ?? null,
    dataQualityScore: (result.financialDataQuality as { score?: number } | null)?.score ?? null,
    predictionConfidence: result.decision?.predictionConfidence ?? null,
    timeframeAgreement: result.timeframeAgreement ?? null,
    entryZone: result.entryZone,
    decisionScore: result.decision?.decisionScore ?? null,
    decisionStatus: result.decision?.decisionStatus ?? null,
    earlyOpportunity: result.decision?.earlyOpportunity ?? false,
    dataTimestamp,
  };
}

/**
 * Deterministic radar priority (presentation metric only — never replaces the
 * Early Opportunity / Elite / Signal scores).
 *
 *   priority = score*wScore + momentum*wMomentum + freshness*wFreshness + convergenceImprov*wConvergence
 */
export function computeRadarPriority(
  metrics: RadarMetrics,
  scoreChange: number | null,
  dataTimestamp: string,
  now: number,
  config: RadarConfig,
): number {
  const w = config.priorityWeights;
  const momentum = scoreChange ?? 0;
  const ageMs = Math.max(0, now - new Date(dataTimestamp).getTime());
  const ageMinutes = ageMs / 60_000;
  const ttlMinutes = config.freshnessTtlMs / 60_000;
  const freshness = clamp(100 - (ageMinutes / ttlMinutes) * 50, 0, 100);
  const convergenceImprov = Math.max(0, metrics.signalConvergence - 50);
  const priority =
    metrics.earlyOpportunityScore * w.score +
    momentum * w.momentum +
    freshness * w.freshness +
    convergenceImprov * w.convergence;
  return Math.round(priority);
}

function isActiveMetrics(m: RadarMetrics | null, minRadarScore: number): boolean {
  return !!m && m.earlyOpportunityScore >= minRadarScore && m.earlyOpportunity;
}

export class OpportunityRadarEngine {
  private readonly deps: RadarEngineDeps;

  constructor(deps: RadarEngineDeps) {
    this.deps = deps;
  }

  private resolveUniverse(options: RadarRunOptions): BistSymbolEntry[] {
    const { symbolRegistry, config } = this.deps;
    const all = options.sector
      ? symbolRegistry.getSymbolsBySector(options.sector)
      : symbolRegistry.getActiveSymbols();

    let base = all;
    if (options.watchlist && options.watchlist.length > 0) {
      const set = new Set(options.watchlist.map((s) => s.toUpperCase()));
      base = base.filter((e) => set.has(e.canonicalTicker.toUpperCase()));
    }

    const cap = options.maxSymbols ?? config.maxSymbols;
    return base.slice(0, cap);
  }

  async run(
    options: RadarRunOptions,
    previous: OpportunityRadarSnapshot | null,
    emit?: (event: OpportunityRadarEvent) => void,
  ): Promise<OpportunityRadarSnapshot> {
    const now = this.deps.now ? this.deps.now() : Date.now();
    const start = now;
    const { config } = this.deps;
    const session = getMarketSession(now);

    const stats: RadarRunStats = {
      providerCalls: 0,
      cacheHits: 0,
      cheapScans: 0,
      deepAnalyses: 0,
      symbolsEvaluated: 0,
      candidates: 0,
      skipped: 0,
      errors: 0,
    };

    const items: Record<string, OpportunityRadarItem> = {};
    const universe = this.resolveUniverse(options);

    for (const entry of universe) {
      const ticker = entry.canonicalTicker;
      stats.symbolsEvaluated += 1;

      const price = await this.deps.latestPrice
        .getLatestPriceIncremental(ticker, '1d')
        .catch(() => null);
      if (!price) {
        stats.errors += 1;
        continue;
      }

      const prevItem = previous ? (previous.items[ticker] ?? null) : null;

      // Warm reuse: data unchanged and no force refresh => zero provider calls.
      if (prevItem && prevItem.current.dataTimestamp === price.timestamp && !options.forceRefresh) {
        items[ticker] = prevItem;
        stats.cacheHits += 1;
        continue;
      }

      // Stage 1 — cheap signal screen.
      stats.cheapScans += 1;
      const scan = this.deps.signalScanner
        ? await this.deps.signalScanner.scan(ticker).catch(() => null)
        : null;
      const convergence = scan?.convergence?.convergenceScore ?? 0;
      const earlyCount = scan?.convergence?.earlyCount ?? 0;
      const isCandidate =
        convergence >= config.stage1.minSignalConvergence ||
        earlyCount >= config.stage1.minEarlySignals;
      const prevActive = isActiveMetrics(prevItem?.current ?? null, config.minRadarScore);

      if (!isCandidate && !prevActive) {
        stats.skipped += 1;
        continue;
      }

      // Stage 2/3 — deep analysis (the only place provider calls happen).
      stats.deepAnalyses += 1;
      stats.providerCalls += 1;
      const result = await this.deps.intelligence.getEarlyOpportunity(ticker).catch(() => null);

      if (!result) {
        stats.errors += 1;
        if (prevActive && prevItem) {
          items[ticker] = {
            ...prevItem,
            state: 'INVALIDATED',
            previous: prevItem.current,
            scoreChange: null,
            changes: [],
            reasons: ['Veri alınamadı; önceki fırsat geçersiz sayıldı.'],
            dataFreshness: price.dataFreshness,
            providerStatus: price.provider,
            evaluatedAt: new Date(now).toISOString(),
          };
          const invKind = stateToEventKind('INVALIDATED');
          if (invKind && emit) {
            emit({
              type: invKind,
              ticker,
              state: 'INVALIDATED',
              score: prevItem.current.earlyOpportunityScore,
              scoreChange: null,
              reasons: items[ticker].reasons,
              timestamp: new Date(now).toISOString(),
              decision: prevItem.decision ?? null,
              dataQuality: prevItem.current.dataQualityScore,
            });
          }
        }
        continue;
      }

      const metrics = extractRadarMetrics(result, price.timestamp);
      const derived = deriveRadarState({
        previousState: prevItem?.state ?? null,
        previousMetrics: prevItem?.current ?? null,
        currentMetrics: metrics,
        thresholds: config.thresholds,
        minRadarScore: config.minRadarScore,
        confirmDecisionStatuses: CONFIRM_DECISION_STATUSES,
      });
      const radarPriority = computeRadarPriority(
        metrics,
        derived.scoreChange,
        price.timestamp,
        now,
        config,
      );

      const item: OpportunityRadarItem = {
        ticker,
        company: result.company,
        sector: result.sector,
        state: derived.state,
        current: metrics,
        previous: prevItem?.current ?? null,
        scoreChange: derived.scoreChange,
        changes: derived.changes,
        reasons: derived.reasons,
        radarPriority,
        dataFreshness: price.dataFreshness,
        providerStatus: price.provider,
        decision: result.decision,
        evaluatedAt: new Date(now).toISOString(),
      };
      items[ticker] = item;

      const kind = stateToEventKind(derived.state);
      if (kind && emit) {
        emit({
          type: kind,
          ticker,
          state: derived.state,
          score: metrics.earlyOpportunityScore,
          scoreChange: derived.scoreChange,
          reasons: derived.reasons,
          timestamp: new Date(now).toISOString(),
          decision: result.decision,
          dataQuality: metrics.dataQualityScore,
        });
      }
    }

    const activeOpportunities = Object.values(items).filter((i) =>
      isActiveMetrics(i.current, config.minRadarScore),
    ).length;

    const newOpportunities = Object.values(items)
      .filter((i) => i.state === 'NEW')
      .map((i) => i.ticker);
    const strengtheningOpportunities = Object.values(items)
      .filter((i) => i.state === 'STRENGTHENING')
      .map((i) => i.ticker);
    const weakeningOpportunities = Object.values(items)
      .filter((i) => i.state === 'WEAKENING')
      .map((i) => i.ticker);
    const invalidatedOpportunities = Object.values(items)
      .filter((i) => i.state === 'INVALIDATED')
      .map((i) => i.ticker);
    const confirmedOpportunities = Object.values(items)
      .filter((i) => i.state === 'CONFIRMED')
      .map((i) => i.ticker);

    const qualityScores = Object.values(items)
      .map((i) => i.current.dataQualityScore)
      .filter((s): s is number => typeof s === 'number');
    const averageScore = qualityScores.length
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;
    const warnings: string[] = Object.values(items)
      .filter((i) => i.current.dataQualityScore !== null && i.current.dataQualityScore < 50)
      .map((i) => `${i.ticker} veri kalitesi düşük (%${i.current.dataQualityScore})`);

    const elapsed = (this.deps.now ? this.deps.now() : Date.now()) - start;

    return {
      timestamp: new Date(now).toISOString(),
      marketSession: session.session,
      marketSessionLabel: session.label,
      freshnessNote: session.freshnessNote,
      symbolsEvaluated: stats.symbolsEvaluated,
      activeOpportunities,
      newOpportunities,
      strengtheningOpportunities,
      weakeningOpportunities,
      invalidatedOpportunities,
      confirmedOpportunities,
      items,
      providerCallStats: stats,
      dataQualitySummary: { averageScore, warnings },
      executionDurationMs: elapsed,
      generatedAt: new Date(now).toISOString(),
    };
  }
}

export { ACTIVE_STATES };
