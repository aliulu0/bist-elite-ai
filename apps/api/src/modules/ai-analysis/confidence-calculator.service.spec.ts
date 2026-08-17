import { ConfidenceCalculator } from './confidence-calculator.service';
import { ModuleResult, PipelineInput } from './ai-analysis.types';
import { AggregatedResult } from '../market-data/aggregation/aggregation.types';
import { Company } from '../market-data/interfaces/unified-domain.types';

function buildMockInput(overrides?: Partial<PipelineInput>): PipelineInput {
  const company: AggregatedResult<Company> = {
    data: {
      symbol: 'THYAO',
      name: 'Turkish Airlines',
      sector: 'Aviation',
      marketCap: 500000000,
      sharesOutstanding: 1000000000,
      currency: 'TRY',
      exchange: 'BIST',
      lastUpdated: new Date().toISOString(),
      source: 'fintables',
    },
    metadata: {
      providersQueried: ['fintables', 'yahoo'],
      providersUsed: ['fintables', 'yahoo'],
      providersFailed: [],
      providerConfidence: { fintables: 90, yahoo: 70 },
      qualityScore: 85,
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'miss',
      aggregationDurationMs: 100,
      validationWarnings: [],
      conflictCount: 0,
      conflicts: [],
    },
  };

  return {
    company,
    ...overrides,
  };
}

describe('ConfidenceCalculator', () => {
  let calculator: ConfidenceCalculator;

  beforeEach(() => {
    calculator = new ConfidenceCalculator();
  });

  describe('calculate', () => {
    it('should return 0 for empty results with no input', () => {
      const input = buildMockInput();
      const score = calculator.calculate([], input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate confidence based on module results', () => {
      const input = buildMockInput();
      const moduleResults: ModuleResult[] = [
        {
          module: 'technical',
          score: 80,
          confidence: 90,
          signals: [],
          strengths: [],
          weaknesses: [],
          risks: [],
          warnings: [],
          metrics: {},
          explanation: '',
          metadata: {},
        },
        {
          module: 'fundamental',
          score: 70,
          confidence: 80,
          signals: [],
          strengths: [],
          weaknesses: [],
          risks: [],
          warnings: [],
          metrics: {},
          explanation: '',
          metadata: {},
        },
      ];
      const score = calculator.calculate(moduleResults, input);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should be different from overall score', () => {
      const input = buildMockInput();
      const moduleResults: ModuleResult[] = [
        {
          module: 'technical',
          score: 80,
          confidence: 90,
          signals: [],
          strengths: [],
          weaknesses: [],
          risks: [],
          warnings: [],
          metrics: {},
          explanation: '',
          metadata: {},
        },
      ];
      const confidence = calculator.calculate(moduleResults, input);
      expect(confidence).not.toBe(80);
    });

    it('should penalize missing data', () => {
      const inputWithNoFinancials = buildMockInput({
        incomeStatement: undefined,
        balanceSheet: undefined,
        cashFlow: undefined,
      });
      const inputWithData = buildMockInput();
      const moduleResults: ModuleResult[] = [
        {
          module: 'technical',
          score: 80,
          confidence: 90,
          signals: [],
          strengths: [],
          weaknesses: [],
          risks: [],
          warnings: [],
          metrics: {},
          explanation: '',
          metadata: {},
        },
      ];

      const scoreWithout = calculator.calculate(moduleResults, inputWithNoFinancials);
      const scoreWith = calculator.calculate(moduleResults, inputWithData);
      expect(scoreWith).toBeGreaterThanOrEqual(scoreWithout);
    });
  });

  describe('calculateFactors', () => {
    it('should return all factor components', () => {
      const input = buildMockInput();
      const factors = calculator.calculateFactors([], input);
      expect(factors).toHaveProperty('aggregationQuality');
      expect(factors).toHaveProperty('providerAgreement');
      expect(factors).toHaveProperty('missingDataPenalty');
      expect(factors).toHaveProperty('dataFreshness');
      expect(factors).toHaveProperty('validationWarningPenalty');
      expect(factors).toHaveProperty('moduleConfidenceAverage');
    });

    it('should score aggregation quality from metadata', () => {
      const input = buildMockInput();
      const metadata = input.company.metadata;
      const factors = calculator.calculateFactors([], input, metadata);
      expect(factors.aggregationQuality).toBe(85);
    });

    it('should score provider agreement', () => {
      const input = buildMockInput();
      const metadata = input.company.metadata;
      const factors = calculator.calculateFactors([], input, metadata);
      expect(factors.providerAgreement).toBe(100);
    });
  });
});
