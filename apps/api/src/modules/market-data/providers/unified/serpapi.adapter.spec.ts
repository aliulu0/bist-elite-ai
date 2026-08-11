import { SerpApiAdapter } from './serpapi.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';

const SERPAPI_FINANCE_RESPONSE = {
  search_metadata: { status: 'Success', total_time_taken: 0.5, engine: 'google_finance', id: 'test' },
  knowledge_graph: { title: 'THYAO', description: 'Turkish Airlines - BIST' },
  finance_results: [
    { title: 'THYAO', link: 'https://www.google.com/finance/quote/THYAO:IST', snippet: 'Price 250.50 TRY · Daily Change +3.50 · Change % +1.42% · Volume 50M · Market Cap 123B' },
  ],
  organic_results: [
    { title: 'THYAO - Google Finance', link: 'https://www.google.com/finance/quote/THYAO:IST', snippet: 'Turkish Airlines stock price' },
  ],
};

const SERPAPI_FINANCE_NO_PRICE = {
  search_metadata: { status: 'Success', total_time_taken: 0.3, engine: 'google_finance', id: 'test2' },
  organic_results: [
    { title: 'THYAO', link: 'https://www.google.com/finance/quote/THYAO:IST', snippet: 'Turkish Airlines' },
  ],
};

const SERPAPI_FINANCIALS_RESPONSE = {
  search_metadata: { status: 'Success', total_time_taken: 0.4, engine: 'google_finance', id: 'test3' },
  key_financial_highlights: [
    { label: 'Revenue', value: '50 B' },
    { label: 'Net Income', value: '5 B' },
    { label: 'EBITDA', value: '8 B' },
    { label: 'Gross Profit', value: '15 B' },
    { label: 'Operating Income', value: '6 B' },
    { label: 'Cost of Revenue', value: '10 B' },
  ],
};

const SERPAPI_BALANCE_SHEET_RESPONSE = {
  search_metadata: { status: 'Success', total_time_taken: 0.4, engine: 'google_finance', id: 'test4' },
  organic_results: [
    { title: 'THYAO Balance Sheet', link: 'https://example.com', snippet: 'Total Assets 200B, Total Debt 80B, Equity 120B' },
  ],
};

const SERPAPI_DISCLOSURES_RESPONSE = {
  search_metadata: { status: 'Success', total_time_taken: 0.3, engine: 'google', id: 'test5' },
  organic_results: [
    { title: 'THYAO İlan: Yıllık Rapor', link: 'https://www.kap.org.tr/...', snippet: 'Yıllık rapor', date: '2026-03-15' },
    { title: 'THYAO İlan: Çeyrek Rapor', link: 'https://www.kap.org.tr/...', snippet: 'Çeyrek rapor', date: '2026-06-15' },
  ],
};

const SERPAPI_ERROR_RESPONSE = {
  search_metadata: { status: 'Error', total_time_taken: 0.1, engine: 'google_finance', id: 'test6' },
  error: 'rate_limit_exceeded',
  error_message: 'API rate limit reached',
};

