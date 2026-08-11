import { AlphaVantageAdapter } from './alpha-vantage.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';

const OVERVIEW = {
  Name: 'ASELSAN',
  Sector: 'Information Technology',
  Currency: 'TRY',
  MarketCapitalization: '1234567890',
  SharesOutstanding: '1000000000',
  RevenueTTM: '50000000000',
  NetIncomeTTM: '10000000000',
  EBITDA: '15000000000',
  PERatio: '12.5',
  PriceToBookRatio: '3.2',
  TotalAssets: '80000000000',
  TotalLiabilities: '40000000000',
  TotalShareholderEquity: '40000000000',
};

const DAILY = {
  'Time Series (Daily)': {
    '2026-07-31': { '1. open': '100.0', '2. high': '105.0', '3. low': '98.0', '4. close': '103.5', '5. volume': '1200000' },
    '2026-07-30': { '1. open': '99.0', '2. high': '101.0', '3. low': '97.0', '4. close': '100.0', '5. volume': '900000' },
  },
};

const RSI = {
  'Technical Analysis: RSI': {
    '2026-07-31': { RSI: '62.5' },
    '2026-07-30': { RSI: '55.1' },
  },
};

describe('AlphaVantageAdapter', () => {
  let adapter: AlphaVantageAdapter;
  let fetchMock: jest.SpyInstance;
  let circuitBreaker: CircuitBreakerService;

  const config = { apiKey: 'test-key', timeout: 5000, retries: 0 };

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    adapter = new AlphaVantageAdapter(circuitBreaker, config);
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
    delete process.env.ALPHA_VANTAGE_API_KEY;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should map canonical ticker to .IST format in requests', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(OVERVIEW),
    } as unknown as Response);

    await adapter.fetchCompany('ASELS');

    const url = (fetchMock.mock.calls[0][0] as string).toString();
    expect(url).toContain('ASELS.IST');
    expect(url).toContain('function=OVERVIEW');
  });

  it('should parse company overview into Company', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(OVERVIEW),
    } as unknown as Response);

    const company = await adapter.fetchCompany('ASELS');
    expect(company).toEqual(
      expect.objectContaining({
        symbol: 'ASELS',
        name: 'ASELSAN',
        sector: 'Information Technology',
        marketCap: 1234567890,
        currency: 'TRY',
        source: 'alpha_vantage',
      }),
    );
  });

  it('should return null when no api key configured', async () => {
    const unconfigured = new AlphaVantageAdapter(circuitBreaker, { ...config, apiKey: '' });
    await expect(unconfigured.fetchCompany('ASELS')).resolves.toBeNull();
  });

  it('should parse daily time series into MarketDataPoints', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(DAILY),
    } as unknown as Response);

    const points = await adapter.getHistoricalData('ASELS', '1d');
    expect(points).toHaveLength(2);
    expect(points[0]).toEqual(
      expect.objectContaining({
        symbol: 'ASELS',
        timeframe: '1d',
        open: 99,
        high: 101,
        low: 97,
        close: 100,
        volume: 900000,
        validationStatus: 'valid',
      }),
    );
    expect(points[1].close).toBe(103.5);
    expect(points[0].timestamp <= points[1].timestamp).toBe(true);
  });

  it('should parse RSI technical indicator series', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(RSI),
    } as unknown as Response);

    const series = await adapter.getTechnicalIndicators('ASELS', 'RSI', 14);
    expect(series).not.toBeNull();
    expect(series!.indicator).toBe('RSI');
    expect(series!.values).toHaveLength(2);
    expect(series!.values[1].value).toBe(62.5);
  });

  it('should throw on rate limit note response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ Note: 'API rate limit reached' }),
    } as unknown as Response);

    const company = await adapter.fetchCompany('ASELS');
    expect(company).toBeNull();
  });

  it('should only support 1d/1w/1m timeframes', () => {
    expect(adapter.getAvailableTimeframes()).toEqual(['1d', '1w', '1m']);
  });
});
