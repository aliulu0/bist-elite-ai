/**
 * R2-048 — Live Opportunity Monitoring & Radar Engine configuration.
 *
 * All values are environment-driven so the radar behaves the same in any
 * clean runtime and no thresholds are hardcoded across the codebase.
 */
export interface RadarThresholds {
  /** Material Early Opportunity Score change that drives STRENGTHENING/WEAKENING. */
  scoreChange: number;
  /** Material signal convergence change. */
  signalConvergenceChange: number;
  /** Material confidence change. */
  confidenceChange: number;
  /** Material expected-return change (percentage points). */
  expectedReturnChangePct: number;
  /** Minimum score increase to be classified STRENGTHENING. */
  strengthenScore: number;
  /** Minimum score decrease to be classified WEAKENING. */
  weakenScore: number;
  /** Minimum score to be classified CONFIRMED when stable. */
  confirmedScore: number;
}

export interface RadarStage1Config {
  /** Minimum signal convergence for a symbol to enter Stage 2/3 deep analysis. */
  minSignalConvergence: number;
  /** Minimum early-stage signal count for a symbol to enter deep analysis. */
  minEarlySignals: number;
}

export interface RadarPriorityWeights {
  score: number;
  momentum: number;
  freshness: number;
  convergence: number;
}

export interface RadarUniverseConfig {
  sector?: string;
  watchlist?: string[];
  liquidity?: 'high' | 'medium' | 'low';
}

export interface RadarConfig {
  /** Maximum symbols evaluated per radar run (personal-use safety cap). */
  maxSymbols: number;
  /** Minimum Early Opportunity Score for a symbol to be an "active opportunity". */
  minRadarScore: number;
  stage1: RadarStage1Config;
  thresholds: RadarThresholds;
  priorityWeights: RadarPriorityWeights;
  /** Number of historical snapshots retained (memory-bounded). */
  snapshotHistoryLimit: number;
  /** Max age of reused data before a fresh deep analysis is forced. */
  freshnessTtlMs: number;
}

function num(value: string | undefined, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function getRadarConfig(): RadarConfig {
  return {
    maxSymbols: num(process.env.RADAR_MAX_SYMBOLS, 40),
    minRadarScore: num(process.env.RADAR_MIN_SCORE, 45),
    stage1: {
      minSignalConvergence: num(process.env.RADAR_STAGE1_MIN_CONVERGENCE, 50),
      minEarlySignals: num(process.env.RADAR_STAGE1_MIN_EARLY_SIGNALS, 2),
    },
    thresholds: {
      scoreChange: num(process.env.RADAR_THRESHOLD_SCORE_CHANGE, 5),
      signalConvergenceChange: num(process.env.RADAR_THRESHOLD_CONVERGENCE_CHANGE, 5),
      confidenceChange: num(process.env.RADAR_THRESHOLD_CONFIDENCE_CHANGE, 5),
      expectedReturnChangePct: num(process.env.RADAR_THRESHOLD_RETURN_CHANGE_PCT, 5),
      strengthenScore: num(process.env.RADAR_STRENGTHEN_SCORE, 5),
      weakenScore: num(process.env.RADAR_WEAKEN_SCORE, 5),
      confirmedScore: num(process.env.RADAR_CONFIRMED_SCORE, 70),
    },
    priorityWeights: {
      score: num(process.env.RADAR_PRIORITY_WEIGHT_SCORE, 0.6),
      momentum: num(process.env.RADAR_PRIORITY_WEIGHT_MOMENTUM, 0.2),
      freshness: num(process.env.RADAR_PRIORITY_WEIGHT_FRESHNESS, 0.1),
      convergence: num(process.env.RADAR_PRIORITY_WEIGHT_CONVERGENCE, 0.1),
    },
    snapshotHistoryLimit: num(process.env.RADAR_SNAPSHOT_HISTORY, 10),
    freshnessTtlMs: num(process.env.RADAR_FRESHNESS_TTL_MS, 3_600_000),
  };
}

export const DEFAULT_RADAR_CONFIG = getRadarConfig();
