import { OpportunityEngine, OpportunityInput } from './opportunity.engine';
import { OpportunityResult } from './opportunity.types';
import { CandidateResult } from '../candidate/candidate.types';
import { ConfluenceResult, AgreementLevel } from '../confluence/confluence.types';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';

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

function makeSmartMoney(overrides?: Partial<SmartMoneyResult>): SmartMoneyResult {
  return {
    timeframe: '1d',
    accumulationScore: 55,
    distributionScore: 20,
    institutionalActivity: 'accumulating',
    smartMoneyConfidence: 0.6,
    trendAlignment: 'uptrend',
    signals: [{ type: 'accumulation', strength: 60, description: 'Accumulation detected' }],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeMarketStructure(overrides?: Partial<MarketStructureResult>): MarketStructureResult {
  return {
    timeframe: '1d',
    trend: 'uptrend',
    structure: [],
    swingHighs: [],
    swingLows: [],
    supportZones: [
      { upper: 100, lower: 95, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
    ],
    resistanceZones: [
      { upper: 115, lower: 110, startIndex: 0, endIndex: 10, touches: 1, timestamps: [] },
    ],
    breakOfStructure: [],
    changeOfCharacter: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeInput(overrides?: Partial<OpportunityInput>): OpportunityInput {
  return {
    symbol: 'TEST',
    candidate: makeCandidate(),
    confluence: makeConfluence(),
    financialScore: makeFinancialScore(),
    technicalScore: makeTechnicalScore(),
    smartMoney: makeSmartMoney(),
    marketStructure: makeMarketStructure(),
    ...overrides,
  };
}

describe('OpportunityEngine', () => {
  let engine: OpportunityEngine;

  beforeEach(() => {
    engine = new OpportunityEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('early opportunity detection', () => {
    it('should detect early opportunity for strong inputs', () => {
      const result = engine.evaluate(makeInput());
      expect(result.isValid).toBe(true);
      expect(result.earlyOpportunity).toBe(true);
      expect(result.opportunityLevel).not.toBe('NONE');
      expect(result.opportunityScore).toBeGreaterThan(0);
    });

    it('should assign VERY_HIGH for excellent scores', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 92,
            passedRules: 5,
            failedRules: 0,
            confidence: 0.9,
          }),
          technicalScore: makeTechnicalScore({ score: 88, confidence: 0.85 }),
          confluence: makeConfluence({
            confluenceScore: 90,
            agreement: 'VERY_HIGH',
            confidence: 0.88,
          }),
          smartMoney: makeSmartMoney({ accumulationScore: 85, smartMoneyConfidence: 0.85 }),
          marketStructure: makeMarketStructure({
            trend: 'uptrend',
            supportZones: [
              { upper: 100, lower: 95, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
            ],
            resistanceZones: [],
          }),
        }),
      );
      expect(result.opportunityLevel).toBe('VERY_HIGH');
      expect(result.opportunityScore).toBeGreaterThanOrEqual(85);
    });

    it('should assign HIGH for good scores', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 75,
            passedRules: 4,
            failedRules: 1,
            confidence: 0.7,
          }),
          technicalScore: makeTechnicalScore({ score: 70, confidence: 0.7 }),
          confluence: makeConfluence({ confluenceScore: 72, agreement: 'HIGH', confidence: 0.7 }),
          smartMoney: makeSmartMoney({ accumulationScore: 60, smartMoneyConfidence: 0.65 }),
          marketStructure: makeMarketStructure({
            trend: 'uptrend',
            supportZones: [
              { upper: 100, lower: 95, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
            ],
            resistanceZones: [],
          }),
        }),
      );
      expect(result.opportunityLevel).toBe('HIGH');
      expect(result.opportunityScore).toBeGreaterThanOrEqual(70);
    });

    it('should assign MEDIUM for moderate scores', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 60,
            passedRules: 3,
            failedRules: 2,
            confidence: 0.55,
          }),
          technicalScore: makeTechnicalScore({ score: 55, confidence: 0.55 }),
          confluence: makeConfluence({
            confluenceScore: 58,
            agreement: 'MEDIUM',
            confidence: 0.55,
          }),
          smartMoney: makeSmartMoney({ accumulationScore: 40, smartMoneyConfidence: 0.5 }),
          marketStructure: makeMarketStructure({
            trend: 'sideways',
            supportZones: [
              { upper: 100, lower: 95, startIndex: 0, endIndex: 10, touches: 1, timestamps: [] },
            ],
            resistanceZones: [
              { upper: 115, lower: 110, startIndex: 0, endIndex: 10, touches: 1, timestamps: [] },
            ],
          }),
        }),
      );
      expect(result.opportunityLevel).toBe('MEDIUM');
      expect(result.opportunityScore).toBeGreaterThanOrEqual(55);
    });

    it('should assign LOW for weak but passing scores', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 52,
            passedRules: 2,
            failedRules: 3,
            confidence: 0.45,
          }),
          technicalScore: makeTechnicalScore({ score: 50, confidence: 0.45 }),
          confluence: makeConfluence({
            confluenceScore: 50,
            agreement: 'MEDIUM',
            confidence: 0.45,
          }),
          smartMoney: makeSmartMoney({ accumulationScore: 35, smartMoneyConfidence: 0.45 }),
          marketStructure: makeMarketStructure({
            trend: 'uptrend',
            supportZones: [
              { upper: 100, lower: 95, startIndex: 0, endIndex: 10, touches: 1, timestamps: [] },
            ],
            resistanceZones: [],
          }),
        }),
      );
      expect(result.opportunityLevel).toBe('LOW');
    });
  });

  describe('no opportunity', () => {
    it('should return NONE when candidate is not a candidate', () => {
      const result = engine.evaluate(
        makeInput({
          candidate: makeCandidate({ candidate: false, priority: 'REJECT', candidateScore: 20 }),
        }),
      );
      expect(result.opportunityLevel).toBe('NONE');
      expect(result.earlyOpportunity).toBe(false);
      expect(result.opportunityScore).toBe(0);
    });

    it('should return NONE when candidate is invalid', () => {
      const result = engine.evaluate(
        makeInput({
          candidate: makeCandidate({ isValid: false }),
        }),
      );
      expect(result.opportunityLevel).toBe('NONE');
      expect(result.earlyOpportunity).toBe(false);
    });

    it('should return NONE for very low scores', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 20,
            passedRules: 0,
            failedRules: 5,
            confidence: 0.2,
          }),
          technicalScore: makeTechnicalScore({ score: 15, confidence: 0.15 }),
          confluence: makeConfluence({
            confluenceScore: 20,
            agreement: 'VERY_LOW',
            confidence: 0.2,
          }),
          smartMoney: makeSmartMoney({
            accumulationScore: 10,
            distributionScore: 80,
            institutionalActivity: 'distributing',
            smartMoneyConfidence: 0.15,
          }),
          marketStructure: makeMarketStructure({
            trend: 'downtrend',
            supportZones: [],
            resistanceZones: [
              { upper: 115, lower: 110, startIndex: 0, endIndex: 10, touches: 3, timestamps: [] },
              { upper: 125, lower: 120, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
              { upper: 135, lower: 130, startIndex: 0, endIndex: 10, touches: 1, timestamps: [] },
            ],
          }),
        }),
      );
      expect(result.opportunityLevel).toBe('NONE');
      expect(result.earlyOpportunity).toBe(false);
    });
  });

  describe('confidence calculation', () => {
    it('should average confidence from all inputs', () => {
      const result = engine.evaluate(makeInput());
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should be lower when inputs have low confidence', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ confidence: 0.2 }),
          technicalScore: makeTechnicalScore({ confidence: 0.2 }),
          confluence: makeConfluence({ confidence: 0.2 }),
          smartMoney: makeSmartMoney({ smartMoneyConfidence: 0.2 }),
        }),
      );
      expect(result.confidence).toBeLessThan(0.4);
    });

    it('should be higher when inputs have high confidence', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ confidence: 0.9 }),
          technicalScore: makeTechnicalScore({ confidence: 0.9 }),
          confluence: makeConfluence({ confidence: 0.9 }),
          smartMoney: makeSmartMoney({ smartMoneyConfidence: 0.9 }),
        }),
      );
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('strengths and risk factors', () => {
    it('should collect strengths from all dimensions', () => {
      const result = engine.evaluate(makeInput());
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it('should collect risk factors when dimensions are weak', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ score: 30, passedRules: 1, failedRules: 4 }),
          technicalScore: makeTechnicalScore({ score: 30 }),
          confluence: makeConfluence({ confluenceScore: 30, agreement: 'LOW' }),
        }),
      );
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });

    it('should include financial strengths when financial score is high', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ score: 80, passedRules: 5, failedRules: 0 }),
        }),
      );
      const financialStrengths = result.strengths.filter((s) => s.includes('financial'));
      expect(financialStrengths.length).toBeGreaterThan(0);
    });

    it('should include financial risk when financial score is low', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ score: 30, passedRules: 0, failedRules: 5 }),
        }),
      );
      const financialRisks = result.riskFactors.filter((r) => r.includes('financial'));
      expect(financialRisks.length).toBeGreaterThan(0);
    });
  });

  describe('reasons', () => {
    it('should include opportunity level in reasons', () => {
      const result = engine.evaluate(makeInput());
      if (result.earlyOpportunity) {
        expect(result.reasons.some((r) => r.includes('Early opportunity'))).toBe(true);
      } else {
        expect(result.reasons.some((r) => r.includes('No early opportunity'))).toBe(true);
      }
    });

    it('should list dimension strengths and risks in reasons', () => {
      const result = engine.evaluate(makeInput());
      if (result.earlyOpportunity) {
        expect(result.reasons.length).toBeGreaterThan(1);
      }
    });

    it('should return no-opportunity reason when not early opportunity', () => {
      const result = engine.evaluate(
        makeInput({
          candidate: makeCandidate({ candidate: false, priority: 'REJECT', candidateScore: 10 }),
        }),
      );
      expect(result.reasons).toContain('Not a candidate — REJECT priority');
    });
  });

  describe('metadata', () => {
    it('should include symbol in metadata', () => {
      const result = engine.evaluate(makeInput({ symbol: 'THYAO' }));
      expect(result.metadata.symbol).toBe('THYAO');
    });

    it('should include candidate score and priority', () => {
      const result = engine.evaluate(makeInput());
      expect(result.metadata.candidateScore).toBe(72);
      expect(result.metadata.candidatePriority).toBe('HIGH');
    });

    it('should include dimension breakdowns', () => {
      const result = engine.evaluate(makeInput());
      expect(result.metadata.dimensions).toBeDefined();
      const dims = result.metadata.dimensions as Record<string, { score: number; weight: number }>;
      expect(dims.financial).toBeDefined();
      expect(dims.technical).toBeDefined();
      expect(dims.confluence).toBeDefined();
      expect(dims.smartMoney).toBeDefined();
      expect(dims.marketStructure).toBeDefined();
    });
  });

  describe('market structure evaluation', () => {
    it('should give higher score for uptrend with support zones', () => {
      const result = engine.evaluate(
        makeInput({
          marketStructure: makeMarketStructure({
            trend: 'uptrend',
            supportZones: [
              { upper: 100, lower: 95, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
            ],
            resistanceZones: [],
          }),
        }),
      );
      const dims = result.metadata.dimensions as Record<string, { score: number }>;
      expect(dims.marketStructure.score).toBeGreaterThanOrEqual(60);
    });

    it('should penalize downtrend', () => {
      const result = engine.evaluate(
        makeInput({
          marketStructure: makeMarketStructure({
            trend: 'downtrend',
            supportZones: [],
            resistanceZones: [
              { upper: 115, lower: 110, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
            ],
          }),
        }),
      );
      const dims = result.metadata.dimensions as Record<string, { score: number }>;
      expect(dims.marketStructure.score).toBeLessThan(50);
    });

    it('should note break of structure as strength', () => {
      const result = engine.evaluate(
        makeInput({
          marketStructure: makeMarketStructure({
            breakOfStructure: [
              {
                index: 5,
                price: 105,
                timestamp: '2025-01-01',
                type: 'HH',
                brokenSwing: { index: 3, price: 100, timestamp: '2025-01-01', type: 'high' },
              },
            ],
          }),
        }),
      );
      expect(result.strengths.some((s) => s.includes('Break of structure'))).toBe(true);
    });
  });

  describe('smart money evaluation', () => {
    it('should give strength for accumulation', () => {
      const result = engine.evaluate(
        makeInput({
          smartMoney: makeSmartMoney({ accumulationScore: 70 }),
        }),
      );
      expect(result.strengths.some((s) => s.includes('Accumulation detected'))).toBe(true);
    });

    it('should give risk for high distribution', () => {
      const result = engine.evaluate(
        makeInput({
          smartMoney: makeSmartMoney({ accumulationScore: 30, distributionScore: 80 }),
        }),
      );
      expect(result.riskFactors.some((r) => r.includes('distribution'))).toBe(true);
    });

    it('should note signals count', () => {
      const result = engine.evaluate(
        makeInput({
          smartMoney: makeSmartMoney({
            signals: [
              { type: 'accumulation', strength: 60, description: 'Accumulation' },
              { type: 'volume_confirmation', strength: 50, description: 'Volume' },
              { type: 'money_flow_confirmation', strength: 40, description: 'Money flow' },
            ],
          }),
        }),
      );
      expect(result.strengths.some((s) => s.includes('3 smart money signals'))).toBe(true);
    });
  });

  describe('confluence evaluation', () => {
    it('should give strength for high agreement', () => {
      const result = engine.evaluate(
        makeInput({
          confluence: makeConfluence({ confluenceScore: 80, agreement: 'VERY_HIGH' }),
        }),
      );
      expect(result.strengths.some((s) => s.includes('Agreement level: VERY_HIGH'))).toBe(true);
    });

    it('should give risk for low agreement', () => {
      const result = engine.evaluate(
        makeInput({
          confluence: makeConfluence({ confluenceScore: 30, agreement: 'LOW' }),
        }),
      );
      expect(result.riskFactors.some((r) => r.includes('Low agreement level'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle missing candidate gracefully', () => {
      const result = engine.evaluate(makeInput({ candidate: undefined as any }));
      expect(result.opportunityLevel).toBe('NONE');
      expect(result.isValid).toBe(true);
    });

    it('should handle zero scores', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 0,
            passedRules: 0,
            failedRules: 6,
            confidence: 0,
          }),
          technicalScore: makeTechnicalScore({ score: 0, confidence: 0, isValid: false }),
          confluence: makeConfluence({ confluenceScore: 0, agreement: 'VERY_LOW', confidence: 0 }),
          smartMoney: makeSmartMoney({
            accumulationScore: 0,
            distributionScore: 90,
            institutionalActivity: 'distributing',
            smartMoneyConfidence: 0,
          }),
          marketStructure: makeMarketStructure({
            trend: 'downtrend',
            supportZones: [],
            resistanceZones: [
              { upper: 115, lower: 110, startIndex: 0, endIndex: 10, touches: 3, timestamps: [] },
              { upper: 125, lower: 120, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] },
              { upper: 135, lower: 130, startIndex: 0, endIndex: 10, touches: 1, timestamps: [] },
            ],
          }),
        }),
      );
      expect(result.isValid).toBe(true);
      expect(result.opportunityScore).toBeLessThan(20);
    });

    it('should cap scores at 100', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ score: 150, passedRules: 10, failedRules: 0 }),
          technicalScore: makeTechnicalScore({ score: 150 }),
          confluence: makeConfluence({ confluenceScore: 150 }),
          smartMoney: makeSmartMoney({ accumulationScore: 150 }),
        }),
      );
      expect(result.opportunityScore).toBeLessThanOrEqual(100);
    });

    it('should handle negative scores gracefully', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({ score: -10 }),
          technicalScore: makeTechnicalScore({ score: -5 }),
        }),
      );
      expect(result.isValid).toBe(true);
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('financial truth semantics (R2-073)', () => {
    it('should exclude UNAVAILABLE financial dimension from the composite score', () => {
      const base = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 20,
            dataStatus: 'UNAVAILABLE',
            isValid: false,
            confidence: 0,
          }),
        }),
      );

      const withFinancial = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 20,
            dataStatus: 'AVAILABLE',
            isValid: true,
            confidence: 0.7,
          }),
        }),
      );

      // With financial excluded, the composite is normalized over the remaining
      // available dimensions (technical 20 + confluence 25 + smartMoney 20 + structure 15 = 80).
      const dims = base.metadata.dimensions as Record<string, { score: number; weight: number }>;
      expect(dims.financial.weight).toBe(0);
      expect(base.riskFactors.some((r) => r.includes('Financial data unavailable'))).toBe(true);

      // Excluding a WEAK financial score must not penalize the composite
      // (absence is not a measured 0).
      expect(base.opportunityScore).toBeGreaterThan(withFinancial.opportunityScore);
    });

    it('should not fabricate a neutral 50 when financial data is unavailable', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            score: 0,
            dataStatus: 'UNAVAILABLE',
            isValid: false,
            confidence: 0,
          }),
        }),
      );
      const dims = result.metadata.dimensions as Record<string, { score: number; weight: number }>;
      expect(dims.financial.score).toBe(0);
      expect(dims.financial.weight).toBe(0);
    });

    it('should exclude UNAVAILABLE financial from confidence averaging', () => {
      const result = engine.evaluate(
        makeInput({
          financialScore: makeFinancialScore({
            dataStatus: 'UNAVAILABLE',
            isValid: false,
            confidence: 0,
          }),
        }),
      );
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
