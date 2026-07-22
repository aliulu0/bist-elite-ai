import { EliteScoreAnalyzerService } from './elite-score-analyzer.service';
import {
  RecommendationRecord,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
} from './types';

describe('EliteScoreAnalyzerService', () => {
  let service: EliteScoreAnalyzerService;

  beforeEach(() => {
    service = new EliteScoreAnalyzerService();
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

  describe('analyzeScoreAccuracy', () => {
    it('should analyze score accuracy for each recommendation', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 75, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 30, actualReturn: -5 }),
      ];
      const results = service.analyzeScoreAccuracy(recs);
      expect(results).toHaveLength(2);
      expect(results[0].scoreAccuracy).toBeDefined();
      expect(results[0].brierScore).toBeDefined();
    });

    it('should return empty for empty input', () => {
      expect(service.analyzeScoreAccuracy([])).toEqual([]);
    });
  });

  describe('analyzeConfidenceAccuracy', () => {
    it('should calculate confidence accuracy', () => {
      const recs = [
        createRecommendation({ entryConfidence: 0.8, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', entryConfidence: 0.3, actualReturn: -5 }),
      ];
      const accuracy = service.analyzeConfidenceAccuracy(recs);
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty input', () => {
      expect(service.analyzeConfidenceAccuracy([])).toBe(0);
    });
  });

  describe('analyzeScoreStability', () => {
    it('should calculate score stability', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 70 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 72 }),
        createRecommendation({ id: 'rec-3', entryEliteScore: 68 }),
      ];
      const stability = service.analyzeScoreStability(recs);
      expect(stability).toBeGreaterThan(0.9);
    });

    it('should return 0 for empty input', () => {
      expect(service.analyzeScoreStability([])).toBe(0);
    });

    it('should return 0 for single recommendation', () => {
      expect(service.analyzeScoreStability([createRecommendation()])).toBe(0);
    });
  });

  describe('analyzePredictionQuality', () => {
    it('should calculate prediction quality', () => {
      const recs = [
        createRecommendation({ entryConfidence: 80, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', entryConfidence: 20, actualReturn: -5 }),
      ];
      const quality = service.analyzePredictionQuality(recs);
      expect(quality).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty input', () => {
      expect(service.analyzePredictionQuality([])).toBe(0);
    });
  });

  describe('getScoreDistributionStats', () => {
    it('should calculate distribution stats', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 60 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 70 }),
        createRecommendation({ id: 'rec-3', entryEliteScore: 80 }),
      ];
      const stats = service.getScoreDistributionStats(recs);
      expect(stats.mean).toBe(70);
      expect(stats.median).toBe(70);
      expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('should return zeros for empty input', () => {
      const stats = service.getScoreDistributionStats([]);
      expect(stats).toEqual({ mean: 0, median: 0, stdDev: 0 });
    });
  });

  describe('calculateBrierScore', () => {
    it('should calculate Brier score', () => {
      const predictions = [0.8, 0.2, 0.9];
      const outcomes = [1, 0, 1];
      const score = service.calculateBrierScore(predictions, outcomes);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty input', () => {
      expect(service.calculateBrierScore([], [])).toBe(0);
    });
  });

  describe('calculateCalibrationError', () => {
    it('should calculate calibration error', () => {
      const predictions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
      const outcomes = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      const error = service.calculateCalibrationError(predictions, outcomes);
      expect(error).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty input', () => {
      expect(service.calculateCalibrationError([], [])).toBe(0);
    });
  });
});
