import { Injectable, Logger } from '@nestjs/common';
import {
  ConsensusEngineInput,
  ConsensusEngineOutput,
  ConsensusSummary,
  ConsensusStrength,
  TimeframeConsensusScore,
  ConsensusEvidence,
  ConflictDetail,
  EarlyAlignment,
  TrendInfo,
  TimeframeData,
  Timeframe,
  TrendDirection,
  SignalType,
  ConsensusConfig,
  getConsensusConfig,
} from './types';
import { ConsensusCalculator } from './consensus-calculator.service';
import { ConflictDetector } from './conflict-detector.service';
import { DominantTrendService } from './dominant-trend.service';
import { EarlyAlignmentService } from './early-alignment.service';
import { ExplanationGenerator } from './explanation-generator.service';
import { getConsensusDescription, getSuggestedObservation, getDisclaimer } from './turkish-terms';

@Injectable()
export class ConsensusOrchestrator {
  private readonly logger = new Logger(ConsensusOrchestrator.name);
  private readonly config: ConsensusConfig;
  private readonly consensusCalculator: ConsensusCalculator;
  private readonly conflictDetector: ConflictDetector;
  private readonly dominantTrendService: DominantTrendService;
  private readonly earlyAlignmentService: EarlyAlignmentService;
  private readonly explanationGenerator: ExplanationGenerator;

  constructor() {
    this.config = getConsensusConfig();
    this.consensusCalculator = new ConsensusCalculator();
    this.conflictDetector = new ConflictDetector();
    this.dominantTrendService = new DominantTrendService();
    this.earlyAlignmentService = new EarlyAlignmentService();
    this.explanationGenerator = new ExplanationGenerator();
  }

  async analyze(input: ConsensusEngineInput): Promise<ConsensusEngineOutput> {
    const startTime = Date.now();
    this.logger.debug(
      `Analyzing consensus for ${input.stockSymbol} with ${input.timeframes.length} timeframes`,
    );

    const timeframeScores = this.consensusCalculator.calculate(input.timeframes);
    const conflicts = this.conflictDetector.detect(input.timeframes);
    const conflictLevel = this.conflictDetector.getConflictLevel(conflicts);
    const trendAnalysis = this.dominantTrendService.analyze(input.timeframes);
    const earlyAlignments = this.earlyAlignmentService.detect(input.timeframes);

    const consensusSummary = this.buildConsensusSummary(
      timeframeScores,
      conflicts,
      conflictLevel,
      trendAnalysis,
    );
    const evidenceMatrix = this.buildEvidenceMatrix(timeframeScores, conflicts, trendAnalysis);
    const suggestedAction = this.determineSuggestedAction(consensusSummary, conflicts);
    const suggestedConfidence = this.calculateSuggestedConfidence(consensusSummary, conflicts);
    const suggestedObservation = getSuggestedObservation(
      consensusSummary.overallScore,
      consensusSummary.consensusStrength,
      conflicts.length,
    );

    const elapsed = Date.now() - startTime;
    this.logger.debug(
      `Consensus analysis complete for ${input.stockSymbol}: ${consensusSummary.overallScore.toFixed(1)} (${elapsed}ms)`,
    );

    return {
      stockSymbol: input.stockSymbol,
      stockName: input.stockName,
      generatedAt: new Date().toISOString(),
      currentPrice: input.currentPrice,
      timeframeScores,
      consensusSummary,
      dominantTrend: trendAnalysis.dominant,
      secondaryTrend: trendAnalysis.secondary,
      shortTermDirection: trendAnalysis.shortTerm,
      mediumTermDirection: trendAnalysis.mediumTerm,
      longTermDirection: trendAnalysis.longTerm,
      conflicts,
      earlyAlignments,
      evidenceMatrix,
      suggestedAction,
      suggestedConfidence,
      suggestedObservation,
      suggestedObservationTr: suggestedObservation,
      disclaimer: getDisclaimer(),
      metadata: {
        calculationTimeMs: elapsed,
        timeframeCount: input.timeframes.length,
        configProfile: this.config.normalization.method,
        conflictCount: conflicts.length,
        earlyAlignmentCount: earlyAlignments.length,
        trendStrength: trendAnalysis.trendStrength,
      },
    };
  }

  async analyzeBatch(inputs: ConsensusEngineInput[]): Promise<ConsensusEngineOutput[]> {
    const results = await Promise.all(inputs.map((input) => this.analyze(input)));
    results.sort((a, b) => b.consensusSummary.overallScore - a.consensusSummary.overallScore);
    return results;
  }

  private buildConsensusSummary(
    timeframeScores: TimeframeConsensusScore[],
    conflicts: ConflictDetail[],
    conflictLevel: number,
    trendAnalysis: { dominant: TrendInfo; trendStrength: number },
  ): ConsensusSummary {
    const overallScore = this.calculateOverallScore(timeframeScores, conflictLevel);
    const consensusStrength = this.determineConsensusStrength(overallScore, conflicts.length);
    const consensusConfidence = this.calculateConsensusConfidence(timeframeScores, conflicts);
    const description = getConsensusDescription(consensusStrength, overallScore, conflicts.length);

    return {
      overallScore,
      consensusStrength,
      consensusConfidence,
      conflictLevel,
      trendStrength: trendAnalysis.trendStrength,
      dominantDirection: trendAnalysis.dominant.direction,
      description: `${consensusStrength} consensus with score ${overallScore.toFixed(1)}`,
      descriptionTr: description,
    };
  }

