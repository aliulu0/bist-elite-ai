import { EarlyOpportunityDecision, EarlyOpportunityDecisionSnapshot, DecisionDimensionId } from '../ai-early-opportunity/decision/early-opportunity-decision.types';

export { EarlyOpportunityDecisionSnapshot } from '../ai-early-opportunity/decision/early-opportunity-decision.types';

export type BacktestHorizon = '1W' | '1M' | '3M' | '5M' | '6M' | '1Y';

export const BACKTEST_HORIZONS: readonly BacktestHorizon[] = ['1W', '1M', '3M', '5M', '6M', '1Y'];

export const HORIZON_DAYS: Record<BacktestHorizon, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '5M': 150,
  '6M': 180,
  '1Y': 365,
};

export interface HorizonOutcome {
  horizon: BacktestHorizon;
  horizonDays: number;
  entryPrice: number;
  exitPrice: number | null;
  absoluteReturn: number | null;
  percentageReturn: number | null;
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
  maxDrawdownAfterSignal: number;
  timeToPositiveReturn: number | null;
  timeToTarget: number | null;
  timeToStop: number | null;
  targetReached: boolean;
  stopReached: boolean;
  dataAvailable: boolean;
}

export interface FutureOutcome {
  ticker: string;
  decisionDate: string;
  outcomes: HorizonOutcome[];
  overallMaxDrawdown: number;
  overallMaxFavorableExcursion: number;
  overallMaxAdverseExcursion: number;
  dataAvailable: boolean;
}

export type SuccessDimension = 'RETURN' | 'RISK_ADJUSTED' | 'TARGET' | 'EARLY_OPPORTUNITY';

export interface DecisionSuccessEval {
  dimension: SuccessDimension;
  satisfied: boolean;
  details: string;
}

export interface DecisionSuccessResult {
  ticker: string;
  decisionDate: string;
  overallSuccess: boolean;
  evaluations: DecisionSuccessEval[];
  stopHitFirst: boolean;
  targetHitFirst: boolean;
}

export interface BenchmarkComparisonResult {
  ticker: string;
  decisionDate: string;
  horizon: BacktestHorizon;
  stockReturn: number | null;
  benchmarkReturn: number | null;
  excessReturn: number | null;
  relativeSuccess: boolean | null;
  benchmarkAvailable: boolean;
}

export interface ConfidenceCalibrationBucket {
  bucket: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceRange: [number, number];
  sampleCount: number;
  averageReturn: number;
  medianReturn: number;
  winRate: number;
  averageDrawdown: number;
  benchmarkExcessReturn: number | null;
  interpretation: string;
}

export interface ConfidenceCalibrationResult {
  buckets: ConfidenceCalibrationBucket[];
  overallSampleCount: number;
  meaningfulCorrelation: boolean | null;
  interpretation: string;
}

export interface ExpectedReturnValidation {
  horizon: BacktestHorizon;
  predictedReturn: number;
  realizedReturn: number | null;
  predictionError: number | null;
  absoluteError: number | null;
  directionalAccuracy: boolean | null;
  sampleCount: number;
}

export interface LeadTimeResult {
  decisionDate: string;
  ticker: string;
  leadTimeDays: number | null;
  majorMoveDate: string | null;
  majorMoveReturn: number | null;
  dataAvailable: boolean;
}

export interface LeadTimeSummary {
  averageLeadTime: number | null;
  medianLeadTime: number | null;
  bestLeadTime: number | null;
  worstLeadTime: number | null;
  sampleCount: number;
  leadTimeByScoreBucket: Record<string, number>;
  leadTimeBySignalStrength: Record<string, number>;
  interpretation: string;
}

export type FalsePositiveReason =
  | 'weak_fundamentals'
  | 'weak_smart_money'
  | 'false_breakout'
  | 'catalyst_failure'
  | 'prediction_failure'
  | 'data_quality_issue'
  | 'market_wide_selloff'
  | 'sector_weakness'
  | 'excessive_risk'
  | 'low_signal_convergence'
  | 'yetersiz_kanit';

export interface FalsePositiveResult {
  ticker: string;
  decisionDate: string;
  decisionScore: number;
  confidence: number;
  expectedReturn: number;
  realizedReturn: number | null;
  likelyReason: FalsePositiveReason;
  supportingEvidence: string[];
}

export interface FalsePositiveSummary {
  totalFalsePositives: number;
  falsePositives: FalsePositiveResult[];
  reasonBreakdown: Record<FalsePositiveReason, number>;
  sampleCount: number;
}

