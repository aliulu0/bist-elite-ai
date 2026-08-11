import { GoogleNewsProvider } from './google-news.provider';
import { CircuitBreakerService } from '../../market-data/circuit-breaker/circuit-breaker.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';

const RSS_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News Türkiye</title>
    <item>
      <title><![CDATA[Aselsan rekor kâr açıkladı]]></title>
      <link>https://news.google.com/rss/articles/asels1</link>
      <guid isPermaLink="false">asels1</guid>
      <pubDate>Sat, 01 Aug 2026 10:00:00 GMT</pubDate>
      <source url="https://example.com">Example News</source>
    </item>
    <item>
      <title><![CDATA[Aselsan hisseleri yükselişte]]></title>
      <link>https://news.google.com/rss/articles/asels2</link>
      <guid isPermaLink="false">asels2</guid>
      <pubDate>Sat, 01 Aug 2026 09:00:00 GMT</pubDate>
      <source url="https://example.com">Example News</source>
    </item>
  </channel>
</rss>`;

describe('GoogleNewsProvider', () => {
  let provider: GoogleNewsProvider;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    const circuitBreaker = new CircuitBreakerService();
    const registry = new SymbolRegistryService();
    provider = new GoogleNewsProvider(circuitBreaker, registry);
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(RSS_FIXTURE),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should validate connection against google news rss', async () => {
    await expect(provider.validateConnection()).resolves.toBe(true);
  });

  it('should fetch company news decorated with ticker and sector', async () => {
    const articles = await provider.fetchCompanyNews('ASELS');
    expect(articles).toHaveLength(2);
    expect(articles[0].company).toBe('ASELS');
    expect(articles[0].sector).toBe('Information Technology');
    expect(articles[0].provider).toBe('google-news');
    expect(articles[0].country).toBe('TR');
  });

  it('should mark record profit news as high importance', async () => {
    const articles = await provider.fetchCompanyNews('ASELS');
    expect(articles[0].importance).toBe('high');
  });

  it('should return empty array for kap announcements', async () => {
    await expect(provider.fetchKAPAnnouncements()).resolves.toEqual([]);
  });

  it('should return empty array for tcmb announcements', async () => {
    await expect(provider.fetchTCMBAnnouncements()).resolves.toEqual([]);
  });

  it('should record metrics on successful fetch', async () => {
    await provider.fetchCompanyNews('ASELS');
    const status = provider.getStatus();
    expect(status.totalRequests).toBeGreaterThan(0);
    expect(status.successfulRequests).toBeGreaterThan(0);
  });
});
