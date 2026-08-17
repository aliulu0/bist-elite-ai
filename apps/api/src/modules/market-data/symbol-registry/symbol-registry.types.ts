export const BIST_EXCHANGE = 'BIST';

export type BistProviderName = 'yahoo' | 'fintables' | 'kap' | 'tcmb' | 'mkk';

export interface SymbolProviderMapping {
  yahoo?: string;
  fintables?: string;
  kap?: string;
  tcmb?: string;
  mkk?: string;
}

export interface BistSymbolEntry {
  canonicalTicker: string;
  companyName: string;
  sector: string;
  exchange: string;
  isin: string | null;
  active: boolean;
  delistedAt?: string | null;
  providers: SymbolProviderMapping;
}

export type BistAssetType =
  | 'Equity'
  | 'Bank'
  | 'Insurance'
  | 'Holding'
  | 'REIT'
  | 'Investment Trust'
  | 'Fund'
  | 'Institutional'
  | 'Unknown';

export interface BistMasterRegistryEntry {
  ticker: string;
  yahooTicker: string;
  isin: string | null;
  companyName: string | null;
  turkishName: string | null;
  sector: string | null;
  industry: string | null;
  market: string;
  exchange: string;
  currency: string;
  status: 'active' | 'inactive';
  assetType: BistAssetType;
  dataSources: string[];
}
