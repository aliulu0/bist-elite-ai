import { StrategyAnalyzerService } from './strategy-analyzer.service';
import {
  RecommendationRecord,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
} from './types';

describe('StrategyAnalyzerService', () => {
  let service: StrategyAnalyzerService;

  beforeEach(() => {
    service = new StrategyAnalyzerService();
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
      sector: 'Turizm',
      actualReturn: 15,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
      ...overrides,
    };
  }

  describe('analyzeStrategyPerformance', () => {
    it('should analyze per-strategy performance', () => {
      const recs = [
        createRecommendation({ strategyUsed: 'elite-score', actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', strategyUsed: 'elite-score', actualReturn: -5 }),
        createRecommendation({ id: 'rec-3', strategyUsed: 'consensus', actualReturn: 8 }),
      ];
      const results = service.analyzeStrategyPerformance(recs);
      expect(results).toHaveLength(2);
      expect(results.find(s => s.strategy === 'elite-score')).toBeDefined();
      expect(results.find(s => s.strategy === 'consensus')).toBeDefined();
    });

    it('should return empty for empty input', () => {
      expect(service.analyzeStrategyPerformance([])).toEqual([]);
    });
  });

  describe('analyzeIndicatorPerformance', () => {
    it('should analyze per-indicator performance', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 75, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 30, actualReturn: -5 }),
      ];
      const results = service.analyzeIndicatorPerformance(recs);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].accuracy).toBeDefined();
      expect(results[0].precision).toBeDefined();
      expect(results[0].recall).toBeDefined();
    });
  });

  describe('analyzeSectorPerformance', () => {
    it('should analyze per-sector performance', () => {
      const recs = [
        createRecommendation({ sector: 'Turizm', actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', sector: 'Bankacilik', actualReturn: -5 }),
      ];
      const results = service.analyzeSectorPerformance(recs);
      expect(results).toHaveLength(2);
      expect(results.find(s => s.sector === 'Turizm')).toBeDefined();
      expect(results.find(s => s.sector === 'Bankacilik')).toBeDefined();
    });

    it('should handle missing sector', () => {
      const recs = [createRecommendation({ sector: undefined, actualReturn: 5 })];
      const results = service.analyzeSectorPerformance(recs);
      expect(results).toHaveLength(1);
      expect(results[0].sector).toBe('Diger');
    });
  });

  describe('analyzeTimeframePerformance', () => {
    it('should analyze per-timeframe performance', () => {
      const recs = [
        createRecommendation({ timeframeConsensus: 'balanced', actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', timeframeConsensus: 'aggressive', actualReturn: -5 }),
      ];
      const results = service.analyzeTimeframePerformance(recs);
      expect(results).toHaveLength(2);
    });
  });

  describe('analyzeMarketConditionPerformance', () => {
    it('should analyze per-regime performance', () => {
      const recs = [
        createRecommendation({ marketRegime: MarketRegime.BULL, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', marketRegime: MarketRegime.BEAR, actualReturn: -5 }),
      ];
      const results = service.analyzeMarketConditionPerformance(recs);
      expect(results).toHaveLength(2);
      expect(results.find(r => r.regime === MarketRegime.BULL)).toBeDefined();
      expect(results.find(r => r.regime === MarketRegime.BEAR)).toBeDefined();
    });
  });

  describe('profitFactor edge cases', () => {
    it('should handle all winners', () => {
      const recs = [
        createRecommendation({ actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', actualReturn: 5 }),
      ];
      const results = service.analyzeStrategyPerformance(recs);
      expect(results[0].profitFactor).toBe(Infinity);
    });

    it('should handle all losers', () => {
      const recs = [
        createRecommendation({ actualReturn: -10 }),
        createRecommendation({ id: 'rec-2', actualReturn: -5 }),
      ];
      const results = service.analyzeStrategyPerformance(recs);
      expect(results[0].profitFactor).toBe(0);
    });
  });
});
