import { RegimeHistoricalService } from './regime-historical.service';
import { MarketRegimeType, RegimeTransition } from './types';

describe('RegimeHistoricalService', () => {
  let service: RegimeHistoricalService;

  beforeEach(() => {
    service = new RegimeHistoricalService();
  });

  describe('getRegimeDuration', () => {
    it('should return 0 for empty history', () => {
      expect(service.getRegimeDuration(MarketRegimeType.BULL, [])).toBe(0);
    });

    it('should count consecutive occurrences from end', () => {
      const history = [
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
      ];
      expect(service.getRegimeDuration(MarketRegimeType.BULL, history)).toBe(3);
    });

    it('should return 0 when current regime is not at end', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BEAR,
      ];
      expect(service.getRegimeDuration(MarketRegimeType.BULL, history)).toBe(0);
    });
  });

  describe('getRegimeFrequency', () => {
    it('should return empty array for empty history', () => {
      expect(service.getRegimeFrequency([])).toEqual([]);
    });

    it('should count regime occurrences', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.getRegimeFrequency(history);
      expect(result.length).toBe(2);
      const bullData = result.find((r) => r.regime === MarketRegimeType.BULL);
      expect(bullData?.occurrences).toBe(3);
    });

    it('should calculate avg duration', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BEAR,
        MarketRegimeType.BULL,
      ];
      const result = service.getRegimeFrequency(history);
      const bullData = result.find((r) => r.regime === MarketRegimeType.BULL);
      expect(bullData?.avgDuration).toBeGreaterThan(0);
    });
  });

  describe('getRegimePerformance', () => {
    it('should aggregate strategy performance', () => {
      const recommendations = [
        { strategyName: 'S1', winRate: 0.7, avgReturn: 0.05, sharpeRatio: 1.2 },
        { strategyName: 'S1', winRate: 0.6, avgReturn: 0.04, sharpeRatio: 1.0 },
      ];
      const result = service.getRegimePerformance(MarketRegimeType.BULL, recommendations);
      expect(result.regime).toBe(MarketRegimeType.BULL);
      expect(result.strategyPerformance['S1'].winRate).toBeCloseTo(1.3, 1);
    });

    it('should handle empty recommendations', () => {
      const result = service.getRegimePerformance(MarketRegimeType.BEAR, []);
      expect(result.regime).toBe(MarketRegimeType.BEAR);
      expect(Object.keys(result.strategyPerformance)).toHaveLength(0);
    });

    it('should use default strategy name when missing', () => {
      const recommendations = [{ winRate: 0.5, avgReturn: 0.02, sharpeRatio: 0.8 }];
      const result = service.getRegimePerformance(MarketRegimeType.SIDEWAYS, recommendations);
      expect(result.strategyPerformance['default']).toBeDefined();
    });
  });

  describe('getTransitionFrequency', () => {
    it('should count transition frequencies', () => {
      const transitions: RegimeTransition[] = [
        { from: MarketRegimeType.BULL, to: MarketRegimeType.BEAR, probability: 0.5, timeframe: 'D1' as any, indicators: [], detectedAt: '' },
        { from: MarketRegimeType.BULL, to: MarketRegimeType.BEAR, probability: 0.5, timeframe: 'D1' as any, indicators: [], detectedAt: '' },
        { from: MarketRegimeType.BEAR, to: MarketRegimeType.BULL, probability: 0.5, timeframe: 'D1' as any, indicators: [], detectedAt: '' },
      ];
      const result = service.getTransitionFrequency(transitions);
      expect(result['BULL->BEAR']).toBe(2);
      expect(result['BEAR->BULL']).toBe(1);
    });

    it('should return empty object for empty transitions', () => {
      expect(service.getTransitionFrequency([])).toEqual({});
    });
  });

  describe('compareRegimes', () => {
    it('should indicate which regime is more frequent', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BULL,
        MarketRegimeType.BEAR,
      ];
      const result = service.compareRegimes(MarketRegimeType.BULL, MarketRegimeType.BEAR, history);
      expect(result).toContain('BULL');
      expect(result).toContain('daha sik');
    });

    it('should indicate equal frequency', () => {
      const history = [
        MarketRegimeType.BULL,
        MarketRegimeType.BEAR,
      ];
      const result = service.compareRegimes(MarketRegimeType.BULL, MarketRegimeType.BEAR, history);
      expect(result).toContain('esit');
    });
  });
});
