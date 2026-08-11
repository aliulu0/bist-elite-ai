import { EliteScoreEngine, EliteScoreInput } from './elite-score.engine';
import { EliteScoreResult } from './elite-score.types';
import { OpportunityResult } from '../opportunity/opportunity.types';
import { CandidateResult, CandidatePriority } from '../candidate/candidate.types';
import { ConfluenceResult, AgreementLevel } from '../confluence/confluence.types';
import { FinancialScoreResult, ScoreGrade } from '../financial-rules/score.types';
import { TechnicalScore, TechnicalGrade } from '../technical-score/technical-score.types';

function makeOpportunity(overrides?: Partial<OpportunityResult>): OpportunityResult {
  return {
    opportunityScore: 72,
    earlyOpportunity: true,
    opportunityLevel: 'HIGH',
    confidence: 0.7,
    strengths: ['Strong confluence'],
    riskFactors: [],
    reasons: ['Early opportunity detected'],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeCandidate(overrides?: Partial<CandidateResult>): CandidateResult {
  return {
    candidate: true,
    candidateScore: 72,
    priority: 'HIGH',
    reasons: [],
    confidence: 0.7,
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeConfluence(overrides?: Partial<ConfluenceResult>): ConfluenceResult {
  return {
    confluenceScore: 68,
    agreement: 'HIGH',
    financialAlignment: { score: 70, direction: 'bullish', confidence: 0.7, factors: [] },
    technicalAlignment: { score: 65, direction: 'bullish', confidence: 0.65, factors: [] },
    smartMoneyAlignment: { score: 60, direction: 'bullish', confidence: 0.6, factors: [] },
    trendAlignment: { score: 72, direction: 'bullish', confidence: 0.7, factors: [] },
    confidence: 0.65,
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeFinancialScore(overrides?: Partial<FinancialScoreResult>): FinancialScoreResult {
  return {
    symbol: 'TEST',
    score: 72,
    grade: 'B',
    passedRules: 4,
    warningRules: 1,
    failedRules: 1,
    confidence: 0.7,
    breakdown: { items: [], totalWeight: 0 },
    ...overrides,
  };
}

function makeTechnicalScore(overrides?: Partial<TechnicalScore>): TechnicalScore {
  return {
    score: 65,
    grade: 'B',
    confidence: 0.6,
    ruleBreakdown: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeInput(overrides?: Partial<EliteScoreInput>): EliteScoreInput {
  return {
    symbol: 'TEST',
    opportunity: makeOpportunity(),
    candidate: makeCandidate(),
    confluence: makeConfluence(),
    financialScore: makeFinancialScore(),
    technicalScore: makeTechnicalScore(),
    ...overrides,
  };
}

describe('EliteScoreEngine', () => {
  let engine: EliteScoreEngine;

  beforeEach(() => {
    engine = new EliteScoreEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('AAA scenario', () => {
    it('should produce AAA rating for excellent inputs', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 95, earlyOpportunity: true }),
        candidate: makeCandidate({ candidateScore: 92, priority: 'VERY_HIGH', confidence: 0.9 }),
        confluence: makeConfluence({ confluenceScore: 90, agreement: 'VERY_HIGH', confidence: 0.9 }),
        financialScore: makeFinancialScore({ score: 95, grade: 'A+', passedRules: 6, failedRules: 0, confidence: 0.95 }),
        technicalScore: makeTechnicalScore({ score: 92, grade: 'A+', confidence: 0.9 }),
      }));
      expect(result.rating).toBe('AAA');
      expect(result.eliteScore).toBeGreaterThanOrEqual(90);
      expect(result.priority).toBe('CRITICAL');
    });
  });

  describe('AA scenario', () => {
    it('should produce AA rating for strong inputs', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 85, earlyOpportunity: true }),
        candidate: makeCandidate({ candidateScore: 82, priority: 'VERY_HIGH', confidence: 0.8 }),
        confluence: makeConfluence({ confluenceScore: 82, agreement: 'HIGH', confidence: 0.8 }),
        financialScore: makeFinancialScore({ score: 85, grade: 'A', passedRules: 5, failedRules: 1, confidence: 0.8 }),
        technicalScore: makeTechnicalScore({ score: 82, grade: 'A', confidence: 0.8 }),
      }));
      expect(result.rating).toBe('AA');
      expect(result.eliteScore).toBeGreaterThanOrEqual(80);
      expect(result.priority).toBe('VERY_HIGH');
    });
  });

  describe('rejected opportunity', () => {
    it('should return NONE priority when opportunity is not valid', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ isValid: false }),
      }));
      expect(result.isValid).toBe(false);
      expect(result.priority).toBe('NONE');
      expect(result.eliteScore).toBe(0);
    });

    it('should return NONE priority when candidate is rejected', () => {
      const result = engine.evaluate(makeInput({
        candidate: makeCandidate({ candidate: false, priority: 'REJECT', candidateScore: 10 }),
        opportunity: makeOpportunity({ earlyOpportunity: false, opportunityLevel: 'NONE', opportunityScore: 15 }),
      }));
      expect(result.eliteScore).toBeLessThan(50);
      expect(result.priority).not.toBe('CRITICAL');
    });
  });

  describe('low confidence', () => {
    it('should have low confidence when inputs are low confidence', () => {
      const result = engine.evaluate(makeInput({
        candidate: makeCandidate({ confidence: 0.2 }),
        confluence: makeConfluence({ confidence: 0.2 }),
        financialScore: makeFinancialScore({ confidence: 0.2 }),
        technicalScore: makeTechnicalScore({ confidence: 0.2 }),
      }));
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should have high confidence when inputs are high confidence', () => {
      const result = engine.evaluate(makeInput({
        candidate: makeCandidate({ confidence: 0.9 }),
        confluence: makeConfluence({ confidence: 0.9 }),
        financialScore: makeFinancialScore({ confidence: 0.9 }),
        technicalScore: makeTechnicalScore({ confidence: 0.9 }),
      }));
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should not set earlyOpportunity when confidence is below threshold', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ earlyOpportunity: true }),
        candidate: makeCandidate({ confidence: 0.1 }),
        confluence: makeConfluence({ confidence: 0.1 }),
        financialScore: makeFinancialScore({ confidence: 0.1 }),
        technicalScore: makeTechnicalScore({ confidence: 0.1 }),
      }));
      expect(result.earlyOpportunity).toBe(false);
    });
  });

  describe('missing modules', () => {
    it('should return invalid when opportunity is missing', () => {
      const result = engine.evaluate(makeInput({ opportunity: undefined as any }));
      expect(result.isValid).toBe(false);
      expect(result.priority).toBe('NONE');
    });

    it('should return invalid when candidate is missing', () => {
      const result = engine.evaluate(makeInput({ candidate: undefined as any }));
      expect(result.isValid).toBe(false);
    });

    it('should return invalid when financialScore is missing', () => {
      const result = engine.evaluate(makeInput({ financialScore: undefined as any }));
      expect(result.isValid).toBe(false);
    });

    it('should return invalid when technicalScore is missing', () => {
      const result = engine.evaluate(makeInput({ technicalScore: undefined as any }));
      expect(result.isValid).toBe(false);
    });
  });

  describe('breakdown validation', () => {
    it('should include all five dimensions in breakdown', () => {
      const result = engine.evaluate(makeInput());
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.financial).toBeDefined();
      expect(result.breakdown.technical).toBeDefined();
      expect(result.breakdown.opportunity).toBeDefined();
      expect(result.breakdown.confluence).toBeDefined();
      expect(result.breakdown.candidate).toBeDefined();
    });

    it('should have correct weights in breakdown', () => {
      const result = engine.evaluate(makeInput());
      expect(result.breakdown.financial.weight).toBe(25);
      expect(result.breakdown.technical.weight).toBe(25);
      expect(result.breakdown.opportunity.weight).toBe(20);
      expect(result.breakdown.confluence.weight).toBe(15);
      expect(result.breakdown.candidate.weight).toBe(15);
    });

    it('should calculate contributions correctly', () => {
      const result = engine.evaluate(makeInput());
      const b = result.breakdown;
      const expectedFinancial = Math.round(72 * 25 / 100 * 100) / 100;
      expect(b.financial.contribution).toBeCloseTo(expectedFinancial, 1);
    });

    it('should have score between 0 and 100 for each dimension', () => {
      const result = engine.evaluate(makeInput());
      for (const dim of Object.values(result.breakdown)) {
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('priority validation', () => {
    it('should assign CRITICAL for eliteScore >= 90', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 95 }),
        candidate: makeCandidate({ candidateScore: 92 }),
        confluence: makeConfluence({ confluenceScore: 90 }),
        financialScore: makeFinancialScore({ score: 95 }),
        technicalScore: makeTechnicalScore({ score: 92 }),
      }));
      expect(result.priority).toBe('CRITICAL');
    });

    it('should assign VERY_HIGH for eliteScore 80-89', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 85 }),
        candidate: makeCandidate({ candidateScore: 82 }),
        confluence: makeConfluence({ confluenceScore: 82 }),
        financialScore: makeFinancialScore({ score: 85 }),
        technicalScore: makeTechnicalScore({ score: 82 }),
      }));
      expect(result.priority).toBe('VERY_HIGH');
    });

    it('should assign HIGH for eliteScore 70-79', () => {
      const result = engine.evaluate(makeInput());
      expect(result.priority).toBe('HIGH');
    });

    it('should assign MEDIUM for eliteScore 55-69', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 58 }),
        candidate: makeCandidate({ candidateScore: 55 }),
        confluence: makeConfluence({ confluenceScore: 55 }),
        financialScore: makeFinancialScore({ score: 58 }),
        technicalScore: makeTechnicalScore({ score: 55 }),
      }));
      expect(result.priority).toBe('MEDIUM');
    });

    it('should assign LOW for eliteScore 40-54', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 45 }),
        candidate: makeCandidate({ candidateScore: 42 }),
        confluence: makeConfluence({ confluenceScore: 42 }),
        financialScore: makeFinancialScore({ score: 45 }),
        technicalScore: makeTechnicalScore({ score: 42 }),
      }));
      expect(result.priority).toBe('LOW');
    });

    it('should assign NONE for eliteScore < 40', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 30, earlyOpportunity: false, opportunityLevel: 'NONE' }),
        candidate: makeCandidate({ candidateScore: 25, priority: 'REJECT' }),
        confluence: makeConfluence({ confluenceScore: 25, agreement: 'VERY_LOW' }),
        financialScore: makeFinancialScore({ score: 30, passedRules: 1, failedRules: 4 }),
        technicalScore: makeTechnicalScore({ score: 25 }),
      }));
      expect(result.priority).toBe('NONE');
    });
  });

  describe('summary', () => {
    it('should include rating and score in summary', () => {
      const result = engine.evaluate(makeInput());
      expect(result.summary).toContain('Elite score');
      expect(result.summary).toContain('/100');
    });

    it('should include priority in summary when not NONE', () => {
      const result = engine.evaluate(makeInput());
      if (result.priority !== 'NONE') {
        expect(result.summary).toContain('Priority:');
      }
    });

    it('should include confidence percentage in summary', () => {
      const result = engine.evaluate(makeInput());
      expect(result.summary).toContain('%');
    });

    it('should include early opportunity text when applicable', () => {
      const result = engine.evaluate(makeInput());
      if (result.earlyOpportunity) {
        expect(result.summary).toContain('Early opportunity');
      }
    });

    it('should show not recommended for NONE priority', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ earlyOpportunity: false, opportunityLevel: 'NONE', opportunityScore: 10 }),
        candidate: makeCandidate({ candidate: false, priority: 'REJECT', candidateScore: 10 }),
        confluence: makeConfluence({ confluenceScore: 10, agreement: 'VERY_LOW' }),
        financialScore: makeFinancialScore({ score: 10, passedRules: 0, failedRules: 5 }),
        technicalScore: makeTechnicalScore({ score: 10 }),
      }));
      expect(result.summary).toContain('Not recommended');
    });
  });

  describe('rating mapping', () => {
    it('should assign A for eliteScore 70-79', () => {
      const result = engine.evaluate(makeInput());
      expect(result.rating).toBe('A');
    });

    it('should assign BBB for eliteScore 60-69', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 62 }),
        candidate: makeCandidate({ candidateScore: 60 }),
        confluence: makeConfluence({ confluenceScore: 60 }),
        financialScore: makeFinancialScore({ score: 62 }),
        technicalScore: makeTechnicalScore({ score: 60 }),
      }));
      expect(result.rating).toBe('BBB');
    });

    it('should assign BB for eliteScore 50-59', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 52 }),
        candidate: makeCandidate({ candidateScore: 50 }),
        confluence: makeConfluence({ confluenceScore: 50 }),
        financialScore: makeFinancialScore({ score: 52 }),
        technicalScore: makeTechnicalScore({ score: 50 }),
      }));
      expect(result.rating).toBe('BB');
    });

    it('should assign D for eliteScore < 30', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 15, earlyOpportunity: false, opportunityLevel: 'NONE' }),
        candidate: makeCandidate({ candidateScore: 10, priority: 'REJECT' }),
        confluence: makeConfluence({ confluenceScore: 10, agreement: 'VERY_LOW' }),
        financialScore: makeFinancialScore({ score: 15, passedRules: 0, failedRules: 5 }),
        technicalScore: makeTechnicalScore({ score: 10 }),
      }));
      expect(result.rating).toBe('D');
    });
  });

  describe('metadata', () => {
    it('should include symbol in metadata', () => {
      const result = engine.evaluate(makeInput({ symbol: 'THYAO' }));
      expect(result.metadata.symbol).toBe('THYAO');
    });

    it('should include all grade information', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ grade: 'A+' }),
        technicalScore: makeTechnicalScore({ grade: 'A' }),
      }));
      expect(result.metadata.financialGrade).toBe('A+');
      expect(result.metadata.technicalGrade).toBe('A');
    });

    it('should include opportunity and candidate info', () => {
      const result = engine.evaluate(makeInput({
        candidate: makeCandidate({ priority: 'VERY_HIGH' }),
        opportunity: makeOpportunity({ opportunityLevel: 'HIGH' }),
        confluence: makeConfluence({ agreement: 'MEDIUM' }),
      }));
      expect(result.metadata.candidatePriority).toBe('VERY_HIGH');
      expect(result.metadata.opportunityLevel).toBe('HIGH');
      expect(result.metadata.confluenceAgreement).toBe('MEDIUM');
    });
  });

  describe('edge cases', () => {
    it('should handle zero scores', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 0, earlyOpportunity: false, opportunityLevel: 'NONE' }),
        candidate: makeCandidate({ candidateScore: 0, priority: 'REJECT', confidence: 0 }),
        confluence: makeConfluence({ confluenceScore: 0, agreement: 'VERY_LOW', confidence: 0 }),
        financialScore: makeFinancialScore({ score: 0, passedRules: 0, failedRules: 6, confidence: 0 }),
        technicalScore: makeTechnicalScore({ score: 0, confidence: 0 }),
      }));
      expect(result.eliteScore).toBe(0);
      expect(result.rating).toBe('D');
    });

    it('should cap scores at 100', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: 150 }),
        candidate: makeCandidate({ candidateScore: 150 }),
        confluence: makeConfluence({ confluenceScore: 150 }),
        financialScore: makeFinancialScore({ score: 150 }),
        technicalScore: makeTechnicalScore({ score: 150 }),
      }));
      expect(result.eliteScore).toBeLessThanOrEqual(100);
      for (const dim of Object.values(result.breakdown)) {
        expect(dim.score).toBeLessThanOrEqual(100);
      }
    });

    it('should handle negative scores gracefully', () => {
      const result = engine.evaluate(makeInput({
        opportunity: makeOpportunity({ opportunityScore: -10 }),
        candidate: makeCandidate({ candidateScore: -5 }),
        financialScore: makeFinancialScore({ score: -20 }),
        technicalScore: makeTechnicalScore({ score: -15 }),
      }));
      expect(result.eliteScore).toBeGreaterThanOrEqual(0);
    });

    it('should produce consistent results for same inputs', () => {
      const input = makeInput();
      const r1 = engine.evaluate(input);
      const r2 = engine.evaluate(input);
      expect(r1.eliteScore).toBe(r2.eliteScore);
      expect(r1.rating).toBe(r2.rating);
      expect(r1.priority).toBe(r2.priority);
    });
  });
});
