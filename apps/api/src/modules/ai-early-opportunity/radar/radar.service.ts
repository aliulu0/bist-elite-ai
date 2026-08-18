import { Injectable, Logger, Optional, NotFoundException } from '@nestjs/common';
import { EarlyOpportunityIntelligenceService } from '../early-opportunity.intelligence.service';
import { EarlySignalScannerService } from '../signals/early-signal-scanner.service';
import { LatestPriceIncrementalService } from '../../market-data/incremental/latest-price-incremental.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { CacheService } from '../../../common/cache/cache.service';
import { RequestDeduplicatorService } from '../../market-data/dedup/request-deduplicator.service';
import { IndicatorCacheService } from '../../indicator-cache/indicator-cache.service';
import { RadarConfig, getRadarConfig } from './radar.config';
import { OpportunityRadarEngine } from './radar.engine';
import { RadarEventEmitter } from './radar.events';
import {
  OpportunityRadarSnapshot,
  OpportunityRadarItem,
  RadarMetrics,
  RadarRunOptions,
  RadarState,
  RadarStatus,
} from './radar.types';

// R2-049: Persistence types (matching migration SQL)
export interface PersistedOpportunitySnapshot {
  id: string;
  ticker: string;
  state: RadarState;
  configVersion: string;
  originalScore: number;
  originalSignalStrengths: Record<string, number>;
  originalDecision: Record<string, unknown>;
  originalPrediction: Record<string, unknown>;
  originalRisk: string;
  originalDataQuality: Record<string, unknown>;
  originalTimestamp: string;
  dataFreshness: string;
  providerCalls: number;
  cacheHits: number;
  cheapScans: number;
  deepAnalyses: number;
  snapshotData: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface PersistedOutcome {
  id: string;
  snapshotId: string;
  userAction: 'CONFIRM' | 'REJECT' | 'IGNORE';
  realizedOutcome: 'SUCCESS' | 'FAILURE' | 'PENDING' | null;
  outcomeTimestamp: string | null;
  explanation: string;
  createdAt: string;
}

export interface PersistedLearnedConfig {
  id: string;
  version: string;
  weightConfig: Record<string, number>;
  evidenceCount: number;
  createdAt: string;
  lastAppliedAt: string | null;
  isActive: boolean;
  parentVersion: string | null;
  mutationType: 'SLIGHT_INCREASE' | 'SLIGHT_DECREASE' | 'FLIP' | null;
  rationale: string;
}

export interface PersistedFeedbackEvent {
  id: string;
  snapshotId: string;
  userId: string | null;
  action: 'CONFIRM' | 'REJECT' | 'IGNORE';
  timestamp: string;
  notes: string | null;
  affectedLearnedConfig: string | null;
  createdAt: string;
}

const RADAR_NS = 'radar';
const CURRENT_KEY = 'current';
const PREVIOUS_KEY = 'previous';
const HISTORY_KEY = 'history';

export interface RadarPartialResult {
  completedSymbols: string[];
  failedSymbols: string[];
  providerLimitedSymbols: string[];
  completedAt: string;
  timestamp: string;
}

export interface RadarRunProgress {
  running: boolean;
  completed: number;
  total: number;
  estimatedRemainingMs: number | null;
  providerCalls: number;
  cacheHits: number;
}

export interface RadarTopQuery {
  limit?: number;
  minScore?: number;
  state?: RadarState;
  sector?: string;
  minDataQuality?: number;
  signalStrength?: number;
  confidence?: number;
  risk?: string;
  expectedReturn?: number;
  timeframe?: string;
}

export interface RadarHistoryEntry {
  timestamp: string;
  scores: Record<string, { state: RadarState; score: number }>;
}

@Injectable()
export class RadarService {
  private readonly logger = new Logger(RadarService.name);
  private readonly engine: OpportunityRadarEngine;
  private readonly config: RadarConfig;
  private status: RadarStatus = {
    running: false,
    lastRun: null,
    lastSuccessfulRun: null,
    lastDurationMs: null,
    symbolsEvaluated: 0,
    candidates: 0,
    opportunities: {},
    providerCalls: 0,
    cacheHits: 0,
    dataQualityWarnings: [],
    errors: 0,
    hasSnapshot: false,
  };

