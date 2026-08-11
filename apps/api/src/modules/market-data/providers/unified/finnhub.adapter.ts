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
import { MarketDataPoint, FetchOptions, CompanyProfile, FinancialRatios, BalanceSheet, IncomeStatement, CompanySector, MacroIndicator } from '../../interfaces';

interface FinnhubQuote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

interface FinnhubProfile {
  name: string;
  ticker: string;
  exchange: string;
  currency: string;
  marketCapitalization: number;
  shareOutstanding: number;
  finnhubIndustry: string;
}

interface FinnhubFinancial {
  symbol: string;
  year: number;
  month: number;
  revenue: number;
  netIncome: number;
  ebitda: number;
  grossProfit: number;
}

interface FinnhubMetricRaw {
  metric?: {
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    'bookValuePerShare'?: number;
    'peBasicExclExtraTTM'?: number;
    'pbRatio'?: number;
    'evToEBITDA'?: number;
    'currentRatio'?: number;
    'debtToEquity'?: number;
    'roeTTM'?: number;
    'roaTTM'?: number;
    'dividendYieldIndicatedAnnual'?: number;
    'epsTTM'?: number;
    'marketCapitalization'?: number;
    'sharesOutstanding'?: number;
  };
}

interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

const FINNHUB_RESOLUTIONS: Record<string, string> = {
  '1h': '60',
  '2h': '60',
  '4h': '60',
  '1d': 'D',
  '1w': 'W',
  '1m': 'M',
};

const MACRO_SYMBOLS: Array<{ source: string; finnhubSymbol: string; label: string }> = [
  { source: 'vix', finnhubSymbol: '^VIX', label: 'VIX Volatility' },
  { source: 'dxy', finnhubSymbol: 'DX-Y.NYB', label: 'DXY Index' },
  { source: 'us10y', finnhubSymbol: 'TNX', label: 'US 10Y Yield' },
  { source: 'us2y', finnhubSymbol: '2YY', label: 'US 2Y Yield' },
  { source: 'sp500', finnhubSymbol: 'SPY', label: 'S&P 500' },
  { source: 'nasdaq', finnhubSymbol: 'QQQ', label: 'NASDAQ' },
  { source: 'gold', finnhubSymbol: 'GC=F', label: 'Gold' },
  { source: 'silver', finnhubSymbol: 'SI=F', label: 'Silver' },
  { source: 'brent', finnhubSymbol: 'BZ=F', label: 'Brent Oil' },
  { source: 'wti', finnhubSymbol: 'CL=F', label: 'WTI Oil' },
  { source: 'dollar_index', finnhubSymbol: 'DX-Y.NYB', label: 'Dollar Index' },
];

