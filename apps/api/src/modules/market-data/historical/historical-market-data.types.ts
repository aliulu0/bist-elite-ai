import { Timeframe } from '../interfaces';

export type HistoricalStatusLabel = 'complete' | 'partial' | 'empty' | 'unknown';

export type HistoricalBackfillStatus = 'idle' | 'running' | 'completed' | 'partial' | 'failed' | 'no-data' | 'STALE_BUT_VALID';

export type HistoricalFreshness = 'fresh' | 'stale' | 'no-data';

export interface HistoricalRange {
  start: string;
  end: string;
}

export interface HistoricalCoverage {
  expectedBarCount: number;
  actualBarCount: number;
  coveragePercent: number;
  gapCount: number;
  largestGap: number;
  missingRanges: HistoricalRange[];
}

export interface HistoricalQuality {
  qualityScore: number;
  validationStatus: 'valid' | 'partial' | 'invalid' | 'unknown';
  integrityValid: boolean;
  freshness: HistoricalFreshness;
  /** Deterministic reason explaining why a series is/is not usable for backtests. */
  reason: string;
  usableForBacktest: boolean;
  lastAssessmentAt: string | null;
}

export interface HistoricalBackfillInfo {
  status: HistoricalBackfillStatus;
  lastRunAt: string | null;
  lastError: string | null;
  fetchedBars: number;
  requestedRanges: number;
  completedRanges: number;
  failedRanges: number;
  remainingRanges: number;
  message: string;
}

export interface SymbolHistoricalSource {
  provider: string;
  primaryProvider: string | null;
  fallbackUsed: boolean;
  providerAttempts: number;
  cacheHit: boolean;
  lastUpdated: string | null;
}

export interface SymbolHistoricalStatus {
  symbol: string;
  timeframe: Timeframe | string;
  status: HistoricalStatusLabel;
  hasData: boolean;
  barCount: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  lastUpdated: string | null;
  coverage: HistoricalCoverage;
  quality: HistoricalQuality;
  source: SymbolHistoricalSource;
  backfill: HistoricalBackfillInfo;
}

/** Lightweight status entry used by the all-symbols list endpoint (metadata only). */
export interface SymbolHistoricalSummary {
  symbol: string;
  timeframe: Timeframe | string;
  status: HistoricalStatusLabel;
  barCount: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  provider: string;
  usableForBacktest: boolean;
}

export interface HistoricalAllSymbolsReport {
  generatedAt: string;
  timeframe: Timeframe | string;
  totalSymbols: number;
  symbolsWithHistory: number;
  symbolsWithoutHistory: number;
  averageCoverage: number;
  completeSymbols: number;
  incompleteSymbols: number;
  staleSymbols: number;
  invalidSymbols: number;
  symbols: SymbolHistoricalSummary[];
}

export interface HistoricalBackfillOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  force?: boolean;
  concurrency?: number;
  /** Test/deterministic override for "now"; defaults to Date.now(). */
  now?: number;
}

export interface HistoricalBackfillResult {
  symbol: string;
  timeframe: string;
  status: HistoricalBackfillStatus;
  fetchedBars: number;
  requestedRanges: number;
  completedRanges: number;
  failedRanges: number;
  remainingRanges: number;
  barCount: number;
  message: string;
  missingRanges: HistoricalRange[];
  warnings: string[];
  /** Provider that actually served the newest fetched data (null when nothing was fetched). */
  actualProvider: string | null;
  /** True when the orchestrator had to fall back from the primary provider. */
  fallbackUsed: boolean;
  /** Total provider attempts across all requested ranges. */
  providerAttempts: number;
}

export interface HistoricalBackfillRunRecord {
  status: HistoricalBackfillStatus;
  startedAt: string;
  finishedAt: string | null;
  message: string;
  fetchedBars: number;
  requestedRanges: number;
  completedRanges: number;
  failedRanges: number;
  missingRanges: HistoricalRange[];
}
