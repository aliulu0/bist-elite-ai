import { Injectable } from '@nestjs/common';
import { FinancialScoreResult } from '../financial-rules/score.types';
import { FinancialSummary } from '../financial-rules/summary.types';
import { TechnicalScore } from '../technical-score/technical-score.types';
import { TechnicalSummary } from '../technical-summary/technical-summary.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import { MarketStructureResult, TrendDirection } from '../market-structure/market-structure.types';
import { ConfluenceResult, AlignmentScore, AgreementLevel } from './confluence.types';
import { ConfluenceConfig, DEFAULT_CONFLUENCE_CONFIG } from './confluence.config';

export interface ConfluenceInput {
  financialScore: FinancialScoreResult;
  financialSummary: FinancialSummary;
  technicalScore: TechnicalScore;
  technicalSummary: TechnicalSummary;
  smartMoney: SmartMoneyResult;
  marketStructure: MarketStructureResult;
}

@Injectable()
export class ConfluenceEngine {
  private readonly config: ConfluenceConfig;

  constructor() {
    this.config = DEFAULT_CONFLUENCE_CONFIG;
  }

  evaluate(input: ConfluenceInput): ConfluenceResult {
    const financialAlignment = this.evaluateFinancial(input.financialScore, input.financialSummary);
    const technicalAlignment = this.evaluateTechnical(input.technicalScore, input.technicalSummary);
    const smartMoneyAlignment = this.evaluateSmartMoney(input.smartMoney);
    const trendAlignment = this.evaluateTrend(input.marketStructure);

    const { confluenceScore, agreement } = this.calculateConfluence(
      financialAlignment,
      technicalAlignment,
      smartMoneyAlignment,
      trendAlignment,
      input.financialScore.dataStatus !== 'UNAVAILABLE',
    );

    const confidence = this.calculateConfidence(
      input.financialScore,
      input.technicalScore,
      input.smartMoney,
      input.marketStructure,
    );

    const isValid = this.hasValidInputs(input);

    return {
      confluenceScore,
      agreement,
      financialAlignment,
      technicalAlignment,
      smartMoneyAlignment,
      trendAlignment,
      confidence,
      metadata: {
        configWeights: this.config.dimensionWeights,
        inputSymbol: input.financialScore.symbol,
        availableData: this.countAvailableData(input),
      },
      isValid,
    };
  }

  private evaluateFinancial(
    score: FinancialScoreResult,
    summary: FinancialSummary,
  ): AlignmentScore {
    if (score.dataStatus === 'UNAVAILABLE') {
      return {
        score: 0,
        direction: 'neutral',
        confidence: 0,
        factors: ['Financial data unavailable'],
      };
    }

    const factors: string[] = [];
    let directionScore = score.score;

    if (score.passedRules > score.failedRules) {
      factors.push(`${score.passedRules} rules passed`);
    } else if (score.failedRules > score.passedRules) {
      factors.push(`${score.failedRules} rules failed`);
    }

    if (summary.strengths.length > summary.weaknesses.length) {
      factors.push('More strengths than weaknesses');
    } else if (summary.weaknesses.length > summary.strengths.length) {
      factors.push('More weaknesses than strengths');
    }

    const direction = this.scoreToDirection(directionScore);
    const alignmentScore = this.normalizeScore(directionScore, direction);

    return {
      score: alignmentScore,
      direction,
      confidence: score.confidence,
      factors,
    };
  }

  private evaluateTechnical(score: TechnicalScore, summary: TechnicalSummary): AlignmentScore {
    const factors: string[] = [];

    if (score.grade === 'A+' || score.grade === 'A') {
      factors.push(`Grade ${score.grade} indicates strong technicals`);
    } else if (score.grade === 'C' || score.grade === 'D') {
      factors.push(`Grade ${score.grade} indicates weak technicals`);
    }

    if (summary.strengths.length > 0) {
      factors.push(`${summary.strengths.length} technical strengths`);
    }
    if (summary.weaknesses.length > 0) {
      factors.push(`${summary.weaknesses.length} technical weaknesses`);
    }

    const direction = this.scoreToDirection(score.score);
    const alignmentScore = this.normalizeScore(score.score, direction);

    return {
      score: alignmentScore,
      direction,
      confidence: score.confidence,
      factors,
    };
  }

  private evaluateSmartMoney(smartMoney: SmartMoneyResult): AlignmentScore {
    const factors: string[] = [];
    let directionScore: number;

    if (smartMoney.institutionalActivity === 'accumulating') {
      directionScore = 50 + smartMoney.accumulationScore * 50;
      factors.push('Institutional accumulation detected');
    } else if (smartMoney.institutionalActivity === 'distributing') {
      directionScore = 50 - smartMoney.distributionScore * 50;
      factors.push('Institutional distribution detected');
    } else {
      directionScore = 50;
      factors.push('Neutral institutional activity');
    }

    if (smartMoney.signals.length > 0) {
      factors.push(`${smartMoney.signals.length} smart money signals`);
    }

    const direction = this.scoreToDirection(directionScore);
    const alignmentScore = this.normalizeScore(directionScore, direction);

    return {
      score: alignmentScore,
      direction,
      confidence: smartMoney.smartMoneyConfidence,
      factors,
    };
  }

