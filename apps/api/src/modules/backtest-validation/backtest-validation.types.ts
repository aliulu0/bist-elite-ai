export interface TimestampError {
  index: number;
  timestamp: string;
  type: 'out_of_order' | 'duplicate' | 'invalid_format';
  message: string;
}

export interface PriceError {
  index: number;
  timestamp: string;
  type: 'high_below_low' | 'negative_price' | 'zero_price' | 'open_out_of_range' | 'close_out_of_range';
  message: string;
}

export interface VolumeError {
  index: number;
  timestamp: string;
  type: 'negative_volume' | 'zero_volume' | 'volume_outlier';
  message: string;
}

export interface MissingBar {
  expectedTimestamp: string;
  expectedIndex: number;
}

export interface Outlier {
  index: number;
  timestamp: string;
  field: 'open' | 'high' | 'low' | 'close' | 'volume';
  value: number;
  expectedRange: { min: number; max: number };
  deviationPercent: number;
}

export interface SplitEvent {
  index: number;
  timestamp: string;
  priceChangePercent: number;
  estimatedRatio: string;
}

export interface DividendAdjustment {
  index: number;
  timestamp: string;
  priceChangePercent: number;
  volumeSpike: boolean;
}

export interface HistoricalDatasetValidationResult {
  qualityScore: number;
  isValid: boolean;
  missingBars: MissingBar[];
  duplicateBars: TimestampError[];
  splitDetected: SplitEvent[];
  dividendAdjusted: DividendAdjustment[];
  timestampErrors: TimestampError[];
  priceErrors: PriceError[];
  volumeErrors: VolumeError[];
  outliers: Outlier[];
  warnings: string[];
  metadata: Record<string, unknown>;
}
