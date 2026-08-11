import { Injectable } from '@nestjs/common';
import { CandidateResult } from '../candidate/candidate.types';
import { ConfluenceResult, AgreementLevel } from '../confluence/confluence.types';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { OpportunityResult, OpportunityLevel } from './opportunity.types';
import { OpportunityConfig, DEFAULT_OPPORTUNITY_CONFIG } from './opportunity.config';

export interface OpportunityInput {
  symbol: string;
  candidate: CandidateResult;
  confluence: ConfluenceResult;
  financialScore: FinancialScoreResult;
  technicalScore: TechnicalScore;
  smartMoney: SmartMoneyResult;
  marketStructure: MarketStructureResult;
}

interface DimensionEvaluation {
  score: number;
  weight: number;
  contribution: number;
  strengths: string[];
  riskFactors: string[];
}

const AGREEMENT_RANK: Record<string, number> = {
  VERY_HIGH: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  VERY_LOW: 1,
};

@Injectable()
export class OpportunityEngine {
  private readonly config: OpportunityConfig;

  constructor() {
    this.config = DEFAULT_OPPORTUNITY_CONFIG;
  }

  evaluate(input: OpportunityInput): OpportunityResult {
    const {
      symbol,
      candidate,
      confluence,
      financialScore,
      technicalScore,
      smartMoney,
      marketStructure,
    } = input;

    if (!candidate || !candidate.isValid) {
      return this.emptyResult(symbol, 'Candidate data missing or invalid');
    }

    if (!candidate.candidate) {
      return this.emptyResult(symbol, 'Not a candidate — REJECT priority');
    }

    const financial = this.evaluateFinancial(financialScore);
    const technical = this.evaluateTechnical(technicalScore);
    const confluenceEval = this.evaluateConfluence(confluence);
    const smartMoneyEval = this.evaluateSmartMoney(smartMoney);
    const structureEval = this.evaluateMarketStructure(marketStructure);

    const opportunityScore = this.calculateOpportunityScore(
      financial,
      technical,
      confluenceEval,
      smartMoneyEval,
      structureEval,
    );

    const allStrengths = [
      ...financial.strengths,
      ...technical.strengths,
      ...confluenceEval.strengths,
      ...smartMoneyEval.strengths,
      ...structureEval.strengths,
    ];

    const allRiskFactors = [
      ...financial.riskFactors,
      ...technical.riskFactors,
      ...confluenceEval.riskFactors,
      ...smartMoneyEval.riskFactors,
      ...structureEval.riskFactors,
    ];

    const confidence = this.calculateConfidence(
      candidate,
      confluence,
      financialScore,
      technicalScore,
      smartMoney,
    );

    const earlyOpportunity =
      opportunityScore >= this.config.levelThresholds.low &&
      confidence >= this.config.minConfidenceForEarlyOpportunity;

    const opportunityLevel = this.determineLevel(opportunityScore, earlyOpportunity);

    const reasons = this.buildReasons(
      opportunityLevel,
      opportunityScore,
      earlyOpportunity,
      financial,
      technical,
      confluenceEval,
      smartMoneyEval,
      structureEval,
    );

    return {
      opportunityScore,
      earlyOpportunity,
      opportunityLevel,
      confidence,
      strengths: allStrengths,
      riskFactors: allRiskFactors,
      reasons,
      metadata: {
        symbol,
        candidateScore: candidate.candidateScore,
        candidatePriority: candidate.priority,
        dimensions: {
          financial: { score: financial.score, weight: financial.weight },
          technical: { score: technical.score, weight: technical.weight },
          confluence: { score: confluenceEval.score, weight: confluenceEval.weight },
          smartMoney: { score: smartMoneyEval.score, weight: smartMoneyEval.weight },
          marketStructure: { score: structureEval.score, weight: structureEval.weight },
        },
      },
      isValid: true,
    };
  }

