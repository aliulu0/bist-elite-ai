import { SelfLearningEngine } from '../self-learning/self-learning.engine';

describe('SelfLearningEngine', () => {
  let engine: SelfLearningEngine;

  beforeEach(() => {
    engine = new SelfLearningEngine();
  });

  describe('computeModifier', () => {
    it('boosts modifier when realized win rate exceeds predicted bullish', () => {
      const { modifier, rationale } = engine.computeModifier(60, 0.85);
      expect(modifier).toBeGreaterThan(1);
      expect(modifier).toBe(1.125);
      expect(rationale).toContain('daha yüksek');
    });

    it('reduces modifier when realized win rate is below predicted bullish', () => {
      const { modifier, rationale } = engine.computeModifier(90, 0.5);
      expect(modifier).toBeLessThan(1);
      expect(modifier).toBeCloseTo(0.85, 5);
      expect(rationale).toContain('daha düşük');
    });

    it('keeps modifier at 1 when realized matches predicted', () => {
      const { modifier, rationale } = engine.computeModifier(70, 0.7);
      expect(modifier).toBe(1);
      expect(rationale).toContain('uyumlu');
    });

    it('acceptizes realized win rate in 0-100 range', () => {
      const { modifier } = engine.computeModifier(60, 85);
      expect(modifier).toBe(1.125);
    });

    it('clamps modifier between 0.85 and 1.15', () => {
      const high = engine.computeModifier(10, 1.0);
      const low = engine.computeModifier(100, 0.0);
      expect(high.modifier).toBeLessThanOrEqual(1.15);
      expect(low.modifier).toBeGreaterThanOrEqual(0.85);
    });

    it('handles NaN gracefully', () => {
      const { modifier } = engine.computeModifier(NaN, NaN);
      expect(modifier).toBe(1);
    });
  });

  describe('adjustScore', () => {
    it('scales score by modifier and clamps to 0-100', () => {
      expect(engine.adjustScore(80, 1.15)).toBe(92);
      expect(engine.adjustScore(80, 0.85)).toBe(68);
      expect(engine.adjustScore(90, 1.15)).toBe(100);
      expect(engine.adjustScore(-5, 1.1)).toBe(0);
      expect(engine.adjustScore(200, 0.5)).toBe(100);
    });
  });

  describe('rankByAdjusted', () => {
    it('sorts by score * modifier descending (modifier can boost below base score)', () => {
      const scored = [
        { ticker: 'A', score: 85 },
        { ticker: 'B', score: 90 },
        { ticker: 'C', score: 80 },
      ];
      const modifiers = new Map([['A', 1.15], ['B', 1.0], ['C', 1.0]]);
      const ranked = engine.rankByAdjusted(scored, modifiers);
      expect(ranked.map((r) => r.ticker)).toEqual(['A', 'B', 'C']);
      expect(ranked[0].adjustedScore).toBe(98);
    });

    it('returns empty for empty input', () => {
      expect(engine.rankByAdjusted([], new Map()).length).toBe(0);
    });
  });

  describe('confidenceDelta', () => {
    it('returns the absolute deviation between predicted and realized as 0-100', () => {
      expect(engine.confidenceDelta(80, 0.6)).toBe(20);
      expect(engine.confidenceDelta(60, 0.6)).toBe(0);
      expect(engine.confidenceDelta(100, 1.0)).toBe(0);
    });
  });
});
