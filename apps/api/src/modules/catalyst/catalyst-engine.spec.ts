import { CatalystEngine } from './catalyst-engine';
import { CatalystScoreEngine } from './catalyst-score-engine';
import { AIConsensus, AiResearchSource } from '../ai-research/ai-research.types';
import { VerificationResult } from '../verification-ai/verification-ai.types';

function makeSource(overrides: Partial<AiResearchSource> = {}): AiResearchSource {
  return {
    provider: 'google-news',
    source: 'Google News',
    title: 'Şirket yeni ihale kazandı',
    url: 'https://example.com/1',
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeConsensus(sources: AiResearchSource[] = [], overrides: Partial<AIConsensus> = {}): AIConsensus {
  return {
    ticker: 'ASELS.IS',
    chatgptSummary: null,
    geminiSummary: null,
    perplexitySummary: null,
    grokSummary: null,
    newsSummary: 'Haber özeti',
    researchSources: sources,
    agreementLevel: 0.7,
    conflicts: [],
    confidence: 0.7,
    consensusScore: 70,
    providerSummaries: {},
    totalEvidence: sources.length,
    duplicatesRemoved: 0,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeVerification(verified: VerificationResult['verified'], score: number): VerificationResult {
  return {
    ticker: 'ASELS.IS',
    verified,
    verificationScore: score,
    evidenceCount: 3,
    sourceCount: 2,
    trustedSources: ['KAP'],
    conflictingSources: [],
    lastVerified: new Date().toISOString(),
    verificationReason: 'doğrulandı',
    claims: [],
    rawSources: [],
  };
}

describe('CatalystEngine', () => {
  let engine: CatalystEngine;
  let scoreEngine: CatalystScoreEngine;

  beforeEach(() => {
    engine = new CatalystEngine();
    scoreEngine = new CatalystScoreEngine();
  });

  describe('normalize', () => {
    it('deduplicates sources by url', () => {
      const sources = [
        makeSource({ url: 'https://example.com/a' }),
        makeSource({ url: 'https://example.com/a' }),
        makeSource({ url: 'https://example.com/b' }),
      ];

      expect(engine.normalize(sources)).toHaveLength(2);
    });
  });

  describe('categorize', () => {
    it('detects tender wins', () => {
      expect(engine.categorize('Şirket yeni ihale kazandı').category).toBe('tender_win');
    });

    it('detects dividends', () => {
      expect(engine.categorize('Temettü kararı alındı').category).toBe('dividend');
    });

    it('detects patents', () => {
      expect(engine.categorize('Yeni patent alındı').category).toBe('patent');
    });

    it('detects factory openings', () => {
      expect(engine.categorize('Yeni fabrika açıldı').category).toBe('factory_opening');
    });

    it('falls back to minor_news', () => {
      expect(engine.categorize('Sıradan bir duyuru').category).toBe('minor_news');
    });
  });

  describe('detect', () => {
    it('produces events with category, impact, horizon and confidence', () => {
      const sources = [
        makeSource({ provider: 'kap', source: 'KAP', title: 'Yeni savunma ihalesi kazanıldı' }),
        makeSource({ url: 'https://example.com/2', title: 'Temettü dağıtım kararı' }),
      ];
      const consensus = makeConsensus(sources);
      const verification = makeVerification('TRUE', 92);

      const events = engine.detect({ consensus, verification });

      expect(events).toHaveLength(2);
      const tender = events[0];
      expect(tender.category).toBe('tender_win');
      expect(tender.expectedImpact).toBe('very_bullish');
      expect(tender.timeHorizon).toBe('1_week');
      expect(tender.verified).toBe(true);
      expect(tender.verificationScore).toBe(92);
      expect(tender.confidence).toBeGreaterThan(0.5);
    });

    it('marks events unverified when verification is FALSE', () => {
      const consensus = makeConsensus([makeSource()]);
      const verification = makeVerification('FALSE', 20);

      const events = engine.detect({ consensus, verification });

      expect(events[0].verified).toBe(false);
      expect(events[0].confidence).toBeLessThan(0.6);
    });

    it('returns empty events when no sources exist', () => {
      const events = engine.detect({ consensus: makeConsensus([]), verification: makeVerification('UNVERIFIED', 0) });

      expect(events).toEqual([]);
    });
  });
});

describe('CatalystScoreEngine', () => {
  let engine: CatalystEngine;
  let scoreEngine: CatalystScoreEngine;

  beforeEach(() => {
    engine = new CatalystEngine();
    scoreEngine = new CatalystScoreEngine();
  });

  it('assigns higher score to verified critical events', () => {
    const events = engine.detect({
      consensus: makeConsensus([
        makeSource({ provider: 'kap', source: 'KAP', title: 'Yeni savunma ihalesi kazanıldı' }),
      ]),
      verification: makeVerification('TRUE', 95),
    });

    const scored = scoreEngine.scoreEvent(events[0]);

    expect(scored.catalystScore).toBeGreaterThan(85);
    expect(scored.catalystScore).toBeLessThanOrEqual(100);
  });

  it('aggregates to a ticker-level catalyst score and impact', () => {
    const events = engine.detect({
      consensus: makeConsensus([
        makeSource({ provider: 'kap', source: 'KAP', title: 'Yeni savunma ihalesi kazanıldı' }),
        makeSource({ url: 'https://example.com/2', title: 'Yeni fabrika açıldı' }),
      ]),
      verification: makeVerification('TRUE', 90),
    });

    const result = scoreEngine.resultFor('ASELS.IS', events, []);

    expect(result.catalystScore).toBeGreaterThanOrEqual(80);
    expect(result.confidence).toBeGreaterThan(0);
    expect(['very_bullish', 'bullish']).toContain(result.expectedImpact);
    expect(result.totalCount).toBe(2);
    expect(result.verifiedCount).toBe(2);
  });

  it('returns zero score for empty events', () => {
    const result = scoreEngine.resultFor('ASELS.IS', [], []);

    expect(result.catalystScore).toBe(0);
    expect(result.expectedImpact).toBe('neutral');
  });

  it('sorts events by score descending', () => {
    const events = [
      { ...engine.detect({ consensus: makeConsensus([makeSource({ provider: 'kap', source: 'KAP', title: 'Temettü dağıtım kararı' })]), verification: makeVerification('TRUE', 60) })[0] },
      { ...engine.detect({ consensus: makeConsensus([makeSource({ provider: 'kap', source: 'KAP', title: 'Yeni savunma ihalesi kazanıldı' })]), verification: makeVerification('TRUE', 95) })[0] },
    ];

    const result = scoreEngine.resultFor('ASELS.IS', events, []);

    expect(result.events[0].catalystScore).toBeGreaterThanOrEqual(result.events[1].catalystScore);
  });
});
