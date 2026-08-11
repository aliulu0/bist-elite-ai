import { MarketDataPoint } from '../market-data/interfaces';
import { AIConsensus } from '../ai-research/ai-research.types';
import { FundamentalBundle } from './fundamental-integration.service';

export type DataQualityStatus = 'DATA_VERIFIED' | 'DATA_ACCEPTABLE' | 'DATA_WARNING' | 'DATA_INSUFFICIENT';
export type FreshnessStatus = 'fresh' | 'stale' | 'unknown';
export type ProviderConsistencyStatus = 'consistent' | 'partial' | 'conflicting';

export interface FreshnessReport {
  price: FreshnessStatus;
  fundamental: FreshnessStatus;
  research: FreshnessStatus;
  overall: FreshnessStatus;
}

export interface MarketIntegrityReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FundamentalQualityReport {
  status: string | null;
  score: number;
  dataQuality: string | null;
}

export interface ProviderSummary {
  price?: string;
  fundamental?: string;
  research: string[];
  fallbackUsed: boolean;
  attemptedAt: string[];
}

export interface DataQualityContext {
  price: MarketDataPoint | null;
  priceProvider?: string;
  priceFallbackUsed?: boolean;
  priceTimestamp?: string;
  history: MarketDataPoint[];
  fundamental: FundamentalBundle | null;
  consensus: AIConsensus | null;
  providers: string[];
  now: number;
}

export interface FinancialDataQualityReport {
  ticker: string;
  qualityScore: number;
  status: DataQualityStatus;
  freshness: FreshnessReport;
  freshnessScore: number;
  marketDataScore: number;
  marketIntegrity: MarketIntegrityReport;
  fundamental: FundamentalQualityReport | null;
  fundamentalDataScore: number;
  providers: ProviderSummary;
  providerConsistencyScore: number;
  providerConsistencyStatus: ProviderConsistencyStatus;
  conflicts: string[];
  completenessScore: number;
  missingFields: string[];
  integrityScore: number;
  warnings: string[];
  errors: string[];
  timestamp: string;
}
