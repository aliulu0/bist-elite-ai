import { AIConsensusRegistry } from './ai-consensus.registry';
import { AIConsensus } from './ai-research.types';

function makeConsensus(ticker: string, score: number): AIConsensus {
  return {
    ticker,
    chatgptSummary: null,
    geminiSummary: null,
    perplexitySummary: null,
    grokSummary: null,
    newsSummary: 'haber',
    researchSources: [],
    agreementLevel: 0.5,
    conflicts: [],
    confidence: score / 100,
    consensusScore: score,
    providerSummaries: {},
    totalEvidence: 1,
    duplicatesRemoved: 0,
    timestamp: new Date().toISOString(),
  };
}

describe('AIConsensusRegistry', () => {
  it('saves and retrieves consensus by ticker (case-insensitive)', () => {
    const registry = new AIConsensusRegistry();
    const consensus = makeConsensus('THYAO.IS', 70);

    registry.save(consensus);

    expect(registry.get('thyao.is')?.consensusScore).toBe(70);
    expect(registry.has('THYAO.IS')).toBe(true);
  });

  it('returns most recently saved entries first in getTop', () => {
    const registry = new AIConsensusRegistry();
    registry.save(makeConsensus('THYAO.IS', 60));
    registry.save(makeConsensus('ASELS.IS', 80));

    const top = registry.getTop(10);

    expect(top[0].ticker).toBe('ASELS.IS');
    expect(top[1].ticker).toBe('THYAO.IS');
  });

  it('honors the limit parameter', () => {
    const registry = new AIConsensusRegistry();
    for (let i = 0; i < 5; i++) {
      registry.save(makeConsensus(`TEST${i}.IS`, i * 10));
    }

    expect(registry.getTop(2)).toHaveLength(2);
  });

  it('moves an existing entry to the front on re-save', () => {
    const registry = new AIConsensusRegistry();
    registry.save(makeConsensus('THYAO.IS', 60));
    registry.save(makeConsensus('ASELS.IS', 80));
    registry.save(makeConsensus('THYAO.IS', 90));

    const top = registry.getTop(10);

    expect(top[0].ticker).toBe('THYAO.IS');
    expect(registry.getAll()).toHaveLength(2);
  });

  it('evicts oldest entries beyond the max capacity', () => {
    const registry = new AIConsensusRegistry();
    for (let i = 0; i < 205; i++) {
      registry.save(makeConsensus(`TEST${i}.IS`, i));
    }

    expect(registry.size).toBe(200);
    expect(registry.has('TEST0.IS')).toBe(false);
    expect(registry.has('TEST204.IS')).toBe(true);
  });

  it('clear removes all entries', () => {
    const registry = new AIConsensusRegistry();
    registry.save(makeConsensus('THYAO.IS', 60));

    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.get('THYAO.IS')).toBeUndefined();
  });
});
