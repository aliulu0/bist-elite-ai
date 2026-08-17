import { CacheService } from '../../../common/cache/cache.service';
import { getCacheConfig } from '../../../common/cache/cache.config';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { RequestDeduplicatorService } from '../dedup/request-deduplicator.service';
import { MarketDataValidationService } from '../market-data-validation.service';
import { SymbolNormalizerService } from '../symbol-normalizer/symbol-normalizer.service';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataService } from '../market-data.service';
import { MarketDataProviderRegistry } from '../market-data.provider-registry';
import { IncrementalMarketDataService } from './incremental-market-data.service';
import { IUnifiedMarketDataProvider } from '../providers/unified/unified-provider.interface';
import { MarketDataConfig } from '../config/market-data.config';
import { MarketDataPoint } from '../interfaces';

// Monday 2026-08-10 12:00 UTC = Borsa İstanbul trading hours (TR 15:00), market OPEN.
const FRESH_NOW = new Date('2026-08-10T12:00:00.000Z').getTime();

function makeConfig(): MarketDataConfig {
  return {
    providers: {
      fintables: {
        enabled: true,
        priority: 1,
        timeout: 15000,
        retries: 3,
        apiKey: 'x',
        baseUrl: '',
      },
      yahoo: { enabled: true, priority: 4, timeout: 15000, retries: 2, apiKey: 'x', baseUrl: '' },
      kap: { enabled: true, priority: 5, timeout: 15000, retries: 3, apiKey: 'x', baseUrl: '' },
      tcmb: { enabled: true, priority: 6, timeout: 15000, retries: 3, apiKey: 'x', baseUrl: '' },
      mkk: { enabled: true, priority: 7, timeout: 15000, retries: 3, apiKey: 'x', baseUrl: '' },
      serpapi: { enabled: true, priority: 8, timeout: 15000, retries: 2, apiKey: '', baseUrl: '' },
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

type YahooMock = IUnifiedMarketDataProvider & { getHistoricalData: jest.Mock };

function createYahooProvider(): YahooMock {
  const getHistoricalData = jest.fn().mockResolvedValue([]);
  return {
    name: 'yahoo',
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
    getHistoricalData,
    getLatestPrice: jest.fn().mockResolvedValue(null),
    getAvailableTimeframes: jest.fn().mockReturnValue(['4h', '1d', '1w', '1m', '3m', '6m']),
    getCompanyProfile: jest.fn().mockResolvedValue(null),
    getFinancialRatios: jest.fn().mockResolvedValue(null),
    getBalanceSheet: jest.fn().mockResolvedValue(null),
    getIncomeStatement: jest.fn().mockResolvedValue(null),
    getSector: jest.fn().mockResolvedValue(null),
    getMacroIndicators: jest.fn().mockResolvedValue([]),
    getStatus: jest.fn().mockReturnValue({
      name: 'yahoo',
      connected: true,
      circuitState: 'CLOSED',
      consecutiveFailures: 0,
      lastSuccessTime: FRESH_NOW,
      lastFailureTime: null,
      uptimeMs: 1000,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatencyMs: 0,
      lastHealthCheck: new Date(FRESH_NOW).toISOString(),
    }),
    normalize: jest.fn().mockImplementation((data: unknown) => data),
  } as unknown as YahooMock;
}

describe('IncrementalMarketDataService integration (real orchestrator + cache)', () => {
  let cacheService: MarketDataCacheService;
  let circuitBreaker: CircuitBreakerService;
  let deduplicator: RequestDeduplicatorService;
  let validationService: MarketDataValidationService;
  let normalizer: SymbolNormalizerService;
  let orchestrator: MarketDataOrchestrator;
  let service: IncrementalMarketDataService;
  let yahoo: YahooMock;

  beforeEach(() => {
    jest.useFakeTimers({ now: FRESH_NOW });
    const innerCache = new CacheService(getCacheConfig());
    cacheService = new MarketDataCacheService(innerCache);
    circuitBreaker = new CircuitBreakerService();
    deduplicator = new RequestDeduplicatorService(0);
    validationService = new MarketDataValidationService();
    normalizer = new SymbolNormalizerService();
    yahoo = createYahooProvider();
    orchestrator = new MarketDataOrchestrator(
      circuitBreaker,
      cacheService,
      [yahoo],
      makeConfig(),
      undefined,
      normalizer,
      deduplicator,
      validationService,
    );
    service = new IncrementalMarketDataService(
      orchestrator,
      cacheService,
      validationService,
      normalizer,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const freshCandles = (): MarketDataPoint[] => [
    {
      symbol: 'THYAO',
      timeframe: '1d',
      open: 400,
      high: 420,
      low: 395,
      close: 410,
      volume: 5_000_000,
      timestamp: '2026-08-09T00:00:00.000Z',
      validationStatus: 'valid',
    },
    {
      symbol: 'THYAO',
      timeframe: '1d',
      open: 410,
      high: 430,
      low: 405,
      close: 425,
      volume: 6_000_000,
      timestamp: '2026-08-10T00:00:00.000Z',
      validationStatus: 'valid',
    },
  ];

  it('ZERO DUPLICATION: two sequential requests produce exactly ONE provider fetch', async () => {
    yahoo.getHistoricalData.mockResolvedValue(freshCandles());

    const first = await service.fetchHistoricalData('THYAO.IS', '1d');
    const second = await service.fetchHistoricalData('THYAO.IS', '1d');

    expect(first!.incremental.cacheHit).toBe(false);
    expect(first!.data).toHaveLength(2);
    expect(second!.cached).toBe(true);
    expect(second!.incremental.cacheHit).toBe(true);
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);
  });

  it('shared cache benefits downstream consumers without provider calls', async () => {
    yahoo.getHistoricalData.mockResolvedValue(freshCandles());

    await service.fetchHistoricalData('THYAO.IS', '1d');
    const downstream = await orchestrator.fetchHistoricalData('THYAO.IS', '1d');

    expect(downstream).not.toBeNull();
    expect(downstream!.cached).toBe(true);
    expect(downstream!.provider).toBe('cache');
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);
  });

  it('CASE 3: stale cache triggers ONE incremental range fetch (no full redownload)', async () => {
    yahoo.getHistoricalData.mockResolvedValue(freshCandles());
    const first = await service.fetchHistoricalData('THYAO.IS', '1d');
    expect(first!.data).toHaveLength(2);
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);

    // 25h later (2026-08-11T13:00 UTC = TR 16:00, trading open): lastTs stale (>36h) but
    // cache TTL (48h) still valid -> CASE 3 incremental range fetch + merge.
    jest.setSystemTime(new Date(FRESH_NOW + 25 * 3_600_000));

    const newCandles: MarketDataPoint[] = [
      {
        symbol: 'THYAO',
        timeframe: '1d',
        open: 425,
        high: 440,
        low: 418,
        close: 435,
        volume: 7_000_000,
        timestamp: '2026-08-12T00:00:00.000Z',
        validationStatus: 'valid',
      },
    ];
    yahoo.getHistoricalData.mockResolvedValue(newCandles);

    const second = await service.fetchHistoricalData('THYAO.IS', '1d');

    expect(second!.incremental.cacheHit).toBe(false);
    expect(second!.incremental.incrementalUpdate).toBe(true);
    expect(second!.incremental.newBarCount).toBe(1);
    expect(second!.data).toHaveLength(3);
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(2);
    const rangeCall = yahoo.getHistoricalData.mock.calls[1];
    expect(rangeCall[2]).toMatchObject({ startDate: '2026-08-10T00:00:00.000Z' });
  });

  it('1h normalization: a 1h request reuses the shared 4h cache (one provider fetch for 1h + 4h)', async () => {
    // Last candle 2h before "now" (TR 15:00) -> fresh (4h staleThreshold = 6h).
    const recentCandles: MarketDataPoint[] = [
      {
        symbol: 'THYAO',
        timeframe: '4h',
        open: 400,
        high: 420,
        low: 395,
        close: 410,
        volume: 5_000_000,
        timestamp: '2026-08-10T08:00:00.000Z',
        validationStatus: 'valid',
      },
      {
        symbol: 'THYAO',
        timeframe: '4h',
        open: 410,
        high: 430,
        low: 405,
        close: 425,
        volume: 6_000_000,
        timestamp: '2026-08-10T10:00:00.000Z',
        validationStatus: 'valid',
      },
    ];
    yahoo.getHistoricalData.mockResolvedValue(recentCandles);

    const first = await service.fetchHistoricalData('THYAO.IS', '1h');

    expect(first!.sourceTimeframe).toBe('4h');
    expect(first!.data).toHaveLength(2);
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);

    // Same shared cache key (THYAO|4h) -> warm, no provider request.
    const second = await service.fetchHistoricalData('THYAO.IS', '4h');
    expect(second!.cached).toBe(true);
    expect(second!.incremental.cacheHit).toBe(true);
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);
  });

  it('ZERO DUPLICATION across the data chain (MarketData -> orchestrator -> MarketDataService)', async () => {
    yahoo.getHistoricalData.mockResolvedValue(freshCandles());
    const mdService = new MarketDataService(
      validationService,
      new MarketDataProviderRegistry(),
      undefined,
      undefined,
      orchestrator,
    );

    const viaIncremental = await service.fetchHistoricalData('THYAO.IS', '1d');
    expect(viaIncremental!.data).toHaveLength(2);

    await orchestrator.fetchHistoricalData('THYAO.IS', '1d');
    const viaService = await mdService.fetchData('THYAO.IS', '1d');

    expect(viaService).toHaveLength(2);
    // Only the first incremental full fetch hit the provider; the two downstream
    // consumers were served from the shared cache.
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);
  });

  it('provider fallback: incremental fetch falls back from fintables to yahoo', async () => {
    const fintables = {
      ...createYahooProvider(),
      name: 'fintables',
      getHistoricalData: jest.fn().mockRejectedValue(new Error('fintables down')),
      getAvailableTimeframes: jest.fn().mockReturnValue(['4h', '1d', '1w', '1m', '3m', '6m']),
    };
    yahoo.getHistoricalData.mockResolvedValue(freshCandles());
    // fintables (priority 1) is tried before yahoo (priority 4) in makeConfig.
    const fbOrchestrator = new MarketDataOrchestrator(
      circuitBreaker,
      cacheService,
      [fintables, yahoo],
      makeConfig(),
      undefined,
      normalizer,
      deduplicator,
      validationService,
    );
    const fbService = new IncrementalMarketDataService(
      fbOrchestrator,
      cacheService,
      validationService,
      normalizer,
    );

    const result = await fbService.fetchHistoricalData('THYAO.IS', '1d');

    expect(result).not.toBeNull();
    expect(fintables.getHistoricalData).toHaveBeenCalledTimes(1);
    expect(yahoo.getHistoricalData).toHaveBeenCalledTimes(1);
    expect(result!.incremental.providerUsed).toBe('yahoo');
    expect(result!.data).toHaveLength(2);
  });
});
