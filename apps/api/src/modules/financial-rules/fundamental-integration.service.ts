import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { MarketDataResult } from '../market-data/interfaces/unified-domain.types';
import { FundamentalProfile } from '../market-data/interfaces/unified-domain.types';
import {
  mapToFinancialData,
  mapToFundamentalData,
  FundamentalProviderInputs,
} from '../analysis-pipeline/fundamental.mapper';
import {
  FundamentalValidationReport,
  FundamentalValidationService,
} from './fundamental-validation.service';
import { FinancialData } from './rule.types';

export interface FundamentalBundle {
  report: FundamentalValidationReport | null;
  marketCap: number | null;
  dataQuality: string | null;
}

@Injectable()
export class FundamentalIntegrationService {
  private readonly logger = new Logger(FundamentalIntegrationService.name);

  constructor(
    private readonly marketData: MarketDataOrchestrator,
    private readonly validation: FundamentalValidationService,
  ) {}

  async getReportAndMarketCap(
    ticker: string,
    sector?: string,
  ): Promise<FundamentalBundle> {
    const normalized = ticker.toUpperCase();
    let result: MarketDataResult<FundamentalProfile> | null;
    try {
      result = await this.marketData.fetchFundamentalData(normalized);
    } catch (err) {
      this.logger.warn(`Fundamental fetch failed for ${normalized}: ${(err as Error).message}`);
      return { report: null, marketCap: null, dataQuality: null };
    }

    if (!result?.data) {
      return { report: null, marketCap: null, dataQuality: null };
    }

    const profile = result.data;
    const inputs = this.toProviderInputs(profile, sector);
    const report = this.validation.fromProviderInputs(normalized, inputs);
    const marketCap = profile.profile?.marketCap || null;
    const dataQuality = result.dataQuality ?? null;

    return { report, marketCap, dataQuality };
  }

  private toProviderInputs(profile: FundamentalProfile, sector?: string): FundamentalProviderInputs {
    const inputs: FundamentalProviderInputs = {
      profile: profile.profile,
      ratios: profile.ratios,
      balance: profile.balance,
      income: profile.income,
      sector: profile.sector,
      netProfitPrevious: profile.netProfitPrevious,
      equityPrevious: profile.equityPrevious,
    };
    if (sector && !inputs.sector) {
      inputs.sector = { symbol: profile.symbol, sector, lastUpdated: new Date().toISOString(), source: 'early-opportunity' } as FundamentalProviderInputs['sector'];
    }
    return inputs;
  }

  /** Convenience for callers that only need the validated FinancialData. */
  async getFinancialData(ticker: string, sector?: string): Promise<FinancialData | null> {
    const normalized = ticker.toUpperCase();
    const result = await this.marketData.fetchFundamentalData(normalized).catch(() => null);
    if (!result?.data) return null;
    const inputs = this.toProviderInputs(result.data, sector);
    return mapToFinancialData(normalized, mapToFundamentalData(inputs));
  }
}
