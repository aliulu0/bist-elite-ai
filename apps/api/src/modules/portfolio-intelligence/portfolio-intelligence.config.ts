export const PORTFOLIO_INTELLIGENCE_NAMESPACE = 'portfolio';

export const PORTFOLIO_INTELLIGENCE_CACHE_TTL_MS = 30_000;

export const PORTFOLIO_INTELLIGENCE_VERSION = '1.0.0';

export const PORTFOLIO_INTELLIGENCE_CACHE_MAX_POSITIONS = 50;

export type PortfolioStatusKey = 'VERY_STRONG' | 'STRONG' | 'BALANCED' | 'WARNING' | 'HIGH_RISK';

export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatusKey, string> = {
  VERY_STRONG: 'ÇOK GÜÇLÜ',
  STRONG: 'GÜÇLÜ',
  BALANCED: 'DENGELİ',
  WARNING: 'DİKKAT',
  HIGH_RISK: 'YÜKSEK RİSK',
};

export interface PortfolioIntelligenceWeights {
  earlyOpportunity: number;
  eliteScore: number;
  multiTimeframe: number;
  confidence: number;
  smartMoney: number;
  catalyst: number;
  riskInverse: number;
  liquidity: number;
  verification: number;
  diversification: number;
}

export const PORTFOLIO_INTELLIGENCE_WEIGHTS: PortfolioIntelligenceWeights = {
  earlyOpportunity: 0.2,
  eliteScore: 0.15,
  multiTimeframe: 0.1,
  confidence: 0.1,
  smartMoney: 0.1,
  catalyst: 0.05,
  riskInverse: 0.15,
  liquidity: 0.05,
  verification: 0.05,
  diversification: 0.05,
};

export const PORTFOLIO_SCORE_MIN = 0;
export const PORTFOLIO_SCORE_MAX = 100;

export const PORTFOLIO_STATUS_THRESHOLDS = {
  VERY_STRONG: 75,
  STRONG: 60,
  BALANCED: 45,
  WARNING: 30,
  HIGH_RISK: 0,
} as const;

export type PositionStatus =
  | 'STRONG_HOLD'
  | 'HOLD'
  | 'WATCH'
  | 'REDUCE'
  | 'EXIT_REVIEW';

export const POSITION_STATUS_STRONG_HOLD_MIN_SCORE = 70;
export const POSITION_STATUS_HOLD_MIN_SCORE = 50;
export const POSITION_STATUS_WATCH_MIN_SCORE = 35;
export const POSITION_STATUS_EXIT_MAX_PNL_PERCENT = -15;
export const POSITION_STATUS_EXIT_HIGH_RISK_SCORE = 60;

export const CONCENTRATION_THRESHOLDS = {
  singlePosition: 0.3,
  sector: 0.5,
  top3: 0.6,
  top5: 0.75,
  lowConfidence: 0.4,
  lowLiquidity: 0.4,
  weakSmartMoney: 0.4,
  negativeCatalyst: 0.4,
  weakVerification: 0.4,
} as const;

export const DIVERSIFICATION_SCORE_CONCENTRATION_PENALTY = 20;

export const REBALANCE_TARGET_BANDS = {
  defaultMin: 5,
  defaultMax: 25,
  sectorAdjustedMin: 5,
  concentrationMax: 25,
} as const;

export const REBALANCE_ACTION = {
  REDUCE_CONCENTRATION: 'REDUCE_CONCENTRATION',
  CONSIDER_INCREASE: 'CONSIDER_INCREASE',
  IN_RANGE: 'IN_RANGE',
} as const;

export const SCENARIO_BULL_UPSIDE_WEIGHT = 0.7;
export const SCENARIO_BEAR_DOWNSIDE_WEIGHT = 0.7;

export const HORIZON_RANKING = {
  Intraday: ['1h', '2h', '4h'],
  Swing: ['1d', '1w'],
  Position: ['1m', '3m'],
  Investment: ['6m'],
} as const;

export const PORTFOLIO_DEFAULT_LIMIT_OPPORTUNITIES = 10;
export const PORTFOLIO_OPPORTUNITIES_NOT_HELD_LIMIT = 5;
