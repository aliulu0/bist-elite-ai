import { ChatGPTProvider } from './chatgpt.provider';
import { GeminiProvider } from './gemini.provider';
import { PerplexityProvider } from './perplexity.provider';
import { GrokProvider } from './grok.provider';
import { GoogleNewsProvider } from './google-news.provider';
import { KapProvider } from './kap.provider';
import { ResearchBundle, AiProviderName, ResearchImportance } from '../ai-research.types';
import { ResearchArticle } from '../../research/interfaces/research.types';

function makeBundle(articles: ResearchArticle[] = []): ResearchBundle {
  return {
    ticker: 'THYAO.IS',
    news: articles,
    company: null,
    financials: null,
    disclosures: null,
    macro: [],
  };
}

function makeArticle(provider: string, title: string): ResearchArticle {
  return {
    id: `id-${title}`,
    source: provider,
    provider,
    title,
    summary: 'özet',
    publishedAt: new Date().toISOString(),
    url: `https://example.com/${title}`,
    country: 'TR',
    language: 'tr',
    importance: ResearchImportance.MEDIUM,
    tags: [],
    sentiment: { score: 0.3, label: 'positive' },
  };
}

describe('AI Research providers', () => {
  describe('LLM providers (architecture placeholder)', () => {
    const providers = [
      new ChatGPTProvider(),
      new GeminiProvider(),
      new PerplexityProvider(),
      new GrokProvider(),
    ];

    it.each(providers.map((p) => [p.name, p]))('%s is disabled and returns no evidence', async (_name, provider) => {
      expect(provider.isEnabled()).toBe(false);

      const result = await provider.collect(makeBundle());

      expect(result.status).toBe('disabled');
      expect(result.items).toEqual([]);
    });
  });

  describe('GoogleNewsProvider', () => {
    it('consumes only google-news articles', async () => {
      const provider = new GoogleNewsProvider();
      const bundle = makeBundle([
        makeArticle('google-news', 'GN Haber'),
        makeArticle('agent-reach', 'AR Haber'),
      ]);

      const result = await provider.collect(bundle);

      expect(result.status).toBe('success');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].provider).toBe('google-news');
      expect(result.items[0].title).toBe('GN Haber');
    });

    it('returns empty when no google-news article exists', async () => {
      const provider = new GoogleNewsProvider();
      const bundle = makeBundle([makeArticle('agent-reach', 'AR Haber')]);

      const result = await provider.collect(bundle);

      expect(result.status).toBe('empty');
      expect(result.items).toEqual([]);
    });
  });

  describe('KapProvider', () => {
    it('maps disclosures to official evidence', async () => {
      const provider = new KapProvider();
      const bundle: ResearchBundle = {
        ...makeBundle(),
        disclosures: {
          data: [
            {
              symbol: 'THYAO.IS',
              title: 'Kâr dağıtımı',
              date: new Date().toISOString(),
              category: 'Kâr dağıtımı',
              url: 'https://kap.org.tr/1',
              source: 'kap',
            },
          ],
          provider: 'kap',
          cached: false,
          timestamp: new Date().toISOString(),
        },
      };

      const result = await provider.collect(bundle);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].official).toBe(true);
      expect(result.items[0].importance).toBe(ResearchImportance.CRITICAL);
    });

    it('returns empty without disclosures', async () => {
      const provider = new KapProvider();

      const result = await provider.collect(makeBundle());

      expect(result.status).toBe('empty');
    });
  });
});