  private evaluateFinancial(score: FinancialScoreResult): DimensionEvaluation {
    const strengths: string[] = [];
    const riskFactors: string[] = [];

    if (score.score >= this.config.financialQuality.minScore) {
      strengths.push(`Strong financial score: ${score.score}`);
    } else {
      riskFactors.push(`Weak financial score: ${score.score}`);
    }

    if (score.passedRules >= this.config.financialQuality.minPassedRules) {
      strengths.push(`${score.passedRules} financial rules passed`);
    } else {
      riskFactors.push(`Only ${score.passedRules} financial rules passed`);
    }

    if (score.failedRules <= this.config.financialQuality.maxFailedRules) {
      strengths.push(`${score.failedRules} financial rules failed (within limit)`);
    } else {
      riskFactors.push(`${score.failedRules} financial rules failed (exceeds limit)`);
    }

    const normalized = this.normalizeScore(score.score);
    return {
      score: normalized,
      weight: this.config.dimensionWeights.financial,
      contribution: normalized * this.config.dimensionWeights.financial / 100,
      strengths,
      riskFactors,
    };
  }

  private evaluateTechnical(score: TechnicalScore): DimensionEvaluation {
    const strengths: string[] = [];
    const riskFactors: string[] = [];

    if (score.score >= this.config.technicalQuality.minScore) {
      strengths.push(`Strong technical score: ${score.score}`);
    } else {
      riskFactors.push(`Weak technical score: ${score.score}`);
    }

    if (score.isValid) {
      strengths.push('Technical analysis is valid');
    } else {
      riskFactors.push('Technical analysis is invalid');
    }

    const normalized = this.normalizeScore(score.score);
    return {
      score: normalized,
      weight: this.config.dimensionWeights.technical,
      contribution: normalized * this.config.dimensionWeights.technical / 100,
      strengths,
      riskFactors,
    };
  }

  private evaluateConfluence(result: ConfluenceResult): DimensionEvaluation {
    const strengths: string[] = [];
    const riskFactors: string[] = [];

    if (result.confluenceScore >= this.config.confluence.minScore) {
      strengths.push(`Strong confluence: ${result.confluenceScore}`);
    } else {
      riskFactors.push(`Weak confluence: ${result.confluenceScore}`);
    }

    const agreementRank = AGREEMENT_RANK[result.agreement] ?? 0;
    const minAgreementRank = AGREEMENT_RANK[this.config.confluence.minAgreement] ?? 0;

    if (agreementRank >= minAgreementRank) {
      strengths.push(`Agreement level: ${result.agreement}`);
    } else {
      riskFactors.push(`Low agreement level: ${result.agreement}`);
    }

    const normalized = this.normalizeScore(result.confluenceScore);
    return {
      score: normalized,
      weight: this.config.dimensionWeights.confluence,
      contribution: normalized * this.config.dimensionWeights.confluence / 100,
      strengths,
      riskFactors,
    };
  }

  private evaluateSmartMoney(result: SmartMoneyResult): DimensionEvaluation {
    const strengths: string[] = [];
    const riskFactors: string[] = [];

    if (result.accumulationScore >= this.config.smartMoney.minAccumulationScore) {
      strengths.push(`Accumulation detected: ${result.accumulationScore}`);
    } else {
      riskFactors.push(`Low accumulation: ${result.accumulationScore}`);
    }

    if (this.config.smartMoney.preferInstitutionalActivity.includes(result.institutionalActivity)) {
      strengths.push(`Institutional activity: ${result.institutionalActivity}`);
    } else {
      riskFactors.push(`Unfavorable institutional activity: ${result.institutionalActivity}`);
    }

    if (result.distributionScore > 70) {
      riskFactors.push(`High distribution detected: ${result.distributionScore}`);
    }

    if (result.signals.length > 0) {
      strengths.push(`${result.signals.length} smart money signals detected`);
    }

    const normalized = this.normalizeScore(result.accumulationScore);
    return {
      score: normalized,
      weight: this.config.dimensionWeights.smartMoney,
      contribution: normalized * this.config.dimensionWeights.smartMoney / 100,
      strengths,
      riskFactors,
    };
  }

