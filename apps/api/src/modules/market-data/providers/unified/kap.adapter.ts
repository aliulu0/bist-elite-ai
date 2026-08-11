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

interface KAPMemberLookup {
  companyCode?: string;
  mkkMemberOid?: string;
  title?: string;
  permaLink?: string;
}

interface KAPCompanyItem {
  kapMemberOid?: string;
  kapMemberType?: string;
  kapMemberState?: string;
  mkkMemberOid?: string;
  kapMemberTitle?: string;
  stockCode?: string;
  sector?: string;
  industryGroup?: string;
  subSector?: string;
}

interface KAPDisclosureRaw {
  publishDate?: string;
  kapTitle?: string;
  disclosureClass?: string;
  disclosureType?: string;
  disclosureCategory?: string;
  summary?: string;
  subject?: string;
  relatedStocks?: string;
  stockCodes?: string;
  disclosureIndex?: number;
  isLate?: boolean;
  modifyStatus?: string;
  attachmentCount?: number;
}

@Injectable()
export class KAPAdapter extends BaseProviderAdapter {
  readonly name = 'kap';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional() config?: { apiKey?: string; baseUrl?: string; timeout?: number; retries?: number },
  ) {
    super('KAPAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.KAP_API_KEY ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.KAP_BASE_URL ?? 'https://www.kap.org.tr/tr/api';
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/member/filter/THYAO`, {
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
    const member = await this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/member/filter/${encodeURIComponent(symbol)}`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as KAPMemberLookup;
    }, `fetchCompany(${symbol})`);

    if (!member || !member.title) return null;

    return {
      symbol,
      name: member.title,
      sector: 'Unknown',
      marketCap: 0,
      sharesOutstanding: null,
      currency: 'TRY',
      exchange: 'BIST',
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
    const company = await this.lookupCompanyItem(symbol);
    if (!company) return null;

    const sectorName = company.sector || company.industryGroup || 'Unknown';
    return {
      symbol,
      sector: sectorName,
      subSector: company.subSector ?? null,
      lastUpdated: new Date().toISOString(),
      source: this.name,
    };
  }

  async fetchDisclosures(symbol: string): Promise<Disclosure[]> {
    const memberOid = await this.resolveMemberOid(symbol);
    const toDate = new Date();
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/disclosure/members/byCriteria`, {
        method: 'POST',
        headers: {
          ...this.buildHeaders(),
          'Content-Type': 'application/json',
          Referer: 'https://www.kap.org.tr/tr/bildirim-sorgu',
        },
        body: JSON.stringify({
          fromDate: this.toDateString(fromDate),
          toDate: this.toDateString(toDate),
          mkkMemberOidList: memberOid ? [memberOid] : [],
          subjectList: [],
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as KAPDisclosureRaw[];
    }, `fetchDisclosures(${symbol})`);

    if (!result || !Array.isArray(result)) return [];

    return result
      .filter((item) => this.matchesSymbol(item, symbol))
      .slice(0, 100)
      .map((item) => ({
        symbol,
        title: item.subject || item.summary || 'Bildirim',
        date: this.parseKAPDate(item.publishDate),
        category: item.disclosureCategory || item.disclosureType || 'general',
        url: typeof item.disclosureIndex === 'number' ? `https://www.kap.org.tr/tr/Bildirim/${item.disclosureIndex}` : null,
        source: this.name,
      }));
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

  private async resolveMemberOid(symbol: string): Promise<string | null> {
    const member = await this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/member/filter/${encodeURIComponent(symbol)}`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as KAPMemberLookup;
    }, `resolveMemberOid(${symbol})`);

    return member?.mkkMemberOid ?? null;
  }

  private async lookupCompanyItem(symbol: string): Promise<KAPCompanyItem | null> {
    const items = await this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/company/items/IGS/A`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as KAPCompanyItem[];
    }, `lookupCompanyItem(${symbol})`);

    if (!items || !Array.isArray(items)) return null;
    const normalized = symbol.toLocaleUpperCase('tr');
    return (
      items.find(
        (item) => (item.stockCode ?? '').toLocaleUpperCase('tr') === normalized,
      ) ?? null
    );
  }

  private matchesSymbol(item: KAPDisclosureRaw, symbol: string): boolean {
    const normalized = symbol.toLocaleUpperCase('tr');
    const related = (item.relatedStocks ?? '').toLocaleUpperCase('tr');
    const stockCodes = (item.stockCodes ?? '').toLocaleUpperCase('tr');
    return related.split(',').includes(normalized) || stockCodes.split(',').includes(normalized);
  }

  private parseKAPDate(value?: string): string {
    if (!value) return new Date().toISOString();
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})[ T]?(\d{2})?:?(\d{2})?:?(\d{2})?/);
    if (!match) return new Date().toISOString();
    const [, day, month, year, hour = '00', minute = '00', second = '00'] = match;
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'BIST-Elite-AI/1.0',
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}
