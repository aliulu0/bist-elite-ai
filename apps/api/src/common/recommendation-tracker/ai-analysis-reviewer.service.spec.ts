import { AIAnalysisReviewerService } from './ai-analysis-reviewer.service';
import {
  RecommendationRecord,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
} from './types';

describe('AIAnalysisReviewerService', () => {
  let service: AIAnalysisReviewerService;

  beforeEach(() => {
    service = new AIAnalysisReviewerService();
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

  describe('reviewExplanationConsistency', () => {
    it('should review consistency for each recommendation', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 75, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', entryEliteScore: 30, actualReturn: -5 }),
      ];
      const reviews = service.reviewExplanationConsistency(recs);
      expect(reviews).toHaveLength(2);
      expect(reviews[0].explanationConsistency).toBeDefined();
      expect(reviews[0].overallScore).toBeDefined();
    });

    it('should return empty for empty input', () => {
      expect(service.reviewExplanationConsistency([])).toEqual([]);
    });
  });

  describe('reviewEvidenceQuality', () => {
    it('should calculate evidence quality', () => {
      const recs = [createRecommendation()];
      const quality = service.reviewEvidenceQuality(recs);
      expect(quality).toBeGreaterThan(0);
    });

    it('should return 0 for empty input', () => {
      expect(service.reviewEvidenceQuality([])).toBe(0);
    });
  });

  describe('reviewRecommendationQuality', () => {
    it('should calculate recommendation quality', () => {
      const recs = [
        createRecommendation({ entryEliteScore: 80, actualReturn: 10 }),
      ];
      const quality = service.reviewRecommendationQuality(recs);
      expect(quality).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty input', () => {
      expect(service.reviewRecommendationQuality([])).toBe(0);
    });
  });

  describe('reviewConfidenceCalibration', () => {
    it('should calculate confidence calibration', () => {
      const recs = [
        createRecommendation({ entryConfidence: 0.8, actualReturn: 10 }),
        createRecommendation({ id: 'rec-2', entryConfidence: 0.3, actualReturn: -5 }),
      ];
      const calibration = service.reviewConfidenceCalibration(recs);
      expect(calibration).toBeGreaterThanOrEqual(0);
      expect(calibration).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty input', () => {
      expect(service.reviewConfidenceCalibration([])).toBe(0);
    });
  });

  describe('getConsistencyReport', () => {
    it('should return consistency report', () => {
      const recs = [createRecommendation()];
      const report = service.getConsistencyReport(recs);
      expect(report).toHaveLength(1);
      expect(report[0].factors).toHaveLength(4);
    });
  });
});
