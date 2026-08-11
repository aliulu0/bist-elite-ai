import { SerpApiResearchProvider } from './serp-api.research-provider';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';

describe('SerpApiResearchProvider', () => {
  let circuitBreaker: CircuitBreakerService;
  let registry: SymbolRegistryService;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService({ failureThreshold: 3, recoveryIntervalMs: 30000, halfOpenMaxAttempts: 1 });
    registry = new SymbolRegistryService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined and disconnected without an api key', () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: undefined });
    expect(provider.name).toBe('serp-api');
    expect(provider.getEngine()).toBe('google_search');
  });

  it('should validate as disconnected when no api key is configured', async () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: undefined });
    expect(await provider.validateConnection()).toBe(false);
  });

  it('should return null quota when no plan limit configured', () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: 'key' });
    expect(provider.getQuota()).toBeNull();
  });

  it('should return quota when plan limit configured', () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: 'key', planLimit: 100 });
    expect(provider.getQuota()).toEqual({ used: 0, limit: 100 });
  });

  it('should map organic results into search results', async () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [
        { title: 'Aselsan ihale', link: 'https://haber.com/1', snippet: 'Aselsan yeni ihale kazandı' },
      ],
      search_information: { total_results: 123 },
      search_metadata: { total_time_taken: 0.4 },
    });

    const results = await provider.searchCompany('ASELS');
    expect(results.results).toHaveLength(1);
    expect(results.engine).toBe('google_search');
    expect(results.totalResults).toBe(123);
    expect(results.query).toContain('ASELS');
  });

  it('should normalize search into articles with tr metadata', async () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [{ title: 'BİST rekor kırdı', link: 'https://haber.com/2', snippet: 'Piyasa rekor' }],
    });

    const articles = await provider.fetchNews();
    expect(articles).toHaveLength(1);
    expect(articles[0].language).toBe('tr');
    expect(articles[0].country).toBe('TR');
    expect(articles[0].provider).toBe('serp-api');
  });

  it('should return empty kap/tcmb announcements', async () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: 'key' });
    expect(await provider.fetchKAPAnnouncements()).toEqual([]);
    expect(await provider.fetchTCMBAnnouncements()).toEqual([]);
  });

  it('should build an ai summary from ai_mode sources', async () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      ai_mode: {
        answer: 'Aselsan güçlü sipariş defterine sahip',
        sources: [{ title: 'Aselsan', link: 'https://aselsan.com', source: 'aselsan.com' }],
      },
    });

    const summary = await provider.searchAiMode('Aselsan değerlendirme');
    expect(summary?.engine).toBe('google_ai_mode');
    expect(summary?.sources).toHaveLength(1);
  });

  it('should return null from ai mode when no key configured', async () => {
    const provider = new SerpApiResearchProvider(circuitBreaker, registry, { apiKey: undefined });
    expect(await provider.searchAiMode('test')).toBeNull();
  });
});
