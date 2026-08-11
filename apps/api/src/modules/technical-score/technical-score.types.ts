import { Timeframe } from '../indicators/indicator.types';
import { RuleStatus } from '../technical-rules/technical-rules.types';

export type TechnicalGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface RuleScore {
  rule: string;
  category: string;
  status: RuleStatus;
  weight: number;
  contribution: number;
}

export interface TechnicalScore {
  score: number;
  grade: TechnicalGrade;
  confidence: number;
  ruleBreakdown: RuleScore[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}

export interface TechnicalScoreOutput extends TechnicalScore {
  timeframe: Timeframe;
}
