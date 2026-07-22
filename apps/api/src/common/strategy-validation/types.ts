export enum ValidationType {
  SINGLE_STRATEGY = 'SINGLE_STRATEGY',
  MULTI_STRATEGY_COMPARISON = 'MULTI_STRATEGY_COMPARISON',
  INDICATOR_COMBINATION = 'INDICATOR_COMBINATION',
  PORTFOLIO_VALIDATION = 'PORTFOLIO_VALIDATION',
  MULTI_TIMEFRAME = 'MULTI_TIMEFRAME',
  HISTORICAL_SCENARIO = 'HISTORICAL_SCENARIO',
}

export enum Timeframe {
  H4 = 'H4',
  D1 = 'D1',
  W1 = 'W1',
  MN1 = 'MN1',
}

export enum MarketCondition {
  BULL_MARKET = 'BULL_MARKET',
  BEAR_MARKET = 'BEAR_MARKET',
  SIDEWAYS_MARKET = 'SIDEWAYS_MARKET',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
  HIGH_VOLUME = 'HIGH_VOLUME',
  LOW_VOLUME = 'LOW_VOLUME',
}

export enum SignalAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  WATCH = 'WATCH',
}

export enum TrendDirection {
  STRONG_UPTREND = 'STRONG_UPTREND',
  UPTREND = 'UPTREND',
  WEAK_UPTREND = 'WEAK_UPTREND',
  NEUTRAL = 'NEUTRAL',
  WEAK_DOWNTREND = 'WEAK_DOWNTREND',
  DOWNTREND = 'DOWNTREND',
  STRONG_DOWNTREND = 'STRONG_DOWNTREND',
}

export enum ValidationStatus {
  PASSED = 'PASSED',
  WARNING = 'WARNING',
  FAILED = 'FAILED',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export enum ConsensusStrength {
  STRONG = 'STRONG',
  MODERATE = 'MODERATE',
  WEAK = 'WEAK',
  CONFLICTING = 'CONFLICTING',
}

export interface TradeRecord {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  action: SignalAction;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingPeriodDays: number;
  timeframe: Timeframe;
  indicators: Record<string, number>;
  marketCondition: MarketCondition;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  avgDrawdown: number;
  recoveryFactor: number;
  avgHoldingPeriod: number;
  signalFrequency: number;
  volatility: number;
  beta: number;
  alpha: number;
  treynorRatio: number;
  calmarRatio: number;
  expectancy: number;
  kellyCriterion: number;
}

export interface SignalQualityMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  signalStability: number;
  signalConsistency: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalSignals: number;
  correctSignals: number;
}

export interface MarketConditionPerformance {
  condition: MarketCondition;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  confidence: number;
}

export interface TimeframeValidationResult {
  timeframe: Timeframe;
  agreementAccuracy: number;
  conflictAccuracy: number;
  consensusAccuracy: number;
  earlySignalAccuracy: number;
  signalCount: number;
  avgConfidence: number;
  dominantDirection: TrendDirection;
  status: ValidationStatus;
}

export interface EliteScoreValidationResult {
  accuracy: number;
  confidenceCalibration: number;
  historicalReliability: number;
  componentContribution: Record<string, number>;
  scoreDistribution: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  calibrationError: number;
  brierScore: number;
  status: ValidationStatus;
}

export interface StrategyValidationInput {
  strategyId: string;
  strategyName: string;
  validationType: ValidationType;
  timeframes: Timeframe[];
  trades: TradeRecord[];
  signals: Array<{
    date: string;
    action: SignalAction;
    confidence: number;
    price: number;
    indicators: Record<string, number>;
    timeframe: Timeframe;
  }>;
  marketData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timeframe: Timeframe;
  }>;
  historicalPrices?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  benchmark?: Array<{
    date: number;
    value: number;
  }>;
  config?: Partial<ValidationConfig>;
}

