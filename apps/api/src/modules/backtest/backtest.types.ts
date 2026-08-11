import { OHLCV, Timeframe } from '../indicators/indicator.types';

export { OHLCV, Timeframe };

export type BacktestType =
  | 'elite-score'
  | 'opportunity'
  | 'strategy'
  | 'momentum'
  | 'indicator'
  | 'portfolio'
  | 'multi-factor';

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | '3Y' | '5Y' | '10Y' | 'max';

export type EntrySignal =
  | 'OPEN_ABOVE_EMA'
  | 'CLOSE_ABOVE_EMA'
  | 'RSI_OVERSOLD'
  | 'VOLUME_SPIKE'
  | 'PRICE_ABOVE_SMA'
  | 'MACD_CROSSOVER'
  | 'ALWAYS';

export type ExitSignal =
  | 'STOP_LOSS'
  | 'TAKE_PROFIT'
  | 'TRAILING_STOP'
  | 'TIME_BASED'
  | 'RSI_OVERBOUGHT'
  | 'CLOSE_BELOW_EMA'
  | 'HOLD_UNTIL_END';

export interface EntryRule {
  signal: EntrySignal;
  threshold: number;
  lookback: number;
}

export interface ExitRule {
  signal: ExitSignal;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopPercent: number;
  maxHoldingDays: number;
  lookback: number;
  threshold: number;
}

export interface BacktestStrategy {
  entryRules: EntryRule[];
  exitRules: ExitRule[];
  initialCapital: number;
  positionSizePercent: number;
  riskFreeRate: number;
  tradingDaysPerYear: number;
  minTradesRequired: number;
  symbol?: string;
  timeframe: Timeframe;
  backtestType: BacktestType;
  timeRange: TimeRange;
  benchmarkTicker?: string | null;
  days?: number;
}

export interface Trade {
  entryIndex: number;
  entryTimestamp: string;
  entryPrice: number;
  exitIndex: number;
  exitTimestamp: string;
  exitPrice: number;
  holdingDays: number;
  returnPercent: number;
  returnAbsolute: number;
  exitReason: ExitSignal;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  averageReturn: number;
  medianReturn: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  cagr: number;
  annualReturn: number;
  profitFactor: number;
  totalReturn: number;
  expectancy: number;
  exposure: number;
  recoveryFactor: number;
  riskReward: number;
}

export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  volatility: number;
  downsideDeviation: number;
  calmarRatio: number;
}

export interface EquityPoint {
  timestamp: string;
  value: number;
}

export interface DrawdownPoint {
  timestamp: string;
  value: number;
  peak: number;
  drawdownPercent: number;
}

export interface PeriodReturn {
  period: string;
  return: number;
}

export interface BenchmarkComparison {
  strategyReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  alpha: number;
  beta: number;
  informationRatio: number;
  trackingError: number;
  captureRatio: number;
  isValid: boolean;
}

export interface AiExplanation {
  summary: string;
  successFactors: string[];
  failureFactors: string[];
  weakPeriods: string[];
  strongPeriods: string[];
  riskAnalysis: string[];
  improvementSuggestions: string[];
}

export interface RuleContribution {
  entryRule: string;
  exitRule: string;
  trades: number;
  winRate: number;
  avgReturn: number;
}

export interface BacktestMetadata {
  totalBars: number;
  dateRange: { start: string; end: string };
  initialCapital: number;
  timeframe: Timeframe;
  symbol?: string;
  backtestType: BacktestType;
  timeRange: TimeRange;
  entryRule: string;
  exitRule: string;
  reasons?: string[];
}

export interface BacktestResult {
  performance: PerformanceMetrics;
  risk: RiskMetrics;
  equityCurve: number[];
  equityCurvePoints: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  trades: Trade[];
  monthlyReturns: PeriodReturn[];
  yearlyReturns: PeriodReturn[];
  benchmarkComparison: BenchmarkComparison;
  aiExplanation: AiExplanation;
  ruleContribution: RuleContribution;
  metadata: BacktestMetadata;
  isValid: boolean;
}

export interface BacktestSummary {
  ticker: string;
  timeframe: Timeframe;
  backtestType: BacktestType;
  timeRange: TimeRange;
  totalReturn: number;
  cagr: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}
