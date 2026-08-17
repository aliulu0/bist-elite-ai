export type RuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'UNAVAILABLE';

export interface RuleResult {
  id: string;
  name: string;
  status: RuleStatus;
  value: number | null;
  reason: string;
}

export interface FinancialRulesOutput {
  symbol: string;
  rules: RuleResult[];
}

export interface FinancialData {
  symbol: string;
  priceToBook: number | null;
  enterpriseValueToEBITDA: number | null;
  netProfit: number | null;
  netProfitPrevious: number | null;
  equity: number | null;
  equityPrevious: number | null;
  totalDebt: number | null;
  totalAssets: number | null;
  sector: string | null;
  sectorAverages?: {
    priceToBook?: number | null;
    enterpriseValueToEBITDA?: number | null;
    debtRatio?: number | null;
  };
}

export interface RuleThresholds {
  priceToBook: { pass: number; warning: number };
  evToEbitda: { pass: number; warning: number };
  netProfitGrowth: { pass: number; warning: number };
  equityGrowth: { pass: number; warning: number };
  debtRatio: { pass: number; warning: number };
  sectorDeviation: { pass: number; warning: number };
}

export const DEFAULT_THRESHOLDS: RuleThresholds = {
  priceToBook: { pass: 1.5, warning: 3.0 },
  evToEbitda: { pass: 10, warning: 15 },
  netProfitGrowth: { pass: 10, warning: 0 },
  equityGrowth: { pass: 5, warning: 0 },
  debtRatio: { pass: 0.5, warning: 0.7 },
  sectorDeviation: { pass: 20, warning: 40 },
};
