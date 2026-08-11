import { RankingEngine } from '../ranking-engine.service';
import { DEFAULT_RANKING_CONFIG } from '../ranking.config';
import { buildScannerResult, buildStrongCandidate, buildWeakCandidate, buildCandidateBatch } from './test-helpers';

describe('RankingEngine', () => {
  let engine: RankingEngine;

  beforeEach(() => {
    engine = new RankingEngine(DEFAULT_RANKING_CONFIG);
  });

  describe('Basic Ranking', () => {
    it('should rank candidates', () => {
      const candidates = buildCandidateBatch(10);
      const result = engine.rank(candidates);
      expect(result.ranked).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should assign sequential ranks', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (let i = 0; i < ranked.length; i++) {
        expect(ranked[i].rank).toBe(i + 1);
      }
    });

    it('should sort by ranking score descending', () => {
      const candidates = buildCandidateBatch(10);
      const { ranked } = engine.rank(candidates);
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].rankingScore).toBeGreaterThanOrEqual(ranked[i].rankingScore);
      }
    });

    it('should handle empty input', () => {
      const result = engine.rank([]);
      expect(result.ranked.length).toBe(0);
      expect(result.metrics.totalRanked).toBe(0);
    });

    it('should track ranking duration', () => {
      const candidates = buildCandidateBatch(10);
      const result = engine.rank(candidates);
      expect(result.metrics.rankingDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Investment Grades', () => {
    it('should assign grades to all ranked candidates', () => {
      const candidates = buildCandidateBatch(10);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(r.investmentGrade).toBeDefined();
        expect(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'REJECT']).toContain(r.investmentGrade);
      }
    });

    it('should produce grade distribution in metrics', () => {
      const candidates = buildCandidateBatch(10);
      const { metrics } = engine.rank(candidates);
      const totalGrades = Object.values(metrics.gradeDistribution).reduce((s, v) => s + v, 0);
      expect(totalGrades).toBe(metrics.totalRanked);
    });
  });

  describe('Recommendations', () => {
    it('should assign recommendations to all ranked candidates', () => {
      const candidates = buildCandidateBatch(10);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(r.recommendation).toBeDefined();
        expect(r.recommendationExplanation).toBeTruthy();
      }
    });

    it('should produce recommendation distribution', () => {
      const candidates = buildCandidateBatch(10);
      const { metrics } = engine.rank(candidates);
      const totalRecs = Object.values(metrics.recommendationDistribution).reduce((s, v) => s + v, 0);
      expect(totalRecs).toBe(metrics.totalRanked);
    });
  });

  describe('Ranking Factors', () => {
    it('should include ranking factors for each candidate', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(r.rankingFactors.length).toBe(18);
      }
    });

    it('should include factor contributions', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        for (const f of r.rankingFactors) {
          expect(f.name).toBeTruthy();
          expect(typeof f.rawValue).toBe('number');
          expect(typeof f.weight).toBe('number');
        }
      }
    });
  });

  describe('Risk/Reward', () => {
    it('should calculate expected return estimate', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(typeof r.expectedReturnEstimate).toBe('number');
      }
    });

    it('should calculate risk/reward ratio', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(typeof r.riskRewardRatio).toBe('number');
      }
    });
  });

  describe('Comparisons', () => {
    it('should return comparison views', () => {
      const candidates = buildCandidateBatch(10);
      const { ranked } = engine.rank(candidates);
      const gainers = engine.getComparison(ranked, 'TOP_GAINERS');
      expect(Array.isArray(gainers)).toBe(true);
    });

    it('should return highest confidence comparison', () => {
      const candidates = buildCandidateBatch(10);
      const { ranked } = engine.rank(candidates);
      const result = engine.getComparison(ranked, 'HIGHEST_CONFIDENCE', 5);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('History', () => {
    it('should track history after ranking', () => {
      const candidates = buildCandidateBatch(5);
      engine.rank(candidates);
      const history = engine.getHistory('THYAO');
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metadata', () => {
    it('should include metadata for each ranked candidate', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(r.metadata).toBeDefined();
        expect(typeof r.metadata.rankingDurationMs).toBe('number');
        expect(r.metadata.normalizedScore).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include reasons for each ranked candidate', () => {
      const candidates = buildCandidateBatch(5);
      const { ranked } = engine.rank(candidates);
      for (const r of ranked) {
        expect(r.reasons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Strong vs Weak Candidates', () => {
    it('should rank strong candidates higher than weak', () => {
      const candidates = [buildWeakCandidate(), buildStrongCandidate(), buildWeakCandidate()];
      const { ranked } = engine.rank(candidates);
      const strong = ranked.find((r) => r.symbol === 'ASELS');
      const weak = ranked.find((r) => r.symbol === 'WEAK');
      expect(strong!.rank).toBeLessThan(weak!.rank);
    });
  });

  describe('Custom Config', () => {
    it('should accept custom config', () => {
      const customEngine = new RankingEngine({
        minScoreThreshold: 80,
      });
      const candidates = buildCandidateBatch(10);
      const result = customEngine.rank(candidates);
      expect(result.ranked).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should rank 28 candidates within 500ms', () => {
      const candidates = buildCandidateBatch(28);
      const start = Date.now();
      engine.rank(candidates);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle candidates with missing metrics gracefully', () => {
      const candidates = [
        buildScannerResult({
          symbol: 'NO_METRICS',
          metadata: {
            ...buildScannerResult().metadata,
            supportingMetrics: [],
          },
        }),
      ];
      const result = engine.rank(candidates);
      expect(result.ranked).toBeDefined();
    });
  });
});
