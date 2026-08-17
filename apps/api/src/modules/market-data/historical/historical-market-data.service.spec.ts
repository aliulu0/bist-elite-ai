import { HistoricalMarketDataService } from './historical-market-data.service';
import { HistoricalMarketDataConfig } from './historical-market-data.config';
import { RequestDeduplicatorService } from '../dedup/request-deduplicator.service';
import { MarketDataPoint, MarketDataResult } from '../interfaces';
import { ValidationStatus } from '../interfaces/market-data.types';
import { IncrementalMarketDataState } from '../incremental/incremental-timeframe.config';
import * as calendar from './bist-trading-calendar';

const TEST_CONFIG: HistoricalMarketDataConfig = {
  defaultStartDate: '2026-07-01',
  minBarsForBacktest: { '4h': 20, '1d': 10, '1w': 4, '1m': 2, '3m': 1, '6m': 1 },
  minCoveragePctForBacktest: 90,
  defaultConcurrency: 1,
  maxConcurrency: 4,
  maxRangesPerBackfill: 50,
};

const NOW = Date.parse('2026-08-01T00:00:00Z');
const WINDOW = { startDate: '2026-07-01', endDate: '2026-07-31' };
const KEY = (symbol: string, timeframe: string) => `${symbol}|${timeframe}`;

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

function tradingDayTimestamps(start: string, end: string): string[] {
  return calendar.eachTradingDay(start, end).map((d) => `${d}T15:00:00.000Z`);
}

function stateOf(points: MarketDataPoint[], provider = 'yahoo'): IncrementalMarketDataState {
  return {
    ticker: points[0]?.symbol ?? '',
    timeframe: points[0]?.timeframe ?? '',
    lastTimestamp: points.length ? points[points.length - 1].timestamp : null,
    firstTimestamp: points.length ? points[0].timestamp : null,
    barCount: points.length,
    provider,
    updatedAt: '2026-07-31T15:00:00.000Z',
    dataVersion: 'v1',
    stale: false,
  };
}

function makeResult<T>(
  data: T,
  provider = 'yahoo',
  extra: Partial<MarketDataResult<T>> = {},
): MarketDataResult<T> {
  return { data, provider, cached: false, timestamp: new Date().toISOString(), ...extra };
}

function makeCache() {
  const store = new Map<string, unknown>();
  return {
    store,
    get: jest.fn((provider: string, type: string, key: string) =>
      store.get(`${provider}:${type}:${key}`),
    ),
    set: jest.fn((provider: string, type: string, key: string, value: unknown) => {
      store.set(`${provider}:${type}:${key}`, value);
      return true;
    }),
  };
}

