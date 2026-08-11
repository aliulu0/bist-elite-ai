import { PredictionResult, PredictionTimeframe } from '../../prediction/prediction.types';
import { AIConsensus } from '../../ai-research/ai-research.types';

export const MULTI_TIMEFRAME_ENGINE_VERSION = '1.0.0';

export const MULTI_TIMEFRAME_TIMEFRAMES: readonly PredictionTimeframe[] = [
  '1h',
  '2h',
  '4h',
  '1d',
  '1w',
  '1m',
  '3m',
  '6m',
];

export const MULTI_TIMEFRAME_SHORT: readonly PredictionTimeframe[] = ['1h', '2h', '4h', '1d'];
export const MULTI_TIMEFRAME_LONG: readonly PredictionTimeframe[] = ['1w', '1m', '3m', '6m'];

export const MULTI_TIMEFRAME_WEIGHTS: Record<PredictionTimeframe, number> = {
  '1h': 0.1,
  '2h': 0.1,
  '4h': 0.1,
  '1d': 0.2,
  '1w': 0.2,
  '1m': 0.15,
  '3m': 0.1,
  '6m': 0.05,
};

export type OpportunityStrength = 'Weak' | 'Medium' | 'Strong' | 'Very Strong';

export const OPPORTUNITY_STRENGTHS: OpportunityStrength[] = [
  'Weak',
  'Medium',
  'Strong',
  'Very Strong',
];

export const OPPORTUNITY_STRENGTH_META: Record<
  OpportunityStrength,
  { label: string; minScore: number }
> = {
  Weak: { label: 'Zayıf', minScore: 0 },
  Medium: { label: 'Orta', minScore: 50 },
  Strong: { label: 'Güçlü', minScore: 65 },
  'Very Strong': { label: 'Çok Güçlü', minScore: 80 },
};

export type TrendStage = 'Early' | 'Growing' | 'Breakout' | 'Extended' | 'Late';

export const TREND_STAGES: TrendStage[] = [
  'Early',
  'Growing',
  'Breakout',
  'Extended',
  'Late',
];

export type HoldingType = 'Intraday' | 'Swing' | 'Position' | 'Investment';

export interface TimeframeSignal {
  timeframe: PredictionTimeframe;
  bullish: number;
  confidence: number;
  momentum: string;
  trend: string;
  trendStrength: string;
  riskScore: number;
  risk: string;
  holdingUnit: string;
}

export interface AlignmentScores {
  timeframeAgreement: number;
  trendAlignment: number;
  momentumAlignment: number;
  riskAlignment: number;
  confidenceAlignment: number;
  smartMoneyAlignment: number;
  catalystAlignment: number;
  macroAlignment: number;
  marketStructureAlignment: number;
}

export interface RiskSummary {
  avgRiskScore: number;
  distribution: { low: number; medium: number; high: number };
  maxRisk: string;
  summary: string;
}

export interface MultiTimeframeOpportunityInput {
  ticker: string;
  company: string;
  sector: string;
  predictions: PredictionResult[];
  consensus: AIConsensus | null;
}

export interface MultiTimeframeOpportunityResult {
  ticker: string;
  company: string;
  sector: string;
  multiTimeframeScore: number;
  strength: OpportunityStrength;
  strengthLabel: string;
  trendStage: TrendStage;
  holdingType: HoldingType;
  bestTimeframe: PredictionTimeframe;
  worstTimeframe: PredictionTimeframe;
  mostBullishTimeframe: PredictionTimeframe;
  highestConfidenceTimeframe: PredictionTimeframe;
  timeframesAnalyzed: PredictionTimeframe[];
  alignments: AlignmentScores;
  riskSummary: RiskSummary;
  expectedReturn: number;
  bullishPercent: number;
  confidence: number;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  riskRewardRatio: number | null;
  reasons: string[];
  evaluatedAt: string;
}
