import { FinnhubAdapter } from './finnhub.adapter';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';

const CANDLE = {
  s: 'ok',
  c: [103.5],
  h: [105.0],
  l: [98.0],
  o: [100.0],
  t: [1754000000],
  v: [1200000],
};

describe('FinnhubAdapter', () => {
  let adapter: FinnhubAdapter;
  let fetchMock: jest.SpyInstance;
  let circuitBreaker: CircuitBreakerService;

  const config = { apiKey: 'test-key', timeout: 5000, retries: 0 };

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
    adapter = new FinnhubAdapter(circuitBreaker, config);
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
    delete process.env.FINNHUB_API_KEY;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should return [] from getHistoricalData when no API key is configured', async () => {
    const noKey = new FinnhubAdapter(circuitBreaker, { apiKey: '', retries: 0 });
    const points = await noKey.getHistoricalData('THYAO', '1d');
    expect(points).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return null from getLatestPrice when no API key is configured', async () => {
    const noKey = new FinnhubAdapter(circuitBreaker, { apiKey: '', retries: 0 });
    const point = await noKey.getLatestPrice('THYAO');
    expect(point).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should map intraday timeframes to resolution=60', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(CANDLE),
    } as unknown as Response);

    await adapter.getHistoricalData('THYAO', '4h');
    const url = (fetchMock.mock.calls[0][0] as string).toString();
    expect(url).toContain('resolution=60');
  });

  it('should map 1d/1w/1m to D/W/M resolutions', async () => {
    const cases: Array<[string, string]> = [
      ['1d', 'resolution=D'],
      ['1w', 'resolution=W'],
      ['1m', 'resolution=M'],
    ];

    for (const [timeframe, expected] of cases) {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(CANDLE),
      } as unknown as Response);
      await adapter.getHistoricalData('THYAO', timeframe);
      const url = (fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0] as string).toString();
      expect(url).toContain(expected);
    }
  });

  it('should return [] for unsupported timeframes without calling the API', async () => {
    const points = await adapter.getHistoricalData('THYAO', '3m');
    expect(points).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should parse candle response into MarketDataPoint with requested timeframe label', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(CANDLE),
    } as unknown as Response);

    const points = await adapter.getHistoricalData('THYAO', '4h');
    expect(points).toHaveLength(1);
    expect(points[0]).toEqual(
      expect.objectContaining({
        symbol: 'THYAO',
        timeframe: '4h',
        open: 100.0,
        high: 105.0,
        low: 98.0,
        close: 103.5,
        volume: 1200000,
        validationStatus: 'valid',
      }),
    );
  });

  it('should advertise intraday and daily/weekly/monthly timeframes', () => {
    expect(adapter.getAvailableTimeframes()).toEqual(['1h', '2h', '4h', '1d', '1w', '1m']);
  });
});
