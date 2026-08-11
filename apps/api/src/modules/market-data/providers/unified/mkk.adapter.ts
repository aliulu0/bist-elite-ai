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

export interface MKKShareholderRow {
  shareholderName: string;
  shareRatio: number;
  shareNominal: number | null;
  investorType: 'real' | 'institutional' | 'fund' | 'foreign' | 'domestic' | 'unknown';
  updatedAt: string;
}

export interface MKKOwnershipStructure {
  symbol: string;
  issuerTitle: string | null;
  totalShareholders: number | null;
  freeFloatRatio: number | null;
  domesticRatio: number | null;
  foreignRatio: number | null;
  topShareholders: MKKShareholderRow[];
  source: string;
  lastUpdated: string;
}

interface MKKAuthResponse {
  accessToken?: string;
  access_token?: string;
  token?: string;
  data?: { accessToken?: string; access_token?: string; token?: string };
}

interface MKKRequestHeader {
  senderReference: string;
  senderMember: string;
  sender: string;
}

interface MKKSecurityRow {
  symbol?: string;
  stockCode?: string;
  isin?: string;
  investorName?: string;
  investorTitle?: string;
  partnershipRatio?: number;
  nominalValue?: number;
  ownershipRatio?: number;
  investorType?: string;
  residentType?: string;
  customerType?: string;
  issuerTitle?: string;
  freeFloatRatio?: number;
  totalInvestorCount?: number;
  foreignRatio?: number;
  domesticRatio?: number;
}

