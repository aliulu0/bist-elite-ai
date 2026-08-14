import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { MarketDataOrchestrator } from './market-data-orchestrator';
import { RequestDeduplicatorService } from '../dedup/request-deduplicator.service';
import { IUnifiedMarketDataProvider } from '../providers/unified/unified-provider.interface';
import { MarketDataConfig } from '../config/market-data.config';
import { MarketDataValidationService } from '../market-data-validation.service';
import { MarketDataPoint } from '../interfaces';
import {
  Company,
  FinancialStatement,
  Disclosure,
} from '../interfaces/unified-domain.types';

function createMockProvider(
  name: string,
  overrides: Partial<IUnifiedMarketDataProvider> & { getDiagnostics?: () => unknown } = {},
): IUnifiedMarketDataProvider {
  return {
    name,
    readonly: undefined,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    health: jest.fn().mockResolvedValue(true),
    validateConnection: jest.fn().mockResolvedValue(true),
    fetchCompany: jest.fn().mockResolvedValue(null),
    fetchFinancials: jest.fn().mockResolvedValue(null),
    fetchBalanceSheet: jest.fn().mockResolvedValue(null),
    fetchIncomeStatement: jest.fn().mockResolvedValue(null),
    fetchCashFlow: jest.fn().mockResolvedValue(null),
    fetchSector: jest.fn().mockResolvedValue(null),
    fetchDisclosures: jest.fn().mockResolvedValue([]),
    getHistoricalData: jest.fn().mockResolvedValue([]),
    getLatestPrice: jest.fn().mockResolvedValue(null),
    getAvailableTimeframes: jest.fn().mockReturnValue([]),
    getCompanyProfile: jest.fn().mockResolvedValue(null),
    getFinancialRatios: jest.fn().mockResolvedValue(null),
    getBalanceSheet: jest.fn().mockResolvedValue(null),
    getIncomeStatement: jest.fn().mockResolvedValue(null),
    getSector: jest.fn().mockResolvedValue(null),
    getMacroIndicators: jest.fn().mockResolvedValue([]),
    getStatus: jest.fn().mockReturnValue({
      name,
      connected: true,
      circuitState: 'CLOSED',
      consecutiveFailures: 0,
      lastSuccessTime: Date.now(),
      lastFailureTime: null,
      uptimeMs: 1000,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatencyMs: 0,
      lastHealthCheck: new Date().toISOString(),
    }),
    normalize: jest.fn().mockImplementation((data: unknown) => data),
    ...overrides,
  } as IUnifiedMarketDataProvider;
}

function createCompany(symbol: string, source: string): Company {
  return {
    symbol,
    name: `${symbol} Corp`,
    sector: 'Technology',
    marketCap: 1_000_000_000,
    sharesOutstanding: 10_000_000,
    currency: 'TRY',
    exchange: 'BIST',
    lastUpdated: new Date().toISOString(),
    source,
  };
}

