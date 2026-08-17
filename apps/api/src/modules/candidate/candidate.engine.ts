import { Injectable } from '@nestjs/common';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { ConfluenceResult } from '../confluence/confluence.types';
import { CandidateResult, CandidatePriority, DimensionEvaluation } from './candidate.types';
import { CandidateConfig, DEFAULT_CANDIDATE_CONFIG } from './candidate.config';

export interface CandidateInput {
  symbol: string;
  financialScore: FinancialScoreResult;
  technicalScore: TechnicalScore;
  confluence: ConfluenceResult;
}

@Injectable()
export class CandidateEngine {
  private readonly config: CandidateConfig;

  constructor() {
    this.config = DEFAULT_CANDIDATE_CONFIG;
  }

  evaluate(input: CandidateInput): CandidateResult {
    const { symbol, financialScore, technicalScore, confluence } = input;

    const financial = this.evaluateFinancial(financialScore);
    const technical = this.evaluateTechnical(technicalScore);
    const confluenceEval = this.evaluateConfluence(confluence);

    const candidateScore = this.calculateCandidateScore(financial, technical, confluenceEval);
    const priority = this.determinePriority(candidateScore);
    const reasons = this.buildReasons(financial, technical, confluenceEval, candidateScore);
    const confidence = this.calculateConfidence(financialScore, technicalScore, confluence);
    const allDimensionsPassed =
      (financial.available === false || financial.passed) &&
      technical.passed &&
      confluenceEval.passed;
    const candidate =
      allDimensionsPassed &&
      priority !== 'REJECT' &&
      candidateScore >= this.config.scoreThresholds.minCandidateScore;

    return {
      candidate,
      candidateScore,
      priority,
      reasons,
      confidence,
      metadata: {
        symbol,
        financial: { score: financial.score, passed: financial.passed },
        technical: { score: technical.score, passed: technical.passed },
        confluence: { score: confluenceEval.score, passed: confluenceEval.passed },
      },
      isValid: true,
    };
  }

  private evaluateFinancial(score: FinancialScoreResult): DimensionEvaluation {
    if (score.dataStatus === 'UNAVAILABLE') {
      return {
        score: 0,
        passed: true,
        factors: ['Financial data unavailable'],
        available: false,
      };
    }

    const { financialCriteria } = this.config;
    const factors: string[] = [];

    const scoreOk = score.score >= financialCriteria.minScore;
    const passedOk = score.passedRules >= financialCriteria.minPassedRules;
    const failedOk = score.failedRules <= financialCriteria.maxFailedRules;
    const confidenceOk = score.confidence >= financialCriteria.minConfidence;

    if (scoreOk) factors.push(`Score ${score.score} meets minimum ${financialCriteria.minScore}`);
    else factors.push(`Score ${score.score} below minimum ${financialCriteria.minScore}`);

    if (passedOk) factors.push(`${score.passedRules} rules passed`);
    else
      factors.push(
        `Only ${score.passedRules} rules passed (need ${financialCriteria.minPassedRules})`,
      );

    if (!failedOk)
      factors.push(`${score.failedRules} rules failed (max ${financialCriteria.maxFailedRules})`);

    if (!confidenceOk)
      factors.push(
        `Confidence ${score.confidence} below minimum ${financialCriteria.minConfidence}`,
      );

    const passed = scoreOk && passedOk && failedOk && confidenceOk;

    return { score: score.score, passed, factors, available: true };
  }

  private evaluateTechnical(score: TechnicalScore): DimensionEvaluation {
    const { technicalCriteria } = this.config;
    const factors: string[] = [];

    const scoreOk = score.score >= technicalCriteria.minScore;
    const confidenceOk = score.confidence >= technicalCriteria.minConfidence;

    if (scoreOk) factors.push(`Score ${score.score} meets minimum ${technicalCriteria.minScore}`);
    else factors.push(`Score ${score.score} below minimum ${technicalCriteria.minScore}`);

    if (confidenceOk) factors.push(`Confidence ${score.confidence} meets minimum`);
    else
      factors.push(
        `Confidence ${score.confidence} below minimum ${technicalCriteria.minConfidence}`,
      );

    const passed = scoreOk && confidenceOk;

    return { score: score.score, passed, factors };
  }

  private evaluateConfluence(confluence: ConfluenceResult): DimensionEvaluation {
    const { confluenceCriteria } = this.config;
    const factors: string[] = [];

    const scoreOk = confluence.confluenceScore >= confluenceCriteria.minScore;
    const confidenceOk = confluence.confidence >= confluenceCriteria.minConfidence;

    if (scoreOk)
      factors.push(
        `Confluence ${confluence.confluenceScore} meets minimum ${confluenceCriteria.minScore}`,
      );
    else
      factors.push(
        `Confluence ${confluence.confluenceScore} below minimum ${confluenceCriteria.minScore}`,
      );

    if (confidenceOk) factors.push(`Confidence ${confluence.confidence} meets minimum`);
    else
      factors.push(
        `Confidence ${confluence.confidence} below minimum ${confluenceCriteria.minConfidence}`,
      );

    const passed = scoreOk && confidenceOk;

    return { score: confluence.confluenceScore, passed, factors };
  }

  private calculateCandidateScore(
    financial: DimensionEvaluation,
    technical: DimensionEvaluation,
    confluence: DimensionEvaluation,
  ): number {
    const { dimensionWeights } = this.config;

    const available = [
      {
        score: financial.score,
        weight: financial.available === false ? 0 : dimensionWeights.financial,
      },
      { score: technical.score, weight: dimensionWeights.technical },
      { score: confluence.score, weight: dimensionWeights.confluence },
    ];

    const totalWeight = available.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight === 0) return 0;

    const score = available.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight;

    return Math.round(score * 10) / 10;
  }

  private determinePriority(score: number): CandidatePriority {
    const { scoreThresholds } = this.config;

    if (score >= scoreThresholds.veryHigh) return 'VERY_HIGH';
    if (score >= scoreThresholds.high) return 'HIGH';
    if (score >= scoreThresholds.medium) return 'MEDIUM';
    if (score >= scoreThresholds.low) return 'LOW';
    return 'REJECT';
  }

  private buildReasons(
    financial: DimensionEvaluation,
    technical: DimensionEvaluation,
    confluence: DimensionEvaluation,
    candidateScore: number,
  ): string[] {
    const reasons: string[] = [];

    if (financial.passed) reasons.push('Financial quality meets criteria');
    else reasons.push('Financial quality below criteria');

    if (technical.passed) reasons.push('Technical quality meets criteria');
    else reasons.push('Technical quality below criteria');

    if (confluence.passed) reasons.push('Confluence agreement meets criteria');
    else reasons.push('Confluence agreement below criteria');

    if (candidateScore >= this.config.scoreThresholds.high) {
      reasons.push('Strong overall candidate score');
    } else if (candidateScore < this.config.scoreThresholds.minCandidateScore) {
      reasons.push('Overall score too low for opportunity analysis');
    }

    return reasons;
  }

  private calculateConfidence(
    financialScore: FinancialScoreResult,
    technicalScore: TechnicalScore,
    confluence: ConfluenceResult,
  ): number {
    const confidence =
      (financialScore.dataStatus === 'UNAVAILABLE' ? 0 : financialScore.confidence * 0.3) +
      technicalScore.confidence * 0.3 +
      confluence.confidence * 0.4;

    const weight = (financialScore.dataStatus === 'UNAVAILABLE' ? 0 : 0.3) + 0.3 + 0.4;

    return weight > 0 ? Math.round((confidence / weight) * 100) / 100 : 0;
  }
}
