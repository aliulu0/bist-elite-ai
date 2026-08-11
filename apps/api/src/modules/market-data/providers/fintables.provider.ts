import { Injectable, Logger } from '@nestjs/common';
import {
  IFundamentalProvider,
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
} from '../interfaces';

export enum FintablesErrorType {
  AUTH = 'AUTH',
  RATE_LIMITED = 'RATE_LIMITED',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  UNSUPPORTED = 'UNSUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export class FintablesError extends Error {
  constructor(
    public readonly type: FintablesErrorType,
    message: string,
    public readonly statusCode?: number,
    public readonly symbol?: string,
  ) {
    super(message);
    this.name = 'FintablesError';
  }
}

interface FintablesToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface FintablesCompanyRaw {
  ticker?: string;
  symbol?: string;
  company_name?: string;
  companyName?: string;
  sector?: string;
  market_cap?: number | null;
  marketCap?: number | null;
  report_card?: { profit?: number; growth?: number; debt?: number };
}

interface FintablesRatiosRaw {
  ticker?: string;
  symbol?: string;
  pe?: number | null;
  price_to_earnings?: number | null;
  pb?: number | null;
  price_to_book?: number | null;
  ev_to_ebitda?: number | null;
  evToEbitda?: number | null;
  debt_to_equity?: number | null;
  debtToEquity?: number | null;
  return_on_equity?: number | null;
  returnOnEquity?: number | null;
  dividend_yield?: number | null;
  dividendYield?: number | null;
}

interface FintablesBalanceSheetRaw {
  ticker?: string;
  symbol?: string;
  equity?: number | null;
  total_assets?: number | null;
  totalAssets?: number | null;
  total_debt?: number | null;
  totalDebt?: number | null;
  shares_outstanding?: number | null;
  sharesOutstanding?: number | null;
  current_assets?: number | null;
  currentAssets?: number | null;
  current_liabilities?: number | null;
  currentLiabilities?: number | null;
}

interface FintablesIncomeRaw {
  ticker?: string;
  symbol?: string;
  net_profit?: number | null;
  netProfit?: number | null;
  sales?: number | null;
  revenue?: number | null;
  ebitda?: number | null;
  gross_profit?: number | null;
  grossProfit?: number | null;
}

interface FintablesSectorRaw {
  ticker?: string;
  symbol?: string;
  sector?: string;
  sub_sector?: string;
  subSector?: string;
}

interface FintablesFundamentalsResponse {
  ticker?: string;
  period?: string;
  net_profit_try?: number;
  net_profit?: number;
  sales_try?: number;
  sales?: number;
  equity_try?: number;
  equity?: number;
  total_assets?: number;
  total_debt?: number;
  pe?: number;
  pb?: number;
  ev_to_ebitda?: number;
  debt_to_equity?: number;
  shares_outstanding?: number;
  report_card?: { profit?: number; growth?: number; debt?: number };
}

interface FintablesAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface FintablesApiError {
  data?: unknown;
  error?: string;
  message?: string;
  code?: string;
}

interface FintablesRateLimitState {
  tokens: number;
  lastRefill: number;
}

@Injectable()
export class FintablesProvider implements IFundamentalProvider {
  readonly name = 'fintables';
  private readonly logger = new Logger(FintablesProvider.name);

  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly apiKey?: string;
  private readonly authUrl?: string;
  private readonly username?: string;
  private readonly password?: string;
  private readonly maxRetries: number;
  private readonly rateLimitRps: number;
  private readonly period?: string;

  private token: FintablesToken | null = null;
  private rateLimitState: FintablesRateLimitState = { tokens: 0, lastRefill: 0 };
  private requestCount = 0;
  private errorCount = 0;
  private lastResetTime = Date.now();

  constructor() {
    this.baseUrl = (process.env.FINTABLES_BASE_URL || 'https://fintables.com/api/v1').replace(
      /\/+$/,
      '',
    );
    this.timeoutMs = parseInt(process.env.FINTABLES_TIMEOUT_MS || '15000', 10);
    this.apiKey = process.env.FINTABLES_API_KEY || undefined;
    this.authUrl = process.env.FINTABLES_AUTH_URL || undefined;
    this.username = process.env.FINTABLES_USERNAME || undefined;
    this.password = process.env.FINTABLES_PASSWORD || undefined;
    this.maxRetries = parseInt(process.env.FINTABLES_RETRY_ATTEMPTS || '3', 10);
    this.rateLimitRps = parseInt(process.env.FINTABLES_RATE_LIMIT_RPS || '5', 10);
    this.period = process.env.FINTABLES_PERIOD || undefined;

    this.rateLimitState = {
      tokens: this.rateLimitRps,
      lastRefill: Date.now(),
    };
  }

