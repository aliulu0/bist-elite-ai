import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { MarketDataService } from '../../market-data/market-data.service';
import { CoreBacktestEngine } from '../../backtest/backtest.engine';
import { buildStrategy } from '../../backtest/backtest.config';
import { BacktestResult } from '../../backtest/backtest.types';
import { HistoricalDatasetValidator } from '../../backtest-validation/backtest-validation.validator';
import { BenchmarkEngine } from '../../benchmark/benchmark.engine';
import { BenchmarkResult } from '../../benchmark/benchmark.types';
import { HistoricalDatasetValidationResult } from '../../backtest-validation/backtest-validation.types';
import { EventBusEngine } from '../../event-bus/event-bus.engine';
import { PerformanceMonitorEngine } from '../../performance-monitor/performance-monitor.engine';
import { AuditLogEngine } from '../../audit-log/audit-log.engine';
import { PersistenceService } from '../../persistence/persistence.service';
import { OHLCV, Timeframe } from '../../indicators/indicator.types';
import { BIST_BACKTEST_SYMBOLS, BIST_BENCHMARK_INDEX } from './scheduler-symbols.config';

interface SymbolBacktestOutcome {
  symbol: string;
  barsCount: number;
  validation: HistoricalDatasetValidationResult;
  backtest: BacktestResult;
  benchmark: BenchmarkResult | null;
  durationMs: number;
}