  private evaluateMarketStructure(result: MarketStructureResult): DimensionEvaluation {
    const strengths: string[] = [];
    const riskFactors: string[] = [];

    if (this.config.marketStructure.preferredTrends.includes(result.trend)) {
      strengths.push(`Favorable trend: ${result.trend}`);
    } else {
      riskFactors.push(`Unfavorable trend: ${result.trend}`);
    }

    if (result.supportZones.length >= this.config.marketStructure.minSupportZones) {
      strengths.push(`${result.supportZones.length} support zone(s) identified`);
    } else {
      riskFactors.push(`Insufficient support zones: ${result.supportZones.length}`);
    }

    if (result.resistanceZones.length <= this.config.marketStructure.maxResistanceZones) {
      strengths.push(`${result.resistanceZones.length} resistance zone(s) (within limit)`);
    } else {
      riskFactors.push(`Too many resistance zones: ${result.resistanceZones.length}`);
    }

    if (result.breakOfStructure.length > 0) {
      strengths.push('Break of structure detected');
    }

    if (result.changeOfCharacter.length > 0) {
      strengths.push('Change of character detected');
    }

    const trendScore = result.trend === 'uptrend' ? 80 : result.trend === 'sideways' ? 60 : 30;
    const zoneScore =
      result.supportZones.length > 0 && result.resistanceZones.length <= 1 ? 70 : 50;
    const structureScore = (trendScore + zoneScore) / 2;

    return {
      score: this.normalizeScore(structureScore),
      weight: this.config.dimensionWeights.marketStructure,
      contribution: this.normalizeScore(structureScore) * this.config.dimensionWeights.marketStructure / 100,
      strengths,
      riskFactors,
    };
  }

  private calculateOpportunityScore(
    financial: DimensionEvaluation,
    technical: DimensionEvaluation,
    confluenceEval: DimensionEvaluation,
    smartMoneyEval: DimensionEvaluation,
    structureEval: DimensionEvaluation,
  ): number {
    const total =
      financial.contribution +
      technical.contribution +
      confluenceEval.contribution +
      smartMoneyEval.contribution +
      structureEval.contribution;

    return Math.round(Math.min(100, Math.max(0, total)));
  }

  private calculateConfidence(
    candidate: CandidateResult,
    confluence: ConfluenceResult,
    financialScore: FinancialScoreResult,
    technicalScore: TechnicalScore,
    smartMoney: SmartMoneyResult,
  ): number {
    const scores = [
      candidate.confidence,
      confluence.confidence,
      financialScore.confidence,
      technicalScore.confidence,
      smartMoney.smartMoneyConfidence,
    ];

    const validScores = scores.filter((s) => typeof s === 'number' && !isNaN(s));
    if (validScores.length === 0) return 0;

    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  }

  private determineLevel(
    score: number,
    earlyOpportunity: boolean,
  ): OpportunityLevel {
    if (!earlyOpportunity) return 'NONE';

    if (score >= this.config.levelThresholds.veryHigh) return 'VERY_HIGH';
    if (score >= this.config.levelThresholds.high) return 'HIGH';
    if (score >= this.config.levelThresholds.medium) return 'MEDIUM';
    return 'LOW';
  }

  private buildReasons(
    level: OpportunityLevel,
    score: number,
    earlyOpportunity: boolean,
    financial: DimensionEvaluation,
    technical: DimensionEvaluation,
    confluenceEval: DimensionEvaluation,
    smartMoneyEval: DimensionEvaluation,
    structureEval: DimensionEvaluation,
  ): string[] {
    const reasons: string[] = [];

    if (!earlyOpportunity) {
      reasons.push('No early opportunity detected');
      return reasons;
    }

    reasons.push(`Early opportunity detected with level: ${level} (score: ${score})`);

    const allDimensions = [
      { name: 'Financial', eval: financial },
      { name: 'Technical', eval: technical },
      { name: 'Confluence', eval: confluenceEval },
      { name: 'Smart Money', eval: smartMoneyEval },
      { name: 'Market Structure', eval: structureEval },
    ];

    for (const dim of allDimensions) {
      if (dim.eval.strengths.length > 0) {
        reasons.push(`${dim.name} strength: ${dim.eval.strengths[0]}`);
      }
      if (dim.eval.riskFactors.length > 0) {
        reasons.push(`${dim.name} risk: ${dim.eval.riskFactors[0]}`);
      }
    }

    return reasons;
  }

  private normalizeScore(score: number): number {
    return Math.min(100, Math.max(0, score));
  }

  private emptyResult(symbol: string, reason: string): OpportunityResult {
    return {
      opportunityScore: 0,
      earlyOpportunity: false,
      opportunityLevel: 'NONE',
      confidence: 0,
      strengths: [],
      riskFactors: [reason],
      reasons: [reason],
      metadata: { symbol, reason },
      isValid: true,
    };
  }
}
