import { Test, TestingModule } from '@nestjs/testing';
import { CandidateEngine } from './candidate.engine';
import { CandidateInput } from './candidate.engine';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { ConfluenceResult } from '../confluence/confluence.types';

function makeFinancialScore(overrides: Partial<FinancialScoreResult> = {}): FinancialScoreResult {
  return {
    symbol: 'THYAO',
    score: 75,
    grade: 'B',
    passedRules: 4,
    warningRules: 1,
    failedRules: 1,
    confidence: 0.8,
    breakdown: { items: [], totalWeight: 100 },
    ...overrides,
  };
}

function makeTechnicalScore(overrides: Partial<TechnicalScore> = {}): TechnicalScore {
  return {
    score: 70,
    grade: 'B',
    confidence: 0.75,
    ruleBreakdown: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeConfluence(overrides: Partial<ConfluenceResult> = {}): ConfluenceResult {
  return {
    confluenceScore: 72,
    agreement: 'HIGH',
    financialAlignment: { score: 75, direction: 'bullish', confidence: 0.8, factors: [] },
    technicalAlignment: { score: 70, direction: 'bullish', confidence: 0.75, factors: [] },
    smartMoneyAlignment: { score: 65, direction: 'bullish', confidence: 0.7, factors: [] },
    trendAlignment: { score: 68, direction: 'bullish', confidence: 0.8, factors: [] },
    confidence: 0.75,
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<CandidateInput> = {}): CandidateInput {
  return {
    symbol: 'THYAO',
    financialScore: makeFinancialScore(),
    technicalScore: makeTechnicalScore(),
    confluence: makeConfluence(),
    ...overrides,
  };
}

describe('CandidateEngine', () => {
  let engine: CandidateEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateEngine],
    }).compile();
    engine = module.get(CandidateEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('excellent candidate', () => {
    it('should produce VERY_HIGH priority for strong inputs', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 92, grade: 'A+', passedRules: 5, failedRules: 0, confidence: 0.95 }),
        technicalScore: makeTechnicalScore({ score: 88, grade: 'A+', confidence: 0.9 }),
        confluence: makeConfluence({ confluenceScore: 90, agreement: 'VERY_HIGH', confidence: 0.92 }),
      }));
      expect(result.candidate).toBe(true);
      expect(result.priority).toBe('VERY_HIGH');
      expect(result.candidateScore).toBeGreaterThan(85);
      expect(result.confidence).toBeGreaterThan(0.85);
    });
  });

  describe('average candidate', () => {
    it('should produce MEDIUM priority for moderate inputs', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 65, passedRules: 3, failedRules: 2, confidence: 0.6 }),
        technicalScore: makeTechnicalScore({ score: 58, confidence: 0.55 }),
        confluence: makeConfluence({ confluenceScore: 60, confidence: 0.6 }),
      }));
      expect(result.candidate).toBe(true);
      expect(result.priority).toBe('MEDIUM');
      expect(result.candidateScore).toBeGreaterThan(50);
      expect(result.candidateScore).toBeLessThan(75);
    });
  });

  describe('rejected candidate', () => {
    it('should reject when all scores are below minimums', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 30, passedRules: 1, failedRules: 4, confidence: 0.3 }),
        technicalScore: makeTechnicalScore({ score: 25, confidence: 0.2 }),
        confluence: makeConfluence({ confluenceScore: 30, confidence: 0.25 }),
      }));
      expect(result.candidate).toBe(false);
      expect(result.priority).toBe('REJECT');
      expect(result.candidateScore).toBeLessThan(40);
    });

    it('should reject when financial fails criteria', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 30, passedRules: 1, failedRules: 5, confidence: 0.3 }),
        technicalScore: makeTechnicalScore({ score: 75, confidence: 0.8 }),
        confluence: makeConfluence({ confluenceScore: 70, confidence: 0.7 }),
      }));
      expect(result.candidate).toBe(false);
      expect(result.reasons.some((r) => r.includes('Financial'))).toBe(true);
    });
  });

  describe('strong financial', () => {
    it('should weight financial score in candidate score', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 95, grade: 'A+', passedRules: 6, failedRules: 0, confidence: 0.95 }),
        technicalScore: makeTechnicalScore({ score: 50, confidence: 0.5 }),
        confluence: makeConfluence({ confluenceScore: 60, confidence: 0.6 }),
      }));
      expect(result.candidate).toBe(true);
      expect(result.candidateScore).toBeGreaterThan(60);
      expect((result.metadata as Record<string, Record<string, boolean>>).financial.passed).toBe(true);
    });
  });

  describe('strong technical', () => {
    it('should weight technical score in candidate score', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 55, passedRules: 2, failedRules: 3, confidence: 0.5 }),
        technicalScore: makeTechnicalScore({ score: 90, grade: 'A+', confidence: 0.9 }),
        confluence: makeConfluence({ confluenceScore: 65, confidence: 0.65 }),
      }));
      expect(result.candidate).toBe(true);
      expect(result.candidateScore).toBeGreaterThan(60);
      expect((result.metadata as Record<string, Record<string, boolean>>).technical.passed).toBe(true);
    });
  });

  describe('low confidence', () => {
    it('should reduce overall confidence when inputs have low confidence', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ confidence: 0.2 }),
        technicalScore: makeTechnicalScore({ confidence: 0.15 }),
        confluence: makeConfluence({ confidence: 0.2 }),
      }));
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should fail confluence criteria when confluence confidence is low', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 80, confidence: 0.9 }),
        technicalScore: makeTechnicalScore({ score: 80, confidence: 0.9 }),
        confluence: makeConfluence({ confluenceScore: 70, confidence: 0.1 }),
      }));
      expect(result.reasons.some((r) => r.includes('Confluence') && r.includes('below'))).toBe(true);
    });
  });

  describe('missing inputs', () => {
    it('should handle zero financial score', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 0, passedRules: 0, failedRules: 6, confidence: 0 }),
      }));
      expect(result.candidate).toBe(false);
      expect((result.metadata as Record<string, Record<string, boolean>>).financial.passed).toBe(false);
    });

    it('should handle zero technical score', () => {
      const result = engine.evaluate(makeInput({
        technicalScore: makeTechnicalScore({ score: 0, confidence: 0 }),
      }));
      expect((result.metadata as Record<string, Record<string, boolean>>).technical.passed).toBe(false);
    });

    it('should handle invalid confluence', () => {
      const result = engine.evaluate(makeInput({
        confluence: makeConfluence({ confluenceScore: 0, confidence: 0, isValid: false }),
      }));
      expect((result.metadata as Record<string, Record<string, boolean>>).confluence.passed).toBe(false);
    });
  });

  describe('priority levels', () => {
    it('should assign HIGH priority for scores 70-84', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 80, passedRules: 4, confidence: 0.8 }),
        technicalScore: makeTechnicalScore({ score: 78, confidence: 0.75 }),
        confluence: makeConfluence({ confluenceScore: 75, confidence: 0.8 }),
      }));
      expect(result.priority).toBe('HIGH');
      expect(result.candidate).toBe(true);
    });

    it('should assign LOW priority for scores 40-54', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 51, passedRules: 2, failedRules: 3, confidence: 0.45 }),
        technicalScore: makeTechnicalScore({ score: 50, confidence: 0.35 }),
        confluence: makeConfluence({ confluenceScore: 48, confidence: 0.4 }),
      }));
      expect(result.priority).toBe('LOW');
      expect(result.candidate).toBe(true);
    });
  });

  describe('reasons', () => {
    it('should include reasons for all dimensions', () => {
      const result = engine.evaluate(makeInput());
      expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    });

    it('should include positive reason when financial passes', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 80, passedRules: 4, confidence: 0.8 }),
      }));
      expect(result.reasons.some((r) => r.includes('Financial quality meets'))).toBe(true);
    });

    it('should include negative reason when financial fails', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 30, passedRules: 1, failedRules: 5, confidence: 0.3 }),
      }));
      expect(result.reasons.some((r) => r.includes('Financial quality below'))).toBe(true);
    });

    it('should include strong score reason for high candidates', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 90, passedRules: 5, confidence: 0.9 }),
        technicalScore: makeTechnicalScore({ score: 85, confidence: 0.9 }),
        confluence: makeConfluence({ confluenceScore: 88, confidence: 0.9 }),
      }));
      expect(result.reasons.some((r) => r.includes('Strong overall'))).toBe(true);
    });

    it('should include low score reason for rejected candidates', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 30, passedRules: 1, failedRules: 5, confidence: 0.3 }),
        technicalScore: makeTechnicalScore({ score: 25, confidence: 0.2 }),
        confluence: makeConfluence({ confluenceScore: 30, confidence: 0.25 }),
      }));
      expect(result.reasons.some((r) => r.includes('Overall score too low'))).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include symbol in metadata', () => {
      const result = engine.evaluate(makeInput({ symbol: 'GARAN' }));
      expect((result.metadata as Record<string, unknown>).symbol).toBe('GARAN');
    });

    it('should include financial, technical, confluence evaluations', () => {
      const result = engine.evaluate(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.financial).toBeDefined();
      expect(meta.technical).toBeDefined();
      expect(meta.confluence).toBeDefined();
    });
  });

  describe('candidateScore calculation', () => {
    it('should weight confluence highest (40%)', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 50, confidence: 0.5 }),
        technicalScore: makeTechnicalScore({ score: 50, confidence: 0.5 }),
        confluence: makeConfluence({ confluenceScore: 90, confidence: 0.9 }),
      }));
      expect(result.candidateScore).toBeGreaterThan(60);
    });

    it('should weight financial and technical equally (30% each)', () => {
      const result1 = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 90, confidence: 0.9 }),
        technicalScore: makeTechnicalScore({ score: 50, confidence: 0.5 }),
        confluence: makeConfluence({ confluenceScore: 70, confidence: 0.7 }),
      }));
      const result2 = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 50, confidence: 0.5 }),
        technicalScore: makeTechnicalScore({ score: 90, confidence: 0.9 }),
        confluence: makeConfluence({ confluenceScore: 70, confidence: 0.7 }),
      }));
      expect(Math.abs(result1.candidateScore - result2.candidateScore)).toBeLessThan(1);
    });
  });

  describe('isValid', () => {
    it('should always return true', () => {
      const result = engine.evaluate(makeInput());
      expect(result.isValid).toBe(true);
    });
  });
});
