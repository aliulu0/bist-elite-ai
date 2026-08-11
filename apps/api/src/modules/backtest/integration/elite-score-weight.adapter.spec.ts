import { EliteScoreWeightAdapter } from './elite-score-weight.adapter';
import { stubResult } from '../backtest-test-helpers';
import { DEFAULT_SCORE_WEIGHTS } from '../../scoring/score-weights';
import { ScoreWeights } from '../../scoring/scoring-types';

describe('EliteScoreWeightAdapter', () => {
  let adapter: EliteScoreWeightAdapter;

  beforeEach(() => {
    adapter = new EliteScoreWeightAdapter();
  });

  it('computes bounded deltas from backtest metrics', () => {
    const deltas = adapter.computeDeltas(stubResult());
    expect(Object.keys(deltas).length).toBe(10);
    for (const v of Object.values(deltas)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(deltas.momentum).toBeGreaterThanOrEqual(0);
    expect(deltas.quality).toBeLessThanOrEqual(1);
    expect(deltas.risk).toBeLessThanOrEqual(1);
  });

  it('zero cagr yields zero momentum delta', () => {
    const deltas = adapter.computeDeltas(stubResult({ performance: { cagr: 0 } } as never));
    expect(deltas.momentum).toBe(0);
  });

  it('merge clamps dimensions to [0,100]', () => {
    const delta = {
      technical: 50,
      momentum: 50,
      quality: 50,
      risk: 50,
      volume: 0,
      trend: 0,
      fundamental: 0,
      verification: 0,
      catalyst: 0,
      liquidity: 0,
    } as ScoreWeights;
    const merged = adapter.merge(DEFAULT_SCORE_WEIGHTS, delta);
    expect(merged.momentum).toBe(60);
    expect(merged.technical).toBe(60);
    expect(merged.risk).toBe(60);
  });

  it('merge clamps upper bound at 100', () => {
    const delta = {
      technical: 200,
      momentum: 200,
      quality: 200,
      risk: 200,
      volume: 0,
      trend: 0,
      fundamental: 0,
      verification: 0,
      catalyst: 0,
      liquidity: 0,
    } as ScoreWeights;
    const merged = adapter.merge(DEFAULT_SCORE_WEIGHTS, delta);
    expect(merged.momentum).toBe(100);
    expect(merged.technical).toBe(100);
  });

  it('apply returns a delta DTO', () => {
    const out = adapter.apply('THYAO.IS', stubResult());
    expect(out.symbol).toBe('THYAO.IS');
    expect(out.weightDelta).toBeDefined();
    expect(out.updatedAt).toBeDefined();
  });
});
