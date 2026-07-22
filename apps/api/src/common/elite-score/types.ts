export enum Timeframe {
  M4 = 'M4',
  D1 = 'D1',
  W1 = 'W1',
  M1 = 'M1',
}

export enum ScoringProfile {
  CONSERVATIVE = 'conservative',
  BALANCED = 'balanced',
  AGGRESSIVE = 'aggressive',
}

export enum TrendDirection {
  STRONG_UPTREND = 'strong_uptrend',
  UPTREND = 'uptrend',
  WEAK_UPTREND = 'weak_uptrend',
  SIDEWAYS = 'sideways',
  WEAK_DOWNTREND = 'weak_downtrend',
  DOWNTREND = 'downtrend',
  STRONG_DOWNTREND = 'strong_downtrend',
}

export enum MomentumState {
  OVERBOUGHT = 'overbought',
  BULLISH_MOMENTUM = 'bullish_momentum',
  NEUTRAL = 'neutral',
  BEARISH_MOMENTUM = 'bearish_momentum',
  OVERSOLD = 'oversold',
}

export enum VolumeState {
  HIGH_VOLUME = 'high_volume',
  NORMAL_VOLUME = 'normal_volume',
  LOW_VOLUME = 'low_volume',
  DECLINING = 'declining',
  INCREASING = 'increasing',
}

export enum SignalAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  WATCH = 'WATCH',
}

export enum SignalStrength {
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  VERY_STRONG = 'VERY_STRONG',
}

export interface IndicatorData {
  name: string;
  value: number;
  signal: string;
  weight: number;
  isPositive: boolean;
  timeframe: Timeframe;
}

export interface TimeframeScoreData {
  timeframe: Timeframe;
  indicators?: IndicatorData[];
  trend?: TrendDirection | number;
  momentum?: MomentumState | number;
  volume?: VolumeState | number;
  volatility?: number;
  trendScore?: number;
  momentumScore?: number;
  volumeScore?: number;
  volatilityScore?: number;
}

export interface TechnicalScoreInput {
  timeframe: Timeframe;
  trend?: number;
  momentum?: number;
  volume?: number;
  volatility?: number;
  support?: number;
  resistance?: number;
  indicators?: IndicatorData[];
  rsi?: number;
  macd?: number;
  adx?: number;
  atr?: number;
  bbPosition?: number;
}

export interface TechnicalScoreOutput {
  composite: number;
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  signalCount: number;
  positiveSignals: number;
  negativeSignals: number;
}

export interface ConsensusInput {
  timeframeScores: TimeframeScoreData[];
  indicators: IndicatorData[];
}

export interface ConsensusOutput {
  indicatorAgreement: number;
  strategyAgreement: number;
  timeframeAgreement: number;
  trendConsistency: number;
  signalStrength: number;
  overallConsensus: number;
  conflictCount: number;
  dominantDirection: TrendDirection;
}

export interface HistoricalReliabilityInput {
  winRate?: number;
  maxDrawdown?: number;
  avgReturn?: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  profitFactor?: number;
  totalTrades?: number;
  signalStability?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
}

export interface HistoricalReliabilityOutput {
  score: number;
  winRateScore: number;
  drawdownScore: number;
  returnScore: number;
  consistencyScore: number;
  precisionScore: number;
  recallScore: number;
  profitFactorScore: number;
  overallReliability: string;
}

export interface EarlyOpportunityInput {
  signalFreshness: number;
  confirmationLevel: number;
  timeSinceDetection: number;
  competitorConfirmation: number;
  marketCap?: number;
  sectorMomentum?: number;
}

export interface EarlyOpportunityOutput {
  score: number;
  freshnessBonus: number;
  confirmationPenalty: number;
  earlyDetectionBonus: number;
  description: string;
}

export interface EvidenceMatrixEntry {
  component: string;
  weight: number;
  rawScore: number;
  normalizedScore: number;
  contribution: number;
  positiveImpact: string;
  negativeImpact: string;
  confidence: number;
}

export interface RiskAdjustmentInput {
  volatility?: number;
  liquidity?: number;
  timeframeConflictCount: number;
  indicatorDisagreement: number;
  historicalReliability: number;
}

export interface RiskAdjustmentOutput {
  adjustedScore: number;
  adjustmentFactor: number;
  penalties: Array<{ factor: string; penalty: number; reason: string }>;
}

export interface EliteScoreInput {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  technicalScores?: TechnicalScoreInput[];
  timeframeScores?: TimeframeScoreData[];
  indicators?: IndicatorData[];
  historicalReliability?: HistoricalReliabilityInput;
  earlyOpportunity?: EarlyOpportunityInput;
  riskAdjustment?: RiskAdjustmentInput;
  profile?: ScoringProfile;
  timeframeWeights?: Partial<Record<Timeframe, number>>;
  metadata?: Record<string, unknown>;
}

export interface EliteScoreOutput {
  stockSymbol: string;
  stockName: string;
  generatedAt: string;
  profile: ScoringProfile;
  overallEliteScore: number;
  componentScores: {
    technical: number;
    trend: number;
    momentum: number;
    volume: number;
    volatility: number;
    liquidity: number;
    risk: number;
    strategy: number;
    multiTimeframeConsensus: number;
    historicalReliability: number;
    earlyOpportunity: number;
  };
  evidenceMatrix: EvidenceMatrixEntry[];
  riskAdjustment: RiskAdjustmentOutput;
  confidenceScore: number;
  rank?: number;
  metadata: Record<string, unknown>;
}

