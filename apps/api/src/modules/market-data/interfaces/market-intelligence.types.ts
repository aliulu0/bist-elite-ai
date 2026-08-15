export type MarketBreadthStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN';
export type RegimeConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type DataCoverage = 'FULL' | 'PARTIAL' | 'NONE';
export type FeatureStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL';
export type FeatureConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface BISTIndex {
  symbol: string;
  indexName: 'BIST100' | 'BIST30';
  value: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  timestamp: string | null;
  source: string;
  coverage: number; // percentage of constituents with data (0-100)
}

export interface MarketBreadth {
  advancers: number;
  decliners: number;
  unchanged: number;
  totalUniverse: number;
  coverage: DataCoverage;
  status: MarketBreadthStatus;
  timestamp: string;
  source: string;
}

export interface AdvanceDeclineRatio {
  ratio: number | null;
  advancers: number;
  decliners: number;
  zeroDecliners: boolean;
  status: FeatureStatus;
  confidence: FeatureConfidence;
}

export interface RelativeStrength {
  symbol: string;
  vsMarket: number | null; // vs BIST100 or BIST30 return difference
  vsSector: number | null;
  market: string; // 'BIST100' | 'BIST30' | 'SECTOR'
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  status: FeatureStatus;
  confidence: FeatureConfidence;
  calculationTimestamp: string;
}

export interface VolumeIntelligence {
  symbol: string;
  currentVolume: number | null;
  averageVolume: number | null; // N-day average
  relativeVolume: number | null; // current / average
  volumeChangePercent: number | null;
  volumeSpike: boolean | null; // exceeds threshold
  spikeThreshold: number; // e.g., 2.0 = 2x average
  status: FeatureStatus;
  confidence: FeatureConfidence;
}

export interface TurnoverData {
  symbol: string;
  dailyTurnover: number | null; // TRY volume
  previousDayTurnover: number | null;
  turnoverChangePercent: number | null;
  source: string;
  timestamp: string;
  status: FeatureStatus;
}

export interface MarketRegimeData {
  regime: MarketRegime;
  confidence: RegimeConfidence;
  supportingIndicators: {
    breadth: number | null;
    momentum: number | null;
    trend: 'UP' | 'DOWN' | 'SIDEWAYS' | null;
  };
  timestamp: string;
  source: string;
  explanation: string; // deterministic explanation of regime assignment
}

export interface MarketIntelligenceSummary {
  bist100: BISTIndex | null;
  bist30: BISTIndex | null;
  breadth: MarketBreadth | null;
  advanceDecline: AdvanceDeclineRatio | null;
  relativeStrength: Record<string, RelativeStrength | null>;
  volume: Record<string, VolumeIntelligence | null>;
  turnover: TurnoverData | null;
  regime: MarketRegimeData | null;
  dataQuality: {
    freshness: 'REALTIME' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
    coverage: DataCoverage;
    lastRefreshed: string;
    sourcesVerified: string[];
  };
}
