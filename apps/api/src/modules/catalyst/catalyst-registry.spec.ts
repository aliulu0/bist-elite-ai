import { CatalystRegistry } from './catalyst-registry';
import { CatalystResult } from './catalyst.types';

function makeResult(ticker: string, score: number): CatalystResult {
  return {
    ticker,
    catalystScore: score,
    confidence: 90,
    expectedImpact: 'bullish',
    events: [],
    verifiedCount: 0,
    totalCount: 0,
    rawSources: [],
    generatedAt: new Date().toISOString(),
  };
}

describe('CatalystRegistry', () => {
  it('saves and retrieves results by ticker (case-insensitive)', () => {
    const registry = new CatalystRegistry();
    registry.save(makeResult('ASELS.IS', 94));

    expect(registry.get('asels.is')?.catalystScore).toBe(94);
    expect(registry.has('ASELS.IS')).toBe(true);
  });

  it('getTop returns most recent results first with limit', () => {
    const registry = new CatalystRegistry();
    registry.save(makeResult('ASELS.IS', 94));
    registry.save(makeResult('THYAO.IS', 80));
    registry.save(makeResult('BIMAS.IS', 70));

    const top = registry.getTop(2);

    expect(top).toHaveLength(2);
    expect(top[0].ticker).toBe('BIMAS.IS');
  });

  it('moves re-saved entries to the front without duplicating', () => {
    const registry = new CatalystRegistry();
    registry.save(makeResult('ASELS.IS', 94));
    registry.save(makeResult('THYAO.IS', 80));
    registry.save(makeResult('ASELS.IS', 96));

    const all = registry.getAll();

    expect(all[0].ticker).toBe('ASELS.IS');
    expect(all).toHaveLength(2);
  });

  it('evicts oldest entries beyond capacity', () => {
    const registry = new CatalystRegistry();
    for (let i = 0; i < 205; i++) {
      registry.save(makeResult(`TEST${i}.IS`, i));
    }

    expect(registry.size).toBe(200);
    expect(registry.has('TEST0.IS')).toBe(false);
    expect(registry.has('TEST204.IS')).toBe(true);
  });

  it('clear empties the store', () => {
    const registry = new CatalystRegistry();
    registry.save(makeResult('ASELS.IS', 94));

    registry.clear();

    expect(registry.size).toBe(0);
  });
});
