import { CombinedConfidenceEngine } from '../engines/combined-confidence.engine';

describe('CombinedConfidenceEngine', () => {
  let engine: CombinedConfidenceEngine;

  beforeEach(() => {
    engine = new CombinedConfidenceEngine();
  });

  describe('calculate', () => {
    it('should combine elite and macro scores with default weights (0.6/0.4)', () => {
      const result = engine.calculate(80, 60);
      expect(result.combined).toBe(72); // 80*0.6 + 60*0.4 = 48 + 24 = 72
      expect(result.weightElite).toBe(0.6);
      expect(result.weightMacro).toBe(0.4);
    });

    it('should accept custom weights', () => {
      const result = engine.calculate(80, 60, 0.5, 0.5);
      expect(result.combined).toBe(70);
      expect(result.weightElite).toBe(0.5);
      expect(result.weightMacro).toBe(0.5);
    });

    it('should handle extreme scores', () => {
      const result = engine.calculate(100, 100);
      expect(result.combined).toBe(100);
    });

    it('should handle zero scores', () => {
      const result = engine.calculate(0, 0);
      expect(result.combined).toBe(0);
    });

    it('should preserve the elite score in output', () => {
      const result = engine.calculate(85, 40);
      expect(result.eliteScore).toBe(85);
    });

    it('should preserve the macro score in output', () => {
      const result = engine.calculate(85, 40);
      expect(result.macroScore).toBe(40);
    });

    it('should include calculatedAt timestamp', () => {
      const result = engine.calculate(50, 50);
      expect(result.calculatedAt).toBeDefined();
      expect(() => new Date(result.calculatedAt)).not.toThrow();
    });
  });
});
