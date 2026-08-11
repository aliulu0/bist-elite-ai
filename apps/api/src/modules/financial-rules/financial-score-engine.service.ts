import { Injectable, Logger } from '@nestjs/common';
import {
  FinancialScoreResult,
  ScoreBreakdown,
  ScoreBreakdownItem,
  ScoreConfig,
  ScoreGrade,
  DEFAULT_SCORE_CONFIG,
} from './score.types';
import { FinancialRulesOutput, RuleResult } from './rule.types';

@Injectable()
export class FinancialScoreEngine {
  private readonly logger = new Logger(FinancialScoreEngine.name);
  private readonly config: ScoreConfig;

  constructor() {
    this.config = DEFAULT_SCORE_CONFIG;
  }

  evaluate(rulesOutput: FinancialRulesOutput): FinancialScoreResult {
    const { symbol, rules } = rulesOutput;

    const breakdown = this.buildBreakdown(rules);
    const score = this.calculateScore(breakdown);
    const grade = this.determineGrade(score);
    const confidence = this.calculateConfidence(rules);

    const passedRules = rules.filter((r) => r.status === 'PASS').length;
    const warningRules = rules.filter((r) => r.status === 'WARNING').length;
    const failedRules = rules.filter((r) => r.status === 'FAIL').length;

    this.logger.debug(
      `Scored ${symbol}: ${score.toFixed(1)} (${grade}) ` +
        `[confidence: ${(confidence * 100).toFixed(0)}%]`,
    );

    return {
      symbol,
      score: Math.round(score * 10) / 10,
      grade,
      passedRules,
      warningRules,
      failedRules,
      confidence,
      breakdown,
    };
  }

  private buildBreakdown(rules: RuleResult[]): ScoreBreakdown {
    const items: ScoreBreakdownItem[] = rules.map((rule) => {
      const weight = this.config.weights[rule.id] ?? 0;
      const contribution = this.calculateContribution(rule, weight);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        weight,
        status: rule.status,
        contribution,
      };
    });

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    return { items, totalWeight };
  }

  private calculateContribution(rule: RuleResult, weight: number): number {
    switch (rule.status) {
      case 'PASS':
        return weight;
      case 'WARNING':
        return weight * 0.5;
      case 'FAIL':
        return 0;
      default:
        return 0;
    }
  }

  private calculateScore(breakdown: ScoreBreakdown): number {
    if (breakdown.totalWeight === 0) return 0;
    const earned = breakdown.items.reduce((sum, item) => sum + item.contribution, 0);
    return (earned / breakdown.totalWeight) * 100;
  }

  private determineGrade(score: number): ScoreGrade {
    const { grades } = this.config;
    if (score >= grades.aPlus) return 'A+';
    if (score >= grades.a) return 'A';
    if (score >= grades.b) return 'B';
    if (score >= grades.c) return 'C';
    return 'D';
  }

  private calculateConfidence(rules: RuleResult[]): number {
    if (rules.length === 0) return 0;
    const confidentRules = rules.filter((r) => r.value !== null).length;
    return confidentRules / rules.length;
  }
}
