import { Timeframe } from '../indicators/indicator.types';

export interface TimestampNormalizationConfig {
  targetTimezone: string;
  dateFormat: string;
  sortAscending: boolean;
  deduplicate: boolean;
}

export interface OHLCNormalizationConfig {
  roundDecimals: number;
  validateHighLow: boolean;
  ensurePositive: boolean;
  maxPriceChangePercent: number;
}

export interface VolumeNormalizationConfig {
  roundDecimals: number;
  ensureNonNegative: boolean;
  zeroVolumeHandling: 'keep' | 'replace_zero' | 'remove';
  zeroReplacementValue: number;
}

export interface CurrencyNormalizationConfig {
  targetCurrency: string;
  conversionRates: Record<string, number>;
}

export interface DataCompletenessConfig {
  minBars: number;
  maxGapBars: number;
  expectedIntervalMs: number;
  fillGaps: boolean;
}

export interface HistoricalDataPipelineConfig {
  timestamp: TimestampNormalizationConfig;
  ohlc: OHLCNormalizationConfig;
  volume: VolumeNormalizationConfig;
  currency: CurrencyNormalizationConfig;
  completeness: DataCompletenessConfig;
}

export const DEFAULT_PIPELINE_CONFIG: HistoricalDataPipelineConfig = {
  timestamp: {
    targetTimezone: 'Europe/Istanbul',
    dateFormat: 'YYYY-MM-DD',
    sortAscending: true,
    deduplicate: true,
  },
  ohlc: {
    roundDecimals: 4,
    validateHighLow: true,
    ensurePositive: true,
    maxPriceChangePercent: 50,
  },
  volume: {
    roundDecimals: 0,
    ensureNonNegative: true,
    zeroVolumeHandling: 'keep',
    zeroReplacementValue: 0,
  },
  currency: {
    targetCurrency: 'TRY',
    conversionRates: {
      TRY: 1,
      USD: 32.5,
      EUR: 35.2,
      GBP: 41.3,
    },
  },
  completeness: {
    minBars: 30,
    maxGapBars: 5,
    expectedIntervalMs: 86400000,
    fillGaps: false,
  },
};
