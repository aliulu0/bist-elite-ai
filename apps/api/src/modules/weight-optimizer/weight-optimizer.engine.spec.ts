import { WeightOptimizer, WeightOptimizerInput } from './weight-optimizer.engine';
import { WeightOptimizationResult } from './weight-optimizer.types';
import { DEFAULT_WEIGHT_OPTIMIZER_CONFIG, PROFILE_CONFIGS } from './weight-optimizer.config';
import { RuleAnalyticsResult, RuleStat } from '../rule-analytics/rule-analytics.types';
import { BenchmarkResult } from '../benchmark/benchmark.types';
import { BacktestResult } from '../backtest/backtest.types';

function makeRuleStats(count: number, baseWinRate = 55): RuleStat[] {
  return Array.from({ length: count }, (_, i) => ({
    rule: `rule_${i}`,
    totalTrades: 20 + i * 5,
    winningTrades: Math.floor((20 + i * 5) * (baseWinRate + i * 2) / 100),
    losingTrades: Math.ceil((20 + i * 5) * (100 - baseWinRate - i * 2) / 100),
    winRate: baseWinRate + i * 2,
    avgReturn: 2 + i * 0.5,
    medianReturn: 1.5 + i * 0.3,
    totalReturn: 10 + i * 5,
    bestTrade: 15 + i,
    worstTrade: -5 - i,
    sharpe: 1 + i * 0.2,
  }));
}

function makeAnalytics(ruleCount = 5): RuleAnalyticsResult {
  return {
    ruleStatistics: makeRuleStats(ruleCount),
    pairStatistics: [],
    tripleStatistics: [],
    timeframeStatistics: [],
    sectorStatistics: [],
    eliteStatistics: [],
    opportunityStatistics: [],
    metadata: {},
  };
}

