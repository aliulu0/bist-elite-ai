import { OHLCV } from '../indicators/indicator.types';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { LatestPriceState } from '../market-data/incremental/latest-price.types';
import { FundamentalBundle } from '../financial-rules/fundamental-integration.service';
import { AIConsensus } from '../ai-research/ai-research.types';
import { EarlyOpportunityIntelligenceResult } from './early-opportunity.types';
import { FinancialDataQualityReport } from '../financial-rules/financial-data-quality.types';

export interface EarlyOpportunityAnalysisContext {
  symbol: string;
  sector: string;
  timeframe: string;
  
  // Market data (shared)
  ohlcv: OHLCV[];
  indicators: IndicatorResult[];
  latestPrice: LatestPriceState;
  marketStructure: { trend: string; supportZones: unknown[]; resistanceZones: unknown[] };
  
  // Engine results (shared)
  prediction: {
    result: any;
    indicators: IndicatorResult[];
    structure: { trend: string; supportZones: unknown[]; resistanceZones: unknown[] };
    smartMoney: any;
    catalyst: any;
    verification: any;
    backtest: any;
    entryZone: any;
  } | null;
  
  smartMoney: any | null;
  catalyst: any | null;
  verification: any | null;
  multiTimeframe: any | null;
  fundamentals: FundamentalBundle | null;
  marketCap: number | null;
  consensus: AIConsensus | null;
  
  // Quality & metadata
  dataQuality: FinancialDataQualityReport | null;
  priceProvider: string | undefined;
  priceTimestamp: string | undefined;
  priceFallbackUsed: boolean | undefined;
  providers: string[];
  
  // Flags
  isWarmCache: boolean;
  dataFreshness: 'fresh' | 'stale' | 'unknown';
}

export interface EarlyOpportunityPipelineOptions {
  /** If true, skip cache and force fresh data */
  forceRefresh?: boolean;
  /** If true, include signals in the result */
  includeSignals?: boolean;
  /** If true, include multi-timeframe analysis */
  includeMultiTimeframe?: boolean;
  /** If true, include data quality assessment */
  includeDataQuality?: boolean;
  /** Custom timeframe for analysis (default: '1d') */
  timeframe?: string;
  /** Pre-fetched data to reuse (for internal reuse) */
  preFetched?: Partial<EarlyOpportunityAnalysisContext>;
}

export interface EarlyOpportunityPipelineResult {
  result: EarlyOpportunityIntelligenceResult | null;
  context: EarlyOpportunityAnalysisContext;
}