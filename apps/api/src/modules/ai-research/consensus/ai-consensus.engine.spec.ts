import { AIConsensusEngine } from './ai-consensus.engine';
import {
  AiEvidenceItem,
  AiProviderName,
  AiProviderResult,
  ResearchImportance,
} from '../ai-research.types';

function makeItem(overrides: Partial<AiEvidenceItem> = {}): AiEvidenceItem {
  return {
    id: '1',
    provider: 'google-news',
    source: 'Google News',
    sourceType: 'news',
    title: 'Test haberi',
    snippet: 'Özet',
    url: 'https://example.com/1',
    publishedAt: new Date().toISOString(),
    importance: ResearchImportance.MEDIUM,
    official: false,
    qualityScore: 0.7,
    contentHash: 'abc',
    ...overrides,
  };
}

function makeResult(
  provider: AiProviderName,
  items: AiEvidenceItem[],
  overrides: Partial<AiProviderResult> = {},
): AiProviderResult {
  return {
    provider,
    category: 'news',
    status: items.length > 0 ? 'success' : 'empty',
    summary: items[0]?.title ?? '',
    items,
    collectedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('AIConsensusEngine', () => {
  let engine: AIConsensusEngine;

  beforeEach(() => {
    engine = new AIConsensusEngine();
  });

  describe('deduplicate', () => {
    it('removes items sharing the same contentHash', () => {
      const items = [
        makeItem({ contentHash: 'same', url: 'https://example.com/a' }),
        makeItem({ contentHash: 'same', url: 'https://example.com/b' }),
        makeItem({ contentHash: 'other', url: 'https://example.com/c' }),
      ];

      const result = engine.deduplicate(items);

      expect(result.items).toHaveLength(2);
      expect(result.duplicatesRemoved).toBe(1);
    });

    it('deduplicates by url when contentHash is absent', () => {
      const items = [
        makeItem({ url: 'https://example.com/x', contentHash: '' }),
        makeItem({ url: 'https://example.com/x', contentHash: '' }),
      ];

      const result = engine.deduplicate(items);

      expect(result.items).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });
  });

  describe('rankConfidence', () => {
    it('sorts items by qualityScore descending', () => {
      const items = [
        makeItem({ id: 'low', qualityScore: 0.3 }),
        makeItem({ id: 'high', qualityScore: 0.9 }),
        makeItem({ id: 'mid', qualityScore: 0.6 }),
      ];

      const ranked = engine.rankConfidence(items);

      expect(ranked.map((i) => i.id)).toEqual(['high', 'mid', 'low']);
    });
  });

  describe('calculate', () => {
    it('builds a consensus with summaries, agreement, confidence and score', () => {
      const results = [
        makeResult('google-news', [
          makeItem({
            provider: 'google-news',
            contentHash: 'n1',
            official: true,
            qualityScore: 0.9,
          }),
        ]),
        makeResult('serpapi', [
          makeItem({ provider: 'serpapi', contentHash: 'n2', official: false, qualityScore: 0.8 }),
        ]),
        makeResult('kap', [
          makeItem({
            provider: 'kap',
            contentHash: 'n3',
            official: true,
            qualityScore: 0.95,
            sentiment: { score: 0.5, label: 'positive' },
          }),
        ]),
        makeResult('tcmb', [], { status: 'empty' }),
      ];

      const consensus = engine.calculate('THYAO.IS', results, 8);

      expect(consensus.ticker).toBe('THYAO.IS');
      expect(consensus.totalEvidence).toBe(3);
      expect(consensus.consensusScore).toBeGreaterThanOrEqual(0);
      expect(consensus.consensusScore).toBeLessThanOrEqual(100);
      expect(consensus.confidence).toBeGreaterThanOrEqual(0);
      expect(consensus.confidence).toBeLessThanOrEqual(1);
      expect(consensus.agreementLevel).toBeGreaterThanOrEqual(0);
      expect(consensus.researchSources.length).toBeGreaterThan(0);
      expect(consensus.timestamp).toBeTruthy();
    });

    it('sets ai provider summaries from results', () => {
      const results = [
        makeResult('chatgpt', [makeItem({ provider: 'chatgpt', contentHash: 'c1' })], {
          summary: 'ChatGPT özet',
        }),
        makeResult('google-news', [makeItem({ provider: 'google-news', contentHash: 'g1' })], {
          summary: 'Google özet',
        }),
      ];

      const consensus = engine.calculate('THYAO.IS', results, 8);

      expect(consensus.chatgptSummary).toBe('ChatGPT özet');
      expect(consensus.providerSummaries['google-news']).toBe('Google özet');
    });

    it('detects sentiment divergence conflicts', () => {
      const results = [
        makeResult('google-news', [
          makeItem({
            provider: 'google-news',
            contentHash: 'p1',
            sentiment: { score: 0.8, label: 'positive' },
          }),
        ]),
        makeResult('kap', [
          makeItem({
            provider: 'kap',
            contentHash: 'n1',
            sentiment: { score: -0.8, label: 'negative' },
          }),
        ]),
      ];

      const consensus = engine.calculate('THYAO.IS', results, 8);

      expect(consensus.conflicts.some((c) => c.topic === 'sentiment-divergence')).toBe(true);
    });

    it('detects provider error conflicts', () => {
      const results = [makeResult('google-news', [], { status: 'error', error: 'timeout' })];

      const consensus = engine.calculate('THYAO.IS', results, 8);

      expect(consensus.conflicts.some((c) => c.topic === 'provider-error')).toBe(true);
    });

    it('returns zero confidence when no provider is enabled', () => {
      const consensus = engine.calculate('THYAO.IS', [], 0);

      expect(consensus.confidence).toBe(0);
      expect(consensus.consensusScore).toBe(0);
      expect(consensus.agreementLevel).toBe(0);
    });

    it('provides a fallback news summary when no items exist', () => {
      const consensus = engine.calculate('THYAO.IS', [], 8);

      expect(consensus.newsSummary).toContain('yeterli haber akışı bulunamadı');
      expect(consensus.researchSources).toHaveLength(0);
    });
  });
});
