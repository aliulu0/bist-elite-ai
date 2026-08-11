import { YahooUnifiedAdapter } from './yahoo-unified.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { YahooFinanceProvider } from '../yahoo-finance.provider';

const META_RESPONSE = {
  chart: {
    result: [
      {
        meta: {
          symbol: 'ASELS.IS',
          longName: 'ASELSAN Elektronik Sanayi ve Ticaret A.S.',
          currency: 'TRY',
          exchangeName: 'IST',
          regularMarketPrice: 103.5,
        },
      },
    ],
    error: null,
  },
};

const CHART_RESPONSE = {
  chart: {
    result: [
      {
        meta: { symbol: 'ASELS.IS', currency: 'TRY', regularMarketPrice: 103.5, regularMarketTime: 1 },
        timestamp: [1722441600],
        indicators: {
          quote: [{ open: [100], high: [105], low: [98], close: [103.5], volume: [1200000] }],
        },
      },
    ],
    error: null,
  },
};

describe('YahooUnifiedAdapter', () => {
  let adapter: YahooUnifiedAdapter;
  let fetchMock: jest.SpyInstance;
  let circuitBreaker: CircuitBreakerService;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    adapter = new YahooUnifiedAdapter(circuitBreaker, new YahooFinanceProvider());
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(META_RESPONSE),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should fetch company from yahoo chart meta', async () => {
    const company = await adapter.fetchCompany('ASELS');
    expect(company).toEqual(
      expect.objectContaining({
        symbol: 'ASELS',
        name: 'ASELSAN Elektronik Sanayi ve Ticaret A.S.',
        currency: 'TRY',
        exchange: 'IST',
        source: 'yahoo',
      }),
    );
  });

  it('should request .IS suffixed symbol', async () => {
    await adapter.fetchCompany('ASELS');
    const url = (fetchMock.mock.calls[0][0] as string).toString();
    expect(url).toContain('ASELS.IS');
  });

  it('should delegate historical data to yahoo provider', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(CHART_RESPONSE),
    } as unknown as Response);

    const points = await adapter.getHistoricalData('ASELS', '1d');
    expect(points).toHaveLength(1);
    expect(points[0].close).toBe(103.5);
  });

  it('should record success metrics for market-data calls', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(CHART_RESPONSE),
    } as unknown as Response);

    const points = await adapter.getHistoricalData('ASELS', '1d');
    expect(points).toHaveLength(1);

    const status = adapter.getStatus();
    expect(status.totalRequests).toBe(1);
    expect(status.successfulRequests).toBe(1);
    expect(status.failedRequests).toBe(0);
  });

  it('should record failure metrics and degrade gracefully on error', async () => {
    const failFast = new YahooUnifiedAdapter(circuitBreaker, new YahooFinanceProvider(), { retries: 0 });
    const spy = jest
      .spyOn(failFast['yahooProvider'], 'getHistoricalData')
      .mockRejectedValue(new TypeError('fetch failed'));

    const points = await failFast.getHistoricalData('ASELS', '1d');
    expect(points).toEqual([]);

    const status = failFast.getStatus();
    expect(status.totalRequests).toBe(1);
    expect(status.failedRequests).toBe(1);
    expect(status.successfulRequests).toBe(0);
    expect(failFast.getDiagnostics().lastErrorCategory).toBe('NETWORK_ERROR');
    spy.mockRestore();
  });

  it('should return sector via fetchSector', async () => {
    const sector = await adapter.fetchSector('ASELS');
    expect(sector).toEqual(
      expect.objectContaining({ symbol: 'ASELS', source: 'yahoo' }),
    );
  });

  it('should expose yahoo timeframes', () => {
    expect(adapter.getAvailableTimeframes()).toContain('1d');
  });
});
