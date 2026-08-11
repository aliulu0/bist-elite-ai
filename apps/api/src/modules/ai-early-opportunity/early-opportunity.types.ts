import { PredictionResult, PredictionTimeframe } from '../prediction/prediction.types';
import { AIConsensus } from '../ai-research/ai-research.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { DecisionResult } from '../decision/decision.types';
import { MultiTimeframeOpportunityResult } from './multi-timeframe/multi-timeframe.types';
import { FundamentalValidationReport } from '../financial-rules/fundamental-validation.service';
import { FinancialDataQualityReport, DataQualityContext } from '../financial-rules/financial-data-quality.types';
import { EarlySignal, SignalCategory } from './signals/early-signal.types';

export const EARLY_OPPORTUNITY_ENGINE_VERSION = '1.0.0';

export const EARLY_OPPORTUNITY_SCORE_MIN = 0;
export const EARLY_OPPORTUNITY_SCORE_MAX = 100;

export const EARLY_OPPORTUNITY_PRIMARY_TIMEFRAME: PredictionTimeframe = '1d';

export const EARLY_OPPORTUNITY_TIMEFRAMES: readonly PredictionTimeframe[] = [
  '1d',
  '1w',
  '1m',
  '3m',
  '6m',
];

export const EARLY_OPPORTUNITY_TIMEFRAME_WEIGHTS: Record<PredictionTimeframe, number> = {
  '1h': 0,
  '2h': 0,
  '4h': 0,
  '1d': 0.35,
  '1w': 0.25,
  '1m': 0.2,
  '3m': 0.1,
  '6m': 0.1,
};

export type EarlyOpportunityLevel =
  | 'ÇOK_GÜÇLÜ_FIRSAT'
  | 'GÜÇLÜ_FIRSAT'
  | 'FIRSAT'
  | 'İZLEME_LISTESI'
  | 'BEKLE';

export const EARLY_OPPORTUNITY_LEVELS: EarlyOpportunityLevel[] = [
  'ÇOK_GÜÇLÜ_FIRSAT',
  'GÜÇLÜ_FIRSAT',
  'FIRSAT',
  'İZLEME_LISTESI',
  'BEKLE',
];

export const EARLY_OPPORTUNITY_LEVEL_META: Record<
  EarlyOpportunityLevel,
  { label: string; emoji: string; minScore: number }
> = {
  ÇOK_GÜÇLÜ_FIRSAT: { label: 'Çok Güçlü Erken Fırsat', emoji: '🔥', minScore: 80 },
  GÜÇLÜ_FIRSAT: { label: 'Güçlü Erken Fırsat', emoji: '🟢', minScore: 70 },
  FIRSAT: { label: 'Erken Fırsat', emoji: '🟢', minScore: 60 },
  İZLEME_LISTESI: { label: 'İzleme Listesi', emoji: '🟡', minScore: 45 },
  BEKLE: { label: 'Bekle', emoji: '⚪', minScore: 0 },
};

export interface EarlyOpportunitySymbolInput {
  ticker: string;
  company: string;
  sector: string;
  predictions: PredictionResult[];
  consensus: AIConsensus | null;
  eliteScore: EliteScoreResult | null;
  opportunity: OpportunityResult | null;
  decision: DecisionResult | null;
}

export interface EarlyScoreComponents {
  bullishProbability: number;
  confidence: number;
  expectedReturn: number;
  riskAdjustedReturn: number;
  smartMoneyScore: number;
  catalystScore: number;
  verification: boolean;
  researchScore: number;
  eliteScore: number;
  backtestWinRate: number;
  opportunityScore: number;
  decisionScore: number;
  timeframeAgreement: number;
}

export interface EarlyOpportunityResult {
  ticker: string;
  company: string;
  sector: string;
  score: number;
  level: EarlyOpportunityLevel;
  levelLabel: string;
  levelEmoji: string;
  confidence: number;
  components: EarlyScoreComponents;
  timeframesEvaluated: PredictionTimeframe[];
  reasons: string[];
  evaluatedAt: string;
}

export type VerificationStatus = 'verified' | 'unverified' | 'unknown';

export { DataQualityContext } from '../financial-rules/financial-data-quality.types';

export interface CatalystSummary {
  score: number;
  verified: boolean;
}

export interface SmartMoneySummary {
  score: number;
  accumulation: string;
}

export interface ResearchConsensusSummary {
  agreementLevel: number;
  confidence: number;
  consensusScore: number;
  summary: string;
  evidenceCount: number;
}

export interface EarlyOpportunityIntelligenceResult {
  ticker: string;
  company: string;
  sector: string;
  marketCap: number | null;
  earlyOpportunityScore: number;
  earlyOpportunityLevel: EarlyOpportunityLevel;
  eliteScore: number;
  confidence: number;
  bullishPercent: number;
  risk: string;
  expectedReturn: number;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  riskRewardRatio: number | null;
  holdingPeriod: { value: number; unit: string } | null;
  catalyst: CatalystSummary | null;
  smartMoney: SmartMoneySummary | null;
  verificationStatus: VerificationStatus;
  researchConsensus: ResearchConsensusSummary | null;
  momentum: string;
  trend: string;
  liquidityQuality: string;
   timeframeAgreement: number;
   reasons: string[];
   fundamentals: FundamentalValidationReport | null;
   multiTimeframe?: MultiTimeframeOpportunityResult | null;
   financialDataQuality: FinancialDataQualityReport | null;
   signals: EarlySignal[];
   signalConvergenceScore: number;
   earlySignalCount: number;
   confirmedSignalCount: number;
   topSignals: EarlySignal[];
   evaluatedAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface EarlyOpportunityFilters {
  minEarlyOpportunityScore?: number;
  minConfidence?: number;
  minExpectedReturn?: number;
  maxRisk?: RiskLevel;
  sector?: string;
  marketCap?: { min?: number; max?: number };
  liquidity?: 'high' | 'medium' | 'low';
  minSmartMoneyScore?: number;
  minCatalystScore?: number;
  minEliteScore?: number;
  minFundamentalScore?: number;
  fundamentalStatus?: 'PASS' | 'WATCH' | 'FAIL' | 'UNKNOWN' | 'ANY';
  minFinancialDataQuality?: number;
  financialDataStatus?: 'DATA_VERIFIED' | 'DATA_ACCEPTABLE' | 'DATA_WARNING' | 'DATA_INSUFFICIENT' | 'ANY';
  freshnessStatus?: 'fresh' | 'stale' | 'unknown' | 'ANY';
  providerConsistency?: 'consistent' | 'partial' | 'conflicting' | 'ANY';
  minSignalStrength?: number;
  minSignalConvergence?: number;
  signalCategory?: SignalCategory;
  signalType?: string;
  earlyOnly?: boolean;
  confirmedOnly?: boolean;
}

export const RISK_LEVEL_ORDER: RiskLevel[] = ['low', 'medium', 'high'];

export interface SelfLearningEntry {
  ticker: string;
  predictedBullish: number;
  realizedWinRate: number;
  modifier: number;
  rationale: string;
  lastUpdated: string;
}

export interface SelfLearningReport {
  scanned: number;
  updated: number;
  modifiers: SelfLearningEntry[];
  generatedAt: string;
}
