import { Injectable, Logger } from '@nestjs/common';
import { Timeframe } from '../indicators/indicator.types';
import { TechnicalRuleResult } from '../technical-rules/technical-rules.types';
import {
  TechnicalScoreConfig,
  DEFAULT_TECHNICAL_SCORE_CONFIG,
} from './technical-score.config';
import {
  TechnicalScore,
  TechnicalScoreOutput,
  TechnicalGrade,
  RuleScore,
} from './technical-score.types';

@Injectable()
export class TechnicalScoreEngine {
  private readonly logger = new Logger(TechnicalScoreEngine.name);
  private readonly config: TechnicalScoreConfig;

  constructor() {
    this.config = DEFAULT_TECHNICAL_SCORE_CONFIG;
  }

  calculate(rules: TechnicalRuleResult[], timeframe: Timeframe): TechnicalScoreOutput {
    if (rules.length === 0) {
      return this.emptyResult(timeframe);
    }

    const ruleBreakdown = this.scoreRules(rules);
    const totalWeight = ruleBreakdown.reduce((sum, r) => sum + r.weight, 0);
    const totalContribution = ruleBreakdown.reduce((sum, r) => sum + r.contribution, 0);

    const score = totalWeight > 0 ? (totalContribution / totalWeight) * 100 : 0;
    const grade = this.calculateGrade(score);
    const confidence = this.calculateConfidence(rules, ruleBreakdown);

    this.logger.debug(
      `Technical Score (${timeframe}): ${score.toFixed(1)} (${grade}), confidence=${confidence.toFixed(2)}`,
    );

    return {
      timeframe,
      score: Math.round(score * 10) / 10,
      grade,
      confidence: Math.round(confidence * 100) / 100,
      ruleBreakdown,
      metadata: {
        totalRules: rules.length,
        availableRules: rules.filter((r) => r.status !== 'NOT_AVAILABLE').length,
        passCount: rules.filter((r) => r.status === 'PASS').length,
        warningCount: rules.filter((r) => r.status === 'WARNING').length,
        failCount: rules.filter((r) => r.status === 'FAIL').length,
        notAvailableCount: rules.filter((r) => r.status === 'NOT_AVAILABLE').length,
        totalWeight,
      },
      isValid: true,
    };
  }

  private scoreRules(rules: TechnicalRuleResult[]): RuleScore[] {
    const { weights } = this.config;

    return rules.map((rule) => {
      const weight = weights[rule.rule] ?? 5;
      const contribution = this.calculateContribution(rule.status, weight);
      return {
        rule: rule.rule,
        category: rule.category,
        status: rule.status,
        weight,
        contribution,
      };
    });
  }

  private calculateContribution(status: string, weight: number): number {
    switch (status) {
      case 'PASS':
        return weight;
      case 'WARNING':
        return weight * 0.5;
      case 'FAIL':
        return 0;
      case 'NOT_AVAILABLE':
        return 0;
      default:
        return 0;
    }
  }

  private calculateGrade(score: number): TechnicalGrade {
    const { gradeThresholds } = this.config;
    if (score >= gradeThresholds.aPlus) return 'A+';
    if (score >= gradeThresholds.a) return 'A';
    if (score >= gradeThresholds.b) return 'B';
    if (score >= gradeThresholds.c) return 'C';
    return 'D';
  }

  private calculateConfidence(
    rules: TechnicalRuleResult[],
    breakdown: RuleScore[],
  ): number {
    if (rules.length === 0) return 0;

    const availableRules = rules.filter((r) => r.status !== 'NOT_AVAILABLE').length;
    const availableRatio = availableRules / rules.length;

    const nonZeroWeightRules = breakdown.filter((r) => r.weight > 0);
    const coveredRules = nonZeroWeightRules.length / Math.max(breakdown.length, 1);

    const { confidenceWeights } = this.config;
    const confidence =
      availableRatio * confidenceWeights.availableRules +
      coveredRules * confidenceWeights.validIndicators;

    return Math.max(0, Math.min(1, confidence));
  }

  private emptyResult(timeframe: Timeframe): TechnicalScoreOutput {
    return {
      timeframe,
      score: 0,
      grade: 'D',
      confidence: 0,
      ruleBreakdown: [],
      metadata: {
        totalRules: 0,
        availableRules: 0,
        passCount: 0,
        warningCount: 0,
        failCount: 0,
        notAvailableCount: 0,
        totalWeight: 0,
      },
      isValid: false,
    };
  }
}