export interface MissedOpportunityResult {
  ticker: string;
  decisionDate: string;
  laterReturn: number;
  scoreAtTime: number;
  confidenceAtTime: number;
  filterFailures: string[];
  missingSignals: number;
  missingCatalyst: boolean;
  missingFundamentalData: boolean;
  dataQualityExclusion: boolean;
  insufficientHistory: boolean;
}

export interface MissedOpportunitySummary {
  totalMissed: number;
  missedOpportunities: MissedOpportunityResult[];
  sampleCount: number;
}

export type SampleQualityLabel = 'INSUFFICIENT_SAMPLE' | 'LOW_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'STRONGER_STATISTICAL_SIGNAL';

export interface SampleQualityResult {
  sampleCount: number;
  label: SampleQualityLabel;
  description: string;
}

export type SurvivorshipWarning = 'NO_HISTORICAL_MEMBERSHIP' | 'HISTORICAL_MEMBERSHIP_USED';

export interface SurvivorshipInfo {
  warning: SurvivorshipWarning;
  universeSize: number;
  symbolsEvaluated: number;
  note: string;
}

export interface CorporateActionLimitation {
  delistedHandling: boolean;
  tickerChangeHandling: boolean;
  splitHandling: boolean;
  dividendHandling: boolean;
  mergerHandling: boolean;
  note: string;
}

export interface TransactionCostAssumption {
  commission: number;
  slippage: number;
}

export interface PerformanceMetrics {
  decisionsEvaluated: number;
  outcomesEvaluated: number;
  skippedDates: number;
  invalidDates: number;
  historicalCoverage: number;
  executionDurationMs: number;
  averageDecisionDurationMs: number;
  providerCalls: number;
  cacheHits: number;
  indicatorCacheHits: number;
}

export interface ImmutableDecisionRecord {
  id: string;
  snapshot: EarlyOpportunityDecisionSnapshot;
  fullDecision: EarlyOpportunityDecision;
  createdAt: string;
  runId: string;
}

export interface BacktestRunConfig {
  symbols?: string[];
  timeframes?: string[];
  startDate: string;
  endDate: string;
  horizons?: BacktestHorizon[];
  minScore?: number;
  minConfidence?: number;
  benchmark?: string;
  commission?: number;
  slippage?: number;
  maxSymbols?: number;
  maxDecisions?: number;
}

export interface BacktestRunResult {
  runId: string;
  config: BacktestRunConfig;
  startedAt: string;
  completedAt: string;
  decisions: ImmutableDecisionRecord[];
  outcomes: FutureOutcome[];
  successResults: DecisionSuccessResult[];
  benchmarkResults: BenchmarkComparisonResult[];
  expectedReturnValidation: ExpectedReturnValidation[];
  confidenceCalibration: ConfidenceCalibrationResult;
  leadTime: LeadTimeSummary;
  falsePositives: FalsePositiveSummary;
  missedOpportunities: MissedOpportunitySummary;
  sampleQuality: SampleQualityResult;
  survivorship: SurvivorshipInfo;
  corporateActions: CorporateActionLimitation;
  transactionCosts: TransactionCostAssumption;
  performance: PerformanceMetrics;
  evaluationType: 'HISTORICAL_OUTCOME_VALIDATION';
  pointInTimeVerified: boolean;
  lookAheadTested: boolean;
  survivorshipBiasPossible: boolean;
}

export interface BacktestSummary {
  runId: string;
  config: BacktestRunConfig;
  startedAt: string;
  completedAt: string;
  decisionsEvaluated: number;
  winRate: number;
  averageReturn: number;
  medianReturn: number;
  benchmarkExcessReturn: number | null;
  maxDrawdown: number;
  averageLeadTime: number | null;
  falsePositiveCount: number;
  missedOpportunityCount: number;
  sampleQuality: SampleQualityLabel;
  survivorshipWarning: string;
  pointInTimeVerified: boolean;
  evaluationType: 'HISTORICAL_OUTCOME_VALIDATION';
}

export interface DecisionTableRow {
  ticker: string;
  decisionDate: string;
  decision: string;
  eliteScore: number;
  confidence: number;
  expectedReturn: number;
  realizedReturn: number | null;
  return1W: number | null;
  return1M: number | null;
  return3M: number | null;
  return6M: number | null;
  return1Y: number | null;
  benchmarkReturn: number | null;
  excessReturn: number | null;
  maxDrawdown: number;
  leadTime: number | null;
  outcome: string;
  dataQuality: string;
}