function makeConfig(overrides: Record<string, { enabled: boolean; priority: number }> = {}): MarketDataConfig {
  return {
    providers: {
      fintables: { enabled: true, priority: 1, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' },
      alpha_vantage: { enabled: true, priority: 2, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' },
      finnhub: { enabled: true, priority: 3, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' },
      yahoo: { enabled: true, priority: 4, timeout: 15000, retries: 2, apiKey: '', baseUrl: '' },
      kap: { enabled: true, priority: 5, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' },
      tcmb: { enabled: true, priority: 6, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' },
      mkk: { enabled: true, priority: 7, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' },
      serpapi: { enabled: true, priority: 8, timeout: 15000, retries: 2, apiKey: '', baseUrl: '' },
      ...overrides,
    },
    cache: {
      companyTtlMs: 12 * 60 * 60 * 1000,
      financialTtlMs: 24 * 60 * 60 * 1000,
      sectorTtlMs: 24 * 60 * 60 * 1000,
      disclosureTtlMs: 15 * 60 * 1000,
      macroIndicatorsTtlMs: 30 * 60 * 1000,
      tcmbTtlMs: 6 * 60 * 60 * 1000,
      mkkTtlMs: 12 * 60 * 60 * 1000,
      historicalTtlMs: 24 * 60 * 60 * 1000,
    },
  };
}

describe('MarketDataOrchestrator', () => {
  let circuitBreaker: CircuitBreakerService;
  let cacheService: MarketDataCacheService;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    const mockCacheService = {
      get: jest.fn().mockReturnValue(undefined),
      set: jest.fn(),
      getOrSet: jest.fn(),
      invalidate: jest.fn(),
      clearAll: jest.fn(),
      getProviderCacheEntries: jest.fn().mockReturnValue(0),
    };
    cacheService = mockCacheService as unknown as MarketDataCacheService;
  });

  describe('provider registration', () => {
    it('should register providers on construction', () => {
      const p1 = createMockProvider('fintables');
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], makeConfig());
      expect(orchestrator.getAvailableProviders()).toContain('fintables');
    });

    it('should register providers dynamically', () => {
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [], makeConfig());
      const p1 = createMockProvider('fintables');
      orchestrator.registerProvider(p1);
      expect(orchestrator.getAvailableProviders()).toContain('fintables');
    });

    it('should register multiple providers', () => {
      const p1 = createMockProvider('fintables');
      const p2 = createMockProvider('finnhub');
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], makeConfig());
      const available = orchestrator.getAvailableProviders();
      expect(available).toContain('fintables');
      expect(available).toContain('finnhub');
    });
  });

  describe('provider selection', () => {
    it('should select provider by priority', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'fintables')),
      });
      const p2 = createMockProvider('finnhub', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'finnhub')),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: true, priority: 2 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p2, p1], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).not.toBeNull();
      expect(result!.provider).toBe('fintables');
    });

    it('should respect priority ordering', async () => {
      const p1 = createMockProvider('finnhub', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'finnhub')),
      });
      const p2 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'fintables')),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: true, priority: 2 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result!.provider).toBe('fintables');
    });
  });

  describe('fallback', () => {
    it('should fallback to next provider on failure', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockRejectedValue(new Error('Network error')),
      });
      const p2 = createMockProvider('finnhub', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'finnhub')),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: true, priority: 2 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).not.toBeNull();
      expect(result!.provider).toBe('finnhub');
    });

    it('should return null when all providers fail', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const p2 = createMockProvider('finnhub', {
        fetchCompany: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: true, priority: 2 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).toBeNull();
    });
  });

  describe('cache', () => {
    it('should return cached data when available', async () => {
      const cached = createCompany('THYAO', 'cache');
      const mockGet = jest.fn().mockReturnValue(cached);
      const mockCache = { get: mockGet, set: jest.fn() } as unknown as MarketDataCacheService;

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, mockCache, [], makeConfig());
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).not.toBeNull();
      expect(result!.cached).toBe(true);
      expect(result!.provider).toBe('cache');
    });

    it('should cache fetched data from provider', async () => {
      const company = createCompany('THYAO', 'fintables');
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(company),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const mockGet = jest.fn().mockReturnValue(undefined);
      const mockSet = jest.fn();
      const mockCache = { get: mockGet, set: mockSet } as unknown as MarketDataCacheService;

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, mockCache, [p1], config);
      await orchestrator.fetchCompany('THYAO');

      expect(mockSet).toHaveBeenCalledWith(
        'fintables',
        'company',
        'THYAO',
        company,
        expect.any(Number),
      );
    });

    it('should skip cache on cache miss', async () => {
      const company = createCompany('THYAO', 'fintables');
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(company),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const mockGet = jest.fn().mockReturnValue(undefined);
      const mockCache = { get: mockGet, set: jest.fn() } as unknown as MarketDataCacheService;

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, mockCache, [p1], config);
      await orchestrator.fetchCompany('THYAO');

      expect(mockGet).toHaveBeenCalled();
      expect(p1.fetchCompany).toHaveBeenCalled();
    });
  });

  describe('circuit breaker', () => {
    it('should skip provider with open circuit', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'fintables')),
      });
      const p2 = createMockProvider('finnhub', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'finnhub')),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: true, priority: 2 },
      });

      circuitBreaker.recordFailure('fintables');
      circuitBreaker.recordFailure('fintables');
      circuitBreaker.recordFailure('fintables');

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).not.toBeNull();
      expect(result!.provider).toBe('finnhub');
      expect(p1.fetchCompany).not.toHaveBeenCalled();
    });

    it('should open circuit after consecutive failures', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      await orchestrator.fetchCompany('THYAO');
      await orchestrator.fetchCompany('THYAO');
      await orchestrator.fetchCompany('THYAO');

      expect(circuitBreaker.getState('fintables').state).toBe('OPEN');
    });

    it('should not fail on null return from provider', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(null),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      await orchestrator.fetchCompany('THYAO');

      expect(circuitBreaker.getState('fintables').state).toBe('CLOSED');
    });
  });

  describe('provider enable/disable', () => {
    it('should not use disabled provider', async () => {
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'fintables')),
      });
      const config = makeConfig({
        fintables: { enabled: false, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).toBeNull();
      expect(p1.fetchCompany).not.toHaveBeenCalled();
    });

    it('should not list disabled providers', () => {
      const p1 = createMockProvider('fintables');
      const p2 = createMockProvider('finnhub');
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: false, priority: 2 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);
      const available = orchestrator.getAvailableProviders();

      expect(available).toContain('fintables');
      expect(available).not.toContain('finnhub');
    });
  });

  describe('normalization', () => {
    it('should return normalized Company domain model', async () => {
      const company = createCompany('THYAO', 'fintables');
      const p1 = createMockProvider('fintables', {
        fetchCompany: jest.fn().mockResolvedValue(company),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      const result = await orchestrator.fetchCompany('THYAO');

      expect(result).not.toBeNull();
      expect(result!.data).toHaveProperty('symbol');
      expect(result!.data).toHaveProperty('name');
      expect(result!.data).toHaveProperty('sector');
      expect(result!.data).toHaveProperty('marketCap');
      expect(result!.data).toHaveProperty('source');
      expect(result!.data.source).toBe('fintables');
    });

    it('should return normalized FinancialStatement domain model', async () => {
      const financials: FinancialStatement = {
        symbol: 'THYAO',
        period: 'annual',
        revenue: 100_000_000,
        netIncome: 10_000_000,
        ebitda: 15_000_000,
        grossProfit: 20_000_000,
        operatingIncome: 12_000_000,
        costOfRevenue: 80_000_000,
        lastUpdated: new Date().toISOString(),
        source: 'fintables',
      };
      const p1 = createMockProvider('fintables', {
        fetchFinancials: jest.fn().mockResolvedValue(financials),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      const result = await orchestrator.fetchFinancials('THYAO');

      expect(result).not.toBeNull();
      expect(result!.data.revenue).toBe(100_000_000);
      expect(result!.data.source).toBe('fintables');
    });
  });

  describe('health filtering', () => {
    it('should report provider health', async () => {
      const p1 = createMockProvider('fintables', {
        health: jest.fn().mockResolvedValue(true),
      });
      const p2 = createMockProvider('finnhub', {
        health: jest.fn().mockResolvedValue(false),
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], makeConfig());
      const health = await orchestrator.getProviderHealth();

      expect(health.fintables).toBe(true);
      expect(health.finnhub).toBe(false);
    });
  });

  describe('configuration loading', () => {
    it('should respect enabled/disabled from config', () => {
      const p1 = createMockProvider('fintables');
      const p2 = createMockProvider('finnhub');
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
        finnhub: { enabled: false, priority: 2 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);
      const available = orchestrator.getAvailableProviders();

      expect(available).toContain('fintables');
      expect(available).not.toContain('finnhub');
    });

    it('should use default config when none provided', () => {
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, []);
      expect(orchestrator.getAvailableProviders()).toEqual([]);
    });
  });

  describe('disclosures', () => {
    it('should fetch disclosures with fallback', async () => {
      const disclosures: Disclosure[] = [
        {
          symbol: 'THYAO',
          title: 'Important Announcement',
          date: '2025-01-15',
          category: 'Material Event',
          url: 'https://example.com',
          source: 'kap',
        },
      ];
      const p1 = createMockProvider('kap', {
        fetchDisclosures: jest.fn().mockResolvedValue(disclosures),
      });
      const config = makeConfig({
        kap: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      const result = await orchestrator.fetchDisclosures('THYAO');

      expect(result).not.toBeNull();
      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].title).toBe('Important Announcement');
    });
  });

  describe('empty state', () => {
    it('should return null with no providers', async () => {
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [], makeConfig());
      const result = await orchestrator.fetchCompany('THYAO');
      expect(result).toBeNull();
    });

    it('should return empty provider list with no providers', () => {
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [], makeConfig());
      expect(orchestrator.getAvailableProviders()).toEqual([]);
    });
  });

  describe('macro indicator caching', () => {
    it('should cache macro indicators with 30 minute TTL', async () => {
      const macro = [
        { symbol: 'vix', value: 30, change: 1, changePercent: 3.4, timestamp: new Date().toISOString(), source: 'finnhub' },
      ];
      const p1 = createMockProvider('finnhub', {
        getMacroIndicators: jest.fn().mockResolvedValue(macro),
      });
      const config = makeConfig({
        finnhub: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      const first = await orchestrator.fetchMacroIndicators();
      const second = await orchestrator.fetchMacroIndicators();

      expect(first).toHaveLength(1);
      expect(first[0].symbol).toBe('vix');
      expect(cacheService.set).toHaveBeenCalledWith(
        'any',
        'macroIndicators',
        'all',
        macro,
        30 * 60 * 1000,
      );
      expect(second).toHaveLength(1);
    });

    it('should serve macro indicators from cache when available', async () => {
      const cached = [
        { symbol: 'dxy', value: 110, change: 0.5, changePercent: 0.45, timestamp: new Date().toISOString(), source: 'finnhub' },
      ];
      cacheService.get = jest.fn().mockReturnValueOnce(cached);

      const p1 = createMockProvider('finnhub');
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], makeConfig());
      const result = await orchestrator.fetchMacroIndicators();

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('dxy');
      expect(p1.getMacroIndicators).not.toHaveBeenCalled();
    });
  });

  describe('provider status observability', () => {
    it('should expose provider status with config metadata', async () => {
      const p1 = createMockProvider('fintables', {
        getStatus: jest.fn().mockReturnValue({
          name: 'fintables',
          connected: true,
          circuitState: 'CLOSED',
          consecutiveFailures: 0,
          lastSuccessTime: Date.now(),
          lastFailureTime: null,
          uptimeMs: 1000,
          totalRequests: 5,
          successfulRequests: 4,
          failedRequests: 1,
          avgLatencyMs: 250,
          lastHealthCheck: new Date().toISOString(),
        }),
      });
      const config = makeConfig({
        fintables: { enabled: true, priority: 1 },
      });

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);
      const statuses = await orchestrator.getProviderStatus();

      expect(statuses).toHaveLength(1);
      expect(statuses[0].name).toBe('fintables');
      expect(statuses[0].enabled).toBe(true);
      expect(statuses[0].priority).toBe(1);
      expect(statuses[0].totalRequests).toBe(5);
      expect(statuses[0].avgLatencyMs).toBe(250);
    });
  });

  describe('latest price', () => {
    const pricePoint: MarketDataPoint = {
      symbol: 'THYAO.IS',
      timeframe: '1d',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 1000000,
      timestamp: '2025-01-15T00:00:00.000Z',
      validationStatus: 'valid',
    };

    it('should fetch latest price from first enabled provider', async () => {
      const yahoo = createMockProvider('yahoo', {
        getLatestPrice: jest.fn().mockResolvedValue(pricePoint),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [yahoo], makeConfig());

      const result = await orchestrator.fetchLatestPrice('THYAO.IS');

      expect(result).not.toBeNull();
      expect(result!.data).toEqual(pricePoint);
      expect(result!.provider).toBe('yahoo');
      expect(result!.cached).toBe(false);
      expect(yahoo.getLatestPrice).toHaveBeenCalledWith('THYAO.IS');
    });

    it('should serve latest price from cache', async () => {
      const cached = pricePoint;
      const mockGet = jest.fn().mockReturnValue(cached);
      const mockCache = { get: mockGet, set: jest.fn() } as unknown as MarketDataCacheService;
      const yahoo = createMockProvider('yahoo');

      const orchestrator = new MarketDataOrchestrator(circuitBreaker, mockCache, [yahoo], makeConfig());
      const result = await orchestrator.fetchLatestPrice('THYAO.IS');

      expect(result).not.toBeNull();
      expect(result!.cached).toBe(true);
      expect(result!.provider).toBe('cache');
      expect(yahoo.getLatestPrice).not.toHaveBeenCalled();
    });

    it('should return null when no provider returns a price', async () => {
      const yahoo = createMockProvider('yahoo', {
        getLatestPrice: jest.fn().mockResolvedValue(null),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [yahoo], makeConfig());

      const result = await orchestrator.fetchLatestPrice('UNKNOWN');

      expect(result).toBeNull();
    });
  });

  describe('historical data', () => {
    it('should fetch and cache historical data from the first provider with data', async () => {
      const points: MarketDataPoint[] = [
        {
          symbol: 'THYAO.IS',
          timeframe: '1d',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000000,
          timestamp: '2025-01-15T00:00:00.000Z',
          validationStatus: 'valid',
        },
      ];
      const yahoo = createMockProvider('yahoo', {
        getHistoricalData: jest.fn().mockResolvedValue(points),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [yahoo], makeConfig());

      const result = await orchestrator.fetchHistoricalData('THYAO.IS', '1d');

      expect(result).not.toBeNull();
      expect(result!.data).toHaveLength(1);
      expect(result!.provider).toBe('yahoo');
      expect(result!.cached).toBe(false);
      expect(cacheService.set).toHaveBeenCalledWith('yahoo', 'historical', 'THYAO.IS|1d', points, expect.any(Number));
    });

    it('should return null when no provider returns data', async () => {
      const yahoo = createMockProvider('yahoo', {
        getHistoricalData: jest.fn().mockResolvedValue([]),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [yahoo], makeConfig());

      const result = await orchestrator.fetchHistoricalData('UNKNOWN', '1d');

      expect(result).toBeNull();
    });

    it('should serve historical data from cache', async () => {
      const points: MarketDataPoint[] = [
        {
          symbol: 'THYAO.IS',
          timeframe: '1d',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000000,
          timestamp: '2025-01-15T00:00:00.000Z',
          validationStatus: 'valid',
        },
      ];
      const mockCache = {
        get: jest.fn().mockReturnValue(points),
        set: jest.fn(),
      } as unknown as MarketDataCacheService;
      const yahoo = createMockProvider('yahoo');
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, mockCache, [yahoo], makeConfig());

      const result = await orchestrator.fetchHistoricalData('THYAO.IS', '1d');

      expect(result).not.toBeNull();
      expect(result!.cached).toBe(true);
      expect(result!.provider).toBe('cache');
      expect(yahoo.getHistoricalData).not.toHaveBeenCalled();
    });
  });

  describe('supported timeframes', () => {
    it('should return timeframes from the first provider that exposes them', () => {
      const yahoo = createMockProvider('yahoo', {
        getAvailableTimeframes: jest.fn().mockReturnValue(['4h', '1d', '1w']),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [yahoo], makeConfig());

      expect(orchestrator.getSupportedTimeframes()).toEqual(['4h', '1d', '1w']);
    });

    it('should fall back to default timeframes when no provider exposes any', () => {
      const p1 = createMockProvider('yahoo', {
        getAvailableTimeframes: jest.fn().mockReturnValue([]),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], makeConfig());

      expect(orchestrator.getSupportedTimeframes()).toEqual(['4h', '1d', '1w', '1m', '3m', '6m']);
    });
  });

  describe('symbol normalization', () => {
    it('should normalize symbols via the normalizer before provider calls', async () => {
      const normalize = jest.fn().mockReturnValue('THYAO');
      const normalizer = { normalize };
      const p1 = createMockProvider('yahoo', {
        getLatestPrice: jest.fn().mockResolvedValue({
          symbol: 'THYAO',
          timeframe: '1d',
          open: 1,
          high: 2,
          low: 1,
          close: 2,
          volume: 1,
          timestamp: '2026-01-01T00:00:00.000Z',
          validationStatus: 'valid',
        }),
      });
      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [p1],
        makeConfig(),
        undefined,
        normalizer as never,
      );

      await orchestrator.fetchLatestPrice('THYAO.IS');

      expect(normalize).toHaveBeenCalledWith('THYAO.IS');
      expect(p1.getLatestPrice).toHaveBeenCalledWith('THYAO');
    });
  });

  describe('request deduplication', () => {
    it('should deduplicate concurrent identical requests', async () => {
      const p1 = createMockProvider('yahoo', {
        getLatestPrice: jest.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 20));
          return {
            symbol: 'THYAO',
            timeframe: '1d',
            open: 1,
            high: 2,
            low: 1,
            close: 2,
            volume: 1,
            timestamp: '2026-01-01T00:00:00.000Z',
            validationStatus: 'valid',
          };
        }),
      });
      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [p1],
        makeConfig(),
        undefined,
        undefined,
        new RequestDeduplicatorService(),
      );

      const results = await Promise.all([
        orchestrator.fetchLatestPrice('THYAO'),
        orchestrator.fetchLatestPrice('THYAO'),
      ]);

      expect(results[0]?.data?.symbol).toBe('THYAO');
      expect(results[1]?.data?.symbol).toBe('THYAO');
      expect(p1.getLatestPrice).toHaveBeenCalledTimes(1);
    });

    it('should expose provider diagnostics', () => {
      const p1 = createMockProvider('fintables', {
        getDiagnostics: jest.fn().mockReturnValue({
          lastErrorCategory: 'RATE_LIMIT',
          lastErrorMessage: 'rate limited',
          lastErrorTime: 100,
          lastSuccessTime: 200,
        }),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], makeConfig());

      const diagnostics = orchestrator.getProviderDiagnostics();
      expect(diagnostics.fintables).toEqual({
        lastErrorCategory: 'RATE_LIMIT',
        lastErrorMessage: 'rate limited',
        lastErrorTime: 100,
        lastSuccessTime: 200,
      });
    });
  });

  describe('validation and metadata', () => {
    const validationService = new MarketDataValidationService();

    function makePoint(symbol: string, timestamp: string, open = 100): MarketDataPoint {
      return {
        symbol,
        timeframe: '1d',
        open,
        high: 110,
        low: 90,
        close: 105,
        volume: 1000,
        timestamp,
        validationStatus: 'valid',
      };
    }

    it('should filter invalid candles and mark the result validated', async () => {
      const good = makePoint('THYAO', '2026-01-02T00:00:00.000Z');
      const bad = makePoint('THYAO', '2026-01-03T00:00:00.000Z', Number.NaN);
      const p1 = createMockProvider('fintables', {
        getHistoricalData: jest.fn().mockResolvedValue([bad, good]),
      });
      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [p1],
        makeConfig(),
        undefined,
        undefined,
        undefined,
        validationService,
      );

      const result = await orchestrator.fetchHistoricalData('THYAO', '1d');

      expect(result).not.toBeNull();
      expect(result!.data).toHaveLength(1);
      expect(result!.data[0]).toEqual(good);
      expect(result!.validated).toBe(true);
      expect(result!.dataQuality).toBe('VALID');
      expect(result!.sourceTimeframe).toBe('1d');
    });

    it('should treat all-invalid results as a miss and fall back to next provider', async () => {
      const bad = makePoint('THYAO', '2026-01-03T00:00:00.000Z', Number.NaN);
      const good = makePoint('THYAO', '2026-01-02T00:00:00.000Z');
      const p1 = createMockProvider('fintables', {
        getHistoricalData: jest.fn().mockResolvedValue([bad]),
      });
      const p2 = createMockProvider('finnhub', {
        getHistoricalData: jest.fn().mockResolvedValue([good]),
      });
      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [p1, p2],
        makeConfig(),
        undefined,
        undefined,
        undefined,
        validationService,
      );

      const result = await orchestrator.fetchHistoricalData('THYAO', '1d');

      expect(result).not.toBeNull();
      expect(result!.provider).toBe('finnhub');
      expect(result!.data).toHaveLength(1);
      expect(result!.fallbackUsed).toBe(true);
      expect(result!.attemptedProviders).toEqual(['fintables', 'finnhub']);
    });

    it('should attach metadata to latest price results', async () => {
      const point = makePoint('THYAO', '2026-01-02T00:00:00.000Z');
      const p1 = createMockProvider('fintables', {
        getLatestPrice: jest.fn().mockResolvedValue(null),
      });
      const p2 = createMockProvider('finnhub', {
        getLatestPrice: jest.fn().mockResolvedValue(point),
      });
      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [p1, p2],
        makeConfig(),
        undefined,
        undefined,
        undefined,
        validationService,
      );

      const result = await orchestrator.fetchLatestPrice('THYAO');

      expect(result).not.toBeNull();
      expect(result!.provider).toBe('finnhub');
      expect(result!.fallbackUsed).toBe(true);
      expect(result!.attemptedProviders).toEqual(['fintables', 'finnhub']);
    });

    it('should reject invalid latest price points without caching them', async () => {
      const bad = makePoint('THYAO', '2026-01-02T00:00:00.000Z', Number.NaN);
      const p1 = createMockProvider('fintables', {
        getLatestPrice: jest.fn().mockResolvedValue(bad),
      });
      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [p1],
        makeConfig(),
        undefined,
        undefined,
        undefined,
        validationService,
      );

      const result = await orchestrator.fetchLatestPrice('THYAO');

      expect(result).toBeNull();
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should expose deterministic provider configuration without secrets', () => {
      const p1 = createMockProvider('finnhub');
      const p2 = createMockProvider('yahoo');
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], makeConfig());

      const configuration = orchestrator.getProviderConfiguration();
      const finnhub = configuration.find((c) => c.name === 'finnhub');
      const yahoo = configuration.find((c) => c.name === 'yahoo');

      expect(finnhub).toEqual(
        expect.objectContaining({
          enabled: true,
          configured: false,
          authenticated: false,
          priority: 3,
          public: false,
        }),
      );
      expect(yahoo).toEqual(expect.objectContaining({ configured: true, public: true }));
      expect(configuration[0]).not.toHaveProperty('apiKey');
    });

    it('should classify timeframes as REAL, DERIVED, or UNAVAILABLE', () => {
      const p1 = createMockProvider('finnhub', {
        getAvailableTimeframes: jest.fn().mockReturnValue(['4h', '1d']),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], makeConfig());

      const report = orchestrator.getTimeframeStatusReport();
      const t4h = report.find((r) => r.timeframe === '4h');
      const t1h = report.find((r) => r.timeframe === '1h');
      const t6m = report.find((r) => r.timeframe === '6m');

      expect(t4h!.status).toBe('REAL');
      expect(t4h!.providers).toContain('finnhub');
      expect(t1h!.status).toBe('DERIVED');
      expect(t1h!.sourceTimeframe).toBe('4h');
      expect(t6m!.status).toBe('UNAVAILABLE');
      expect(t6m!.providers).toEqual([]);
    });
  });

  describe('provider request budgeting (R2-050C)', () => {
    function makeBudgetConfig(limit: number, provider = 'alpha_vantage'): MarketDataConfig {
      const base = makeConfig();
      base.providers = {
        ...base.providers,
        [provider]: { ...base.providers[provider as keyof MarketDataConfig['providers']], budget: { dailyLimit: limit, windowMs: 60_000 } },
      };
      return base;
    }

    it('skips a provider whose budget is exhausted and falls back to the next', async () => {
      const p1 = createMockProvider('alpha_vantage', {
        fetchCompany: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const p2 = createMockProvider('finnhub', {
        fetchCompany: jest.fn().mockResolvedValue(createCompany('THYAO', 'finnhub')),
      });
      const config = makeBudgetConfig(1);
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1, p2], config);

      await orchestrator.fetchCompany('THYAO');
      const result = await orchestrator.fetchCompany('THYAO');

      // First call exhausted alpha_vantage's budget of 1; the second must skip it.
      expect(result).not.toBeNull();
      expect(result!.provider).toBe('finnhub');
      expect(result!.actualProvider).toBe('finnhub');
      expect(p1.fetchCompany).toHaveBeenCalledTimes(1);
      expect(p2.fetchCompany).toHaveBeenCalledTimes(2);
    });

    it('restores budget after the configured window elapses', async () => {
      const config = makeConfig();
      config.providers = {
        ...config.providers,
        alpha_vantage: { ...config.providers.alpha_vantage, budget: { dailyLimit: 2, windowMs: 5 } },
      };
      const p1 = createMockProvider('alpha_vantage', {
        fetchCompany: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [p1], config);

      // Exhaust the 2-request budget via real failure calls.
      await orchestrator.fetchCompany('THYAO');
      await orchestrator.fetchCompany('THYAO');
      let entry = orchestrator.getProviderDashboard().find((d) => d.name === 'alpha_vantage');
      expect(entry!.budget!.remaining).toBe(0);

      // Wait past the tiny reset window; remaining restores to the limit.
      await new Promise((resolve) => setTimeout(resolve, 10));
      entry = orchestrator.getProviderDashboard().find((d) => d.name === 'alpha_vantage');
      expect(entry!.budget!.remaining).toBe(2);
    });

    it('exposes budget state in provider dashboard without secrets', () => {
      const config = makeBudgetConfig(60, 'finnhub');
      const orchestrator = new MarketDataOrchestrator(circuitBreaker, cacheService, [], config);
      const p1 = createMockProvider('finnhub');
      orchestrator.registerProvider(p1);

      const dashboard = orchestrator.getProviderDashboard();
      const entry = dashboard.find((d) => d.name === 'finnhub');
      expect(entry).toBeDefined();
      expect(entry!.budget).toBeDefined();
      expect(entry!.budget!.provider).toBe('finnhub');
      expect(entry!.budget!.remaining).toBe(entry!.budget!.limit);
      expect(JSON.stringify(entry)).not.toContain('apiKey');
    });
  });
});
