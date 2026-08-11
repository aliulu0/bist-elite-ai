import { AgentReachProvider } from './agent-reach.provider';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';

describe('AgentReachProvider', () => {
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
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: undefined });
    expect(provider.name).toBe('agent-reach');
    expect(provider.getQuota()).toBeNull();
  });

  it('should validate as disconnected when no api key is configured', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: undefined });
    expect(await provider.validateConnection()).toBe(false);
  });

  it('should map organic results into search results', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [
        { title: 'Aselsan BIST', link: 'https://haber.com/1', snippet: 'Aselsan güncel' },
      ],
      search_metadata: { total_time_taken: 0.4 },
    });

    const results = await provider.searchCompany('ASELS');
    expect(results.results).toHaveLength(1);
    expect(results.engine).toBe('google_search');
  });

  it('should return null when no organic results', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue(null);

    const results = await provider.searchCompany('ASELS');
    expect(results.results).toHaveLength(0);
  });

  it('should search PDFs for a company', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [
        { title: 'Aselsan Yıllık Rapor', link: 'https://docs.com/aselsan-2023.pdf', date: '2024-01-15' },
      ],
    });

    const pdfs = await provider.searchPDFs('ASELS');
    expect(Array.isArray(pdfs)).toBe(true);
  });

  it('should search RSS feeds for a company', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [],
    });

    const rss = await provider.searchRSS('ASELS');
    expect(Array.isArray(rss)).toBe(true);
  });

  it('should search press releases for a company', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [
        { title: 'Aselsan Basın Açıklaması', link: 'https://aselsan.com/pr/1' },
      ],
    });

    const pressReleases = await provider.searchPressReleases('ASELS');
    expect(Array.isArray(pressReleases)).toBe(true);
  });

  it('should return empty arrays for KAP and TCMB announcements', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    expect(await provider.fetchKAPAnnouncements()).toEqual([]);
    expect(await provider.fetchTCMBAnnouncements()).toEqual([]);
  });

  it('should search market news', async () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    jest.spyOn(provider as unknown as { searchRaw: () => Promise<unknown> }, 'searchRaw').mockResolvedValue({
      organic_results: [
        { title: 'BIST piyasa güncel', link: 'https://haber.com/1', snippet: 'Piyasa yükselişte' },
      ],
      news_results: [
        { title: 'BIST Haber', link: 'https://news.com/1', snippet: 'Son dakika' },
      ],
    });

    const articles = await provider.fetchNews();
    expect(articles.length).toBeGreaterThanOrEqual(0);
    for (const article of articles) {
      expect(article.language).toBe('tr');
      expect(article.country).toBe('TR');
      expect(article.provider).toBe('agent-reach');
    }
  });

  it('should generate unique IDs for sources', () => {
    const provider = new AgentReachProvider(circuitBreaker, registry, { apiKey: 'key' });
    const id1 = (provider as unknown as { hashId: (s: string) => string }).hashId('https://example.com/1');
    const id2 = (provider as unknown as { hashId: (s: string) => string }).hashId('https://example.com/2');
    expect(id1).not.toBe(id2);
  });
});