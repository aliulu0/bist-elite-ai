export const ANALYST_TOP_UNIVERSE_LIMIT = 40;
export const ANALYST_DEFAULT_TOP_LIMIT = 10;
export const ANALYST_HISTORICAL_LIMIT = 260;
export const ANALYST_TIMEFRAME = '1d' as const;

export const ANALYST_QUALITY_THRESHOLDS = {
  PERFECT: 85,
  VERY_GOOD: 70,
  GOOD: 55,
  AVERAGE: 40,
} as const;

export const ANALYST_SCORE_WEIGHTS = {
  opportunity: 0.25,
  eliteDaily: 0.2,
  tomorrowScore: 0.15,
  decision: 0.15,
  entryConfidence: 0.1,
  verification: 0.08,
  catalyst: 0.07,
} as const;

export const ANALYST_RISK_THRESHOLDS = {
  low: 30,
  medium: 60,
  high: 80,
} as const;

export const ANALYST_LIQUIDITY_THRESHOLDS = {
  high: 70,
  medium: 40,
} as const;

export const ANALYST_MOMENTUM_THRESHOLDS = {
  strong: 70,
  moderate: 40,
} as const;

export const ANALYST_VERIFICATION_THRESHOLDS = {
  verifiedRatio: 0.5,
  conflictRatio: 0.3,
} as const;