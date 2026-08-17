import { VerificationRuleEngine } from './verification-rule-engine';
import { AIConsensus, AiConflict, AiResearchSource } from '../ai-research/ai-research.types';

function makeSource(overrides: Partial<AiResearchSource> = {}): AiResearchSource {
  return {
    provider: 'google-news',
    source: 'Google News',
    title: 'Haber',
    url: 'https://example.com/haber',
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeConflict(overrides: Partial<AiConflict> = {}): AiConflict {
  return {
    id: 'c1',
    providers: ['google-news'],
    topic: 'sentiment-divergence',
    severity: 'medium',
    description: 'Çelişki',
    ...overrides,
  };
}

function makeConsensus(overrides: Partial<AIConsensus> = {}): AIConsensus {
  return {
    ticker: 'THYAO.IS',
    chatgptSummary: null,
    geminiSummary: null,
    perplexitySummary: null,
    grokSummary: null,
    newsSummary: 'Haber özeti',
    researchSources: [],
    agreementLevel: 0.5,
    conflicts: [],
    confidence: 0.5,
    consensusScore: 50,
    providerSummaries: {},
    totalEvidence: 0,
    duplicatesRemoved: 0,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('VerificationRuleEngine', () => {
  let engine: VerificationRuleEngine;

  beforeEach(() => {
    engine = new VerificationRuleEngine();
  });

  describe('normalize', () => {
    it('deduplicates sources by url', () => {
      const sources = [
        makeSource({ url: 'https://example.com/a' }),
        makeSource({ url: 'https://example.com/a' }),
        makeSource({ url: 'https://example.com/b' }),
      ];

      const evidence = engine.normalize(sources);

      expect(evidence).toHaveLength(2);
    });

    it('assigns trust ranks from provider priority', () => {
      const sources = [
        makeSource({ provider: 'kap', source: 'KAP', url: 'https://kap.org.tr/1' }),
        makeSource({ provider: 'tcmb', source: 'TCMB', url: 'https://tcmb.gov.tr/1' }),
        makeSource({
          provider: 'yahoo-finance',
          source: 'Yahoo Finance',
          url: 'https://yahoo.com/1',
        }),
        makeSource({ provider: 'serpapi', source: 'SerpAPI Search', url: 'https://serpapi.com/1' }),
      ];

      const evidence = engine.normalize(sources);

      const kap = evidence.find((e) => e.provider === 'kap');
      const serpapi = evidence.find((e) => e.provider === 'serpapi');
      expect(kap?.trustRank).toBe(1);
      expect(kap?.trustWeight).toBe(100);
      expect(kap?.official).toBe(true);
      expect(serpapi?.trustRank).toBe(8);
      expect(serpapi?.official).toBe(false);
    });

    it('treats company IR markers as official', () => {
      const sources = [
        makeSource({ provider: 'google-search', source: 'Company Investor Relations' }),
      ];

      const evidence = engine.normalize(sources);

      expect(evidence[0].official).toBe(true);
      expect(evidence[0].trustRank).toBe(2);
    });
  });

  describe('computeEvidenceScore', () => {
    it('returns 0 for empty evidence', () => {
      expect(engine.computeEvidenceScore([])).toBe(0);
    });

    it('scores high-weight trusted evidence higher than low-weight', () => {
      const trusted = engine.normalize([
        makeSource({ provider: 'kap', source: 'KAP' }),
        makeSource({ provider: 'tcmb', source: 'TCMB' }),
      ]);
      const weak = engine.normalize([
        makeSource({ provider: 'serpapi', source: 'SerpAPI Search' }),
      ]);

      const trustedScore = engine.computeEvidenceScore(trusted);
      const weakScore = engine.computeEvidenceScore(weak);

      expect(trustedScore).toBeGreaterThan(weakScore);
      expect(trustedScore).toBeLessThanOrEqual(1);
    });
  });

  describe('computeTruthScore', () => {
    it('combines evidence score and agreement, penalized by conflicts', () => {
      const base = engine.computeTruthScore(0.8, 0.8, 0);
      const penalized = engine.computeTruthScore(0.8, 0.8, 2);

      expect(base).toBeCloseTo(0.8);
      expect(penalized).toBeLessThan(base);
      expect(penalized).toBeGreaterThanOrEqual(0);
    });

    it('clamps to zero', () => {
      expect(engine.computeTruthScore(0, 0, 3)).toBe(0);
    });
  });

  describe('verdictFor', () => {
    it('returns UNVERIFIED without evidence', () => {
      expect(engine.verdictFor(0.9, 0, 0)).toBe('UNVERIFIED');
    });

    it('returns TRUE when score is high and no conflicts', () => {
      expect(engine.verdictFor(0.9, 5, 0)).toBe('TRUE');
    });

    it('returns FALSE when score is below threshold', () => {
      expect(engine.verdictFor(0.2, 3, 0)).toBe('FALSE');
    });

    it('returns PARTIAL in the middle ground', () => {
      expect(engine.verdictFor(0.5, 3, 0)).toBe('PARTIAL');
    });
  });

  describe('verifyConsensus', () => {
    it('produces a TRUE result for strong multi-source consensus', () => {
      const consensus = makeConsensus({
        agreementLevel: 0.8,
        totalEvidence: 6,
        researchSources: [
          makeSource({ provider: 'kap', source: 'KAP', url: 'https://kap.org.tr/1' }),
          makeSource({ provider: 'tcmb', source: 'TCMB', url: 'https://tcmb.gov.tr/1' }),
          makeSource({
            provider: 'google-news',
            source: 'Google News',
            url: 'https://news.google.com/1',
          }),
          makeSource({
            provider: 'yahoo-finance',
            source: 'Yahoo Finance',
            url: 'https://yahoo.com/1',
          }),
        ],
      });

      const result = engine.verifyConsensus(consensus);

      expect(result.verified).toBe('TRUE');
      expect(result.verificationScore).toBeGreaterThanOrEqual(70);
      expect(result.evidenceCount).toBe(4);
      expect(result.trustedSources).toContain('KAP');
      expect(result.conflictingSources).toEqual([]);
      expect(result.verificationReason).toContain('güvenilir kaynak');
    });

    it('returns UNVERIFIED with no sources', () => {
      const result = engine.verifyConsensus(makeConsensus());

      expect(result.verified).toBe('UNVERIFIED');
      expect(result.verificationScore).toBe(0);
    });

    it('downgrades verdict when conflicts exist', () => {
      const consensus = makeConsensus({
        agreementLevel: 0.7,
        totalEvidence: 4,
        researchSources: [
          makeSource({ provider: 'kap', source: 'KAP', url: 'https://kap.org.tr/1' }),
          makeSource({ provider: 'google-news', source: 'Google News', url: 'https://gnews/1' }),
        ],
        conflicts: [makeConflict({ severity: 'high', providers: ['google-news'] })],
      });

      const result = engine.verifyConsensus(consensus);

      expect(result.conflictingSources.length).toBeGreaterThan(0);
      expect(result.verified).not.toBe('TRUE');
    });

    it('marks FALSE when evidence is weak and truth score collapses', () => {
      const consensus = makeConsensus({
        agreementLevel: 0.1,
        totalEvidence: 2,
        researchSources: [
          makeSource({ provider: 'serpapi', source: 'SerpAPI Search', url: 'https://s1' }),
          makeSource({ provider: 'serpapi', source: 'SerpAPI Search', url: 'https://s2' }),
        ],
      });

      const result = engine.verifyConsensus(consensus);

      expect(result.verified).toBe('FALSE');
    });
  });
});