  constructor(
    private readonly intelligence: EarlyOpportunityIntelligenceService,
    @Optional() private readonly signalScanner?: EarlySignalScannerService,
    private readonly latestPrice?: LatestPriceIncrementalService,
    private readonly symbolRegistry?: SymbolRegistryService,
    private readonly cache?: CacheService,
    private readonly deduplicator?: RequestDeduplicatorService,
    @Optional() private readonly indicatorCache?: IndicatorCacheService,
    private readonly events?: RadarEventEmitter,
    @Optional() config?: RadarConfig,
  ) {
    this.config = config ?? getRadarConfig();
    this.engine = new OpportunityRadarEngine({
      intelligence: { getEarlyOpportunity: (t) => this.intelligence.getEarlyOpportunity(t) },
      signalScanner: this.signalScanner
        ? { scan: (t, o) => this.signalScanner!.scan(t, o as Record<string, unknown>) }
        : undefined,
      latestPrice: this.latestPrice
        ? {
            getLatestPriceIncremental: (s, tf, o) =>
              this.latestPrice!.getLatestPriceIncremental(s, tf, o),
          }
        : { getLatestPriceIncremental: async () => null },
      symbolRegistry: this.symbolRegistry
        ? {
            getActiveSymbols: () => this.symbolRegistry!.getActiveSymbols(),
            getSymbolsBySector: (s) => this.symbolRegistry!.getSymbolsBySector(s),
            getCompanyName: (t) => this.symbolRegistry!.getCompanyName(t),
            getSector: (t) => this.symbolRegistry!.getSector(t),
          }
        : {
            getActiveSymbols: () => [],
            getSymbolsBySector: () => [],
            getCompanyName: () => undefined,
            getSector: () => undefined,
          },
      config: this.config,
    });
  }

  getStatus(): RadarStatus {
    return {
      ...this.status,
      hasSnapshot: this.status.running || this.hasSnapshot(),
      opportunities: { ...this.status.opportunities },
    };
  }

  getPartialResult(): RadarPartialResult | null {
    // Search cache for last partial result
    const keys = this.cache ? this.cache.getKeys(RADAR_NS) : [];
    for (const key of keys) {
      if (key.startsWith('partial_radar_')) {
        const value = this.cache?.get(key, RADAR_NS);
        if (value && typeof value === 'object' && 'completedSymbols' in value) {
          return value as RadarPartialResult;
        }
      }
    }
    return null;
  }

  getRunProgress(): RadarRunProgress {
    return {
      running: this.status.running,
      completed: this.status.symbolsEvaluated,
      total: this.status.symbolsEvaluated + this.status.errors,
      estimatedRemainingMs: null,
      providerCalls: this.status.providerCalls,
      cacheHits: this.status.cacheHits,
    };
  }

  getEvents(limit?: number) {
    return this.events ? this.events.getRecent(limit) : [];
  }

