import { ScoringDiagnosticsService } from './scoring-diagnostics.service';
import { ScoringSnapshot, ComponentHealth, DiagnosticIssueType, TrendDirection } from './types';

describe('ScoringDiagnosticsService', () => {
  let service: ScoringDiagnosticsService;

  beforeEach(() => {
    service = new ScoringDiagnosticsService();
  });

  describe('analyze', () => {
    it('should return empty array for empty snapshots', () => {
      const result = service.analyze([]);
      expect(result).toEqual([]);
    });

    it('should analyze components from snapshots', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + (i % 2 === 0 ? 10 : -10),
        componentScores: {
          technical: 60 + (i % 3 === 0 ? 10 : -5),
          momentum: 55 + (i % 2 === 0 ? 15 : -10),
        },
        componentWeights: {
          technical: 0.10,
          momentum: 0.10,
        },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);

      expect(result.length).toBe(2);
      expect(result.find(d => d.component === 'technical')).toBeDefined();
      expect(result.find(d => d.component === 'momentum')).toBeDefined();
    });

    it('should calculate effectiveness correctly', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 70,
        componentScores: {
          technical: 70,
        },
        componentWeights: {
          technical: 0.10,
        },
        confidence: 0.8,
        actualOutcome: 5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.effectiveness).toBeGreaterThan(0);
      expect(technical.effectiveness).toBeLessThanOrEqual(1);
    });

    it('should calculate stability correctly', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: {
          technical: 60 + (i % 2 === 0 ? 2 : -2),
        },
        componentWeights: {
          technical: 0.10,
        },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.stability).toBeGreaterThan(0.8);
    });

    it('should detect overweighted components', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + (i % 2 === 0 ? 5 : -5),
        componentScores: {
          technical: 10,
        },
        componentWeights: {
          technical: 0.20,
        },
        confidence: 0.6,
        actualOutcome: i % 2 === 0 ? 2 : -2,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.issues).toContain(DiagnosticIssueType.OVERWEIGHTED);
    });

    it('should detect unstable components', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50,
        componentScores: {
          technical: 10 + Math.random() * 80,
        },
        componentWeights: {
          technical: 0.10,
        },
        confidence: 0.5,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.stability).toBeLessThan(0.7);
    });

    it('should determine health correctly', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60 + (i % 2 === 0 ? 5 : -5),
        componentScores: {
          technical: 65 + (i % 3 === 0 ? 3 : -2),
        },
        componentWeights: {
          technical: 0.10,
        },
        confidence: 0.75,
        actualOutcome: i % 2 === 0 ? 4 : -4,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.health).toBeDefined();
      expect(Object.values(ComponentHealth)).toContain(technical.health);
    });

    it('should calculate recommended weight', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 55,
        componentScores: {
          technical: 55,
        },
        componentWeights: {
          technical: 0.10,
        },
        confidence: 0.65,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.recommendedWeight).toBeGreaterThan(0);
      expect(technical.recommendedWeight).toBeLessThanOrEqual(0.25);
    });

    it('should generate evidence', () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 60,
        componentScores: {
          technical: 60,
        },
        componentWeights: {
          technical: 0.10,
        },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const result = service.analyze(snapshots);
      const technical = result.find(d => d.component === 'technical')!;

      expect(technical.evidence.length).toBeGreaterThan(0);
    });
  });
});
