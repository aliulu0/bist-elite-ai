import { MultiTimeframeValidator } from './multi-timeframe-validator.service';
import { Timeframe, TradeRecord, SignalAction, MarketCondition, ValidationStatus } from './types';

describe('MultiTimeframeValidator', () => {
  let service: MultiTimeframeValidator;

  beforeEach(() => {
    service = new MultiTimeframeValidator();
  });

  describe('validate', () => {
    it('should return empty results for empty trades', () => {
      const result = service.validate([], [], [Timeframe.D1, Timeframe.W1]);

      expect(result.length).toBe(2);
      expect(result[0].timeframe).toBe(Timeframe.D1);
      expect(result[1].timeframe).toBe(Timeframe.W1);
      expect(result[0].status).toBe(ValidationStatus.INSUFFICIENT_DATA);
    });

    it('should validate single timeframe', () => {
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

      const signals = [
        {
          date: '2025-01-01',
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          timeframe: Timeframe.D1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1]);

      expect(result.length).toBe(1);
      expect(result[0].timeframe).toBe(Timeframe.D1);
      expect(result[0].signalCount).toBe(1);
    });

    it('should calculate agreement accuracy', () => {
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

      const signals = [
        {
          date: '2025-01-01',
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          timeframe: Timeframe.D1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1]);

      expect(result[0].agreementAccuracy).toBeGreaterThanOrEqual(0);
      expect(result[0].agreementAccuracy).toBeLessThanOrEqual(1);
    });

    it('should calculate consensus accuracy', () => {
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

      const signals = [
        {
          date: '2025-01-01',
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          timeframe: Timeframe.D1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1]);

      expect(result[0].consensusAccuracy).toBeGreaterThanOrEqual(0);
      expect(result[0].consensusAccuracy).toBeLessThanOrEqual(1);
    });

    it('should calculate early signal accuracy', () => {
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

      const signals = [
        {
          date: '2024-12-30',
          action: SignalAction.BUY,
          confidence: 0.7,
          price: 98,
          timeframe: Timeframe.D1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1]);

      expect(result[0].earlySignalAccuracy).toBeGreaterThanOrEqual(0);
      expect(result[0].earlySignalAccuracy).toBeLessThanOrEqual(1);
    });

    it('should determine dominant direction', () => {
      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
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
        {
          entryDate: '2025-01-20',
          exitDate: '2025-01-25',
          entryPrice: 100,
          exitPrice: 108,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 80,
          pnlPercent: 8,
          holdingPeriodDays: 5,
          timeframe: Timeframe.D1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const signals = [
        {
          date: '2025-01-01',
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          timeframe: Timeframe.D1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1]);

      expect(result[0].dominantDirection).toBeDefined();
    });

    it('should validate multiple timeframes', () => {
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
          timeframe: Timeframe.W1,
          indicators: {},
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const signals = [
        {
          date: '2025-01-01',
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          timeframe: Timeframe.D1,
        },
        {
          date: '2025-01-10',
          action: SignalAction.BUY,
          confidence: 0.7,
          price: 100,
          timeframe: Timeframe.W1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1, Timeframe.W1]);

      expect(result.length).toBe(2);
      expect(result[0].timeframe).toBe(Timeframe.D1);
      expect(result[1].timeframe).toBe(Timeframe.W1);
    });

    it('should calculate average confidence', () => {
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

      const signals = [
        {
          date: '2025-01-01',
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          timeframe: Timeframe.D1,
        },
        {
          date: '2025-01-02',
          action: SignalAction.BUY,
          confidence: 0.6,
          price: 100,
          timeframe: Timeframe.D1,
        },
      ];

      const result = service.validate(trades, signals, [Timeframe.D1]);

      expect(result[0].avgConfidence).toBe(0.7);
    });
  });
});
