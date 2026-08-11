import { NightlyBacktestJob } from './nightly-backtest.job';
import { MarketDataService } from '../../market-data/market-data.service';
import { CoreBacktestEngine } from '../../backtest/backtest.engine';
import { HistoricalDatasetValidator } from '../../backtest-validation/backtest-validation.validator';
import { BenchmarkEngine } from '../../benchmark/benchmark.engine';
import { EventBusEngine } from '../../event-bus/event-bus.engine';
import { PerformanceMonitorEngine } from '../../performance-monitor/performance-monitor.engine';
import { AuditLogEngine } from '../../audit-log/audit-log.engine';
import { MarketDataPoint } from '../../market-data/interfaces/market-data.types';

function makeMarketDataPoint(symbol: string, overrides?: Partial<MarketDataPoint>): MarketDataPoint {
  return {
    symbol,
    timeframe: '1d',
    open: 100,
    high: 105,
    low: 95,
    close: 102,
    volume: 1000000,
    timestamp: '2025-01-15T00:00:00.000Z',
    validationStatus: 'valid',
    ...overrides,
  };
}

function generateBars(count: number, startPrice = 100, trend: 'up' | 'down' | 'flat' = 'up'): MarketDataPoint[] {
  const bars: MarketDataPoint[] = [];
  let price = startPrice;
  const baseDate = new Date('2024-06-01T00:00:00.000Z');

  for (let i = 0; i < count; i++) {
    const change = trend === 'up' ? 0.5 : trend === 'down' ? -0.3 : 0;
    price = Math.max(10, price + change + (Math.random() - 0.5) * 2);
    const date = new Date(baseDate.getTime() + i * 86400000);
    bars.push(makeMarketDataPoint('TEST', {
      open: price - 0.5,
      high: price + 2,
      low: price - 2,
      close: price,
      volume: 500000 + Math.floor(Math.random() * 500000),
      timestamp: date.toISOString(),
    }));
  }
  return bars;
}

function createMockServices() {
  return {
    marketDataService: {
      fetchData: jest.fn(),
    } as unknown as MarketDataService,
    backtestEngine: new CoreBacktestEngine(),
    validator: new HistoricalDatasetValidator(),
    benchmarkEngine: new BenchmarkEngine(),
    eventBus: {
      publish: jest.fn(),
    } as unknown as EventBusEngine,
    performanceMonitor: {
      record: jest.fn(),
      recordTiming: jest.fn(),
    } as unknown as PerformanceMonitorEngine,
    auditLog: {
      record: jest.fn(),
    } as unknown as AuditLogEngine,
  };
}