describe('HistoricalMarketDataService', () => {
  let orchestrator: { fetchHistoricalRange: jest.Mock };
  let cache: ReturnType<typeof makeCache>;
  let validationService: { validateDataPoints: jest.Mock };
  let deduplicator: RequestDeduplicatorService;
  let service: HistoricalMarketDataService;

  const build = (overrides: { cache?: unknown; validation?: unknown; registry?: unknown } = {}) => {
    service = new HistoricalMarketDataService(
      orchestrator as never,
      (overrides.cache ?? cache) as never,
      (overrides.validation ?? validationService) as never,
      undefined,
      undefined,
      overrides.registry as never,
      deduplicator,
      TEST_CONFIG,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = { fetchHistoricalRange: jest.fn() };
    cache = makeCache();
    validationService = { validateDataPoints: jest.fn((pts: MarketDataPoint[]) => pts) };
    deduplicator = new RequestDeduplicatorService(15_000);
    build();
  });

  describe('TRADING CALENDAR', () => {
    it('marks weekends as non-trading days', () => {
      expect(calendar.isTradingDay('2026-07-04')).toBe(false);
      expect(calendar.isTradingDay('2026-07-05')).toBe(false);
      expect(calendar.isTradingDay('2026-07-06')).toBe(true);
    });

    it('marks fixed Turkish holidays as non-trading days', () => {
      expect(calendar.isTradingDay('2026-01-01')).toBe(false);
      expect(calendar.isTradingDay('2026-04-23')).toBe(false);
      expect(calendar.isTradingDay('2026-05-01')).toBe(false);
      expect(calendar.isTradingDay('2026-05-19')).toBe(false);
      expect(calendar.isTradingDay('2026-07-15')).toBe(false);
      expect(calendar.isTradingDay('2026-08-30')).toBe(false);
      expect(calendar.isTradingDay('2026-10-29')).toBe(false);
    });

    it('enumerates only trading days within a range (no weekends/holidays)', () => {
      const days = calendar.eachTradingDay('2026-07-01', '2026-07-31');
      expect(days.length).toBeGreaterThan(0);
      expect(days.some((d) => d.endsWith('-04') || d.endsWith('-05'))).toBe(false);
      expect(days).not.toContain('2026-07-15');
    });
  });

  describe('HISTORY STATUS', () => {
    it('empty history -> status empty, no data, not usable', async () => {
      const status = await service.getSymbolStatus('THYAO', '1d', { ...WINDOW, now: NOW });
      expect(status.status).toBe('empty');
      expect(status.hasData).toBe(false);
      expect(status.barCount).toBe(0);
      expect(status.quality.freshness).toBe('no-data');
      expect(status.quality.usableForBacktest).toBe(false);
    });

    it('complete history -> status complete, 100% coverage, usable for backtest', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const status = await service.getSymbolStatus('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(status.status).toBe('complete');
      expect(status.barCount).toBe(points.length);
      expect(status.coverage.gapCount).toBe(0);
      expect(status.coverage.coveragePercent).toBe(100);
      expect(status.quality.usableForBacktest).toBe(true);
      expect(status.quality.reason).toBe('Backtest için yeterli tarihsel veri bulunuyor.');
    });

    it('missing single trading day -> status partial with exactly one gap range', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const missingDay = missingTs.slice(0, 10);
      const points = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const status = await service.getSymbolStatus('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(status.status).toBe('partial');
      expect(status.coverage.gapCount).toBe(1);
      expect(status.coverage.missingRanges).toEqual([{ start: missingDay, end: missingDay }]);
      expect(status.coverage.coveragePercent).toBeLessThan(100);
    });

    it('consecutive missing days -> single grouped range', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const removed = timestamps.slice(8, 11);
      const points = timestamps.filter((ts) => !removed.includes(ts)).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const gaps = await service.getGaps('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(gaps.gapCount).toBe(1);
      expect(gaps.missingRanges[0].start).toBe(removed[0].slice(0, 10));
      expect(gaps.missingRanges[0].end).toBe(removed[removed.length - 1].slice(0, 10));
    });

    it('multi-symbol metadata-only status report', async () => {
      const now = Date.parse('2026-08-03T10:00:00Z'); // Monday 13:00 TR, market open
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const fresh = [...timestamps, '2026-08-03T07:00:00.000Z'];
      const points = fresh.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points, 'yahoo'));
      const stalePoints = [point('2026-07-01T15:00:00.000Z', { symbol: 'SISE' })];
      cache.store.set('any:historical:SISE|1d', stalePoints);
      cache.store.set('any:historicalMeta:SISE|1d', stateOf(stalePoints, 'yahoo'));

      const registry = {
        getActiveSymbols: () => [{ canonicalTicker: 'THYAO' }, { canonicalTicker: 'SISE' }],
      };
      build({ registry });

      const report = await service.getAllStatus('1d', { ...WINDOW, now });

      expect(report.totalSymbols).toBe(2);
      expect(report.symbolsWithHistory).toBe(2);
      expect(report.symbolsWithoutHistory).toBe(0);
      expect(report.completeSymbols).toBe(1);
      expect(report.incompleteSymbols).toBe(1);
      expect(report.staleSymbols).toBe(1);
      expect(report.symbols.find((s) => s.symbol === 'THYAO')?.status).toBe('complete');
      expect(report.symbols.find((s) => s.symbol === 'SISE')?.status).toBe('partial');
      expect(report.symbols.find((s) => s.symbol === 'THYAO')?.usableForBacktest).toBe(true);
      expect(report.symbols.find((s) => s.symbol === 'SISE')?.usableForBacktest).toBe(false);
    });
  });

  describe('GAP DETECTION', () => {
    it('detects duplicate timestamps and out-of-order candles', async () => {
      const points = [
        point('2026-07-01T15:00:00.000Z'),
        point('2026-07-02T15:00:00.000Z'),
        point('2026-07-02T15:00:00.000Z'),
        point('2026-07-04T15:00:00.000Z'),
        point('2026-07-03T15:00:00.000Z'),
      ];
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const gaps = await service.getGaps('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(gaps.duplicateTimestamps).toBe(1);
      expect(gaps.outOfOrderCount).toBeGreaterThan(0);
    });

    it('counts zero/negative prices and invalid volume', async () => {
      const points = [
        point('2026-07-01T15:00:00.000Z', { close: 0 }),
        point('2026-07-02T15:00:00.000Z', { volume: -5 }),
        point('2026-07-03T15:00:00.000Z'),
      ];
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const gaps = await service.getGaps('THYAO', '1d', {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        now: NOW,
      });

      expect(gaps.zeroOrNegativePriceCount).toBe(1);
      expect(gaps.invalidVolumeCount).toBe(1);
    });

    it('flags large abnormal gaps separately', async () => {
      const points = [point('2026-07-01T15:00:00.000Z'), point('2026-07-28T15:00:00.000Z')];
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const gaps = await service.getGaps('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(gaps.abnormalGaps.length).toBeGreaterThan(0);
      expect(gaps.gapCount).toBeGreaterThan(0);
    });
  });

  describe('BACKFILL', () => {
    it('cold cache: fetches full window as a single range and persists merged data', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult(
          timestamps.map((ts) => point(ts)),
          'yahoo',
        ),
      );

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.status).toBe('completed');
      expect(result.requestedRanges).toBe(1);
      expect(result.fetchedBars).toBe(timestamps.length);
      expect(result.barCount).toBe(timestamps.length);
      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledTimes(1);
      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledWith('THYAO', '1d', {
        startDate: WINDOW.startDate,
        endDate: WINDOW.endDate,
      });
      const cached = cache.store.get('any:historical:THYAO|1d') as MarketDataPoint[];
      expect(cached).toHaveLength(timestamps.length);
      expect(cache.store.get('any:historicalMeta:THYAO|1d')).toBeDefined();
    });

    it('complete history: 0 provider calls', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.status).toBe('completed');
      expect(result.requestedRanges).toBe(0);
      expect(result.message).toBe('Veri zaten eksiksiz (boşluk bulunamadı).');
      expect(orchestrator.fetchHistoricalRange).not.toHaveBeenCalled();
    });

    it('small missing range: exactly 1 range request for only that range', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const missingDay = missingTs.slice(0, 10);
      const existing = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));
      orchestrator.fetchHistoricalRange.mockResolvedValue(makeResult([point(missingTs)], 'yahoo'));

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledTimes(1);
      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledWith('THYAO', '1d', {
        startDate: missingDay,
        endDate: missingDay,
      });
      expect(result.status).toBe('completed');
      expect(result.fetchedBars).toBe(1);
      const cached = cache.store.get('any:historical:THYAO|1d') as MarketDataPoint[];
      expect(cached).toHaveLength(timestamps.length);
    });

    it('repeated request after success: 0 additional provider calls', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const existing = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));
      orchestrator.fetchHistoricalRange.mockResolvedValue(makeResult([point(missingTs)], 'yahoo'));

      await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });
      const callsAfterFirst = orchestrator.fetchHistoricalRange.mock.calls.length;
      expect(callsAfterFirst).toBe(1);

      const second = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(orchestrator.fetchHistoricalRange.mock.calls.length).toBe(callsAfterFirst);
      expect(second.status).toBe('completed');
    });

    it('concurrent identical backfill: 1 provider call', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const existing = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));

      let resolveRange!: (v: MarketDataResult<MarketDataPoint[]>) => void;
      orchestrator.fetchHistoricalRange.mockImplementation(
        () =>
          new Promise((res) => {
            resolveRange = res;
          }),
      );

      const p1 = service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });
      const p2 = service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledTimes(1);
      resolveRange(makeResult([point(missingTs)], 'yahoo'));
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.status).toBe('completed');
      expect(r2.status).toBe('completed');
    });

    it('backfill failure: previous valid data preserved (STALE_BUT_VALID)', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const existing = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));
      orchestrator.fetchHistoricalRange.mockRejectedValue(new Error('network'));

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.status).toBe('STALE_BUT_VALID');
      expect(result.message).toBe('Önceki geçerli veri korunarak kullanıldı.');
      expect(result.barCount).toBe(existing.length);
      const cached = cache.store.get('any:historical:THYAO|1d') as MarketDataPoint[];
      expect(cached).toHaveLength(existing.length);
    });

    it('force backfill: refetches full window even when complete', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));
      orchestrator.fetchHistoricalRange.mockResolvedValue(makeResult(points, 'yahoo'));

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW, force: true });

      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledTimes(1);
      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledWith('THYAO', '1d', {
        startDate: WINDOW.startDate,
        endDate: WINDOW.endDate,
      });
      expect(result.status).toBe('completed');
    });

    it('partial provider response: coverage recalculated, never claims success', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const removed = timestamps.slice(8, 11);
      const existing = timestamps.filter((ts) => !removed.includes(ts)).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));
      orchestrator.fetchHistoricalRange.mockResolvedValue(makeResult([point(removed[0])], 'yahoo'));

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.status).toBe('partial');
      expect(result.remainingRanges).toBeGreaterThan(0);
      expect(result.message).toBe('Provider yanıtı eksik; boşluklar korundu.');
    });

    it('provider fallback metadata is surfaced on the backfill result', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const existing = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult([point(missingTs)], 'serpapi', {
          fallbackUsed: true,
          attemptedProviders: ['yahoo', 'serpapi'],
        }),
      );

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.actualProvider).toBe('serpapi');
      expect(result.fallbackUsed).toBe(true);
      expect(result.providerAttempts).toBe(2);
      expect(result.status).toBe('completed');
    });

    it('no-gaps backfill keeps the previously recorded provider without provider calls', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points, 'fintables'));

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.status).toBe('completed');
      expect(result.actualProvider).toBe('fintables');
      expect(result.fallbackUsed).toBe(false);
      expect(result.providerAttempts).toBe(0);
      expect(orchestrator.fetchHistoricalRange).not.toHaveBeenCalled();
    });

    it('cache disabled: still fetches, merges and returns data', async () => {
      const disabledCache = { get: jest.fn(() => undefined), set: jest.fn(() => false) };
      build({ cache: disabledCache });
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult(
          timestamps.map((ts) => point(ts)),
          'yahoo',
        ),
      );

      const result = await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(result.status).toBe('completed');
      expect(result.barCount).toBe(timestamps.length);
      expect(disabledCache.set).toHaveBeenCalled();
    });

    it('getBackfillStatus reflects the last failed run', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const missingTs = timestamps[10];
      const existing = timestamps.filter((ts) => ts !== missingTs).map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', existing);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(existing));
      orchestrator.fetchHistoricalRange.mockRejectedValue(new Error('network'));

      await service.backfill('THYAO', '1d', { ...WINDOW, now: NOW });

      const info = await service.getBackfillStatus('THYAO', '1d');
      expect(info.status).toBe('STALE_BUT_VALID');
      expect(info.lastError).toBe('Önceki geçerli veri korunarak kullanıldı.');
    });
  });

  describe('QUALITY & BACKTEST SAFETY GATE', () => {
    it('sufficient coverage + bars -> usable with deterministic reason', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const quality = await service.getQuality('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(quality.usableForBacktest).toBe(true);
      expect(quality.integrityValid).toBe(true);
      expect(quality.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('too few bars -> not usable, "tarihsel veri yetersiz"', async () => {
      const points = [point('2026-07-01T15:00:00.000Z'), point('2026-07-02T15:00:00.000Z')];
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const quality = await service.getQuality('THYAO', '1d', {
        startDate: '2026-07-01',
        endDate: '2026-07-02',
        now: NOW,
      });

      expect(quality.usableForBacktest).toBe(false);
      expect(quality.reason).toBe('Backtest için tarihsel veri yetersiz.');
    });

    it('invalid OHLC -> integrity broken, not usable', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      points[3] = point(points[3].timestamp, { validationStatus: 'invalid' });
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const quality = await service.getQuality('THYAO', '1d', { ...WINDOW, now: NOW });

      expect(quality.integrityValid).toBe(false);
      expect(quality.usableForBacktest).toBe(false);
      expect(quality.reason).toBe('Veri kalitesi yetersiz (OHLC doğrulama hatası).');
    });
  });

  describe('TIMEFRAME RESOLUTION', () => {
    it('1h request backfills against the 4h fetchable cache key', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      orchestrator.fetchHistoricalRange.mockResolvedValue(
        makeResult(
          timestamps.map((ts) => point(ts, { timeframe: '4h' })),
          'yahoo',
        ),
      );

      const result = await service.backfill('THYAO', '1h', { ...WINDOW, now: NOW });

      expect(orchestrator.fetchHistoricalRange).toHaveBeenCalledWith(
        'THYAO',
        '4h',
        expect.any(Object),
      );
      expect(result.status).toBe('completed');
      expect(cache.store.get('any:historical:THYAO|4h')).toBeDefined();
      expect(cache.store.get('any:historical:THYAO|1h')).toBeUndefined();
    });

    it('rejects unsupported timeframe without touching provider', async () => {
      const result = await service.backfill('THYAO', '2d', { ...WINDOW, now: NOW });
      expect(result.status).toBe('failed');
      expect(orchestrator.fetchHistoricalRange).not.toHaveBeenCalled();
    });
  });

  describe('BACKTEST VALIDATED HISTORY PATH', () => {
    it('returns cached validated data without provider calls', async () => {
      const timestamps = tradingDayTimestamps(WINDOW.startDate, WINDOW.endDate);
      const points = timestamps.map((ts) => point(ts));
      cache.store.set('any:historical:THYAO|1d', points);
      cache.store.set('any:historicalMeta:THYAO|1d', stateOf(points));

      const history = await service.getValidatedHistory('THYAO', '1d', {
        startDate: WINDOW.startDate,
        endDate: WINDOW.endDate,
      });

      expect(history).toHaveLength(points.length);
      expect(orchestrator.fetchHistoricalRange).not.toHaveBeenCalled();
    });

    it('returns null when cache cold and no incremental fallback exists', async () => {
      const history = await service.getValidatedHistory('THYAO', '1d', {});
      expect(history).toBeNull();
      expect(orchestrator.fetchHistoricalRange).not.toHaveBeenCalled();
    });
  });
});
