import { PipelineInput } from './ai-analysis.types';
import { AggregatedResult } from '../market-data/aggregation/aggregation.types';
import { Company, FinancialStatement, UnifiedIncomeStatement, UnifiedBalanceSheet, CashFlow, Sector } from '../market-data/interfaces/unified-domain.types';

function baseMetadata() {
  return {
    providersQueried: ['fintables'],
    providersUsed: ['fintables'],
    providersFailed: [],
    providerConfidence: { fintables: 90 },
    qualityScore: 85,
    lastUpdated: new Date().toISOString(),
    cacheStatus: 'miss' as const,
    aggregationDurationMs: 100,
    validationWarnings: [],
    conflictCount: 0,
    conflicts: [],
  };
}

export function buildCompany(overrides?: Partial<Company>): AggregatedResult<Company> {
  return {
    data: {
      symbol: 'THYAO',
      name: 'Turkish Airlines',
      sector: 'Aviation',
      marketCap: 5_000_000_000,
      sharesOutstanding: 1_000_000_000,
      currency: 'TRY',
      exchange: 'BIST',
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
      ...overrides,
    },
    metadata: baseMetadata(),
  };
}

export function buildIncome(overrides?: Partial<UnifiedIncomeStatement>): AggregatedResult<UnifiedIncomeStatement> {
  return {
    data: {
      symbol: 'THYAO',
      period: '2024-Q4',
      revenue: 1_000_000_000,
      costOfRevenue: 600_000_000,
      grossProfit: 400_000_000,
      operatingIncome: 200_000_000,
      netProfit: 150_000_000,
      ebitda: 300_000_000,
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
      ...overrides,
    },
    metadata: baseMetadata(),
  };
}

export function buildBalance(overrides?: Partial<UnifiedBalanceSheet>): AggregatedResult<UnifiedBalanceSheet> {
  return {
    data: {
      symbol: 'THYAO',
      period: '2024-Q4',
      totalAssets: 2_000_000_000,
      totalLiabilities: 800_000_000,
      equity: 1_200_000_000,
      totalDebt: 500_000_000,
      currentAssets: 600_000_000,
      currentLiabilities: 400_000_000,
      sharesOutstanding: 1_000_000_000,
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
      ...overrides,
    },
    metadata: baseMetadata(),
  };
}

export function buildCash(overrides?: Partial<CashFlow>): AggregatedResult<CashFlow> {
  return {
    data: {
      symbol: 'THYAO',
      period: '2024-Q4',
      operatingCashFlow: 200_000_000,
      investingCashFlow: -100_000_000,
      financingCashFlow: -50_000_000,
      freeCashFlow: 100_000_000,
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
      ...overrides,
    },
    metadata: baseMetadata(),
  };
}

export function buildSector(overrides?: Partial<Sector>): AggregatedResult<Sector> {
  return {
    data: {
      symbol: 'THYAO',
      sector: 'Technology',
      subSector: 'Software',
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
      ...overrides,
    },
    metadata: baseMetadata(),
  };
}

export function buildFinancials(overrides?: Partial<FinancialStatement>): AggregatedResult<FinancialStatement> {
  return {
    data: {
      symbol: 'THYAO',
      period: '2024-Q4',
      revenue: 1_000_000_000,
      costOfRevenue: 600_000_000,
      grossProfit: 400_000_000,
      operatingIncome: 200_000_000,
      netIncome: 150_000_000,
      ebitda: 300_000_000,
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
      ...overrides,
    },
    metadata: baseMetadata(),
  };
}

export function buildFullInput(): PipelineInput {
  return {
    company: buildCompany(),
    incomeStatement: buildIncome(),
    balanceSheet: buildBalance(),
    cashFlow: buildCash(),
    sector: buildSector(),
  };
}
