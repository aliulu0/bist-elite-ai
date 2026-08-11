import { Test, TestingModule } from '@nestjs/testing';
import { CoreBacktestEngine } from './backtest.engine';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { IndicatorsModule } from '../indicators/indicators.module';
import { BacktestStrategy } from './backtest.types';
import { OHLCV } from '../indicators/indicator.types';

function ts(i: number): string {
  return new Date(Date.parse('2024-01-01') + i * 86400000).toISOString().slice(0, 10);
}

function makeBar(overrides?: Partial<OHLCV>): OHLCV {
  return {
    timestamp: '2025-01-01',
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000000,
    ...overrides,
  };
}

const HELD_EXIT = {
  signal: 'HOLD_UNTIL_END' as const,
  stopLossPercent: 5,
  takeProfitPercent: 15,
  trailingStopPercent: 10,
  maxHoldingDays: 365,
  lookback: 20,
  threshold: 70,
};

function makeStrategy(overrides: Partial<BacktestStrategy> = {}): BacktestStrategy {
  return {
    entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
    exitRules: [HELD_EXIT],
    initialCapital: 100000,
    positionSizePercent: 100,
    riskFreeRate: 0.15,
    tradingDaysPerYear: 252,
    minTradesRequired: 1,
    symbol: 'THYAO.IS',
    timeframe: '1d',
    backtestType: 'indicator',
    timeRange: '1Y',
    benchmarkTicker: 'XU030.IS',
    days: 252,
    ...overrides,
  };
}

function makeSeries(count: number, startPrice = 100, dailyReturn = 0.005): OHLCV[] {
  return Array.from({ length: count }, (_, i) => {
    const close = startPrice * Math.pow(1 + dailyReturn, i);
    return makeBar({
      timestamp: ts(i),
      open: close * 0.995,
      high: close * 1.01,
      low: close * 0.99,
      close,
      volume: 1000000,
    });
  });
}

function makeDowntrend(count: number, startPrice = 100, dailyReturn = -0.01): OHLCV[] {
  return Array.from({ length: count }, (_, i) => {
    const close = startPrice * Math.pow(1 + dailyReturn, i);
    return makeBar({
      timestamp: ts(i),
      open: close * 1.005,
      high: close * 1.01,
      low: close * 0.99,
      close,
      volume: 1000000,
    });
  });
}

function makeRsiOversoldData(): OHLCV[] {
  const data: OHLCV[] = [];
  let price = 100;
  for (let i = 0; i < 60; i++) {
    const open = price;
    const close = i < 30 ? open - 2 : open + 2;
    data.push(
      makeBar({
        timestamp: ts(i),
        open,
        high: Math.max(open, close) + 1,
        low: Math.min(open, close) - 1,
        close,
        volume: 1000000,
      }),
    );
    price = close;
  }
  return data;
}

function makeMacdCrossoverData(count = 100): OHLCV[] {
  const data: OHLCV[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    let slope: number;
    if (i < 30) {
      slope = 1;
    } else if (i < 70) {
      slope = 0;
    } else {
      slope = 5;
    }
    const open = price;
    const close = open + slope;
    data.push(
      makeBar({
        timestamp: ts(i),
        open,
        high: Math.max(open, close) + 0.5,
        low: Math.min(open, close) - 0.5,
        close,
        volume: 1000000,
      }),
    );
    price = close;
  }
  return data;
}

function makeVData(count = 50): OHLCV[] {
  const data: OHLCV[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = i < 25 ? open + 4 : open - 4;
    data.push(
      makeBar({
        timestamp: ts(i),
        open,
        high: Math.max(open, close) + 1,
        low: Math.min(open, close) - 1,
        close,
        volume: 1000000,
      }),
    );
    price = close;
  }
  return data;
}

