import { Injectable, Optional } from '@nestjs/common';
import { RuleAnalyticsResult, RuleStat } from '../rule-analytics/rule-analytics.types';
import { BenchmarkResult } from '../benchmark/benchmark.types';
import { BacktestResult } from '../backtest/backtest.types';
import { WeightOptimizationResult, SimulationResult } from './weight-optimizer.types';
import {
  WeightOptimizerConfig,
  DEFAULT_WEIGHT_OPTIMIZER_CONFIG,
  PROFILE_CONFIGS,
  OptimizationProfile,
} from './weight-optimizer.config';

export interface WeightOptimizerInput {
  ruleAnalytics: RuleAnalyticsResult;
  benchmark: BenchmarkResult;
  backtest: BacktestResult;
  currentWeights: Record<string, number>;
}

@Injectable()
export class WeightOptimizer {
  private readonly config: WeightOptimizerConfig;

  constructor(@Optional() config?: Partial<WeightOptimizerConfig>) {
    const profileConfig = config?.profile ? PROFILE_CONFIGS[config.profile] : {};
    this.config = { ...DEFAULT_WEIGHT_OPTIMIZER_CONFIG, ...profileConfig, ...config };
  }

  optimize(input: WeightOptimizerInput): WeightOptimizationResult {
    const { ruleAnalytics, benchmark, backtest, currentWeights } = input;

    if (!currentWeights || Object.keys(currentWeights).length === 0) {
      return this.emptyResult('No current weights provided');
    }

    if (!ruleAnalytics || ruleAnalytics.ruleStatistics.length === 0) {
      return this.emptyResult('No rule analytics data provided');
    }

    if (!backtest || !backtest.isValid) {
      return this.emptyResult('Invalid backtest result');
    }

    const ruleScores = this.scoreRules(ruleAnalytics, benchmark, backtest);
    const rawWeights = this.computeRawWeights(currentWeights, ruleScores);
    const recommendedWeights = this.normalizeWeights(rawWeights);
    const simulation = this.simulate(currentWeights, recommendedWeights, ruleAnalytics, backtest);
    const expectedImprovement = simulation.improvementPercent;
    const confidence = this.calculateConfidence(ruleAnalytics, benchmark, backtest);

    return {
      recommendedWeights,
      expectedImprovement,
      confidence,
      simulation,
      metadata: {
        profile: this.config.profile,
        rulesAnalyzed: ruleAnalytics.ruleStatistics.length,
        benchmarkAlpha: benchmark.alpha,
        strategyWinRate: backtest.performance.winRate,
        totalTrades: backtest.performance.totalTrades,
        adjustmentCapped: this.wereAnyCapped(rawWeights, recommendedWeights),
      },
    };
  }

  private scoreRules(
    analytics: RuleAnalyticsResult,
    benchmark: BenchmarkResult,
    backtest: BacktestResult,
  ): Map<string, number> {
    const scores = new Map<string, number>();
    const totalTrades = backtest.performance.totalTrades || 1;

    for (const rule of analytics.ruleStatistics) {
      if (rule.totalTrades < this.config.minTradesForOptimization) continue;

      const winRateScore = rule.winRate / 100;
      const returnScore = this.normalizeReturn(rule.avgReturn);
      const sharpeScore = this.normalizeSharpe(rule.sharpe);
      const volumeScore = Math.min(1, rule.totalTrades / totalTrades);
      const benchmarkAdjustment = benchmark.alpha > 0 ? 1.1 : 0.9;

      const composite =
        winRateScore * 0.3 +
        returnScore * 0.3 +
        sharpeScore * 0.2 +
        volumeScore * 0.2;

      scores.set(rule.rule, composite * benchmarkAdjustment);
    }

    return scores;
  }

  private normalizeReturn(avgReturn: number): number {
    if (avgReturn > 10) return 1;
    if (avgReturn < -10) return 0;
    return (avgReturn + 10) / 20;
  }

