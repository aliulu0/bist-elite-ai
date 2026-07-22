export type StockSymbol = string;
export type Timestamp = string;
export type Score = number;
export type Percentage = number;

export interface Stock {
  symbol: StockSymbol;
  name: string;
  sector: string;
  marketCap: number;
  isActive: boolean;
}

export interface PriceData {
  symbol: StockSymbol;
  date: Timestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScoreResult {
  symbol: StockSymbol;
  score: Score;
  factors: FactorContribution[];
  timestamp: Timestamp;
}

export interface FactorContribution {
  name: string;
  score: Score;
  weight: number;
  contribution: number;
  direction: 'positive' | 'negative';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: Timestamp;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  uptime: number;
  timestamp: Timestamp;
}
