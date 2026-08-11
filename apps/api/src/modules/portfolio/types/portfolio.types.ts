export const PORTFOLIO_VERSION = '1.0.0';

export type PortfolioType = 'MAIN' | 'GROWTH' | 'DIVIDEND' | 'LONG_TERM' | 'TRADING' | 'PAPER' | 'CUSTOM';
export type PortfolioStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type PortfolioName =
  | 'MAIN'
  | 'GROWTH'
  | 'DIVIDEND'
  | 'LONG_TERM'
  | 'TRADING'
  | 'PAPER'
  | 'CUSTOM';

export type TransactionType = 'BUY' | 'SELL' | 'PARTIAL_SELL' | 'SPLIT' | 'DIVIDEND' | 'FEE' | 'DEPOSIT' | 'WITHDRAWAL';

export type BenchmarkId = 'BIST100' | 'BIST30' | 'CUSTOM';

export type ExportFormat = 'CSV' | 'JSON' | 'XLSX';

export type PerformancePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'SINCE_INCEPTION';

export type ReportType = 'PORTFOLIO_SUMMARY' | 'ALLOCATION' | 'PERFORMANCE' | 'RISK' | 'TRANSACTION';

export interface PortfolioConfig {
  defaultCurrency: string;
  calculationPrecision: number;
  benchmark: BenchmarkId;
  customBenchmarkSymbol?: string;
  maxPortfolios: number;
  maxPositionsPerPortfolio: number;
  riskLimits: RiskLimits;
  version: string;
}

export interface RiskLimits {
  maxSectorConcentrationPercent: number;
  maxPositionSizePercent: number;
  minCashRatio: number;
  maxDrawdownPercent: number;
  maxVolatilityPercent: number;
}

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  displayName: string;
  description: string;
  currency: string;
  cash: number;
  status: PortfolioStatus;
  createdAt: string;
  updatedAt: string;
  metadata: PortfolioMetadata;
}

export interface PortfolioMetadata {
  totalInvested: number;
  totalWithdrawn: number;
  totalFees?: number;
  totalDividends?: number;
  totalTrades?: number;
  inceptionDate: string;
  lastActivityDate?: string;
  tags?: string[];
  benchmark?: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: 'LARGE' | 'MID' | 'SMALL' | 'MICRO';
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  weight: number;
  contribution: number;
  highestPrice: number;
  lowestPrice: number;
  risk: number;
  firstBoughtAt: string;
  lastBoughtAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  fee?: number;
  commission?: number;
  notes?: string;
  executedAt: string;
  createdAt?: string;
}

export interface PortfolioSummary {
  portfolioId: string;
  portfolioName: string;
  totalValue: number;
  cash: number;
  investedCapital: number;
  marketValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  totalReturn: number;
  dailyReturn: number;
  positionCount: number;
  cashAllocation: number;
  stockAllocation: number;
  largestPosition: Position | null;
  updatedAt: string;
}

export interface AllocationBreakdown {
  type: 'SECTOR' | 'INDUSTRY' | 'MARKET_CAP' | 'RISK' | 'CASH';
  entries: AllocationEntry[];
  timestamp: string;
}

export interface AllocationEntry {
  name: string;
  value: number;
  percentage: number;
  count: number;
}

export interface PortfolioRiskMetrics {
  portfolioId: string;
  portfolioRisk: number;
  sectorConcentration: number;
  largestPositionPercent: number;
  cashRatio: number;
  diversificationScore: number;
  currentDrawdown: number;
  maxDrawdown: number;
  volatility: number;
  topRiskyPositions: PositionRisk[];
  timestamp: string;
}

export interface PositionRisk {
  symbol: string;
  risk: number;
  weight: number;
  contribution: number;
}

export interface PerformanceReport {
  portfolioId: string;
  period: PerformancePeriod;
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  absoluteReturn: number;
  percentReturn: number;
  benchmarkReturn: number | null;
  alpha: number | null;
  beta: number | null;
  volatility: number;
  sharpeRatio: number | null;
  maxDrawdown: number;
  bestDay: number | null;
  worstDay: number | null;
  winningDays: number;
  losingDays: number;
  timestamp: string;
}

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  timestamp: string;
  totalValue: number;
  cash: number;
  positions?: SnapshotPosition[];
  allocation?: AllocationBreakdown[];
  risk?: PortfolioRiskMetrics;
}

export interface SnapshotPosition {
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  weight: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface BenchmarkData {
  benchmarkId: BenchmarkId;
  name: string;
  currentValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  monthlyChange: number;
  yearlyChange: number;
  sinceInception: number;
  lastUpdated: string;
}

export interface TransactionReport {
  portfolioId: string;
  transactions: Transaction[];
  totalBuys: number;
  totalSells: number;
  totalFees: number;
  totalDeposits: number;
  totalWithdrawals: number;
  startDate: string;
  endDate: string;
}

export interface PortfolioMetrics {
  totalPortfolios: number;
  totalPositions: number;
  averagePortfolioSize: number;
  largestGain: number;
  largestLoss: number;
  averageHoldingTimeDays: number;
  averageAllocationPercent: number;
  totalTrades: number;
  timestamp: string;
}

export interface PortfolioReport {
  summary: PortfolioSummary;
  allocation: AllocationBreakdown[];
  performance: PerformanceReport;
  risk: PortfolioRiskMetrics;
  recentTransactions: Transaction[];
  riskWarnings: string[];
  generatedAt: string;
}

export interface PortfolioObservabilityMetrics {
  totalPortfolios: number;
  totalPositions: number;
  averagePositionSize: number;
  largestGain: number;
  largestLoss: number;
  averageHoldingTime: number;
  averageAllocation: number;
  timestamp: string;
}

export interface PortfolioCreateInput {
  name: string;
  type?: PortfolioType;
  description?: string;
  initialCash?: number;
  tags?: string[];
  benchmark?: string;
}

export interface PortfolioUpdateInput {
  name?: string;
  type?: PortfolioType;
  description?: string;
  cash?: number;
  status?: PortfolioStatus;
  metadata?: Partial<PortfolioMetadata>;
}

export interface TransactionInput {
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  commission?: number;
  executedAt?: string;
  notes?: string;
}

export type BenchmarkType = 'BIST100' | 'BIST30' | 'CUSTOM' | string;

export interface BenchmarkEntry {
  date: string;
  value: number;
}

export interface StoredBenchmark {
  symbol: string;
  name: string;
  type: BenchmarkType;
  data: BenchmarkEntry[];
}
