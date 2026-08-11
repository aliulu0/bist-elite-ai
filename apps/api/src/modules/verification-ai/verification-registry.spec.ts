import { VerificationRegistry } from './verification-registry';
import { VerificationResult } from './verification-ai.types';

function makeResult(ticker: string, score: number): VerificationResult {
  return {
    ticker,
    verified: 'TRUE',
    verificationScore: score,
    evidenceCount: 2,
    sourceCount: 2,
    trustedSources: ['KAP'],
    conflictingSources: [],
    lastVerified: new Date().toISOString(),
    verificationReason: 'doğrulandı',
    claims: [],
    rawSources: [],
  };
}

describe('VerificationRegistry', () => {
  it('saves and retrieves results by ticker (case-insensitive)', () => {
    const registry = new VerificationRegistry();
    registry.save(makeResult('THYAO.IS', 85));

    expect(registry.get('thyao.is')?.verificationScore).toBe(85);
    expect(registry.has('THYAO.IS')).toBe(true);
  });

  it('returns results in recency order', () => {
    const registry = new VerificationRegistry();
    registry.save(makeResult('THYAO.IS', 70));
    registry.save(makeResult('ASELS.IS', 90));

    const all = registry.getAll();

    expect(all[0].ticker).toBe('ASELS.IS');
    expect(all).toHaveLength(2);
  });

  it('moves a re-saved entry to the front without duplicating', () => {
    const registry = new VerificationRegistry();
    registry.save(makeResult('THYAO.IS', 70));
    registry.save(makeResult('ASELS.IS', 90));
    registry.save(makeResult('THYAO.IS', 95));

    const all = registry.getAll();

    expect(all[0].ticker).toBe('THYAO.IS');
    expect(all).toHaveLength(2);
  });

  it('evicts oldest entries beyond capacity', () => {
    const registry = new VerificationRegistry();
    for (let i = 0; i < 205; i++) {
      registry.save(makeResult(`TEST${i}.IS`, i));
    }

    expect(registry.size).toBe(200);
    expect(registry.has('TEST0.IS')).toBe(false);
    expect(registry.has('TEST204.IS')).toBe(true);
  });

  it('clear empties the store', () => {
    const registry = new VerificationRegistry();
    registry.save(makeResult('THYAO.IS', 70));

    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.get('THYAO.IS')).toBeUndefined();
  });
});
