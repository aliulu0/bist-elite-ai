export enum OpportunityStage {
  DETECTED = 'DETECTED',
  EMERGING = 'EMERGING',
  CONFIRMED = 'CONFIRMED',
  STRENGTHENING = 'STRENGTHENING',
  MATURE = 'MATURE',
  WEAKENING = 'WEAKENING',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum StageTransitionReason {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  SCORE_THRESHOLD = 'SCORE_THRESHOLD',
  CONFIDENCE_DROP = 'CONFIDENCE_DROP',
  REGIME_CHANGE = 'REGIME_CHANGE',
  TIME_DECAY = 'TIME_DECAY',
  RISK_BREACH = 'RISK_BREACH',
  CONSENSUS_BREAK = 'CONSENSUS_BREAK',
  HEALTH_DECLINE = 'HEALTH_DECLINE',
  TARGET_REACHED = 'TARGET_REACHED',
}

export enum HealthLevel {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL',
}

export enum EvolutionTrend {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DEGRADING = 'DEGRADING',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export enum FailureCategory {
  FALSE_OPPORTUNITY = 'FALSE_OPPORTUNITY',
  WEAK_OPPORTUNITY = 'WEAK_OPPORTUNITY',
  LATE_OPPORTUNITY = 'LATE_OPPORTUNITY',
  CANCELLED_OPPORTUNITY = 'CANCELLED_OPPORTUNITY',
  HIGH_RISK_OPPORTUNITY = 'HIGH_RISK_OPPORTUNITY',
}

export enum EarlyDetectionResult {
  EARLY = 'EARLY',
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  MISSED = 'MISSED',
}

export enum SignalDirection {
  STRENGTHENING = 'STRENGTHENING',
  WEAKENING = 'WEAKENING',
  NEUTRAL = 'NEUTRAL',
}

export interface StageTransition {
  from: OpportunityStage;
  to: OpportunityStage;
  reason: StageTransitionReason;
  confidence: number;
  triggeredBy?: string;
  description: string;
  timestamp: string;
}

export interface OpportunitySnapshot {
  timestamp: string;
  eliteScore: number;
  confidence: number;
  consensusScore: number;
  riskScore: number;
  momentumScore: number;
  volumeScore: number;
  volatilityScore: number;
  healthIndex: number;
  stage: OpportunityStage;
  currentPrice: number;
}

export interface ScoreEvolution {
  metric: string;
  snapshots: Array<{ timestamp: string; value: number }>;
  trend: EvolutionTrend;
  currentValue: number;
  startValue: number;
  change: number;
  changePercent: number;
  volatility: number;
}

export interface HealthIndex {
  overall: number;
  stability: number;
  momentum: number;
  riskLevel: number;
  quality: number;
  level: HealthLevel;
  factors: HealthFactor[];
  calculatedAt: string;
}

export interface HealthFactor {
  factor: string;
  value: number;
  weight: number;
  contribution: number;
  impact: SignalDirection;
  description: string;
}

export interface EarlyDetectionMetrics {
  firstDetectionTime: string;
  confirmationDelay: number;
  leadTime: number;
  signalPersistence: number;
  earlyDetectionSuccess: boolean;
  result: EarlyDetectionResult;
  timeToConfirm: number;
  timeToMature: number;
  signalFreshness: number;
  description: string;
}

export interface OpportunityFailure {
  category: FailureCategory;
  severity: number;
  reason: string;
  indicators: string[];
  detectedAt: string;
  impact: number;
}

export interface MarketContext {
  regime: string;
  regimeConfidence: number;
  sector: string;
  industry: string;
  timeframe: string;
  sectorMomentum: number;
  marketPhase: string;
}

export interface OpportunityRecord {
  id: string;
  stockSymbol: string;
  stockName: string;
  stage: OpportunityStage;
  stageHistory: StageTransition[];
  snapshots: OpportunitySnapshot[];
  healthIndex: HealthIndex;
  earlyDetection: EarlyDetectionMetrics;
  failures: OpportunityFailure[];
  marketContext: MarketContext;
  currentPrice: number;
  entryPrice: number;
  targetPrice?: number;
  stopLossPrice?: number;
  detectedAt: string;
  confirmedAt?: string;
  matureAt?: string;
  completedAt?: string;
  actualReturn?: number;
  signalDirection: SignalDirection;
  overallScore: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface TrackOpportunityInput {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  eliteScore: number;
  confidence: number;
  consensusScore: number;
  riskScore: number;
  momentumScore?: number;
  volumeScore?: number;
  volatilityScore?: number;
  strategyUsed: string;
  marketRegime: string;
  regimeConfidence?: number;
  sector?: string;
  industry?: string;
  timeframe?: string;
  sectorMomentum?: number;
  marketPhase?: string;
  targetPrice?: number;
  stopLossPrice?: number;
  timeSinceDetection?: number;
  confirmationLevel?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateOpportunityInput {
  eliteScore?: number;
  confidence?: number;
  consensusScore?: number;
  riskScore?: number;
  momentumScore?: number;
  volumeScore?: number;
  volatilityScore?: number;
  currentPrice?: number;
  targetPrice?: number;
  stopLossPrice?: number;
  reason?: StageTransitionReason;
  metadata?: Record<string, unknown>;
}

export interface OpportunityTimeline {
  id: string;
  stockSymbol: string;
  stages: Array<{
    stage: OpportunityStage;
    enteredAt: string;
    exitedAt?: string;
    duration: number;
    reason?: string;
  }>;
  totalDuration: number;
  detectedAt: string;
  completedAt?: string;
  outcome?: string;
}

export interface LifecycleSummary {
  totalOpportunities: number;
  activeOpportunities: number;
  completedOpportunities: number;
  cancelledOpportunities: number;
  stageDistribution: Record<OpportunityStage, number>;
  avgHealthIndex: number;
  avgLifetime: number;
  successRate: number;
  avgLeadTime: number;
  generatedAt: string;
}

export interface LifecycleConfig {
  enabled: boolean;
  stageTransitions: {
    detectedToEmerging: { minConfidence: number; minScore: number };
    emergingToConfirmed: { minConfirmationLevel: number; minConsensus: number };
    confirmedToStrengthening: { minScoreImprovement: number; minHealthIndex: number };
    strengtheningToMature: { minHoldingDays: number; minStability: number };
    matureToWeakening: { maxHealthIndex: number; maxMomentum: number };
    weakeningToExpired: { maxHealthIndex: number; maxDaysInWeakening: number };
  };
  healthWeights: {
    scoreWeight: number;
    confidenceWeight: number;
    momentumWeight: number;
    riskWeight: number;
    stabilityWeight: number;
  };
  failureThresholds: {
    minScore: number;
    maxRisk: number;
    minConfidence: number;
    maxDeclinePercent: number;
    maxHoldingDaysWithoutGain: number;
  };
  earlyDetection: {
    earlyThresholdHours: number;
    onTimeThresholdHours: number;
    lateThresholdHours: number;
    maxConfirmationDelayHours: number;
  };
  tracking: {
    maxSnapshots: number;
    snapshotIntervalMinutes: number;
    enableCaching: boolean;
    cacheTtlMs: number;
  };
}

export const LIFECYCLE_CONFIG_DEFAULTS: LifecycleConfig = {
  enabled: true,
  stageTransitions: {
    detectedToEmerging: { minConfidence: 0.4, minScore: 30 },
    emergingToConfirmed: { minConfirmationLevel: 0.6, minConsensus: 0.55 },
    confirmedToStrengthening: { minScoreImprovement: 5, minHealthIndex: 60 },
    strengtheningToMature: { minHoldingDays: 3, minStability: 0.7 },
    matureToWeakening: { maxHealthIndex: 45, maxMomentum: 0.3 },
    weakeningToExpired: { maxHealthIndex: 25, maxDaysInWeakening: 7 },
  },
  healthWeights: {
    scoreWeight: 0.30,
    confidenceWeight: 0.25,
    momentumWeight: 0.20,
    riskWeight: 0.15,
    stabilityWeight: 0.10,
  },
  failureThresholds: {
    minScore: 20,
    maxRisk: 0.8,
    minConfidence: 0.3,
    maxDeclinePercent: 30,
    maxHoldingDaysWithoutGain: 14,
  },
  earlyDetection: {
    earlyThresholdHours: 6,
    onTimeThresholdHours: 24,
    lateThresholdHours: 72,
    maxConfirmationDelayHours: 48,
  },
  tracking: {
    maxSnapshots: 500,
    snapshotIntervalMinutes: 60,
    enableCaching: true,
    cacheTtlMs: 300000,
  },
};

export const LIFECYCLE_STAGES: OpportunityStage[] = [
  OpportunityStage.DETECTED,
  OpportunityStage.EMERGING,
  OpportunityStage.CONFIRMED,
  OpportunityStage.STRENGTHENING,
  OpportunityStage.MATURE,
  OpportunityStage.WEAKENING,
  OpportunityStage.EXPIRED,
  OpportunityStage.CANCELLED,
];

export const STAGE_ORDER: number[] = LIFECYCLE_STAGES.map((_, i) => i);
