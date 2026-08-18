import { IncrementalMarketDataService } from './incremental-market-data.service';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataCacheService } from '../cache/market-data-cache.service';
import { MarketDataValidationService } from '../market-data-validation.service';
import { MarketDataPoint, MarketDataResult, IncrementalUpdate } from '../interfaces';
import { Timeframe, ValidationStatus } from '../interfaces/market-data.types';
import * as configModule from './incremental-timeframe.config';

jest.mock('./incremental-timeframe.config', () => ({
  ...jest.requireActual('./incremental-timeframe.config'),
  computeFreshness: jest.fn(),
}));

const asFresh = (): void => {
  (configModule.computeFreshness as jest.Mock).mockReturnValue('fresh');
};
const asStale = (): void => {
  (configModule.computeFreshness as jest.Mock).mockReturnValue('stale');
};

function point(ts: string, overrides: Partial<MarketDataPoint> = {}): MarketDataPoint {
  return {
    symbol: 'THYAO',
    timeframe: '1d',
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    timestamp: ts,
    validationStatus: 'valid' as ValidationStatus,
    ...overrides,
  };
}

function makeResult<T>(
  data: T,
  provider = 'yahoo',
  extra: Partial<MarketDataResult<T>> = {},
): MarketDataResult<T> {
  return { data, provider, cached: false, timestamp: new Date().toISOString(), ...extra };
}

