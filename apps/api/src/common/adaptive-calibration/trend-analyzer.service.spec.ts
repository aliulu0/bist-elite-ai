import { TrendAnalyzerService } from './trend-analyzer.service';
import { ScoringSnapshot, TrendDirection } from './types';

describe('TrendAnalyzerService', () => {
  let service: TrendAnalyzerService;

  beforeEach(() => {
    service = new TrendAnalyzerService();
  });

  describe('analyze', () => {
    it('should return empty array for empty snapshots', () => {
      const result = service.analyze([]);
      expect(result).toEqual([]);
    });

    it('should return insufficient data for small samples', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 3 }, (_, i) => ({
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

      const result = service.analyze(snapshots);

      expect(result[0].direction).toBe(TrendDirection.INSUFFICIENT_DATA);
    });

    it('should detect improving trend', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + i * 2,
        componentScores: { technical: 40 + i * 2 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(t => t.component === 'technical')!;

      expect(technical.direction).toBe(TrendDirection.IMPROVING);
      expect(technical.slope).toBeGreaterThan(0);
    });

    it('should detect degrading trend', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 80 - i * 2,
        componentScores: { technical: 80 - i * 2 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(t => t.component === 'technical')!;

      expect(technical.direction).toBe(TrendDirection.DEGRADING);
      expect(technical.slope).toBeLessThan(0);
    });

    it('should detect stable trend', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60 + (i % 2 === 0 ? 1 : -1),
        componentScores: { technical: 60 + (i % 2 === 0 ? 1 : -1) },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(t => t.component === 'technical')!;

      expect(technical.direction).toBe(TrendDirection.STABLE);
    });

    it('should calculate R-squared', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + i * 2,
        componentScores: { technical: 50 + i * 2 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(t => t.component === 'technical')!;

      expect(technical.rSquared).toBeGreaterThanOrEqual(0);
      expect(technical.rSquared).toBeLessThanOrEqual(1);
    });

    it('should generate forecast', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + i * 2,
        componentScores: { technical: 50 + i * 2 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(t => t.component === 'technical')!;

      expect(technical.forecast).toBeDefined();
      expect(typeof technical.forecast).toBe('number');
    });

    it('should calculate trend confidence', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + i * 2,
        componentScores: { technical: 50 + i * 2 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(t => t.component === 'technical')!;

      expect(technical.confidence).toBeGreaterThanOrEqual(0);
      expect(technical.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeOverallTrend', () => {
    it('should return insufficient data for empty snapshots', () => {
      const result = service.analyzeOverallTrend([]);
      expect(result.direction).toBe(TrendDirection.INSUFFICIENT_DATA);
    });

    it('should identify improving components', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: {
          technical: 40 + i * 2,
          momentum: 60 + (i % 2 === 0 ? 1 : -1),
        },
        componentWeights: { technical: 0.10, momentum: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyzeOverallTrend(snapshots);

      expect(result.improving).toContain('technical');
      expect(result.stable).toContain('momentum');
    });

    it('should identify degrading components', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: {
          technical: 80 - i * 2,
          momentum: 60 + (i % 2 === 0 ? 1 : -1),
        },
        componentWeights: { technical: 0.10, momentum: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyzeOverallTrend(snapshots);

      expect(result.degrading).toContain('technical');
    });
  });
});
