export interface OHLCIntegrityConfig {
  maxHighLowRangeRatio: number;
  requireHighGteOpen: boolean;
  requireHighGteClose: boolean;
  requireLowLteOpen: boolean;
  requireLowLteClose: boolean;
}

export interface TimestampConfig {
  requireAscending: boolean;
  expectedIntervalMs: number;
  allowGaps: boolean;
  maxGapMultiplier: number;
}

export interface SplitDetectionConfig {
  enabled: boolean;
  priceChangeThresholdPercent: number;
  estimatedRatios: string[];
}

export interface DividendAdjustmentConfig {
  enabled: boolean;
  gapDownThresholdPercent: number;
  volumeSpikeMultiplier: number;
}

export interface OutlierDetectionConfig {
  enabled: boolean;
  priceStdDevMultiplier: number;
  volumeStdDevMultiplier: number;
  minDataPoints: number;
}

export interface CompletenessConfig {
  minDataPoints: number;
  minCompletenessPercent: number;
}

export interface BacktestValidationConfig {
  ohlcIntegrity: OHLCIntegrityConfig;
  timestamps: TimestampConfig;
  splitDetection: SplitDetectionConfig;
  dividendAdjustment: DividendAdjustmentConfig;
  outlierDetection: OutlierDetectionConfig;
  completeness: CompletenessConfig;
}

export const DEFAULT_BACKTEST_VALIDATION_CONFIG: BacktestValidationConfig = {
  ohlcIntegrity: {
    maxHighLowRangeRatio: 50,
    requireHighGteOpen: true,
    requireHighGteClose: true,
    requireLowLteOpen: true,
    requireLowLteClose: true,
  },
  timestamps: {
    requireAscending: true,
    expectedIntervalMs: 86400000,
    allowGaps: true,
    maxGapMultiplier: 3,
  },
  splitDetection: {
    enabled: true,
    priceChangeThresholdPercent: 40,
    estimatedRatios: ['2:1', '3:1', '10:1', '3:2'],
  },
  dividendAdjustment: {
    enabled: true,
    gapDownThresholdPercent: 10,
    volumeSpikeMultiplier: 3,
  },
  outlierDetection: {
    enabled: true,
    priceStdDevMultiplier: 3,
    volumeStdDevMultiplier: 3,
    minDataPoints: 20,
  },
  completeness: {
    minDataPoints: 30,
    minCompletenessPercent: 90,
  },
};
