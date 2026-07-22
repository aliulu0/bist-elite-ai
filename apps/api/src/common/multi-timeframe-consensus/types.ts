export enum Timeframe {
  M4 = 'M4',
  D1 = 'D1',
  W1 = 'W1',
  M1 = 'M1',
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  [Timeframe.M4]: '4 Saatlik',
  [Timeframe.D1]: 'Gunluk',
  [Timeframe.W1]: 'Haftalik',
  [Timeframe.M1]: 'Aylik',
};

export const TIMEFRAME_ORDER: Timeframe[] = [Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1];

export const SHORT_TERM_TIMEFRAMES: Timeframe[] = [Timeframe.M4];
export const MEDIUM_TERM_TIMEFRAMES: Timeframe[] = [Timeframe.D1, Timeframe.W1];
export const LONG_TERM_TIMEFRAMES: Timeframe[] = [Timeframe.M1];

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

export enum ConflictType {
  SHORT_LONG_CONFLICT = 'short_long_conflict',
  TREND_REVERSAL = 'trend_reversal',
  WEAK_CONFIRMATION = 'weak_confirmation',
  MIXED_INDICATORS = 'mixed_indicators',
  VOLUME_INCONSISTENCY = 'volume_inconsistency',
  RISK_INCONSISTENCY = 'risk_inconsistency',
  MOMENTUM_DIVERGENCE = 'momentum_divergence',
}

export enum ConflictSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ConsensusStrength {
  STRONG = 'strong',
  MODERATE = 'moderate',
  WEAK = 'weak',
  CONFLICTING = 'conflicting',
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  WATCH = 'WATCH',
}

export interface TimeframeIndicator {
  name: string;
  value: number;
  signal: string;
  weight: number;
  isPositive: boolean;
}

export interface TimeframeData {
  timeframe: Timeframe;
  price: number;
  change?: number;
  changePercent?: number;
  indicators?: TimeframeIndicator[];
  trend?: TrendDirection;
  trendScore?: number;
  momentum?: MomentumState;
  momentumScore?: number;
  volume?: VolumeState;
  volumeScore?: number;
  volatility?: number;
  support?: number;
  resistance?: number;
  riskScore?: number;
  strategySignal?: SignalType;
  strategyConfidence?: number;
}

export interface ConflictDetail {
  type: ConflictType;
  severity: ConflictSeverity;
  timeframe1: Timeframe;
  timeframe2: Timeframe;
  description: string;
  descriptionTr: string;
  impact: number;
  indicators?: string[];
}

export interface TrendInfo {
  direction: TrendDirection;
  strength: number;
  confidence: number;
  timeframe: Timeframe;
  description: string;
  indicators: string[];
}

export interface EarlyAlignment {
  timeframe: Timeframe;
  alignmentScore: number;
  confirmationLevel: number;
  isLeading: boolean;
  emergingIndicators: string[];
  potentialFalseConfirm: boolean;
  description: string;
  descriptionTr: string;
}

export interface TimeframeConsensusScore {
  timeframe: Timeframe;
  score: number;
  trendAgreement: number;
  momentumAgreement: number;
  volumeConfirmation: number;
  riskAgreement: number;
  indicatorAgreement: number;
  strategyAgreement: number;
  srAlignment: number;
  signalTiming: number;
  weightedContribution: number;
  confidence: number;
}

export interface ConsensusEvidence {
  component: string;
  weight: number;
  rawScore: number;
  normalizedScore: number;
  contribution: number;
  description: string;
  descriptionTr: string;
}

export interface ConsensusSummary {
  overallScore: number;
  consensusStrength: ConsensusStrength;
  consensusConfidence: number;
  conflictLevel: number;
  trendStrength: number;
  dominantDirection: TrendDirection;
  description: string;
  descriptionTr: string;
}

export interface ConsensusConfig {
  enabled: boolean;
  timeframeWeights: Record<Timeframe, number>;
  trendWeights: Record<Timeframe, number>;
  momentumWeights: Record<Timeframe, number>;
  volumeWeights: Record<Timeframe, number>;
  indicatorWeights: Record<string, number>;
  conflictThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  consensusThresholds: {
    strong: number;
    moderate: number;
    weak: number;
  };
  earlyAlignment: {
    minAlignmentScore: number;
    minConfirmationLevel: number;
    maxFalseConfirmProbability: number;
    leadingIndicatorBonus: number;
  };
  riskAdjustment: {
    maxPenalty: number;
    conflictPenaltyRate: number;
    inconsistencyPenaltyRate: number;
  };
  normalization: {
    method: 'linear' | 'sigmoid' | 'logistic';
    center: number;
    steepness: number;
  };
  enableCaching: boolean;
  cacheTtlMs: number;
}

