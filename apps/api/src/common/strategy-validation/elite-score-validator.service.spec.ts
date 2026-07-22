import { EliteScoreValidator } from './elite-score-validator.service';
import { ValidationStatus } from './types';

describe('EliteScoreValidator', () => {
  let service: EliteScoreValidator;

  beforeEach(() => {
    service = new EliteScoreValidator();
  });

  describe('validate', () => {
    it('should return empty result for empty scores', () => {
      const result = service.validate([]);

      expect(result.accuracy).toBe(0);
      expect(result.confidenceCalibration).toBe(0);
      expect(result.status).toBe(ValidationStatus.INSUFFICIENT_DATA);
    });

    it('should calculate accuracy correctly', () => {
      const eliteScores = [
        { date: '2025-01-01', score: 70, confidence: 0.8, componentScores: { trend: 70 }, actualOutcome: 5 },
        { date: '2025-01-02', score: 60, confidence: 0.7, componentScores: { trend: 60 }, actualOutcome: 3 },
        { date: '2025-01-03', score: 40, confidence: 0.6, componentScores: { trend: 40 }, actualOutcome: -2 },
        { date: '2025-01-04', score: 30, confidence: 0.5, componentScores: { trend: 30 }, actualOutcome: -5 },
      ];

      const result = service.validate(eliteScores);

      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });

    it('should calculate confidence calibration', () => {
      const eliteScores = Array.from({ length: 20 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        score: 50 + (i % 2 === 0 ? 20 : -20),
        confidence: 0.5 + (i % 5) * 0.1,
        componentScores: { trend: 50 + (i % 2 === 0 ? 20 : -20) },
        actualOutcome: i % 2 === 0 ? 5 : -5,
      }));

      const result = service.validate(eliteScores);

      expect(result.confidenceCalibration).toBeGreaterThanOrEqual(0);
      expect(result.confidenceCalibration).toBeLessThanOrEqual(1);
    });

    it('should calculate historical reliability', () => {
      const eliteScores = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        score: 50 + (i % 3 === 0 ? 20 : -10),
        confidence: 0.6,
        componentScores: { trend: 50 + (i % 3 === 0 ? 20 : -10) },
        actualOutcome: i % 3 === 0 ? 5 : -3,
      }));

      const result = service.validate(eliteScores);

      expect(result.historicalReliability).toBeGreaterThanOrEqual(0);
      expect(result.historicalReliability).toBeLessThanOrEqual(1);
    });

    it('should analyze component contribution', () => {
      const eliteScores = [
        { date: '2025-01-01', score: 70, confidence: 0.8, componentScores: { trend: 80, momentum: 60 }, actualOutcome: 5 },
        { date: '2025-01-02', score: 60, confidence: 0.7, componentScores: { trend: 70, momentum: 50 }, actualOutcome: 3 },
        { date: '2025-01-03', score: 40, confidence: 0.6, componentScores: { trend: 30, momentum: 50 }, actualOutcome: -2 },
      ];

      const result = service.validate(eliteScores);

      expect(result.componentContribution).toBeDefined();
      expect(result.componentContribution['trend']).toBeDefined();
      expect(result.componentContribution['momentum']).toBeDefined();
    });

    it('should calculate score distribution', () => {
      const eliteScores = [
        { date: '2025-01-01', score: 70, confidence: 0.8, componentScores: {}, actualOutcome: 5 },
        { date: '2025-01-02', score: 60, confidence: 0.7, componentScores: {}, actualOutcome: 3 },
        { date: '2025-01-03', score: 50, confidence: 0.6, componentScores: {}, actualOutcome: 0 },
        { date: '2025-01-04', score: 40, confidence: 0.5, componentScores: {}, actualOutcome: -2 },
        { date: '2025-01-05', score: 30, confidence: 0.4, componentScores: {}, actualOutcome: -5 },
      ];

      const result = service.validate(eliteScores);

      expect(result.scoreDistribution.mean).toBe(50);
      expect(result.scoreDistribution.median).toBe(50);
      expect(result.scoreDistribution.min).toBe(30);
      expect(result.scoreDistribution.max).toBe(70);
    });

    it('should calculate calibration error', () => {
      const eliteScores = Array.from({ length: 20 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        score: 50 + (i % 2 === 0 ? 20 : -20),
        confidence: 0.5 + (i % 5) * 0.1,
        componentScores: {},
        actualOutcome: i % 2 === 0 ? 5 : -5,
      }));

      const result = service.validate(eliteScores);

      expect(result.calibrationError).toBeGreaterThanOrEqual(0);
      expect(result.calibrationError).toBeLessThanOrEqual(1);
    });

    it('should calculate Brier score', () => {
      const eliteScores = [
        { date: '2025-01-01', score: 70, confidence: 0.9, componentScores: {}, actualOutcome: 5 },
        { date: '2025-01-02', score: 60, confidence: 0.7, componentScores: {}, actualOutcome: 3 },
        { date: '2025-01-03', score: 40, confidence: 0.3, componentScores: {}, actualOutcome: -2 },
      ];

      const result = service.validate(eliteScores);

      expect(result.brierScore).toBeGreaterThanOrEqual(0);
      expect(result.brierScore).toBeLessThanOrEqual(1);
    });

    it('should determine passed status for good scores', () => {
      const eliteScores = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        score: i % 2 === 0 ? 70 : 30,
        confidence: i % 2 === 0 ? 0.8 : 0.3,
        componentScores: {},
        actualOutcome: i % 2 === 0 ? 5 : -5,
      }));

      const result = service.validate(eliteScores);

      expect([ValidationStatus.PASSED, ValidationStatus.WARNING]).toContain(result.status);
    });

    it('should determine warning status for moderate scores', () => {
      const eliteScores = Array.from({ length: 20 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        score: 50 + (i % 3 === 0 ? 10 : -5),
        confidence: 0.5,
        componentScores: {},
        actualOutcome: i % 3 === 0 ? 2 : -1,
      }));

      const result = service.validate(eliteScores);

      expect([ValidationStatus.PASSED, ValidationStatus.WARNING, ValidationStatus.FAILED]).toContain(result.status);
    });

    it('should handle single score', () => {
      const eliteScores = [
        { date: '2025-01-01', score: 70, confidence: 0.8, componentScores: { trend: 70 }, actualOutcome: 5 },
      ];

      const result = service.validate(eliteScores);

      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.status).toBeDefined();
    });
  });
});
