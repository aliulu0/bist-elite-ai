export enum CalibrationStatus {
  HEALTHY = 'HEALTHY',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  DEGRADING = 'DEGRADING',
  CRITICAL = 'CRITICAL',
}

export enum TrendDirection {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DEGRADING = 'DEGRADING',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComponentHealth {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL',
}

export enum DiagnosticIssueType {
  OVERWEIGHTED = 'OVERWEIGHTED',
  UNDERWEIGHTED = 'UNDERWEIGHTED',
  UNSTABLE = 'UNSTABLE',
  CONFLICTING = 'CONFLICTING',
  LOW_VALUE = 'LOW_VALUE',
  HIGHLY_PREDICTIVE = 'HIGHLY_PREDICTIVE',
}

export interface ScoringSnapshot {
  timestamp: string;
  stockSymbol: string;
  overallScore: number;
  componentScores: Record<string, number>;
  componentWeights: Record<string, number>;
  confidence: number;
  actualOutcome: number;
  profile: string;
  timeframe: string;
}

export interface CalibrationInput {
  snapshots: ScoringSnapshot[];
  validationResults?: Array<{
    strategyId: string;
    overallScore: number;
    performanceMetrics: {
      winRate: number;
      profitFactor: number;
      sharpeRatio: number;
      maxDrawdown: number;
    };
    signalQuality: {
      precision: number;
      recall: number;
      f1Score: number;
    };
    eliteScoreValidation?: {
      accuracy: number;
      confidenceCalibration: number;
      calibrationError: number;
      brierScore: number;
      componentContribution: Record<string, number>;
    };
  }>;
  config?: Partial<CalibrationConfig>;
}

export interface ComponentDiagnostic {
  component: string;
  currentWeight: number;
  health: ComponentHealth;
  issues: DiagnosticIssueType[];
  effectiveness: number;
  stability: number;
  contribution: number;
  trend: TrendDirection;
  recommendedWeight: number;
  confidence: number;
  evidence: string[];
}

export interface PerformanceEvaluation {
  predictionAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  historicalReliability: number;
  scoreDistribution: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  calibrationError: number;
  brierScore: number;
  overallHealth: CalibrationStatus;
}

export interface TrendAnalysisPoint {
  timestamp: string;
  value: number;
  sampleSize: number;
}

export interface ComponentTrend {
  component: string;
  direction: TrendDirection;
  strength: number;
  dataPoints: TrendAnalysisPoint[];
  slope: number;
  rSquared: number;
  forecast: number;
  confidence: number;
}

export interface CalibrationRecommendation {
  id: string;
  component: string;
  priority: RecommendationPriority;
  currentWeight: number;
  recommendedWeight: number;
  changePercent: number;
  reason: string;
  evidence: string[];
  expectedImpact: {
    accuracyChange: number;
    confidenceChange: number;
    riskChange: number;
  };
  safeguards: string[];
  requiresApproval: boolean;
  autoApplicable: boolean;
}

export interface CalibrationSummary {
  overallStatus: CalibrationStatus;
  overallScore: number;
  confidence: number;
  componentDiagnostics: ComponentDiagnostic[];
  performanceEvaluation: PerformanceEvaluation;
  componentTrends: ComponentTrend[];
  recommendations: CalibrationRecommendation[];
  historicalComparison: {
    currentPeriod: {
      avgScore: number;
      accuracy: number;
      sampleSize: number;
    };
    previousPeriod: {
      avgScore: number;
      accuracy: number;
      sampleSize: number;
    };
    change: number;
  };
  generatedAt: string;
  calibrationDuration: number;
  disclaimer: string;
}

export interface CalibrationReport {
  summary: CalibrationSummary;
  detailedAnalysis: {
    componentRankings: Array<{
      component: string;
      rank: number;
      effectiveness: number;
      weight: ComponentHealth;
    }>;
    improvementOpportunities: Array<{
      component: string;
      currentScore: number;
      potentialImprovement: number;
      difficulty: string;
      timeline: string;
    }>;
    historicalTrend: ComponentTrend[];
    riskAssessment: {
      overallRisk: number;
      riskFactors: Array<{
        type: string;
        severity: string;
        description: string;
      }>;
    };
  };
  generatedAt: string;
  disclaimer: string;
}

export interface CalibrationConfig {
  evaluationWindow: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  thresholds: {
    minSampleSize: number;
    effectivenessThreshold: number;
    stabilityThreshold: number;
    trendSensitivity: number;
    recommendationConfidence: number;
  };
  recommendationSettings: {
    maxWeightChange: number;
    minWeightChange: number;
    requireApprovalAbove: number;
    autoApplyBelow: number;
    cooldownPeriod: number;
  };
  metricWeights: {
    accuracyWeight: number;
    calibrationWeight: number;
    stabilityWeight: number;
    contributionWeight: number;
  };
}

export const CALIBRATION_CONFIG_DEFAULTS: CalibrationConfig = {
  evaluationWindow: {
    shortTerm: 30,
    mediumTerm: 90,
    longTerm: 365,
  },
  thresholds: {
    minSampleSize: 30,
    effectivenessThreshold: 0.6,
    stabilityThreshold: 0.7,
    trendSensitivity: 0.1,
    recommendationConfidence: 0.7,
  },
  recommendationSettings: {
    maxWeightChange: 0.05,
    minWeightChange: 0.01,
    requireApprovalAbove: 0.03,
    autoApplyBelow: 0.01,
    cooldownPeriod: 30,
  },
  metricWeights: {
    accuracyWeight: 0.35,
    calibrationWeight: 0.25,
    stabilityWeight: 0.20,
    contributionWeight: 0.20,
  },
};

export function getCalibrationConfig(overrides?: Partial<CalibrationConfig>): CalibrationConfig {
  if (!overrides) return { ...CALIBRATION_CONFIG_DEFAULTS };
  return {
    ...CALIBRATION_CONFIG_DEFAULTS,
    ...overrides,
    evaluationWindow: { ...CALIBRATION_CONFIG_DEFAULTS.evaluationWindow, ...overrides.evaluationWindow },
    thresholds: { ...CALIBRATION_CONFIG_DEFAULTS.thresholds, ...overrides.thresholds },
    recommendationSettings: { ...CALIBRATION_CONFIG_DEFAULTS.recommendationSettings, ...overrides.recommendationSettings },
    metricWeights: { ...CALIBRATION_CONFIG_DEFAULTS.metricWeights, ...overrides.metricWeights },
  };
}
