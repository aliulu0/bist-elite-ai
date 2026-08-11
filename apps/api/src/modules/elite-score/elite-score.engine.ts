import { Injectable } from '@nestjs/common';
import { OpportunityResult } from '../opportunity/opportunity.types';
import { CandidateResult, CandidatePriority } from '../candidate/candidate.types';
import { ConfluenceResult, AgreementLevel } from '../confluence/confluence.types';
import { FinancialScoreResult, ScoreGrade } from '../financial-rules/score.types';
import { TechnicalScore, TechnicalGrade } from '../technical-score/technical-score.types';
import {
  EliteScoreResult,
  EliteScoreRating,
  EliteScorePriority,
  EliteScoreBreakdown,
} from './elite-score.types';
import { EliteScoreConfig, DEFAULT_ELITE_SCORE_CONFIG } from './elite-score.config';

export interface EliteScoreInput {
  symbol: string;
  opportunity: OpportunityResult;
  candidate: CandidateResult;
  confluence: ConfluenceResult;
  financialScore: FinancialScoreResult;
  technicalScore: TechnicalScore;
}

const GRADE_MAP: Record<ScoreGrade, number> = { 'A+': 95, A: 85, B: 72, C: 58, D: 40 };
const TECHNICAL_GRADE_MAP: Record<TechnicalGrade, number> = { 'A+': 95, A: 85, B: 72, C: 58, D: 40 };

const AGREEMENT_MAP: Record<AgreementLevel, number> = {
  VERY_HIGH: 95,
  HIGH: 80,
  MEDIUM: 60,
  LOW: 35,
  VERY_LOW: 15,
};

const CANDIDATE_PRIORITY_MAP: Record<CandidatePriority, number> = {
  VERY_HIGH: 95,
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
  REJECT: 10,
};

@Injectable()
export class EliteScoreEngine {
  private readonly config: EliteScoreConfig;

  constructor() {
    this.config = DEFAULT_ELITE_SCORE_CONFIG;
  }

  evaluate(input: EliteScoreInput): EliteScoreResult {
    const { symbol, opportunity, candidate, confluence, financialScore, technicalScore } = input;

    if (!opportunity || !opportunity.isValid) {
      return this.emptyResult(symbol, 'Opportunity data missing or invalid');
    }

    if (!candidate || !candidate.isValid) {
      return this.emptyResult(symbol, 'Candidate data missing or invalid');
    }

    if (!financialScore) {
      return this.emptyResult(symbol, 'Financial score missing');
    }

    if (!technicalScore) {
      return this.emptyResult(symbol, 'Technical score missing');
    }

    const breakdown = this.buildBreakdown(opportunity, candidate, confluence, financialScore, technicalScore);
    const eliteScore = this.calculateEliteScore(breakdown);
    const confidence = this.calculateConfidence(candidate, confluence, financialScore, technicalScore);
    const earlyOpportunity = opportunity.earlyOpportunity && confidence >= this.config.minConfidenceForEarlyOpportunity;
    const rating = this.determineRating(eliteScore);
    const priority = this.determinePriority(eliteScore, candidate.priority);
    const summary = this.buildSummary(rating, priority, eliteScore, confidence, earlyOpportunity, candidate.priority);

    return {
      eliteScore,
      rating,
      priority,
      confidence,
      earlyOpportunity,
      summary,
      breakdown,
      metadata: {
        symbol,
        candidatePriority: candidate.priority,
        opportunityLevel: opportunity.opportunityLevel,
        financialGrade: financialScore.grade,
        technicalGrade: technicalScore.grade,
        confluenceAgreement: confluence.agreement,
      },
      isValid: true,
    };
  }

