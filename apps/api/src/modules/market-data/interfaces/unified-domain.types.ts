import { CompanyProfile, FinancialRatios, BalanceSheet, IncomeStatement } from './fundamental.types';

export interface Company {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  sharesOutstanding: number | null;
  currency: string;
  exchange: string;
  lastUpdated: string;
  source: string;
}

export interface FinancialStatement {
  symbol: string;
  period: string;
  revenue: number | null;
  netIncome: number | null;
  ebitda: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  costOfRevenue: number | null;
  lastUpdated: string;
  source: string;
}

export interface UnifiedBalanceSheet {
  symbol: string;
  period: string;
  equity: number | null;
  totalDebt: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  sharesOutstanding: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  lastUpdated: string;
  source: string;
}

export interface UnifiedIncomeStatement {
  symbol: string;
  period: string;
  revenue: number | null;
  netProfit: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  grossProfit: number | null;
  costOfRevenue: number | null;
  lastUpdated: string;
  source: string;
}

export interface CashFlow {
  symbol: string;
  period: string;
  operatingCashFlow: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  freeCashFlow: number | null;
  lastUpdated: string;
  source: string;
}

export interface Sector {
  symbol: string;
  sector: string;
  subSector: string | null;
  lastUpdated: string;
  source: string;
}

export interface Disclosure {
  symbol: string;
  title: string;
  date: string;
  category: string;
  url: string | null;
  source: string;
}

export interface FundamentalProfile {
  symbol: string;
  profile: CompanyProfile | null;
  ratios: FinancialRatios | null;
  balance: BalanceSheet | null;
  income: IncomeStatement | null;
  sector: Sector | null;
  netProfitPrevious: number | null;
  equityPrevious: number | null;
  lastUpdated: string;
  source: string;
}

export type DataQuality = 'VALID' | 'PARTIAL' | 'INVALID';

export interface IncrementalUpdate {
  cacheHit: boolean;
  incrementalUpdate: boolean;
  providerUsed: string | null;
  previousBarCount: number;
  newBarCount: number;
  mergedBarCount: number;
  lastCachedTimestamp: string | null;
  latestTimestamp: string | null;
  dataFreshness: 'fresh' | 'stale' | 'no-data';
  validationStatus: 'validated' | 'unvalidated' | 'invalid' | 'none';
  stale?: boolean;
}

export interface IncrementalQualityReport {
  score: number;
  status: string;
  integrityValid: boolean;
  freshnessOverall: string;
  warnings: string[];
  errors: string[];
}

export interface MarketDataResult<T> {
  data: T;
  provider: string;
  cached: boolean;
  timestamp: string;
  sourceTimeframe?: string;
  fallbackUsed?: boolean;
  dataQuality?: DataQuality;
  validated?: boolean;
  attemptedProviders?: string[];
  actualProvider?: string;
  providerAttempts?: number;
  freshness?: string;
  incremental?: IncrementalUpdate;
  /**
   * Optional enrichment produced by the existing FinancialDataQualityService
   * ("where appropriate"), summarising OHLCV market-integrity + freshness for
   * the merged historical series. Never affects the hard OHLCV validation
   * performed by MarketDataValidationService above. Absent when the service is
   * unavailable (e.g. financial-rules module not installed).
   */
  quality?: IncrementalQualityReport;
}
