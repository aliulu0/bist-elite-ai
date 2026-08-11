import { Injectable, Optional } from '@nestjs/common';
import { BaseProviderAdapter } from './base-provider.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { YahooFinanceProvider } from '../yahoo-finance.provider';
import {
  Company,
  FinancialStatement,
  UnifiedBalanceSheet,
  UnifiedIncomeStatement,
  CashFlow,
  Sector,
  Disclosure,
} from '../../interfaces/unified-domain.types';
import {
  MarketDataPoint,
  FetchOptions,
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
  MacroIndicator,
} from '../../interfaces';

@Injectable()
export class YahooUnifiedAdapter extends BaseProviderAdapter {
  readonly name = 'yahoo';
  private readonly baseUrl: string;

  constructor(
    circuitBreaker: CircuitBreakerService,
    private readonly yahooProvider: YahooFinanceProvider,
    @Optional() config?: { baseUrl?: string; timeout?: number; retries?: number },
  ) {
    super('YahooUnifiedAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.baseUrl = config?.baseUrl ?? process.env.YAHOO_BASE_URL ?? 'https://query1.finance.yahoo.com';
  }

  async validateConnection(): Promise<boolean> {
    return this.yahooProvider.validateConnection();
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    const meta = await this.withRetry(
      () => this.yahooProvider.getQuoteMeta(symbol),
      `fetchCompany(${symbol})`,
    );
    if (!meta) return null;

    return {
      symbol,
      name: meta.longName ?? meta.shortName ?? meta.symbol ?? symbol,
      sector: 'Unknown',
      marketCap: 0,
      sharesOutstanding: null,
      currency: meta.currency ?? 'TRY',
      exchange: meta.exchangeName ?? 'BIST',
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchFinancials(_symbol: string): Promise<FinancialStatement | null> {
    return null;
  }

  async fetchBalanceSheet(_symbol: string): Promise<UnifiedBalanceSheet | null> {
    return null;
  }

  async fetchIncomeStatement(_symbol: string): Promise<UnifiedIncomeStatement | null> {
    return null;
  }

  async fetchCashFlow(_symbol: string): Promise<CashFlow | null> {
    return null;
  }

  async fetchSector(symbol: string): Promise<Sector | null> {
    const company = await this.fetchCompany(symbol);
    if (!company) return null;
    return {
      symbol,
      sector: company.sector,
      subSector: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchDisclosures(_symbol: string): Promise<Disclosure[]> {
    return [];
  }

  async getHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    const result = await this.withRetry(
      () => this.yahooProvider.getHistoricalData(symbol, timeframe, options),
      `getHistoricalData(${symbol}, ${timeframe})`,
    );
    return result ?? [];
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    return this.withRetry(
      () => this.yahooProvider.getLatestPrice(symbol),
      `getLatestPrice(${symbol})`,
    );
  }

  getAvailableTimeframes(): string[] {
    return this.yahooProvider.getAvailableTimeframes();
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    const company = await this.fetchCompany(symbol);
    if (!company) return null;
    return {
      symbol: company.symbol,
      companyName: company.name,
      sector: company.sector,
      marketCap: company.marketCap,
      lastUpdated: company.lastUpdated,
      source: company.source,
    };
  }

  async getFinancialRatios(_symbol: string): Promise<FinancialRatios | null> {
    return null;
  }

  async getBalanceSheet(_symbol: string): Promise<BalanceSheet | null> {
    return null;
  }

  async getIncomeStatement(_symbol: string): Promise<IncomeStatement | null> {
    return null;
  }

  async getSector(symbol: string): Promise<CompanySector | null> {
    const sector = await this.fetchSector(symbol);
    if (!sector) return null;
    return {
      symbol: sector.symbol,
      sector: sector.sector,
      lastUpdated: sector.lastUpdated,
      source: this.name,
    };
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    return [];
  }
}
