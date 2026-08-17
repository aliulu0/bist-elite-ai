import { QualityScorer } from './quality-scorer.service';
import { ProviderContribution, ValidationWarning } from './aggregation.types';

describe('QualityScorer', () => {
  let scorer: QualityScorer;

  beforeEach(() => {
    scorer = new QualityScorer();
  });

  describe('empty contributions', () => {
    it('should return 0 for empty contributions', () => {
      const score = scorer.calculate([], {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables'],
      });
      expect(score).toBe(0);
    });
  });

  describe('single provider', () => {
    it('should score reasonably for single healthy provider', () => {
      const contributions: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];
      const score = scorer.calculate(contributions, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables'],
      });
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('multiple providers', () => {
    it('should score higher with more providers returning complete data', () => {
      const twoProviders: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];
      const threeProviders: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'kap',
          priority: 3,
          healthy: true,
          latencyMs: 400,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];

      const score2 = scorer.calculate(twoProviders, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      const score3 = scorer.calculate(threeProviders, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo', 'kap'],
      });
      expect(score3).toBeGreaterThanOrEqual(score2);
    });

    it('should score higher with healthy providers', () => {
      const healthy: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];
      const unhealthy: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: false,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];

      const scoreHealthy = scorer.calculate(healthy, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      const scoreUnhealthy = scorer.calculate(unhealthy, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      expect(scoreHealthy).toBeGreaterThan(scoreUnhealthy);
    });
  });

  describe('field completeness', () => {
    it('should score higher with more complete data', () => {
      const complete: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];
      const incomplete: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 3,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 3,
          fieldsExpected: 7,
        },
      ];

      const scoreComplete = scorer.calculate(complete, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      const scoreIncomplete = scorer.calculate(incomplete, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      expect(scoreComplete).toBeGreaterThan(scoreIncomplete);
    });
  });

  describe('validation warnings', () => {
    it('should penalize error warnings more than info warnings', () => {
      const contributions: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];

      const scoreWithErrors = scorer.calculate(contributions, {
        validationWarnings: [
          {
            field: 'marketCap',
            message: 'Negative market cap',
            severity: 'error',
            provider: 'fintables',
          },
        ],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      const scoreWithInfo = scorer.calculate(contributions, {
        validationWarnings: [
          {
            field: 'sector',
            message: 'Sector is Unknown',
            severity: 'info',
            provider: 'fintables',
          },
        ],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      expect(scoreWithInfo).toBeGreaterThan(scoreWithErrors);
    });

    it('should penalize conflicts', () => {
      const contributions: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 200,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 300,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];

      const scoreNoConflicts = scorer.calculate(contributions, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo'],
      });
      const scoreWithConflicts = scorer.calculate(contributions, {
        validationWarnings: [],
        conflictCount: 5,
        providersQueried: ['fintables', 'yahoo'],
      });
      expect(scoreNoConflicts).toBeGreaterThan(scoreWithConflicts);
    });
  });

  describe('score bounds', () => {
    it('should never exceed 100', () => {
      const contributions: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 1,
          healthy: true,
          latencyMs: 10,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'yahoo',
          priority: 2,
          healthy: true,
          latencyMs: 10,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
        {
          provider: 'kap',
          priority: 3,
          healthy: true,
          latencyMs: 10,
          fieldsReturned: 7,
          fieldsExpected: 7,
        },
      ];
      const score = scorer.calculate(contributions, {
        validationWarnings: [],
        conflictCount: 0,
        providersQueried: ['fintables', 'yahoo', 'kap'],
      });
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should never go below 0', () => {
      const contributions: ProviderContribution[] = [
        {
          provider: 'fintables',
          priority: 99,
          healthy: false,
          latencyMs: 10000,
          fieldsReturned: 0,
          fieldsExpected: 7,
        },
      ];
      const warnings: ValidationWarning[] = Array(20).fill({
        field: 'test',
        message: 'error',
        severity: 'error',
        provider: 'fintables',
      });
      const score = scorer.calculate(contributions, {
        validationWarnings: warnings,
        conflictCount: 50,
        providersQueried: ['fintables'],
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});
