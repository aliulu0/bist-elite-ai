import { EntryRule, ExitRule, BacktestStrategy, BacktestType, TimeRange, Timeframe } from './backtest.types';

export interface BacktestConfig {
  entryRules: EntryRule[];
  exitRules: ExitRule[];
  initialCapital: number;
  positionSizePercent: number;
  riskFreeRate: number;
  tradingDaysPerYear: number;
  minTradesRequired: number;
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
  exitRules: [
    {
      signal: 'HOLD_UNTIL_END',
      stopLossPercent: 5,
      takeProfitPercent: 15,
      trailingStopPercent: 10,
      maxHoldingDays: 365,
      lookback: 20,
      threshold: 70,
    },
  ],
  initialCapital: 100000,
  positionSizePercent: 100,
  riskFreeRate: 0.15,
  tradingDaysPerYear: 252,
  minTradesRequired: 5,
};

export const BACKTEST_TIME_RANGES: Record<TimeRange, { days: number; label: string }> = {
  '1M': { days: 21, label: '1 Ay' },
  '3M': { days: 63, label: '3 Ay' },
  '6M': { days: 126, label: '6 Ay' },
  '1Y': { days: 252, label: '1 Yıl' },
  '2Y': { days: 504, label: '2 Yıl' },
  '3Y': { days: 756, label: '3 Yıl' },
  '5Y': { days: 1260, label: '5 Yıl' },
  '10Y': { days: 2520, label: '10 Yıl' },
  max: { days: Infinity, label: 'Maksimum' },
};

export const DEFAULT_STRATEGIES: Record<BacktestType, Omit<BacktestConfig, 'entryRules' | 'exitRules'> & { entryRules: EntryRule[]; exitRules: ExitRule[] }> =
  {
    'elite-score': {
      entryRules: [{ signal: 'CLOSE_ABOVE_EMA', threshold: 0, lookback: 20 }],
      exitRules: [
        { signal: 'CLOSE_BELOW_EMA', stopLossPercent: 7, takeProfitPercent: 25, trailingStopPercent: 10, maxHoldingDays: 60, lookback: 20, threshold: 0 },
      ],
      initialCapital: 100000,
      positionSizePercent: 100,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 3,
    },
    'opportunity': {
      entryRules: [{ signal: 'RSI_OVERSOLD', threshold: 40, lookback: 14 }],
      exitRules: [
        { signal: 'RSI_OVERBOUGHT', stopLossPercent: 6, takeProfitPercent: 20, trailingStopPercent: 10, maxHoldingDays: 30, lookback: 14, threshold: 70 },
      ],
      initialCapital: 100000,
      positionSizePercent: 100,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 3,
    },
    'strategy': {
      entryRules: [{ signal: 'PRICE_ABOVE_SMA', threshold: 0, lookback: 20 }],
      exitRules: [
        { signal: 'STOP_LOSS', stopLossPercent: 5, takeProfitPercent: 15, trailingStopPercent: 8, maxHoldingDays: 365, lookback: 20, threshold: 0 },
      ],
      initialCapital: 100000,
      positionSizePercent: 100,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 3,
    },
    'momentum': {
      entryRules: [{ signal: 'MACD_CROSSOVER', threshold: 0, lookback: 0 }],
      exitRules: [
        { signal: 'TRAILING_STOP', stopLossPercent: 8, takeProfitPercent: 20, trailingStopPercent: 6, maxHoldingDays: 60, lookback: 0, threshold: 0 },
      ],
      initialCapital: 100000,
      positionSizePercent: 100,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 3,
    },
    indicator: {
      entryRules: [{ signal: 'CLOSE_ABOVE_EMA', threshold: 0, lookback: 20 }],
      exitRules: [
        { signal: 'RSI_OVERBOUGHT', stopLossPercent: 6, takeProfitPercent: 18, trailingStopPercent: 8, maxHoldingDays: 30, lookback: 14, threshold: 70 },
      ],
      initialCapital: 100000,
      positionSizePercent: 100,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 3,
    },
    'multi-factor': {
      entryRules: [{ signal: 'PRICE_ABOVE_SMA', threshold: 0, lookback: 20 }],
      exitRules: [
        { signal: 'TRAILING_STOP', stopLossPercent: 6, takeProfitPercent: 18, trailingStopPercent: 8, maxHoldingDays: 45, lookback: 0, threshold: 0 },
      ],
      initialCapital: 100000,
      positionSizePercent: 100,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 3,
    },
    portfolio: {
      entryRules: [{ signal: 'CLOSE_ABOVE_EMA', threshold: 0, lookback: 50 }],
      exitRules: [
        { signal: 'CLOSE_BELOW_EMA', stopLossPercent: 8, takeProfitPercent: 20, trailingStopPercent: 10, maxHoldingDays: 90, lookback: 50, threshold: 0 },
      ],
      initialCapital: 500000,
      positionSizePercent: 60,
      riskFreeRate: 0.15,
      tradingDaysPerYear: 252,
      minTradesRequired: 2,
    },
  };

export function buildStrategy(
  type: BacktestType,
  overrides: {
    timeframe: Timeframe;
    timeRange: TimeRange;
    symbol?: string;
    benchmarkTicker?: string | null;
    initialCapital?: number;
  },
): BacktestStrategy {
  const base = DEFAULT_STRATEGIES[type];
  const cfg = { ...base };
  const days = BACKTEST_TIME_RANGES[overrides.timeRange].days;
  return {
    entryRules: cfg.entryRules,
    exitRules: cfg.exitRules,
    initialCapital: overrides.initialCapital ?? cfg.initialCapital,
    positionSizePercent: cfg.positionSizePercent,
    riskFreeRate: cfg.riskFreeRate,
    tradingDaysPerYear: cfg.tradingDaysPerYear,
    minTradesRequired: cfg.minTradesRequired,
    symbol: overrides.symbol,
    timeframe: overrides.timeframe,
    backtestType: type,
    timeRange: overrides.timeRange,
    benchmarkTicker: overrides.benchmarkTicker ?? 'XU030.IS',
    days,
  };
}
