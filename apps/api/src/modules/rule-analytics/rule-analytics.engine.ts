import { Injectable, Optional } from '@nestjs/common';
import { Trade } from '../backtest/backtest.types';
import { Timeframe } from '../indicators/indicator.types';
import { RuleStatus } from '../technical-rules/technical-rules.types';
import { EliteScoreRating } from '../elite-score/elite-score.types';
import { OpportunityLevel } from '../opportunity/opportunity.types';
import {
  RuleAnalyticsResult,
  RuleStat,
  PairStat,
  TripleStat,
  TimeframeStat,
  SectorStat,
  EliteStat,
  OpportunityStat,
} from './rule-analytics.types';
import { RuleAnalyticsConfig, DEFAULT_RULE_ANALYTICS_CONFIG } from './rule-analytics.config';

export interface TradeContext {
  tradeIndex: number;
  timeframe: Timeframe;
  sector: string;
  technicalRuleStatuses: Record<string, RuleStatus>;
  financialRuleStatuses: Record<string, RuleStatus>;
  eliteRating: EliteScoreRating;
  opportunityLevel: OpportunityLevel;
}

export interface RuleAnalyticsInput {
  trades: Trade[];
  contexts: TradeContext[];
}

@Injectable()
export class RuleAnalyticsEngine {
  private readonly config: RuleAnalyticsConfig;

  constructor(@Optional() config?: Partial<RuleAnalyticsConfig>) {
    this.config = { ...DEFAULT_RULE_ANALYTICS_CONFIG, ...config };
  }

  analyze(input: RuleAnalyticsInput): RuleAnalyticsResult {
    const { trades, contexts } = input;

    if (!trades || trades.length === 0) {
      return this.emptyResult('No trades provided');
    }

    if (!contexts || contexts.length === 0) {
      return this.emptyResult('No trade contexts provided');
    }

    const paired = this.pairTradesWithContexts(trades, contexts);

    const allTechRules = this.collectRuleNames(paired, 'technical');
    const allFinRules = this.collectRuleNames(paired, 'financial');

    const ruleStatistics = this.computeRuleStatistics(paired, allTechRules, allFinRules);
    const pairStatistics = this.computePairStatistics(paired, allTechRules, allFinRules);
    const tripleStatistics = this.computeTripleStatistics(paired, allTechRules, allFinRules);
    const timeframeStatistics = this.computeTimeframeStatistics(paired);
    const sectorStatistics = this.computeSectorStatistics(paired);
    const eliteStatistics = this.computeEliteStatistics(paired);
    const opportunityStatistics = this.computeOpportunityStatistics(paired);

    return {
      ruleStatistics,
      pairStatistics,
      tripleStatistics,
      timeframeStatistics,
      sectorStatistics,
      eliteStatistics,
      opportunityStatistics,
      metadata: {
        totalTrades: trades.length,
        totalContexts: contexts.length,
        uniqueTimeframes: [...new Set(contexts.map((c) => c.timeframe))],
        uniqueSectors: [...new Set(contexts.map((c) => c.sector))],
        uniqueTechnicalRules: allTechRules.length,
        uniqueFinancialRules: allFinRules.length,
      },
    };
  }

  private pairTradesWithContexts(trades: Trade[], contexts: TradeContext[]): Array<{ trade: Trade; context: TradeContext }> {
    const paired: Array<{ trade: Trade; context: TradeContext }> = [];
    const len = Math.min(trades.length, contexts.length);
    for (let i = 0; i < len; i++) {
      paired.push({ trade: trades[i], context: contexts[i] });
    }
    return paired;
  }

  private collectRuleNames(paired: Array<{ trade: Trade; context: TradeContext }>, type: 'technical' | 'financial'): string[] {
    const names = new Set<string>();
    for (const { context } of paired) {
      const statuses = type === 'technical' ? context.technicalRuleStatuses : context.financialRuleStatuses;
      for (const name of Object.keys(statuses)) {
        names.add(name);
      }
    }
    return [...names].sort();
  }

