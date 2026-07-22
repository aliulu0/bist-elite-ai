export enum RecommendationStatus {
  CREATED = 'CREATED',
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  VIRTUAL_ENTRY = 'VIRTUAL_ENTRY',
  HOLDING = 'HOLDING',
  TARGET_REACHED = 'TARGET_REACHED',
  STOP_CONDITION = 'STOP_CONDITION',
  VIRTUAL_EXIT = 'VIRTUAL_EXIT',
  FINAL_OUTCOME = 'FINAL_OUTCOME',
  CANCELLED = 'CANCELLED',
}

export enum RecommendationOutcome {
  WINNER = 'WINNER',
  LOSER = 'LOSER',
  BREAKEVEN = 'BREAKEVEN',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

export enum EvaluationWindow {
  ONE_DAY = '1D',
  THREE_DAYS = '3D',
  ONE_WEEK = '1W',
  TWO_WEEKS = '2W',
  ONE_MONTH = '1M',
  THREE_MONTHS = '3M',
  SIX_MONTHS = '6M',
}

export enum FailureType {
  LATE_SIGNAL = 'LATE_SIGNAL',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  FALSE_NEGATIVE = 'FALSE_NEGATIVE',
  WEAK_CONFIRMATION = 'WEAK_CONFIRMATION',
  HIGH_RISK_SIGNAL = 'HIGH_RISK_SIGNAL',
  POOR_TIMING = 'POOR_TIMING',
}

export enum FailureSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ConfidenceLevel {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW',
}

export enum MarketRegime {
  BULL = 'BULL',
  BEAR = 'BEAR',
  SIDEWAYS = 'SIDEWAYS',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RecommendationRecord {
  id: string;
  stockSymbol: string;
  stockName: string;
  status: RecommendationStatus;
  outcome: RecommendationOutcome;
  entryPrice: number;
  entryDate: string;
  entryEliteScore: number;
  entryConfidence: number;
  entryConsensusScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  timeframeConsensus: string;
  sector?: string;
  exitPrice?: number;
  exitDate?: string;
  exitReason?: string;
  targetPrice?: number;
  stopLossPrice?: number;
  actualReturn?: number;
  maxGain?: number;
  maxDrawdown?: number;
  holdingPeriodDays?: number;
  notificationId?: string;
  portfolioPositionId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface TrackRecommendationInput {
  stockSymbol: string;
  stockName: string;
  entryPrice: number;
  entryEliteScore: number;
  entryConfidence: number;
  entryConsensusScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  timeframeConsensus: string;
  sector?: string;
  targetPrice?: number;
  stopLossPrice?: number;
  notificationId?: string;
  metadata?: Record<string, unknown>;
}

export interface WindowPerformance {
  window: EvaluationWindow;
  returnPercent: number;
  maxGainPercent: number;
  maxDrawdownPercent: number;
  volatility: number;
  riskAdjustedReturn: number;
  holdingPeriodDays: number;
  evaluatedAt: string;
}

export interface RecommendationPerformance {
  recommendationId: string;
  stockSymbol: string;
  windows: WindowPerformance[];
  overallReturn: number;
  overallMaxGain: number;
  overallMaxDrawdown: number;
  overallVolatility: number;
  overallRiskAdjustedReturn: number;
  evaluatedAt: string;
}

export interface EliteScoreAnalysis {
  recommendationId: string;
  stockSymbol: string;
  scoreAccuracy: number;
  confidenceAccuracy: number;
  scoreStability: number;
  scoreDrift: number;
  predictionQuality: number;
  brierScore: number;
  calibrationError: number;
  scoreDistribution: {
    mean: number;
    median: number;
    stdDev: number;
  };
  analyzedAt: string;
}

export interface AIAnalysisReview {
  recommendationId: string;
  stockSymbol: string;
  explanationConsistency: number;
  evidenceQuality: number;
  recommendationQuality: number;
  confidenceCalibration: number;
  overallScore: number;
  factors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;
  reviewedAt: string;
}

export interface StrategyPerformanceAnalysis {
  strategy: string;
  totalRecommendations: number;
  winRate: number;
  avgReturn: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestPerformance: { symbol: string; return_: number };
  worstPerformance: { symbol: string; return_: number };
  analyzedAt: string;
}

export interface IndicatorPerformanceAnalysis {
  indicator: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  contribution: number;
  analyzedAt: string;
}

export interface SectorPerformanceAnalysis {
  sector: string;
  totalRecommendations: number;
  winRate: number;
  avgReturn: number;
  profitFactor: number;
  avgEliteScore: number;
  analyzedAt: string;
}

export interface TimeframePerformanceAnalysis {
  timeframe: string;
  totalRecommendations: number;
  winRate: number;
  avgReturn: number;
  profitFactor: number;
  analyzedAt: string;
}

export interface MarketConditionPerformanceAnalysis {
  regime: MarketRegime;
  totalRecommendations: number;
  winRate: number;
  avgReturn: number;
  profitFactor: number;
  analyzedAt: string;
}

export interface FailureDetail {
  type: FailureType;
  severity: FailureSeverity;
  description: string;
  descriptionTr: string;
  impact: number;
  indicators: string[];
}

export interface FailureAnalysis {
  recommendationId: string;
  stockSymbol: string;
  failures: FailureDetail[];
  overallRiskScore: number;
  analyzedAt: string;
}

export interface SuccessAnalytics {
  totalRecommendations: number;
  winRate: number;
  lossRate: number;
  avgGain: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  precision: number;
  recall: number;
  f1Score: number;
  evaluatedAt: string;
}

export interface RecommendationHistoryQuery {
  stockSymbol?: string;
  strategy?: string;
  sector?: string;
  status?: RecommendationStatus;
  outcome?: RecommendationOutcome;
  startDate?: string;
  endDate?: string;
  minEliteScore?: number;
  maxEliteScore?: number;
  limit?: number;
  offset?: number;
}

export interface RecommendationHistoryResult {
  recommendations: RecommendationRecord[];
  total: number;
  hasMore: boolean;
}

export interface PerformanceDashboard {
  summary: SuccessAnalytics;
  windowPerformance: Partial<Record<EvaluationWindow, WindowPerformance>>;
  topPerformers: Array<{ symbol: string; return_: number; eliteScore: number }>;
  worstPerformers: Array<{ symbol: string; return_: number; eliteScore: number }>;
  strategyBreakdown: StrategyPerformanceAnalysis[];
  sectorBreakdown: SectorPerformanceAnalysis[];
  recentRecommendations: RecommendationRecord[];
  generatedAt: string;
  disclaimer: string;
}

export interface RecommendationTrackerConfig {
  enabled: boolean;
  evaluationWindows: EvaluationWindow[];
  successThresholds: {
    minWinRate: number;
    minProfitFactor: number;
    minSharpeRatio: number;
    maxDrawdown: number;
  };
  alertThresholds: {
    lowWinRate: number;
    highDrawdown: number;
    poorSharpe: number;
    lowConfidence: number;
  };
  metricWeights: {
    returnWeight: number;
    riskWeight: number;
    qualityWeight: number;
    consistencyWeight: number;
  };
  tracking: {
    maxHistorySize: number;
    enableCaching: boolean;
    cacheTtlMs: number;
  };
}

export const RECOMMENDATION_TRACKER_DEFAULTS: RecommendationTrackerConfig = {
  enabled: true,
  evaluationWindows: [
    EvaluationWindow.ONE_DAY,
    EvaluationWindow.THREE_DAYS,
    EvaluationWindow.ONE_WEEK,
    EvaluationWindow.TWO_WEEKS,
    EvaluationWindow.ONE_MONTH,
    EvaluationWindow.THREE_MONTHS,
    EvaluationWindow.SIX_MONTHS,
  ],
  successThresholds: {
    minWinRate: 55,
    minProfitFactor: 1.3,
    minSharpeRatio: 1.0,
    maxDrawdown: 20,
  },
  alertThresholds: {
    lowWinRate: 40,
    highDrawdown: 25,
    poorSharpe: 0.5,
    lowConfidence: 0.3,
  },
  metricWeights: {
    returnWeight: 0.35,
    riskWeight: 0.25,
    qualityWeight: 0.25,
    consistencyWeight: 0.15,
  },
  tracking: {
    maxHistorySize: 10000,
    enableCaching: true,
    cacheTtlMs: 300000,
  },
};

export function getRecommendationTrackerConfig(
  overrides?: Partial<RecommendationTrackerConfig>,
): RecommendationTrackerConfig {
  if (!overrides) return { ...RECOMMENDATION_TRACKER_DEFAULTS };
  return {
    ...RECOMMENDATION_TRACKER_DEFAULTS,
    ...overrides,
    successThresholds: {
      ...RECOMMENDATION_TRACKER_DEFAULTS.successThresholds,
      ...overrides.successThresholds,
    },
    alertThresholds: {
      ...RECOMMENDATION_TRACKER_DEFAULTS.alertThresholds,
      ...overrides.alertThresholds,
    },
    metricWeights: {
      ...RECOMMENDATION_TRACKER_DEFAULTS.metricWeights,
      ...overrides.metricWeights,
    },
    tracking: {
      ...RECOMMENDATION_TRACKER_DEFAULTS.tracking,
      ...overrides.tracking,
    },
  };
}
