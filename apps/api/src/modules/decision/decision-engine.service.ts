import { Injectable } from '@nestjs/common';
import { evaluateDecision, DecisionRule } from './decision-rules';
import { DecisionExplanationService } from './decision-explanation.service';
import { DecisionDimensionScores, DecisionInput, DecisionResult } from './decision.types';

const DECISION_SCORE_WEIGHTS: Array<{ key: keyof DecisionInput | keyof DecisionDimensionScores; weight: number }> = [
  { key: 'aiScore', weight: 0.3 },
  { key: 'aiConfidence', weight: 0.15 },
  { key: 'strategyScore', weight: 0.1 },
  { key: 'verification', weight: 0.1 },
  { key: 'catalyst', weight: 0.1 },
  { key: 'technical', weight: 0.05 },
  { key: 'fundamental', weight: 0.05 },
  { key: 'momentum', weight: 0.05 },
  { key: 'trend', weight: 0.05 },
  { key: 'risk', weight: 0.05 },
];

@Injectable()
export class DecisionEngine {
  constructor(private readonly explanation: DecisionExplanationService) {}

  evaluate(input: DecisionInput): DecisionResult {
    const rule: DecisionRule = evaluateDecision(input);
    const decisionScore = this.computeDecisionScore(input);
    const confidence = this.computeConfidence(input);

    return {
      ticker: input.ticker,
      company: input.company,
      decision: rule.decision,
      decisionLabel: rule.decisionLabel,
      decisionScore,
      confidence,
      reasons: this.explanation.buildReasons(rule, input),
      warnings: this.explanation.buildWarnings(input),
      positiveSignals: this.explanation.buildPositiveSignals(input),
      negativeSignals: this.explanation.buildNegativeSignals(input),
      overview: this.explanation.buildOverview(input),
      aiScore: input.aiScore,
      aiConfidence: input.aiConfidence,
      strategyId: input.strategyId,
      strategyName: input.strategyName,
      strategyScore: input.strategyScore,
      dimensionScores: { ...input.dimensions },
      evaluatedAt: new Date().toISOString(),
    };
  }

  evaluateMany(inputs: DecisionInput[]): DecisionResult[] {
    return inputs.map((input) => this.evaluate(input));
  }

  private computeDecisionScore(input: DecisionInput): number {
    let numerator = 0;
    let denominator = 0;
    for (const { key, weight } of DECISION_SCORE_WEIGHTS) {
      const value = this.valueFor(input, key);
      if (value != null) {
        numerator += value * weight;
        denominator += weight;
      }
    }
    if (denominator === 0) {
      return 0;
    }
    return Math.round(numerator / denominator);
  }

  private computeConfidence(input: DecisionInput): number {
    const dims = Object.values(input.dimensions);
    const present = dims.filter((v) => v != null).length;
    const completeness = dims.length > 0 ? present / dims.length : 0;
    const base = input.aiConfidence ?? 0;
    return Math.round(0.7 * base + 0.3 * completeness * 100);
  }

  private valueFor(
    input: DecisionInput,
    key: keyof DecisionInput | keyof DecisionDimensionScores,
  ): number | null {
    switch (key) {
      case 'aiScore':
        return input.aiScore;
      case 'aiConfidence':
        return input.aiConfidence;
      case 'strategyScore':
        return input.strategyScore;
      case 'technical':
        return input.dimensions.technical;
      case 'fundamental':
        return input.dimensions.fundamental;
      case 'momentum':
        return input.dimensions.momentum;
      case 'trend':
        return input.dimensions.trend;
      case 'liquidity':
        return input.dimensions.liquidity;
      case 'risk':
        return input.dimensions.risk;
      case 'volume':
        return input.dimensions.volume;
      case 'quality':
        return input.dimensions.quality;
      case 'verification':
        return input.dimensions.verification;
      case 'catalyst':
        return input.dimensions.catalyst;
      default:
        return null;
    }
  }
}
