export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceData {
  id: string;
  stockId: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface MarketOverview {
  index: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface EliteScore {
  stockId: string;
  symbol: string;
  score: number;
  rating: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  factors: Record<string, number>;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  bollingerUpper: number;
  bollingerLower: number;
}

export interface FundamentalData {
  pe: number;
  pb: number;
  dividendYield: number;
  revenue: number;
  profit: number;
  debtToEquity: number;
  currentRatio: number;
  roe: number;
  roa: number;
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalProfit: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  stockId: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
}

export interface BacktestResult {
  id: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  date: string;
  symbol: string | null;
  category: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  notificationsEnabled: boolean;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export * from "./early-opportunity";
