/**
 * R2-078 — Daily Scan configuration.
 *
 * All radar event thresholds are EXPLICIT, DOCUMENTED and TESTABLE.
 * They are NOT optimized using future performance / historical profitability.
 * They only describe observable state transitions between two scans.
 */

export interface RadarEventThresholds {
  /** Elite Score increase required for OPPORTUNITY_STRENGTHENING (score points). */
  opportunityStrengtheningMinDelta: number;
  /** Elite Score increase required for SCORE_SURGE (score points). */
  scoreSurgeMinDelta: number;
  /** Elite Score decrease required for SIGNAL_WEAKENING (score points). */
  signalWeakeningMinDelta: number;
  /** Rank improvement (smaller rank number) required for RANK_IMPROVEMENT (positions). */
  rankImprovementMinDelta: number;
  /** Rank deterioration (larger rank number) required for RANK_DETERIORATION (positions). */
  rankDeteriorationMinDelta: number;
  /** relativeVolume20 >= this triggers VOLUME_EXPANSION when previous < this. */
  volumeExpansionMinRelativeVolume: number;
  /** relativeVolume20 increase required for VOLUME_EXPANSION. */
  volumeExpansionMinDelta: number;
  /** momentum5D increase required for MOMENTUM_ACCELERATION. */
  momentumAccelerationMinDelta: number;
  /** confluence transition target for MULTI_TIMEFRAME_ALIGNMENT. */
  multiTimeframeAlignmentTarget: 'STRONG' | 'MODERATE';
}

export interface DailyScanNotificationConfig {
  minEliteScore: number;
  maxEventsPerScan: number;
  includeWeakening: boolean;
  includeLost: boolean;
}

export interface DailyScanConfig {
  enabled: boolean;
  timezone: string;
  /** Daily scan time HH:mm in the configured timezone. */
  scheduleTime: string;
  /** Bounded symbol analysis concurrency to respect provider budget. */
  concurrency: number;
  /** 0 = unlimited (scan as many AVAILABLE equities as discovery validates). */
  maxSymbolsPerScan: number;
  /** Snapshot retention TTL in ms (existing CacheService namespace). */
  snapshotTtlMs: number;
  /** CacheService namespace used for snapshots. */
  snapshotNamespace: string;
  radarEventThresholds: RadarEventThresholds;
  notification: DailyScanNotificationConfig;
}

export const DEFAULT_DAILY_SCAN_CONFIG: DailyScanConfig = {
  enabled: false,
  timezone: 'Europe/Istanbul',
  scheduleTime: '20:00',
  concurrency: 5,
  maxSymbolsPerScan: 0,
  snapshotTtlMs: 7 * 24 * 60 * 60 * 1000,
  snapshotNamespace: 'scannerSnapshots',
  radarEventThresholds: {
    opportunityStrengtheningMinDelta: 5,
    scoreSurgeMinDelta: 10,
    signalWeakeningMinDelta: 8,
    rankImprovementMinDelta: 3,
    rankDeteriorationMinDelta: 3,
    volumeExpansionMinRelativeVolume: 1.5,
    volumeExpansionMinDelta: 0.5,
    momentumAccelerationMinDelta: 0.02,
    multiTimeframeAlignmentTarget: 'STRONG',
  },
  notification: {
    minEliteScore: 60,
    maxEventsPerScan: 25,
    includeWeakening: false,
    includeLost: false,
  },
};

export function getDailyScanConfig(overrides?: Partial<DailyScanConfig>): DailyScanConfig {
  if (!overrides) return { ...DEFAULT_DAILY_SCAN_CONFIG };
  return {
    ...DEFAULT_DAILY_SCAN_CONFIG,
    ...overrides,
    radarEventThresholds: {
      ...DEFAULT_DAILY_SCAN_CONFIG.radarEventThresholds,
      ...overrides.radarEventThresholds,
    },
    notification: {
      ...DEFAULT_DAILY_SCAN_CONFIG.notification,
      ...overrides.notification,
    },
  };
}

export function parseDailyScanConfigFromEnv(): Partial<DailyScanConfig> {
  const config: Partial<DailyScanConfig> = {};

  if (process.env.DAILY_SCAN_ENABLED !== undefined) {
    config.enabled = process.env.DAILY_SCAN_ENABLED === 'true';
  }
  if (process.env.DAILY_SCAN_TIMEZONE) {
    config.timezone = process.env.DAILY_SCAN_TIMEZONE;
  }
  if (process.env.DAILY_SCAN_TIME) {
    config.scheduleTime = process.env.DAILY_SCAN_TIME;
  }
  if (process.env.DAILY_SCAN_CONCURRENCY) {
    config.concurrency = parseInt(process.env.DAILY_SCAN_CONCURRENCY, 10);
  }
  if (process.env.DAILY_SCAN_MAX_SYMBOLS) {
    config.maxSymbolsPerScan = parseInt(process.env.DAILY_SCAN_MAX_SYMBOLS, 10);
  }

  return config;
}