  private computeRuleStatistics(
    paired: Array<{ trade: Trade; context: TradeContext }>,
    techRules: string[],
    finRules: string[],
  ): RuleStat[] {
    const stats: RuleStat[] = [];

    for (const rule of techRules) {
      const subset = paired.filter((p) => p.context.technicalRuleStatuses[rule]);
      if (subset.length >= this.config.minTradesForStat) {
        stats.push(this.buildRuleStat(rule, subset.map((p) => p.trade)));
      }
    }

    for (const rule of finRules) {
      const subset = paired.filter((p) => p.context.financialRuleStatuses[rule]);
      if (subset.length >= this.config.minTradesForStat) {
        stats.push(this.buildRuleStat(rule, subset.map((p) => p.trade)));
      }
    }

    return stats;
  }

  private buildRuleStat(rule: string, trades: Trade[]): RuleStat {
    const returns = trades.map((t) => t.returnPercent);
    const winning = returns.filter((r) => r > 0);
    const losing = returns.filter((r) => r <= 0);
    const sorted = [...returns].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const totalReturn = trades.reduce((acc, t) => acc * (1 + t.returnPercent / 100), 1) - 1;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const dailyRf = this.config.riskFreeRate / this.config.tradingDaysPerYear;
    const sharpe = stdDev > 0 ? (mean - dailyRf * 100) / stdDev * Math.sqrt(this.config.tradingDaysPerYear) : 0;

    return {
      rule,
      totalTrades: trades.length,
      winningTrades: winning.length,
      losingTrades: losing.length,
      winRate: (winning.length / trades.length) * 100,
      avgReturn: mean,
      medianReturn: median,
      totalReturn: totalReturn * 100,
      bestTrade: Math.max(...returns),
      worstTrade: Math.min(...returns),
      sharpe,
    };
  }

  private computePairStatistics(
    paired: Array<{ trade: Trade; context: TradeContext }>,
    techRules: string[],
    finRules: string[],
  ): PairStat[] {
    const allRules = [...techRules, ...finRules];
    const stats: PairStat[] = [];
    let count = 0;

    for (let i = 0; i < allRules.length && count < this.config.maxPairCombinations; i++) {
      for (let j = i + 1; j < allRules.length && count < this.config.maxPairCombinations; j++) {
        const ruleA = allRules[i];
        const ruleB = allRules[j];
        const subset = paired.filter(
          (p) =>
            (p.context.technicalRuleStatuses[ruleA] || p.context.financialRuleStatuses[ruleA]) &&
            (p.context.technicalRuleStatuses[ruleB] || p.context.financialRuleStatuses[ruleB]),
        );
        if (subset.length >= this.config.minTradesForStat) {
          stats.push(this.buildPairStat(ruleA, ruleB, subset.map((p) => p.trade)));
          count++;
        }
      }
    }

    return stats;
  }

  private buildPairStat(ruleA: string, ruleB: string, trades: Trade[]): PairStat {
    const returns = trades.map((t) => t.returnPercent);
    const winning = returns.filter((r) => r > 0);
    const totalReturn = trades.reduce((acc, t) => acc * (1 + t.returnPercent / 100), 1) - 1;

    return {
      ruleA,
      ruleB,
      totalTrades: trades.length,
      winRate: (winning.length / trades.length) * 100,
      avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
      totalReturn: totalReturn * 100,
    };
  }

  private computeTripleStatistics(
    paired: Array<{ trade: Trade; context: TradeContext }>,
    techRules: string[],
    finRules: string[],
  ): TripleStat[] {
    const allRules = [...techRules, ...finRules];
    const stats: TripleStat[] = [];
    let count = 0;

    for (let i = 0; i < allRules.length && count < this.config.maxTripleCombinations; i++) {
      for (let j = i + 1; j < allRules.length && count < this.config.maxTripleCombinations; j++) {
        for (let k = j + 1; k < allRules.length && count < this.config.maxTripleCombinations; k++) {
          const ruleA = allRules[i];
          const ruleB = allRules[j];
          const ruleC = allRules[k];
          const subset = paired.filter(
            (p) =>
              (p.context.technicalRuleStatuses[ruleA] || p.context.financialRuleStatuses[ruleA]) &&
              (p.context.technicalRuleStatuses[ruleB] || p.context.financialRuleStatuses[ruleB]) &&
              (p.context.technicalRuleStatuses[ruleC] || p.context.financialRuleStatuses[ruleC]),
          );
          if (subset.length >= this.config.minTradesForStat) {
            stats.push(this.buildTripleStat(ruleA, ruleB, ruleC, subset.map((p) => p.trade)));
            count++;
          }
        }
      }
    }

    return stats;
  }