@Injectable()
export class MKKAdapter extends BaseProviderAdapter {
  readonly name = 'mkk';
  private readonly apiKey: string;
  private readonly username: string;
  private readonly password: string;
  private readonly senderMember: string;
  private readonly sender: string;
  private readonly baseUrl: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    circuitBreaker: CircuitBreakerService,
    @Optional() config?: {
      apiKey?: string;
      username?: string;
      password?: string;
      senderMember?: string;
      sender?: string;
      baseUrl?: string;
      timeout?: number;
      retries?: number;
    },
  ) {
    super('MKKAdapter', circuitBreaker, config?.timeout, config?.retries);
    this.apiKey = config?.apiKey ?? process.env.MKK_API_KEY ?? '';
    this.username = config?.username ?? process.env.MKK_USERNAME ?? '';
    this.password = config?.password ?? process.env.MKK_PASSWORD ?? '';
    this.senderMember = config?.senderMember ?? process.env.MKK_SENDER_MEMBER ?? '';
    this.sender = config?.sender ?? process.env.MKK_SENDER ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.MKK_BASE_URL ?? 'https://api.mkk.com.tr';
  }

  async validateConnection(): Promise<boolean> {
    const token = await this.acquireToken();
    return token !== null;
  }

  async getOwnershipStructure(symbol: string): Promise<MKKOwnershipStructure | null> {
    const token = await this.acquireToken();
    if (!token) {
      this.logger.warn('MKK credentials not configured, ownership data unavailable');
      return null;
    }

    const rows = await this.fetchBalanceReport(token, symbol);
    if (!rows || rows.length === 0) {
      this.logger.warn(`No MKK balance rows for ${symbol}`);
      return null;
    }

    const matched = rows.filter((row) => this.matchesSymbol(row, symbol));
    const sourceRows = matched.length > 0 ? matched : rows;
    const byRatioDesc = [...sourceRows].sort(
      (a, b) => (b.partnershipRatio ?? b.ownershipRatio ?? 0) - (a.partnershipRatio ?? a.ownershipRatio ?? 0),
    );

    const domesticRatio = this.sumRatio(rows, (r) => r.residentType === 'DOMESTIC' || r.residentType === 'YERLI');
    const foreignRatio = this.sumRatio(rows, (r) => r.residentType === 'FOREIGN' || r.residentType === 'YABANCI');

    const topShareholders: MKKShareholderRow[] = byRatioDesc.slice(0, 10).map((row) => ({
      shareholderName:
        row.investorName ?? row.investorTitle ?? row.issuerTitle ?? row.symbol ?? 'Bilinmeyen',
      shareRatio: row.partnershipRatio ?? row.ownershipRatio ?? 0,
      shareNominal: row.nominalValue ?? null,
      investorType: this.classifyInvestor(row),
      updatedAt: new Date().toISOString(),
    }));

    const firstRow = sourceRows[0] ?? {};
    return {
      symbol,
      issuerTitle: firstRow.issuerTitle ?? null,
      totalShareholders: firstRow.totalInvestorCount ?? null,
      freeFloatRatio: firstRow.freeFloatRatio ?? null,
      domesticRatio,
      foreignRatio,
      topShareholders,
      source: this.name,
      lastUpdated: new Date().toISOString(),
    };
  }

  async fetchCompany(symbol: string): Promise<Company | null> {
    const structure = await this.getOwnershipStructure(symbol);
    if (!structure) return null;
    return {
      symbol,
      name: structure.issuerTitle ?? symbol,
      sector: 'Unknown',
      marketCap: 0,
      sharesOutstanding: null,
      currency: 'TRY',
      exchange: 'BIST',
      lastUpdated: structure.lastUpdated,
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

  async getSector(_symbol: string): Promise<CompanySector | null> {
    return null;
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    return [];
  }

  private async acquireToken(): Promise<string | null> {
    if (!this.username || !this.password) {
      return this.apiKey ? this.apiKey : null;
    }
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    const response = await this.withRetry(async () => {
      const res = await fetch(`${this.baseUrl}/v1/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestHeader: this.buildRequestHeader(),
          username: this.username,
          password: this.password,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as MKKAuthResponse;
    }, 'acquireToken');

    const token = response?.accessToken ?? response?.access_token ?? response?.token ?? response?.data?.accessToken ?? null;
    if (!token) return null;

    this.tokenCache = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
    return token;
  }

  private async fetchBalanceReport(token: string, symbol: string): Promise<MKKSecurityRow[]> {
    const response = await this.withRetry(async () => {
      const res = await fetch(`${this.baseUrl}/v1/reports/account/balance-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Sender: this.sender,
        },
        body: JSON.stringify({
          requestHeader: this.buildRequestHeader(),
          symbol,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as unknown;
    }, `fetchBalanceReport(${symbol})`);

    const data = (response as { data?: unknown[] })?.data;
    if (!Array.isArray(data)) return [];
    return data as MKKSecurityRow[];
  }

  private buildRequestHeader(): MKKRequestHeader {
    return {
      senderReference: `bist-elite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderMember: this.senderMember,
      sender: this.sender,
    };
  }

  private matchesSymbol(row: MKKSecurityRow, symbol: string): boolean {
    const normalized = symbol.toLocaleUpperCase('tr');
    return (
      (row.symbol ?? '').toLocaleUpperCase('tr') === normalized ||
      (row.stockCode ?? '').toLocaleUpperCase('tr') === normalized
    );
  }

  private sumRatio(rows: MKKSecurityRow[], predicate: (row: MKKSecurityRow) => boolean): number | null {
    const filtered = rows.filter(predicate);
    if (filtered.length === 0) return null;
    const total = filtered.reduce((sum, row) => sum + (row.partnershipRatio ?? row.ownershipRatio ?? 0), 0);
    return Math.round(total * 100) / 100;
  }

  private classifyInvestor(row: MKKSecurityRow): MKKShareholderRow['investorType'] {
    const type = (row.investorType ?? '').toLocaleUpperCase('tr');
    const customer = (row.customerType ?? '').toLocaleUpperCase('tr');
    const resident = (row.residentType ?? '').toLocaleUpperCase('tr');

    if (resident.includes('FOREIGN') || resident.includes('YABANCI')) return 'foreign';
    if (customer.includes('FUND') || customer.includes('FON')) return 'fund';
    if (type.includes('INSTITUTIONAL') || type.includes('KURUMSAL')) return 'institutional';
    if (type.includes('REAL') || type.includes('BIRESEL') || customer.includes('BIRESEL')) return 'real';
    if (resident.includes('DOMESTIC') || resident.includes('YERLI')) return 'domestic';
    return 'unknown';
  }
}
