import { RuleStatus } from './rule.types';

export type ScoreGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface ScoreBreakdownItem {
  ruleId: string;
  ruleName: string;
  weight: number;
  status: RuleStatus;
  contribution: number;
}

export interface ScoreBreakdown {
  items: ScoreBreakdownItem[];
  totalWeight: number;
}

export interface FinancialScoreResult {
  symbol: string;
  score: number;
  grade: ScoreGrade;
  passedRules: number;
  warningRules: number;
  failedRules: number;
  confidence: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreConfig {
  weights: Record<string, number>;
  grades: {
    aPlus: number;
    a: number;
    b: number;
    c: number;
  };
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  weights: {
    price_to_book: 20,
    ev_to_ebitda: 20,
    net_profit_growth: 20,
    equity_growth: 15,
    debt_ratio: 15,
    sector_comparison: 10,
  },
  grades: {
    aPlus: 90,
    a: 80,
    b: 70,
    c: 60,
  },
};
