export type TechnicalIndicatorName =
  | 'RSI'
  | 'MACD'
  | 'EMA'
  | 'SMA'
  | 'ADX'
  | 'ATR'
  | 'OBV';

export interface TechnicalIndicatorPoint {
  timestamp: string;
  value: number | null;
}

export interface TechnicalIndicatorSeries {
  symbol: string;
  indicator: TechnicalIndicatorName;
  period: number;
  values: TechnicalIndicatorPoint[];
  source: string;
}

export interface SectorPerformance {
  sector: string;
  changePercent: number | null;
  timestamp: string;
  source: string;
}

export interface ITechnicalIndicatorProvider {
  getTechnicalIndicators(
    symbol: string,
    indicator: TechnicalIndicatorName,
    period?: number,
  ): Promise<TechnicalIndicatorSeries | null>;
  getSectorPerformance(): Promise<SectorPerformance[]>;
}