describe('CoreBacktestEngine', () => {
  let engine: CoreBacktestEngine;
  let indicatorEngine: IndicatorEngine;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [IndicatorsModule],
      providers: [CoreBacktestEngine],
    }).compile();
    indicatorEngine = moduleRef.get(IndicatorEngine);
    engine = new CoreBacktestEngine(indicatorEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('indicator reuse (no duplicated calculations)', () => {
    it('calls IndicatorEngine.calculateAll exactly once per run', () => {
      const spy = jest.spyOn(indicatorEngine, 'calculateAll');
      const data = makeSeries(60);
      engine.run(data, '1d', makeStrategy());
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty and invalid data', () => {
    it('returns invalid for null data', () => {
      const result = engine.run(null as any, '1d', makeStrategy());
      expect(result.isValid).toBe(false);
      expect(result.performance.totalTrades).toBe(0);
    });

    it('returns invalid for empty array', () => {
      const result = engine.run([], '1d', makeStrategy());
      expect(result.isValid).toBe(false);
    });

    it('returns invalid for single bar', () => {
      const result = engine.run([makeBar()], '1d', makeStrategy({ minTradesRequired: 1 }));
      expect(result.isValid).toBe(false);
    });
  });

  describe('ALWAYS entry + HOLD_UNTIL_END exit', () => {
    it('produces trades for a valid uptrend', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.isValid).toBe(true);
      expect(result.trades.length).toBeGreaterThan(0);
    });
  });

  describe('indicator-backed entry signals (reusing IndicatorEngine series)', () => {
    it('enters on CLOSE_ABOVE_EMA (period 20)', () => {
      const data = makeSeries(60);
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'CLOSE_ABOVE_EMA', threshold: 0, lookback: 20 }],
        }),
      );
      expect(result.metadata.entryRule).toBe('CLOSE_ABOVE_EMA');
      expect(result.trades.length).toBeGreaterThan(0);
    });

    it('enters on PRICE_ABOVE_SMA (period 20)', () => {
      const data = makeSeries(60);
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'PRICE_ABOVE_SMA', threshold: 0, lookback: 20 }],
        }),
      );
      expect(result.metadata.entryRule).toBe('PRICE_ABOVE_SMA');
      expect(result.trades.length).toBeGreaterThan(0);
    });

    it('enters on RSI_OVERSOLD (period 14, threshold 40)', () => {
      const data = makeRsiOversoldData();
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'RSI_OVERSOLD', threshold: 40, lookback: 14 }],
        }),
      );
      expect(result.metadata.entryRule).toBe('RSI_OVERSOLD');
      expect(result.trades.length).toBeGreaterThan(0);
    });

    it('enters on MACD_CROSSOVER', () => {
      const data = makeMacdCrossoverData();
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'MACD_CROSSOVER', threshold: 0, lookback: 0 }],
        }),
      );
      expect(result.metadata.entryRule).toBe('MACD_CROSSOVER');
      expect(result.trades.length).toBeGreaterThan(0);
    });
  });

  describe('Exit signals', () => {
    it('exits on STOP_LOSS in a declining market', () => {
      const data = makeDowntrend(60);
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
          exitRules: [
            {
              signal: 'STOP_LOSS',
              stopLossPercent: 3,
              takeProfitPercent: 100,
              trailingStopPercent: 50,
              maxHoldingDays: 365,
              lookback: 20,
              threshold: 70,
            },
          ],
        }),
      );
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.trades[0].exitReason).toBe('STOP_LOSS');
    });

    it('exits on TAKE_PROFIT in a strong uptrend', () => {
      const data = makeSeries(60, 100, 0.02);
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
          exitRules: [
            {
              signal: 'TAKE_PROFIT',
              stopLossPercent: 50,
              takeProfitPercent: 5,
              trailingStopPercent: 50,
              maxHoldingDays: 365,
              lookback: 20,
              threshold: 70,
            },
          ],
        }),
      );
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.trades[0].exitReason).toBe('TAKE_PROFIT');
    });

    it('exits on TRAILING_STOP after a peak', () => {
      const data = makeVData();
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
          exitRules: [
            {
              signal: 'TRAILING_STOP',
              stopLossPercent: 50,
              takeProfitPercent: 100,
              trailingStopPercent: 3,
              maxHoldingDays: 365,
              lookback: 20,
              threshold: 70,
            },
          ],
        }),
      );
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.trades[0].exitReason).toBe('TRAILING_STOP');
    });

    it('exits on TIME_BASED after max holding days', () => {
      const data = makeSeries(50);
      const result = engine.run(
        data,
        '1d',
        makeStrategy({
          entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
          exitRules: [
            {
              signal: 'TIME_BASED',
              stopLossPercent: 3,
              takeProfitPercent: 100,
              trailingStopPercent: 50,
              maxHoldingDays: 5,
              lookback: 20,
              threshold: 70,
            },
          ],
        }),
      );
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.trades[0].holdingDays).toBeLessThanOrEqual(6);
      expect(result.trades[0].exitReason).toBe('TIME_BASED');
    });
  });

  describe('performance metrics', () => {
    it('calculates win rate and loss rate', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.performance.winRate).toBeGreaterThanOrEqual(0);
      expect(result.performance.winRate).toBeLessThanOrEqual(100);
      expect(result.performance.winRate + result.performance.lossRate).toBeCloseTo(100, 5);
    });

    it('tracks winning and losing trades', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.performance.winningTrades + result.performance.losingTrades).toBe(result.performance.totalTrades);
    });

    it('computes profit factor, expectancy and risk-reward', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.performance.profitFactor).toBeGreaterThanOrEqual(0);
      if (result.performance.losingTrades === 0) {
        expect(result.performance.profitFactor).toBe(Infinity);
      }
      expect(typeof result.performance.expectancy).toBe('number');
      expect(typeof result.performance.riskReward).toBe('number');
    });
  });

  describe('metrics accuracy (deterministic)', () => {
    it('win rate = 100% and avg win == return for a single winning trade', () => {
      const data = makeSeries(30, 100, 0.01);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.performance.totalTrades).toBe(1);
      expect(result.performance.winningTrades).toBe(1);
      expect(result.performance.losingTrades).toBe(0);
      expect(result.performance.winRate).toBe(100);
      expect(result.performance.lossRate).toBe(0);
      expect(result.performance.averageWin).toBeCloseTo(result.trades[0].returnPercent, 5);
      expect(result.performance.expectancy).toBeCloseTo(result.trades[0].returnPercent, 5);
    });

    it('loss rate = 100% for a single losing trade', () => {
      const data = makeDowntrend(30, 100, -0.01);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.performance.totalTrades).toBe(1);
      expect(result.performance.winningTrades).toBe(0);
      expect(result.performance.losingTrades).toBe(1);
      expect(result.performance.lossRate).toBe(100);
      expect(result.performance.winRate).toBe(0);
    });
  });

  describe('risk metrics', () => {
    it('calculates Sharpe, Sortino, volatility, max drawdown and Calmar', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(typeof result.risk.sharpeRatio).toBe('number');
      expect(typeof result.risk.sortinoRatio).toBe('number');
      expect(result.risk.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.risk.maxDrawdown).toBeLessThanOrEqual(100);
      expect(result.risk.volatility).toBeGreaterThanOrEqual(0);
      expect(typeof result.risk.calmarRatio).toBe('number');
    });
  });

  describe('curves and periodic returns', () => {
    it('equity curve starts with initial capital and has one more point than trades', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy({ initialCapital: 250000 }));
      expect(result.equityCurve[0]).toBe(250000);
      expect(result.equityCurve.length).toBe(result.trades.length + 1);
      expect(result.equityCurvePoints[0].value).toBe(250000);
    });

    it('builds a non-empty drawdown curve', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.drawdownCurve.length).toBeGreaterThan(0);
      expect(result.drawdownCurve.every((d) => d.drawdownPercent >= 0)).toBe(true);
    });

    it('produces monthly and yearly returns for multi-month data', () => {
      const data = makeSeries(300);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.monthlyReturns.length).toBeGreaterThan(0);
      expect(result.yearlyReturns.length).toBeGreaterThan(0);
    });
  });

  describe('deterministic AI explanation (no GPT)', () => {
    it('produces a populated, deterministic explanation', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.aiExplanation.summary).toContain('toplam getiri');
      expect(Array.isArray(result.aiExplanation.successFactors)).toBe(true);
      expect(Array.isArray(result.aiExplanation.failureFactors)).toBe(true);
      expect(Array.isArray(result.aiExplanation.improvementSuggestions)).toBe(true);
      const again = engine.run(data, '1d', makeStrategy());
      expect(again.aiExplanation.summary).toBe(result.aiExplanation.summary);
    });
  });

  describe('edge cases', () => {
    it('handles constant price (zero return)', () => {
      const data = Array.from({ length: 40 }, (_, i) =>
        makeBar({
          timestamp: ts(i),
          open: 100,
          high: 100,
          low: 100,
          close: 100,
          volume: 1000000,
        }),
      );
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.isValid).toBe(true);
    });

    it('handles a large dataset', () => {
      const data = makeSeries(500);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.isValid).toBe(true);
    });
  });

  describe('config overrides', () => {
    it('respects custom initial capital', () => {
      const data = makeSeries(60);
      const result = engine.run(data, '1d', makeStrategy({ initialCapital: 50000 }));
      expect(result.equityCurve[0]).toBe(50000);
      expect(result.metadata.initialCapital).toBe(50000);
    });

    it('respects minTradesRequired', () => {
      const data = makeSeries(10);
      const result = engine.run(data, '1d', makeStrategy({ minTradesRequired: 100 }));
      expect(result.isValid).toBe(false);
    });
  });

  describe('metadata', () => {
    it('includes totalBars, dateRange, initialCapital, timeframe and backtestType', () => {
      const data = makeSeries(50);
      const result = engine.run(data, '1d', makeStrategy());
      expect(result.metadata.totalBars).toBe(50);
      expect(result.metadata.dateRange.start).toBe(data[0].timestamp);
      expect(result.metadata.dateRange.end).toBe(data[data.length - 1].timestamp);
      expect(result.metadata.initialCapital).toBe(100000);
      expect(result.metadata.timeframe).toBe('1d');
      expect(result.metadata.backtestType).toBe('indicator');
    });
  });

  afterEach(async () => {
    if (moduleRef) await moduleRef.close();
  });
});
