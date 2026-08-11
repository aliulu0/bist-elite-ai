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
} from '../../interfaces';

export interface TCMBExchangeRate {
  currency: string;
  rate: number;
  date: string;
}

export interface TCMBMonetaryPolicyData {
  policyRate: number;
  rateDate: string;
  reserveRequirements?: number;
}

export interface TCMBInterestDecision {
  date: string;
  policyRate: number;
  change: number | null;
}

interface EVDSItem {
  [key: string]: string | null;
}

interface EVDSResponse {
  items: EVDSItem[];
  success: boolean;
  message?: string;
}

const EVDS_SERIES = {
  policyRate: 'TP.PF.TMPB.04',
  cpiYoY: 'TP.FG.J0',
  usdTry: 'TP.DK.USD.S.YTL',
  eurTry: 'TP.DK.EUR.S.YTL',
} as const;

type EvdsSeriesKey = (typeof EVDS_SERIES)[keyof typeof EVDS_SERIES];

const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

@Injectable()
export class TCMBAdapter extends BaseProviderAdapter {
  readonly name = 'tcmb';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional() config?: { apiKey?: string; baseUrl?: string; timeout?: number; retries?: number },
  ) {
    super('TCMBAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.TCMB_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.TCMB_BASE_URL ?? 'https://evds2.tcmb.gov.tr/service/evds';
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const query = new URLSearchParams({
        series: EVDS_SERIES.policyRate,
        type: 'json',
        key: this.apiKey,
      });
      const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return false;
      const body = (await response.json()) as EVDSResponse;
      return body.success === true;
    } catch {
      return false;
    }
  }

  async fetchCompany(_symbol: string): Promise<Company | null> {
    return null;
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

  async fetchSector(_symbol: string): Promise<Sector | null> {
    return null;
  }

  async fetchDisclosures(_symbol: string): Promise<Disclosure[]> {
    return [];
  }

  async getHistoricalData(_symbol: string, _timeframe: string, _options?: FetchOptions): Promise<MarketDataPoint[]> {
    return [];
  }

  async getLatestPrice(_symbol: string): Promise<MarketDataPoint | null> {
    return null;
  }

  getAvailableTimeframes(): string[] {
    return [];
  }

  async getCompanyProfile(_symbol: string): Promise<CompanyProfile | null> {
    return null;
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

  async getSector(_symbol: string): Promise<CompanySector | null> {
    return null;
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    if (!this.apiKey) {
      this.logger.warn('TCMB_API_KEY not configured, skipping EVDS macro indicators');
      return [];
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 370 * 24 * 60 * 60 * 1000);

    const series = await this.fetchEvdsSeries(
      [
        EVDS_SERIES.policyRate,
        EVDS_SERIES.cpiYoY,
        EVDS_SERIES.usdTry,
        EVDS_SERIES.eurTry,
      ],
      startDate,
      endDate,
    );

    if (!series || series.length === 0) {
      this.logger.warn('EVDS returned no data for macro indicators');
      return [];
    }

    const latest = series[series.length - 1];
    const previous = series.length > 1 ? series[series.length - 2] : undefined;

    const policyRate = this.parseNumber(latest[EVDS_SERIES.policyRate]);
    const cpiYoY = this.parseNumber(latest[EVDS_SERIES.cpiYoY]);
    const usdTry = this.parseNumber(latest[EVDS_SERIES.usdTry]);
    const eurTry = this.parseNumber(latest[EVDS_SERIES.eurTry]);

    const timestamp = this.parseDate(latest.Tarih) ?? new Date().toISOString();
    const indicators: MacroIndicator[] = [];

    if (policyRate !== null) {
      indicators.push({
        symbol: 'tcmb_policy_rate',
        value: policyRate,
        change: previous ? this.diff(this.parseNumber(previous[EVDS_SERIES.policyRate]), policyRate) : undefined,
        changePercent: previous
          ? this.diffPercent(this.parseNumber(previous[EVDS_SERIES.policyRate]), policyRate)
          : undefined,
        timestamp,
        source: this.name,
      });
    }

    if (cpiYoY !== null) {
      indicators.push({
        symbol: 'inflation',
        value: cpiYoY,
        change: previous ? this.diff(this.parseNumber(previous[EVDS_SERIES.cpiYoY]), cpiYoY) : undefined,
        changePercent: previous
          ? this.diffPercent(this.parseNumber(previous[EVDS_SERIES.cpiYoY]), cpiYoY)
          : undefined,
        timestamp,
        source: this.name,
      });
    }

    if (usdTry !== null) {
      indicators.push({
        symbol: 'usdtry',
        value: usdTry,
        change: previous ? this.diff(this.parseNumber(previous[EVDS_SERIES.usdTry]), usdTry) : undefined,
        changePercent: previous
          ? this.diffPercent(this.parseNumber(previous[EVDS_SERIES.usdTry]), usdTry)
          : undefined,
        timestamp,
        source: this.name,
      });
    }

    if (usdTry !== null && eurTry !== null) {
      const eurusd = eurTry / usdTry;
      indicators.push({
        symbol: 'eurusd',
        value: Math.round(eurusd * 10000) / 10000,
        change: previous
          ? this.diff(
              previous[EVDS_SERIES.usdTry] && previous[EVDS_SERIES.eurTry]
                ? this.parseNumber(previous[EVDS_SERIES.eurTry])! / this.parseNumber(previous[EVDS_SERIES.usdTry])!
                : null,
              eurusd,
            )
          : undefined,
        changePercent: undefined,
        timestamp,
        source: this.name,
      });
    }

    return indicators;
  }

  async getExchangeRates(): Promise<TCMBExchangeRate[]> {
    if (!this.apiKey) {
      this.logger.warn('TCMB_API_KEY not configured, skipping exchange rates');
      return [];
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 8 * 24 * 60 * 60 * 1000);

    const series = await this.fetchEvdsSeries(
      [EVDS_SERIES.usdTry, EVDS_SERIES.eurTry],
      startDate,
      endDate,
    );

    if (!series || series.length === 0) return [];

    const rates: TCMBExchangeRate[] = [];
    for (const item of series) {
      const date = this.parseDate(item.Tarih) ?? new Date().toISOString();
      const usd = this.parseNumber(item[EVDS_SERIES.usdTry]);
      const eur = this.parseNumber(item[EVDS_SERIES.eurTry]);
      if (usd !== null) rates.push({ currency: 'USD', rate: usd, date });
      if (eur !== null) rates.push({ currency: 'EUR', rate: eur, date });
    }
    return rates;
  }

  async getMonetaryPolicyData(): Promise<TCMBMonetaryPolicyData | null> {
    if (!this.apiKey) {
      this.logger.warn('TCMB_API_KEY not configured, skipping monetary policy data');
      return null;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 370 * 24 * 60 * 60 * 1000);

    const series = await this.fetchEvdsSeries([EVDS_SERIES.policyRate], startDate, endDate);
    if (!series || series.length === 0) return null;

    const latest = series[series.length - 1];
    const policyRate = this.parseNumber(latest[EVDS_SERIES.policyRate]);
    if (policyRate === null) return null;

    return {
      policyRate,
      rateDate: this.parseDate(latest.Tarih) ?? new Date().toISOString(),
    };
  }

  async getInterestDecisionDates(): Promise<TCMBInterestDecision[]> {
    if (!this.apiKey) {
      this.logger.warn('TCMB_API_KEY not configured, skipping interest decision dates');
      return [];
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 370 * 24 * 60 * 60 * 1000);

    const series = await this.fetchEvdsSeries([EVDS_SERIES.policyRate], startDate, endDate);
    if (!series || series.length === 0) return [];

    const decisions: TCMBInterestDecision[] = [];
    let previousRate: number | null = null;

    for (const item of series) {
      const rate = this.parseNumber(item[EVDS_SERIES.policyRate]);
      const date = this.parseDate(item.Tarih);
      if (rate === null || !date) continue;

      const change = previousRate !== null ? Math.round((rate - previousRate) * 100) / 100 : null;
      decisions.push({ date, policyRate: rate, change });
      previousRate = rate;
    }

    return decisions.slice(-12).reverse();
  }

  private async fetchEvdsSeries(
    seriesCodes: EvdsSeriesKey[],
    startDate: Date,
    endDate: Date,
  ): Promise<EVDSItem[] | null> {
    const query = new URLSearchParams({
      series: seriesCodes.join(','),
      startDate: this.toEvdsDate(startDate),
      endDate: this.toEvdsDate(endDate),
      type: 'json',
      key: this.apiKey,
    });

    const result = await this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as EVDSResponse;
      if (!body.success) throw new Error(`EVDS error: ${body.message ?? 'unknown'}`);
      return body.items ?? [];
    }, `fetchEvdsSeries(${seriesCodes.join(',')})`);

    if (!result) return null;
    return result.filter((item) => Object.values(item).some((v) => v !== null && v !== ''));
  }

  private parseNumber(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const trimmed = String(value).trim();
    if (!NUMBER_PATTERN.test(trimmed)) return null;
    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(value.trim());
    if (!match) return null;
    const [, day, month, year] = match;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return new Date(iso).toISOString();
  }

  private toEvdsDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${date.getFullYear()}`;
  }

  private diff(previous: number | null, current: number): number | undefined {
    return previous === null ? undefined : Math.round((current - previous) * 10000) / 10000;
  }

  private diffPercent(previous: number | null, current: number): number | undefined {
    if (previous === null || previous === 0) return undefined;
    return Math.round(((current - previous) / previous) * 10000) / 10000;
  }

  private buildHeaders(): Record<string, string> {
    return {
      'User-Agent': 'BIST-Elite-AI/1.0',
      Accept: 'application/json',
    };
  }
}
