import { Injectable, Optional } from '@nestjs/common';
import { BaseProviderAdapter } from './base-provider.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
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
  FundamentalProfile,
} from '../../interfaces';

interface FintablesFundamentalsRaw {
  ticker?: string;
  company_name?: string;
  sector?: string;
  sub_sector?: string;
  period?: string;
  market_cap?: number;
  net_profit?: number;
  sales?: number;
  equity?: number;
  total_assets?: number;
  total_debt?: number;
  pe?: number;
  pb?: number;
  ev_to_ebitda?: number;
  shares_outstanding?: number;
}

interface FintablesQuoteRaw {
  price?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
  previousClose?: number;
  timestamp?: string;
}

@Injectable()
export class FintablesUnifiedAdapter extends BaseProviderAdapter {
  readonly name = 'fintables';
  private readonly apiKey: string;
  private readonly fundamentalCacheTtlMs = 24 * 60 * 60 * 1000;
  private readonly fundamentalRawCache = new Map<
    string,
    { data: FintablesFundamentalsRaw; expiresAt: number }
  >();

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional() config?: { apiKey?: string; timeout?: number; retries?: number },
  ) {
    super('FintablesUnifiedAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.FINTABLES_API_KEY ?? '';
  }

  private get baseUrl(): string {
    return process.env.FINTABLES_BASE_URL || 'https://fintables.com/api/v1';
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchFundamentals(symbol: string): Promise<FintablesFundamentalsRaw | null> {
    const cacheKey = `${symbol.toLowerCase()}`;
    const cached = this.fundamentalRawCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const result = await this.withRetry(async () => {
      const params = this.periodOverride
        ? `?period=${encodeURIComponent(this.periodOverride)}`
        : '';
      const response = await fetch(
        `${this.baseUrl}/fundamentals/${encodeURIComponent(symbol)}${params}`,
        {
          method: 'GET',
          headers: this.buildHeaders(),
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FintablesFundamentalsRaw;
    }, `fetchFundamentals(${symbol})`);

    if (result) {
      this.fundamentalRawCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.fundamentalCacheTtlMs,
      });
    }
    return result;
  }

  get periodOverride(): string | undefined {
    return process.env.FINTABLES_PERIOD;
  }

  private async fetchQuote(symbol: string): Promise<FintablesQuoteRaw | null> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/quote/${encodeURIComponent(symbol)}`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FintablesQuoteRaw;
    }, `fetchQuote(${symbol})`);
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    const result = await this.fetchFundamentals(symbol);
    if (!result) return null;

    return {
      symbol: result.ticker || symbol,
      name: result.company_name || symbol,
      sector: result.sector || 'Unknown',
      marketCap: result.market_cap ?? 0,
      sharesOutstanding: result.shares_outstanding ?? null,
      currency: 'TRY',
      exchange: 'BIST',
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchFinancials(symbol: string): Promise<FinancialStatement | null> {
    const result = await this.fetchFundamentals(symbol);
    if (!result) return null;

    return {
      symbol: result.ticker || symbol,
      period: 'annual',
      revenue: result.sales ?? null,
      netIncome: result.net_profit ?? null,
      ebitda: null,
      grossProfit: null,
      operatingIncome: null,
      costOfRevenue: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null> {
    const result = await this.fetchFundamentals(symbol);
    if (!result) return null;

    return {
      symbol: result.ticker || symbol,
      period: 'annual',
      equity: result.equity ?? null,
      totalDebt: result.total_debt ?? null,
      totalAssets: result.total_assets ?? null,
      totalLiabilities: null,
      sharesOutstanding: result.shares_outstanding ?? null,
      currentAssets: null,
      currentLiabilities: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null> {
    const result = await this.fetchFundamentals(symbol);
    if (!result) return null;

    return {
      symbol: result.ticker || symbol,
      period: 'annual',
      revenue: result.sales ?? null,
      netProfit: result.net_profit ?? null,
      operatingIncome: null,
      ebitda: null,
      grossProfit: null,
      costOfRevenue: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchCashFlow(_symbol: string): Promise<CashFlow | null> {
    return null;
  }

  async fetchSector(symbol: string): Promise<Sector | null> {
    const result = await this.fetchFundamentals(symbol);
    if (!result) return null;

    return {
      symbol: result.ticker || symbol,
      sector: result.sector || 'Unknown',
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
    _options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/historical/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}`,
        {
          method: 'GET',
          headers: this.buildHeaders(),
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    }, `getHistoricalData(${symbol})`);

    if (!result || !Array.isArray(result)) return [];

    return result.map((item) => ({
      symbol,
      timeframe: timeframe as MarketDataPoint['timeframe'],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      timestamp: item.date,
      validationStatus: 'valid' as const,
    }));
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    const result = await this.fetchQuote(symbol);
    if (!result || result.price == null) return null;

    return {
      symbol,
      timeframe: '1d',
      open: result.open ?? result.price,
      high: result.high ?? result.price,
      low: result.low ?? result.price,
      close: result.price,
      volume: result.volume ?? 0,
      timestamp: result.timestamp ?? new Date().toISOString(),
      validationStatus: 'valid',
    };
  }

  getAvailableTimeframes(): string[] {
    return ['1d', '1w', '1m'];
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

  async getFinancialRatios(symbol: string): Promise<FinancialRatios | null> {
    const result = await this.fetchFundamentals(symbol);
    if (!result) return null;

    return {
      symbol: result.ticker || symbol,
      priceToBook: result.pb ?? null,
      enterpriseValueToEBITDA: result.ev_to_ebitda ?? null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet | null> {
    const bs = await this.fetchBalanceSheet(symbol);
    if (!bs) return null;
    return {
      symbol: bs.symbol,
      equity: bs.equity,
      totalDebt: bs.totalDebt,
      totalAssets: bs.totalAssets,
      sharesOutstanding: bs.sharesOutstanding,
      lastUpdated: bs.lastUpdated,
      source: bs.source,
    };
  }

  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    const is = await this.fetchIncomeStatement(symbol);
    if (!is) return null;
    return {
      symbol: is.symbol,
      netProfit: is.netProfit,
      lastUpdated: is.lastUpdated,
      source: is.source,
    };
  }

  async getSector(symbol: string): Promise<CompanySector | null> {
    const sector = await this.fetchSector(symbol);
    if (!sector) return null;
    return {
      symbol: sector.symbol,
      sector: sector.sector,
      lastUpdated: sector.lastUpdated,
      source: sector.source,
    };
  }

  async fetchFundamentalData(symbol: string): Promise<FundamentalProfile | null> {
    const lastUpdated = new Date().toISOString();

    const [profile, ratios, balance, income, sector] = await Promise.all([
      this.getCompanyProfile(symbol),
      this.getFinancialRatios(symbol),
      this.getBalanceSheet(symbol),
      this.getIncomeStatement(symbol),
      this.getSector(symbol),
    ]);

    if (!profile && !ratios && !balance && !income && !sector) return null;

    // NOTE: Fintables `/fundamentals/{symbol}` returns a single period.
    // Prior-period figures (netProfitPrevious / equityPrevious) are not
    // provided by this endpoint, so they are left null -> growth rules
    // resolve to UNKNOWN. Do NOT fabricate them from the current period.
    const presentCount = [profile, ratios, balance, income, sector].filter(
      (v) => v !== null && v !== undefined,
    ).length;
    const dataStatus: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE' =
      presentCount === 0 ? 'UNAVAILABLE' : presentCount < 5 ? 'PARTIALLY_AVAILABLE' : 'AVAILABLE';
    const confidence = presentCount / 5;

    return {
      symbol,
      profile,
      ratios,
      balance,
      income,
      sector: sector
        ? { symbol, sector: sector.sector, subSector: null, lastUpdated, source: sector.source }
        : null,
      netProfitPrevious: null,
      equityPrevious: null,
      lastUpdated,
      source: this.name,
      availableAt: lastUpdated,
      periodEndDate: null,
      announcementDate: null,
      currency: null,
      dataStatus,
      confidence,
    };
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    return [];
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'BIST-Elite-AI/1.0',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }
}