  private buildBreakdown(
    opportunity: OpportunityResult,
    candidate: CandidateResult,
    confluence: ConfluenceResult,
    financialScore: FinancialScoreResult,
    technicalScore: TechnicalScore,
  ): EliteScoreBreakdown {
    return {
      financial: this.dimensionBreakdown(financialScore.score, this.config.dimensionWeights.financial),
      technical: this.dimensionBreakdown(technicalScore.score, this.config.dimensionWeights.technical),
      opportunity: this.dimensionBreakdown(opportunity.opportunityScore, this.config.dimensionWeights.opportunity),
      confluence: this.dimensionBreakdown(confluence.confluenceScore, this.config.dimensionWeights.confluence),
      candidate: this.dimensionBreakdown(candidate.candidateScore, this.config.dimensionWeights.candidate),
    };
  }

  private dimensionBreakdown(score: number, weight: number) {
    const normalized = this.normalize(score);
    return {
      score: normalized,
      weight,
      contribution: normalized * weight / 100,
    };
  }

  private calculateEliteScore(breakdown: EliteScoreBreakdown): number {
    const total =
      breakdown.financial.contribution +
      breakdown.technical.contribution +
      breakdown.opportunity.contribution +
      breakdown.confluence.contribution +
      breakdown.candidate.contribution;

    return Math.round(Math.min(100, Math.max(0, total)));
  }

  private calculateConfidence(
    candidate: CandidateResult,
    confluence: ConfluenceResult,
    financialScore: FinancialScoreResult,
    technicalScore: TechnicalScore,
  ): number {
    const scores = [
      candidate.confidence,
      confluence.confidence,
      financialScore.confidence,
      technicalScore.confidence,
    ];
    const valid = scores.filter((s) => typeof s === 'number' && !isNaN(s));
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  private determineRating(score: number): EliteScoreRating {
    const t = this.config.ratingThresholds;
    if (score >= t.aaa) return 'AAA';
    if (score >= t.aa) return 'AA';
    if (score >= t.a) return 'A';
    if (score >= t.bbb) return 'BBB';
    if (score >= t.bb) return 'BB';
    if (score >= t.b) return 'B';
    if (score >= t.c) return 'C';
    return 'D';
  }

  private determinePriority(
    score: number,
    candidatePriority: CandidatePriority,
  ): EliteScorePriority {
    const t = this.config.priorityThresholds;
    if (score >= t.critical) return 'CRITICAL';
    if (score >= t.veryHigh) return 'VERY_HIGH';
    if (score >= t.high) return 'HIGH';
    if (score >= t.medium) return 'MEDIUM';
    if (score >= t.low) return 'LOW';
    return 'NONE';
  }

  private buildSummary(
    rating: EliteScoreRating,
    priority: EliteScorePriority,
    score: number,
    confidence: number,
    earlyOpportunity: boolean,
    candidatePriority: CandidatePriority,
  ): string {
    if (priority === 'NONE') {
      return `Elite score ${score}/100 (${rating}). Not recommended. Candidate priority: ${candidatePriority}.`;
    }
    const early = earlyOpportunity ? 'Early opportunity identified.' : '';
    return `Elite score ${score}/100 (${rating}). Priority: ${priority}. Confidence: ${(confidence * 100).toFixed(0)}%. ${early}`;
  }

  private normalize(score: number): number {
    return Math.min(100, Math.max(0, score));
  }

  private emptyResult(symbol: string, reason: string): EliteScoreResult {
    return {
      eliteScore: 0,
      rating: 'D',
      priority: 'NONE',
      confidence: 0,
      earlyOpportunity: false,
      summary: reason,
      breakdown: {
        financial: { score: 0, weight: this.config.dimensionWeights.financial, contribution: 0 },
        technical: { score: 0, weight: this.config.dimensionWeights.technical, contribution: 0 },
        opportunity: { score: 0, weight: this.config.dimensionWeights.opportunity, contribution: 0 },
        confluence: { score: 0, weight: this.config.dimensionWeights.confluence, contribution: 0 },
        candidate: { score: 0, weight: this.config.dimensionWeights.candidate, contribution: 0 },
      },
      metadata: { symbol, reason },
      isValid: false,
    };
  }
}
