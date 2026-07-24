export interface CompanyProfile {
  symbol: string;
  companyName: string;
  sector: string;
  marketCap: number;
  lastUpdated: string;
  source: string;
}

export interface FinancialRatios {
  symbol: string;
  priceToBook: number | null;
  enterpriseValueToEBITDA: number | null;
  lastUpdated: string;
  source: string;
}

export interface BalanceSheet {
  symbol: string;
  equity: number | null;
  totalDebt: number | null;
  sharesOutstanding: number | null;
  lastUpdated: string;
  source: string;
}

export interface IncomeStatement {
  symbol: string;
  netProfit: number | null;
  lastUpdated: string;
  source: string;
}

export interface CompanySector {
  symbol: string;
  sector: string;
  lastUpdated: string;
  source: string;
}
