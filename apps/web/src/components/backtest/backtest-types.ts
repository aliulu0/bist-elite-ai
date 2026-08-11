export interface EntryRule {
  signal: string;
  threshold: number;
  lookback: number;
}

export interface ExitRule {
  signal: string;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopPercent: number;
  maxHoldingDays: number;
  lookback: number;
  threshold: number;
}

export interface BacktestConfig {
  entryRules: EntryRule[];
  exitRules: ExitRule[];
  initialCapital: number;
  positionSizePercent: number;
  riskFreeRate: number;
  tradingDaysPerYear: number;
  minTradesRequired: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageReturn: number;
  medianReturn: number;
  bestTrade: number;
  worstTrade: number;
  cagr: number;
  profitFactor: number;
  totalReturn: number;
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

export interface BacktestTrade {
  entryIndex: number;
  entryTimestamp: string;
  entryPrice: number;
  exitIndex: number;
  exitTimestamp: string;
  exitPrice: number;
  holdingDays: number;
  returnPercent: number;
  returnAbsolute: number;
  exitReason: string;
}

export interface RuleContribution {
  entryRule: string;
  exitRule: string;
  trades: number;
  winRate: number;
  avgReturn: number;
}

export interface BacktestResult {
  performance: PerformanceMetrics;
  risk: RiskMetrics;
  equityCurve: number[];
  trades: BacktestTrade[];
  ruleContribution: RuleContribution;
  metadata: Record<string, unknown>;
  isValid: boolean;
}

export interface BenchmarkResult {
  strategyReturn: number;
  benchmarkReturn: number;
  sectorReturn: number;
  alpha: number;
  beta: number;
  trackingError: number;
  informationRatio: number;
  captureRatio: number;
  excessReturn: number;
  metadata: Record<string, unknown>;
  isValid: boolean;
}

export interface RuleStat {
  rule: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  medianReturn: number;
  totalReturn: number;
  bestTrade: number;
  worstTrade: number;
  sharpe: number;
}

export interface PairStat {
  ruleA: string;
  ruleB: string;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface RuleAnalyticsResult {
  ruleStatistics: RuleStat[];
  pairStatistics: PairStat[];
  tripleStatistics: Array<{ ruleA: string; ruleB: string; ruleC: string; totalTrades: number; winRate: number; avgReturn: number; totalReturn: number }>;
  timeframeStatistics: Array<{ timeframe: string; totalTrades: number; winRate: number; avgReturn: number; totalReturn: number }>;
  sectorStatistics: Array<{ sector: string; totalTrades: number; winRate: number; avgReturn: number; totalReturn: number }>;
  eliteStatistics: Array<{ rating: string; totalTrades: number; winRate: number; avgReturn: number; totalReturn: number }>;
  opportunityStatistics: Array<{ level: string; totalTrades: number; winRate: number; avgReturn: number; totalReturn: number }>;
  metadata: Record<string, unknown>;
}

export interface WeightOptimizationResult {
  recommendedWeights: Record<string, number>;
  expectedImprovement: number;
  confidence: number;
  simulation: { currentScore: number; optimizedScore: number; improvementPercent: number; tradesAnalyzed: number };
  metadata: Record<string, unknown>;
}

export interface WorkflowItem {
  id: string;
  type: string;
  status: string;
  symbol: string;
  steps: Array<{ step: string; status: string; startedAt?: string; completedAt?: string; durationMs?: number; error?: string | null }>;
  currentStep: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  createdAt: string;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  symbol: string;
  timeframe: string;
  candles: HistoricalCandle[];
}

export type BacktestTab = 'ozet' | 'grafik' | 'islemler' | 'kurallar' | 'karsilastirma' | 'optimize';

export const ENTRY_SIGNALS = [
  { value: 'OPEN_ABOVE_EMA', label: 'Açılış EMA Üstünde' },
  { value: 'CLOSE_ABOVE_EMA', label: 'Kapanış EMA Üstünde' },
  { value: 'RSI_OVERSOLD', label: 'RSI Aşırı Satış' },
  { value: 'VOLUME_SPIKE', label: 'Hacim Sıçraması' },
  { value: 'PRICE_ABOVE_SMA', label: 'Fiyat SMA Üstünde' },
  { value: 'MACD_CROSSOVER', label: 'MACD Kesişimi' },
  { value: 'ALWAYS', label: 'Her Zaman' },
];

export const EXIT_SIGNALS = [
  { value: 'STOP_LOSS', label: 'Zarar Durdurma' },
  { value: 'TAKE_PROFIT', label: 'Kâr Hedefleme' },
  { value: 'TRAILING_STOP', label: 'Takip Eden Durdurma' },
  { value: 'TIME_BASED', label: 'Zamana Bağlı' },
  { value: 'RSI_OVERBOUGHT', label: 'RSI Aşırı Alım' },
  { value: 'CLOSE_BELOW_EMA', label: 'Kapanış EMA Altında' },
  { value: 'HOLD_UNTIL_END', label: 'Sonuna Kadar Tut' },
];

export const DEFAULT_ENTRY_RULES: EntryRule[] = [
  { signal: 'ALWAYS', threshold: 0, lookback: 0 },
];

export const DEFAULT_EXIT_RULES: ExitRule[] = [
  { signal: 'HOLD_UNTIL_END', stopLossPercent: 5, takeProfitPercent: 15, trailingStopPercent: 10, maxHoldingDays: 365, lookback: 20, threshold: 70 },
];

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  entryRules: DEFAULT_ENTRY_RULES,
  exitRules: DEFAULT_EXIT_RULES,
  initialCapital: 100000,
  positionSizePercent: 100,
  riskFreeRate: 0.15,
  tradingDaysPerYear: 252,
  minTradesRequired: 5,
};
