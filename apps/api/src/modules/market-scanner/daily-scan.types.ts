import { Timeframe } from '../market-data/interfaces';
import {
  DataStatus,
  EarlyOpportunityClassification,
  ScannerProvenance,
  ScannerSignalQuality,
} from './market-scanner.types';

/**
 * R2-078 — Full BIST Daily Scan + Opportunity Radar types.
 *
 * These types describe the DAILY SCAN workflow:
 *   universe discovery -> market data -> features -> scanner -> Elite Score
 *   -> ranking snapshot -> previous/current comparison -> opportunity radar events.
 *
 * All unavailable values are null or explicit UNAVAILABLE status.
 * Never fabricate: 0, 50, neutral, estimated, simulated, placeholder.
 */

export type DailyScanStatus = 'COMPLETE' | 'PARTIAL' | 'DEGRADED' | 'FAILED';

export type ScanCoverage = 'FULL' | 'PARTIAL' | 'UNAVAILABLE';

export type RadarConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';

/** Ranked result entry stored inside a scan snapshot. */
export interface ScannerRankingResultEntry {
  symbol: string;
  currentPrice: number | null;
  eliteScore: number;
  financialScore: number;
  technicalScore: number;
  confluenceScore: number;
  smartMoneyScore: number;
  marketStructureScore: number;
  multiTimeframeConfluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
  /** Diagnostic 0-100 score. Does NOT replace Elite Score. */
  multiTimeframeScore: number | null;
  earlyOpportunityClassification: EarlyOpportunityClassification;
  scannerSignalQuality: ScannerSignalQuality;
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null;
  volumeStatus: 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE';
  /** 20-day relative volume (real OHLCV derived). null when unavailable. */
  relativeVolume20: number | null;
  volumeSpike: boolean | null;
  breakoutStatus: 'PRE_BREAKOUT' | 'BREAKOUT' | 'NO_BREAKOUT' | 'UNAVAILABLE';
  momentumStatus: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN';
  /** 5-day momentum (real OHLCV derived). null when unavailable. */
  momentum5D: number | null;
  relativeStrength: number | null;
  rank: number;
  status: 'TOP_CANDIDATE' | 'WATCHLIST' | 'REJECTED';
  dataStatus: DataStatus;
  sourceProvenance: ScannerProvenance;
}

/** Per-provider request accounting inside a snapshot. */
export interface ProviderScanSummary {
  provider: string;
  requested: number;
  available: number;
  unavailable: number;
  rateLimited: number;
  failed: number;
  cacheHits: number;
}

/** Immutable daily scan snapshot (scanner/ranking state, NOT raw market data). */
export interface ScannerRankingSnapshot {
  scanId: string;
  scanTimestamp: string;
  marketTimestamp: string;
  version: string;
  schemaVersion: number;
  status: DailyScanStatus;
  universeSize: number;
  equityCandidateCount: number;
  evaluatedCount: number;
  eligibleCount: number;
  signalCount: number;
  availableCount: number;
  unavailableCount: number;
  rateLimitedCount: number;
  failedCount: number;
  results: ScannerRankingResultEntry[];
  providerSummary: ProviderScanSummary[];
  dataQuality: 'VALID' | 'PARTIAL' | 'UNAVAILABLE';
  coverage: ScanCoverage;
  executionDurationMs: number;
}

/** Radar event types detected by comparing previous vs current scan. */
export type OpportunityRadarEventType =
  | 'NEW_OPPORTUNITY'
  | 'OPPORTUNITY_STRENGTHENING'
  | 'RANK_IMPROVEMENT'
  | 'SCORE_SURGE'
  | 'BREAKOUT_DEVELOPING'
  | 'VOLUME_EXPANSION'
  | 'MOMENTUM_ACCELERATION'
  | 'MULTI_TIMEFRAME_ALIGNMENT'
  | 'DNA_RELEVANCE'
  | 'SIGNAL_WEAKENING'
  | 'RANK_DETERIORATION'
  | 'SIGNAL_LOST'
  | 'DATA_QUALITY_DETERIORATION'
  | 'DATA_BECAME_UNAVAILABLE'
  | 'DATA_BECAME_AVAILABLE';

export interface OpportunityRadarEvent {
  scanId: string;
  type: OpportunityRadarEventType;
  symbol: string;
  previousState: string | null;
  currentState: string | null;
  eliteScore: number | null;
  previousEliteScore: number | null;
  rank: number | null;
  previousRank: number | null;
  classification: string | null;
  reason: string;
  factors: string[];
  dataStatus: DataStatus;
  confidence: RadarConfidence;
  sourceProvenance: ScannerProvenance;
  timestamp: string;
}

export interface OpportunityRadarResponse {
  scanId: string;
  scanTimestamp: string;
  eventCount: number;
  events: OpportunityRadarEvent[];
}

export interface ScanComparisonEntry {
  symbol: string;
  previous: ScannerRankingResultEntry | null;
  current: ScannerRankingResultEntry | null;
  /** NOT_PRESENT = new to current scan, PRESENT = in both, REMOVED = only in previous. */
  transition: 'NOT_PRESENT' | 'PRESENT' | 'REMOVED';
  rankDelta: number | null;
  eliteScoreDelta: number | null;
}

export interface ScanComparison {
  scanId: string;
  previousScanId: string | null;
  comparedAt: string;
  entries: ScanComparisonEntry[];
}

export interface DailyScanSummary {
  scanId: string;
  timestamp: string;
  status: DailyScanStatus;
  universeSize: number;
  equityCount: number;
  evaluatedCount: number;
  availableCount: number;
  unavailableCount: number;
  rateLimitedCount: number;
  failedCount: number;
  signalCount: number;
  eligibleCount: number;
  top10: ScannerRankingResultEntry[];
  top20: ScannerRankingResultEntry[];
  top50: ScannerRankingResultEntry[];
  newOpportunities: OpportunityRadarEvent[];
  strengtheningSignals: OpportunityRadarEvent[];
  rankImprovements: OpportunityRadarEvent[];
  scoreSurges: OpportunityRadarEvent[];
  volumeExpansions: OpportunityRadarEvent[];
  momentumAccelerations: OpportunityRadarEvent[];
  breakoutDevelopments: OpportunityRadarEvent[];
  multiTimeframeAlignments: OpportunityRadarEvent[];
  weakenedSignals: OpportunityRadarEvent[];
  lostSignals: OpportunityRadarEvent[];
  providerSummary: ProviderScanSummary[];
  dataQuality: 'VALID' | 'PARTIAL' | 'UNAVAILABLE';
}

export interface DailyScanResponse {
  scanId: string;
  status: DailyScanStatus;
  summary: DailyScanSummary;
  timestamp: string;
}

export interface DailyScanRunOptions {
  forceRefresh?: boolean;
  maxSymbols?: number;
}

/** Timeframe availability context used when building per-timeframe snapshot fields. */
export interface TimeframeAvailabilityMap {
  timeframe: Timeframe;
  dataStatus: DataStatus;
  source: 'REAL' | 'DERIVED' | 'UNAVAILABLE';
}
