export interface RuleAnalyticsConfig {
  minTradesForStat: number;
  maxPairCombinations: number;
  maxTripleCombinations: number;
  riskFreeRate: number;
  tradingDaysPerYear: number;
}

export const DEFAULT_RULE_ANALYTICS_CONFIG: RuleAnalyticsConfig = {
  minTradesForStat: 3,
  maxPairCombinations: 100,
  maxTripleCombinations: 50,
  riskFreeRate: 0.15,
  tradingDaysPerYear: 252,
};
