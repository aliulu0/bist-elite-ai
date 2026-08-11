import { MarketRegimeEngine } from '../engines/market-regime.engine';
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

describe('MarketRegimeEngine', () => {
  let engine: MarketRegimeEngine;

  beforeEach(() => {
    engine = new MarketRegimeEngine();
  });

  describe('analyze', () => {
    it('should return risk_on for low-stress environment', () => {
      const points = [
        makePoint('vix', 12),
        makePoint('dxy', 98),
        makePoint('us10y', 2.5),
        makePoint('turkey_cds', 150),
      ];
      const result = engine.analyze(points);
      expect(result.regime).toBe('risk_on');
      expect(result.score).toBeGreaterThan(70);
    });

    it('should return extreme_risk for high-stress', () => {
      const points = [
        makePoint('vix', 45),
        makePoint('dxy', 108),
        makePoint('us10y', 6),
        makePoint('turkey_cds', 500),
      ];
      const result = engine.analyze(points);
      expect(result.regime).toBe('extreme_risk');
      expect(result.score).toBeLessThan(40);
    });

    it('should return neutral for moderate conditions', () => {
      const points = [
        makePoint('vix', 20),
        makePoint('dxy', 105),
        makePoint('us10y', 4.0),
        makePoint('turkey_cds', 350),
      ];
      const result = engine.analyze(points);
      expect(result.regime).toBe('neutral');
    });

    it('should return risk_off for elevated stress', () => {
      const points = [
        makePoint('vix', 28),
        makePoint('dxy', 107),
        makePoint('us10y', 5.2),
        makePoint('turkey_cds', 450),
      ];
      const result = engine.analyze(points);
      expect(result.regime).toBe('risk_off');
    });

    it('should handle zero values gracefully', () => {
      const points: MacroDataPoint[] = [];
      const result = engine.analyze(points);
      expect(result.score).toBe(97);
      expect(result.regime).toBe('risk_on');
    });

    it('should generate VIX spike signal', () => {
      const points = [
        makePoint('vix', 35),
        makePoint('dxy', 100),
        makePoint('us10y', 3),
        makePoint('turkey_cds', 200),
      ];
      const result = engine.analyze(points);
      expect(result.signals.some((s) => s.includes('VIX'))).toBe(true);
    });

    it('should generate DXY strength signal', () => {
      const points = [
        makePoint('vix', 12),
        makePoint('dxy', 107),
        makePoint('us10y', 3),
        makePoint('turkey_cds', 200),
      ];
      const result = engine.analyze(points);
      expect(result.signals.some((s) => s.includes('DXY'))).toBe(true);
    });

    it('should generate US10Y elevated signal', () => {
      const points = [
        makePoint('vix', 12),
        makePoint('dxy', 100),
        makePoint('us10y', 5.5),
        makePoint('turkey_cds', 200),
      ];
      const result = engine.analyze(points);
      expect(result.signals.some((s) => s.includes('US10Y'))).toBe(true);
    });

    it('should generate CDS elevated signal', () => {
      const points = [
        makePoint('vix', 12),
        makePoint('dxy', 100),
        makePoint('us10y', 3),
        makePoint('turkey_cds', 450),
      ];
      const result = engine.analyze(points);
      expect(result.signals.some((s) => s.includes('CDS'))).toBe(true);
    });

    it('should include analyzedAt timestamp', () => {
      const result = engine.analyze([]);
      expect(result.analyzedAt).toBeDefined();
      expect(() => new Date(result.analyzedAt)).not.toThrow();
    });
  });
});
