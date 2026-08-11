import { IDataProvider } from '../../interfaces/data-provider.interface';
import { IFundamentalProvider } from '../../interfaces/fundamental-provider.interface';
import { MacroIndicator } from '../../interfaces/macro-indicator.types';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
  FundamentalProfile,
} from '../../interfaces/unified-domain.types';

export interface ProviderStatus {
  name: string;
  connected: boolean;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  lastSuccessTime: number | null;
  lastFailureTime: number | null;
  uptimeMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  lastHealthCheck: string | null;
}

export interface IUnifiedMarketDataProvider extends IDataProvider, IFundamentalProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  health(): Promise<boolean>;
  getStatus(): ProviderStatus;
  fetchCompany(symbol: string): Promise<Company | null>;
  fetchFinancials(symbol: string): Promise<FinancialStatement | null>;
  fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null>;
  fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null>;
  fetchCashFlow(symbol: string): Promise<CashFlow | null>;
  fetchSector(symbol: string): Promise<Sector | null>;
  fetchDisclosures(symbol: string): Promise<Disclosure[]>;
  getMacroIndicators(): Promise<MacroIndicator[]>;
  normalize<T>(data: unknown, source: string): T;
  fetchFundamentalData(symbol: string): Promise<FundamentalProfile | null>;
}
