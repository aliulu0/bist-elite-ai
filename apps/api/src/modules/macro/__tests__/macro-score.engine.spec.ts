import { MacroScoreEngine } from '../engines/macro-score.engine';
import { MacroDataPoint } from '../macro.types';

function makePoint(source: string, value: number, status = 'fetched'): MacroDataPoint {
  return {
    source: source as any,
    value,
    timestamp: new Date().toISOString(),
    status: status as any,
    label: source,
    unit: '',
  };
}

describe('MacroScoreEngine', () => {
  let engine: MacroScoreEngine;

  beforeEach(() => {
    engine = new MacroScoreEngine();
  });

  describe('calculate', () => {
    it('should return a score between 0-100', () => {
      const points = [
        makePoint('tcmb_policy_rate', 50),
        makePoint('fed_rate', 5.5),
        makePoint('ecb_rate', 4.25),
        makePoint('vix', 15),
        makePoint('dxy', 104),
        makePoint('turkey_cds', 320),
        makePoint('inflation', 41.75),
        makePoint('usdtry', 33.2),
        makePoint('pmi', 49.5),
        makePoint('us10y', 4.2),
        makePoint('bist_sector_indices', 12500),
      ];
      const result = engine.calculate(points);
      expect(result.macroScore).toBeGreaterThanOrEqual(0);
      expect(result.macroScore).toBeLessThanOrEqual(100);
    });

    it('should produce favorable score for good conditions', () => {
      const points = [
        makePoint('tcmb_policy_rate', 15),
        makePoint('fed_rate', 2.5),
        makePoint('ecb_rate', 1.5),
        makePoint('vix', 12),
        makePoint('dxy', 98),
        makePoint('turkey_cds', 200),
        makePoint('inflation', 15),
        makePoint('usdtry', 25),
        makePoint('pmi', 55),
        makePoint('us10y', 2.5),
        makePoint('bist_sector_indices', 14000),
      ];
      const result = engine.calculate(points);
      expect(result.macroScore).toBeGreaterThan(70);
    });

    it('should produce poor score for bad conditions', () => {
      const points = [
        makePoint('tcmb_policy_rate', 50),
        makePoint('fed_rate', 6),
        makePoint('ecb_rate', 5),
        makePoint('vix', 35),
        makePoint('dxy', 110),
        makePoint('turkey_cds', 600),
        makePoint('inflation', 75),
        makePoint('usdtry', 40),
        makePoint('pmi', 40),
        makePoint('us10y', 6),
        makePoint('bist_sector_indices', 8000),
      ];
      const result = engine.calculate(points);
      expect(result.macroScore).toBeLessThan(40);
    });

    it('should compute all five component scores', () => {
      const points = [
        makePoint('tcmb_policy_rate', 50),
        makePoint('fed_rate', 5.5),
        makePoint('ecb_rate', 4.25),
        makePoint('vix', 18),
        makePoint('dxy', 104),
        makePoint('turkey_cds', 320),
        makePoint('inflation', 41.75),
        makePoint('usdtry', 33),
        makePoint('pmi', 49.5),
        makePoint('us10y', 4.2),
        makePoint('bist_sector_indices', 12500),
      ];
      const result = engine.calculate(points);
      expect(result.components).toHaveProperty('monetaryPolicy');
      expect(result.components).toHaveProperty('globalRisk');
      expect(result.components).toHaveProperty('domesticRisk');
      expect(result.components).toHaveProperty('growth');
      expect(result.components).toHaveProperty('liquidity');
    });

    it('should calculate confidence based on data availability', () => {
      const points = [
        makePoint('vix', 15, 'fetched'),
        makePoint('dxy', 104, 'fetched'),
        makePoint('us10y', 4.2, 'error'),
      ];
      const result = engine.calculate(points);
      expect(result.confidence).toBe(67);
    });

    it('should return 100% confidence when all points available', () => {
      const points = Array.from({ length: 11 }, (_, i) => makePoint(`src_${i}`, 50));
      const result = engine.calculate(points);
      expect(result.confidence).toBe(100);
    });

    it('should include calculatedAt timestamp', () => {
      const result = engine.calculate([]);
      expect(result.calculatedAt).toBeDefined();
      expect(() => new Date(result.calculatedAt)).not.toThrow();
    });
  });
});
