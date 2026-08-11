import { LearningEngine } from './learning-engine';
import { WeightOptimizer } from '../../weight-optimizer/weight-optimizer.engine';
import { WeightOptimizationResult } from '../../weight-optimizer/weight-optimizer.types';
import { stubResult, stubStrategy, stubBenchmarkResult } from '../backtest-test-helpers';

describe('LearningEngine', () => {
  let engine: LearningEngine;
  const weightOptimizer = { optimize: jest.fn() };

  const stubOpt: WeightOptimizationResult = {
    recommendedWeights: { 'ALWAYS/TAKE_PROFIT': 100 },
    expectedImprovement: 2.5,
    confidence: 0.8,
    simulation: { currentScore: 100, optimizedScore: 102.5, improvementPercent: 2.5, tradesAnalyzed: 1 },
    metadata: {},
  };

  beforeEach(() => {
    weightOptimizer.optimize.mockReturnValue(stubOpt);
    engine = new LearningEngine(weightOptimizer as unknown as WeightOptimizer);
    jest.clearAllMocks();
    weightOptimizer.optimize.mockReturnValue(stubOpt);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('produces a LearningReport from a backtest result (reuses WeightOptimizer)', () => {
    const result = stubResult({ trades: [stubTrade()] });
    const report = engine.learn({
      symbol: 'THYAO.IS',
      timeframe: '1d',
      strategy: stubStrategy(),
      result,
      benchmark: stubBenchmarkResult(),
    });

    expect(report.symbol).toBe('THYAO.IS');
    expect(report.backtestType).toBe('indicator');
    expect(report.performance.totalReturn).toBe(5);
    expect(report.performance.sharpeRatio).toBe(1.5);
    expect(report.performance.maxDrawdown).toBe(3);

    expect(report.ruleStats.length).toBe(1);
    expect(report.ruleStats[0].rule).toBe('ALWAYS/TAKE_PROFIT');
    expect(report.ruleStats[0].totalTrades).toBe(1);
    expect(report.ruleStats[0].winRate).toBe(100);
    expect(report.ruleStats[0].avgReturn).toBe(5);

    expect(report.confidence).toBe(0.8);
    expect(report.expectedImprovement).toBe(2.5);
    expect(report.weightRecommendations).toEqual({ 'ALWAYS/TAKE_PROFIT': 100 });
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(Array.isArray(report.learningFlowSteps)).toBe(true);
    expect(report.learningFlowSteps.length).toBeGreaterThan(0);
  });

  it('calls WeightOptimizer.optimize with rule analytics, benchmark and current weights', () => {
    const result = stubResult();
    const benchmark = stubBenchmarkResult();
    const strategy = stubStrategy();
    engine.learn({ symbol: 'THYAO.IS', timeframe: '1d', strategy, result, benchmark });

    expect(weightOptimizer.optimize).toHaveBeenCalledTimes(1);
    const optInput = weightOptimizer.optimize.mock.calls[0][0] as {
      ruleAnalytics: { ruleStatistics: unknown[] };
      benchmark: unknown;
      backtest: unknown;
      currentWeights: Record<string, number>;
    };
    void strategy;
    expect(optInput.ruleAnalytics.ruleStatistics.length).toBe(1);
    expect(optInput.benchmark).toBe(benchmark);
    expect(optInput.backtest).toBe(result);
    expect(typeof optInput.currentWeights).toBe('object');
  });

  it('derives equal starting weights across rule groups', () => {
    const result = stubResult();
    engine.learn({ symbol: 'THYAO.IS', timeframe: '1d', strategy: stubStrategy(), result, benchmark: stubBenchmarkResult() });
    const optInput = weightOptimizer.optimize.mock.calls[0][0] as {
      currentWeights: Record<string, number>;
    };
    const sum = Object.values(optInput.currentWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it('is deterministic: same input yields identical report', () => {
    const result = stubResult();
    const benchmark = stubBenchmarkResult();
    const strategy = stubStrategy();
    const a = engine.learn({ symbol: 'THYAO.IS', timeframe: '1d', strategy, result, benchmark });
    const b = engine.learn({ symbol: 'THYAO.IS', timeframe: '1d', strategy, result, benchmark });
    expect(b.learningFlowSteps).toEqual(a.learningFlowSteps);
    expect(b.ruleStats).toEqual(a.ruleStats);
    expect(b.weightRecommendations).toEqual(a.weightRecommendations);
  });
});

function stubTrade() {
  return {
    entryIndex: 0,
    entryTimestamp: '2024-01-01',
    entryPrice: 100,
    exitIndex: 5,
    exitTimestamp: '2024-01-06',
    exitPrice: 105,
    holdingDays: 5,
    returnPercent: 5,
    returnAbsolute: 5,
    exitReason: 'TAKE_PROFIT' as const,
  };
}
