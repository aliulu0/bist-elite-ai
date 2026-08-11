import { Test, TestingModule } from '@nestjs/testing';
import { FinancialSummaryGenerator } from './financial-summary-generator.service';
import { FinancialScoreResult } from './score.types';
import { RuleResult } from './rule.types';

describe('FinancialSummaryGenerator', () => {
  let generator: FinancialSummaryGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialSummaryGenerator],
    }).compile();

    generator = module.get(FinancialSummaryGenerator);
  });

  it('should be defined', () => {
    expect(generator).toBeDefined();
  });

  const makeScore = (overrides: Partial<FinancialScoreResult> = {}): FinancialScoreResult => ({
    symbol: 'THYAO',
    score: 100,
    grade: 'A+',
    passedRules: 6,
    warningRules: 0,
    failedRules: 0,
    confidence: 0.83,
    breakdown: { items: [], totalWeight: 100 },
    ...overrides,
  });

  const allPassRules: RuleResult[] = [
    { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.2, reason: 'Good' },
    { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'PASS', value: 8.0, reason: 'Good' },
    { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'PASS', value: 28, reason: 'Good' },
    { id: 'equity_growth', name: 'Equity Growth', status: 'PASS', value: 12.5, reason: 'Good' },
    { id: 'debt_ratio', name: 'Debt Ratio', status: 'PASS', value: 0.36, reason: 'Good' },
    { id: 'sector_comparison', name: 'Sector Comparison', status: 'PASS', value: null, reason: 'Good' },
  ];

  const allFailRules: RuleResult[] = [
    { id: 'price_to_book', name: 'Price/Book', status: 'FAIL', value: 5.0, reason: 'High' },
    { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'FAIL', value: 20.0, reason: 'High' },
    { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'FAIL', value: -10, reason: 'Decline' },
    { id: 'equity_growth', name: 'Equity Growth', status: 'FAIL', value: -5, reason: 'Decline' },
    { id: 'debt_ratio', name: 'Debt Ratio', status: 'FAIL', value: 0.85, reason: 'High' },
    { id: 'sector_comparison', name: 'Sector Comparison', status: 'FAIL', value: null, reason: 'Far' },
  ];

  const allWarningRules: RuleResult[] = [
    { id: 'price_to_book', name: 'Price/Book', status: 'WARNING', value: 2.5, reason: 'Moderate' },
    { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'WARNING', value: 12.0, reason: 'Moderate' },
    { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'WARNING', value: null, reason: 'Missing' },
    { id: 'equity_growth', name: 'Equity Growth', status: 'WARNING', value: null, reason: 'Missing' },
    { id: 'debt_ratio', name: 'Debt Ratio', status: 'WARNING', value: null, reason: 'Missing' },
    { id: 'sector_comparison', name: 'Sector Comparison', status: 'WARNING', value: null, reason: 'Missing' },
  ];

  const mixedRules: RuleResult[] = [
    { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.0, reason: 'Good' },
    { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'FAIL', value: 18.0, reason: 'High' },
    { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'PASS', value: 35, reason: 'Good' },
    { id: 'equity_growth', name: 'Equity Growth', status: 'WARNING', value: 2.0, reason: 'Low' },
    { id: 'debt_ratio', name: 'Debt Ratio', status: 'PASS', value: 0.3, reason: 'Good' },
    { id: 'sector_comparison', name: 'Sector Comparison', status: 'FAIL', value: null, reason: 'Far' },
  ];

  describe('generate — all pass', () => {
    it('should have strengths and no weaknesses or risks', () => {
      const result = generator.generate(makeScore(), allPassRules);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.weaknesses).toHaveLength(0);
      expect(result.risks).toHaveLength(0);
      expect(result.positives.length).toBeGreaterThan(0);
    });

    it('should include grade in summary', () => {
      const result = generator.generate(makeScore(), allPassRules);
      expect(result.summary).toContain('A+');
    });

    it('should include score in summary', () => {
      const result = generator.generate(makeScore(), allPassRules);
      expect(result.summary).toContain('100/100');
    });

    it('should mention all rules passed', () => {
      const result = generator.generate(makeScore(), allPassRules);
      expect(result.summary).toContain('6 rule(s) passed');
    });

    it('should have positive overall opinion', () => {
      const result = generator.generate(makeScore(), allPassRules);
      expect(result.overallOpinion).toContain('excellent');
    });
  });

  describe('generate — all fail', () => {
    it('should have risks and no strengths', () => {
      const score = makeScore({ score: 0, grade: 'D', passedRules: 0, failedRules: 6 });
      const result = generator.generate(score, allFailRules);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.strengths).toHaveLength(0);
      expect(result.positives).toHaveLength(0);
    });

    it('should mention multiple concerning metrics', () => {
      const score = makeScore({ score: 0, grade: 'D', passedRules: 0, failedRules: 6 });
      const result = generator.generate(score, allFailRules);
      expect(result.summary).toContain('concerning');
    });

    it('should have poor overall opinion', () => {
      const score = makeScore({ score: 0, grade: 'D', passedRules: 0, failedRules: 6 });
      const result = generator.generate(score, allFailRules);
      expect(result.overallOpinion).toContain('poor');
    });
  });

  describe('generate — all warning', () => {
    it('should have weaknesses and no strengths or risks', () => {
      const score = makeScore({ score: 50, grade: 'D', passedRules: 0, warningRules: 6, failedRules: 0 });
      const result = generator.generate(score, allWarningRules);
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.strengths).toHaveLength(0);
      expect(result.risks).toHaveLength(0);
    });

    it('should mention no critical issues', () => {
      const score = makeScore({ score: 50, grade: 'D', passedRules: 0, warningRules: 6, failedRules: 0 });
      const result = generator.generate(score, allWarningRules);
      expect(result.summary).toContain('No critical issues');
    });
  });

  describe('generate — mixed results', () => {
    it('should have strengths, weaknesses, and risks', () => {
      const score = makeScore({ score: 55, grade: 'D', passedRules: 3, warningRules: 1, failedRules: 2 });
      const result = generator.generate(score, mixedRules);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should mention some metrics require evaluation', () => {
      const score = makeScore({ score: 55, grade: 'D', passedRules: 3, warningRules: 1, failedRules: 2 });
      const result = generator.generate(score, mixedRules);
      expect(result.summary).toContain('careful evaluation');
    });
  });

  describe('generate — empty rules', () => {
    it('should return empty arrays', () => {
      const score = makeScore({ score: 0, grade: 'D', passedRules: 0, warningRules: 0, failedRules: 0 });
      const result = generator.generate(score, []);
      expect(result.strengths).toHaveLength(0);
      expect(result.weaknesses).toHaveLength(0);
      expect(result.risks).toHaveLength(0);
      expect(result.positives).toHaveLength(0);
    });
  });

  describe('generate — unknown rule IDs', () => {
    it('should skip unknown rules', () => {
      const rules: RuleResult[] = [
        { id: 'unknown_rule', name: 'Unknown', status: 'PASS', value: 1, reason: '' },
        { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.2, reason: 'Good' },
      ];
      const result = generator.generate(makeScore(), rules);
      expect(result.strengths).toHaveLength(1);
      expect(result.strengths[0]).toContain('Price/Book');
    });
  });

  describe('value formatting', () => {
    it('should format debt_ratio as percentage', () => {
      const rules: RuleResult[] = [
        { id: 'debt_ratio', name: 'Debt Ratio', status: 'PASS', value: 0.36, reason: '' },
      ];
      const result = generator.generate(makeScore(), rules);
      expect(result.strengths[0]).toContain('36.0%');
    });

    it('should format growth rates as percentages', () => {
      const rules: RuleResult[] = [
        { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'PASS', value: 28, reason: '' },
      ];
      const result = generator.generate(makeScore(), rules);
      expect(result.strengths[0]).toContain('28.0%');
    });

    it('should format ratios with x suffix', () => {
      const rules: RuleResult[] = [
        { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.2, reason: '' },
      ];
      const result = generator.generate(makeScore(), rules);
      expect(result.strengths[0]).toContain('1.2x');
    });

    it('should not include value when null', () => {
      const rules: RuleResult[] = [
        { id: 'sector_comparison', name: 'Sector Comparison', status: 'PASS', value: null, reason: '' },
      ];
      const result = generator.generate(makeScore(), rules);
      expect(result.strengths[0]).not.toContain('x');
      expect(result.strengths[0]).not.toContain('%');
    });
  });

  describe('determinism', () => {
    it('should produce identical output for identical input', () => {
      const score = makeScore({ score: 65, grade: 'C', passedRules: 2, warningRules: 2, failedRules: 2 });
      const result1 = generator.generate(score, mixedRules);
      const result2 = generator.generate(score, mixedRules);
      expect(result1).toEqual(result2);
    });

    it('should produce identical output across many runs', () => {
      const results = Array.from({ length: 50 }, () =>
        generator.generate(makeScore(), mixedRules),
      );
      const first = results[0];
      results.forEach((r) => expect(r).toEqual(first));
    });
  });

  describe('overall opinion by grade', () => {
    it('should return healthy opinion for grade A', () => {
      const score = makeScore({ score: 85, grade: 'A' });
      const result = generator.generate(score, allPassRules);
      expect(result.overallOpinion).toContain('healthy');
    });

    it('should return acceptable opinion for grade B', () => {
      const score = makeScore({ score: 75, grade: 'B' });
      const result = generator.generate(score, allPassRules);
      expect(result.overallOpinion).toContain('acceptable');
    });

    it('should return weak opinion for grade C', () => {
      const score = makeScore({ score: 65, grade: 'C' });
      const result = generator.generate(score, allPassRules);
      expect(result.overallOpinion).toContain('weak');
    });
  });
});
