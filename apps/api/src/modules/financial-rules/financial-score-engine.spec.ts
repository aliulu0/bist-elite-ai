import { Test, TestingModule } from '@nestjs/testing';
import { FinancialScoreEngine } from './financial-score-engine.service';
import { FinancialRulesOutput } from './rule.types';

describe('FinancialScoreEngine', () => {
  let engine: FinancialScoreEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialScoreEngine],
    }).compile();

    engine = module.get(FinancialScoreEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('evaluate', () => {
    const allPassed: FinancialRulesOutput = {
      symbol: 'THYAO',
      rules: [
        { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.2, reason: 'Good' },
        { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'PASS', value: 8, reason: 'Good' },
        { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'PASS', value: 28, reason: 'Good' },
        { id: 'equity_growth', name: 'Equity Growth', status: 'PASS', value: 12.5, reason: 'Good' },
        { id: 'debt_ratio', name: 'Debt Ratio', status: 'PASS', value: 0.36, reason: 'Good' },
        { id: 'sector_comparison', name: 'Sector Comparison', status: 'PASS', value: null, reason: 'Good' },
      ],
    };

    const allFailed: FinancialRulesOutput = {
      symbol: 'KCHOL',
      rules: [
        { id: 'price_to_book', name: 'Price/Book', status: 'FAIL', value: 5.0, reason: 'High' },
        { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'FAIL', value: 20, reason: 'High' },
        { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'FAIL', value: -10, reason: 'Negative' },
        { id: 'equity_growth', name: 'Equity Growth', status: 'FAIL', value: -5, reason: 'Negative' },
        { id: 'debt_ratio', name: 'Debt Ratio', status: 'FAIL', value: 0.85, reason: 'High' },
        { id: 'sector_comparison', name: 'Sector Comparison', status: 'FAIL', value: null, reason: 'Far' },
      ],
    };

    const allWarning: FinancialRulesOutput = {
      symbol: 'GARAN',
      rules: [
        { id: 'price_to_book', name: 'Price/Book', status: 'WARNING', value: 2.5, reason: 'Moderate' },
        { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'WARNING', value: 12, reason: 'Moderate' },
        { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'WARNING', value: null, reason: 'Missing' },
        { id: 'equity_growth', name: 'Equity Growth', status: 'WARNING', value: null, reason: 'Missing' },
        { id: 'debt_ratio', name: 'Debt Ratio', status: 'WARNING', value: null, reason: 'Missing' },
        { id: 'sector_comparison', name: 'Sector Comparison', status: 'WARNING', value: null, reason: 'Missing' },
      ],
    };

    const mixed: FinancialRulesOutput = {
      symbol: 'ASELS',
      rules: [
        { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.0, reason: 'Good' },
        { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'FAIL', value: 18, reason: 'High' },
        { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'PASS', value: 35, reason: 'Good' },
        { id: 'equity_growth', name: 'Equity Growth', status: 'WARNING', value: 2, reason: 'Low' },
        { id: 'debt_ratio', name: 'Debt Ratio', status: 'PASS', value: 0.3, reason: 'Good' },
        { id: 'sector_comparison', name: 'Sector Comparison', status: 'FAIL', value: null, reason: 'Far' },
      ],
    };

    it('should return correct structure', () => {
      const result = engine.evaluate(allPassed);
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('passedRules');
      expect(result).toHaveProperty('warningRules');
      expect(result).toHaveProperty('failedRules');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('breakdown');
    });

    it('should score 100 with all rules passed', () => {
      const result = engine.evaluate(allPassed);
      expect(result.symbol).toBe('THYAO');
      expect(result.score).toBe(100);
      expect(result.grade).toBe('A+');
      expect(result.passedRules).toBe(6);
      expect(result.warningRules).toBe(0);
      expect(result.failedRules).toBe(0);
    });

    it('should score 0 with all rules failed', () => {
      const result = engine.evaluate(allFailed);
      expect(result.symbol).toBe('KCHOL');
      expect(result.score).toBe(0);
      expect(result.grade).toBe('D');
      expect(result.passedRules).toBe(0);
      expect(result.warningRules).toBe(0);
      expect(result.failedRules).toBe(6);
    });

    it('should score 50 with all rules warning', () => {
      const result = engine.evaluate(allWarning);
      expect(result.symbol).toBe('GARAN');
      expect(result.score).toBe(50);
      expect(result.grade).toBe('D');
      expect(result.passedRules).toBe(0);
      expect(result.warningRules).toBe(6);
      expect(result.failedRules).toBe(0);
    });

    it('should calculate mixed score correctly', () => {
      const result = engine.evaluate(mixed);
      expect(result.symbol).toBe('ASELS');
      expect(result.passedRules).toBe(3);
      expect(result.warningRules).toBe(1);
      expect(result.failedRules).toBe(2);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('should assign grade A+ for score >= 90', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'price_to_book', name: 'P/B', status: 'PASS', value: 1, reason: '' },
          { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'PASS', value: 1, reason: '' },
          { id: 'net_profit_growth', name: 'NPG', status: 'PASS', value: 1, reason: '' },
          { id: 'equity_growth', name: 'EG', status: 'PASS', value: 1, reason: '' },
          { id: 'debt_ratio', name: 'DR', status: 'PASS', value: 1, reason: '' },
          { id: 'sector_comparison', name: 'SC', status: 'WARNING', value: null, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.grade).toBe('A+');
    });

    it('should assign grade A for score 80-89', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'price_to_book', name: 'P/B', status: 'PASS', value: 1, reason: '' },
          { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'PASS', value: 1, reason: '' },
          { id: 'net_profit_growth', name: 'NPG', status: 'PASS', value: 1, reason: '' },
          { id: 'equity_growth', name: 'EG', status: 'PASS', value: 1, reason: '' },
          { id: 'debt_ratio', name: 'DR', status: 'WARNING', value: 1, reason: '' },
          { id: 'sector_comparison', name: 'SC', status: 'FAIL', value: null, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.grade).toBe('A');
    });

    it('should assign grade B for score 70-79', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'price_to_book', name: 'P/B', status: 'PASS', value: 1, reason: '' },
          { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'PASS', value: 1, reason: '' },
          { id: 'net_profit_growth', name: 'NPG', status: 'WARNING', value: 1, reason: '' },
          { id: 'equity_growth', name: 'EG', status: 'WARNING', value: 1, reason: '' },
          { id: 'debt_ratio', name: 'DR', status: 'WARNING', value: 1, reason: '' },
          { id: 'sector_comparison', name: 'SC', status: 'WARNING', value: null, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.grade).toBe('B');
    });

    it('should assign grade C for score 60-69', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'price_to_book', name: 'P/B', status: 'PASS', value: 1, reason: '' },
          { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'WARNING', value: 1, reason: '' },
          { id: 'net_profit_growth', name: 'NPG', status: 'WARNING', value: 1, reason: '' },
          { id: 'equity_growth', name: 'EG', status: 'WARNING', value: 1, reason: '' },
          { id: 'debt_ratio', name: 'DR', status: 'WARNING', value: 1, reason: '' },
          { id: 'sector_comparison', name: 'SC', status: 'WARNING', value: null, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.grade).toBe('C');
    });

    it('should assign grade D for score < 60', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'price_to_book', name: 'P/B', status: 'WARNING', value: 1, reason: '' },
          { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'FAIL', value: 1, reason: '' },
          { id: 'net_profit_growth', name: 'NPG', status: 'FAIL', value: 1, reason: '' },
          { id: 'equity_growth', name: 'EG', status: 'FAIL', value: 1, reason: '' },
          { id: 'debt_ratio', name: 'DR', status: 'FAIL', value: 1, reason: '' },
          { id: 'sector_comparison', name: 'SC', status: 'FAIL', value: null, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.grade).toBe('D');
    });

    it('should calculate confidence based on non-null values', () => {
      const result = engine.evaluate(allPassed);
      expect(result.confidence).toBeCloseTo(5 / 6);
    });

    it('should return 0 confidence when all values are null', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'price_to_book', name: 'P/B', status: 'WARNING', value: null, reason: '' },
          { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'WARNING', value: null, reason: '' },
          { id: 'net_profit_growth', name: 'NPG', status: 'WARNING', value: null, reason: '' },
          { id: 'equity_growth', name: 'EG', status: 'WARNING', value: null, reason: '' },
          { id: 'debt_ratio', name: 'DR', status: 'WARNING', value: null, reason: '' },
          { id: 'sector_comparison', name: 'SC', status: 'WARNING', value: null, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.confidence).toBe(0);
    });

    it('should return 0 confidence when rules array is empty', () => {
      const output: FinancialRulesOutput = { symbol: 'EMPTY', rules: [] };
      const result = engine.evaluate(output);
      expect(result.confidence).toBe(0);
      expect(result.score).toBe(0);
    });

    it('should include full breakdown with items and totalWeight', () => {
      const result = engine.evaluate(allPassed);
      expect(result.breakdown.items).toHaveLength(6);
      expect(result.breakdown.totalWeight).toBe(100);
      result.breakdown.items.forEach((item) => {
        expect(item).toHaveProperty('ruleId');
        expect(item).toHaveProperty('ruleName');
        expect(item).toHaveProperty('weight');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('contribution');
      });
    });

    it('should have correct weight contributions for PASS', () => {
      const result = engine.evaluate(allPassed);
      result.breakdown.items.forEach((item) => {
        expect(item.contribution).toBe(item.weight);
      });
    });

    it('should have 0 contribution for FAIL', () => {
      const result = engine.evaluate(allFailed);
      result.breakdown.items.forEach((item) => {
        expect(item.contribution).toBe(0);
      });
    });

    it('should have half contribution for WARNING', () => {
      const result = engine.evaluate(allWarning);
      result.breakdown.items.forEach((item) => {
        expect(item.contribution).toBeCloseTo(item.weight * 0.5);
      });
    });

    it('should handle unknown rule id with 0 weight', () => {
      const output: FinancialRulesOutput = {
        symbol: 'TEST',
        rules: [
          { id: 'unknown_rule', name: 'Unknown', status: 'PASS', value: 1, reason: '' },
        ],
      };
      const result = engine.evaluate(output);
      expect(result.breakdown.items[0].weight).toBe(0);
      expect(result.breakdown.items[0].contribution).toBe(0);
      expect(result.score).toBe(0);
    });
  });
});
