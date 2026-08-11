import { BacktestRegistry } from './backtest-registry';
import { stubResult, stubStrategy, stubRanking, stubResponse } from '../backtest-test-helpers';
import { BacktestResult, BenchmarkComparison } from '../backtest.types';

describe('BacktestRegistry', () => {
  let registry: BacktestRegistry;

  beforeEach(() => {
    registry = new BacktestRegistry();
  });

  function makeEntry(symbol = 'THYAO.IS', score = 0.9, backtestType = 'indicator') {
    const result = stubResult() as BacktestResult;
    const ranking = stubRanking({ symbol, score });
    return {
      id: `${symbol}:1d:${backtestType}`,
      symbol,
      timeframe: '1d',
      backtestType,
      strategy: stubStrategy(),
      result,
      benchmark: {
        strategyReturn: 5,
        benchmarkReturn: 3,
        excessReturn: 2,
        alpha: 2,
        beta: 1,
        informationRatio: 1,
        trackingError: 2,
        captureRatio: 1.5,
        isValid: true,
      } as BenchmarkComparison,
      ranking,
      response: stubResponse({ id: `${symbol}:1d:${backtestType}`, symbol }),
      createdAt: new Date().toISOString(),
    };
  }

  it('stores and retrieves an entry by id', () => {
    const e = makeEntry();
    registry.store(e);
    expect(registry.get(e.id)).not.toBeNull();
    expect(registry.getBySymbol('THYAO.IS')!.symbol).toBe('THYAO.IS');
  });

  it('history returns entries sorted newest first', () => {
    const a = makeEntry('AAA.IS', 0.5, 'indicator');
    const b = makeEntry('AAA.IS', 0.9, 'strategy');
    a.createdAt = new Date('2024-01-01').toISOString();
    b.createdAt = new Date('2024-02-01').toISOString();
    registry.store(a);
    registry.store(b);
    const hist = registry.history('AAA.IS');
    expect(hist.length).toBe(2);
    expect(hist[0].createdAt).toBe(b.createdAt);
  });

  it('rankings are sorted desc and ranks assigned', () => {
    registry.store(makeEntry('AAA.IS', 0.5));
    registry.store(makeEntry('BBB.IS', 0.9));
    const ranks = registry.rankings();
    expect(ranks[0].rank).toBe(1);
    expect(ranks[0].symbol).toBe('BBB.IS');
    expect(ranks[1].rank).toBe(2);
  });

  it('report returns the stored report shape', () => {
    registry.store(makeEntry('THYAO.IS', 0.9));
    const report = registry.report('THYAO.IS');
    expect(report).not.toBeNull();
    expect(report!.id).toBe('THYAO.IS:1d:indicator');
    expect(report!.symbol).toBe('THYAO.IS');
    expect(report!.result).toBeDefined();
  });

  it('returns null when entry missing', () => {
    expect(registry.get('NONE:1d:indicator')).toBeNull();
    expect(registry.getBySymbol('NONE.IS')).toBeNull();
    expect(registry.report('NONE.IS')).toBeNull();
  });

  it('clear empties the store', () => {
    registry.store(makeEntry());
    registry.clear();
    expect(registry.getAll().length).toBe(0);
  });
});
