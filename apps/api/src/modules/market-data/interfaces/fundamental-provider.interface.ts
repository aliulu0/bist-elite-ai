import {
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
} from './fundamental.types';

export interface IFundamentalProvider {
  readonly name: string;

  validateConnection(): Promise<boolean>;

  getCompanyProfile(symbol: string): Promise<CompanyProfile | null>;
  getFinancialRatios(symbol: string): Promise<FinancialRatios | null>;
  getBalanceSheet(symbol: string): Promise<BalanceSheet | null>;
  getIncomeStatement(symbol: string): Promise<IncomeStatement | null>;
  getSector(symbol: string): Promise<CompanySector | null>;
}