export interface ValidationConfig {
  validationWindows: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  performanceThresholds: {
    minWinRate: number;
    minProfitFactor: number;
    minSharpeRatio: number;
    maxDrawdown: number;
    minF1Score: number;
    minPrecision: number;
    minRecall: number;
  };
  metricWeights: {
    returnWeight: number;
    riskWeight: number;
    qualityWeight: number;
    consistencyWeight: number;
  };
  acceptanceCriteria: {
    minOverallScore: number;
    minConfidence: number;
    maxConflictLevel: number;
  };
  riskFreeRate: number;
  tradingDaysPerYear: number;
}

export interface ValidationSummary {
  strategyId: string;
  strategyName: string;
  validationType: ValidationType;
  overallScore: number;
  status: ValidationStatus;
  confidence: number;
  performanceMetrics: PerformanceMetrics;
  signalQuality: SignalQualityMetrics;
  marketConditionPerformance: MarketConditionPerformance[];
  timeframeValidation: TimeframeValidationResult[];
  eliteScoreValidation: EliteScoreValidationResult | null;
  strengths: string[];
  weaknesses: string[];
  riskAssessment: {
    overallRisk: number;
    riskFactors: Array<{
      type: string;
      severity: string;
      score: number;
      description: string;
    }>;
  };
  improvementSuggestions: string[];
  validatedAt: string;
  validationDuration: number;
  disclaimer: string;
}

export interface ComparisonResult {
  strategies: Array<{
    strategyId: string;
    strategyName: string;
    overallScore: number;
    performanceMetrics: PerformanceMetrics;
    signalQuality: SignalQualityMetrics;
    rank: number;
  }>;
  winner: {
    strategyId: string;
    strategyName: string;
    overallScore: number;
  };
  comparisonMetrics: string[];
  generatedAt: string;
}

export interface ValidationReport {
  summary: ValidationSummary;
  comparison?: ComparisonResult;
  detailedAnalysis: {
    tradeAnalysis: Array<{
      tradeId: number;
      entryDate: string;
      exitDate: string;
      action: SignalAction;
      return: number;
      holdingPeriod: number;
      indicators: Record<string, number>;
      marketCondition: MarketCondition;
    }>;
    monthlyReturns: Array<{
      year: number;
      month: number;
      return_: number;
      trades: number;
      winRate: number;
    }>;
    drawdownAnalysis: Array<{
      date: string;
      drawdown: number;
      duration: number;
      recoveryTime: number;
    }>;
    indicatorPerformance: Record<string, {
      accuracy: number;
      precision: number;
      recall: number;
      contribution: number;
    }>;
  };
  generatedAt: string;
  disclaimer: string;
}

export const VALIDATION_CONFIG_DEFAULTS: ValidationConfig = {
  validationWindows: {
    shortTerm: 30,
    mediumTerm: 90,
    longTerm: 365,
  },
  performanceThresholds: {
    minWinRate: 50,
    minProfitFactor: 1.2,
    minSharpeRatio: 1.0,
    maxDrawdown: 25,
    minF1Score: 0.6,
    minPrecision: 0.55,
    minRecall: 0.55,
  },
  metricWeights: {
    returnWeight: 0.30,
    riskWeight: 0.25,
    qualityWeight: 0.25,
    consistencyWeight: 0.20,
  },
  acceptanceCriteria: {
    minOverallScore: 65,
    minConfidence: 0.7,
    maxConflictLevel: 0.4,
  },
  riskFreeRate: 0.15,
  tradingDaysPerYear: 252,
};

export function getValidationConfig(overrides?: Partial<ValidationConfig>): ValidationConfig {
  if (!overrides) return { ...VALIDATION_CONFIG_DEFAULTS };
  return {
    ...VALIDATION_CONFIG_DEFAULTS,
    ...overrides,
    validationWindows: { ...VALIDATION_CONFIG_DEFAULTS.validationWindows, ...overrides.validationWindows },
    performanceThresholds: { ...VALIDATION_CONFIG_DEFAULTS.performanceThresholds, ...overrides.performanceThresholds },
    metricWeights: { ...VALIDATION_CONFIG_DEFAULTS.metricWeights, ...overrides.metricWeights },
    acceptanceCriteria: { ...VALIDATION_CONFIG_DEFAULTS.acceptanceCriteria, ...overrides.acceptanceCriteria },
  };
}
