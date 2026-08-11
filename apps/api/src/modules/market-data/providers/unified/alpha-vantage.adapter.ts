import { Injectable, Optional } from '@nestjs/common';
import { BaseProviderAdapter } from './base-provider.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import {
  ITechnicalIndicatorProvider,
  TechnicalIndicatorSeries,
  TechnicalIndicatorName,
  SectorPerformance,
} from './technical-indicator-provider.interface';
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
  Timeframe,
} from '../../interfaces';

const toNum = (value: unknown): number | null => {
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/,/g, ''));
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
};

const INDICATOR_MAP: Record<TechnicalIndicatorName, string> = {
  RSI: 'RSI',
  MACD: 'MACD',
  EMA: 'EMA',
  SMA: 'SMA',
  ADX: 'ADX',
  ATR: 'ATR',
  OBV: 'OBV',
};

const TIMEFRAME_FUNCTION: Record<string, string> = {
  '1d': 'TIME_SERIES_DAILY',
  '1w': 'TIME_SERIES_WEEKLY',
  '1m': 'TIME_SERIES_MONTHLY',
};

@Injectable()
export class AlphaVantageAdapter extends BaseProviderAdapter implements ITechnicalIndicatorProvider {
  readonly name = 'alpha_vantage';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly minRequestIntervalMs: number;
  private readonly dailyRequestLimit: number;
  private lastRequestTime = 0;
  private requestsToday = 0;
  private todayKey = '';

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional() config?: { apiKey?: string; baseUrl?: string; timeout?: number; retries?: number },
  ) {
    super('AlphaVantageAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.ALPHA_VANTAGE_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.ALPHA_VANTAGE_BASE_URL ?? 'https://www.alphavantage.co/query';
    this.minRequestIntervalMs = parseInt(
      process.env.ALPHA_VANTAGE_RATE_LIMIT_MS || '15000',
      10,
    );
    this.dailyRequestLimit = parseInt(
      process.env.ALPHA_VANTAGE_DAILY_LIMIT || '25',
      10,
    );
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Alpha Vantage API key not configured');
      return false;
    }
    try {
      const response = await fetch(`${this.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=1min`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    if (!this.apiKey) return null;
    const result = await this.withRetry(
      () => this.request<Record<string, unknown>>({ function: 'OVERVIEW', symbol: this.toAlphaVantageSymbol(symbol) }),
      `fetchCompany(${symbol})`,
    );
    if (!result) return null;

    const name = (result['Name'] as string) || symbol;
    const sector = (result['Sector'] as string) || 'Unknown';
    const currency = (result['Currency'] as string) || 'TRY';
    const marketCap = toNum(result['MarketCapitalization']);
    const sharesOutstanding = toNum(result['SharesOutstanding']);

    return {
      symbol,
      name,
      sector,
      marketCap: marketCap ?? 0,
      sharesOutstanding,
      currency,
      exchange: 'BIST',
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchFinancials(symbol: string): Promise<FinancialStatement | null> {
    const overview = await this.fetchOverview(symbol);
    if (!overview) return null;

    const revenue = toNum(overview['RevenueTTM']) ?? toNum(overview['Revenue']);
    const grossProfit = toNum(overview['GrossProfitTTM']) ?? toNum(overview['GrossProfit']);
    const operatingIncome = toNum(overview['OperatingIncomeTTM']) ?? toNum(overview['OperatingIncome']);
    const netIncome = toNum(overview['NetIncomeTTM']);
    const ebitda = toNum(overview['EBITDA']);

    return {
      symbol,
      period: 'TTM',
      revenue,
      netIncome,
      ebitda,
      grossProfit,
      operatingIncome,
      costOfRevenue: toNum(overview['CostOfRevenue']),
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchBalanceSheet(symbol: string): Promise<UnifiedBalanceSheet | null> {
    const overview = await this.fetchOverview(symbol);
    if (!overview) return null;

    return {
      symbol,
      period: 'TTM',
      equity: toNum(overview['TotalShareholderEquity']),
      totalDebt: toNum(overview['TotalDebt']),
      totalAssets: toNum(overview['TotalAssets']),
      totalLiabilities: toNum(overview['TotalLiabilities']),
      sharesOutstanding: toNum(overview['SharesOutstanding']),
      currentAssets: toNum(overview['TotalCurrentAssets']),
      currentLiabilities: toNum(overview['TotalCurrentLiabilities']),
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchIncomeStatement(symbol: string): Promise<UnifiedIncomeStatement | null> {
    const overview = await this.fetchOverview(symbol);
    if (!overview) return null;

    return {
      symbol,
      period: 'TTM',
      revenue: toNum(overview['RevenueTTM']) ?? toNum(overview['Revenue']),
      netProfit: toNum(overview['NetIncomeTTM']),
      operatingIncome: toNum(overview['OperatingIncomeTTM']) ?? toNum(overview['OperatingIncome']),
      ebitda: toNum(overview['EBITDA']),
      grossProfit: toNum(overview['GrossProfitTTM']) ?? toNum(overview['GrossProfit']),
      costOfRevenue: toNum(overview['CostOfRevenue']),
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

  async fetchDisclosures(_symbol: string): Promise<Disclosure[]> {
    return [];
  }

  async getHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    if (!this.apiKey) return [];
    const fn = TIMEFRAME_FUNCTION[timeframe];
    if (!fn) {
      this.logger.warn(`Unsupported timeframe for Alpha Vantage: ${timeframe}`);
      return [];
    }

    const avSymbol = this.toAlphaVantageSymbol(symbol);
    const result = await this.withRetry(
      () =>
        this.request<Record<string, unknown>>({
          function: fn,
          symbol: avSymbol,
          outputsize: options?.startDate ? 'full' : 'compact',
        }),
      `getHistoricalData(${symbol}, ${timeframe})`,
    );
    if (!result) return [];

    const seriesKey = this.seriesKey(fn, result);
    if (!seriesKey) return [];

    const series = result[seriesKey] as Record<string, Record<string, string>>;
    if (!series) return [];

    const points: MarketDataPoint[] = [];
    for (const [date, row] of Object.entries(series)) {
      const open = toNum(row['1. open']);
      const high = toNum(row['2. high']);
      const low = toNum(row['3. low']);
      const close = toNum(row['4. close']);
      const volume = toNum(row['5. volume']);

      if (open == null || high == null || low == null || close == null || volume == null) continue;
      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
      if (high < low) continue;

      const timestamp = new Date(`${date}T00:00:00Z`).toISOString();
      if (options?.startDate && timestamp < new Date(options.startDate).toISOString()) continue;
      if (options?.endDate && timestamp > new Date(options.endDate).toISOString()) continue;

      points.push({
        symbol,
        timeframe: timeframe as Timeframe,
        open,
        high,
        low,
        close,
        volume,
        timestamp,
        validationStatus: 'valid',
      });
    }

    return points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    if (!this.apiKey) return null;
    const result = await this.withRetry(
      () =>
        this.request<Record<string, unknown>>({
          function: 'TIME_SERIES_DAILY',
          symbol: this.toAlphaVantageSymbol(symbol),
          outputsize: 'compact',
        }),
      `getLatestPrice(${symbol})`,
    );
    if (!result) return null;

    const series = result['Time Series (Daily)'] as Record<string, Record<string, string>> | undefined;
    if (!series) return null;

    const entries = Object.entries(series).sort((a, b) => b[0].localeCompare(a[0]));
    if (entries.length === 0) return null;

    const [date, row] = entries[0];
    const open = toNum(row['1. open']);
    const high = toNum(row['2. high']);
    const low = toNum(row['3. low']);
    const close = toNum(row['4. close']);
    const volume = toNum(row['5. volume']);

    if (open == null || high == null || low == null || close == null || volume == null) return null;

    return {
      symbol,
      timeframe: '1d',
      open,
      high,
      low,
      close,
      volume,
      timestamp: new Date(`${date}T00:00:00Z`).toISOString(),
      validationStatus: 'valid',
    };
  }

  getAvailableTimeframes(): string[] {
    return Object.keys(TIMEFRAME_FUNCTION);
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
    const overview = await this.fetchOverview(symbol);
    if (!overview) return null;
    return {
      symbol,
      priceToBook: toNum(overview['PriceToBookRatio']),
      enterpriseValueToEBITDA: toNum(overview['EnterpriseValueToEBITDA']),
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet | null> {
    const sheet = await this.fetchBalanceSheet(symbol);
    if (!sheet) return null;
    return {
      symbol: sheet.symbol,
      equity: sheet.equity,
      totalDebt: sheet.totalDebt,
      totalAssets: sheet.totalAssets,
      sharesOutstanding: sheet.sharesOutstanding,
      lastUpdated: sheet.lastUpdated,
      source: sheet.source,
    };
  }

  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    const statement = await this.fetchIncomeStatement(symbol);
    if (!statement) return null;
    return {
      symbol: statement.symbol,
      netProfit: statement.netProfit,
      lastUpdated: statement.lastUpdated,
      source: statement.source,
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
    return [];
  }

  async getTechnicalIndicators(
    symbol: string,
    indicator: TechnicalIndicatorName,
    period = 14,
  ): Promise<TechnicalIndicatorSeries | null> {
    if (!this.apiKey) return null;
    const fn = INDICATOR_MAP[indicator];
    if (!fn) return null;

    const params: Record<string, string> = {
      function: fn,
      symbol: this.toAlphaVantageSymbol(symbol),
      interval: 'daily',
    };
    if (indicator !== 'OBV') {
      params['series_type'] = 'close';
    }
    if (indicator === 'MACD') {
      params['series_type'] = 'close';
    } else {
      params['time_period'] = String(period);
    }

    const result = await this.withRetry(
      () => this.request<Record<string, unknown>>(params),
      `getTechnicalIndicators(${symbol}, ${indicator})`,
    );
    if (!result) return null;

    const seriesKey = this.indicatorSeriesKey(result);
    if (!seriesKey) return null;

    const series = result[seriesKey] as Record<string, Record<string, string>> | undefined;
    if (!series) return null;

    const values = Object.entries(series)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([timestamp, row]) => {
        const valueKey =
          Object.keys(row).find((key) => key.trim().toLowerCase().includes(indicator.toLowerCase())) ??
          Object.keys(row)[0];
        const value = valueKey ? toNum(row[valueKey]) : null;
        return { timestamp: new Date(`${timestamp}T00:00:00Z`).toISOString(), value };
      });

    return {
      symbol,
      indicator,
      period,
      values,
      source: this.name,
    };
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    if (!this.apiKey) return [];
    const result = await this.withRetry(
      () => this.request<Record<string, unknown>>({ function: 'SECTOR' }),
      'getSectorPerformance()',
    );
    if (!result) return [];

    const realtime = result['Rank A: Real-Time Performance'] as Record<string, string> | undefined;
    if (!realtime) return [];

    return Object.entries(realtime)
      .map(([sector, change]) => ({
        sector,
        changePercent: toNum(change),
        timestamp: new Date().toISOString(),
        source: this.name,
      }))
      .filter((item) => item.changePercent !== null);
  }

  private async fetchOverview(symbol: string): Promise<Record<string, unknown> | null> {
    if (!this.apiKey) return null;
    const result = await this.withRetry(
      () =>
        this.request<Record<string, unknown>>({
          function: 'OVERVIEW',
          symbol: this.toAlphaVantageSymbol(symbol),
        }),
      `fetchOverview(${symbol})`,
    );
    if (!result || Object.keys(result).length === 0) return null;
    return result;
  }

  private async request<T>(params: Record<string, string>): Promise<T> {
    await this.throttle();
    const query = new URLSearchParams({ apikey: this.apiKey, ...params });
    const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
      method: 'GET',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = (await response.json()) as Record<string, unknown>;
    if (json['Note']) throw new Error(String(json['Note']));
    if (json['Error Message']) throw new Error(String(json['Error Message']));
    if (json['Information']) throw new Error(String(json['Information']));
    return json as T;
  }

  private async throttle(): Promise<void> {
    if (!this.apiKey) throw new Error('Alpha Vantage API key not configured');

    const now = new Date();
    const key = now.toISOString().split('T')[0];
    if (key !== this.todayKey) {
      this.todayKey = key;
      this.requestsToday = 0;
    }
    if (this.requestsToday >= this.dailyRequestLimit) {
      throw new Error('Alpha Vantage daily request limit reached');
    }

    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
    this.requestsToday++;
  }

  private toAlphaVantageSymbol(symbol: string): string {
    const trimmed = symbol.trim();
    if (!trimmed || trimmed.includes('.')) return trimmed;
    return `${trimmed}.IST`;
  }

  private seriesKey(fn: string, result: Record<string, unknown>): string | null {
    const map: Record<string, string[]> = {
      TIME_SERIES_DAILY: ['Time Series (Daily)'],
      TIME_SERIES_WEEKLY: ['Weekly Time Series'],
      TIME_SERIES_MONTHLY: ['Monthly Time Series'],
    };
    const candidates = map[fn] ?? [];
    for (const key of candidates) {
      if (result[key]) return key;
    }
    return null;
  }

  private indicatorSeriesKey(result: Record<string, unknown>): string | null {
    for (const key of Object.keys(result)) {
      if (key.toLowerCase().includes('technical analysis')) return key;
    }
    return null;
  }

  private buildHeaders(): Record<string, string> {
    return {
      'User-Agent': 'BIST-Elite-AI/1.0',
      Accept: 'application/json',
    };
  }
}
