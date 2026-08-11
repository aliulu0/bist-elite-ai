import { Test, TestingModule } from '@nestjs/testing';
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';
import { CoreBacktestEngine } from './backtest.engine';
import { LearningEngine } from './learning/learning-engine';
import { BacktestRegistry } from './registry/backtest-registry';
import { LearningRegistry } from './learning/learning-registry';
import { PortfolioIntegration } from './integration/portfolio-integration';
import { TomorrowLearningLink } from './integration/tomorrow-learning-link';
import { EliteScoreWeightAdapter } from './integration/elite-score-weight.adapter';
import { IndicatorsModule } from '../indicators/indicators.module';
import { BenchmarkModule } from '../benchmark/benchmark.module';
import { WeightOptimizerModule } from '../weight-optimizer/weight-optimizer.module';
import { MarketDataService } from '../market-data/market-data.service';
import { stubMarketDataPoints } from './backtest-test-helpers';
import { BacktestRequestDto } from './dto/backtest-request.dto';
import { NotFoundException } from '@nestjs/common';

describe('Backtest integration (BacktestService + Controller + Registry)', () => {
  let module: TestingModule;
  let service: BacktestService;
  let controller: BacktestController;
  let registry: BacktestRegistry;
  let learningRegistry: LearningRegistry;
  const mockMarketDataService = {
    fetchData: jest.fn().mockResolvedValue(stubMarketDataPoints(60)),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [IndicatorsModule, BenchmarkModule, WeightOptimizerModule],
      controllers: [BacktestController],
      providers: [
        CoreBacktestEngine,
        BacktestService,
        LearningEngine,
        BacktestRegistry,
        LearningRegistry,
        PortfolioIntegration,
        TomorrowLearningLink,
        EliteScoreWeightAdapter,
        { provide: MarketDataService, useValue: mockMarketDataService },
      ],
    }).compile();

    service = module.get(BacktestService);
    controller = module.get(BacktestController);
    registry = module.get(BacktestRegistry);
    learningRegistry = module.get(LearningRegistry);
    jest.clearAllMocks();
    mockMarketDataService.fetchData.mockResolvedValue(stubMarketDataPoints(60));
  });

  afterEach(async () => {
    if (module) await module.close();
  });

  it('runs a backtest end-to-end and stores results + learning', async () => {
    const dto: BacktestRequestDto = { symbol: 'THYAO.IS' };
    const response = await service.runBacktest(dto);

    expect(response.id).toBe('THYAO.IS:1d:indicator');
    expect(response.symbol).toBe('THYAO.IS');
    expect(response.result).toBeDefined();
    expect(response.result.performance).toBeDefined();
    expect(response.learning).toBeDefined();
    expect(typeof response.learning.confidence).toBe('number');

    const stored = registry.getBySymbol('THYAO.IS');
    expect(stored).not.toBeNull();
    expect(stored!.result.benchmarkComparison.isValid).toBeDefined();

    const learning = learningRegistry.latest('THYAO.IS');
    expect(learning).not.toBeNull();
    expect(typeof learning!.report.confidence).toBe('number');

    const rankings = registry.rankings();
    expect(rankings.length).toBe(1);
  });

  it('controller GET /backtest/run delegates to service', async () => {
    const dto: BacktestRequestDto = { symbol: 'THYAO.IS' };
    const response = await controller.runBacktestGet(dto);
    expect(response.id).toBe('THYAO.IS:1d:indicator');
  });

  it('controller POST /backtest/run delegates to service', async () => {
    const dto: BacktestRequestDto = { symbol: 'THYAO.IS' };
    const response = await controller.runBacktestPost(dto);
    expect(response.id).toBe('THYAO.IS:1d:indicator');
  });

  it('report/learning/portfolio/elite/tomorrow endpoints are served from the registry', async () => {
    await service.runBacktest({ symbol: 'THYAO.IS' });

    const report = service.getReport('THYAO.IS');
    expect(report.id).toBe('THYAO.IS:1d:indicator');

    const learning = service.getLearning('THYAO.IS');
    expect(learning.symbol).toBe('THYAO.IS');

    const signals = service.getPortfolioSignals('THYAO.IS');
    expect(Array.isArray(signals)).toBe(true);
    expect(signals[0].symbol).toBe('THYAO.IS');

    const delta = service.getEliteScoreWeightDelta('THYAO.IS');
    expect(delta.symbol).toBe('THYAO.IS');
    expect(delta.weightDelta).toBeDefined();

    const feedback = service.applyTomorrowFeedback('THYAO.IS', 5, 7);
    expect(feedback.symbol).toBe('THYAO.IS');
    expect(feedback.delta).toBe(2);
  });

  it('returns 404 path for unknown symbol report', () => {
    expect(() => service.getReport('NOPE.IS')).toThrow(NotFoundException);
  });
});
