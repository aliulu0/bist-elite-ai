import { DecisionId } from '../decision/decision.types';
import { OpportunityLevel } from '../ai-opportunity/opportunity.types';

export const ELITE_SCORE_ENGINE_VERSION = '1.0.0';

export type EliteScoreHorizon =
  | 'GUNLUK'
  | 'HAFTALIK'
  | 'AYLIK'
  | 'UC_AYLIK'
  | 'ALTI_AYLIK';

export const ELITE_SCORE_HORIZONS: EliteScoreHorizon[] = [
  'GUNLUK',
  'HAFTALIK',
  'AYLIK',
  'UC_AYLIK',
  'ALTI_AYLIK',
];

export interface EliteScoreHorizonResult {
  horizon: EliteScoreHorizon;
  etiket: string;
  skor: number;
  confidence: number;
  reasons: string[];
  warnings: string[];
}

export interface EliteScoreResult {
  ticker: string;
  company: string;
  horizons: EliteScoreHorizonResult[];
  dominantStrategyId: string;
  dominantStrategyName: string;
  dominantSignals: string[];
  decision: DecisionId;
  decisionLabel: string;
  opportunityLevel: OpportunityLevel;
  evaluatedAt: string;
}

export interface EliteScoreRegistryEntry {
  ticker: string;
  input: unknown;
  result: EliteScoreResult;
  evaluatedAt: string;
}
