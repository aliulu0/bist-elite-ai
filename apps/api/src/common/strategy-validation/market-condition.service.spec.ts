import { MarketConditionAnalyzer } from './market-condition.service';
import { TradeRecord, SignalAction, Timeframe, MarketCondition } from './types';

describe('MarketConditionAnalyzer', () => {
  let service: MarketConditionAnalyzer;

  beforeEach(() => {
    service = new MarketConditionAnalyzer();
  });

  describe('analyze', () => {
    it('should return empty array for empty trades', () => {
      const result = service.analyze([]);
      expect(result).toEqual([]);
    });

    it('should analyze trades by market condition', () => {
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
          exitPrice: 90,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -100,
          pnlPercent: -10,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BEAR_MARKET,
        },
        {
          entryDate: '2025-01-20',
          exitDate: '2025-01-25',
          entryPrice: 100,
          exitPrice: 102,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 20,
          pnlPercent: 2,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.SIDEWAYS_MARKET,
        },
      ];

      const result = service.analyze(trades);

      expect(result.length).toBe(3);
      expect(result.find(r => r.condition === MarketCondition.BULL_MARKET)).toBeDefined();
      expect(result.find(r => r.condition === MarketCondition.BEAR_MARKET)).toBeDefined();
      expect(result.find(r => r.condition === MarketCondition.SIDEWAYS_MARKET)).toBeDefined();
    });

    it('should calculate win rate per condition', () => {
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
          exitPrice: 105,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 50,
          pnlPercent: 5,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-20',
          exitDate: '2025-01-25',
          entryPrice: 100,
          exitPrice: 95,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -50,
          pnlPercent: -5,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.analyze(trades);
      const bullResult = result.find(r => r.condition === MarketCondition.BULL_MARKET);

      expect(bullResult).toBeDefined();
      expect(bullResult!.winRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate profit factor per condition', () => {
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
          exitPrice: 95,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -50,
          pnlPercent: -5,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.analyze(trades);
      const bullResult = result.find(r => r.condition === MarketCondition.BULL_MARKET);

      expect(bullResult).toBeDefined();
      expect(bullResult!.profitFactor).toBe(4);
    });

    it('should calculate confidence based on sample size', () => {
      const trades: TradeRecord[] = Array.from({ length: 35 }, (_, i) => ({
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
        marketCondition: MarketCondition.BULL_MARKET,
      }));

      const result = service.analyze(trades);
      const bullResult = result.find(r => r.condition === MarketCondition.BULL_MARKET);

      expect(bullResult).toBeDefined();
      expect(bullResult!.confidence).toBeGreaterThan(0);
    });
  });

  describe('classifyMarketCondition', () => {
    it('should classify bull market', () => {
      const priceData = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 100 + i * 2,
        volume: 1000000,
        high: 100 + i * 2 + 5,
        low: 100 + i * 2 - 5,
      }));

      const result = service.classifyMarketCondition(priceData);

      expect(result).toContain(MarketCondition.BULL_MARKET);
    });

    it('should classify bear market', () => {
      const priceData = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 200 - i * 2,
        volume: 1000000,
        high: 200 - i * 2 + 5,
        low: 200 - i * 2 - 5,
      }));

      const result = service.classifyMarketCondition(priceData);

      expect(result).toContain(MarketCondition.BEAR_MARKET);
    });

    it('should classify sideways market', () => {
      const priceData = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 100 + (i % 2 === 0 ? 0.5 : -0.5),
        volume: 1000000,
        high: 100 + (i % 2 === 0 ? 0.5 : -0.5) + 1,
        low: 100 + (i % 2 === 0 ? 0.5 : -0.5) - 1,
      }));

      const result = service.classifyMarketCondition(priceData);

      expect(result).toContain(MarketCondition.SIDEWAYS_MARKET);
    });

    it('should classify high volatility', () => {
      const priceData = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 100 + (i % 2 === 0 ? 10 : -10),
        volume: 1000000,
        high: 100 + (i % 2 === 0 ? 15 : -5),
        low: 100 + (i % 2 === 0 ? 5 : -15),
      }));

      const result = service.classifyMarketCondition(priceData);

      expect(result).toContain(MarketCondition.HIGH_VOLATILITY);
    });

    it('should classify high volume', () => {
      const priceData = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 100,
        volume: i >= 25 ? 5000000 : 1000000,
        high: 105,
        low: 95,
      }));

      const result = service.classifyMarketCondition(priceData);

      expect(result).toContain(MarketCondition.HIGH_VOLUME);
    });

    it('should handle insufficient data', () => {
      const priceData = Array.from({ length: 5 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        close: 100,
        volume: 1000000,
        high: 105,
        low: 95,
      }));

      const result = service.classifyMarketCondition(priceData);

      expect(result).toContain(MarketCondition.SIDEWAYS_MARKET);
    });
  });

  describe('getMarketConditionPerformanceSummary', () => {
    it('should return empty summary for empty performances', () => {
      const result = service.getMarketConditionPerformanceSummary([]);

      expect(result.bestCondition).toBeNull();
      expect(result.worstCondition).toBeNull();
      expect(result.avgWinRate).toBe(0);
    });

    it('should identify best and worst conditions', () => {
      const performances = [
        {
          condition: MarketCondition.BULL_MARKET,
          totalTrades: 10,
          winRate: 70,
          avgReturn: 5,
          profitFactor: 2.5,
          sharpeRatio: 1.5,
          maxDrawdown: 10,
          volatility: 15,
          confidence: 0.8,
        },
        {
          condition: MarketCondition.BEAR_MARKET,
          totalTrades: 8,
          winRate: 40,
          avgReturn: -2,
          profitFactor: 0.8,
          sharpeRatio: -0.5,
          maxDrawdown: 25,
          volatility: 25,
          confidence: 0.6,
        },
      ];

      const result = service.getMarketConditionPerformanceSummary(performances);

      expect(result.bestCondition).toBe(MarketCondition.BULL_MARKET);
      expect(result.worstCondition).toBe(MarketCondition.BEAR_MARKET);
      expect(result.avgWinRate).toBe(55);
    });
  });
});
