import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { DecisionId } from '../decision/decision.types';

export const TOMORROW_ENGINE_VERSION = '1.0.0';

export type TomorrowCategory =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MEDIUM'
  | 'WATCH'
  | 'WEAK';

export interface TomorrowInput {
  opportunity: OpportunityResult;
  elite: EliteScoreResult;
}

export interface TomorrowCandidateResult {
  ticker: string;
  company: string;
  tomorrowScore: number;
  tomorrowConfidence: number;
  category: TomorrowCategory;
  categoryLabel: string;
  categoryStars: string;
  aiScore: number | null;
  eliteDaily: number;
  eliteWeekly: number;
  decision: DecisionId;
  decisionLabel: string;
  opportunityLevel: OpportunityResult['level'];
  opportunityScore: number;
  strategyId: string;
  strategyName: string;
  strategyScore: number | null;
  verification: number | null;
  catalyst: number | null;
  reasons: string[];
  warnings: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  tags: string[];
  evaluatedAt: string;
}

export interface TomorrowRegistryEntry {
  ticker: string;
  input: TomorrowInput;
  result: TomorrowCandidateResult;
  evaluatedAt: string;
}