export const DEFAULT_CONSENSUS_CONFIG: ConsensusConfig = {
  enabled: true,
  timeframeWeights: {
    [Timeframe.M4]: 0.15,
    [Timeframe.D1]: 0.30,
    [Timeframe.W1]: 0.35,
    [Timeframe.M1]: 0.20,
  },
  trendWeights: {
    [Timeframe.M4]: 0.20,
    [Timeframe.D1]: 0.30,
    [Timeframe.W1]: 0.35,
    [Timeframe.M1]: 0.15,
  },
  momentumWeights: {
    [Timeframe.M4]: 0.25,
    [Timeframe.D1]: 0.30,
    [Timeframe.W1]: 0.30,
    [Timeframe.M1]: 0.15,
  },
  volumeWeights: {
    [Timeframe.M4]: 0.20,
    [Timeframe.D1]: 0.35,
    [Timeframe.W1]: 0.30,
    [Timeframe.M1]: 0.15,
  },
  indicatorWeights: {
    RSI: 0.15,
    MACD: 0.15,
    EMA: 0.12,
    SMA: 0.10,
    BollingerBands: 0.10,
    ATR: 0.08,
    ADX: 0.10,
    VWAP: 0.08,
    Stochastic: 0.07,
    Ichimoku: 0.05,
  },
  conflictThresholds: {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    critical: 0.9,
  },
  consensusThresholds: {
    strong: 0.75,
    moderate: 0.50,
    weak: 0.30,
  },
  earlyAlignment: {
    minAlignmentScore: 0.6,
    minConfirmationLevel: 0.7,
    maxFalseConfirmProbability: 0.3,
    leadingIndicatorBonus: 0.15,
  },
  riskAdjustment: {
    maxPenalty: 30,
    conflictPenaltyRate: 0.20,
    inconsistencyPenaltyRate: 0.15,
  },
  normalization: {
    method: 'sigmoid',
    center: 50,
    steepness: 0.1,
  },
  enableCaching: true,
  cacheTtlMs: 300_000,
};

export function getConsensusConfig(overrides?: Partial<ConsensusConfig>): ConsensusConfig {
  if (!overrides) return { ...DEFAULT_CONSENSUS_CONFIG };
  return {
    ...DEFAULT_CONSENSUS_CONFIG,
    ...overrides,
    timeframeWeights: { ...DEFAULT_CONSENSUS_CONFIG.timeframeWeights, ...overrides.timeframeWeights },
    trendWeights: { ...DEFAULT_CONSENSUS_CONFIG.trendWeights, ...overrides.trendWeights },
    momentumWeights: { ...DEFAULT_CONSENSUS_CONFIG.momentumWeights, ...overrides.momentumWeights },
    volumeWeights: { ...DEFAULT_CONSENSUS_CONFIG.volumeWeights, ...overrides.volumeWeights },
    indicatorWeights: { ...DEFAULT_CONSENSUS_CONFIG.indicatorWeights, ...overrides.indicatorWeights },
    conflictThresholds: { ...DEFAULT_CONSENSUS_CONFIG.conflictThresholds, ...overrides.conflictThresholds },
    consensusThresholds: { ...DEFAULT_CONSENSUS_CONFIG.consensusThresholds, ...overrides.consensusThresholds },
    earlyAlignment: { ...DEFAULT_CONSENSUS_CONFIG.earlyAlignment, ...overrides.earlyAlignment },
    riskAdjustment: { ...DEFAULT_CONSENSUS_CONFIG.riskAdjustment, ...overrides.riskAdjustment },
    normalization: { ...DEFAULT_CONSENSUS_CONFIG.normalization, ...overrides.normalization },
  };
}

export interface ConsensusEngineInput {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  timeframes: TimeframeData[];
  config?: Partial<ConsensusConfig>;
}

export interface ConsensusEngineOutput {
  stockSymbol: string;
  stockName: string;
  generatedAt: string;
  currentPrice: number;
  timeframeScores: TimeframeConsensusScore[];
  consensusSummary: ConsensusSummary;
  dominantTrend: TrendInfo;
  secondaryTrend: TrendInfo;
  shortTermDirection: TrendDirection;
  mediumTermDirection: TrendDirection;
  longTermDirection: TrendDirection;
  conflicts: ConflictDetail[];
  earlyAlignments: EarlyAlignment[];
  evidenceMatrix: ConsensusEvidence[];
  suggestedAction: SignalType;
  suggestedConfidence: number;
  suggestedObservation: string;
  suggestedObservationTr: string;
  disclaimer: string;
  metadata: Record<string, unknown>;
}