  private normalizeSharpe(sharpe: number): number {
    if (sharpe > 3) return 1;
    if (sharpe < -1) return 0;
    return (sharpe + 1) / 4;
  }

  private computeRawWeights(
    currentWeights: Record<string, number>,
    ruleScores: Map<string, number>,
  ): Record<string, number> {
    const raw: Record<string, number> = {};
    const lr = this.config.learningRate;
    const maxAdj = this.config.maxAdjustmentPercent / 100;

    for (const [rule, currentWeight] of Object.entries(currentWeights)) {
      const score = ruleScores.get(rule);
      if (score === undefined) {
        raw[rule] = currentWeight;
        continue;
      }

      const targetWeight = score * this.config.normalizationTarget;
      const adjustment = (targetWeight - currentWeight) * lr;
      const cappedAdjustment = Math.max(
        -currentWeight * maxAdj,
        Math.min(currentWeight * maxAdj, adjustment),
      );

      raw[rule] = currentWeight + cappedAdjustment;
    }

    return raw;
  }

  private normalizeWeights(raw: Record<string, number>): Record<string, number> {
    const clamped: Record<string, number> = {};
    for (const [rule, weight] of Object.entries(raw)) {
      clamped[rule] = Math.max(this.config.minWeight, Math.min(this.config.maxWeight, weight));
    }

    const total = Object.values(clamped).reduce((a, b) => a + b, 0);
    if (total === 0) return clamped;

    const factor = this.config.normalizationTarget / total;
    const normalized: Record<string, number> = {};
    for (const [rule, weight] of Object.entries(clamped)) {
      normalized[rule] = Math.round(weight * factor * 100) / 100;
    }

    return normalized;
  }

  private simulate(
    current: Record<string, number>,
    recommended: Record<string, number>,
    analytics: RuleAnalyticsResult,
    backtest: BacktestResult,
  ): SimulationResult {
    const currentScore = this.calculateWeightedScore(current, analytics.ruleStatistics);
    const optimizedScore = this.calculateWeightedScore(recommended, analytics.ruleStatistics);
    const improvementPercent = currentScore > 0
      ? ((optimizedScore - currentScore) / currentScore) * 100
      : 0;

    return {
      currentScore: Math.round(currentScore * 100) / 100,
      optimizedScore: Math.round(optimizedScore * 100) / 100,
      improvementPercent: Math.round(improvementPercent * 100) / 100,
      tradesAnalyzed: backtest.performance.totalTrades,
    };
  }

  private calculateWeightedScore(weights: Record<string, number>, rules: RuleStat[]): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const rule of rules) {
      const weight = weights[rule.rule] ?? 0;
      if (weight === 0) continue;
      weightedSum += weight * rule.winRate;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(
    analytics: RuleAnalyticsResult,
    benchmark: BenchmarkResult,
    backtest: BacktestResult,
  ): number {
    let confidence = 0.5;

    if (analytics.ruleStatistics.length >= 5) confidence += 0.15;
    else if (analytics.ruleStatistics.length >= 3) confidence += 0.1;

    if (backtest.performance.totalTrades >= 20) confidence += 0.15;
    else if (backtest.performance.totalTrades >= 10) confidence += 0.1;

    if (benchmark.isValid) confidence += 0.1;

    if (backtest.performance.winRate > 50) confidence += 0.1;

    return Math.min(1, confidence);
  }

  private wereAnyCapped(raw: Record<string, number>, normalized: Record<string, number>): boolean {
    for (const rule of Object.keys(raw)) {
      if (raw[rule] !== normalized[rule]) return true;
    }
    return false;
  }

  private emptyResult(reason: string): WeightOptimizationResult {
    return {
      recommendedWeights: {},
      expectedImprovement: 0,
      confidence: 0,
      simulation: { currentScore: 0, optimizedScore: 0, improvementPercent: 0, tradesAnalyzed: 0 },
      metadata: { reason },
    };
  }
}
