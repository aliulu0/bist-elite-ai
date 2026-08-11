import { AIProviderRegistry } from './ai-provider-registry';
import { IAiResearchProvider } from './providers/ai-provider.interface';
import {
  AiEvidenceItem,
  AiProviderConfig,
  AiProviderResult,
  AiProviderStatus,
  ResearchBundle,
} from './ai-research.types';

function makeProvider(name: any, enabled = true): IAiResearchProvider {
  const config: AiProviderConfig = { name, category: 'news', enabled, priority: 50, ttlMs: 300000 };
  return {
    name,
    category: 'news',
    isEnabled: () => enabled,
    getConfig: () => config,
    getStatus: (): AiProviderStatus => ({
      name,
      category: 'news',
      enabled,
      status: 'idle',
      lastSync: null,
      totalRequests: 0,
    }),
    collect: async (bundle: ResearchBundle): Promise<AiProviderResult> => ({
      provider: name,
      category: 'news',
      status: 'empty',
      summary: '',
      items: [],
      collectedAt: new Date().toISOString(),
    }),
  };
}

describe('AIProviderRegistry', () => {
  it('registers providers by name and skips duplicates', () => {
    const first = makeProvider('google-news');
    const second = makeProvider('google-news');
    const registry = new AIProviderRegistry([first, second]);

    expect(registry.getNames()).toEqual(['google-news']);
    expect(registry.getAll()).toHaveLength(1);
  });

  it('registers additional providers via register()', () => {
    const registry = new AIProviderRegistry([]);
    const provider = makeProvider('kap');
    registry.register(provider);

    expect(registry.get('kap')).toBe(provider);
  });

  it('getEnabled returns only enabled providers', () => {
    const registry = new AIProviderRegistry([makeProvider('google-news', true), makeProvider('kap', false)]);

    const enabled = registry.getEnabled();

    expect(enabled.map((p) => p.name)).toEqual(['google-news']);
  });

  it('collectAll invokes every enabled provider and returns results', async () => {
    let called = 0;
    const provider = makeProvider('google-news');
    provider.collect = async () => {
      called++;
      return {
        provider: 'google-news',
        category: 'news',
        status: 'success',
        summary: 's',
        items: [] as AiEvidenceItem[],
        collectedAt: new Date().toISOString(),
      };
    };
    const registry = new AIProviderRegistry([provider, makeProvider('kap', false)]);

    const results = await registry.collectAll({ ticker: 'THYAO.IS', news: [], company: null, financials: null, disclosures: null, macro: [] });

    expect(called).toBe(1);
    expect(results).toHaveLength(1);
    expect(registry.getStatus()).toHaveLength(2);
  });

  it('flatten merges items from all results', () => {
    const registry = new AIProviderRegistry([]);
    const itemA: AiEvidenceItem = { id: 'a', provider: 'google-news', source: 's', sourceType: 'news', title: 'a', importance: 'medium' as any, official: false, qualityScore: 0.5, contentHash: 'a' };
    const results: AiProviderResult[] = [
      { provider: 'google-news', category: 'news', status: 'success', summary: '', items: [itemA], collectedAt: 'x' },
      { provider: 'kap', category: 'regulatory', status: 'empty', summary: '', items: [], collectedAt: 'x' },
    ];

    expect(registry.flatten(results)).toEqual([itemA]);
  });
});
