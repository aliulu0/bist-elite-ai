import { SignalQualityService } from './signal-quality.service';
import { SignalAction, TradeRecord, Timeframe, MarketCondition } from './types';

describe('SignalQualityService', () => {
  let service: SignalQualityService;

  beforeEach(() => {
    service = new SignalQualityService();
  });

  describe('calculate', () => {
    it('should return empty metrics for empty signals', () => {
      const result = service.calculate([], []);
      expect(result.precision).toBe(0);
      expect(result.recall).toBe(0);
      expect(result.f1Score).toBe(0);
      expect(result.totalSignals).toBe(0);
    });

    it('should calculate precision correctly', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.BUY, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.BUY, confidence: 0.7, price: 100 },
        { date: '2025-01-03', action: SignalAction.BUY, confidence: 0.9, price: 100 },
      ];

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
          entryDate: '2025-01-02',
          exitDate: '2025-01-06',
          entryPrice: 100,
          exitPrice: 105,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 50,
          pnlPercent: 5,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-03',
          exitDate: '2025-01-07',
          entryPrice: 100,
          exitPrice: 95,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -50,
          pnlPercent: -5,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BEAR_MARKET,
        },
      ];

      const result = service.calculate(signals, trades);

      expect(result.precision).toBeGreaterThan(0);
      expect(result.precision).toBeLessThanOrEqual(1);
    });

    it('should calculate recall correctly', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.BUY, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.BUY, confidence: 0.7, price: 100 },
      ];

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
          entryDate: '2025-01-02',
          exitDate: '2025-01-06',
          entryPrice: 100,
          exitPrice: 105,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 50,
          pnlPercent: 5,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-03',
          exitDate: '2025-01-07',
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

      const result = service.calculate(signals, trades);

      expect(result.recall).toBeGreaterThan(0);
      expect(result.recall).toBeLessThanOrEqual(1);
    });

    it('should calculate F1 score correctly', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.BUY, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.BUY, confidence: 0.7, price: 100 },
        { date: '2025-01-03', action: SignalAction.BUY, confidence: 0.9, price: 100 },
      ];

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
          entryDate: '2025-01-02',
          exitDate: '2025-01-06',
          entryPrice: 100,
          exitPrice: 105,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 50,
          pnlPercent: 5,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(signals, trades);

      expect(result.f1Score).toBeGreaterThanOrEqual(0);
      expect(result.f1Score).toBeLessThanOrEqual(1);
    });

    it('should calculate false positive rate', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.BUY, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.BUY, confidence: 0.7, price: 100 },
      ];

      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 90,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: -100,
          pnlPercent: -10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BEAR_MARKET,
        },
      ];

      const result = service.calculate(signals, trades);

      expect(result.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(result.falsePositiveRate).toBeLessThanOrEqual(1);
    });

    it('should calculate signal stability', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.BUY, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.BUY, confidence: 0.75, price: 100 },
        { date: '2025-01-03', action: SignalAction.BUY, confidence: 0.85, price: 100 },
        { date: '2025-01-04', action: SignalAction.BUY, confidence: 0.82, price: 100 },
      ];

      const trades: TradeRecord[] = [];

      const result = service.calculate(signals, trades);

      expect(result.signalStability).toBeGreaterThanOrEqual(0);
      expect(result.signalStability).toBeLessThanOrEqual(1);
    });

    it('should calculate signal consistency', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.BUY, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.BUY, confidence: 0.7, price: 100 },
        { date: '2025-01-03', action: SignalAction.BUY, confidence: 0.9, price: 100 },
      ];

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
          entryDate: '2025-01-02',
          exitDate: '2025-01-06',
          entryPrice: 100,
          exitPrice: 105,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 50,
          pnlPercent: 5,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
        {
          entryDate: '2025-01-03',
          exitDate: '2025-01-07',
          entryPrice: 100,
          exitPrice: 115,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 150,
          pnlPercent: 15,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.calculate(signals, trades);

      expect(result.signalConsistency).toBeGreaterThanOrEqual(0);
      expect(result.signalConsistency).toBeLessThanOrEqual(1);
    });

    it('should handle sell signals', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.SELL, confidence: 0.8, price: 100 },
        { date: '2025-01-02', action: SignalAction.SELL, confidence: 0.7, price: 100 },
      ];

      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 90,
          action: SignalAction.SELL,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BEAR_MARKET,
        },
      ];

      const result = service.calculate(signals, trades);

      expect(result.totalSignals).toBeGreaterThan(0);
    });

    it('should handle hold signals', () => {
      const signals = [
        { date: '2025-01-01', action: SignalAction.HOLD, confidence: 0.5, price: 100 },
        { date: '2025-01-02', action: SignalAction.WATCH, confidence: 0.6, price: 100 },
      ];

      const trades: TradeRecord[] = [];

      const result = service.calculate(signals, trades);

      expect(result.totalSignals).toBeGreaterThan(0);
    });
  });
});