@Injectable()
export class FinnhubAdapter extends BaseProviderAdapter {
  readonly name = 'finnhub';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional() config?: { apiKey?: string; baseUrl?: string; timeout?: number; retries?: number },
  ) {
    super('FinnhubAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.FINNHUB_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.FINNHUB_BASE_URL ?? 'https://finnhub.io/api/v1';
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/quote?symbol=AAPL&token=${this.apiKey}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubProfile;
    }, `fetchCompany(${symbol})`);

    if (!result || !result.name) return null;

    return {
      symbol,
      name: result.name,
      sector: result.finnhubIndustry || 'Unknown',
      marketCap: (result.marketCapitalization ?? 0) * 1_000_000,
      sharesOutstanding: result.shareOutstanding ?? null,
      currency: result.currency || 'USD',
      exchange: result.exchange || 'Unknown',
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchFinancials(symbol: string): Promise<FinancialStatement | null> {
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/stock/financial?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { data?: FinnhubFinancial[] };
      return data.data?.[0] ?? null;
    }, `fetchFinancials(${symbol})`);

    if (!result) return null;

    return {
      symbol,
      period: `${result.year}-${String(result.month).padStart(2, '0')}`,
      revenue: result.revenue ?? null,
      netIncome: result.netIncome ?? null,
      ebitda: result.ebitda ?? null,
      grossProfit: result.grossProfit ?? null,
      operatingIncome: null,
      costOfRevenue: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null> {
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubMetricRaw;
    }, `fetchBalanceSheet(${symbol})`);

    if (!result?.metric) return null;

    return {
      symbol,
      period: 'annual',
      equity: null,
      totalDebt: null,
      totalAssets: null,
      totalLiabilities: null,
      sharesOutstanding: result.metric.sharesOutstanding ?? null,
      currentAssets: null,
      currentLiabilities: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null> {
    const financials = await this.fetchFinancials(symbol);
    if (!financials) return null;

    return {
      symbol,
      period: financials.period,
      revenue: financials.revenue,
      netProfit: financials.netIncome,
      operatingIncome: financials.operatingIncome,
      ebitda: financials.ebitda,
      grossProfit: financials.grossProfit,
      costOfRevenue: null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
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

  async fetchDisclosures(symbol: string): Promise<Disclosure[]> {
    const result = await this.withRetry(async () => {
      const from = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
      const to = Math.floor(Date.now() / 1000);
      const response = await fetch(
        `${this.baseUrl}/company-news?symbol=${encodeURIComponent(symbol)}&from=${new Date(from * 1000).toISOString().split('T')[0]}&to=${new Date(to * 1000).toISOString().split('T')[0]}&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubNewsItem[];
    }, `fetchDisclosures(${symbol})`);

    if (!result || !Array.isArray(result)) return [];

    return result.slice(0, 50).map((item) => ({
      symbol,
      title: item.headline,
      date: new Date(item.datetime * 1000).toISOString(),
      category: item.category || 'general',
      url: item.url || null,
      source: this.name,
    }));
  }

  async getHistoricalData(symbol: string, timeframe: string, options?: FetchOptions): Promise<MarketDataPoint[]> {
    if (!this.apiKey) return [];

    const resolution = FINNHUB_RESOLUTIONS[timeframe];
    if (!resolution) return [];

    const result = await this.withRetry(async () => {
      const from = options?.startDate
        ? Math.floor(new Date(options.startDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
      const to = options?.endDate
        ? Math.floor(new Date(options.endDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const response = await fetch(
        `${this.baseUrl}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as {
        s: string;
        c: number[];
        h: number[];
        l: number[];
        o: number[];
        t: number[];
        v: number[];
      };
    }, `getHistoricalData(${symbol})`);

    if (!result || result.s !== 'ok') return [];

    return result.t.map((timestamp, i) => ({
      symbol,
      timeframe: timeframe as MarketDataPoint['timeframe'],
      open: result.o[i],
      high: result.h[i],
      low: result.l[i],
      close: result.c[i],
      volume: result.v[i],
      timestamp: new Date(timestamp * 1000).toISOString(),
      validationStatus: 'valid' as const,
    }));
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    if (!this.apiKey) return null;

    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubQuote;
    }, `getLatestPrice(${symbol})`);

    if (!result || !result.c) return null;

    return {
      symbol,
      timeframe: '1d',
      open: result.o,
      high: result.h,
      low: result.l,
      close: result.c,
      volume: 0,
      timestamp: new Date(result.t * 1000).toISOString(),
      validationStatus: 'valid',
    };
  }

  getAvailableTimeframes(): string[] {
    return ['1h', '2h', '4h', '1d', '1w', '1m'];
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
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubMetricRaw;
    }, `getFinancialRatios(${symbol})`);

    if (!result?.metric) return null;

    return {
      symbol,
      priceToBook: result.metric.pbRatio ?? null,
      enterpriseValueToEBITDA: result.metric.evToEBITDA ?? null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet | null> {
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubMetricRaw;
    }, `getBalanceSheet(${symbol})`);

    if (!result?.metric) return null;

    return {
      symbol,
      equity: null,
      totalDebt: null,
      totalAssets: null,
      sharesOutstanding: result.metric.sharesOutstanding ?? null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    const financials = await this.fetchFinancials(symbol);
    if (!financials) return null;
    return {
      symbol,
      netProfit: financials.netIncome,
      lastUpdated: financials.lastUpdated,
      source: this.name,
    };
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
    const results = await Promise.allSettled(
      MACRO_SYMBOLS.map(async (item) => {
        const quote = await this.withRetry(async () => {
          const response = await fetch(
            `${this.baseUrl}/quote?symbol=${encodeURIComponent(item.finnhubSymbol)}&token=${this.apiKey}`,
            { signal: AbortSignal.timeout(this.timeoutMs) },
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return (await response.json()) as FinnhubQuote;
        }, `getMacroIndicators(${item.source})`);

        if (!quote || !quote.c) return null;

        return {
          symbol: item.source,
          value: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          timestamp: new Date(quote.t * 1000).toISOString(),
          source: this.name,
        } as MacroIndicator;
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<MacroIndicator> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);
  }

  async getMarketNews(): Promise<FinnhubNewsItem[]> {
    const result = await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/news?category=general&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as FinnhubNewsItem[];
    }, 'getMarketNews');

    return result ?? [];
  }
}
