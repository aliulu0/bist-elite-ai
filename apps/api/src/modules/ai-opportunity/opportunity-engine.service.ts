import { Injectable } from '@nestjs/common';
import { DecisionEngine } from '../decision/decision-engine.service';
import { DecisionInput, DecisionResult } from '../decision/decision.types';
import { OpportunityExplanationService } from './opportunity-explanation.service';
import { evaluateOpportunityLevel } from './opportunity-rules';
import {
  OpportunityInput,
  OpportunityLevel,
  OpportunityResult,
  OPPORTUNITY_LEVEL_META,
} from './opportunity.types';

const OPPORTUNITY_SCORE_WEIGHTS: Array<{ key: keyof OpportunityInput; weight: number }> = [
  { key: 'aiScore', weight: 0.25 },
  { key: 'aiConfidence', weight: 0.1 },
  { key: 'strategyScore', weight: 0.1 },
];

const DIMENSION_WEIGHTS: Record<string, number> = {
  technical: 0.05,
  fundamental: 0.05,
  momentum: 0.05,
  trend: 0.05,
  verification: 0.1,
  catalyst: 0.1,
  risk: 0,
  volume: 0,
  quality: 0.05,
  liquidity: 0,
};

@Injectable()
export class OpportunityEngine {
  constructor(
    private readonly decisionEngine: DecisionEngine,
    private readonly explanation: OpportunityExplanationService,
  ) {}

  evaluate(
    input: OpportunityInput,
    precomputedDecision?: DecisionResult,
  ): OpportunityResult {
    const decision: DecisionResult =
      precomputedDecision ?? this.decisionEngine.evaluate(input as DecisionInput);

    const level = evaluateOpportunityLevel(
      decision.decision,
      input.aiScore,
      input.aiConfidence,
    );
    const opportunityScore = this.computeOpportunityScore(input);
    const confidence = this.computeConfidence(input, decision);
    const tags = this.explanation.buildTags(input, decision);
    const reasons = this.explanation.buildReasons(level, input, decision, tags);
    const warnings = this.explanation.buildWarnings(input, decision);

    return {
      ticker: input.ticker,
      company: input.company,
      level,
      levelLabel: OPPORTUNITY_LEVEL_META[level].label,
      levelEmoji: OPPORTUNITY_LEVEL_META[level].emoji,
      opportunityScore,
      confidence,
      decision: decision.decision,
      decisionLabel: decision.decisionLabel,
      decisionScore: decision.decisionScore,
      decisionConfidence: decision.confidence,
      aiScore: input.aiScore,
      aiConfidence: input.aiConfidence,
      strategyId: input.strategyId,
      strategyName: input.strategyName,
      strategyScore: input.strategyScore,
      verification: input.dimensions.verification,
      catalyst: input.dimensions.catalyst,
      momentum: input.dimensions.momentum,
      trend: input.dimensions.trend,
      risk: input.dimensions.risk,
      liquidity: input.dimensions.liquidity,
      technical: input.dimensions.technical,
      fundamental: input.dimensions.fundamental,
      quality: input.dimensions.quality,
      reasons,
      warnings,
      positiveSignals: decision.positiveSignals,
      negativeSignals: decision.negativeSignals,
      tags,
      evaluatedAt: new Date().toISOString(),
    };
  }

  evaluateMany(
    inputs: OpportunityInput[],
    precomputedDecisions?: Map<string, DecisionResult>,
  ): OpportunityResult[] {
    return inputs.map((input) =>
      this.evaluate(input, precomputedDecisions?.get(input.ticker)),
    );
  }

  private computeOpportunityScore(input: OpportunityInput): number {
    let numerator = 0;
    let denominator = 0;
    for (const { key, weight } of OPPORTUNITY_SCORE_WEIGHTS) {
      const value = this.topValue(input, key);
      if (value != null && weight > 0) {
        numerator += value * weight;
        denominator += weight;
      }
    }
    const d = input.dimensions;
    const dimensionPairs: Array<[number | null, number]> = [
      [d.technical, DIMENSION_WEIGHTS.technical],
      [d.fundamental, DIMENSION_WEIGHTS.fundamental],
      [d.momentum, DIMENSION_WEIGHTS.momentum],
      [d.trend, DIMENSION_WEIGHTS.trend],
      [d.verification, DIMENSION_WEIGHTS.verification],
      [d.catalyst, DIMENSION_WEIGHTS.catalyst],
      [d.quality, DIMENSION_WEIGHTS.quality],
    ];
    for (const [value, weight] of dimensionPairs) {
      if (value != null && weight > 0) {
        numerator += value * weight;
        denominator += weight;
      }
    }
    if (denominator === 0) {
      return 0;
    }
    return Math.round(numerator / denominator);
  }

  private computeConfidence(input: OpportunityInput, decision: DecisionResult): number {
    const dims = Object.values(input.dimensions);
    const present = dims.filter((v) => v != null).length;
    const completeness = dims.length > 0 ? present / dims.length : 0;
    return Math.round(0.7 * decision.confidence + 0.3 * completeness * 100);
  }

  private topValue(
    input: OpportunityInput,
    key: keyof OpportunityInput,
  ): number | null {
    switch (key) {
      case 'aiScore':
        return input.aiScore;
      case 'aiConfidence':
        return input.aiConfidence;
      case 'strategyScore':
        return input.strategyScore;
      default:
        return null;
    }
  }
}
