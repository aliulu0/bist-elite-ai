import {
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
} from '../market-data/interfaces/fundamental.types';
import { FundamentalData } from '../historical-data/historical-data.types';
import { FinancialData } from '../financial-rules/rule.types';
import { Logger } from '@nestjs/common';

const logger = new Logger('FundamentalMapper');

export interface FundamentalProviderInputs {
  profile?: CompanyProfile | null;
  ratios?: FinancialRatios | null;
  balance?: BalanceSheet | null;
  income?: IncomeStatement | null;
  sector?: CompanySector | null;
  /** Prior-period net profit, when the provider exposes it. */
  netProfitPrevious?: number | null;
  /** Prior-period equity, when the provider exposes it. */
  equityPrevious?: number | null;
  /** Sector average benchmarks used by the SectorComparisonRule. */
  sectorAverages?: {
    priceToBook?: number | null;
    enterpriseValueToEBITDA?: number | null;
    debtRatio?: number | null;
  };
}

export interface FinancialDataOverrides {
  netProfitPrevious?: number | null;
  equityPrevious?: number | null;
  sectorAverages?: FinancialData['sectorAverages'];
}

export function mapToFundamentalData(inputs: FundamentalProviderInputs): FundamentalData {
  const { profile, ratios, balance, income, sector } = inputs;

  const result: FundamentalData = {
    priceToBook: ratios?.priceToBook ?? null,
    evToEBITDA: ratios?.enterpriseValueToEBITDA ?? null,
    netProfit: income?.netProfit ?? null,
    equity: balance?.equity ?? null,
    totalDebt: balance?.totalDebt ?? null,
    totalAssets: balance?.totalAssets ?? null,
    sharesOutstanding: balance?.sharesOutstanding ?? null,
    marketCap: profile?.marketCap ?? null,
    sector: sector?.sector ?? profile?.sector ?? null,
    companyName: profile?.companyName ?? null,
  };

  const coreFields: Array<keyof FundamentalData> = [
    'priceToBook',
    'evToEBITDA',
    'netProfit',
    'equity',
    'totalDebt',
    'totalAssets',
    'sharesOutstanding',
    'marketCap',
  ];

  const present = coreFields.filter((field) => result[field] != null).length;
  const provider =
    profile?.source ??
    ratios?.source ??
    balance?.source ??
    income?.source ??
    sector?.source ??
    null;
  const retrievedAt = new Date().toISOString();

  result.provider = provider;
  result.retrievedAt = retrievedAt;
  result.availableAt = retrievedAt;
  result.periodEndDate = null;
  result.announcementDate = null;
  result.currency = null;
  result.dataStatus =
    present === 0
      ? 'UNAVAILABLE'
      : present < coreFields.length
        ? 'PARTIALLY_AVAILABLE'
        : 'AVAILABLE';
  result.confidence = coreFields.length > 0 ? present / coreFields.length : 0;

  const missingFields = Object.entries(result)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  if (missingFields.length > 0) {
    logger.debug(
      `Fundamental mapping: ${missingFields.length} null field(s) [${missingFields.join(', ')}]`,
    );
  }

  return result;
}

export function mapToFinancialData(
  symbol: string,
  fundamentals: FundamentalData,
  overrides: FinancialDataOverrides = {},
): FinancialData {
  return {
    symbol,
    priceToBook: fundamentals.priceToBook,
    enterpriseValueToEBITDA: fundamentals.evToEBITDA,
    netProfit: fundamentals.netProfit,
    netProfitPrevious: overrides.netProfitPrevious ?? null,
    equity: fundamentals.equity,
    equityPrevious: overrides.equityPrevious ?? null,
    totalDebt: fundamentals.totalDebt,
    totalAssets: fundamentals.totalAssets ?? null,
    sector: fundamentals.sector,
    sectorAverages: overrides.sectorAverages,
  };
}
