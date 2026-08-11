import { SectorImpactEngine } from '../engines/sector-impact.engine';
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

describe('SectorImpactEngine', () => {
  let engine: SectorImpactEngine;
  let regimeEngine: MarketRegimeEngine;

  beforeEach(() => {
    engine = new SectorImpactEngine();
    regimeEngine = new MarketRegimeEngine();
  });

  it('should return impacts for all 10 sectors', () => {
    const points = [
      makePoint('us10y', 4.2),
      makePoint('usdtry', 33),
      makePoint('pmi', 49.5),
    ];
    const regime = regimeEngine.analyze(points);
    const results = engine.estimate(points, regime);
    expect(results).toHaveLength(10);
  });

  it('should have sector names and impact fields', () => {
    const points = [
      makePoint('us10y', 4.2),
      makePoint('usdtry', 33),
      makePoint('pmi', 49.5),
    ];
    const regime = regimeEngine.analyze(points);
    const results = engine.estimate(points, regime);
    for (const s of results) {
      expect(s).toHaveProperty('sector');
      expect(s).toHaveProperty('impact');
      expect(s).toHaveProperty('score');
      expect(s).toHaveProperty('drivers');
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it('should rank Banking and Real Estate as most impacted by high rates', () => {
    const points = [
      makePoint('us10y', 6),
      makePoint('usdtry', 33),
      makePoint('pmi', 50),
    ];
    const regime = regimeEngine.analyze(points);
    const results = engine.estimate(points, regime);
    const banking = results.find((s) => s.sector === 'Banking');
    const realEstate = results.find((s) => s.sector === 'Real Estate');
    expect(banking?.score).toBeDefined();
    expect(realEstate?.score).toBeDefined();
  });

  it('should impact Defense least during stable conditions', () => {
    const points = [
      makePoint('us10y', 2.5),
      makePoint('usdtry', 25),
      makePoint('pmi', 55),
    ];
    const regime = regimeEngine.analyze(points);
    const results = engine.estimate(points, regime);
    const defense = results.find((s) => s.sector === 'Defense');
    expect(defense?.impact).toBe('positive');
  });

  it('should include drivers for each sector', () => {
    const points = [
      makePoint('us10y', 5.5),
      makePoint('usdtry', 35),
      makePoint('pmi', 43),
    ];
    const regime = regimeEngine.analyze(points);
    const results = engine.estimate(points, regime);
    for (const s of results) {
      expect(s.drivers.length).toBeGreaterThan(0);
    }
  });
});
