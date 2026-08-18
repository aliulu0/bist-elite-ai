import { EarlyOpportunityDecision } from '../decision/early-opportunity-decision.types';

/**
 * R2-048 — Radar domain types.
 *
 * The radar references the existing EarlyOpportunityIntelligenceResult /
 * EarlyOpportunityDecision objects rather than recreating them. It adds only a
 * deterministic state, change rationale and a presentation-level priority.
 */
export type RadarState =
  'NEW' | 'STRENGTHENING' | 'CONFIRMED' | 'WEAKENING' | 'INVALIDATED' | 'UNCHANGED';

export type RadarMarketSession = 'PRE_MARKET' | 'OPEN' | 'CLOSED';

export type RadarEventKind =
  | 'NEW_OPPORTUNITY'
  | 'OPPORTUNITY_STRENGTHENED'
  | 'OPPORTUNITY_WEAKENED'
  | 'OPPORTUNITY_INVALIDATED'
  | 'OPPORTUNITY_CONFIRMED'
  | 'radar_progress';

/** Numeric factors the radar tracks for deterministic change detection. */
export interface RadarMetrics {
  earlyOpportunityScore: number;
  eliteScore: number;
  signalConvergence: number;
  confidence: number;
  expectedReturn: number;
  risk: string;
  smartMoneyScore: number | null;
  catalystScore: number | null;
  fundamentalScore: number | null;
  dataQualityScore: number | null;
  predictionConfidence: number | null;
  timeframeAgreement: number | null;
  entryZone: { min: number; max: number } | null;
  decisionScore: number | null;
  decisionStatus: string | null;
  earlyOpportunity: boolean;
  /** Latest price timestamp used to decide warm/cold reuse. */
  dataTimestamp: string;
}

export interface RadarFactorChange {
  factor: string;
  label: string;
  previous: number | null;
  current: number | null;
  delta: number | null;
}

export interface OpportunityRadarItem {
  ticker: string;
  company: string;
  sector: string;
  state: RadarState;
  current: RadarMetrics;
  previous: RadarMetrics | null;
  scoreChange: number | null;
  changes: RadarFactorChange[];
  reasons: string[];
  radarPriority: number;
  dataFreshness: string;
  providerStatus: string | null;
  decision: EarlyOpportunityDecision | null;
  evaluatedAt: string;
}

export interface RadarRunStats {
  providerCalls: number;
  cacheHits: number;
  cheapScans: number;
  deepAnalyses: number;
  symbolsEvaluated: number;
  candidates: number;
  skipped: number;
  errors: number;
}

export interface OpportunityRadarSnapshot {
  timestamp: string;
  marketSession: RadarMarketSession;
  marketSessionLabel: string;
  freshnessNote: string;
  symbolsEvaluated: number;
  activeOpportunities: number;
  newOpportunities: string[];
  strengtheningOpportunities: string[];
  weakeningOpportunities: string[];
  invalidatedOpportunities: string[];
  confirmedOpportunities: string[];
  items: Record<string, OpportunityRadarItem>;
  providerCallStats: RadarRunStats;
  dataQualitySummary: { averageScore: number; warnings: string[] };
  executionDurationMs: number;
  generatedAt: string;
}

export interface OpportunityRadarEvent {
  type: RadarEventKind;
  ticker?: string;
  state?: RadarState;
  score?: number;
  scoreChange?: number | null;
  reasons?: string[];
  timestamp?: string;
  decision?: EarlyOpportunityDecision | null;
  dataQuality?: number | null;
  partial?: boolean;
  completedSymbols?: string[];
  failedSymbols?: string[];
  providerLimitedSymbols?: string[];
  symbolsEvaluated?: number;
}

export interface RadarStatus {
  running: boolean;
  lastRun: string | null;
  lastSuccessfulRun: string | null;
  lastDurationMs: number | null;
  symbolsEvaluated: number;
  candidates: number;
  opportunities: Record<string, number>;
  providerCalls: number;
  cacheHits: number;
  dataQualityWarnings: string[];
  errors: number;
  hasSnapshot: boolean;
}

export interface RadarRunOptions {
  forceRefresh?: boolean;
  sector?: string;
  watchlist?: string[];
  maxSymbols?: number;
  minScore?: number;
}
