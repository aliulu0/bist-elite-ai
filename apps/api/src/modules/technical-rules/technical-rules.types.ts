import { Timeframe } from '../indicators/indicator.types';

export type RuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_AVAILABLE';

export type RuleCategory =
  | 'trend'
  | 'momentum'
  | 'volume'
  | 'volatility'
  | 'money_flow'
  | 'market_structure'
  | 'smart_money';

export interface TechnicalRuleResult {
  rule: string;
  category: RuleCategory;
  status: RuleStatus;
  description: string;
  value: unknown;
  metadata: Record<string, unknown>;
}

export interface TechnicalRulesOutput {
  timeframe: Timeframe;
  rules: TechnicalRuleResult[];
  isValid: boolean;
}
