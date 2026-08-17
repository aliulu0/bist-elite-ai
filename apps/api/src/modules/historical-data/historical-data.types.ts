import { OHLCV, Timeframe } from '../indicators/indicator.types';

export type CorporateActionType = 'dividend' | 'split' | 'rights_issue' | 'bonus' | 'spin_off';

export interface CorporateAction {
  type: CorporateActionType;
  date: string;
  value: number;
  ratio?: string;
  description: string;
}

export type FundamentalDataStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';

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
  /** Provider that supplied these fundamentals (e.g. 'fintables'). */
  provider?: string | null;
  /** Timestamp when the data was retrieved from the provider. */
  retrievedAt?: string | null;
  /** Earliest timestamp at which this data can be used (point-in-time). */
  availableAt?: string | null;
  /** Fiscal period end date the figures refer to. */
  periodEndDate?: string | null;
  /** Company announcement date of these figures. */
  announcementDate?: string | null;
  /** Reporting currency of the figures. */
  currency?: string | null;
  /** Truth status of the underlying data. */
  dataStatus?: FundamentalDataStatus | null;
  /** Confidence 0..1 that the reported fields are real and complete. */
  confidence?: number | null;
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
