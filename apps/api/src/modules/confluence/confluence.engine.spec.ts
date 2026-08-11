import { Test, TestingModule } from '@nestjs/testing';
import { ConfluenceEngine } from './confluence.engine';
import { ConfluenceInput } from './confluence.engine';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { FinancialSummary } from '../financial-rules/summary.types';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { TechnicalSummary } from '../technical-summary/technical-summary.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';

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

function makeFinancialSummary(overrides: Partial<FinancialSummary> = {}): FinancialSummary {
  return {
    summary: 'Healthy financials',
    strengths: ['Strong profit growth'],
    weaknesses: ['Moderate debt'],
    risks: [],
    positives: [],
    overallOpinion: 'Positive',
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

function makeTechnicalSummary(overrides: Partial<TechnicalSummary> = {}): TechnicalSummary {
  return {
    timeframe: '1d',
    summary: 'Mixed technicals',
    overallOpinion: 'Neutral',
    strengths: ['Bullish EMA'],
    weaknesses: ['Weak volume'],
    risks: [],
    recommendations: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeSmartMoney(overrides: Partial<SmartMoneyResult> = {}): SmartMoneyResult {
  return {
    timeframe: '1d',
    accumulationScore: 0.6,
    distributionScore: 0.4,
    institutionalActivity: 'accumulating',
    smartMoneyConfidence: 0.7,
    trendAlignment: 'uptrend',
    signals: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeMarketStructure(overrides: Partial<MarketStructureResult> = {}): MarketStructureResult {
  return {
    timeframe: '1d',
    trend: 'uptrend',
    structure: [],
    swingHighs: [],
    swingLows: [],
    supportZones: [],
    resistanceZones: [],
    breakOfStructure: [],
    changeOfCharacter: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ConfluenceInput> = {}): ConfluenceInput {
  return {
    financialScore: makeFinancialScore(),
    financialSummary: makeFinancialSummary(),
    technicalScore: makeTechnicalScore(),
    technicalSummary: makeTechnicalSummary(),
    smartMoney: makeSmartMoney(),
    marketStructure: makeMarketStructure(),
    ...overrides,
  };
}

describe('ConfluenceEngine', () => {
  let engine: ConfluenceEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfluenceEngine],
    }).compile();
    engine = module.get(ConfluenceEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('bullish agreement', () => {
    it('should produce VERY_HIGH agreement when all dimensions are bullish', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 85, grade: 'A', confidence: 0.9 }),
        technicalScore: makeTechnicalScore({ score: 85, grade: 'A', confidence: 0.9 }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'accumulating', smartMoneyConfidence: 0.9 }),
        marketStructure: makeMarketStructure({ trend: 'uptrend' }),
      }));
      expect(result.confluenceScore).toBeGreaterThan(75);
      expect(result.agreement).toBe('VERY_HIGH');
      expect(result.financialAlignment.direction).toBe('bullish');
      expect(result.technicalAlignment.direction).toBe('bullish');
      expect(result.smartMoneyAlignment.direction).toBe('bullish');
      expect(result.trendAlignment.direction).toBe('bullish');
      expect(result.isValid).toBe(true);
    });
  });

  describe('bearish agreement', () => {
    it('should produce bearish alignment when all dimensions are bearish', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 20, grade: 'D', passedRules: 1, failedRules: 4, confidence: 0.7 }),
        technicalScore: makeTechnicalScore({ score: 20, grade: 'D', confidence: 0.7 }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'distributing', smartMoneyConfidence: 0.7 }),
        marketStructure: makeMarketStructure({ trend: 'downtrend' }),
      }));
      expect(result.confluenceScore).toBeLessThan(35);
      expect(result.financialAlignment.direction).toBe('bearish');
      expect(result.technicalAlignment.direction).toBe('bearish');
      expect(result.smartMoneyAlignment.direction).toBe('bearish');
      expect(result.trendAlignment.direction).toBe('bearish');
    });
  });

  describe('mixed agreement', () => {
    it('should produce lower agreement when dimensions disagree', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 85, grade: 'A', confidence: 0.9 }),
        technicalScore: makeTechnicalScore({ score: 20, grade: 'D', confidence: 0.8 }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'neutral', smartMoneyConfidence: 0.5 }),
        marketStructure: makeMarketStructure({ trend: 'sideways' }),
      }));
      expect(result.confluenceScore).toBeGreaterThan(35);
      expect(result.confluenceScore).toBeLessThan(70);
      expect(result.financialAlignment.direction).toBe('bullish');
      expect(result.technicalAlignment.direction).toBe('bearish');
    });
  });

  describe('weak financial / strong technical', () => {
    it('should weight technical higher when financial is weak', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 30, grade: 'D', passedRules: 1, failedRules: 4, confidence: 0.6 }),
        technicalScore: makeTechnicalScore({ score: 85, grade: 'A', confidence: 0.9 }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'accumulating', smartMoneyConfidence: 0.8 }),
        marketStructure: makeMarketStructure({ trend: 'uptrend' }),
      }));
      expect(result.technicalAlignment.score).toBeGreaterThan(result.financialAlignment.score);
      expect(result.confluenceScore).toBeGreaterThan(40);
    });
  });

  describe('strong financial / weak technical', () => {
    it('should weight financial higher when technical is weak', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 90, grade: 'A+', confidence: 0.95 }),
        technicalScore: makeTechnicalScore({ score: 25, grade: 'D', confidence: 0.5 }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'distributing', smartMoneyConfidence: 0.4 }),
        marketStructure: makeMarketStructure({ trend: 'downtrend' }),
      }));
      expect(result.financialAlignment.score).toBeGreaterThan(result.technicalAlignment.score);
      expect(result.confluenceScore).toBeGreaterThan(30);
    });
  });

  describe('low confidence', () => {
    it('should reflect low confidence when inputs have low confidence', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ confidence: 0.3 }),
        technicalScore: makeTechnicalScore({ confidence: 0.2 }),
        smartMoney: makeSmartMoney({ smartMoneyConfidence: 0.1 }),
        marketStructure: makeMarketStructure({ isValid: false }),
      }));
      expect(result.confidence).toBeLessThan(0.4);
    });
  });

  describe('missing modules', () => {
    it('should handle invalid market structure', () => {
      const result = engine.evaluate(makeInput({
        marketStructure: makeMarketStructure({ isValid: false, trend: 'sideways' }),
      }));
      expect(result.trendAlignment.confidence).toBe(0.2);
      expect(result.isValid).toBe(true);
    });

    it('should handle invalid smart money', () => {
      const result = engine.evaluate(makeInput({
        smartMoney: makeSmartMoney({ isValid: false, smartMoneyConfidence: 0 }),
      }));
      expect(result.smartMoneyAlignment.confidence).toBe(0);
      expect(result.isValid).toBe(true);
    });
  });

  describe('confidence calculation', () => {
    it('should compute weighted confidence from all inputs', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ confidence: 1.0 }),
        technicalScore: makeTechnicalScore({ confidence: 1.0 }),
        smartMoney: makeSmartMoney({ smartMoneyConfidence: 1.0 }),
        marketStructure: makeMarketStructure({ isValid: true }),
      }));
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should reduce confidence when data is missing', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ confidence: 0.5 }),
        technicalScore: makeTechnicalScore({ confidence: 0.5 }),
        smartMoney: makeSmartMoney({ smartMoneyConfidence: 0.5 }),
        marketStructure: makeMarketStructure({ isValid: false }),
      }));
      expect(result.confidence).toBeLessThan(0.6);
    });
  });

  describe('alignment scores', () => {
    it('should return alignment score between 0 and 100', () => {
      const result = engine.evaluate(makeInput());
      expect(result.financialAlignment.score).toBeGreaterThanOrEqual(0);
      expect(result.financialAlignment.score).toBeLessThanOrEqual(100);
      expect(result.technicalAlignment.score).toBeGreaterThanOrEqual(0);
      expect(result.technicalAlignment.score).toBeLessThanOrEqual(100);
      expect(result.smartMoneyAlignment.score).toBeGreaterThanOrEqual(0);
      expect(result.smartMoneyAlignment.score).toBeLessThanOrEqual(100);
      expect(result.trendAlignment.score).toBeGreaterThanOrEqual(0);
      expect(result.trendAlignment.score).toBeLessThanOrEqual(100);
    });

    it('should include factors in each alignment', () => {
      const result = engine.evaluate(makeInput());
      expect(result.financialAlignment.factors).toBeInstanceOf(Array);
      expect(result.technicalAlignment.factors).toBeInstanceOf(Array);
      expect(result.smartMoneyAlignment.factors).toBeInstanceOf(Array);
      expect(result.trendAlignment.factors).toBeInstanceOf(Array);
    });
  });

  describe('metadata', () => {
    it('should include config weights in metadata', () => {
      const result = engine.evaluate(makeInput());
      const weights = result.metadata.configWeights as Record<string, number>;
      expect(weights).toBeDefined();
      expect(weights.financial).toBe(25);
      expect(weights.technical).toBe(30);
    });

    it('should include input symbol in metadata', () => {
      const result = engine.evaluate(makeInput());
      expect(result.metadata.inputSymbol as string).toBe('THYAO');
    });

    it('should include available data count in metadata', () => {
      const result = engine.evaluate(makeInput());
      expect(result.metadata.availableData as number).toBe(4);
    });
  });

  describe('confluence score', () => {
    it('should return confluence score between 0 and 100', () => {
      const result = engine.evaluate(makeInput());
      expect(result.confluenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confluenceScore).toBeLessThanOrEqual(100);
    });

    it('should be higher for bullish inputs than bearish inputs', () => {
      const bullish = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 90, grade: 'A+' }),
        technicalScore: makeTechnicalScore({ score: 90, grade: 'A+' }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'accumulating' }),
        marketStructure: makeMarketStructure({ trend: 'uptrend' }),
      }));

      const bearish = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ score: 15, grade: 'D', passedRules: 1, failedRules: 5 }),
        technicalScore: makeTechnicalScore({ score: 15, grade: 'D' }),
        smartMoney: makeSmartMoney({ institutionalActivity: 'distributing' }),
        marketStructure: makeMarketStructure({ trend: 'downtrend' }),
      }));

      expect(bullish.confluenceScore).toBeGreaterThan(bearish.confluenceScore);
    });
  });

  describe('smart money direction', () => {
    it('should be bullish when accumulating', () => {
      const result = engine.evaluate(makeInput({
        smartMoney: makeSmartMoney({ institutionalActivity: 'accumulating', accumulationScore: 0.9 }),
      }));
      expect(result.smartMoneyAlignment.direction).toBe('bullish');
    });

    it('should be bearish when distributing', () => {
      const result = engine.evaluate(makeInput({
        smartMoney: makeSmartMoney({ institutionalActivity: 'distributing', distributionScore: 0.9 }),
      }));
      expect(result.smartMoneyAlignment.direction).toBe('bearish');
    });

    it('should be neutral when neutral', () => {
      const result = engine.evaluate(makeInput({
        smartMoney: makeSmartMoney({ institutionalActivity: 'neutral' }),
      }));
      expect(result.smartMoneyAlignment.direction).toBe('neutral');
    });
  });

  describe('trend direction', () => {
    it('should be bullish for uptrend', () => {
      const result = engine.evaluate(makeInput({
        marketStructure: makeMarketStructure({ trend: 'uptrend' }),
      }));
      expect(result.trendAlignment.direction).toBe('bullish');
    });

    it('should be bearish for downtrend', () => {
      const result = engine.evaluate(makeInput({
        marketStructure: makeMarketStructure({ trend: 'downtrend' }),
      }));
      expect(result.trendAlignment.direction).toBe('bearish');
    });

    it('should be neutral for sideways', () => {
      const result = engine.evaluate(makeInput({
        marketStructure: makeMarketStructure({ trend: 'sideways' }),
      }));
      expect(result.trendAlignment.direction).toBe('neutral');
    });

    it('should boost score for bullish structure breaks', () => {
      const withBos = engine.evaluate(makeInput({
        marketStructure: makeMarketStructure({
          trend: 'uptrend',
          breakOfStructure: [{ index: 10, price: 100, timestamp: '2025-01-01', type: 'HH', brokenSwing: { index: 5, price: 95, timestamp: '2025-01-01', type: 'high' } }],
        }),
      }));
      const withoutBos = engine.evaluate(makeInput({
        marketStructure: makeMarketStructure({ trend: 'uptrend' }),
      }));
      expect(withBos.trendAlignment.score).toBeGreaterThanOrEqual(withoutBos.trendAlignment.score);
    });
  });

  describe('financial factors', () => {
    it('should include passed rules factor when more passed', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ passedRules: 5, failedRules: 1 }),
      }));
      expect(result.financialAlignment.factors.some((f) => f.includes('passed'))).toBe(true);
    });

    it('should include failed rules factor when more failed', () => {
      const result = engine.evaluate(makeInput({
        financialScore: makeFinancialScore({ passedRules: 1, failedRules: 5 }),
      }));
      expect(result.financialAlignment.factors.some((f) => f.includes('failed'))).toBe(true);
    });

    it('should include strengths factor when more strengths', () => {
      const result = engine.evaluate(makeInput({
        financialSummary: makeFinancialSummary({ strengths: ['A', 'B', 'C'], weaknesses: ['X'] }),
      }));
      expect(result.financialAlignment.factors.some((f) => f.includes('strengths'))).toBe(true);
    });
  });

  describe('technical factors', () => {
    it('should include grade factor for A/A+', () => {
      const result = engine.evaluate(makeInput({
        technicalScore: makeTechnicalScore({ grade: 'A+' }),
      }));
      expect(result.technicalAlignment.factors.some((f) => f.includes('A+'))).toBe(true);
    });

    it('should include grade factor for C/D', () => {
      const result = engine.evaluate(makeInput({
        technicalScore: makeTechnicalScore({ grade: 'D' }),
      }));
      expect(result.technicalAlignment.factors.some((f) => f.includes('D'))).toBe(true);
    });
  });
});
