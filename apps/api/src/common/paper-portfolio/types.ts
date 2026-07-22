export enum PaperPortfolioType {
  DEFAULT = 'DEFAULT',
  GROWTH = 'GROWTH',
  CONSERVATIVE = 'CONSERVATIVE',
  BALANCED = 'BALANCED',
  CUSTOM = 'CUSTOM',
}

export enum PositionStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum MarketRegime {
  BULL = 'BULL',
  BEAR = 'BEAR',
  SIDEWAYS = 'SIDEWAYS',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
}

export interface PositionState {
  id: string;
  stockSymbol: string;
  stockName: string;
  status: PositionStatus;
  side: 'BUY' | 'SELL';
  quantity: number;
  avgCost: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  entryTime: string;
  exitTime?: string;
  exitPrice?: number;
  holdingPeriodDays: number;
  notes: string[];
  entryEliteScore: number;
  entryConfidence: number;
  entryConsensusScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  timeframeConsensus: string;
  sector?: string;
}

export interface Order {
  id: string;
  stockSymbol: string;
  stockName: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: OrderStatus;
  executionPrice?: number;
  executionTime?: string;
  slippage: number;
  transactionCost: number;
  signalSource: string;
  eliteScore: number;
  consensusScore: number;
  confidenceScore: number;
  notes: string;
  createdAt: string;
}

export interface PortfolioState {
  id: string;
  name: string;
  type: PaperPortfolioType;
  initialCapital: number;
  cashBalance: number;
  positions: Map<string, PositionState>;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
  peakValue: number;
}

export interface DailyReturn {
  date: string;
  returnPercent: number;
  portfolioValue: number;
}

export interface CreatePortfolioInput {
  name: string;
  type: PaperPortfolioType;
  initialCapital: number;
  config?: Partial<PaperPortfolioConfig>;
}

export interface ExecuteSignalInput {
  portfolioId: string;
  stockSymbol: string;
  stockName: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  currentPrice: number;
  eliteScore: number;
  consensusScore: number;
  confidenceScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  timeframeConsensus: string;
  sector?: string;
  notes?: string;
}

export interface ClosePositionInput {
  portfolioId: string;
  stockSymbol: string;
  exitPrice: number;
  exitTime?: string;
  notes?: string;
}

export interface PartialCloseInput {
  portfolioId: string;
  stockSymbol: string;
  quantity: number;
  exitPrice: number;
  exitTime?: string;
  notes?: string;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  type: PaperPortfolioType;
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  openPositionsCount: number;
  closedPositionsCount: number;
  unrealizedPnl: number;
  realizedPnl: number;
  lastUpdated: string;
}

export interface PositionDetail {
  stockSymbol: string;
  stockName: string;
  status: PositionStatus;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  holdingPeriodDays: number;
  entryEliteScore: number;
  entryConfidence: number;
  entryConsensusScore: number;
  strategyUsed: string;
  marketRegime: MarketRegime;
  sector?: string;
}

export interface PerformanceReport {
  portfolioId: string;
  portfolioName: string;
  totalReturn: number;
  realizedReturn: number;
  unrealizedReturn: number;
  dailyReturns: DailyReturn[];
  monthlyReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  currentDrawdown: number;
  portfolioVolatility: number;
  sharpeRatio: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  avgHoldingPeriod: number;
  sectorExposure: Record<string, number>;
  cashAllocation: number;
  concentrationRisk: number;
  generatedAt: string;
  disclaimer: string;
}

export interface RiskAssessment {
  portfolioId: string;
  overallRiskScore: number;
  cashAllocation: number;
  sectorExposure: Record<string, number>;
  maxConcentration: number;
  positionCount: number;
  drawdown: number;
  withinDrawdownLimit: boolean;
  riskFactors: Array<{ type: string; severity: string; description: string }>;
  generatedAt: string;
}

export interface PaperPortfolioConfig {
  enabled: boolean;
  transactionCostPercent: number;
  slippagePercent: number;
  maxPositionSizePercent: number;
  maxPositions: number;
  minPositionSize: number;
  maxSectorExposurePercent: number;
  maxCashAllocationPercent: number;
  minCashAllocationPercent: number;
  defaultCurrency: string;
  enableStopLoss: boolean;
  defaultStopLossPercent: number;
  enableTakeProfit: boolean;
  defaultTakeProfitRatio: number;
  maxDrawdownLimit: number;
  enableCaching: boolean;
  cacheTtlMs: number;
}

export const PAPER_PORTFOLIO_DEFAULTS: PaperPortfolioConfig = {
  enabled: true,
  transactionCostPercent: 0.001,
  slippagePercent: 0.0005,
  maxPositionSizePercent: 0.20,
  maxPositions: 20,
  minPositionSize: 1000,
  maxSectorExposurePercent: 0.40,
  maxCashAllocationPercent: 0.95,
  minCashAllocationPercent: 0.05,
  defaultCurrency: 'TRY',
  enableStopLoss: true,
  defaultStopLossPercent: 0.08,
  enableTakeProfit: true,
  defaultTakeProfitRatio: 2.0,
  maxDrawdownLimit: 0.20,
  enableCaching: true,
  cacheTtlMs: 30000,
};

export function getPaperPortfolioConfig(overrides?: Partial<PaperPortfolioConfig>): PaperPortfolioConfig {
  if (!overrides) return { ...PAPER_PORTFOLIO_DEFAULTS };
  return {
    ...PAPER_PORTFOLIO_DEFAULTS,
    ...overrides,
  };
}
