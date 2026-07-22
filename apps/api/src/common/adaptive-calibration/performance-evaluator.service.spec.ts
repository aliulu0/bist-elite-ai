import { PerformanceEvaluatorService } from './performance-evaluator.service';
import { ScoringSnapshot, CalibrationStatus } from './types';

describe('PerformanceEvaluatorService', () => {
  let service: PerformanceEvaluatorService;

  beforeEach(() => {
    service = new PerformanceEvaluatorService();
  });

  describe('evaluate', () => {
    it('should return empty evaluation for empty snapshots', () => {
      const result = service.evaluate([]);
      expect(result.predictionAccuracy).toBe(0);
      expect(result.overallHealth).toBe(CalibrationStatus.CRITICAL);
    });

    it('should calculate prediction accuracy', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i % 2 === 0 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.predictionAccuracy).toBeGreaterThan(0.8);
    });

    it('should calculate precision correctly', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 70,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.8,
        actualOutcome: i < 12 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.precision).toBeGreaterThan(0);
      expect(result.precision).toBeLessThanOrEqual(1);
    });

    it('should calculate recall correctly', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i < 12 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: 5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.recall).toBeGreaterThan(0);
      expect(result.recall).toBeLessThanOrEqual(1);
    });

    it('should calculate F1 score', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i % 2 === 0 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.f1Score).toBeGreaterThanOrEqual(0);
      expect(result.f1Score).toBeLessThanOrEqual(1);
    });

    it('should aggregate validation metrics', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const validationResults = [
        {
          strategyId: 's1',
          overallScore: 70,
          performanceMetrics: {
            winRate: 65,
            profitFactor: 2.0,
            sharpeRatio: 1.5,
            maxDrawdown: 15,
          },
          signalQuality: {
            precision: 0.72,
            recall: 0.68,
            f1Score: 0.70,
          },
        },
      ];

      const result = service.evaluate(snapshots, validationResults);

      expect(result.profitFactor).toBe(2.0);
      expect(result.sharpeRatio).toBe(1.5);
      expect(result.maxDrawdown).toBe(15);
    });

    it('should calculate score distribution', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 40 + i * 2,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.scoreDistribution.mean).toBeGreaterThan(0);
      expect(result.scoreDistribution.min).toBeLessThan(result.scoreDistribution.max);
    });

    it('should calculate calibration error', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.5 + (i % 5) * 0.1,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.calibrationError).toBeGreaterThanOrEqual(0);
      expect(result.calibrationError).toBeLessThanOrEqual(1);
    });

    it('should calculate Brier score', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.brierScore).toBeGreaterThanOrEqual(0);
      expect(result.brierScore).toBeLessThanOrEqual(1);
    });

    it('should calculate historical reliability', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 55 + (i % 3 === 0 ? 10 : -5),
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 4 : -4,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(result.historicalReliability).toBeGreaterThanOrEqual(0);
      expect(result.historicalReliability).toBeLessThanOrEqual(1);
    });

    it('should determine overall health', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i % 2 === 0 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.8,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.evaluate(snapshots);

      expect(Object.values(CalibrationStatus)).toContain(result.overallHealth);
    });
  });
});