  get stats() {
    const uptimeMs = Date.now() - this.lastResetTime;
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate:
        this.requestCount > 0
          ? parseFloat(((this.errorCount / this.requestCount) * 100).toFixed(2))
          : 0,
      uptimeMs,
      hasToken: !!this.token,
      tokenExpired: this.token ? Date.now() > this.token.expiresAt : true,
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      if (this.authUrl && this.username && this.password && !this.isTokenValid()) {
        await this.authenticate();
      }

      const url = `${this.baseUrl}/health`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      this.logger.warn(
        `Fintables connection check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    try {
      const fundamentals = await this.fetchWithRetry<FintablesFundamentalsResponse>(
        `/fundamentals/${encodeURIComponent(symbol)}`,
        symbol,
      );

      if (!fundamentals) {
        return null;
      }

      return {
        symbol: fundamentals.ticker || symbol,
        companyName: (fundamentals as Record<string, unknown>).company_name as string || symbol,
        sector: (fundamentals as Record<string, unknown>).sector as string || 'Unknown',
        marketCap:
          (fundamentals as Record<string, unknown>).market_cap as number ||
          (fundamentals as Record<string, unknown>).marketCap as number ||
          0,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      return this.handleError(error, symbol, 'getCompanyProfile');
    }
  }

  async getFinancialRatios(symbol: string): Promise<FinancialRatios | null> {
    try {
      const fundamentals = await this.fetchWithRetry<FintablesFundamentalsResponse>(
        `/fundamentals/${encodeURIComponent(symbol)}`,
        symbol,
      );

      if (!fundamentals) {
        return null;
      }

      return {
        symbol: fundamentals.ticker || symbol,
        priceToBook: fundamentals.pb ?? null,
        enterpriseValueToEBITDA: fundamentals.ev_to_ebitda ?? null,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      return this.handleError(error, symbol, 'getFinancialRatios');
    }
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet | null> {
    try {
      const fundamentals = await this.fetchWithRetry<FintablesFundamentalsResponse>(
        `/fundamentals/${encodeURIComponent(symbol)}`,
        symbol,
      );

      if (!fundamentals) {
        return null;
      }

      return {
        symbol: fundamentals.ticker || symbol,
        equity: fundamentals.equity_try ?? fundamentals.equity ?? null,
        totalDebt: fundamentals.total_debt ?? null,
        totalAssets: fundamentals.total_assets ?? null,
        sharesOutstanding: fundamentals.shares_outstanding ?? null,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      return this.handleError(error, symbol, 'getBalanceSheet');
    }
  }

  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    try {
      const fundamentals = await this.fetchWithRetry<FintablesFundamentalsResponse>(
        `/fundamentals/${encodeURIComponent(symbol)}`,
        symbol,
      );

      if (!fundamentals) {
        return null;
      }

      return {
        symbol: fundamentals.ticker || symbol,
        netProfit: fundamentals.net_profit_try ?? fundamentals.net_profit ?? null,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      return this.handleError(error, symbol, 'getIncomeStatement');
    }
  }

  async getSector(symbol: string): Promise<CompanySector | null> {
    try {
      const fundamentals = await this.fetchWithRetry<FintablesFundamentalsResponse>(
        `/fundamentals/${encodeURIComponent(symbol)}`,
        symbol,
      );

      if (!fundamentals) {
        return null;
      }

      return {
        symbol: fundamentals.ticker || symbol,
        sector: (fundamentals as Record<string, unknown>).sector as string || 'Unknown',
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      return this.handleError(error, symbol, 'getSector');
    }
  }

  private handleError(error: unknown, symbol: string, method: string): null {
    this.errorCount++;

    if (error instanceof FintablesError) {
      switch (error.type) {
        case FintablesErrorType.NOT_FOUND:
          this.logger.warn(`[${method}] Symbol not found: ${symbol}`);
          break;
        case FintablesErrorType.AUTH:
          this.logger.error(`[${method}] Authentication failed for ${symbol}`);
          this.token = null;
          break;
        case FintablesErrorType.RATE_LIMITED:
          this.logger.warn(`[${method}] Rate limited for ${symbol}`);
          break;
        case FintablesErrorType.TIMEOUT:
          this.logger.warn(`[${method}] Request timed out for ${symbol}`);
          break;
        case FintablesErrorType.NETWORK:
          this.logger.error(`[${method}] Network error for ${symbol}: ${error.message}`);
          break;
        case FintablesErrorType.UNSUPPORTED:
          this.logger.warn(`[${method}] Unsupported endpoint for ${symbol}: ${error.message}`);
          break;
        default:
          this.logger.error(`[${method}] Unknown error for ${symbol}: ${error.message}`);
      }
    } else {
      this.logger.error(
        `[${method}] Unexpected error for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return null;
  }

  private isTokenValid(): boolean {
    if (!this.token) return false;
    return Date.now() < this.token.expiresAt - 60000;
  }

  async authenticate(): Promise<void> {
    if (!this.authUrl || !this.username || !this.password) {
      throw new FintablesError(
        FintablesErrorType.AUTH,
        'Authentication credentials not configured (FINTABLES_AUTH_URL, FINTABLES_USERNAME, FINTABLES_PASSWORD)',
      );
    }

    const url = `${this.authUrl}/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new FintablesError(
        FintablesErrorType.AUTH,
        `Authentication failed with status ${response.status}`,
        response.status,
      );
    }

    const body = (await response.json()) as FintablesAuthResponse;
    if (!body.access_token) {
      throw new FintablesError(
        FintablesErrorType.AUTH,
        'Authentication response missing access_token',
      );
    }

    this.token = {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + (body.expires_in || 3600) * 1000,
    };

    this.logger.log('Fintables authentication successful');
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'BIST-Elite-AI/1.0',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    if (this.token?.accessToken) {
      headers['Authorization'] = `Bearer ${this.token.accessToken}`;
    }

    return headers;
  }

  private async acquireToken(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.rateLimitState.lastRefill;
    const refill = Math.floor(elapsed / (1000 / this.rateLimitRps));
    if (refill > 0) {
      this.rateLimitState.tokens = Math.min(
        this.rateLimitRps,
        this.rateLimitState.tokens + refill,
      );
      this.rateLimitState.lastRefill = now;
    }

    if (this.rateLimitState.tokens <= 0) {
      const waitMs = Math.ceil(1000 / this.rateLimitRps) - (now - this.rateLimitState.lastRefill);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      this.rateLimitState.tokens = 1;
      this.rateLimitState.lastRefill = Date.now();
    }

    this.rateLimitState.tokens--;
  }

  private async fetchWithRetry<T>(path: string, symbol?: string): Promise<T | null> {
    let lastError: FintablesError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.acquireToken();

        const params = this.period ? `?period=${encodeURIComponent(this.period)}` : '';
        const url = `${this.baseUrl}${path}${params}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        this.requestCount++;

        if (response.status === 401) {
          if (this.token && this.token.refreshToken) {
            try {
              await this.authenticate();
              continue;
            } catch {
              throw new FintablesError(
                FintablesErrorType.AUTH,
                'Token refresh failed',
                401,
                symbol,
              );
            }
          }
          throw new FintablesError(
            FintablesErrorType.AUTH,
            'Authentication required (401)',
            401,
            symbol,
          );
        }

        if (response.status === 403) {
          throw new FintablesError(
            FintablesErrorType.AUTH,
            'Access forbidden (403)',
            403,
            symbol,
          );
        }

        if (response.status === 404) {
          throw new FintablesError(
            FintablesErrorType.NOT_FOUND,
            `Resource not found for ${symbol || 'unknown'}`,
            404,
            symbol,
          );
        }

        if (response.status === 429) {
          lastError = new FintablesError(
            FintablesErrorType.RATE_LIMITED,
            'Rate limited (429)',
            429,
            symbol,
          );
          if (attempt < this.maxRetries) {
            const retryAfter = response.headers.get('Retry-After');
            const delayMs = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : Math.min(1000 * Math.pow(2, attempt), 10000);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
          throw lastError;
        }

        if (response.status === 503) {
          lastError = new FintablesError(
            FintablesErrorType.NETWORK,
            'Service unavailable (503)',
            503,
            symbol,
          );
          if (attempt < this.maxRetries) {
            const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
          throw lastError;
        }

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as FintablesApiError;
          throw new FintablesError(
            FintablesErrorType.UNKNOWN,
            body.error || body.message || `HTTP ${response.status}`,
            response.status,
            symbol,
          );
        }

        const body = (await response.json()) as T & FintablesApiError;

        if (body && typeof body === 'object' && 'error' in body && body.error) {
          throw new FintablesError(
            FintablesErrorType.UNKNOWN,
            String(body.error),
            response.status,
            symbol,
          );
        }

        return body as T;
      } catch (error) {
        if (error instanceof FintablesError) {
          if (
            error.type === FintablesErrorType.AUTH ||
            error.type === FintablesErrorType.NOT_FOUND ||
            error.type === FintablesErrorType.UNSUPPORTED
          ) {
            throw error;
          }
          lastError = error;
        } else if (
          error instanceof DOMException &&
          error.name === 'TimeoutError'
        ) {
          lastError = new FintablesError(
            FintablesErrorType.TIMEOUT,
            `Request to ${path} timed out after ${this.timeoutMs}ms`,
            undefined,
            symbol,
          );
        } else if (
          error instanceof TypeError &&
          (error.message.includes('fetch') || error.message.includes('network'))
        ) {
          lastError = new FintablesError(
            FintablesErrorType.NETWORK,
            `Network error: ${error.message}`,
            undefined,
            symbol,
          );
        } else {
          lastError = new FintablesError(
            FintablesErrorType.UNKNOWN,
            error instanceof Error ? error.message : String(error),
            undefined,
            symbol,
          );
        }

        if (attempt < this.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          const jitter = delayMs * (0.5 + Math.random() * 0.5);
          await new Promise((resolve) => setTimeout(resolve, jitter));
        }
      }
    }

    throw lastError || new FintablesError(FintablesErrorType.UNKNOWN, 'All retry attempts exhausted');
  }
}
