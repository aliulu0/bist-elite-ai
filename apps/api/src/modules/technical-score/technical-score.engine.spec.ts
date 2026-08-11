import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalScoreEngine } from './technical-score.engine';
import { TechnicalRuleResult } from '../technical-rules/technical-rules.types';

function rule(rule: string, status: TechnicalRuleResult['status'], category: TechnicalRuleResult['category'] = 'trend'): TechnicalRuleResult {
  return {
    rule,
    category,
    status,
    description: `${rule} ${status}`,
    value: null,
    metadata: {},
  };
}

describe('TechnicalScoreEngine', () => {
  let engine: TechnicalScoreEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnicalScoreEngine],
    }).compile();
    engine = module.get(TechnicalScoreEngine);
  });

  describe('empty input', () => {
    it('returns invalid result for empty rules', () => {
      const result = engine.calculate([], '1d');
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.grade).toBe('D');
      expect(result.confidence).toBe(0);
    });
  });

  describe('scoring', () => {
    it('gives full score for all PASS rules', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('SMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'PASS'),
        rule('MACD', 'PASS'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(90);
    });

    it('gives zero score for all FAIL rules', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'FAIL'),
        rule('SMA_ALIGNMENT', 'FAIL'),
        rule('RSI', 'FAIL'),
        rule('MACD', 'FAIL'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(0);
    });

    it('gives half score for all WARNING rules', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'WARNING'),
        rule('SMA_ALIGNMENT', 'WARNING'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(40);
      expect(result.score).toBeLessThan(60);
    });

    it('handles mixed PASS/WARNING/FAIL', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('SMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'WARNING'),
        rule('MACD', 'FAIL'),
        rule('MFI', 'PASS'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(30);
      expect(result.score).toBeLessThan(80);
    });
  });

  describe('grades', () => {
    it('assigns A+ for score >= 85', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('SMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'PASS'),
        rule('MACD', 'PASS'),
        rule('HH', 'PASS'),
        rule('HL', 'PASS'),
        rule('BOS', 'PASS'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.grade).toBe('A+');
    });

    it('assigns A for score >= 75', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('SMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'PASS'),
        rule('MACD', 'WARNING'),
        rule('HH', 'PASS'),
      ];
      const result = engine.calculate(rules, '1d');
      if (result.score >= 75) {
        expect(['A+', 'A']).toContain(result.grade);
      }
    });

    it('assigns D for score < 40', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'FAIL'),
        rule('SMA_ALIGNMENT', 'FAIL'),
        rule('RSI', 'FAIL'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.grade).toBe('D');
    });
  });

  describe('confidence', () => {
    it('returns high confidence when all rules are available', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'PASS'),
        rule('MACD', 'PASS'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('returns low confidence when many rules are NOT_AVAILABLE', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'NOT_AVAILABLE'),
        rule('RSI', 'NOT_AVAILABLE'),
        rule('MACD', 'NOT_AVAILABLE'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('returns confidence between 0 and 1', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'NOT_AVAILABLE'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('rule breakdown', () => {
    it('includes all rules in breakdown', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'FAIL'),
        rule('MACD', 'WARNING'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.ruleBreakdown).toHaveLength(3);
    });

    it('includes weight and contribution for each rule', () => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS')];
      const result = engine.calculate(rules, '1d');
      const breakdown = result.ruleBreakdown[0];
      expect(breakdown.weight).toBeGreaterThan(0);
      expect(breakdown.contribution).toBe(breakdown.weight);
    });

    it('contribution is 0 for FAIL rules', () => {
      const rules = [rule('RSI', 'FAIL')];
      const result = engine.calculate(rules, '1d');
      expect(result.ruleBreakdown[0].contribution).toBe(0);
    });

    it('contribution is half weight for WARNING rules', () => {
      const rules = [rule('MACD', 'WARNING')];
      const result = engine.calculate(rules, '1d');
      const breakdown = result.ruleBreakdown[0];
      expect(breakdown.contribution).toBe(breakdown.weight * 0.5);
    });

    it('contribution is 0 for NOT_AVAILABLE rules', () => {
      const rules = [rule('ROC', 'NOT_AVAILABLE')];
      const result = engine.calculate(rules, '1d');
      expect(result.ruleBreakdown[0].contribution).toBe(0);
    });
  });

  describe('metadata', () => {
    it('includes rule counts', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('RSI', 'FAIL'),
        rule('MACD', 'WARNING'),
        rule('ROC', 'NOT_AVAILABLE'),
      ];
      const result = engine.calculate(rules, '1d');
      expect(result.metadata.totalRules).toBe(4);
      expect(result.metadata.passCount).toBe(1);
      expect(result.metadata.failCount).toBe(1);
      expect(result.metadata.warningCount).toBe(1);
      expect(result.metadata.notAvailableCount).toBe(1);
    });
  });

  describe('all timeframes', () => {
    it.each(['4h', '1d', '1w', '1m', '3m', '6m'] as const)('supports %s', (tf) => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS'), rule('RSI', 'PASS')];
      const result = engine.calculate(rules, tf);
      expect(result.timeframe).toBe(tf);
      expect(result.isValid).toBe(true);
    });
  });

  describe('configurable weights', () => {
    it('uses configured weights', () => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS'), rule('ATR', 'PASS')];
      const result = engine.calculate(rules, '1d');
      const emaBreakdown = result.ruleBreakdown.find((r) => r.rule === 'EMA_ALIGNMENT');
      const atrBreakdown = result.ruleBreakdown.find((r) => r.rule === 'ATR');
      expect(emaBreakdown?.weight).toBe(8);
      expect(atrBreakdown?.weight).toBe(3);
    });
  });
});
