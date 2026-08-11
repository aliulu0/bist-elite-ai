export const SCORING_VERSION = '1.0.0';

export type ScoreDimension =
  | 'technical'
  | 'fundamental'
  | 'verification'
  | 'catalyst'
  | 'liquidity'
  | 'risk'
  | 'volume'
  | 'momentum'
  | 'trend'
  | 'quality';

export const SCORE_DIMENSIONS: ScoreDimension[] = [
  'technical',
  'fundamental',
  'verification',
  'catalyst',
  'liquidity',
  'risk',
  'volume',
  'momentum',
  'trend',
  'quality',
];

export interface ScoreResult {
  dimension: ScoreDimension;
  score: number | null;
  label: string;
  details: Record<string, unknown>;
}

export interface ScoreWeights {
  technical: number;
  fundamental: number;
  verification: number;
  catalyst: number;
  liquidity: number;
  risk: number;
  volume: number;
  momentum: number;
  trend: number;
  quality: number;
}

export interface StrategyWeightProfile {
  strategyId: string;
  strategyName: string;
  weights: ScoreWeights;
}

export interface AIScoreResult {
  aiScore: number | null;
  aiConfidence: number | null;
  weightedScore: number | null;
  scores: ScoreResult[];
  availableDimensionCount: number;
  totalDimensions: number;
}

export interface ScorePipelineInput {
  ticker: string;
  company: string;
  sector: string | null;
  price: number | null;
  volume: number | null;
  marketCap: number | null;
  provider: string;
  lastUpdate: string | null;
  historicalPrices?: HistoricalPricePoint[];
  financials?: FinancialSnapshot;
  verificationData?: VerificationSnapshot;
  catalystData?: CatalystSnapshot;
  indicators?: IndicatorSnapshot;
  providerCoverage?: ProviderCoverage;
  freshnessMs?: number | null;
}

export interface HistoricalPricePoint {
  date: string;
  close: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface FinancialSnapshot {
  peRatio: number | null;
  pbRatio: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
  roe: number | null;
  dividendYield: number | null;
  revenue: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  ebitda: number | null;
  freeCashFlow: number | null;
}

export interface VerificationSnapshot {
  sourceCount: number;
  verifiedCount: number;
  likelyCount: number;
  confidence: number | null;
  evidenceCount: number;
}

export interface CatalystSnapshot {
  count: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  strongestType: string | null;
  strongestDirection: string | null;
}

export interface IndicatorSnapshot {
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  adx: number | null;
  atr: number | null;
  bollingerUpper: number | null;
  bollingerLower: number | null;
  bollingerMiddle: number | null;
  stochasticK: number | null;
  stochasticD: number | null;
  obv: number | null;
  mfi: number | null;
  roc: number | null;
  cci: number | null;
  williamsR: number | null;
  vwap: number | null;
  ichimokuA: number | null;
  ichimokuB: number | null;
}

export interface ProviderCoverage {
  yahoo: boolean;
  fintables: boolean;
  finnhub: boolean;
  serpApi: boolean;
  kap: boolean;
  tcmb: boolean;
  mkk: boolean;
  alphaVantage: boolean;
}

export interface DataFreshness {
  priceAgeMs: number | null;
  financialsAgeMs: number | null;
  verificationAgeMs: number | null;
  catalystAgeMs: number | null;
}

export interface ScorePipelineOutput {
  scores: ScoreResult[];
  aiResult: AIScoreResult;
  pipelineDurationMs: number;
}

export interface ScoreEngineInput {
  ticker: string;
  strategyId: string;
  pipelineInput: ScorePipelineInput;
}

export interface ScoreEngineOutput {
  ticker: string;
  strategyId: string;
  strategyName: string;
  scoredAt: string;
  pipeline: ScorePipelineOutput;
}
