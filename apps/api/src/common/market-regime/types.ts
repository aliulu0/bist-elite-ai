export enum MarketRegimeType {
  STRONG_BULL = 'STRONG_BULL',
  BULL = 'BULL',
  WEAK_BULL = 'WEAK_BULL',
  SIDEWAYS = 'SIDEWAYS',
  WEAK_BEAR = 'WEAK_BEAR',
  BEAR = 'BEAR',
  STRONG_BEAR = 'STRONG_BEAR',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
  RECOVERY = 'RECOVERY',
  CORRECTION = 'CORRECTION',
  DISTRIBUTION = 'DISTRIBUTION',
  ACCUMULATION = 'ACCUMULATION',
}

export enum RegimeConfidence {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW',
}

export enum TransitionType {
  EMERGING_BULL = 'EMERGING_BULL',
  EMERGING_BEAR = 'EMERGING_BEAR',
  TREND_WEAKENING = 'TREND_WEAKENING',
  TREND_STRENGTHENING = 'TREND_STRENGTHENING',
  VOLATILITY_EXPANSION = 'VOLATILITY_EXPANSION',
  VOLATILITY_CONTRACTION = 'VOLATILITY_CONTRACTION',
  POSSIBLE_TRANSITION = 'POSSIBLE_TRANSITION',
}

export enum RegimeTimeframe {
  M4 = 'M4',
  D1 = 'D1',
  W1 = 'W1',
  M1 = 'M1',
}

export enum MarketPhase {
  ACCUMULATION = 'ACCUMULATION',
  MARKUP = 'MARKUP',
  DISTRIBUTION = 'DISTRIBUTION',
  MARKDOWN = 'MARKDOWN',
}

export interface RegimeIndicator {
  name: string;
  value: number;
  signal: string;
  weight: number;
}

export interface RegimeInput {
  timeframe: RegimeTimeframe;
  trendScore: number;
  momentumScore: number;
  volumeScore: number;
  volatilityScore: number;
  breadthScore?: number;
  priceChange: number;
  highLowRange?: number;
  indicators?: RegimeIndicator[];
}

export interface RegimeFactor {
  factor: string;
  value: number;
  weight: number;
  contribution: number;
  description: string;
}

export interface RegimeClassification {
  type: MarketRegimeType;
  confidence: number;
  agreementScore: number;
  conflictScore: number;
  stabilityScore: number;
  factors: RegimeFactor[];
  classifiedAt: string;
}

export interface MultiTimeframeRegime {
  regimes: Record<RegimeTimeframe, RegimeClassification>;
  overall: MarketRegimeType;
  overallConfidence: number;
  timeframeAgreement: number;
  hasConflict: boolean;
  detectedAt: string;
}

export interface RegimeTransition {
  from: MarketRegimeType;
  to: MarketRegimeType;
  probability: number;
  timeframe: RegimeTimeframe;
  indicators: string[];
  detectedAt: string;
}

export interface RegimeAdjustment {
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  reason: string;
}

export interface RegimeContext {
  currentRegime: MarketRegimeType;
  confidence: number;
  duration: number;
  transitionRisk: number;
  recommendedAdjustments: RegimeAdjustment[];
  riskFactors: string[];
}

export interface RegimeHistoricalData {
  regime: MarketRegimeType;
  occurrences: number;
  avgDuration: number;
  totalDuration: number;
  firstSeen: string;
  lastSeen: string;
}

export interface RegimePerformanceByType {
  regime: MarketRegimeType;
  strategyPerformance: Record<
    string,
    { winRate: number; avgReturn: number; sharpeRatio: number }
  >;
}

export interface MarketRegimeConfig {
  enabled: boolean;
  regimeThresholds: {
    strongBull: number;
    bull: number;
    weakBull: number;
    sidewaysUpper: number;
    sidewaysLower: number;
    weakBear: number;
    bear: number;
    strongBear: number;
    highVolatility: number;
    lowVolatility: number;
  };
  weights: {
    trend: number;
    momentum: number;
    volume: number;
    volatility: number;
    breadth: number;
  };
  transition: {
    minConfidence: number;
    cooldownPeriod: number;
    maxTransitionsPerDay: number;
  };
  historical: {
    lookbackDays: number;
    minSamples: number;
  };
  enableCaching: boolean;
  cacheTtlMs: number;
}

export const MARKET_REGIME_CONFIG_DEFAULTS: MarketRegimeConfig = {
  enabled: true,
  regimeThresholds: {
    strongBull: 0.75,
    bull: 0.5,
    weakBull: 0.25,
    sidewaysUpper: 0.25,
    sidewaysLower: -0.25,
    weakBear: -0.25,
    bear: -0.5,
    strongBear: -0.75,
    highVolatility: 0.7,
    lowVolatility: 0.3,
  },
  weights: {
    trend: 0.35,
    momentum: 0.25,
    volume: 0.15,
    volatility: 0.15,
    breadth: 0.10,
  },
  transition: {
    minConfidence: 0.6,
    cooldownPeriod: 5,
    maxTransitionsPerDay: 3,
  },
  historical: {
    lookbackDays: 180,
    minSamples: 10,
  },
  enableCaching: true,
  cacheTtlMs: 300000,
};

export function createRegimeClassification(
  type: MarketRegimeType,
  confidence: number,
  agreementScore: number,
  conflictScore: number,
  stabilityScore: number,
  factors: RegimeFactor[] = [],
): RegimeClassification {
  return {
    type,
    confidence,
    agreementScore,
    conflictScore,
    stabilityScore,
    factors,
    classifiedAt: new Date().toISOString(),
  };
}

export function getConfidenceLevel(confidence: number): RegimeConfidence {
  if (confidence >= 0.9) return RegimeConfidence.VERY_HIGH;
  if (confidence >= 0.75) return RegimeConfidence.HIGH;
  if (confidence >= 0.5) return RegimeConfidence.MEDIUM;
  if (confidence >= 0.3) return RegimeConfidence.LOW;
  return RegimeConfidence.VERY_LOW;
}

export const MARKET_REGIME_LIST: MarketRegimeType[] = Object.values(MarketRegimeType);