  private evaluateTrend(structure: MarketStructureResult): AlignmentScore {
    const factors: string[] = [];
    let directionScore: number;

    if (structure.trend === 'uptrend') {
      directionScore = 70;
      factors.push('Market structure confirms uptrend');
    } else if (structure.trend === 'downtrend') {
      directionScore = 30;
      factors.push('Market structure confirms downtrend');
    } else {
      directionScore = 50;
      factors.push('Sideways market structure');
    }

    if (structure.breakOfStructure.length > 0) {
      const bullishBos = structure.breakOfStructure.filter(
        (b) => b.type === 'HH' || b.type === 'HL',
      );
      if (bullishBos.length > 0) {
        directionScore = Math.min(100, directionScore + 10);
        factors.push(`${bullishBos.length} bullish structure breaks`);
      }
    }

    if (structure.changeOfCharacter.length > 0) {
      directionScore = Math.max(0, directionScore - 10);
      factors.push('Change of character detected');
    }

    const confidence = structure.isValid ? 0.8 : 0.2;
    const direction = this.scoreToDirection(directionScore);
    const alignmentScore = this.normalizeScore(directionScore, direction);

    return {
      score: alignmentScore,
      direction,
      confidence,
      factors,
    };
  }

  private calculateConfluence(
    financial: AlignmentScore,
    technical: AlignmentScore,
    smartMoney: AlignmentScore,
    trend: AlignmentScore,
    financialAvailable: boolean,
  ): { confluenceScore: number; agreement: AgreementLevel } {
    const { dimensionWeights } = this.config;

    const entries = [
      { alignment: financial, weight: financialAvailable ? dimensionWeights.financial : 0 },
      { alignment: technical, weight: dimensionWeights.technical },
      { alignment: smartMoney, weight: dimensionWeights.smartMoney },
      { alignment: trend, weight: dimensionWeights.trend },
    ];

    const available = entries.filter((e) => e.weight > 0);
    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);

    if (totalWeight === 0) {
      return { confluenceScore: 0, agreement: 'VERY_LOW' };
    }

    const confluenceScore =
      available.reduce((sum, e) => sum + e.alignment.score * e.weight, 0) / totalWeight;

    const agreement = this.determineAgreement(
      financial.direction,
      technical.direction,
      smartMoney.direction,
      trend.direction,
    );

    return { confluenceScore: Math.round(confluenceScore * 10) / 10, agreement };
  }

  private determineAgreement(
    ...directions: Array<'bullish' | 'bearish' | 'neutral'>
  ): AgreementLevel {
    const bullish = directions.filter((d) => d === 'bullish').length;
    const bearish = directions.filter((d) => d === 'bearish').length;
    const dominant = Math.max(bullish, bearish);
    const total = directions.length;

    const alignmentRatio = dominant / total;
    const score = alignmentRatio * 100;

    const { agreementThresholds } = this.config;

    if (score >= agreementThresholds.veryHigh) return 'VERY_HIGH';
    if (score >= agreementThresholds.high) return 'HIGH';
    if (score >= agreementThresholds.medium) return 'MEDIUM';
    if (score >= agreementThresholds.low) return 'LOW';
    return 'VERY_LOW';
  }

  private calculateConfidence(
    financialScore: FinancialScoreResult,
    technicalScore: TechnicalScore,
    smartMoney: SmartMoneyResult,
    marketStructure: MarketStructureResult,
  ): number {
    const { confidenceWeights } = this.config;
    const dataCompleteness = this.calculateDataCompleteness(
      financialScore,
      technicalScore,
      smartMoney,
      marketStructure,
    );

    const financialWeight =
      financialScore.dataStatus === 'UNAVAILABLE' ? 0 : confidenceWeights.financialConfidence;

    const totalWeight =
      financialWeight +
      confidenceWeights.technicalConfidence +
      confidenceWeights.smartMoneyConfidence +
      confidenceWeights.dataCompleteness;

    if (totalWeight === 0) return 0;

    const confidence =
      (financialScore.dataStatus === 'UNAVAILABLE'
        ? 0
        : financialScore.confidence * confidenceWeights.financialConfidence) +
      technicalScore.confidence * confidenceWeights.technicalConfidence +
      smartMoney.smartMoneyConfidence * confidenceWeights.smartMoneyConfidence +
      dataCompleteness * confidenceWeights.dataCompleteness;

    return Math.round((confidence / totalWeight) * 100) / 100;
  }

  private calculateDataCompleteness(
    financialScore: FinancialScoreResult,
    technicalScore: TechnicalScore,
    smartMoney: SmartMoneyResult,
    marketStructure: MarketStructureResult,
  ): number {
    let available = 0;
    let total = 0;

    if (financialScore.dataStatus !== 'UNAVAILABLE' && financialScore.symbol) available++;
    total++;
    if (technicalScore.isValid) available++;
    total++;
    if (smartMoney.isValid) available++;
    total++;
    if (marketStructure.isValid) available++;
    total++;

    return total > 0 ? available / total : 0;
  }

  private countAvailableData(input: ConfluenceInput): number {
    let count = 0;
    if (input.financialScore.dataStatus !== 'UNAVAILABLE' && input.financialScore.symbol) count++;
    if (input.technicalScore.isValid) count++;
    if (input.smartMoney.isValid) count++;
    if (input.marketStructure.isValid) count++;
    return count;
  }

  private hasValidInputs(input: ConfluenceInput): boolean {
    return !!(
      input.financialScore.symbol &&
      input.technicalScore &&
      input.smartMoney &&
      input.marketStructure
    );
  }

  private scoreToDirection(score: number): 'bullish' | 'bearish' | 'neutral' {
    if (score >= this.config.scoreToDirection.bullishThreshold) return 'bullish';
    if (score <= this.config.scoreToDirection.bearishThreshold) return 'bearish';
    return 'neutral';
  }

  private normalizeScore(score: number, direction: 'bullish' | 'bearish' | 'neutral'): number {
    if (direction === 'bullish') return Math.min(100, 50 + (score - 50));
    if (direction === 'bearish') return Math.max(0, 50 - (50 - score));
    return 50;
  }
}