  private calculateOverallScore(
    timeframeScores: TimeframeConsensusScore[],
    conflictLevel: number,
  ): number {
    if (timeframeScores.length === 0) return 50;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const ts of timeframeScores) {
      weightedSum += ts.weightedContribution;
      totalWeight += this.config.timeframeWeights[ts.timeframe] || 0.25;
    }

    const baseScore = totalWeight > 0 ? weightedSum : 50;
    const conflictPenalty = conflictLevel * this.config.riskAdjustment.maxPenalty;

    return Math.max(0, Math.min(100, baseScore - conflictPenalty));
  }

  private determineConsensusStrength(score: number, conflictCount: number): ConsensusStrength {
    if (conflictCount === 0 && score >= this.config.consensusThresholds.strong * 100) {
      return ConsensusStrength.STRONG;
    }
    if (conflictCount <= 1 && score >= this.config.consensusThresholds.moderate * 100) {
      return ConsensusStrength.MODERATE;
    }
    if (conflictCount > 2 || score < this.config.consensusThresholds.weak * 100) {
      return ConsensusStrength.CONFLICTING;
    }
    return ConsensusStrength.WEAK;
  }

  private calculateConsensusConfidence(
    timeframeScores: TimeframeConsensusScore[],
    conflicts: ConflictDetail[],
  ): number {
    if (timeframeScores.length === 0) return 0;

    const avgConfidence =
      timeframeScores.reduce((sum, ts) => sum + ts.confidence, 0) / timeframeScores.length;
    const conflictPenalty = conflicts.length * 0.05;

    return Math.max(0, Math.min(1, avgConfidence - conflictPenalty));
  }

  private buildEvidenceMatrix(
    timeframeScores: TimeframeConsensusScore[],
    conflicts: ConflictDetail[],
    trendAnalysis: { dominant: TrendInfo; secondary: TrendInfo },
  ): ConsensusEvidence[] {
    const evidence: ConsensusEvidence[] = [];

    for (const ts of timeframeScores) {
      const weight = this.config.timeframeWeights[ts.timeframe] || 0.25;
      evidence.push({
        component: `${ts.timeframe} Konsensus Skoru`,
        weight,
        rawScore: ts.score,
        normalizedScore: ts.score,
        contribution: ts.weightedContribution,
        description: `${ts.timeframe} timeframe consensus score`,
        descriptionTr: `${ts.timeframe} zaman dilimi konsensus skoru: ${ts.score.toFixed(1)}`,
      });
    }

    evidence.push({
      component: 'Trend Guclulugu',
      weight: 0.2,
      rawScore: trendAnalysis.dominant.strength,
      normalizedScore: trendAnalysis.dominant.strength,
      contribution: trendAnalysis.dominant.strength * 0.2,
      description: 'Dominant trend strength',
      descriptionTr: `Baskin trend gucu: ${trendAnalysis.dominant.strength.toFixed(1)}`,
    });

    if (conflicts.length > 0) {
      const conflictImpact =
        conflicts.reduce((sum, c) => sum + Math.abs(c.impact), 0) / conflicts.length;
      evidence.push({
        component: 'Celiski Etkisi',
        weight: 0.15,
        rawScore: (1 - conflictImpact) * 100,
        normalizedScore: (1 - conflictImpact) * 100,
        contribution: -(conflictImpact * 15),
        description: 'Impact of detected conflicts',
        descriptionTr: `Tespit edilen celiskilerin etkisi: -${(conflictImpact * 100).toFixed(0)}%`,
      });
    }

    return evidence.sort((a, b) => b.contribution - a.contribution);
  }

  private determineSuggestedAction(
    summary: ConsensusSummary,
    conflicts: ConflictDetail[],
  ): SignalType {
    if (summary.consensusStrength === ConsensusStrength.CONFLICTING) {
      return SignalType.HOLD;
    }

    if (summary.consensusStrength === ConsensusStrength.STRONG) {
      if (summary.overallScore >= 70) return SignalType.BUY;
      if (summary.overallScore <= 30) return SignalType.SELL;
    }

    if (summary.consensusStrength === ConsensusStrength.MODERATE) {
      if (summary.overallScore >= 65) return SignalType.WATCH;
      if (summary.overallScore <= 35) return SignalType.WATCH;
    }

    return SignalType.HOLD;
  }

  private calculateSuggestedConfidence(
    summary: ConsensusSummary,
    conflicts: ConflictDetail[],
  ): number {
    let confidence = summary.consensusConfidence;

    if (conflicts.length > 0) {
      const maxConflictImpact = Math.max(...conflicts.map((c) => Math.abs(c.impact)));
      confidence *= 1 - maxConflictImpact * 0.3;
    }

    if (summary.trendStrength > 70) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