export interface ScoreComponentWeights {
  technical: number;
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  liquidity: number;
  risk: number;
  strategy: number;
  multiTimeframeConsensus: number;
  historicalReliability: number;
  earlyOpportunity: number;
}

export interface ScoringConfig {
  enabled: boolean;
  defaultProfile: ScoringProfile;
  profiles: Record<ScoringProfile, ScoreComponentWeights>;
  timeframeWeights: Record<Timeframe, number>;
  scoreRange: { min: number; max: number };
  normalization: {
    method: 'linear' | 'sigmoid' | 'logistic';
    center: number;
    steepness: number;
  };
  earlyOpportunity: {
    freshnessDecayRate: number;
    confirmationPenaltyRate: number;
    maxBonus: number;
    detectionWindowHours: number;
  };
  riskAdjustment: {
    maxPenalty: number;
    volatilityThreshold: number;
    liquidityThreshold: number;
    conflictPenaltyRate: number;
    disagreementPenaltyRate: number;
    reliabilityPenaltyRate: number;
  };
  historicalReliability: {
    minTrades: number;
    winRateWeight: number;
    drawdownWeight: number;
    returnWeight: number;
    consistencyWeight: number;
    precisionWeight: number;
    recallWeight: number;
    profitFactorWeight: number;
  };
  enableCaching: boolean;
  cacheTtlMs: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  enabled: true,
  defaultProfile: ScoringProfile.BALANCED,
  profiles: {
    [ScoringProfile.CONSERVATIVE]: {
      technical: 0.10,
      trend: 0.12,
      momentum: 0.08,
      volume: 0.06,
      volatility: 0.10,
      liquidity: 0.08,
      risk: 0.15,
      strategy: 0.10,
      multiTimeframeConsensus: 0.12,
      historicalReliability: 0.06,
      earlyOpportunity: 0.03,
    },
    [ScoringProfile.BALANCED]: {
      technical: 0.10,
      trend: 0.10,
      momentum: 0.10,
      volume: 0.08,
      volatility: 0.08,
      liquidity: 0.07,
      risk: 0.10,
      strategy: 0.10,
      multiTimeframeConsensus: 0.12,
      historicalReliability: 0.08,
      earlyOpportunity: 0.07,
    },
    [ScoringProfile.AGGRESSIVE]: {
      technical: 0.12,
      trend: 0.08,
      momentum: 0.12,
      volume: 0.10,
      volatility: 0.05,
      liquidity: 0.05,
      risk: 0.05,
      strategy: 0.10,
      multiTimeframeConsensus: 0.10,
      historicalReliability: 0.06,
      earlyOpportunity: 0.17,
    },
  },
  timeframeWeights: {
    [Timeframe.M4]: 0.15,
    [Timeframe.D1]: 0.30,
    [Timeframe.W1]: 0.35,
    [Timeframe.M1]: 0.20,
  },
  scoreRange: { min: 0, max: 100 },
  normalization: {
    method: 'sigmoid',
    center: 50,
    steepness: 0.1,
  },
  earlyOpportunity: {
    freshnessDecayRate: 0.15,
    confirmationPenaltyRate: 0.30,
    maxBonus: 25,
    detectionWindowHours: 72,
  },
  riskAdjustment: {
    maxPenalty: 40,
    volatilityThreshold: 70,
    liquidityThreshold: 30,
    conflictPenaltyRate: 0.25,
    disagreementPenaltyRate: 0.20,
    reliabilityPenaltyRate: 0.15,
  },
  historicalReliability: {
    minTrades: 30,
    winRateWeight: 0.25,
    drawdownWeight: 0.20,
    returnWeight: 0.20,
    consistencyWeight: 0.15,
    precisionWeight: 0.08,
    recallWeight: 0.05,
    profitFactorWeight: 0.07,
  },
  enableCaching: true,
  cacheTtlMs: 300_000,
};

export function getScoringConfig(overrides?: Partial<ScoringConfig>): ScoringConfig {
  if (!overrides) return { ...DEFAULT_SCORING_CONFIG };
  return {
    ...DEFAULT_SCORING_CONFIG,
    ...overrides,
    profiles: overrides.profiles
      ? { ...DEFAULT_SCORING_CONFIG.profiles, ...overrides.profiles }
      : DEFAULT_SCORING_CONFIG.profiles,
    timeframeWeights: overrides.timeframeWeights
      ? { ...DEFAULT_SCORING_CONFIG.timeframeWeights, ...overrides.timeframeWeights }
      : DEFAULT_SCORING_CONFIG.timeframeWeights,
    normalization: { ...DEFAULT_SCORING_CONFIG.normalization, ...overrides.normalization },
    earlyOpportunity: { ...DEFAULT_SCORING_CONFIG.earlyOpportunity, ...overrides.earlyOpportunity },
    riskAdjustment: { ...DEFAULT_SCORING_CONFIG.riskAdjustment, ...overrides.riskAdjustment },
    historicalReliability: { ...DEFAULT_SCORING_CONFIG.historicalReliability, ...overrides.historicalReliability },
  };
}
