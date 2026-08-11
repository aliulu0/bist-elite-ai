export type Timeframe = '4h' | '1d' | '1w' | '1m' | '3m' | '6m';

export interface IndicatorResult {
  indicator: string;
  timeframe: Timeframe;
  timestamp: string;
  value: number | number[] | Record<string, number | boolean> | null;
  metadata: Record<string, unknown>;
  isValid: boolean;
}

export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}
