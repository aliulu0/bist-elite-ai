import { Injectable, Logger } from '@nestjs/common';
import {
  IFundamentalProvider,
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
} from '../interfaces';

interface FintablesCompanyResponse {
  data: {
    symbol: string;
    company_name: string;
    sector: string;
    market_cap: number | null;
  } | null;
  error?: string;
}

interface FintablesRatiosResponse {
  data: {
    symbol: string;
    price_to_book: number | null;
    ev_to_ebitda: number | null;
  } | null;
  error?: string;
}

interface FintablesBalanceSheetResponse {
  data: {
    symbol: string;
    equity: number | null;
    total_debt: number | null;
    shares_outstanding: number | null;
  } | null;
  error?: string;
}

interface FintablesIncomeResponse {
  data: {
    symbol: string;
    net_profit: number | null;
  } | null;
  error?: string;
}

interface FintablesSectorResponse {
  data: {
    symbol: string;
    sector: string;
  } | null;
  error?: string;
}

@Injectable()
export class FintablesProvider implements IFundamentalProvider {
  readonly name = 'fintables';
  private readonly logger = new Logger(FintablesProvider.name);
  private readonly baseUrl = 'https://fintables.com/api/v1';

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
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
      const response = await this.fetchJson<FintablesCompanyResponse>(
        `/company/${encodeURIComponent(symbol)}`,
      );

      if (!response?.data) {
        this.logger.warn(`No company profile found for ${symbol}`);
        return null;
      }

      return {
        symbol: response.data.symbol,
        companyName: response.data.company_name,
        sector: response.data.sector,
        marketCap: response.data.market_cap ?? 0,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch company profile for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getFinancialRatios(symbol: string): Promise<FinancialRatios | null> {
    try {
      const response = await this.fetchJson<FintablesRatiosResponse>(
        `/ratios/${encodeURIComponent(symbol)}`,
      );

      if (!response?.data) {
        this.logger.warn(`No financial ratios found for ${symbol}`);
        return null;
      }

      return {
        symbol: response.data.symbol,
        priceToBook: response.data.price_to_book,
        enterpriseValueToEBITDA: response.data.ev_to_ebitda,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch financial ratios for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet | null> {
    try {
      const response = await this.fetchJson<FintablesBalanceSheetResponse>(
        `/balance-sheet/${encodeURIComponent(symbol)}`,
      );

      if (!response?.data) {
        this.logger.warn(`No balance sheet found for ${symbol}`);
        return null;
      }

      return {
        symbol: response.data.symbol,
        equity: response.data.equity,
        totalDebt: response.data.total_debt,
        sharesOutstanding: response.data.shares_outstanding,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch balance sheet for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getIncomeStatement(symbol: string): Promise<IncomeStatement | null> {
    try {
      const response = await this.fetchJson<FintablesIncomeResponse>(
        `/income-statement/${encodeURIComponent(symbol)}`,
      );

      if (!response?.data) {
        this.logger.warn(`No income statement found for ${symbol}`);
        return null;
      }

      return {
        symbol: response.data.symbol,
        netProfit: response.data.net_profit,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch income statement for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getSector(symbol: string): Promise<CompanySector | null> {
    try {
      const response = await this.fetchJson<FintablesSectorResponse>(
        `/sector/${encodeURIComponent(symbol)}`,
      );

      if (!response?.data) {
        this.logger.warn(`No sector data found for ${symbol}`);
        return null;
      }

      return {
        symbol: response.data.symbol,
        sector: response.data.sector,
        lastUpdated: new Date().toISOString(),
        source: this.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch sector for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async fetchJson<T>(path: string): Promise<T | null> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      this.logger.warn(`Fintables returned ${response.status} for ${path}`);
      return null;
    }

    return (await response.json()) as T;
  }
}
