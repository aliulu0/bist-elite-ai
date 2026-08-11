import { BadRequestException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { CoreBacktestEngine } from './backtest.engine';
import { BenchmarkEngine, BenchmarkInput } from '../benchmark/benchmark.engine';
import { BenchmarkResult } from '../benchmark/benchmark.types';
import { MarketDataService } from '../market-data/market-data.service';
import { WeightOptimizer } from '../weight-optimizer/weight-optimizer.engine';
import { BacktestRegistry } from './registry/backtest-registry';
import { LearningEngine } from './learning/learning-engine';
import { LearningRegistry } from './learning/learning-registry';
import { PortfolioIntegration } from './integration/portfolio-integration';
import { TomorrowLearningLink } from './integration/tomorrow-learning-link';
import { EliteScoreWeightAdapter } from './integration/elite-score-weight.adapter';
import { buildStrategy } from './backtest.config';
import {
  BacktestResult,
  BacktestStrategy,
  BenchmarkComparison,
  Timeframe,
  BacktestType,
  TimeRange,
} from './backtest.types';
import { OHLCV } from '../indicators/indicator.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { HistoricalMarketDataService } from '../market-data/historical/historical-market-data.service';
import {
  BacktestRequestDto,
  BacktestResponseDto,
  LearningSummaryDto,
} from './dto';
import {
  StrategyRankingDto,
  PortfolioSignalDto,
  TomorrowFeedbackResultDto,
  EliteScoreWeightDeltaDto,
  BacktestReportDto,
} from './dto/strategy-ranking.dto';
import { LearningReportDto } from './dto/learning-report.dto';

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(
    private readonly engine: CoreBacktestEngine,
    private readonly marketDataService: MarketDataService,
    private readonly benchmarkEngine: BenchmarkEngine,
    private readonly weightOptimizer: WeightOptimizer,
    private readonly learningEngine: LearningEngine,
    private readonly registry: BacktestRegistry,
    private readonly learningRegistry: LearningRegistry,
    private readonly portfolioIntegration: PortfolioIntegration,
    private readonly tomorrowLink: TomorrowLearningLink,
    private readonly eliteAdapter: EliteScoreWeightAdapter,
    @Optional() private readonly historical?: HistoricalMarketDataService,
  ) {}

  async runBacktest(dto: BacktestRequestDto): Promise<BacktestResponseDto> {
    const symbol = (dto.symbol ?? '').toUpperCase();
    if (!symbol) throw new BadRequestException('symbol gerekli');
    const timeframe = (dto.timeframe ?? '1d') as Timeframe;
    const backtestType = (dto.backtestType ?? 'indicator') as BacktestType;
    const timeRange = (dto.timeRange ?? '1Y') as TimeRange;

    // R2-044: prefer validated historical data when available (Historical ->
    // Incremental -> Orchestrator -> Provider). Falls back to the existing
    // market-data path unchanged when no validated series exists.
    const validatedHistory = this.historical
      ? await this.historical.getValidatedHistory(symbol, timeframe, {
          startDate: dto.startDate,
          endDate: dto.endDate,
        })
      : null;
    const raw =
      validatedHistory ??
      (await this.marketDataService.fetchData(symbol, timeframe, {
        startDate: dto.startDate,
        endDate: dto.endDate,
        limit: dto.limit,
      }));
    if (!raw || raw.length < 2) {
      throw new NotFoundException(`${symbol} için yeterli geçmiş veri yok (${raw?.length ?? 0} bar)`);
    }

    const ohlcv = this.toOhlcv(raw);
    const strategy = buildStrategy(backtestType, {
      timeframe,
      timeRange,
      symbol,
      benchmarkTicker: dto.benchmarkTicker,
      initialCapital: dto.initialCapital,
    });

    const result = this.engine.run(ohlcv, timeframe, strategy);
    const benchmark = await this.computeBenchmark(result, ohlcv, strategy.benchmarkTicker ?? 'XU030.IS');
    const benchmarkComparison: BenchmarkComparison = {
      strategyReturn: benchmark.strategyReturn,
      benchmarkReturn: benchmark.benchmarkReturn,
      excessReturn: benchmark.excessReturn,
      alpha: benchmark.alpha,
      beta: benchmark.beta,
      informationRatio: benchmark.informationRatio,
      trackingError: benchmark.trackingError,
      captureRatio: benchmark.captureRatio,
      isValid: benchmark.isValid,
    };
    const enriched: BacktestResult = { ...result, benchmarkComparison: benchmarkComparison };

    const learning = this.learningEngine.learn({ symbol, timeframe, strategy, result: enriched, benchmark });
    const ranking = this.buildRanking(symbol, backtestType, enriched, learning);
    const response = this.toResponse(symbol, timeframe, backtestType, timeRange, enriched, learning);
    const id = `${symbol}:${timeframe}:${backtestType}`;

    this.registry.store({
      id,
      symbol,
      timeframe,
      backtestType,
      strategy,
      result: enriched,
      benchmark,
      ranking,
      response,
      createdAt: new Date().toISOString(),
    });
    this.learningRegistry.store(symbol, timeframe, backtestType, learning);

    return response;
  }

  getReport(symbol: string, timeframe = '1d', backtestType = 'indicator'): BacktestReportDto {
    const report = this.registry.report(symbol, timeframe, backtestType);
    if (!report) throw new NotFoundException(`${symbol} için kayıtlı backtest bulunamadı`);
    return report;
  }

  getLearning(symbol: string, timeframe = '1d', backtestType = 'indicator'): LearningReportDto {
    const record = this.learningRegistry.latest(symbol, timeframe, backtestType);
    if (!record) throw new NotFoundException(`${symbol} için öğrenme raporu bulunamadı`);
    return record.report;
  }

  getStrategyRankings(): StrategyRankingDto[] {
    return this.registry.rankings();
  }

  getPortfolioSignals(
    symbol: string,
    timeframe = '1d',
    backtestType = 'indicator',
  ): PortfolioSignalDto[] {
    const entry = this.registry.getBySymbol(symbol, timeframe, backtestType);
    if (!entry) throw new NotFoundException(`${symbol} için backtest sonucu bulunamadı`);
    return this.portfolioIntegration.buildSignals({
      symbol,
      timeframe,
      result: entry.result,
      positionSizePercent: entry.strategy.positionSizePercent,
    });
  }

  applyTomorrowFeedback(
    symbol: string,
    predictedScore: number,
    actualReturn: number,
    timeframe = '1d',
    backtestType = 'indicator',
  ): TomorrowFeedbackResultDto {
    const entry = this.registry.getBySymbol(symbol, timeframe, backtestType);
    return this.tomorrowLink.applyFeedback({
      symbol,
      predictedScore,
      actualReturn,
      result: entry?.result,
    });
  }

  getEliteScoreWeightDelta(
    symbol: string,
    timeframe = '1d',
    backtestType = 'indicator',
  ): EliteScoreWeightDeltaDto {
    const entry = this.registry.getBySymbol(symbol, timeframe, backtestType);
    if (!entry) throw new NotFoundException(`${symbol} için backtest sonucu bulunamadı`);
    return this.eliteAdapter.apply(symbol, entry.result);
  }

  private toOhlcv(points: MarketDataPoint[]): OHLCV[] {
    return points.map((p) => ({
      timestamp: p.timestamp,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
  }

  private async computeBenchmark(result: BacktestResult, ohlcv: OHLCV[], ticker: string): Promise<BenchmarkResult> {
    const empty = (isValid: boolean): BenchmarkResult => ({
      strategyReturn: 0,
      benchmarkReturn: 0,
      sectorReturn: 0,
      alpha: 0,
      beta: 0,
      trackingError: 0,
      informationRatio: 0,
      captureRatio: 0,
      excessReturn: 0,
      metadata: {},
      isValid,
    });
    try {
      const benchmarkData = await this.marketDataService.fetchData(ticker, '1d', {
        startDate: ohlcv[0]?.timestamp,
        endDate: ohlcv[ohlcv.length - 1]?.timestamp,
      });
      if (!benchmarkData || benchmarkData.length < 2) return empty(false);
      const base = benchmarkData[0].close;
      const benchmarkReturns = benchmarkData
        .slice(1)
        .map((p) => ((p.close - base) / base) * 100);
      const strategyReturns = result.trades.map((t) => t.returnPercent);
      const input: BenchmarkInput = {
        strategyReturns,
        benchmarkReturns,
        sectorReturns: [],
      };
      return this.benchmarkEngine.evaluate(input);
    } catch (err) {
      this.logger.warn(`Benchmark hesaplama hatası (${ticker}): ${err instanceof Error ? err.message : String(err)}`);
      return empty(false);
    }
  }

  private buildRanking(symbol: string, backtestType: string, result: BacktestResult, learning: LearningReportDto): StrategyRankingDto {
    const p = result.performance;
    const r = result.risk;
    const cagrScore = Math.max(0, Math.min(1, Math.abs(p.cagr) / 50));
    const sharpeScore = Math.max(0, Math.min(1, (Number.isFinite(r.sharpeRatio) ? r.sharpeRatio : 0) / 2));
    const winScore = p.winRate / 100;
    const ddScore = 1 - Math.max(0, Math.min(1, r.maxDrawdown / 30));
    const score = Math.round(((cagrScore + sharpeScore + winScore + ddScore) / 4) * 1000) / 1000;
    return {
      symbol,
      backtestType,
      rank: 0,
      totalReturn: p.totalReturn,
      score,
      cagr: p.cagr,
      sharpeRatio: r.sharpeRatio,
      maxDrawdown: r.maxDrawdown,
      winRate: p.winRate,
      profitFactor: Number.isFinite(p.profitFactor) ? p.profitFactor : 0,
      totalTrades: p.totalTrades,
      confidence: learning.confidence,
      lastUpdated: learning.updatedAt,
    };
  }

  private toResponse(
    symbol: string,
    timeframe: string,
    backtestType: string,
    timeRange: string,
    result: BacktestResult,
    learning: LearningReportDto,
  ): BacktestResponseDto {
    const summary: LearningSummaryDto = {
      confidence: learning.confidence,
      expectedImprovement: learning.expectedImprovement,
      winRate: learning.performance.winRate,
      totalReturn: learning.performance.totalReturn,
    };
    const benchmark = result.benchmarkComparison;
    return {
      id: `${symbol}:${timeframe}:${backtestType}`,
      symbol,
      timeframe: timeframe as Timeframe,
      backtestType: backtestType as BacktestType,
      timeRange: timeRange as TimeRange,
      initialCapital: result.metadata.initialCapital,
      result,
      learning: summary,
      benchmark: benchmark.isValid
        ? {
            strategyReturn: benchmark.strategyReturn,
            benchmarkReturn: benchmark.benchmarkReturn,
            alpha: benchmark.alpha,
            beta: benchmark.beta,
            informationRatio: benchmark.informationRatio,
            isValid: benchmark.isValid,
          }
        : null,
      createdAt: new Date().toISOString(),
    };
  }
}
