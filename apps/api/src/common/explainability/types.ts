export enum Timeframe {
  M4 = 'M4',
  D1 = 'D1',
  W1 = 'W1',
  M1 = 'M1',
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  [Timeframe.M4]: '4 Saatlik',
  [Timeframe.D1]: 'Günlük',
  [Timeframe.W1]: 'Haftalık',
  [Timeframe.M1]: 'Aylık',
};

export const TIMEFRAME_ORDER: Timeframe[] = [Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1];

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

export enum RiskType {
  TREND_RISK = 'trend_risk',
  VOLATILITY_RISK = 'volatility_risk',
  LIQUIDITY_RISK = 'liquidity_risk',
  FALSE_BREAKOUT_RISK = 'false_breakout_risk',
  FALSE_SIGNAL_RISK = 'false_signal_risk',
  TIMEFRAME_CONFLICT = 'timeframe_conflict',
  MARKET_UNCERTAINTY = 'market_uncertainty',
}

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
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

export interface IndicatorEvidence {
  indicator: string;
  timeframe: Timeframe;
  value: number;
  signal: string;
  interpretation: string;
  weight: number;
  isPositive: boolean;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  strength: number;
  description: string;
  supportingIndicators: IndicatorEvidence[];
}

export interface MomentumAnalysis {
  state: MomentumState;
  rsiValue?: number;
  macdValue?: number;
  description: string;
  supportingIndicators: IndicatorEvidence[];
}

export interface VolumeAnalysis {
  state: VolumeState;
  description: string;
  supportingIndicators: IndicatorEvidence[];
}

export interface SupportResistance {
  supportLevels: number[];
  resistanceLevels: number[];
  currentPrice: number;
  distanceToSupport: number;
  distanceToResistance: number;
  description: string;
}

export interface RiskFactor {
  type: RiskType;
  severity: RiskSeverity;
  score: number;
  description: string;
  mitigation?: string;
  indicators: string[];
}

export interface TimeframeAgreement {
  timeframe: Timeframe;
  direction: TrendDirection;
  momentum: MomentumState;
  agreementScore: number;
  description: string;
}

export interface MultiTimeframeSummary {
  agreements: TimeframeAgreement[];
  dominantTrend: TrendDirection;
  overallAgreement: number;
  hasConflict: boolean;
  conflictDescription?: string;
  shortTermView: string;
  mediumTermView: string;
  longTermView: string;
}

export interface ConfidenceExplanation {
  score: number;
  indicatorAgreement: number;
  strategyAgreement: number;
  historicalSimilarity: number;
  signalQuality: number;
  marketConditions: number;
  description: string;
  factors: string[];
}

export interface PositiveNegativeFactors {
  positive: Array<{ factor: string; weight: number; evidence: string }>;
  negative: Array<{ factor: string; weight: number; evidence: string }>;
}

export interface EliteScoreExplanation {
  technicalScore: number;
  financialScore: number;
  confidenceScore: number;
  compositeScore: number;
  rank?: number;
  description: string;
  positiveFactors: PositiveNegativeFactors;
  negativeFactors: PositiveNegativeFactors;
}

export interface ExplanationInput {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  technicalScore?: {
    momentum?: number;
    trend?: number;
    volatility?: number;
    volume?: number;
    support?: number;
    resistance?: number;
    composite: number;
  };
  financialScore?: {
    growth?: number;
    profitability?: number;
    valuation?: number;
    quality?: number;
    health?: number;
    composite: number;
  };
  eliteScore?: {
    technical: number;
    financial: number;
    confidence: number;
    composite: number;
    rank?: number;
  };
  confidenceScore?: {
    dataQuality: number;
    modelConsistency: number;
    regimeStability: number;
    composite: number;
  };
  indicators?: IndicatorEvidence[];
  decisionSignal?: {
    action: SignalAction;
    strength: SignalStrength;
    entryPrice?: number;
    targetPrice?: number;
    stopLossPrice?: number;
    riskRewardRatio?: number;
  };
  timeframeData?: Partial<Record<Timeframe, {
    trend?: TrendDirection;
    momentum?: MomentumState;
    indicators?: IndicatorEvidence[];
  }>>;
  riskFactors?: RiskFactor[];
  metadata?: Record<string, unknown>;
}

export interface ExplanationOutput {
  stockSymbol: string;
  stockName: string;
  generatedAt: string;
  generalSummary: string;
  technicalAnalysis: string;
  trendAnalysis: TrendAnalysis;
  momentumAnalysis: MomentumAnalysis;
  volumeAnalysis: VolumeAnalysis;
  supportResistance: SupportResistance;
  riskAnalysis: RiskFactor[];
  positiveFactors: PositiveNegativeFactors;
  negativeFactors: PositiveNegativeFactors;
  eliteScoreExplanation: EliteScoreExplanation;
  confidenceExplanation: ConfidenceExplanation;
  multiTimeframeSummary: MultiTimeframeSummary;
  suggestedObservation: string;
  finalEvaluation: string;
  disclaimer: string;
  evidenceTrail: IndicatorEvidence[];
}

export interface ExplainabilityConfig {
  enabled: boolean;
  defaultTimeframes: Timeframe[];
  indicatorWeights: Record<string, number>;
  riskWeights: Record<RiskType, number>;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  maxEvidenceItems: number;
  enableCaching: boolean;
  cacheTtlMs: number;
}

export const DEFAULT_EXPLAINABILITY_CONFIG: ExplainabilityConfig = {
  enabled: true,
  defaultTimeframes: [Timeframe.M4, Timeframe.D1, Timeframe.W1, Timeframe.M1],
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
  riskWeights: {
    [RiskType.TREND_RISK]: 0.20,
    [RiskType.VOLATILITY_RISK]: 0.18,
    [RiskType.LIQUIDITY_RISK]: 0.15,
    [RiskType.FALSE_BREAKOUT_RISK]: 0.15,
    [RiskType.FALSE_SIGNAL_RISK]: 0.12,
    [RiskType.TIMEFRAME_CONFLICT]: 0.10,
    [RiskType.MARKET_UNCERTAINTY]: 0.10,
  },
  confidenceThresholds: {
    high: 0.75,
    medium: 0.50,
    low: 0.25,
  },
  maxEvidenceItems: 20,
  enableCaching: true,
  cacheTtlMs: 300_000,
};

export function getExplainabilityConfig(overrides?: Partial<ExplainabilityConfig>): ExplainabilityConfig {
  if (!overrides) return { ...DEFAULT_EXPLAINABILITY_CONFIG };
  return {
    ...DEFAULT_EXPLAINABILITY_CONFIG,
    ...overrides,
    indicatorWeights: { ...DEFAULT_EXPLAINABILITY_CONFIG.indicatorWeights, ...overrides.indicatorWeights },
    riskWeights: { ...DEFAULT_EXPLAINABILITY_CONFIG.riskWeights, ...overrides.riskWeights },
    confidenceThresholds: { ...DEFAULT_EXPLAINABILITY_CONFIG.confidenceThresholds, ...overrides.confidenceThresholds },
  };
}