  private buildTripleStat(ruleA: string, ruleB: string, ruleC: string, trades: Trade[]): TripleStat {
    const returns = trades.map((t) => t.returnPercent);
    const winning = returns.filter((r) => r > 0);
    const totalReturn = trades.reduce((acc, t) => acc * (1 + t.returnPercent / 100), 1) - 1;

    return {
      ruleA,
      ruleB,
      ruleC,
      totalTrades: trades.length,
      winRate: (winning.length / trades.length) * 100,
      avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
      totalReturn: totalReturn * 100,
    };
  }

  private computeTimeframeStatistics(paired: Array<{ trade: Trade; context: TradeContext }>): TimeframeStat[] {
    const groups = new Map<Timeframe, Trade[]>();
    for (const { trade, context } of paired) {
      const existing = groups.get(context.timeframe) ?? [];
      existing.push(trade);
      groups.set(context.timeframe, existing);
    }

    const stats: TimeframeStat[] = [];
    for (const [timeframe, trades] of groups) {
      if (trades.length >= this.config.minTradesForStat) {
        stats.push({ timeframe, ...this.computeGroupMetrics(trades) });
      }
    }

    return stats;
  }

  private computeSectorStatistics(paired: Array<{ trade: Trade; context: TradeContext }>): SectorStat[] {
    const groups = new Map<string, Trade[]>();
    for (const { trade, context } of paired) {
      const existing = groups.get(context.sector) ?? [];
      existing.push(trade);
      groups.set(context.sector, existing);
    }

    const stats: SectorStat[] = [];
    for (const [sector, trades] of groups) {
      if (trades.length >= this.config.minTradesForStat) {
        stats.push({ sector, ...this.computeGroupMetrics(trades) });
      }
    }

    return stats;
  }

  private computeEliteStatistics(paired: Array<{ trade: Trade; context: TradeContext }>): EliteStat[] {
    const groups = new Map<EliteScoreRating, Trade[]>();
    for (const { trade, context } of paired) {
      const existing = groups.get(context.eliteRating) ?? [];
      existing.push(trade);
      groups.set(context.eliteRating, existing);
    }

    const stats: EliteStat[] = [];
    for (const [rating, trades] of groups) {
      if (trades.length >= this.config.minTradesForStat) {
        stats.push({ rating, ...this.computeGroupMetrics(trades) });
      }
    }

    return stats;
  }

  private computeOpportunityStatistics(paired: Array<{ trade: Trade; context: TradeContext }>): OpportunityStat[] {
    const groups = new Map<OpportunityLevel, Trade[]>();
    for (const { trade, context } of paired) {
      const existing = groups.get(context.opportunityLevel) ?? [];
      existing.push(trade);
      groups.set(context.opportunityLevel, existing);
    }

    const stats: OpportunityStat[] = [];
    for (const [level, trades] of groups) {
      if (trades.length >= this.config.minTradesForStat) {
        stats.push({ level, ...this.computeGroupMetrics(trades) });
      }
    }

    return stats;
  }

  private computeGroupMetrics(trades: Trade[]): { totalTrades: number; winRate: number; avgReturn: number; totalReturn: number } {
    const returns = trades.map((t) => t.returnPercent);
    const winning = returns.filter((r) => r > 0);
    const totalReturn = trades.reduce((acc, t) => acc * (1 + t.returnPercent / 100), 1) - 1;

    return {
      totalTrades: trades.length,
      winRate: (winning.length / trades.length) * 100,
      avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
      totalReturn: totalReturn * 100,
    };
  }

  private emptyResult(reason: string): RuleAnalyticsResult {
    return {
      ruleStatistics: [],
      pairStatistics: [],
      tripleStatistics: [],
      timeframeStatistics: [],
      sectorStatistics: [],
      eliteStatistics: [],
      opportunityStatistics: [],
      metadata: { reason },
    };
  }
}