function makeBenchmark(overrides?: Partial<BenchmarkResult>): BenchmarkResult {
  return {
    strategyReturn: 15,
    benchmarkReturn: 10,
    sectorReturn: 8,
    alpha: 5,
    beta: 0.8,
    trackingError: 3,
    informationRatio: 1.67,
    captureRatio: 1.5,
    excessReturn: 5,
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function makeBacktest(overrides?: Partial<BacktestResult>): BacktestResult {
  return {
    performance: {
      totalTrades: 50,
      winningTrades: 30,
      losingTrades: 20,
      winRate: 60,
      lossRate: 40,
      averageReturn: 2.5,
      medianReturn: 2.0,
      averageWin: 2.0,
      averageLoss: 4.0,
      bestTrade: 15,
      worstTrade: -5,
      cagr: 25,
      annualReturn: 25,
      profitFactor: 1.8,
      totalReturn: 50,
      expectancy: 2.8,
      exposure: 50,
      recoveryFactor: 5,
      riskReward: 0.5,
    },
    risk: {
      sharpeRatio: 1.5,
      sortinoRatio: 2.0,
      maxDrawdown: 10,
      maxDrawdownDuration: 15,
      volatility: 12,
      downsideDeviation: 8,
      calmarRatio: 2.5,
    },
    equityCurve: [100000, 110000, 120000],
    equityCurvePoints: [{ timestamp: '2024-01-01', value: 100000 }],
    drawdownCurve: [],
    trades: [],
    monthlyReturns: [{ period: '2024-01', return: 5 }],
    yearlyReturns: [{ period: '2024', return: 50 }],
    benchmarkComparison: {
      strategyReturn: 15,
      benchmarkReturn: 10,
      excessReturn: 5,
      alpha: 5,
      beta: 0.8,
      informationRatio: 1.67,
      trackingError: 3,
      captureRatio: 1.5,
      isValid: true,
    },
    aiExplanation: {
      summary: 'test',
      successFactors: [],
      failureFactors: [],
      weakPeriods: [],
      strongPeriods: [],
      riskAnalysis: [],
      improvementSuggestions: [],
    },
    ruleContribution: { entryRule: 'ALWAYS', exitRule: 'HOLD_UNTIL_END', trades: 50, winRate: 60, avgReturn: 2.5 },
    metadata: {
      totalBars: 252,
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
      initialCapital: 100000,
      timeframe: '1d',
      symbol: 'TEST',
      backtestType: 'indicator',
      timeRange: '1Y',
      entryRule: 'ALWAYS',
      exitRule: 'HOLD_UNTIL_END',
    },
    isValid: true,
    ...overrides,
  };
}

function makeInput(overrides?: Partial<WeightOptimizerInput>): WeightOptimizerInput {
  return {
    ruleAnalytics: makeAnalytics(),
    benchmark: makeBenchmark(),
    backtest: makeBacktest(),
    currentWeights: { rule_0: 20, rule_1: 20, rule_2: 20, rule_3: 20, rule_4: 20 },
    ...overrides,
  };
}

describe('WeightOptimizer', () => {
  let optimizer: WeightOptimizer;

  beforeEach(() => {
    optimizer = new WeightOptimizer();
  });

  it('should be defined', () => {
    expect(optimizer).toBeDefined();
  });

  describe('empty and invalid data', () => {
    it('should return empty for no current weights', () => {
      const result = optimizer.optimize(makeInput({ currentWeights: {} }));
      expect(result.recommendedWeights).toEqual({});
      expect(result.confidence).toBe(0);
    });

    it('should return empty for null current weights', () => {
      const result = optimizer.optimize(makeInput({ currentWeights: null as any }));
      expect(result.recommendedWeights).toEqual({});
    });

    it('should return empty for no rule analytics', () => {
      const result = optimizer.optimize(makeInput({ ruleAnalytics: makeAnalytics(0) }));
      expect(result.recommendedWeights).toEqual({});
    });

    it('should return empty for invalid backtest', () => {
      const result = optimizer.optimize(makeInput({ backtest: makeBacktest({ isValid: false }) }));
      expect(result.recommendedWeights).toEqual({});
    });
  });

  describe('weight recommendation', () => {
    it('should produce recommended weights for all rules', () => {
      const result = optimizer.optimize(makeInput());
      expect(Object.keys(result.recommendedWeights).length).toBe(5);
    });

    it('should have weights between min and max', () => {
      const result = optimizer.optimize(makeInput());
      for (const weight of Object.values(result.recommendedWeights)) {
        expect(weight).toBeGreaterThanOrEqual(DEFAULT_WEIGHT_OPTIMIZER_CONFIG.minWeight);
        expect(weight).toBeLessThanOrEqual(DEFAULT_WEIGHT_OPTIMIZER_CONFIG.maxWeight);
      }
    });

    it('should normalize weights to sum approximately to 100', () => {
      const result = optimizer.optimize(makeInput());
      const total = Object.values(result.recommendedWeights).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(100, 0);
    });
  });

  describe('improvement estimation', () => {
    it('should estimate improvement', () => {
      const result = optimizer.optimize(makeInput());
      expect(typeof result.expectedImprovement).toBe('number');
    });

    it('should have positive improvement when rules have good performance', () => {
      const result = optimizer.optimize(makeInput());
      expect(result.expectedImprovement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('confidence', () => {
    it('should calculate confidence', () => {
      const result = optimizer.optimize(makeInput());
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should be higher with more data', () => {
      const resultMany = optimizer.optimize(makeInput({
        ruleAnalytics: makeAnalytics(10),
        backtest: makeBacktest({ performance: { ...makeBacktest().performance, totalTrades: 50 } }),
      }));
      const resultFew = optimizer.optimize(makeInput({
        ruleAnalytics: makeAnalytics(2),
        backtest: makeBacktest({ performance: { ...makeBacktest().performance, totalTrades: 5 } }),
      }));
      expect(resultMany.confidence).toBeGreaterThanOrEqual(resultFew.confidence);
    });
  });

  describe('simulation', () => {
    it('should include simulation data', () => {
      const result = optimizer.optimize(makeInput());
      expect(result.simulation.currentScore).toBeGreaterThanOrEqual(0);
      expect(result.simulation.optimizedScore).toBeGreaterThanOrEqual(0);
      expect(result.simulation.tradesAnalyzed).toBe(50);
    });

    it('should show improvement when optimization helps', () => {
      const result = optimizer.optimize(makeInput());
      expect(typeof result.simulation.improvementPercent).toBe('number');
    });
  });

  describe('config profiles', () => {
    it('should use conservative profile', () => {
      const opt = new WeightOptimizer({ profile: 'conservative' });
      const result = opt.optimize(makeInput());
      expect(Object.keys(result.recommendedWeights).length).toBe(5);
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.profile).toBe('conservative');
    });

    it('should use aggressive profile', () => {
      const opt = new WeightOptimizer({ profile: 'aggressive' });
      const result = opt.optimize(makeInput());
      expect(Object.keys(result.recommendedWeights).length).toBe(5);
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.profile).toBe('aggressive');
    });

    it('should use balanced profile by default', () => {
      const result = optimizer.optimize(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.profile).toBe('balanced');
    });
  });

  describe('metadata', () => {
    it('should include rules analyzed count', () => {
      const result = optimizer.optimize(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.rulesAnalyzed).toBe(5);
    });

    it('should include benchmark alpha', () => {
      const result = optimizer.optimize(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.benchmarkAlpha).toBe(5);
    });

    it('should include total trades', () => {
      const result = optimizer.optimize(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.totalTrades).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should handle single rule', () => {
      const result = optimizer.optimize(makeInput({
        ruleAnalytics: makeAnalytics(1),
        currentWeights: { rule_0: 100 },
      }));
      expect(Object.keys(result.recommendedWeights).length).toBe(1);
    });

    it('should handle rules not in analytics', () => {
      const result = optimizer.optimize(makeInput({
        currentWeights: { rule_0: 25, rule_1: 25, unknown_rule: 50 },
      }));
      expect(result.recommendedWeights.unknown_rule).toBeDefined();
    });

    it('should produce deterministic results', () => {
      const input = makeInput();
      const r1 = optimizer.optimize(input);
      const r2 = optimizer.optimize(input);
      expect(r1.expectedImprovement).toBe(r2.expectedImprovement);
      expect(r1.confidence).toBe(r2.confidence);
    });

    it('should handle negative alpha benchmark', () => {
      const result = optimizer.optimize(makeInput({
        benchmark: makeBenchmark({ alpha: -3 }),
      }));
      expect(Object.keys(result.recommendedWeights).length).toBe(5);
    });

    it('should handle low win rate backtest', () => {
      const result = optimizer.optimize(makeInput({
        backtest: makeBacktest({ performance: { ...makeBacktest().performance, winRate: 35 } }),
      }));
      expect(Object.keys(result.recommendedWeights).length).toBe(5);
    });
  });
});
