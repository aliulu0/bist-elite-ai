import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalSummaryGenerator } from './technical-summary.generator';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { TechnicalRuleResult } from '../technical-rules/technical-rules.types';
import { Timeframe } from '../indicators/indicator.types';

function rule(rule: string, status: TechnicalRuleResult['status'], category: TechnicalRuleResult['category'] = 'trend'): TechnicalRuleResult {
  return { rule, category, status, description: `${rule} ${status}`, value: null, metadata: {} };
}

function score(overrides: Partial<TechnicalScore> = {}): TechnicalScore {
  return {
    score: 70,
    grade: 'B',
    confidence: 0.8,
    ruleBreakdown: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

describe('TechnicalSummaryGenerator', () => {
  let gen: TechnicalSummaryGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnicalSummaryGenerator],
    }).compile();
    gen = module.get(TechnicalSummaryGenerator);
  });

  describe('invalid input', () => {
    it('returns invalid summary for invalid score', () => {
      const result = gen.generate(score({ isValid: false }), [], '1d');
      expect(result.isValid).toBe(false);
      expect(result.strengths).toHaveLength(0);
      expect(result.weaknesses).toHaveLength(0);
    });

    it('returns invalid summary for empty rules', () => {
      const result = gen.generate(score(), [], '1d');
      expect(result.isValid).toBe(false);
    });
  });

  describe('strengths', () => {
    it('populates strengths from PASS rules', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('MACD', 'PASS'),
        rule('BOS', 'PASS'),
      ];
      const result = gen.generate(score(), rules, '1d');
      expect(result.strengths.length).toBe(3);
      expect(result.strengths[0]).toContain('EMA');
    });

    it('limits strengths to maxStrengths', () => {
      const rules = Array.from({ length: 8 }, () => rule('EMA_ALIGNMENT', 'PASS'));
      const result = gen.generate(score(), rules, '1d');
      expect(result.strengths.length).toBe(5);
    });

    it('uses fallback text for unknown rules', () => {
      const rules = [rule('UNKNOWN_RULE_X', 'PASS')];
      const result = gen.generate(score(), rules, '1d');
      expect(result.strengths[0]).toContain('UNKNOWN_RULE_X');
    });
  });

  describe('weaknesses', () => {
    it('populates weaknesses from WARNING and FAIL rules', () => {
      const rules = [
        rule('RSI', 'WARNING'),
        rule('MACD', 'FAIL'),
      ];
      const result = gen.generate(score(), rules, '1d');
      expect(result.weaknesses.length).toBe(2);
    });

    it('limits weaknesses to maxWeaknesses', () => {
      const rules = Array.from({ length: 8 }, (_, i) => rule(`R${i}`, 'FAIL'));
      const result = gen.generate(score(), rules, '1d');
      expect(result.weaknesses.length).toBe(5);
    });
  });

  describe('risks', () => {
    it('populates risks from FAIL rules with specific text', () => {
      const rules = [rule('MACD', 'FAIL'), rule('BOS', 'FAIL')];
      const result = gen.generate(score(), rules, '1d');
      expect(result.risks.length).toBe(2);
      expect(result.risks.some((r) => r.includes('Momentum'))).toBe(true);
      expect(result.risks.some((r) => r.includes('reversal'))).toBe(true);
    });

    it('limits risks to maxRisks', () => {
      const rules = Array.from({ length: 6 }, (_, i) => rule(`R${i}`, 'FAIL'));
      const result = gen.generate(score(), rules, '1d');
      expect(result.risks.length).toBe(3);
    });

    it('uses generic risk text for unknown rules', () => {
      const rules = [rule('UNKNOWN_X', 'FAIL')];
      const result = gen.generate(score(), rules, '1d');
      expect(result.risks[0]).toContain('UNKNOWN_X');
      expect(result.risks[0]).toContain('downside risk');
    });
  });

  describe('overallOpinion', () => {
    it('returns strong bullish for A+', () => {
      const result = gen.generate(score({ grade: 'A+' }), [rule('X', 'PASS')], '1d');
      expect(result.overallOpinion).toContain('Strong bullish');
    });

    it('returns bearish for D', () => {
      const result = gen.generate(score({ grade: 'D' }), [rule('X', 'FAIL')], '1d');
      expect(result.overallOpinion).toContain('Bearish');
    });

    it.each(['A', 'B', 'C'] as const)('returns non-empty opinion for grade %s', (g) => {
      const rules = [rule('X', 'PASS')];
      const result = gen.generate(score({ grade: g }), rules, '1d');
      expect(result.overallOpinion).toBeTruthy();
      expect(result.overallOpinion.length).toBeGreaterThan(10);
    });
  });

  describe('recommendations', () => {
    it('recommends momentum riding for A grade', () => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS')];
      const result = gen.generate(score({ grade: 'A' }), rules, '1d');
      expect(result.recommendations.some((r) => r.includes('momentum'))).toBe(true);
    });

    it('recommends reducing exposure for D grade', () => {
      const rules = [rule('MACD', 'FAIL')];
      const result = gen.generate(score({ grade: 'D' }), rules, '1d');
      expect(result.recommendations.some((r) => r.includes('reducing'))).toBe(true);
    });

    it('recommends waiting for confirmation for B grade', () => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS')];
      const result = gen.generate(score({ grade: 'B' }), rules, '1d');
      expect(result.recommendations.some((r) => r.includes('confirmation'))).toBe(true);
    });

    it('adds volume warning when volume rules fail', () => {
      const rules = [rule('RELATIVE_VOLUME', 'FAIL')];
      const result = gen.generate(score({ grade: 'B' }), rules, '1d');
      expect(result.recommendations.some((r) => r.includes('Volume'))).toBe(true);
    });

    it('adds volatility warning when ATR fails', () => {
      const rules = [rule('ATR', 'FAIL')];
      const result = gen.generate(score({ grade: 'B' }), rules, '1d');
      expect(result.recommendations.some((r) => r.includes('Volatility') || r.includes('volatility'))).toBe(true);
    });

    it('limits recommendations to maxRecommendations', () => {
      const rules = [
        rule('RELATIVE_VOLUME', 'FAIL'),
        rule('VOLUME_SPIKE', 'FAIL'),
        rule('ATR', 'FAIL'),
        rule('MACD', 'FAIL'),
      ];
      const result = gen.generate(score({ grade: 'D' }), rules, '1d');
      expect(result.recommendations.length).toBe(3);
    });
  });

  describe('summary line', () => {
    it('includes grade and score', () => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS')];
      const result = gen.generate(score({ score: 85, grade: 'A+' }), rules, '1d');
      expect(result.summary).toContain('A+');
      expect(result.summary).toContain('85');
    });

    it('includes pass/warning/fail counts', () => {
      const rules = [
        rule('EMA', 'PASS'), rule('MACD', 'PASS'),
        rule('RSI', 'WARNING'),
        rule('BOS', 'FAIL'),
      ];
      const result = gen.generate(score(), rules, '1d');
      expect(result.summary).toContain('2 rules passing');
      expect(result.summary).toContain('1 warning');
      expect(result.summary).toContain('1 failing');
    });
  });

  describe('metadata', () => {
    it('includes grade, score, confidence, counts', () => {
      const rules = [
        rule('EMA', 'PASS'), rule('RSI', 'FAIL'),
      ];
      const result = gen.generate(score({ score: 60, confidence: 0.75 }), rules, '1d');
      expect(result.metadata.grade).toBe('B');
      expect(result.metadata.score).toBe(60);
      expect(result.metadata.confidence).toBe(0.75);
      expect(result.metadata.passCount).toBe(1);
      expect(result.metadata.failCount).toBe(1);
      expect(result.metadata.warningCount).toBe(0);
    });
  });

  describe('all timeframes', () => {
    it.each(['4h', '1d', '1w', '1m', '3m', '6m'] as const)('supports %s', (tf) => {
      const rules = [rule('EMA_ALIGNMENT', 'PASS')];
      const result = gen.generate(score(), rules, tf);
      expect(result.timeframe).toBe(tf);
      expect(result.isValid).toBe(true);
    });
  });

  describe('mixed scenarios', () => {
    it('all PASS rules produce only strengths', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'PASS'),
        rule('MACD', 'PASS'),
        rule('HH', 'PASS'),
      ];
      const result = gen.generate(score(), rules, '1d');
      expect(result.strengths.length).toBe(3);
      expect(result.weaknesses.length).toBe(0);
      expect(result.risks.length).toBe(0);
    });

    it('all FAIL rules produce only weaknesses and risks', () => {
      const rules = [
        rule('EMA_ALIGNMENT', 'FAIL'),
        rule('MACD', 'FAIL'),
      ];
      const result = gen.generate(score(), rules, '1d');
      expect(result.strengths.length).toBe(0);
      expect(result.weaknesses.length).toBe(2);
      expect(result.risks.length).toBe(2);
    });
  });
});
