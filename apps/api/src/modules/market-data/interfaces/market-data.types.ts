export type Timeframe = '1H' | '2H' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m';

export type ValidationStatus = 'valid' | 'partial' | 'invalid';

export interface MarketDataPoint {
  symbol: string;
  timeframe: Timeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
  validationStatus: ValidationStatus;
}

export interface FetchOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const SUPPORTED_TIMEFRAMES: readonly Timeframe[] = [
  '4h',
  '1d',
  '1w',
  '1m',
  '3m',
  '6m',
] as const;
