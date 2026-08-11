export type HistoricalStatusLabel = 'complete' | 'partial' | 'empty' | 'unknown';

export type HistoricalBackfillStatus = 'idle' | 'running' | 'completed' | 'partial' | 'failed' | 'no-data' | 'STALE_BUT_VALID';

export type HistoricalFreshness = 'fresh' | 'stale' | 'no-data';

export type HistoryTab = 'overview' | 'symbol' | 'backfill';

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
  timeframe: string;
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

export interface SymbolHistoricalSummary {
  symbol: string;
  timeframe: string;
  status: HistoricalStatusLabel;
  barCount: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  provider: string;
  usableForBacktest: boolean;
}

export interface HistoricalAllSymbolsReport {
  generatedAt: string;
  timeframe: string;
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
  actualProvider: string | null;
  fallbackUsed: boolean;
  providerAttempts: number;
}

export interface HistoricalBackfillAllResult {
  timeframe: string;
  results: HistoricalBackfillResult[];
  failedSymbols: string[];
}

export const HISTORY_TIMEFRAMES: readonly string[] = ['1h', '2h', '4h', '1d', '1w', '1m', '3m', '6m'];

export const HISTORY_STATUS_LABELS: Record<HistoricalStatusLabel, string> = {
  complete: 'Tamamlanmış',
  partial: 'Kısmi',
  empty: 'Boş',
  unknown: 'Bilinmiyor',
};

export const HISTORY_STATUS_COLORS: Record<HistoricalStatusLabel, string> = {
  complete: 'border-success/40 bg-success/10 text-success',
  partial: 'border-warning/40 bg-warning/10 text-warning',
  empty: 'border-muted bg-muted text-muted-foreground',
  unknown: 'border-border text-muted-foreground',
};

export const BACKFILL_STATUS_LABELS: Record<HistoricalBackfillStatus, string> = {
  idle: 'Beklemede',
  running: 'Sürüyor',
  completed: 'Tamamlandı',
  partial: 'Kısmi',
  failed: 'Başarısız',
  'no-data': 'Veri Yok',
  STALE_BUT_VALID: 'Eski Veri Korundu',
};

export const BACKFILL_STATUS_COLORS: Record<HistoricalBackfillStatus, string> = {
  idle: 'border-border text-muted-foreground',
  running: 'border-info/40 bg-info/10 text-info',
  completed: 'border-success/40 bg-success/10 text-success',
  partial: 'border-warning/40 bg-warning/10 text-warning',
  failed: 'border-destructive/40 bg-destructive/10 text-destructive',
  'no-data': 'border-muted bg-muted text-muted-foreground',
  STALE_BUT_VALID: 'border-warning/40 bg-warning/10 text-warning',
};

export const FRESHNESS_LABELS: Record<HistoricalFreshness, string> = {
  fresh: 'Güncel',
  stale: 'Bayat',
  'no-data': 'Veri Yok',
};

export const VALIDATION_LABELS: Record<HistoricalQuality['validationStatus'], string> = {
  valid: 'Geçerli',
  partial: 'Kısmi',
  invalid: 'Geçersiz',
  unknown: 'Bilinmiyor',
};
