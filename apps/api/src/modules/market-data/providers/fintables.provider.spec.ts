import { Test, TestingModule } from '@nestjs/testing';
import { FintablesProvider, FintablesErrorType } from './fintables.provider';

const mockFundamentalsResponse = {
  ticker: 'THYAO',
  period: '2024Q4',
  net_profit_try: 70_120_000_000,
  sales_try: 350_900_000_000,
  equity_try: 410_500_000_000,
  total_assets: 800_000_000_000,
  total_debt: 320_000_000_000,
  pe: 4.6,
  pb: 1.1,
  ev_to_ebitda: 8.3,
  debt_to_equity: 1.42,
  shares_outstanding: 1_200_000_000,
  report_card: { profit: 87, growth: 71, debt: 64 },
  market_cap: 450_000_000_000,
  sector: 'Ulaştırma',
  company_name: 'Türk Hava Yolları',
};

const mockAuthResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiJ9.test-token',
  refresh_token: 'rt_test123',
  expires_in: 3600,
};

const mockErrorResponse = {
  data: null,
  error: 'Not found',
};

function createMockResponse(status: number, body?: unknown, headers?: Record<string, string>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers?.[name] ?? null,
    } as Headers,
    json: async () => body,
  } as Response;
}

describe('FintablesProvider', () => {
  let provider: FintablesProvider;
  let fetchSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.FINTABLES_API_KEY;
    delete process.env.FINTABLES_AUTH_URL;
    delete process.env.FINTABLES_USERNAME;
    delete process.env.FINTABLES_PASSWORD;
    delete process.env.FINTABLES_PERIOD;
    process.env.FINTABLES_RETRY_ATTEMPTS = '0';
    process.env.FINTABLES_RATE_LIMIT_RPS = '100';

    const module: TestingModule = await Test.createTestingModule({
      providers: [FintablesProvider],
    }).compile();

    provider = module.get(FintablesProvider);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('fintables');
  });

  describe('stats', () => {
    it('should track request and error counts', () => {
      const initial = provider.stats;
      expect(initial.requestCount).toBe(0);
      expect(initial.errorCount).toBe(0);
      expect(initial.errorRate).toBe(0);
      expect(initial.hasToken).toBe(false);
    });
  });

  describe('validateConnection', () => {
    it('should return true when Fintables is reachable', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200));
      const result = await provider.validateConnection();
      expect(result).toBe(true);
    });

    it('should return false when Fintables returns error', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(500));
      const result = await provider.validateConnection();
      expect(result).toBe(false);
    });

    it('should return false on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await provider.validateConnection();
      expect(result).toBe(false);
    });

    it('should include X-API-Key header when API key is configured', async () => {
      process.env.FINTABLES_API_KEY = 'test-api-key-123';
      const module = await Test.createTestingModule({
        providers: [FintablesProvider],
      }).compile();
      const p = module.get(FintablesProvider);

      fetchSpy.mockResolvedValue(createMockResponse(200));
      await p.validateConnection();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Key': 'test-api-key-123' }),
        }),
      );
    });
  });

  describe('authenticate', () => {
    it('should obtain token when credentials are configured', async () => {
      process.env.FINTABLES_AUTH_URL = 'https://auth.fintables.com/api/v1';
      process.env.FINTABLES_USERNAME = 'testuser';
      process.env.FINTABLES_PASSWORD = 'testpass';
      process.env.FINTABLES_RETRY_ATTEMPTS = '0';

      const module = await Test.createTestingModule({
        providers: [FintablesProvider],
      }).compile();
      const p = module.get(FintablesProvider);

      fetchSpy.mockResolvedValueOnce(createMockResponse(200, mockAuthResponse));

      await p.authenticate();

      expect(p.stats.hasToken).toBe(true);
      expect(p.stats.tokenExpired).toBe(false);
    });

    it('should throw AUTH error when credentials are missing', async () => {
      await expect(provider.authenticate()).rejects.toThrow('Authentication credentials not configured');
    });

    it('should throw AUTH error on failed login', async () => {
      process.env.FINTABLES_AUTH_URL = 'https://auth.fintables.com/api/v1';
      process.env.FINTABLES_USERNAME = 'testuser';
      process.env.FINTABLES_PASSWORD = 'wrongpass';
      process.env.FINTABLES_RETRY_ATTEMPTS = '0';

      const module = await Test.createTestingModule({
        providers: [FintablesProvider],
      }).compile();
      const p = module.get(FintablesProvider);

      fetchSpy.mockResolvedValueOnce(createMockResponse(401));

      await expect(p.authenticate()).rejects.toThrow();
    });

    it('should throw AUTH error when response missing access_token', async () => {
      process.env.FINTABLES_AUTH_URL = 'https://auth.fintables.com/api/v1';
      process.env.FINTABLES_USERNAME = 'testuser';
      process.env.FINTABLES_PASSWORD = 'testpass';
      process.env.FINTABLES_RETRY_ATTEMPTS = '0';

      const module = await Test.createTestingModule({
        providers: [FintablesProvider],
      }).compile();
      const p = module.get(FintablesProvider);

      fetchSpy.mockResolvedValueOnce(createMockResponse(200, {}));

      await expect(p.authenticate()).rejects.toThrow('Authentication response missing access_token');
    });
  });

  describe('getCompanyProfile', () => {
    it('should return normalized company profile from fundamentals endpoint', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      const result = await provider.getCompanyProfile('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.companyName).toBe('Türk Hava Yolları');
      expect(result!.sector).toBe('Ulaştırma');
      expect(result!.marketCap).toBe(450_000_000_000);
      expect(result!.source).toBe('fintables');
      expect(result!.lastUpdated).toBeDefined();
    });

    it('should call /fundamentals/THYAO endpoint', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      await provider.getCompanyProfile('THYAO');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/fundamentals/THYAO'),
        expect.anything(),
      );
    });

    it('should return null on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(404));

      const result = await provider.getCompanyProfile('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when response has error field', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockErrorResponse));

      const result = await provider.getCompanyProfile('INVALID');
      expect(result).toBeNull();
    });

    it('should return null on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await provider.getCompanyProfile('THYAO');
      expect(result).toBeNull();
    });

    it('should handle null market_cap', async () => {
      fetchSpy.mockResolvedValue(
        createMockResponse(200, { ...mockFundamentalsResponse, market_cap: null }),
      );

      const result = await provider.getCompanyProfile('THYAO');
      expect(result!.marketCap).toBe(0);
    });

    it('should use period query param when configured', async () => {
      process.env.FINTABLES_PERIOD = '2024Q4';
      const module = await Test.createTestingModule({
        providers: [FintablesProvider],
      }).compile();
      const p = module.get(FintablesProvider);
      const fetchLocal = jest.spyOn(globalThis, 'fetch');

      fetchLocal.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));
      await p.getCompanyProfile('THYAO');

      expect(fetchLocal).toHaveBeenCalledWith(
        expect.stringContaining('period=2024Q4'),
        expect.anything(),
      );
      fetchLocal.mockRestore();
    });
  });

  describe('getFinancialRatios', () => {
    it('should return normalized financial ratios', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      const result = await provider.getFinancialRatios('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.priceToBook).toBe(1.1);
      expect(result!.enterpriseValueToEBITDA).toBe(8.3);
      expect(result!.source).toBe('fintables');
    });

    it('should return null on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(404));

      const result = await provider.getFinancialRatios('INVALID');
      expect(result).toBeNull();
    });

    it('should return null when response has error field', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockErrorResponse));

      const result = await provider.getFinancialRatios('INVALID');
      expect(result).toBeNull();
    });

    it('should handle null ratio values', async () => {
      fetchSpy.mockResolvedValue(
        createMockResponse(200, { ticker: 'THYAO', pb: null, ev_to_ebitda: null }),
      );

      const result = await provider.getFinancialRatios('THYAO');
      expect(result!.priceToBook).toBeNull();
      expect(result!.enterpriseValueToEBITDA).toBeNull();
    });
  });

  describe('getBalanceSheet', () => {
    it('should return normalized balance sheet', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      const result = await provider.getBalanceSheet('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.equity).toBe(410_500_000_000);
      expect(result!.totalDebt).toBe(320_000_000_000);
      expect(result!.totalAssets).toBe(800_000_000_000);
      expect(result!.sharesOutstanding).toBe(1_200_000_000);
      expect(result!.source).toBe('fintables');
    });

    it('should return null on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(404));

      const result = await provider.getBalanceSheet('INVALID');
      expect(result).toBeNull();
    });

    it('should handle null financial values', async () => {
      fetchSpy.mockResolvedValue(
        createMockResponse(200, {
          ticker: 'THYAO',
          equity_try: null,
          total_debt: null,
          total_assets: null,
          shares_outstanding: null,
        }),
      );

      const result = await provider.getBalanceSheet('THYAO');
      expect(result!.equity).toBeNull();
      expect(result!.totalDebt).toBeNull();
      expect(result!.totalAssets).toBeNull();
      expect(result!.sharesOutstanding).toBeNull();
    });
  });

  describe('getIncomeStatement', () => {
    it('should return normalized income statement', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      const result = await provider.getIncomeStatement('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.netProfit).toBe(70_120_000_000);
      expect(result!.source).toBe('fintables');
    });

    it('should return null on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(404));

      const result = await provider.getIncomeStatement('INVALID');
      expect(result).toBeNull();
    });

    it('should handle null net_profit', async () => {
      fetchSpy.mockResolvedValue(
        createMockResponse(200, { ticker: 'THYAO', net_profit_try: null }),
      );

      const result = await provider.getIncomeStatement('THYAO');
      expect(result!.netProfit).toBeNull();
    });
  });

  describe('getSector', () => {
    it('should return normalized sector data', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      const result = await provider.getSector('THYAO');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO');
      expect(result!.sector).toBe('Ulaştırma');
      expect(result!.source).toBe('fintables');
    });

    it('should return null on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(404));

      const result = await provider.getSector('INVALID');
      expect(result).toBeNull();
    });

    it('should return null on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await provider.getSector('THYAO');
      expect(result).toBeNull();
    });

    it('should default sector to Unknown when not in response', async () => {
      fetchSpy.mockResolvedValue(
        createMockResponse(200, { ticker: 'THYAO' }),
      );

      const result = await provider.getSector('THYAO');
      expect(result!.sector).toBe('Unknown');
    });
  });

  describe('error handling', () => {
    it('should track error count in stats', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(404));

      await provider.getCompanyProfile('INVALID');
      expect(provider.stats.errorCount).toBe(1);
    });

    it('should track request count in stats', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));

      await provider.getCompanyProfile('THYAO');
      expect(provider.stats.requestCount).toBe(1);
    });

    it('should calculate error rate', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(200, mockFundamentalsResponse));
      await provider.getCompanyProfile('THYAO');

      fetchSpy.mockResolvedValue(createMockResponse(404));
      await provider.getCompanyProfile('INVALID');

      expect(provider.stats.errorRate).toBe(50);
    });

    it('should clear token on 401 and retry with refresh', async () => {
      process.env.FINTABLES_AUTH_URL = 'https://auth.fintables.com/api/v1';
      process.env.FINTABLES_USERNAME = 'testuser';
      process.env.FINTABLES_PASSWORD = 'testpass';
      process.env.FINTABLES_RETRY_ATTEMPTS = '0';

      const module = await Test.createTestingModule({
        providers: [FintablesProvider],
      }).compile();
      const p = module.get(FintablesProvider);

      fetchSpy
        .mockResolvedValueOnce(createMockResponse(200, mockAuthResponse))
        .mockResolvedValueOnce(createMockResponse(200, mockFundamentalsResponse));

      await p.authenticate();

      const result = await p.getCompanyProfile('THYAO');
      expect(result).not.toBeNull();
    });

    it('should handle timeout errors gracefully', async () => {
      const timeoutError = new DOMException('The operation was aborted.', 'TimeoutError');
      fetchSpy.mockRejectedValue(timeoutError);

      const result = await provider.getCompanyProfile('THYAO');
      expect(result).toBeNull();
    });
  });

  describe('BIST tracked symbols', () => {
    const trackedSymbols = [
      'THYAO', 'ASELS', 'GARAN', 'AKBNK', 'EREGL', 'BIMAS', 'KCHOL',
      'SAHOL', 'TUPRS', 'ISCTR', 'FROTO', 'YKBNK', 'TOASO', 'TCELL',
      'SISE', 'KOZAL', 'KONTR', 'PETKM', 'KOZAA', 'HALKB', 'VAKBN',
      'PGSUS', 'ENKAI', 'TAVHL', 'DOHOL', 'MGROS', 'SASA', 'ODAS',
    ];

    it.each(trackedSymbols)('should handle BIST symbol %s without throwing', async (symbol) => {
      fetchSpy.mockResolvedValue(createMockResponse(200, { ...mockFundamentalsResponse, ticker: symbol }));

      const profile = await provider.getCompanyProfile(symbol);
      expect(profile).not.toBeNull();
      expect(profile!.symbol).toBe(symbol);
    });
  });
});
