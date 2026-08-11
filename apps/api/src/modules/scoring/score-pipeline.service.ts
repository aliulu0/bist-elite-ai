import { Injectable } from '@nestjs/common';
import { ScoreCalculator } from './score-calculator.service';
import {
  ScorePipelineInput,
  ScorePipelineOutput,
  ScoreResult,
  AIScoreResult,
  ScoreWeights,
  ScoreDimension,
  ProviderCoverage,
  DataFreshness,
} from './scoring-types';

@Injectable()
export class ScorePipeline {
  constructor(private readonly calculator: ScoreCalculator) {}

  async run(input: ScorePipelineInput, weights: ScoreWeights): Promise<ScorePipelineOutput> {
    const startTime = Date.now();
    const scores = this.calculator.calculateAll(input);
    const aiResult = this.computeAIResult(scores, weights, input);
    return {
      scores,
      aiResult,
      pipelineDurationMs: Date.now() - startTime,
    };
  }

  private computeAIResult(
    scores: ScoreResult[],
    weights: ScoreWeights,
    input: ScorePipelineInput,
  ): AIScoreResult {
    const dimensionWeightMap: Record<ScoreDimension, number> = {
      technical: weights.technical,
      fundamental: weights.fundamental,
      verification: weights.verification,
      catalyst: weights.catalyst,
      liquidity: weights.liquidity,
      risk: weights.risk,
      volume: weights.volume,
      momentum: weights.momentum,
      trend: weights.trend,
      quality: weights.quality,
    };

    const availableScores = scores.filter((s) => s.score !== null);
    const availableDimensions = availableScores.map((s) => s.dimension);

    let weightedSum = 0;
    let weightSum = 0;
    for (const score of availableScores) {
      const w = dimensionWeightMap[score.dimension] ?? 10;
      weightedSum += (score.score ?? 0) * w;
      weightSum += w;
    }

    const weightedScore = weightSum > 0 ? Math.round(weightedSum / weightSum) : null;

    const totalDimensions = 10;
    const availableCount = availableScores.length;
    const missingDimensions = totalDimensions - availableCount;

    const providerCoverage = this.computeProviderCoverage(input.providerCoverage);
    const verificationConfidence = this.computeVerificationConfidence(input.verificationData);
    const catalystConfidence = this.computeCatalystConfidence(input.catalystData);
    const freshnessFactor = this.computeFreshnessFactor(input.freshnessMs);
    const dataCompleteness = availableCount / totalDimensions;
    const conflictPenalty = this.computeConflictPenalty(scores);

    const confidence = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          dataCompleteness * 100 * providerCoverage * verificationConfidence * catalystConfidence * freshnessFactor * (1 - conflictPenalty),
        ),
      ),
    );

    return {
      aiScore: weightedScore,
      aiConfidence: confidence,
      weightedScore,
      scores,
      availableDimensionCount: availableCount,
      totalDimensions,
    };
  }

  private computeProviderCoverage(coverage?: ProviderCoverage): number {
    if (!coverage) return 0.8;
    const total = 8;
    const active = Object.values(coverage).filter(Boolean).length;
    return active / total;
  }

  private computeVerificationConfidence(verificationData?: { confidence: number | null }): number {
    if (!verificationData || verificationData.confidence == null) return 0.7;
    return Math.max(0.1, Math.min(1.0, verificationData.confidence));
  }

  private computeCatalystConfidence(catalystData?: { count: number }): number {
    if (!catalystData) return 0.6;
    if (catalystData.count === 0) return 0.5;
    return Math.min(1.0, 0.5 + catalystData.count * 0.1);
  }

  private computeFreshnessFactor(freshnessMs?: number | null): number {
    if (freshnessMs == null) return 0.8;
    if (freshnessMs < 3600000) return 1.0;
    if (freshnessMs < 86400000) return 0.95;
    if (freshnessMs < 604800000) return 0.85;
    if (freshnessMs < 2592000000) return 0.7;
    return 0.5;
  }

  private computeConflictPenalty(scores: ScoreResult[]): number {
    const hasNulls = scores.filter((s) => s.score === null);
    const nullRatio = hasNulls.length / scores.length;
    return nullRatio * 0.3;
  }
}