import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BacktestService } from './backtest.service';
import { CoreBacktestEngine } from './backtest.engine';
import { MarketDataService } from '../market-data/market-data.service';
import { BenchmarkEngine } from '../benchmark/benchmark.engine';
import { WeightOptimizer } from '../weight-optimizer/weight-optimizer.engine';
import { LearningEngine } from './learning/learning-engine';
import { LearningRegistry } from './learning/learning-registry';
import { BacktestRegistry } from './registry/backtest-registry';
import { PortfolioIntegration } from './integration/portfolio-integration';
import { TomorrowLearningLink } from './integration/tomorrow-learning-link';
import { EliteScoreWeightAdapter } from './integration/elite-score-weight.adapter';
import {
  stubResult,
  stubStrategy,
  stubLearningReport,
  stubMarketDataPoints,
  stubBenchmarkResult,
  stubFeedback,
  stubEliteDelta,
} from './backtest-test-helpers';
import { BacktestRequestDto } from './dto/backtest-request.dto';

describe('BacktestService', () => {
  let service: BacktestService;
  const engine = { run: jest.fn() };
  const marketDataService = { fetchData: jest.fn() };
  const benchmarkEngine = { evaluate: jest.fn() };
  const weightOptimizer = {};
  const learningEngine = { learn: jest.fn() };
  const registry = {
    store: jest.fn(),
    get: jest.fn(),
    getBySymbol: jest.fn(),
    getAll: jest.fn(),
    rankings: jest.fn(),
    report: jest.fn(),
    clear: jest.fn(),
  };
  const learningRegistry = { store: jest.fn(), latest: jest.fn(), history: jest.fn(), all: jest.fn(), clear: jest.fn() };
  const portfolioIntegration = { buildSignals: jest.fn() };
  const tomorrowLink = { applyFeedback: jest.fn() };
  const eliteAdapter = { apply: jest.fn() };

  beforeEach(async () => {
    engine.run.mockReturnValue(stubResult());
    marketDataService.fetchData.mockResolvedValue(stubMarketDataPoints(30));
    benchmarkEngine.evaluate.mockReturnValue(stubBenchmarkResult());
    learningEngine.learn.mockReturnValue(stubLearningReport());
    portfolioIntegration.buildSignals.mockReturnValue([]);
    tomorrowLink.applyFeedback.mockReturnValue(stubFeedback());
    eliteAdapter.apply.mockReturnValue(stubEliteDelta());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BacktestService,
        { provide: CoreBacktestEngine, useValue: engine },
        { provide: MarketDataService, useValue: marketDataService },
        { provide: BenchmarkEngine, useValue: benchmarkEngine },
        { provide: WeightOptimizer, useValue: weightOptimizer },
        { provide: LearningEngine, useValue: learningEngine },
        { provide: BacktestRegistry, useValue: registry },
        { provide: LearningRegistry, useValue: learningRegistry },
        { provide: PortfolioIntegration, useValue: portfolioIntegration },
        { provide: TomorrowLearningLink, useValue: tomorrowLink },
        { provide: EliteScoreWeightAdapter, useValue: eliteAdapter },
      ],
    }).compile();

    service = module.get(BacktestService);
    jest.clearAllMocks();
    // re-apply defaults after clearAllMocks
    engine.run.mockReturnValue(stubResult());
    marketDataService.fetchData.mockResolvedValue(stubMarketDataPoints(30));
    benchmarkEngine.evaluate.mockReturnValue(stubBenchmarkResult());
    learningEngine.learn.mockReturnValue(stubLearningReport());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runBacktest', () => {
    it('fetches data, runs engine, benchmarks, learns and stores the result', async () => {
      const dto: BacktestRequestDto = { symbol: 'thyao.is' };
      const result = await service.runBacktest(dto);

      expect(marketDataService.fetchData).toHaveBeenCalledWith('THYAO.IS', '1d', expect.any(Object));
      expect(engine.run).toHaveBeenCalledTimes(1);
      const runArg = engine.run.mock.calls[0][0];
      expect(Array.isArray(runArg)).toBe(true);
      expect(runArg.length).toBe(30);
      expect(engine.run.mock.calls[0][2]).toMatchObject({ symbol: 'THYAO.IS', timeframe: '1d', backtestType: 'indicator' });

      expect(benchmarkEngine.evaluate).toHaveBeenCalledTimes(1);
      expect(learningEngine.learn).toHaveBeenCalledTimes(1);
      expect(learningEngine.learn).toHaveBeenCalledWith(expect.objectContaining({ symbol: 'THYAO.IS', benchmark: expect.anything() }));
      expect(registry.store).toHaveBeenCalledTimes(1);
      expect(learningRegistry.store).toHaveBeenCalledWith('THYAO.IS', '1d', 'indicator', expect.any(Object));

      expect(result.id).toBe('THYAO.IS:1d:indicator');
      expect(result.symbol).toBe('THYAO.IS');
      expect(result.timeframe).toBe('1d');
      expect(result.result).toBeDefined();
      expect(result.learning).toBeDefined();
      expect(result.benchmark).not.toBeNull();
      expect(result.benchmark!.isValid).toBe(true);
    });

    it('throws BadRequestException for empty symbol', async () => {
      await expect(service.runBacktest({ symbol: '' } as BacktestRequestDto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when no data fetched', async () => {
      marketDataService.fetchData.mockResolvedValue([]);
      await expect(service.runBacktest({ symbol: 'NONE.IS' } as BacktestRequestDto)).rejects.toThrow(NotFoundException);
    });

    it('maps MarketDataPoint to OHLCV and honors strategy overrides', async () => {
      await service.runBacktest({
        symbol: 'THYAO.IS',
        timeframe: '1w',
        backtestType: 'strategy',
        timeRange: '3M',
        initialCapital: 250000,
      } as BacktestRequestDto);

      expect(engine.run.mock.calls[0][1]).toBe('1w');
      expect(engine.run.mock.calls[0][2]).toMatchObject({ timeframe: '1w', backtestType: 'strategy', timeRange: '3M', initialCapital: 250000 });
    });
  });

  describe('getReport', () => {
    it('returns the stored report', () => {
      const stub = { id: 'THYAO.IS:1d:indicator', symbol: 'THYAO.IS' };
      registry.report.mockReturnValue(stub);
      expect(service.getReport('THYAO.IS')).toBe(stub);
      expect(registry.report).toHaveBeenCalledWith('THYAO.IS', '1d', 'indicator');
    });

    it('throws NotFoundException when not stored', () => {
      registry.report.mockReturnValue(null);
      expect(() => service.getReport('NONE.IS')).toThrow(NotFoundException);
    });
  });

  describe('getLearning', () => {
    it('returns the latest learning report', () => {
      learningRegistry.latest.mockReturnValue({ report: stubLearningReport() });
      expect(service.getLearning('THYAO.IS').symbol).toBe('THYAO.IS');
      expect(learningRegistry.latest).toHaveBeenCalledWith('THYAO.IS', '1d', 'indicator');
    });

    it('throws NotFoundException when none', () => {
      learningRegistry.latest.mockReturnValue(null);
      expect(() => service.getLearning('NONE.IS')).toThrow(NotFoundException);
    });
  });

  describe('getStrategyRankings', () => {
    it('delegates to registry', () => {
      const ranks = [{ symbol: 'THYAO.IS', rank: 1, score: 0.9 }];
      registry.rankings.mockReturnValue(ranks);
      expect(service.getStrategyRankings()).toBe(ranks);
    });
  });

  describe('getPortfolioSignals', () => {
    it('reuses the stored backtest result (no re-run)', () => {
      registry.getBySymbol.mockReturnValue({ result: stubResult(), strategy: stubStrategy() });
      const out = service.getPortfolioSignals('THYAO.IS');
      expect(portfolioIntegration.buildSignals).toHaveBeenCalledTimes(1);
      expect(out).toEqual([]);
    });

    it('throws NotFoundException when result missing', () => {
      registry.getBySymbol.mockReturnValue(null);
      expect(() => service.getPortfolioSignals('NONE.IS')).toThrow(NotFoundException);
    });
  });

  describe('applyTomorrowFeedback', () => {
    it('links predicted vs actual and updates confidence', () => {
      registry.getBySymbol.mockReturnValue({ result: stubResult() });
      const out = service.applyTomorrowFeedback('THYAO.IS', 5, 7);
      expect(tomorrowLink.applyFeedback).toHaveBeenCalledWith({ symbol: 'THYAO.IS', predictedScore: 5, actualReturn: 7, result: stubResult() });
      expect(out).toMatchObject({ symbol: 'THYAO.IS', delta: 2 });
    });
  });

  describe('getEliteScoreWeightDelta', () => {
    it('computes weights from the stored result', () => {
      registry.getBySymbol.mockReturnValue({ result: stubResult() });
      service.getEliteScoreWeightDelta('THYAO.IS');
      expect(eliteAdapter.apply).toHaveBeenCalledWith('THYAO.IS', stubResult());
    });

    it('throws NotFoundException when result missing', () => {
      registry.getBySymbol.mockReturnValue(null);
      expect(() => service.getEliteScoreWeightDelta('NONE.IS')).toThrow(NotFoundException);
    });
  });
});
