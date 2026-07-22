import { PerformanceEvaluationService } from './performance-evaluation.service';
import {
  RecommendationRecord,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
  EvaluationWindow,
  PriceData,
} from './types';

describe('PerformanceEvaluationService', () => {
  let service: PerformanceEvaluationService;

  beforeEach(() => {
    service = new PerformanceEvaluationService();
  });

  function createRecommendation(overrides: Partial<RecommendationRecord> = {}): RecommendationRecord {
    return {
      id: 'rec-1',
      stockSymbol: 'THYAO',
      stockName: 'Turk Hava Yollari',
      status: RecommendationStatus.FINAL_OUTCOME,
      outcome: RecommendationOutcome.WINNER,
      entryPrice: 100,
      entryDate: '2026-01-01T00:00:00.000Z',
      entryEliteScore: 75,
      entryConfidence: 0.8,
      entryConsensusScore: 70,
      strategyUsed: 'elite-score',
      marketRegime: MarketRegime.BULL,
      timeframeConsensus: 'balanced',
      actualReturn: 15,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
      ...overrides,
    };
  }

  function createPriceHistory(prices: number[]): PriceData[] {
    return prices.map((price, i) => ({
      date: new Date(2026, 0, i + 1).toISOString(),
      open: price - 1,
      high: price + 2,
      low: price - 2,
      close: price,
      volume: 1000000,
    }));
  }

  describe('calculateReturnMetrics', () => {
    it('should calculate positive return', () => {
      const result = service.calculateReturnMetrics(100, 115);
      expect(result.return_).toBeCloseTo(15);
      expect(result.maxGain).toBeCloseTo(15);
      expect(result.maxDrawdown).toBe(0);
    });

    it('should calculate negative return', () => {
      const result = service.calculateReturnMetrics(100, 85);
      expect(result.return_).toBeCloseTo(-15);
      expect(result.maxGain).toBe(0);
      expect(result.maxDrawdown).toBeCloseTo(15);
    });

    it('should handle zero entry price', () => {
      const result = service.calculateReturnMetrics(0, 100);
      expect(result.return_).toBe(0);
    });
  });

  describe('calculateRiskAdjustedReturn', () => {
    it('should calculate Sharpe-like ratio', () => {
      const returns = [1, 2, 3, 4, 5];
      const result = service.calculateRiskAdjustedReturn(returns);
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for empty returns', () => {
      expect(service.calculateRiskAdjustedReturn([])).toBe(0);
    });

    it('should return 0 for single return', () => {
      expect(service.calculateRiskAdjustedReturn([5])).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility', () => {
      const returns = [1, -1, 2, -2, 3];
      const vol = service.calculateVolatility(returns);
      expect(vol).toBeGreaterThan(0);
    });

    it('should return 0 for empty returns', () => {
      expect(service.calculateVolatility([])).toBe(0);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe ratio', () => {
      const returns = [1, 2, 3, 4, 5];
      const sharpe = service.calculateSharpeRatio(returns);
      expect(sharpe).toBeGreaterThan(0);
    });
  });

  describe('calculateSortinoRatio', () => {
    it('should calculate Sortino ratio', () => {
      const returns = [1, 2, 3, 4, 5];
      const sortino = service.calculateSortinoRatio(returns);
      expect(sortino).toBeGreaterThan(0);
    });

    it('should return Infinity for all positive returns', () => {
      const returns = [1, 2, 3, 4, 5];
      const sortino = service.calculateSortinoRatio(returns);
      expect(sortino).toBe(Infinity);
    });
  });

  describe('getWindowPerformance', () => {
    it('should calculate window performance', () => {
      const rec = createRecommendation();
      const prices = createPriceHistory([100, 102, 105, 103, 108]);
      const perf = service.getWindowPerformance(rec, prices, EvaluationWindow.ONE_WEEK);
      expect(perf.window).toBe(EvaluationWindow.ONE_WEEK);
      expect(perf.returnPercent).toBeDefined();
      expect(perf.maxGainPercent).toBeDefined();
    });

    it('should handle empty price history', () => {
      const rec = createRecommendation();
      const perf = service.getWindowPerformance(rec, [], EvaluationWindow.ONE_WEEK);
      expect(perf.returnPercent).toBe(0);
      expect(perf.holdingPeriodDays).toBe(0);
    });
  });

  describe('evaluatePerformance', () => {
    it('should evaluate full performance', () => {
      const rec = createRecommendation();
      const prices = createPriceHistory([100, 102, 105, 103, 108, 110, 112]);
      const perf = service.evaluatePerformance(rec, prices);
      expect(perf.recommendationId).toBe('rec-1');
      expect(perf.stockSymbol).toBe('THYAO');
      expect(perf.windows).toHaveLength(7);
      expect(perf.overallReturn).toBeDefined();
      expect(perf.evaluatedAt).toBeDefined();
    });
  });

  describe('getAggregatePerformance', () => {
    it('should aggregate performance across recommendations', () => {
      const recs = [
        createRecommendation({ id: 'rec-1', actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', actualReturn: -5 }),
      ];
      const agg = service.getAggregatePerformance(recs);
      expect(Object.keys(agg)).toHaveLength(7);
      expect(agg[EvaluationWindow.ONE_DAY]).toBeDefined();
    });

    it('should handle empty recommendations', () => {
      const agg = service.getAggregatePerformance([]);
      expect(Object.keys(agg)).toHaveLength(7);
    });
  });
});
