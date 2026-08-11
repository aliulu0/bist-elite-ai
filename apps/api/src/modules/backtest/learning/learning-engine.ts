import { Injectable } from '@nestjs/common';
import { WeightOptimizer } from '../../weight-optimizer/weight-optimizer.engine';
import { WeightOptimizationResult } from '../../weight-optimizer/weight-optimizer.types';
import { RuleAnalyticsResult, RuleStat } from '../../rule-analytics/rule-analytics.types';
import { BenchmarkResult } from '../../benchmark/benchmark.types';
import { BacktestResult, BacktestStrategy, Trade, PerformanceMetrics, RiskMetrics } from '../backtest.types';
import { LearningReportDto, PerformanceSummaryDto } from '../dto/learning-report.dto';

export interface LearningEngineInput {
  symbol: string;
  timeframe: string;
  strategy: BacktestStrategy;
  result: BacktestResult;
  benchmark: BenchmarkResult;
  priorWeights?: Record<string, number>;
}

@Injectable()
export class LearningEngine {
  constructor(private readonly weightOptimizer: WeightOptimizer) {}
  learn(input: LearningEngineInput): LearningReportDto {
    const { symbol, timeframe, strategy, result, benchmark, priorWeights } = input;
    const ruleStats = this.buildRuleStats(result.trades, strategy);
    const analytics = this.toRuleAnalytics(ruleStats);
    const currentWeights = this.currentWeights(ruleStats, priorWeights);

    const optimization: WeightOptimizationResult = this.weightOptimizer.optimize({
      ruleAnalytics: analytics,
      benchmark,
      backtest: result,
      currentWeights,
    });

    const recommendations = this.recommendations(result.performance, result.risk, optimization);
    const flowSteps = this.learningFlowSteps(strategy, result.trades.length, optimization.confidence);

    return {
      symbol,
      timeframe,
      backtestType: strategy.backtestType,
      strategy,
      performance: this.performanceSummary(result.performance, result.risk),
      ruleStats,
      weightRecommendations: optimization.recommendedWeights,
      confidence: optimization.confidence,
      expectedImprovement: optimization.expectedImprovement,
      recommendations,
      learningFlowSteps: flowSteps,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildRuleStats(trades: Trade[], strategy: BacktestStrategy): RuleStat[] {
    const entryRule = strategy.entryRules[0]?.signal ?? 'UNKNOWN';
    const exitRule = strategy.exitRules[0]?.signal ?? 'UNKNOWN';
    const key = `${entryRule}/${exitRule}`;
    const returns = trades.map((t) => t.returnPercent);
    const winning = returns.filter((r) => r > 0);
    const losing = returns.filter((r) => r <= 0);
    const median = this.median(returns);
    const vol = this.volatility(returns);
    const mean = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const sharpe = vol > 0 ? (mean - this.dailyRf(strategy)) / vol : 0;
    return [
      {
        rule: key,
        totalTrades: trades.length,
        winningTrades: winning.length,
        losingTrades: losing.length,
        winRate: trades.length > 0 ? (winning.length / trades.length) * 100 : 0,
        avgReturn: mean,
        medianReturn: median,
        totalReturn: returns.reduce((a, b) => a + b, 0),
        bestTrade: returns.length > 0 ? Math.max(...returns) : 0,
        worstTrade: returns.length > 0 ? Math.min(...returns) : 0,
        sharpe,
      },
    ];
  }

  private toRuleAnalytics(ruleStats: RuleStat[]): RuleAnalyticsResult {
    return {
      ruleStatistics: ruleStats,
      pairStatistics: [],
      tripleStatistics: [],
      timeframeStatistics: [],
      sectorStatistics: [],
      eliteStatistics: [],
      opportunityStatistics: [],
      metadata: { generatedAt: new Date().toISOString() },
    };
  }

  private currentWeights(ruleStats: RuleStat[], prior?: Record<string, number>): Record<string, number> {
    if (prior && Object.keys(prior).length > 0) return prior;
    const n = ruleStats.length || 1;
    const equal = 100 / n;
    const weights: Record<string, number> = {};
    for (const r of ruleStats) {
      weights[r.rule] = Math.round(equal * 100) / 100;
    }
    return weights;
  }

  private performanceSummary(p: PerformanceMetrics, r: RiskMetrics): PerformanceSummaryDto {
    return {
      totalReturn: p.totalReturn,
      cagr: p.cagr,
      sharpeRatio: r.sharpeRatio,
      maxDrawdown: r.maxDrawdown,
      winRate: p.winRate,
      profitFactor: Number.isFinite(p.profitFactor) ? p.profitFactor : 0,
      totalTrades: p.totalTrades,
    };
  }

  private dailyRf(strategy: BacktestStrategy): number {
    return ((strategy.riskFreeRate ?? 0.15) / (strategy.tradingDaysPerYear ?? 252)) * 100;
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  private volatility(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private recommendations(perf: PerformanceMetrics, risk: RiskMetrics, opt: WeightOptimizationResult): string[] {
    const out: string[] = [];
    if (perf.winRate < 50) out.push('Kazanma oranı düşük; girdi sinyallerini titrelendirerek daha da ince ayar yapın.');
    if (Number.isFinite(perf.profitFactor) ? perf.profitFactor < 1.2 : true) out.push('Profit faktörü iyileştirilebilir; çıkış kurallarını gözden geçirin.');
    if (risk.maxDrawdown > 20) out.push('Maksimum çekilme yüksek; pozisyon büyüklüğünü azaltın.');
    if (opt.expectedImprovement > 0) out.push(`Ağırlık optimizasyonyla ~${opt.expectedImprovement.toFixed(2)} puan iyileşme bekleniyor.`);
    if (out.length === 0) out.push('Strateji tutarlı; mevcut ağırlıklar korunmalı.');
    return out;
  }

  private learningFlowSteps(strategy: BacktestStrategy, tradeCount: number, confidence: number): string[] {
    return [
      `Strateji "${strategy.backtestType}" (${strategy.entryRules[0]?.signal} → ${strategy.exitRules[0]?.signal}) çalıştırıldı (${tradeCount} işlem).`,
      'Ticaret sonuçları kural istatistiklerine dönüştürüldü.',
      'Benchmark (XU030.IS) karşılaştırması yapıldı.',
      'Ağırlık optimizasyonu (WeightOptimizer) uygulandı.',
      `Öğrenme tamam, güven skoru: ${(confidence * 100).toFixed(1)}%`,
    ];
  }
}
