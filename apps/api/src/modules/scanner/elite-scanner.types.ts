import { BistAssetType } from '../market-data/symbol-registry/symbol-registry.types';
import {
  HistoricalPricePoint,
  FinancialSnapshot,
  IndicatorSnapshot,
  VerificationSnapshot,
  CatalystSnapshot,
} from '../scoring/scoring-types';
import { DecisionResult } from '../decision/decision.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EntryZoneResult } from '../entry/entry-zone.types';
import { AnalystResult } from '../analyst/analyst.types';

export const ELITE_SCANNER_VERSION = '1.1.0';

export interface ScannerInstrument {
  ticker: string;
  yahooTicker: string;
  company: string;
  sector: string | null;
  market: string;
  assetType: BistAssetType;
  currency: string;
  isin: string | null;
}

export interface ScannerMarketData {
  price: number | null;
  volume: number | null;
  marketCap: number | null;
  provider: string;
  lastUpdate: string | null;
}

export interface StrategyEvaluation {
  score: number;
  passed: string[];
  failedReasons: string[];
  signals: string[];
  reasons: string[];
  confidence: number;
}

export interface EliteScannerContext {
  instrument: ScannerInstrument;
  marketData: ScannerMarketData;
  historicalPrices?: HistoricalPricePoint[];
  financials?: FinancialSnapshot;
  indicators?: IndicatorSnapshot;
  verificationData?: VerificationSnapshot;
  catalystData?: CatalystSnapshot;
}

export interface EliteScannerResult {
  ticker: string;
  company: string;
  sector: string | null;
  price: number | null;
  volume: number | null;
  marketCap: number | null;
  strategyId: string;
  strategyName: string;
  strategyScore: number | null;
  strategyConfidence: number | null;
  passedRules: string[];
  failedRules: string[];
  signals: string[];
  technicalScore: number | null;
  fundamentalScore: number | null;
  momentumScore: number | null;
  trendScore: number | null;
  liquidityScore: number | null;
  riskScore: number | null;
  volumeScore: number | null;
  qualityScore: number | null;
  verificationScore: number | null;
  catalystScore: number | null;
  aiScore: number | null;
  aiConfidence: number | null;
  decision?: DecisionResult | null;
  opportunity?: OpportunityResult | null;
  entryZone?: EntryZoneResult | null;
  analyst?: AnalystResult | null;
  provider: string;
  lastUpdate: string | null;
  reasons: string[];
  scannedAt: string;
}

export interface EliteScannerStrategy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  evaluate(context: EliteScannerContext): StrategyEvaluation;
}

export interface ScannerFilterOptions {
  sector: string | null;
  assetType: BistAssetType | null;
  limit: number;
  activeOnly: boolean;
}

export interface EliteScannerConfig {
  concurrency: number;
  timeoutMs: number;
  maxResults: number;
  cacheLatestTtlMs: number;
  filters: ScannerFilterOptions;
}

export interface ScanSummary {
  strategyId: string;
  strategyName: string;
  scannedCount: number;
  resultCount: number;
  errorCount: number;
  durationMs: number;
  completedAt: string;
}

export interface EliteScanResponse {
  results: EliteScannerResult[];
  summary: ScanSummary;
}

export interface StrategyInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}