@Injectable()
export class NightlyBacktestJob implements IJob {
  private readonly logger = new Logger(NightlyBacktestJob.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly backtestEngine: CoreBacktestEngine,
    private readonly validator: HistoricalDatasetValidator,
    private readonly benchmarkEngine: BenchmarkEngine,
    private readonly eventBus: EventBusEngine,
    private readonly performanceMonitor: PerformanceMonitorEngine,
    private readonly auditLog: AuditLogEngine,
    @Optional() private readonly persistenceService?: PersistenceService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    const jobStart = Date.now();
    const symbols = BIST_BACKTEST_SYMBOLS;

    this.logger.debug('NightlyBacktestJob started');

    this.eventBus.publish('scheduler.nightly_backtest.started', 'scheduler', {
      symbols,
      startedAt: new Date().toISOString(),
    }, { source: 'NightlyBacktestJob', severity: 'info' });

    this.auditLog.record({
      module: 'scheduler',
      entity: 'nightly_backtest',
      entityId: 'nightly',
      action: 'STARTED',
      severity: 'INFO',
      user: null,
      oldValue: null,
      newValue: { symbols },
      metadata: { symbolCount: symbols.length },
    });

    const benchmarkData = await this.fetchBenchmarkData();
    const outcomes: SymbolBacktestOutcome[] = [];
    const failedSymbols: Array<{ symbol: string; reason: string }> = [];

    for (const symbol of symbols) {
      if (ctx?.signal?.aborted) {
        this.logger.warn('NightlyBacktestJob aborted by signal');
        break;
      }

      const outcome = await this.processSymbol(symbol, benchmarkData);
      if (outcome) {
        outcomes.push(outcome);
      } else {
        failedSymbols.push({ symbol, reason: 'processing failed' });
      }
    }

    const jobDurationMs = Date.now() - jobStart;
    const summary = this.buildSummary(outcomes, failedSymbols, jobDurationMs);

    this.eventBus.publish('scheduler.nightly_backtest.completed', 'scheduler', summary, {
      source: 'NightlyBacktestJob',
      severity: outcomes.length > 0 ? 'info' : 'warning',
    });

    this.auditLog.record({
      module: 'scheduler',
      entity: 'nightly_backtest',
      entityId: 'nightly',
      action: 'COMPLETED',
      severity: failedSymbols.length === symbols.length ? 'ERROR' : 'INFO',
      user: null,
      oldValue: null,
      newValue: summary,
      metadata: { durationMs: jobDurationMs },
    });

    this.performanceMonitor.recordTiming('scheduler', 'nightly_backtest_total', jobStart);

    this.logger.log(
      `NightlyBacktest completed: ${summary.symbolsSucceeded} succeeded, ` +
      `${summary.symbolsFailed} failed, ${summary.totalTrades} trades, ` +
      `duration: ${jobDurationMs}ms`,
    );

    if (this.persistenceService) {
      this.persistenceService.saveBacktestPipelineRun({
        symbolsProcessed: summary.symbolsProcessed,
        symbolsSucceeded: summary.symbolsSucceeded,
        symbolsFailed: summary.symbolsFailed,
        totalTrades: summary.totalTrades,
        winRate: summary.winRate,
        avgReturn: summary.averageReturn,
        maxDrawdown: summary.maxDrawdown,
        profitFactor: summary.profitFactor,
        benchmarkAlpha: summary.benchmarkAlpha,
        benchmarkBeta: summary.benchmarkBeta,
        perSymbolResults: summary.perSymbol,
        benchmarkReturns: null,
        metadata: { ...summary, perSymbol: undefined },
        status: 'completed',
        error: null,
        startedAt: new Date(Date.now() - jobDurationMs),
        completedAt: new Date(),
      }).catch((err) => {
        this.logger.warn(`Failed to persist backtest pipeline run: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    return {
      success: summary.symbolsSucceeded > 0,
      message: `Nightly backtest: ${summary.symbolsSucceeded} succeeded, ${summary.symbolsFailed} failed, ` +
        `${summary.totalTrades} total trades, win rate: ${summary.winRate.toFixed(1)}%`,
      metadata: summary,
    };
  }

  private async processSymbol(
    symbol: string,
    benchmarkData: OHLCV[],
  ): Promise<SymbolBacktestOutcome | null> {
    const symbolStart = Date.now();

    try {
      this.eventBus.publish('scheduler.nightly_backtest.symbol_started', 'scheduler', {
        symbol,
        startedAt: new Date().toISOString(),
      }, { source: 'NightlyBacktestJob', severity: 'info' });

      const rawData = await this.marketDataService.fetchData(symbol, '1d' as Timeframe);
      if (!rawData || rawData.length === 0) {
        this.logger.warn(`No data fetched for ${symbol}`);
        this.emitSymbolFailed(symbol, 'No data fetched');
        return null;
      }

      const ohlcv: OHLCV[] = rawData.map((p) => ({
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        timestamp: p.timestamp,
      }));

      const validationStart = Date.now();
      const validation = this.validator.validate(ohlcv);
      this.performanceMonitor.recordTiming('scheduler', 'backtest_dataset_validation', validationStart, { symbol });

      if (!validation.isValid) {
        this.logger.warn(
          `Invalid dataset for ${symbol} (quality: ${validation.qualityScore}): ` +
          validation.warnings.join(', '),
        );
        this.emitSymbolFailed(symbol, `Validation failed: quality=${validation.qualityScore}`);
        return null;
      }

      const backtestStart = Date.now();
      const backtestStrategy = buildStrategy('indicator', {
        timeframe: '1d' as Timeframe,
        timeRange: '1Y',
        symbol,
        benchmarkTicker: BIST_BENCHMARK_INDEX,
      });
      const backtestResult = this.backtestEngine.run(ohlcv, '1d', backtestStrategy);
      this.performanceMonitor.recordTiming('scheduler', 'backtest_engine_execution', backtestStart, { symbol });

      let benchmarkResult: BenchmarkResult | null = null;
      if (benchmarkData.length > 0 && backtestResult.isValid && backtestResult.trades.length > 0) {
        const benchmarkStart = Date.now();
        const strategyReturns = backtestResult.trades.map((t) => t.returnPercent);
        const benchmarkReturns = this.computeBenchmarkReturns(ohlcv, benchmarkData);
        if (benchmarkReturns.length > 0) {
          benchmarkResult = this.benchmarkEngine.evaluate({
            strategyReturns,
            benchmarkReturns,
            sectorReturns: [],
          });
        }
        this.performanceMonitor.recordTiming('scheduler', 'backtest_benchmark_evaluation', benchmarkStart, { symbol });
      }

      const durationMs = Date.now() - symbolStart;

      this.eventBus.publish('scheduler.nightly_backtest.symbol_completed', 'scheduler', {
        symbol,
        totalTrades: backtestResult.performance.totalTrades,
        winRate: backtestResult.performance.winRate,
        totalReturn: backtestResult.performance.totalReturn,
        maxDrawdown: backtestResult.risk.maxDrawdown,
        durationMs,
      }, { source: 'NightlyBacktestJob', severity: 'info' });

      this.auditLog.record({
        module: 'scheduler',
        entity: 'nightly_backtest',
        entityId: symbol,
        action: 'COMPLETED',
        severity: 'INFO',
        user: null,
        oldValue: null,
        newValue: {
          totalTrades: backtestResult.performance.totalTrades,
          winRate: backtestResult.performance.winRate,
          totalReturn: backtestResult.performance.totalReturn,
        },
        metadata: { durationMs, barsCount: ohlcv.length },
      });

      this.performanceMonitor.recordTiming('scheduler', 'nightly_backtest_symbol_total', symbolStart, { symbol });

      return {
        symbol,
        barsCount: ohlcv.length,
        validation,
        backtest: backtestResult,
        benchmark: benchmarkResult,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - symbolStart;
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logger.error(`Backtest failed for ${symbol}: ${errorMsg}`);
      this.emitSymbolFailed(symbol, errorMsg);

      this.auditLog.record({
        module: 'scheduler',
        entity: 'nightly_backtest',
        entityId: symbol,
        action: 'FAILED',
        severity: 'ERROR',
        user: null,
        oldValue: null,
        newValue: { error: errorMsg },
        metadata: { durationMs },
      });

      this.performanceMonitor.recordTiming('scheduler', 'nightly_backtest_symbol_total', symbolStart, { symbol });

      return null;
    }
  }

  private emitSymbolFailed(symbol: string, reason: string): void {
    this.eventBus.publish('scheduler.nightly_backtest.symbol_failed', 'scheduler', {
      symbol,
      reason,
      timestamp: new Date().toISOString(),
    }, { source: 'NightlyBacktestJob', severity: 'warning' });
  }

  private async fetchBenchmarkData(): Promise<OHLCV[]> {
    try {
      const startTime = Date.now();
      const rawData = await this.marketDataService.fetchData(BIST_BENCHMARK_INDEX, '1d' as Timeframe);
      this.performanceMonitor.recordTiming('scheduler', 'backtest_benchmark_fetch', startTime);

      if (!rawData || rawData.length === 0) {
        this.logger.warn('No benchmark data fetched');
        return [];
      }

      return rawData.map((p) => ({
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        timestamp: p.timestamp,
      }));
    } catch (error) {
      this.logger.warn(`Failed to fetch benchmark data: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private computeBenchmarkReturns(ohlcv: OHLCV[], benchmarkData: OHLCV[]): number[] {
    if (ohlcv.length < 2 || benchmarkData.length < 2) return [];

    const strategyStart = ohlcv[0].timestamp;
    const strategyEnd = ohlcv[ohlcv.length - 1].timestamp;

    const relevantBenchmark = benchmarkData.filter(
      (b) => b.timestamp >= strategyStart && b.timestamp <= strategyEnd,
    );

    if (relevantBenchmark.length < 2) {
      const totalReturn = ((benchmarkData[benchmarkData.length - 1].close - benchmarkData[0].close) / benchmarkData[0].close) * 100;
      return [totalReturn];
    }

    const returns: number[] = [];
    for (let i = 1; i < relevantBenchmark.length; i++) {
      const dailyReturn = ((relevantBenchmark[i].close - relevantBenchmark[i - 1].close) / relevantBenchmark[i - 1].close) * 100;
      returns.push(dailyReturn);
    }

    return returns;
  }

  private buildSummary(
    outcomes: SymbolBacktestOutcome[],
    failedSymbols: Array<{ symbol: string; reason: string }>,
    durationMs: number,
  ) {
    const validBacktests = outcomes.filter((o) => o.backtest.isValid);
    const allTrades = validBacktests.flatMap((o) => o.backtest.trades);
    const totalTrades = allTrades.length;
    const winningTrades = allTrades.filter((t) => t.returnPercent > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const returns = allTrades.map((t) => t.returnPercent);
    const averageReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

    const maxDrawdowns = validBacktests.map((o) => o.backtest.risk.maxDrawdown);
    const maxDrawdown = maxDrawdowns.length > 0 ? Math.max(...maxDrawdowns) : 0;

    const grossProfit = returns.filter((r) => r > 0).reduce((a, r) => a + r, 0);
    const grossLoss = Math.abs(returns.filter((r) => r <= 0).reduce((a, r) => a + r, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const benchmarks = outcomes.filter((o) => o.benchmark?.isValid);
    const benchmarkAlpha = benchmarks.length > 0
      ? benchmarks.reduce((sum, o) => sum + (o.benchmark?.alpha ?? 0), 0) / benchmarks.length
      : 0;
    const benchmarkBeta = benchmarks.length > 0
      ? benchmarks.reduce((sum, o) => sum + (o.benchmark?.beta ?? 0), 0) / benchmarks.length
      : 0;

    const perSymbolSummary = outcomes.map((o) => ({
      symbol: o.symbol,
      barsCount: o.barsCount,
      qualityScore: o.validation.qualityScore,
      totalTrades: o.backtest.performance.totalTrades,
      winRate: o.backtest.performance.winRate,
      totalReturn: o.backtest.performance.totalReturn,
      cagr: o.backtest.performance.cagr,
      maxDrawdown: o.backtest.risk.maxDrawdown,
      sharpeRatio: o.backtest.risk.sharpeRatio,
      profitFactor: o.backtest.performance.profitFactor,
      benchmarkAlpha: o.benchmark?.alpha ?? null,
      benchmarkBeta: o.benchmark?.beta ?? null,
      durationMs: o.durationMs,
    }));

    return {
      startedAt: new Date(Date.now() - durationMs).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs,
      symbolsProcessed: outcomes.length + failedSymbols.length,
      symbolsSucceeded: outcomes.length,
      symbolsFailed: failedSymbols.length,
      failedSymbols,
      totalTrades,
      winRate,
      averageReturn,
      maxDrawdown,
      profitFactor,
      benchmarkAlpha,
      benchmarkBeta,
      validBacktests: validBacktests.length,
      perSymbol: perSymbolSummary,
      timestamp: new Date().toISOString(),
    };
  }
}