describe('NightlyBacktestJob', () => {
  let job: NightlyBacktestJob;
  let services: ReturnType<typeof createMockServices>;

  beforeEach(() => {
    services = createMockServices();
    job = new NightlyBacktestJob(
      services.marketDataService,
      services.backtestEngine,
      services.validator,
      services.benchmarkEngine,
      services.eventBus,
      services.performanceMonitor,
      services.auditLog,
    );
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  describe('full execution', () => {
    it('should execute backtests for all symbols and return success', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      const result = await job.execute();

      expect(result.success).toBe(true);
      expect(result.message).toContain('succeeded');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.symbolsProcessed).toBe(5);
      expect(result.metadata.symbolsSucceeded).toBe(5);
      expect(result.metadata.symbolsFailed).toBe(0);
      expect(result.metadata.totalTrades).toBeGreaterThanOrEqual(0);
    });

    it('should fetch benchmark data once at job start', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const calls = (services.marketDataService.fetchData as jest.Mock).mock.calls;
      expect(calls[0][0]).toBe('XU100.IS');
      expect(calls[0][1]).toBe('1d');
    });
  });

  describe('partial symbol failure', () => {
    it('should continue processing when some symbols fail', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');
      let callCount = 0;

      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve(benchBars);
        callCount++;
        if (symbol === 'THYAO') return Promise.reject(new Error('Network error'));
        return Promise.resolve(bars);
      });

      const result = await job.execute();

      expect(result.success).toBe(true);
      expect(result.metadata.symbolsFailed).toBeGreaterThanOrEqual(1);
      expect(result.metadata.symbolsSucceeded).toBeGreaterThanOrEqual(1);
    });

    it('should record failed symbols in summary', async () => {
      const bars = generateBars(100, 100, 'up');

      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve([]);
        if (symbol === 'THYAO') return Promise.reject(new Error('Provider down'));
        return Promise.resolve(bars);
      });

      const result = await job.execute();
      const failed = result.metadata.failedSymbols as Array<{ symbol: string; reason: string }>;

      expect(failed.some((f) => f.symbol === 'THYAO')).toBe(true);
    });
  });

  describe('invalid dataset skip', () => {
    it('should skip symbols with invalid dataset', async () => {
      const invalidBars: MarketDataPoint[] = [
        makeMarketDataPoint('TEST', { high: 50, low: 100, timestamp: '2025-01-15T00:00:00.000Z' }),
      ];

      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve(generateBars(100, 5000, 'up'));
        return Promise.resolve(invalidBars);
      });

      const result = await job.execute();

      expect(result.success).toBe(false);
      expect(result.metadata.symbolsFailed).toBe(5);
      expect(result.metadata.symbolsSucceeded).toBe(0);
    });

    it('should skip symbols with empty data', async () => {
      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve(generateBars(100, 5000, 'up'));
        return Promise.resolve([]);
      });

      const result = await job.execute();

      expect(result.success).toBe(false);
      expect(result.metadata.symbolsFailed).toBe(5);
    });
  });

  describe('benchmark attachment', () => {
    it('should attach benchmark metrics when benchmark data is available', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      const result = await job.execute();

      expect(result.metadata.benchmarkAlpha).toBeDefined();
      expect(result.metadata.benchmarkBeta).toBeDefined();
    });

    it('should handle missing benchmark data gracefully', async () => {
      const bars = generateBars(100, 100, 'up');

      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve([]);
        return Promise.resolve(bars);
      });

      const result = await job.execute();

      expect(result.success).toBe(true);
      expect(result.metadata.benchmarkAlpha).toBe(0);
      expect(result.metadata.benchmarkBeta).toBe(0);
    });
  });

  describe('event publication', () => {
    it('should publish started event', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const startedCall = (services.eventBus.publish as jest.Mock).mock.calls.find(
        (c) => c[0] === 'scheduler.nightly_backtest.started',
      );
      expect(startedCall).toBeDefined();
    });

    it('should publish completed event', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const completedCall = (services.eventBus.publish as jest.Mock).mock.calls.find(
        (c) => c[0] === 'scheduler.nightly_backtest.completed',
      );
      expect(completedCall).toBeDefined();
    });

    it('should publish symbol-level events', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const publishCalls = (services.eventBus.publish as jest.Mock).mock.calls;
      const symbolStarted = publishCalls.filter((c) => c[0] === 'scheduler.nightly_backtest.symbol_started');
      const symbolCompleted = publishCalls.filter((c) => c[0] === 'scheduler.nightly_backtest.symbol_completed');

      expect(symbolStarted.length).toBe(5);
      expect(symbolCompleted.length).toBe(5);
    });

    it('should publish symbol_failed events on error', async () => {
      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve([]);
        if (symbol === 'THYAO') return Promise.reject(new Error('fail'));
        return Promise.resolve(generateBars(100, 100, 'up'));
      });

      await job.execute();

      const failedEvents = (services.eventBus.publish as jest.Mock).mock.calls.filter(
        (c) => c[0] === 'scheduler.nightly_backtest.symbol_failed',
      );
      expect(failedEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('audit logging', () => {
    it('should record job started audit event', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const startAudit = (services.auditLog.record as jest.Mock).mock.calls.find(
        (c) => c[0].action === 'STARTED' && c[0].entityId === 'nightly',
      );
      expect(startAudit).toBeDefined();
    });

    it('should record job completed audit event', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const completedAudit = (services.auditLog.record as jest.Mock).mock.calls.find(
        (c) => c[0].action === 'COMPLETED' && c[0].entityId === 'nightly',
      );
      expect(completedAudit).toBeDefined();
    });

    it('should record per-symbol audit events', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const symbolAudits = (services.auditLog.record as jest.Mock).mock.calls.filter(
        (c) => c[0].entity === 'nightly_backtest' && c[0].entityId !== 'nightly',
      );
      expect(symbolAudits.length).toBe(5);
    });

    it('should record failed symbol audit events', async () => {
      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve([]);
        if (symbol === 'THYAO') return Promise.reject(new Error('fail'));
        return Promise.resolve(generateBars(100, 100, 'up'));
      });

      await job.execute();

      const failedAudits = (services.auditLog.record as jest.Mock).mock.calls.filter(
        (c) => c[0].action === 'FAILED',
      );
      expect(failedAudits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('performance timing', () => {
    it('should record total job timing', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const totalTiming = (services.performanceMonitor.recordTiming as jest.Mock).mock.calls.find(
        (c) => c[1] === 'nightly_backtest_total',
      );
      expect(totalTiming).toBeDefined();
    });

    it('should record per-symbol timing', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const symbolTimings = (services.performanceMonitor.recordTiming as jest.Mock).mock.calls.filter(
        (c) => c[1] === 'nightly_backtest_symbol_total',
      );
      expect(symbolTimings.length).toBe(5);
    });

    it('should record validation timing', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const validationTimings = (services.performanceMonitor.recordTiming as jest.Mock).mock.calls.filter(
        (c) => c[1] === 'backtest_dataset_validation',
      );
      expect(validationTimings.length).toBe(5);
    });

    it('should record backtest execution timing', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      await job.execute();

      const executionTimings = (services.performanceMonitor.recordTiming as jest.Mock).mock.calls.filter(
        (c) => c[1] === 'backtest_engine_execution',
      );
      expect(executionTimings.length).toBe(5);
    });
  });

  describe('result summary', () => {
    it('should include structured summary in metadata', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      const result = await job.execute();
      const meta = result.metadata as Record<string, unknown>;

      expect(meta.startedAt).toBeDefined();
      expect(meta.finishedAt).toBeDefined();
      expect(meta.durationMs).toBeGreaterThanOrEqual(0);
      expect(meta.symbolsProcessed).toBe(5);
      expect(meta.totalTrades).toBeDefined();
      expect(meta.winRate).toBeDefined();
      expect(meta.averageReturn).toBeDefined();
      expect(meta.maxDrawdown).toBeDefined();
      expect(meta.profitFactor).toBeDefined();
      expect(meta.perSymbol).toBeDefined();
      expect(Array.isArray(meta.perSymbol)).toBe(true);
      expect((meta.perSymbol as unknown[]).length).toBe(5);
    });

    it('should report per-symbol details', async () => {
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      (services.marketDataService.fetchData as jest.Mock)
        .mockResolvedValueOnce(benchBars)
        .mockResolvedValue(bars);

      const result = await job.execute();
      const perSymbol = result.metadata.perSymbol as Array<{ symbol: string; barsCount: number; qualityScore: number }>;

      expect(perSymbol[0].symbol).toBeDefined();
      expect(perSymbol[0].barsCount).toBe(100);
      expect(perSymbol[0].qualityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('abort signal', () => {
    it('should stop processing when signal is aborted', async () => {
      const controller = new AbortController();
      const bars = generateBars(100, 100, 'up');
      const benchBars = generateBars(100, 5000, 'up');

      let fetchCount = 0;
      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        fetchCount++;
        if (symbol === 'XU100.IS') return Promise.resolve(benchBars);
        if (fetchCount === 3) controller.abort();
        return Promise.resolve(bars);
      });

      const result = await job.execute({ signal: controller.signal });

      expect(result.metadata.symbolsProcessed).toBeLessThanOrEqual(5);
    });
  });

  describe('error handling', () => {
    it('should fail when all symbols fail', async () => {
      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.resolve([]);
        return Promise.reject(new Error('Provider down'));
      });

      const result = await job.execute();

      expect(result.success).toBe(false);
      expect(result.metadata.symbolsFailed).toBe(5);
      expect(result.metadata.symbolsSucceeded).toBe(0);
    });

    it('should handle benchmark fetch failure gracefully', async () => {
      const bars = generateBars(100, 100, 'up');
      (services.marketDataService.fetchData as jest.Mock).mockImplementation((symbol: string) => {
        if (symbol === 'XU100.IS') return Promise.reject(new Error('Timeout'));
        return Promise.resolve(bars);
      });

      const result = await job.execute();

      expect(result.success).toBe(true);
      expect(result.metadata.benchmarkAlpha).toBe(0);
    });
  });
});
