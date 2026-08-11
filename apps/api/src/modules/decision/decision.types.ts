import {
  HistoricalPricePoint,
  FinancialSnapshot,
  IndicatorSnapshot,
  VerificationSnapshot,
  CatalystSnapshot,
} from '../scoring/scoring-types';

export const DECISION_ENGINE_VERSION = '1.0.0';

export type DecisionId =
  | 'GÜÇLÜ_AL'
  | 'AL'
  | 'İZLE'
  | 'BEKLE'
  | 'RİSKLİ'
  | 'SAT'
  | 'GÜÇLÜ_SAT';

export const DECISION_IDS: DecisionId[] = [
  'GÜÇLÜ_AL',
  'AL',
  'İZLE',
  'BEKLE',
  'RİSKLİ',
  'SAT',
  'GÜÇLÜ_SAT',
];

export interface DecisionDimensionScores {
  technical: number | null;
  fundamental: number | null;
  momentum: number | null;
  trend: number | null;
  liquidity: number | null;
  risk: number | null;
  volume: number | null;
  quality: number | null;
  verification: number | null;
  catalyst: number | null;
}

export interface DecisionInput {
  ticker: string;
  company: string;
  sector: string | null;
  price: number | null;
  aiScore: number | null;
  aiConfidence: number | null;
  strategyId: string;
  strategyName: string;
  strategyScore: number | null;
  strategyConfidence: number | null;
  dimensions: DecisionDimensionScores;
  historicalPrices?: HistoricalPricePoint[];
  financials?: FinancialSnapshot;
  indicators?: IndicatorSnapshot;
  verificationData?: VerificationSnapshot;
  catalystData?: CatalystSnapshot;
}

export type OverviewStarDimension =
  | 'trend'
  | 'momentum'
  | 'risk'
  | 'verification'
  | 'catalyst'
  | 'liquidity'
  | 'quality';

export interface OverviewStarRating {
  dimension: OverviewStarDimension;
  label: string;
  stars: number;
  starString: string;
}

export interface DecisionOverview {
  ratings: OverviewStarRating[];
  totalStars: number;
  maxStars: number;
}

export interface DecisionResult {
  ticker: string;
  company: string;
  decision: DecisionId;
  decisionLabel: string;
  decisionScore: number;
  confidence: number;
  reasons: string[];
  warnings: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  overview: DecisionOverview;
  aiScore: number | null;
  aiConfidence: number | null;
  strategyId: string;
  strategyName: string;
  strategyScore: number | null;
  dimensionScores: DecisionDimensionScores;
  evaluatedAt: string;
}

export interface DecisionRegistryEntry {
  ticker: string;
  input: DecisionInput;
  result: DecisionResult;
  evaluatedAt: string;
}
