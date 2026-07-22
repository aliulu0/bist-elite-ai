import { PerformanceMetricsService } from './performance-metrics.service';
import { TradeRecord, SignalAction, Timeframe, MarketCondition } from './types';

describe('PerformanceMetricsService', () => {
  let service: PerformanceMetricsService;

  beforeEach(() => {
    service = new PerformanceMetricsService();
  });

  describe('calculate', () => {
    it('should return empty metrics for empty trades', () => {
      const result = service.calculate([]);
      expect(result.totalReturn).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.sharpeRatio).toBe(0);
    });

    it('should calculate basic metrics for winning trades', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: { RSI: 65 },
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-10',
          exitDate: '2025-01-15',
          entryPrice: 100,
          exitPrice: 120,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 200,
          pnlPercent: 20,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: { RSI: 70 },
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(trades);

      expect(result.totalReturn).toBe(300);
      expect(result.totalReturnPercent).toBe(30);
      expect(result.winRate).toBe(100);
      expect(result.lossRate).toBe(0);
      expect(result.profitFactor).toBe(Infinity);
    });

    it('should calculate metrics for mixed trades', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: { RSI: 65 },
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-10',
          exitDate: '2025-01-15',
          entryPrice: 100,
          exitPrice: 90,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -100,
          pnlPercent: -10,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: { RSI: 35 },
          marketCondition: MarketCondition.BEAR_MARKET,
        },
        {
          entryDate: '2025-01-20',
          exitDate: '2025-01-25',
          entryPrice: 100,
          exitPrice: 115,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 150,
          pnlPercent: 15,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: { RSI: 60 },
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(trades);

      expect(result.totalReturn).toBe(150);
      expect(result.totalReturnPercent).toBe(15);
      expect(result.winRate).toBeCloseTo(66.67, 1);
      expect(result.lossRate).toBeCloseTo(33.33, 1);
      expect(result.profitFactor).toBeCloseTo(2.5, 1);
    });

    it('should calculate Sharpe ratio correctly', () => {
      const trades: TradeRecord[] = Array.from({ length: 20 }, (_, i) => ({
        entryDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        exitDate: `2025-01-${String(i + 2).padStart(2, '0')}`,
        entryPrice: 100,
        exitPrice: 100 + (i % 2 === 0 ? 5 : -3),
        action: SignalAction.BUY,
        quantity: 10,
        pnl: i % 2 === 0 ? 50 : -30,
        pnlPercent: i % 2 === 0 ? 5 : -3,
        holdingPeriodDays: 1,
        timeframe: Timeframe.D1,
        indicators: { RSI: 50 + (i % 2 === 0 ? 10 : -10) },
        marketCondition: MarketCondition.SIDEWAYS_MARKET,
      }));

      const result = service.calculate(trades);

      expect(result.sharpeRatio).toBeDefined();
      expect(typeof result.sharpeRatio).toBe('number');
    });

    it('should calculate Sortino ratio correctly', () => {
      const trades: TradeRecord[] = Array.from({ length: 15 }, (_, i) => ({
        entryDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        exitDate: `2025-01-${String(i + 2).padStart(2, '0')}`,
        entryPrice: 100,
        exitPrice: 100 + (i % 3 === 0 ? -5 : 3),
        action: SignalAction.BUY,
        quantity: 10,
        pnl: i % 3 === 0 ? -50 : 30,
        pnlPercent: i % 3 === 0 ? -5 : 3,
        holdingPeriodDays: 1,
        timeframe: Timeframe.D1,
        indicators: { RSI: 50 },
        marketCondition: MarketCondition.SIDEWAYS_MARKET,
      }));

      const result = service.calculate(trades);

      expect(result.sortinoRatio).toBeDefined();
      expect(typeof result.sortinoRatio).toBe('number');
    });

    it('should calculate maximum drawdown', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 120,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 200,
          pnlPercent: 20,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-10',
          exitDate: '2025-01-15',
          entryPrice: 100,
          exitPrice: 80,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -200,
          pnlPercent: -20,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BEAR_MARKET,
        },
        {
          entryDate: '2025-01-20',
          exitDate: '2025-01-25',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(trades);

      expect(result.maxDrawdown).toBeGreaterThan(0);
      expect(result.maxDrawdown).toBeLessThanOrEqual(100);
    });

    it('should calculate average holding period', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-10',
          exitDate: '2025-01-15',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(trades);

      expect(result.avgHoldingPeriod).toBe(4.5);
    });

    it('should calculate expectancy correctly', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-10',
          exitDate: '2025-01-15',
          entryPrice: 100,
          exitPrice: 95,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -50,
          pnlPercent: -5,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BEAR_MARKET,
        },
      ];

      const result = service.calculate(trades);

      expect(result.expectancy).toBeDefined();
      expect(typeof result.expectancy).toBe('number');
    });

    it('should calculate Kelly criterion', () => {
      const trades: TradeRecord[] = Array.from({ length: 10 }, (_, i) => ({
        entryDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        exitDate: `2025-01-${String(i + 2).padStart(2, '0')}`,
        entryPrice: 100,
        exitPrice: i % 3 === 0 ? 95 : 108,
        action: SignalAction.BUY,
        quantity: 10,
        pnl: i % 3 === 0 ? -50 : 80,
        pnlPercent: i % 3 === 0 ? -5 : 8,
        holdingPeriodDays: 1,
        timeframe: Timeframe.D1,
        indicators: {},
        marketCondition: MarketCondition.SIDEWAYS_MARKET,
      }));

      const result = service.calculate(trades);

      expect(result.kellyCriterion).toBeGreaterThanOrEqual(0);
      expect(result.kellyCriterion).toBeLessThanOrEqual(100);
    });

    it('should handle single trade', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(trades);

      expect(result.totalReturn).toBe(100);
      expect(result.winRate).toBe(100);
      expect(result.avgHoldingPeriod).toBe(4);
    });
  });
});