describe('IncrementalMarketDataService', () => {
  let orchestrator: { fetchHistoricalData: jest.Mock; fetchHistoricalRange: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock };
  let validationService: { validateDataPoints: jest.Mock };
  let service: IncrementalMarketDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = {
      fetchHistoricalData: jest.fn(),
      fetchHistoricalRange: jest.fn(),
    };
    cache = {
      get: jest.fn(),
      set: jest.fn(),
    };
    validationService = {
      validateDataPoints: jest.fn((pts: MarketDataPoint[]) => pts),
    };
    service = new IncrementalMarketDataService(
      orchestrator as unknown as MarketDataOrchestrator,
      cache as unknown as MarketDataCacheService,
      validationService as unknown as MarketDataValidationService,
    );
    jest.spyOn(service as any, 'loadQualityAssessor').mockReturnValue(null);
    asFresh();
  });

  const key = (symbol: string, timeframe: string) => `${symbol}|${timeframe}`;

  describe('CASE 0 - unsupported timeframe', () => {
    it('returns null without touching provider or cache', async () => {
      const result = await service.fetchHistoricalData('THYAO', '2d');
      expect(result).toBeNull();
      expect(orchestrator.fetchHistoricalData).not.toHaveBeenCalled();
      expect(cache.get).not.toHaveBeenCalled();
    });
  });

  describe('CACHE TESTS', () => {
    it('cold cache: full fetch + cache write', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z'), point('2026-07-02T10:00:00Z')], 'fintables', {
          validated: true,
        }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result).not.toBeNull();
      expect(result!.data).toHaveLength(2);
      expect(result!.incremental.cacheHit).toBe(false);
      expect(result!.incremental.providerUsed).toBe('fintables');
      expect(cache.set).toHaveBeenCalledWith(
        'any',
        'historical',
        key('THYAO', '1d'),
        result!.data,
        expect.any(Number),
      );
      expect(cache.set).toHaveBeenCalledWith(
        'any',
        'historicalMeta',
        key('THYAO', '1d'),
        expect.any(Object),
        expect.any(Number),
      );
    });

    it('warm cache: serves cached data, zero provider requests', async () => {
      const existing = [point('2026-08-09T10:00:00Z'), point('2026-08-10T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) => {
        if (type === 'historical') return existing;
        if (type === configModule.HISTORICAL_META_NAMESPACE) {
          return { lastTimestamp: '2026-08-10T10:00:00Z', provider: 'fintables' };
        }
        return undefined;
      });

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.cached).toBe(true);
      expect(orchestrator.fetchHistoricalData).not.toHaveBeenCalled();
      expect(orchestrator.fetchHistoricalRange).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result!.incremental).toMatchObject<Partial<IncrementalUpdate>>({
        cacheHit: true,
        newBarCount: 0,
        mergedBarCount: 2,
      });
    });

    it('stale cache: triggers range fetch + merge', async () => {
      const existing = [point('2026-07-01T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) => {
        if (type === 'historical') return existing;
        if (type === configModule.HISTORICAL_META_NAMESPACE) {
          return { lastTimestamp: '2026-07-01T10:00:00Z', provider: 'cache' };
        }
        return undefined;
      });
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z')], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.incremental.incrementalUpdate).toBe(true);
      expect(result!.incremental.newBarCount).toBe(1);
      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalled();
    });

    it('cache disabled: still returns provider data even though cache never stores', async () => {
      cache.get.mockReturnValue(undefined);
      cache.set.mockImplementation(() => false);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z')], 'fintables'),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(1);
      expect(result!.incremental.providerUsed).toBe('fintables');
    });

    it('cache namespace: writes historical + historicalMeta under any namespace', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z')], 'yahoo'),
      );

      await service.fetchHistoricalData('THYAO', '1d');

      const namespaces = cache.set.mock.calls.map((c) => [c[0], c[1], c[2]]);
      expect(namespaces).toContainEqual(['any', 'historical', key('THYAO', '1d')]);
      expect(namespaces).toContainEqual([
        'any',
        configModule.HISTORICAL_META_NAMESPACE,
        key('THYAO', '1d'),
      ]);
    });

    it('TTL: uses timeframe-specific TTL (1d => 48h)', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z')], 'yahoo'),
      );

      await service.fetchHistoricalData('THYAO', '1d');

      const historicalCall = cache.set.mock.calls.find((c) => c[1] === 'historical');
      expect(historicalCall[4]).toBe(configModule.getIncrementalConfig('1d')!.ttlMs);
    });
  });

  describe('INCREMENTAL TESTS', () => {
    it('no cache -> full fetch', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z')], 'yahoo'),
      );
      const result = await service.fetchHistoricalData('THYAO', '1d');
      expect(result!.incremental.previousBarCount).toBe(0);
      expect(result!.incremental.newBarCount).toBe(1);
      expect(orchestrator.fetchHistoricalData).toHaveBeenCalledTimes(1);
    });

    it('cache + new candle -> incremental merge', async () => {
      const existing = [point('2026-07-01T10:00:00Z'), point('2026-07-02T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-02T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-03T10:00:00Z')], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(3);
      expect(result!.incremental).toMatchObject<Partial<IncrementalUpdate>>({
        incrementalUpdate: true,
        newBarCount: 1,
        mergedBarCount: 3,
      });
    });

    it('duplicate candle -> incoming replaces stale duplicate timestamp', async () => {
      const existing = [point('2026-07-02T10:00:00Z', { close: 100 })];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-02T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z', { close: 108 })], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].close).toBe(108);
    });

    it('overlapping provider response -> deduped union', async () => {
      const existing = [point('2026-07-01T10:00:00Z'), point('2026-07-02T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-02T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z'), point('2026-07-03T10:00:00Z')], 'yahoo', {
          validated: true,
        }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(3);
    });

    it('out-of-order provider response -> merged series is ascending', async () => {
      const existing = [point('2026-07-01T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-01T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-03T10:00:00Z'), point('2026-07-02T10:00:00Z')], 'yahoo', {
          validated: true,
        }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data.map((p) => p.timestamp)).toEqual([
        '2026-07-01T10:00:00Z',
        '2026-07-02T10:00:00Z',
        '2026-07-03T10:00:00Z',
      ]);
    });

    it('malformed candle -> removed during merge validation', async () => {
      const existing = [point('2026-07-01T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-01T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult(
          [
            point('2026-07-01T10:00:00Z', { validationStatus: 'invalid' }),
            point('2026-07-02T10:00:00Z'),
          ],
          'yahoo',
          { validated: true },
        ),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(2);
      expect(result!.data.find((p) => p.timestamp === '2026-07-01T10:00:00Z')!.close).toBe(105);
    });

    it('provider returns no new data -> no incremental update', async () => {
      const existing = [point('2026-07-01T10:00:00Z'), point('2026-07-02T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-02T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z')], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.incremental.incrementalUpdate).toBe(false);
      expect(result!.incremental.newBarCount).toBe(0);
      expect(result!.data).toHaveLength(2);
    });

    it('provider failure with existing cache -> stale but valid', async () => {
      const existing = [point('2026-07-01T10:00:00Z')] as MarketDataPoint[];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-01T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockRejectedValue(new Error('network'));
      orchestrator.fetchHistoricalData.mockRejectedValue(new Error('network'));

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toEqual(existing);
      expect(result!.incremental.stale).toBe(true);
      expect(result!.incremental.cacheHit).toBe(true);
      expect(result!.incremental.dataFreshness).toBe('stale');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('fallback provider -> providerUsed reflects orchestrator fallback choice', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z')], 'yahoo'),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.incremental.providerUsed).toBe('yahoo');
    });
  });

  describe('VALIDATION TESTS', () => {
    it('invalid OHLC -> removed by real validator during merge', async () => {
      const realValidation = new MarketDataValidationService();
      service = new IncrementalMarketDataService(
        orchestrator as unknown as MarketDataOrchestrator,
        cache as unknown as MarketDataCacheService,
        realValidation,
      );
      jest.spyOn(service as any, 'loadQualityAssessor').mockReturnValue(null);
      const existing = [point('2026-07-01T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-01T10:00:00Z', provider: 'cache' },
      );
      asStale();
      // high < low -> invalid
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult(
          [point('2026-07-02T10:00:00Z', { high: 90, low: 110 }), point('2026-07-03T10:00:00Z')],
          'yahoo',
          { validated: true, dataQuality: 'VALID' },
        ),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(2);
      expect(result!.data.map((p) => p.timestamp)).toEqual([
        '2026-07-01T10:00:00Z',
        '2026-07-03T10:00:00Z',
      ]);
    });

    it('duplicate timestamps -> single candle', async () => {
      const existing = [point('2026-07-01T10:00:00Z'), point('2026-07-02T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-02T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z')], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(2);
    });

    it('timestamp conflict -> incoming replaces existing', async () => {
      const existing = [point('2026-07-02T10:00:00Z', { close: 100 })];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-02T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z', { close: 200 })], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].close).toBe(200);
    });

    it('volume anomaly -> flagged/invalid removed', async () => {
      const realValidation = new MarketDataValidationService();
      service = new IncrementalMarketDataService(
        orchestrator as unknown as MarketDataOrchestrator,
        cache as unknown as MarketDataCacheService,
        realValidation,
      );
      jest.spyOn(service as any, 'loadQualityAssessor').mockReturnValue(null);
      const existing = [point('2026-07-01T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2026-07-01T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult(
          [point('2026-07-02T10:00:00Z', { volume: -5 }), point('2026-07-03T10:00:00Z')],
          'yahoo',
          { validated: true },
        ),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(2);
      expect(result!.data.find((p) => p.timestamp === '2026-07-02T10:00:00Z')).toBeUndefined();
    });

    it('stale data -> metadata marked stale', async () => {
      const existing = [point('2025-01-01T10:00:00Z')];
      cache.get.mockImplementation((_: string, type: string) =>
        type === 'historical'
          ? existing
          : { lastTimestamp: '2025-01-01T10:00:00Z', provider: 'cache' },
      );
      asStale();
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point('2025-01-02T10:00:00Z')], 'yahoo', { validated: true }),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.incremental.dataFreshness).toBe('stale');
    });
  });

  describe('TIMEFRAME TESTS', () => {
    it('1h is a workable timeframe -> normalized to 4h full fetch', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-01T10:00:00Z')], 'yahoo'),
      );

      const result = await service.fetchHistoricalData('THYAO', '1h');

      expect(result).not.toBeNull();
      expect(result!.sourceTimeframe).toBe('4h');
      expect(orchestrator.fetchHistoricalData).toHaveBeenCalledTimes(1);
      expect(orchestrator.fetchHistoricalData).toHaveBeenCalledWith(
        'THYAO',
        '4h',
        expect.any(Object),
      );
    });

    it.each(['4h', '1d', '1w', '1m'] as Timeframe[])(
      'supports %s with timeframe-scoped cache key',
      async (tf) => {
        cache.get.mockReturnValue(undefined);
        orchestrator.fetchHistoricalData.mockResolvedValue(
          makeResult([point('2026-07-01T10:00:00Z')], 'yahoo'),
        );

        const result = await service.fetchHistoricalData('THYAO', tf);

        expect(result).not.toBeNull();
        expect(cache.set).toHaveBeenCalledWith(
          'any',
          'historical',
          key('THYAO', tf),
          expect.any(Array),
          expect.any(Number),
        );
      },
    );
  });

  describe('QUALITY ENRICHMENT', () => {
    const makeReport = () => ({
      qualityScore: 95,
      status: 'VALID',
      marketIntegrity: { valid: true, warnings: [] as string[], errors: [] as string[] },
      freshness: { overall: 'fresh' },
    });

    it('enriches merged data with a market-integrity assessment', async () => {
      const fakeAssessor = { assess: jest.fn().mockResolvedValue(makeReport()) };
      jest.spyOn(service as any, 'loadQualityAssessor').mockReturnValue(fakeAssessor as any);

      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z')], 'yahoo'),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(fakeAssessor.assess).toHaveBeenCalledTimes(1);
      expect(result!.quality).toMatchObject({
        status: 'VALID',
        integrityValid: true,
        freshnessOverall: 'fresh',
        score: 95,
      });
    });

    it('degrades gracefully when no quality assessor is available', async () => {
      jest.spyOn(service as any, 'loadQualityAssessor').mockReturnValue(null);
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult([point('2026-07-02T10:00:00Z')], 'yahoo'),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.quality).toBeUndefined();
    });

    it('does not run assessment on an empty series', async () => {
      const fakeAssessor = { assess: jest.fn() };
      jest.spyOn(service as any, 'loadQualityAssessor').mockReturnValue(fakeAssessor as any);
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(makeResult([], 'yahoo'));

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(fakeAssessor.assess).not.toHaveBeenCalled();
      expect(result!.quality).toBeUndefined();
    });
  });

  describe('STRICT DATE RANGE (from/to clipping)', () => {
    it('clips a warm-cache series to the requested window', async () => {
      const existing = [
        point('2025-08-11T00:00:00.000Z'),
        point('2025-09-15T00:00:00.000Z'),
        point('2025-10-20T00:00:00.000Z'),
      ];
      cache.get.mockImplementation((_: string, type: string) => {
        if (type === 'historical') return existing;
        if (type === configModule.HISTORICAL_META_NAMESPACE) {
          return { lastTimestamp: '2025-10-20T00:00:00.000Z', provider: 'fintables' };
        }
        return undefined;
      });

      const result = await service.fetchHistoricalData('THYAO', '1d', {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
      });

      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].timestamp).toBe('2025-09-15T00:00:00.000Z');
    });

    it('keeps the full series when no range is requested', async () => {
      const existing = [
        point('2025-08-11T00:00:00.000Z'),
        point('2025-09-15T00:00:00.000Z'),
        point('2025-10-20T00:00:00.000Z'),
      ];
      cache.get.mockImplementation((_: string, type: string) => {
        if (type === 'historical') return existing;
        if (type === configModule.HISTORICAL_META_NAMESPACE) {
          return { lastTimestamp: '2025-10-20T00:00:00.000Z', provider: 'fintables' };
        }
        return undefined;
      });

      const result = await service.fetchHistoricalData('THYAO', '1d');

      expect(result!.data).toHaveLength(3);
    });

    it('clips a freshly fetched series to the requested window (cold cache)', async () => {
      cache.get.mockReturnValue(undefined);
      orchestrator.fetchHistoricalData.mockResolvedValue(
        makeResult(
          [
            point('2025-08-11T00:00:00.000Z'),
            point('2025-09-15T00:00:00.000Z'),
            point('2025-10-20T00:00:00.000Z'),
          ],
          'fintables',
          { validated: true },
        ),
      );

      const result = await service.fetchHistoricalData('THYAO', '1d', {
        startDate: '2025-10-01',
        endDate: '2025-12-31',
      });

      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].timestamp).toBe('2025-10-20T00:00:00.000Z');
    });
  });
});
