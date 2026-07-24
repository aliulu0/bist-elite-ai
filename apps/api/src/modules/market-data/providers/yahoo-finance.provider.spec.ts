import { Test, TestingModule } from '@nestjs/testing';
import { YahooFinanceProvider } from './yahoo-finance.provider';
import { MarketDataPoint } from '../interfaces';

const mockChartResponse = {
  chart: {
    result: [
      {
        meta: {
          symbol: 'THYAO.IS',
          currency: 'TRY',
          exchangeTimezoneName: 'Europe/Istanbul',
          regularMarketPrice: 105.5,
          regularMarketTime: 1705305600,
        },
        timestamp: [1705219200, 1705305600],
        indicators: {
          quote: [
            {
              open: [100.0, 105.0],
              high: [110.0, 112.0],
              low: [95.0, 103.0],
              close: [105.0, 108.0],
              volume: [1000000, 1200000],
            },
          ],
        },
      },
    ],
    error: null,
  },
};

const mockEmptyResponse = {
  chart: {
    result: [],
    error: null,
  },
};

const mockErrorResponse = {
  chart: {
    result: [],
    error: {
      code: 'Not Found',
      description: 'No data found',
    },
  },
};

describe('YahooFinanceProvider', () => {
  let provider: YahooFinanceProvider;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YahooFinanceProvider],
    }).compile();

    provider = module.get(YahooFinanceProvider);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('yahoo-finance');
  });

  describe('validateConnection', () => {
    it('should return true when Yahoo Finance is reachable', async () => {
      fetchSpy.mockResolvedValue({ ok: true } as Response);
      const result = await provider.validateConnection();
      expect(result).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('query1.finance.yahoo.com'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return false when Yahoo Finance returns error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);
      const result = await provider.validateConnection();
      expect(result).toBe(false);
    });

    it('should return false on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));
      const result = await provider.validateConnection();
      expect(result).toBe(false);
    });
  });

  describe('getHistoricalData', () => {
    it('should return normalized data for valid symbol', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockChartResponse,
      } as Response);

      const result = await provider.getHistoricalData('THYAO.IS', '1d');
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('THYAO.IS');
      expect(result[0].timeframe).toBe('1d');
      expect(result[0].open).toBe(100.0);
      expect(result[0].high).toBe(110.0);
      expect(result[0].low).toBe(95.0);
      expect(result[0].close).toBe(105.0);
      expect(result[0].volume).toBe(1000000);
      expect(result[0].validationStatus).toBe('valid');
    });

    it('should return empty array for unsupported timeframe', async () => {
      const result = await provider.getHistoricalData('THYAO.IS', '2d');
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return empty array on HTTP error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getHistoricalData('INVALID', '1d');
      expect(result).toEqual([]);
    });

    it('should return empty array on Yahoo error response', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getHistoricalData('INVALID', '1d');
      expect(result).toEqual([]);
    });

    it('should return empty array when no results', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockEmptyResponse,
      } as Response);

      const result = await provider.getHistoricalData('UNKNOWN', '1d');
      expect(result).toEqual([]);
    });

    it('should return empty array on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await provider.getHistoricalData('THYAO.IS', '1d');
      expect(result).toEqual([]);
    });

    it('should skip null OHLC values', async () => {
      const responseWithNulls = {
        chart: {
          result: [
            {
              meta: {
                symbol: 'TEST',
                currency: 'TRY',
                exchangeTimezoneName: 'Europe/Istanbul',
                regularMarketPrice: 100,
                regularMarketTime: 1705305600,
              },
              timestamp: [1705219200, 1705305600],
              indicators: {
                quote: [
                  {
                    open: [100.0, null],
                    high: [110.0, null],
                    low: [95.0, null],
                    close: [105.0, null],
                    volume: [1000000, null],
                  },
                ],
              },
            },
          ],
          error: null,
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => responseWithNulls,
      } as Response);

      const result = await provider.getHistoricalData('TEST', '1d');
      expect(result).toHaveLength(1);
    });

    it('should skip data with zero OHLC values', async () => {
      const responseWithZeros = {
        chart: {
          result: [
            {
              meta: {
                symbol: 'TEST',
                currency: 'TRY',
                exchangeTimezoneName: 'Europe/Istanbul',
                regularMarketPrice: 0,
                regularMarketTime: 1705305600,
              },
              timestamp: [1705219200],
              indicators: {
                quote: [
                  {
                    open: [0.0],
                    high: [110.0],
                    low: [95.0],
                    close: [105.0],
                    volume: [1000000],
                  },
                ],
              },
            },
          ],
          error: null,
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => responseWithZeros,
      } as Response);

      const result = await provider.getHistoricalData('TEST', '1d');
      expect(result).toHaveLength(0);
    });

    it('should skip data where high < low', async () => {
      const responseWithInvalidRange = {
        chart: {
          result: [
            {
              meta: {
                symbol: 'TEST',
                currency: 'TRY',
                exchangeTimezoneName: 'Europe/Istanbul',
                regularMarketPrice: 100,
                regularMarketTime: 1705305600,
              },
              timestamp: [1705219200],
              indicators: {
                quote: [
                  {
                    open: [100.0],
                    high: [90.0],
                    low: [110.0],
                    close: [105.0],
                    volume: [1000000],
                  },
                ],
              },
            },
          ],
          error: null,
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => responseWithInvalidRange,
      } as Response);

      const result = await provider.getHistoricalData('TEST', '1d');
      expect(result).toHaveLength(0);
    });

    it('should pass fetch options to Yahoo API', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockChartResponse,
      } as Response);

      await provider.getHistoricalData('THYAO.IS', '1d', {
        startDate: '2025-01-01',
        endDate: '2025-06-01',
      });

      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('period1='), expect.anything());
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('period2='), expect.anything());
    });

    it('should map 4h timeframe to 60m interval', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockChartResponse,
      } as Response);

      await provider.getHistoricalData('THYAO.IS', '4h');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('interval=60m'),
        expect.anything(),
      );
    });

    it('should map 1w timeframe to 1wk interval', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockChartResponse,
      } as Response);

      await provider.getHistoricalData('THYAO.IS', '1w');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('interval=1wk'),
        expect.anything(),
      );
    });
  });

  describe('getLatestPrice', () => {
    it('should return latest price for valid symbol', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockChartResponse,
      } as Response);

      const result = await provider.getLatestPrice('THYAO.IS');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('THYAO.IS');
      expect(result!.timeframe).toBe('1d');
      expect(result!.open).toBe(105.0);
      expect(result!.close).toBe(108.0);
      expect(result!.validationStatus).toBe('valid');
    });

    it('should return null on HTTP error', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await provider.getLatestPrice('INVALID');
      expect(result).toBeNull();
    });

    it('should return null on Yahoo error', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response);

      const result = await provider.getLatestPrice('INVALID');
      expect(result).toBeNull();
    });

    it('should return null on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await provider.getLatestPrice('THYAO.IS');
      expect(result).toBeNull();
    });

    it('should return null when data has null values', async () => {
      const responseWithNulls = {
        chart: {
          result: [
            {
              meta: {
                symbol: 'TEST',
                currency: 'TRY',
                exchangeTimezoneName: 'Europe/Istanbul',
                regularMarketPrice: 100,
                regularMarketTime: 1705305600,
              },
              timestamp: [1705219200],
              indicators: {
                quote: [
                  {
                    open: [null],
                    high: [null],
                    low: [null],
                    close: [null],
                    volume: [null],
                  },
                ],
              },
            },
          ],
          error: null,
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => responseWithNulls,
      } as Response);

      const result = await provider.getLatestPrice('TEST');
      expect(result).toBeNull();
    });

    it('should return null when no results returned', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockEmptyResponse,
      } as Response);

      const result = await provider.getLatestPrice('UNKNOWN');
      expect(result).toBeNull();
    });
  });

  describe('getAvailableTimeframes', () => {
    it('should return all supported timeframes', () => {
      const timeframes = provider.getAvailableTimeframes();
      expect(timeframes).toContain('4h');
      expect(timeframes).toContain('1d');
      expect(timeframes).toContain('1w');
      expect(timeframes).toContain('1m');
      expect(timeframes).toContain('3m');
      expect(timeframes).toContain('6m');
    });
  });
});