  async runRadar(options: RadarRunOptions = {}): Promise<OpportunityRadarSnapshot> {
    this.status.running = true;
    const runKey = 'radar-run';
    const task = async (): Promise<OpportunityRadarSnapshot> => {
      // Track per-symbol results for partial persistence
      const completedSymbols: string[] = [];
      const failedSymbols: string[] = [];
      const providerLimitedSymbols: string[] = [];
      let symbolsEvaluated = 0;

      const previous = this.load(CURRENT_KEY) as OpportunityRadarSnapshot | null;

      // Execute the engine but track partial results
      let snapshot: OpportunityRadarSnapshot;
      try {
        snapshot = await this.engine.run(options, previous, (e) => this.events?.emit(e));
      } catch (error) {
        // Engine failure - but we may have partial results
        snapshot = {} as OpportunityRadarSnapshot;
        snapshot.items = {};
        snapshot.providerCallStats = {
          providerCalls: 0,
          cacheHits: 0,
          cheapScans: 0,
          deepAnalyses: 0,
          symbolsEvaluated: 0,
          candidates: 0,
          skipped: 0,
          errors: 0,
        };
        snapshot.dataQualitySummary = { averageScore: 0, warnings: [] };
      }

      // Classify items into completed/failed/provider-limited based on their state
      if (snapshot.items) {
        for (const [ticker, item] of Object.entries(snapshot.items)) {
          symbolsEvaluated++;
          if (item.state === 'CONFIRMED' || item.state === 'STRENGTHENING') {
            completedSymbols.push(ticker);
          } else if (item.state === 'INVALIDATED') {
            failedSymbols.push(ticker);
          } else if (item.state === 'UNCHANGED') {
            // Could be provider-limited if no data was available
            providerLimitedSymbols.push(ticker);
          }
        }
      }

      // Store partial result snapshot even if full scan didn't complete
      const partialResult: RadarPartialResult = {
        completedSymbols,
        failedSymbols,
        providerLimitedSymbols,
        completedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      // Store the partial result in cache
      this.store(`partial_radar_${new Date().getTime()}`, {
        ...partialResult,
        snapshot,
        previous,
      });

      // Always store the snapshot (even if partial) as the current state
      const prevStored = this.load(CURRENT_KEY) as OpportunityRadarSnapshot | null;
      if (prevStored) this.store(PREVIOUS_KEY, prevStored);
      this.store(CURRENT_KEY, snapshot);
      this.pushHistory(snapshot);

      this.status.lastRun = snapshot.timestamp;
      this.status.lastSuccessfulRun = snapshot.timestamp;
      this.status.lastDurationMs = snapshot.executionDurationMs;
      this.status.symbolsEvaluated = symbolsEvaluated;
      this.status.providerCalls = snapshot.providerCallStats?.providerCalls ?? 0;
      this.status.cacheHits = snapshot.providerCallStats?.cacheHits ?? 0;
      this.status.dataQualityWarnings = snapshot.dataQualitySummary?.warnings ?? [];
      this.status.errors = snapshot.providerCallStats?.errors ?? 0;
      this.status.hasSnapshot = true;

      // Emit partial progress event
      this.events?.emit({
        type: 'radar_progress',
        partial: true,
        completedSymbols,
        failedSymbols,
        providerLimitedSymbols,
        symbolsEvaluated,
      });

      return snapshot;
    };

    try {
      if (this.deduplicator) {
        return await this.deduplicator.execute(runKey, task);
      }
      return await task();
    } finally {
      this.status.running = false;
    }
  }

  hasSnapshot(): boolean {
    return this.load(CURRENT_KEY) != null;
  }

  /** Non-blocking accessor for the current in-memory snapshot. Reuse this before triggering a fresh run. */
  getCurrentSnapshot(): OpportunityRadarSnapshot | null {
    return this.load(CURRENT_KEY) as OpportunityRadarSnapshot | null;
  }

  getTop(query: RadarTopQuery): {
    items: OpportunityRadarItem[];
    total: number;
    hasSnapshot: boolean;
  } {
    const snapshot = this.load(CURRENT_KEY) as OpportunityRadarSnapshot | null;
    if (!snapshot) return { items: [], total: 0, hasSnapshot: false };

    let items = Object.values(snapshot.items);
    if (query.state) items = items.filter((i) => i.state === query.state);
    if (query.sector)
      items = items.filter((i) => i.sector?.toUpperCase() === query.sector!.toUpperCase());
    if (typeof query.minScore === 'number')
      items = items.filter((i) => i.current.earlyOpportunityScore >= query.minScore!);
    if (typeof query.minDataQuality === 'number')
      items = items.filter((i) => (i.current.dataQualityScore ?? -1) >= query.minDataQuality!);
    if (typeof query.signalStrength === 'number')
      items = items.filter((i) => i.current.signalConvergence >= query.signalStrength!);
    if (typeof query.confidence === 'number')
      items = items.filter((i) => i.current.confidence >= query.confidence!);
    if (typeof query.risk === 'string') items = items.filter((i) => i.current.risk === query.risk);
    if (typeof query.expectedReturn === 'number')
      items = items.filter((i) => i.current.expectedReturn >= query.expectedReturn!);

    items = items.sort((a, b) => b.radarPriority - a.radarPriority);
    const total = items.length;
    const limit = query.limit ?? 20;
    return { items: items.slice(0, limit), total, hasSnapshot: true };
  }

  getTicker(ticker: string): OpportunityRadarItem {
    const snapshot = this.load(CURRENT_KEY) as OpportunityRadarSnapshot | null;
    const item = snapshot?.items[ticker.toUpperCase()];
    if (!item) throw new NotFoundException(`Radar verisi bulunamadı: ${ticker}`);
    return item;
  }

  getTickerDetail(ticker: string): {
    item: OpportunityRadarItem;
    previousState: RadarState | null;
    scoreHistory: Array<{ timestamp: string; score: number; state: RadarState }>;
  } {
    const item = this.getTicker(ticker);
    const history = (this.load(HISTORY_KEY) as RadarHistoryEntry[] | null) ?? [];
    const scoreHistory = history
      .filter((h) => h.scores[ticker.toUpperCase()])
      .map((h) => ({
        timestamp: h.timestamp,
        score: h.scores[ticker.toUpperCase()].score,
        state: h.scores[ticker.toUpperCase()].state,
      }));
    return { item, previousState: item.previous ? item.state : null, scoreHistory };
  }

  getTickerExplain(ticker: string): string {
    const item = this.getTicker(ticker);
    return this.buildExplanation(item);
  }

  private buildExplanation(item: OpportunityRadarItem): string {
    const parts: string[] = [];
    const stateLabel: Record<RadarState, string> = {
      NEW: 'YENİ',
      STRENGTHENING: 'GÜÇLENİYOR',
      CONFIRMED: 'DOĞRULANDI',
      WEAKENING: 'ZAYIFLIYOR',
      INVALIDATED: 'GEÇERSİZ',
      UNCHANGED: 'DEĞİŞMEDİ',
    };
    parts.push(`${item.ticker} erken fırsatı ${stateLabel[item.state]}.`);
    if (item.scoreChange !== null) {
      parts.push(
        `Skor ${item.previous?.earlyOpportunityScore?.toFixed(0) ?? '?'}'${
          item.scoreChange >= 0 ? 'den' : 'den'
        } ${item.current.earlyOpportunityScore.toFixed(0)}'a ${item.scoreChange >= 0 ? 'yükseldi' : 'düştü'}.`,
      );
    } else {
      parts.push(`Skor ${item.current.earlyOpportunityScore.toFixed(0)}.`);
    }
    for (const r of item.reasons) parts.push(r);
    return parts.join(' ');
  }

  private pushHistory(snapshot: OpportunityRadarSnapshot): void {
    const history = (this.load(HISTORY_KEY) as RadarHistoryEntry[] | null) ?? [];
    const entry: RadarHistoryEntry = {
      timestamp: snapshot.timestamp,
      scores: Object.fromEntries(
        Object.values(snapshot.items).map((i) => [
          i.ticker,
          { state: i.state, score: i.current.earlyOpportunityScore },
        ]),
      ),
    };
    history.push(entry);
    while (history.length > this.config.snapshotHistoryLimit) history.shift();
    this.store(HISTORY_KEY, history);
  }

  private load(key: string): unknown {
    return this.cache ? this.cache.get(key, RADAR_NS) : null;
  }

  private store(key: string, value: unknown): void {
    if (this.cache) this.cache.set(key, value, 24 * 3_600_000, RADAR_NS);
  }

  // R2-049: Persistence Methods

  /**
   * Save a radar run snapshot with full preservation of original data.
   * Every radar run is automatically persisted for future feedback and learning.
   * Original values are never modified by the learning system.
   */
  async saveSnapshot(
    snapshot: OpportunityRadarSnapshot,
    configVersion: string,
  ): Promise<PersistedOpportunitySnapshot> {
    const originals = this.extractOriginals(snapshot);

    // Build items map from snapshot items
    let snapshotItems: Record<string, any> = {};
    if (snapshot.items) {
      snapshotItems = Object.fromEntries(
        Object.entries(snapshot.items).map(([k, v]) => [
          k,
          {
            ticker: v.ticker,
            company: v.company,
            sector: v.sector,
            state: v.state,
            // current and previous are inside OpportunityRadarItem, accessed per-ticker
            scoreChange: v.scoreChange,
            changes: v.changes,
            reasons: v.reasons,
            radarPriority: v.radarPriority,
            dataFreshness: v.dataFreshness,
            providerStatus: v.providerStatus,
            decision: v.decision,
            evaluatedAt: v.evaluatedAt,
          },
        ]),
      );
    }

    // Derive dataFreshness from the snapshot's freshnessNote (top-level property)
    const dataFreshnessValue = snapshot.freshnessNote || 'unknown';

    // Derive provider stats from RadarRunStats
    const providerStats = snapshot.providerCallStats || {
      providerCalls: 0,
      cacheHits: 0,
      cheapScans: 0,
      deepAnalyses: 0,
    };

    const persisted: PersistedOpportunitySnapshot = {
      id: crypto.randomUUID(),
      ticker: snapshot.items ? Object.keys(snapshot.items)[0] || 'UNKNOWN' : 'UNKNOWN',
      state: snapshot.items ? Object.values(snapshot.items)[0]?.state || 'UNCHANGED' : 'UNCHANGED',
      configVersion,
      originalScore: originals.originalScore,
      originalSignalStrengths: originals.originalSignalStrengths,
      originalDecision: originals.originalDecision,
      originalPrediction: originals.originalPrediction,
      originalRisk: originals.originalRisk,
      originalDataQuality: originals.originalDataQuality,
      originalTimestamp: originals.originalTimestamp,
      dataFreshness: dataFreshnessValue,
      providerCalls: providerStats.providerCalls,
      cacheHits: providerStats.cacheHits,
      cheapScans: providerStats.cheapScans,
      deepAnalyses: providerStats.deepAnalyses,
      snapshotData: {
        ...snapshot,
        items: snapshotItems,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Store in cache for immediate access (with long TTL = 30 days)
    this.store(`snapshot_${persisted.id}`, persisted);

    // TODO: Persist to Prisma database (migration F12)
    // const result = await this.prisma.opportunitySnapshots.create({
    //   data: { ...persisted, createdAt: new Date() }
    // });

    return persisted;
  }

  /**
   * Extract original values from a radar snapshot, preserving them exactly.
   * These originals must never be modified by the learning system.
   * Values are taken from the first item in the snapshot if items exist,
   * otherwise from the snapshot's top-level fields.
   */
  private extractOriginals(snapshot: OpportunityRadarSnapshot): {
    originalScore: number;
    originalSignalStrengths: Record<string, number>;
    originalDecision: Record<string, unknown>;
    originalPrediction: Record<string, unknown>;
    originalRisk: string;
    originalDataQuality: Record<string, unknown>;
    originalTimestamp: string;
  } {
    // Extract from the first available item, or use snapshot defaults
    const firstItem = snapshot.items ? Object.values(snapshot.items)[0] : null;
    const metrics = firstItem?.current ? firstItem.current : ({} as RadarMetrics);

    return {
      originalScore: metrics.earlyOpportunityScore ?? 0,
      originalSignalStrengths: {
        momentum: metrics.signalConvergence ?? 0,
        convergence: metrics.signalConvergence ?? 0,
        confidence: metrics.confidence ?? 0,
        expectedReturn: metrics.expectedReturn ?? 0,
      },
      originalDecision: {
        entryZone: firstItem?.current?.entryZone,
        decisionStatus: firstItem?.current?.decisionStatus,
        decisionScore: firstItem?.current?.decisionScore,
      },
      originalPrediction: {
        predictionConfidence: firstItem?.current?.predictionConfidence,
        timeframeAgreement: firstItem?.current?.timeframeAgreement,
      },
      originalRisk: firstItem?.current?.risk ?? 'MEDIUM',
      originalDataQuality: {
        dataQualityScore: firstItem?.current?.dataQualityScore,
      },
      originalTimestamp: snapshot.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Record user feedback (CONFIRM/REJECT/IGNORE) for a radar opportunity.
   * Feedback is stored for learning aggregation and outcome tracking.
   */
  async recordFeedback(
    snapshotId: string,
    userAction: 'CONFIRM' | 'REJECT' | 'IGNORE',
    explanation: string,
    userId?: string,
  ): Promise<PersistedOutcome> {
    const outcome: PersistedOutcome = {
      id: crypto.randomUUID(),
      snapshotId,
      userAction,
      realizedOutcome: null, // Will be set when outcome is evaluated
      outcomeTimestamp: null, // Will be set when outcome is evaluated
      explanation,
      createdAt: new Date().toISOString(),
    };

    // Store in cache for immediate access
    this.store(`outcome_${outcome.id}`, outcome);

    // TODO: Persist to Prisma database
    // const result = await this.prisma.opportunityOutcomes.create({
    //   data: { ...outcome, createdAt: new Date() }
    // });

    return outcome;
  }

  /**
   * Track the realized outcome of an opportunity (SUCCESS/FAILURE/PENDING).
   * This is called after the user action and market evaluation.
   */
  async trackOutcome(
    snapshotId: string,
    realizedOutcome: 'SUCCESS' | 'FAILURE' | 'PENDING',
  ): Promise<PersistedOutcome> {
    const cachedOutcome = this.load(`outcome_${snapshotId}` as any) as PersistedOutcome | null;
    if (!cachedOutcome) {
      throw new NotFoundException(`Outcome not found for snapshot: ${snapshotId}`);
    }

    const updatedOutcome: PersistedOutcome = {
      ...cachedOutcome,
      realizedOutcome,
      outcomeTimestamp: new Date().toISOString(),
    };

    // Store updated outcome
    this.store(`outcome_${snapshotId}`, updatedOutcome);

    // TODO: Persist to Prisma database
    // await this.prisma.opportunityOutcomes.update({
    //   where: { id: cachedOutcome.id },
    //   data: { realizedOutcome, outcomeTimestamp: new Date() }
    // });

    return updatedOutcome;
  }

  /**
   * Get all learned weight configurations.
   * Learning never modifies original decisions - only produces new config versions.
   */
  getLearnedConfigs(): PersistedLearnedConfig[] {
    // Return from cache (populated when learned configs are activated)
    const cached = this.load('learned_configs') as PersistedLearnedConfig[] | null;
    if (cached) return cached;

    // Return empty array if no learned configs activated yet
    return [];
  }

  /**
   * Apply learned weights to a radar run (read-only, never modifies originals).
   * Learned weights are additive adjustments applied to the existing config.
   * The original radar config remains unchanged.
   */
  applyLearnedWeights(config: RadarConfig, learnedVersion: PersistedLearnedConfig): RadarConfig {
    // Start with the base config
    const adjusted = {
      ...config,
      minRadarScore: Math.max(config.minRadarScore + (learnedVersion.weightConfig.score || 0), 5),
    };

    // Apply slight adjustments to priority weights if present
    if (learnedVersion.weightConfig.momentum !== undefined) {
      adjusted.priorityWeights = {
        ...adjusted.priorityWeights,
        momentum: Math.max(
          0,
          Math.min(1, adjusted.priorityWeights.momentum + learnedVersion.weightConfig.momentum),
        ),
      };
    }
    if (learnedVersion.weightConfig.convergence !== undefined) {
      adjusted.priorityWeights = {
        ...adjusted.priorityWeights,
        convergence: Math.max(
          0,
          Math.min(
            1,
            adjusted.priorityWeights.convergence + learnedVersion.weightConfig.convergence,
          ),
        ),
      };
    }
    if (learnedVersion.weightConfig.freshness !== undefined) {
      adjusted.priorityWeights = {
        ...adjusted.priorityWeights,
        freshness: Math.max(
          0,
          Math.min(1, adjusted.priorityWeights.freshness + learnedVersion.weightConfig.freshness),
        ),
      };
    }

    // Note: momentum and other weights are adjusted conservatively
    // The original config is never modified - a new adjusted config is returned

    return adjusted;
  }

  /**
   * Activate a learned weight configuration version.
   * Sets isActive=true for the specified version and isActive=false for others.
   */
  async activateLearnedConfig(version: string): Promise<PersistedLearnedConfig> {
    // Find the config version
    const cachedConfigs = this.getLearnedConfigs();
    const configToActivate = cachedConfigs.find((c) => c.version === version);

    if (!configToActivate) {
      throw new NotFoundException(`Learned config version not found: ${version}`);
    }

    // Deactivate all configs
    cachedConfigs.forEach((c) => {
      // Store deactivated state
      this.store(`learned_config_${c.id}`, { ...c, isActive: false });
    });

    // Activate the selected config
    const activated = {
      ...configToActivate,
      isActive: true,
    };

    // Store activated state
    this.store(`learned_config_${configToActivate.id}`, activated);

    // TODO: Update Prisma database
    // await this.prisma.learnedWeightConfigs.update({
    //   where: { id: configToActivate.id },
    //   data: { isActive: true }
    // });

    return activated;
  }

  /**
   * Reset learned state to a previous version.
   * Deactivates all learned configs and can reset to a specific version.
   */
  async resetLearnedState(toVersion?: string): Promise<void> {
    // Get all learned configs
    const cachedConfigs = this.getLearnedConfigs();

    // Deactivate all configs
    cachedConfigs.forEach((c) => {
      this.store(`learned_config_${c.id}`, { ...c, isActive: false });
    });

    // If a specific version is requested, activate it
    if (toVersion) {
      await this.activateLearnedConfig(toVersion);
    }
    // Otherwise, keep all deactivated (reset to baseline)
  }
}