describe('SerpApiAdapter', () => {
  let adapter: SerpApiAdapter;
  let fetchMock: jest.SpyInstance;
  let circuitBreaker: CircuitBreakerService;

  const config = { apiKey: 'test-key', timeout: 5000, retries: 0 };

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    adapter = new SerpApiAdapter(circuitBreaker, config);
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateConnection', () => {
    it('should return true when API key is valid', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ search_metadata: { status: 'Success' } }),
      } as unknown as Response);
      const result = await adapter.validateConnection();
      expect(result).toBe(true);
    });

    it('should return false when no API key configured', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const result = await unconfigured.validateConnection();
      expect(result).toBe(false);
    });

    it('should return false when API returns error', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 403 } as unknown as Response);
      const result = await adapter.validateConnection();
      expect(result).toBe(false);
    });
  });

  describe('fetchCompany', () => {
    it('should parse finance results into Company', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCE_RESPONSE),
      } as unknown as Response);

      const company = await adapter.fetchCompany('THYAO');
      expect(company).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          name: 'THYAO',
          currency: 'TRY',
          exchange: 'BIST',
          source: 'serpapi',
        }),
      );
    });

    it('should return null when no API key configured', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const company = await unconfigured.fetchCompany('THYAO');
      expect(company).toBeNull();
    });

    it('should return null when SerpAPI returns error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_ERROR_RESPONSE),
      } as unknown as Response);

      const company = await adapter.fetchCompany('THYAO');
      expect(company).toBeNull();
    });

    it('should use knowledge graph title when available', async () => {
      const response = {
        ...SERPAPI_FINANCE_RESPONSE,
        knowledge_graph: { title: 'THYAO Holding', description: 'Turkish Airlines Holding' },
      };
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(response),
      } as unknown as Response);

      const company = await adapter.fetchCompany('THYAO');
      expect(company?.name).toBe('THYAO Holding');
    });
  });

  describe('fetchFinancials', () => {
    it('should parse financial highlights into FinancialStatement', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCIALS_RESPONSE),
      } as unknown as Response);

      const financials = await adapter.fetchFinancials('THYAO');
      expect(financials).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          period: 'annual',
          source: 'serpapi',
        }),
      );
    });

    it('should return null when no API key configured', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const financials = await unconfigured.fetchFinancials('THYAO');
      expect(financials).toBeNull();
    });
  });

  describe('fetchBalanceSheet', () => {
    it('should return UnifiedBalanceSheet', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_BALANCE_SHEET_RESPONSE),
      } as unknown as Response);

      const balanceSheet = await adapter.fetchBalanceSheet('THYAO');
      expect(balanceSheet).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          period: 'annual',
          source: 'serpapi',
        }),
      );
    });

    it('should return null when no API key configured', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const balanceSheet = await unconfigured.fetchBalanceSheet('THYAO');
      expect(balanceSheet).toBeNull();
    });
  });

  describe('fetchDisclosures', () => {
    it('should parse organic results into Disclosure array', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_DISCLOSURES_RESPONSE),
      } as unknown as Response);

      const disclosures = await adapter.fetchDisclosures('THYAO');
      expect(disclosures).toHaveLength(2);
      expect(disclosures[0].symbol).toBe('THYAO');
      expect(disclosures[0].category).toBe('disclosure');
      expect(disclosures[0].source).toBe('serpapi');
    });

    it('should return empty array when no API key configured', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const disclosures = await unconfigured.fetchDisclosures('THYAO');
      expect(disclosures).toEqual([]);
    });
  });

  describe('getLatestPrice', () => {
    it('should parse price from finance results', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCE_RESPONSE),
      } as unknown as Response);

      const price = await adapter.getLatestPrice('THYAO');
      expect(price).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          timeframe: '1d',
          close: 250.5,
          validationStatus: 'valid',
        }),
      );
    });

    it('should return null when no price data found', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCE_NO_PRICE),
      } as unknown as Response);

      const price = await adapter.getLatestPrice('THYAO');
      expect(price).toBeNull();
    });
  });

  describe('getAvailableTimeframes', () => {
    it('should return supported timeframes', () => {
      expect(adapter.getAvailableTimeframes()).toEqual(['1d']);
    });
  });

  describe('getCompanyProfile', () => {
    it('should return CompanyProfile from fetchCompany', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCE_RESPONSE),
      } as unknown as Response);

      const profile = await adapter.getCompanyProfile('THYAO');
      expect(profile).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          companyName: 'THYAO',
          source: 'serpapi',
        }),
      );
    });
  });

  describe('getFinancialRatios', () => {
    it('should parse ratio highlights into FinancialRatios', async () => {
      const ratioResponse = {
        search_metadata: { status: 'Success', total_time_taken: 0.4, engine: 'google_finance', id: 'test7' },
        key_financial_highlights: [
          { label: 'P/B', value: '2.5' },
          { label: 'EV/EBITDA', value: '8.3' },
        ],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(ratioResponse),
      } as unknown as Response);

      const ratios = await adapter.getFinancialRatios('THYAO');
      expect(ratios).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          priceToBook: 2.5,
          enterpriseValueToEBITDA: 8.3,
          source: 'serpapi',
        }),
      );
    });

    it('should return null when no API key configured', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const ratios = await unconfigured.getFinancialRatios('THYAO');
      expect(ratios).toBeNull();
    });
  });

  describe('getBalanceSheet', () => {
    it('should return BalanceSheet', async () => {
      const balanceSheet = await adapter.getBalanceSheet('THYAO');
      expect(balanceSheet).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          source: 'serpapi',
        }),
      );
    });
  });

  describe('getIncomeStatement', () => {
    it('should return IncomeStatement from fetchFinancials', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCIALS_RESPONSE),
      } as unknown as Response);

      const income = await adapter.getIncomeStatement('THYAO');
      expect(income).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          source: 'serpapi',
        }),
      );
    });
  });

  describe('getSector', () => {
    it('should return CompanySector from fetchSector', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(SERPAPI_FINANCE_RESPONSE),
      } as unknown as Response);

      const sector = await adapter.getSector('THYAO');
      expect(sector).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          source: 'serpapi',
        }),
      );
    });
  });

  describe('getMacroIndicators', () => {
    it('should return empty array', async () => {
      const indicators = await adapter.getMacroIndicators();
      expect(indicators).toEqual([]);
    });
  });

  describe('fetchGoogleFinance', () => {
    it('should parse all finance fields from SerpAPI response', async () => {
      const response = {
        search_metadata: { status: 'Success', total_time_taken: 0.5, engine: 'google_finance', id: 'test' },
        finance_results: [
          { title: 'THYAO', link: 'https://www.google.com/finance/quote/THYAO:IST', snippet: 'Price 250.50 TRY · Daily Change +3.50 · Change % +1.42% · Volume 50M · Market Cap 123B' },
        ],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(response),
      } as unknown as Response);

      const finance = await adapter.fetchGoogleFinance('THYAO');
      expect(finance).toEqual(
        expect.objectContaining({
          symbol: 'THYAO',
          price: 250.5,
          dailyChange: 3.5,
          changePercent: 1.42,
          volume: 50000000,
          marketCap: 123000000000,
          currency: 'TRY',
          exchange: 'BIST',
          source: 'serpapi',
        }),
      );
    });

    it('should return null when no price data found', async () => {
      const response = {
        search_metadata: { status: 'Success', total_time_taken: 0.3, engine: 'google_finance', id: 'test2' },
        organic_results: [{ title: 'THYAO', link: 'https://example.com', snippet: 'Turkish Airlines' }],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(response),
      } as unknown as Response);

      const finance = await adapter.fetchGoogleFinance('THYAO');
      expect(finance).toBeNull();
    });
  });

  describe('fetchGoogleNews', () => {
    it('should parse news results from SerpAPI response', async () => {
      const response = {
        search_metadata: { status: 'Success', total_time_taken: 0.3, engine: 'google_news', id: 'test' },
        news_results: [
          { title: 'THYAO Q1 Earnings', link: 'https://example.com/1', snippet: 'Strong earnings', date: '2026-04-01', source: { name: 'Bloomberg' } },
          { title: 'THYAO Hakkında', link: 'https://example.com/2', snippet: 'Haber metni', date: '2026-04-02' },
        ],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(response),
      } as unknown as Response);

      const news = await adapter.fetchGoogleNews('THYAO');
      expect(news).toHaveLength(2);
      expect(news[0].headline).toBe('THYAO Q1 Earnings');
      expect(news[0].source).toBe('Bloomberg');
      expect(news[1].source).toBe('Google News');
    });

    it('should return empty array when no API key', async () => {
      const unconfigured = new SerpApiAdapter(circuitBreaker, { ...config, apiKey: '' });
      const news = await unconfigured.fetchGoogleNews('THYAO');
      expect(news).toEqual([]);
    });
  });

  describe('fetchGoogleSearch', () => {
    it('should parse organic results from SerpAPI response', async () => {
      const response = {
        search_metadata: { status: 'Success', total_time_taken: 0.3, engine: 'google', id: 'test' },
        organic_results: [
          { title: 'THYAO Hisse Fiyatı', link: 'https://example.com/1', snippet: 'THYAO hisse fiyat bilgisi' },
          { title: 'THYAO BIST', link: 'https://example.com/2', snippet: 'THYAO BIST hisse' },
        ],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(response),
      } as unknown as Response);

      const results = await adapter.fetchGoogleSearch('THYAO');
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('THYAO Hisse Fiyatı');
      expect(results[0].link).toBe('https://example.com/1');
    });
  });

  describe('mergeNews', () => {
    it('should merge and deduplicate Google News and Finnhub News', async () => {
      process.env.FINNHUB_API_KEY = 'test-key';
      const googleNews = [
        { headline: 'THYAO Q1 Earnings', source: 'Bloomberg', publishedTime: '2026-04-02T10:00:00Z', url: 'https://example.com/1', snippet: 'Strong earnings' },
      ];

      fetchMock.mockImplementation((url: string) => {
        if (url.includes('finnhub.io')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue([
              { headline: 'THYAO Q1 Earnings', source: 'Finnhub', datetime: Math.floor(new Date('2026-04-02T09:00:00Z').getTime() / 1000), url: 'https://example.com/2', summary: 'Same story' },
              { headline: 'THYAO New Contract', source: 'Reuters', datetime: Math.floor(new Date('2026-04-01T08:00:00Z').getTime() / 1000), url: 'https://example.com/3', summary: 'New contract' },
            ]),
          } as unknown as Response);
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ search_metadata: { status: 'Success' }, news_results: googleNews.map(a => ({ title: a.headline, link: a.url, snippet: a.snippet, date: a.publishedTime, source: { name: a.source } })) }),
        } as unknown as Response);
      });

      const merged = await adapter.mergeNews('THYAO');
      expect(merged).toHaveLength(2);
      expect(merged[0].title).toBe('THYAO Q1 Earnings');
      expect(merged[1].title).toBe('THYAO New Contract');
      delete process.env.FINNHUB_API_KEY;
    });

    it('should return empty array when both sources fail', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      } as unknown as Response);

      const merged = await adapter.mergeNews('THYAO');
      expect(merged).toEqual([]);
    });
  });

  describe('getProviderHealth', () => {
    it('should return health status with latency', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ search_metadata: { status: 'Success' } }),
      } as unknown as Response);

      const health = await adapter.getProviderHealth();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
      expect(health.lastUpdate).not.toBeNull();
    });

    it('should return offline when no requests made and connection fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as unknown as Response);

      const health = await adapter.getProviderHealth();
      expect(health.healthy).toBe(false);
    });
  });
});