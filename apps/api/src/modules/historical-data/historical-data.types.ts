import { OHLCV, Timeframe } from '../indicators/indicator.types';

export type CorporateActionType = 'dividend' | 'split' | 'rights_issue' | 'bonus' | 'spin_off';

export interface CorporateAction {
  type: CorporateActionType;
  date: string;
  value: number;
  ratio?: string;
  description: string;
}

export interface FundamentalData {
  priceToBook: number | null;
  evToEBITDA: number | null;
  netProfit: number | null;
  equity: number | null;
  totalDebt: number | null;
  totalAssets: number | null;
  sharesOutstanding: number | null;
  marketCap: number | null;
  sector: string | null;
  companyName: string | null;
}

export interface ProviderMetadata {
  name: string;
  currency: string;
  exchange: string;
  timezone: string;
  lastUpdated: string;
  reliability: number;
}

export interface PipelineMetadata {
  totalBars: number;
  dateRange: { start: string; end: string };
  normalizedFields: string[];
  warnings: string[];
  processedAt: string;
  sourceProviders: string[];
}

export interface HistoricalDataset {
  symbol: string;
  timeframe: Timeframe;
  bars: OHLCV[];
  corporateActions: CorporateAction[];
  fundamentals: FundamentalData;
  provider: ProviderMetadata;
  metadata: PipelineMetadata;
}
