import { Injectable } from '@nestjs/common';
import {
  ConfidenceExplanation,
  ExplanationInput,
  IndicatorEvidence,
  Timeframe,
  TrendDirection,
} from './types';
import { getConfidenceDescription } from './turkish-terms';

@Injectable()
export class ConfidenceCalculator {
  calculate(input: ExplanationInput): ConfidenceExplanation {
    const indicatorAgreement = this.calculateIndicatorAgreement(input.indicators || []);
    const strategyAgreement = this.calculateStrategyAgreement(input);
    const historicalSimilarity = this.calculateHistoricalSimilarity(input);
    const signalQuality = this.calculateSignalQuality(input);
    const marketConditions = this.calculateMarketConditions(input);

    const weights = {
      indicatorAgreement: 0.30,
      strategyAgreement: 0.25,
      historicalSimilarity: 0.20,
      signalQuality: 0.15,
      marketConditions: 0.10,
    };

    const composite =
      indicatorAgreement * weights.indicatorAgreement +
      strategyAgreement * weights.strategyAgreement +
      historicalSimilarity * weights.historicalSimilarity +
      signalQuality * weights.signalQuality +
      marketConditions * weights.marketConditions;

    const score = Math.min(1, Math.max(0, composite));
    const factors = this.buildFactorList(indicatorAgreement, strategyAgreement, historicalSimilarity, signalQuality, marketConditions);

    return {
      score,
      indicatorAgreement,
      strategyAgreement,
      historicalSimilarity,
      signalQuality,
      marketConditions,
      description: getConfidenceDescription(score),
      factors,
    };
  }

  private calculateIndicatorAgreement(indicators: IndicatorEvidence[]): number {
    if (indicators.length === 0) return 0.5;

    const positiveCount = indicators.filter(i => i.isPositive).length;
    const negativeCount = indicators.filter(i => !i.isPositive).length;
    const total = indicators.length;

    if (total === 0) return 0.5;

    const agreementRatio = Math.abs(positiveCount - negativeCount) / total;
    const weightedAgreement = this.applyDiminishingReturns(agreementRatio);

    const weightSum = indicators.reduce((sum, i) => sum + i.weight, 0);
    const avgWeight = total > 0 ? weightSum / total : 0;
    const weightFactor = Math.min(1, avgWeight * 2);

    return (weightedAgreement * 0.7 + weightFactor * 0.3);
  }

  private calculateStrategyAgreement(input: ExplanationInput): number {
    let score = 0.5;
    let factors = 0;

    if (input.technicalScore && input.financialScore) {
      const techDirection = input.technicalScore.composite >= 50 ? 1 : -1;
      const finDirection = input.financialScore.composite >= 50 ? 1 : -1;

      if (techDirection === finDirection) {
        score += 0.2;
      } else {
        score -= 0.2;
      }
      factors++;
    }

    if (input.eliteScore) {
      if (input.eliteScore.composite >= 60) {
        score += 0.15;
      } else if (input.eliteScore.composite <= 40) {
        score -= 0.15;
      }
      factors++;
    }

    if (input.decisionSignal) {
      if (input.decisionSignal.strength === 'STRONG' || input.decisionSignal.strength === 'VERY_STRONG') {
        score += 0.1;
      } else if (input.decisionSignal.strength === 'WEAK') {
        score -= 0.1;
      }
      factors++;
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateHistoricalSimilarity(input: ExplanationInput): number {
    let score = 0.5;

    if (input.technicalScore) {
      const components = [
        input.technicalScore.momentum,
        input.technicalScore.trend,
        input.technicalScore.volume,
        input.technicalScore.volatility,
      ].filter((v): v is number => v !== undefined);

      if (components.length > 0) {
        const variance = this.calculateVariance(components);
        if (variance < 200) {
          score += 0.15;
        } else if (variance > 600) {
          score -= 0.15;
        }
      }
    }

    if (input.indicators && input.indicators.length >= 5) {
      score += 0.1;
    }

    if (input.timeframeData) {
      const timeframes = Object.keys(input.timeframeData);
      if (timeframes.length >= 3) {
        score += 0.05;
      }
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateSignalQuality(input: ExplanationInput): number {
    let score = 0.5;

    if (input.decisionSignal) {
      const { entryPrice, targetPrice, stopLossPrice, riskRewardRatio } = input.decisionSignal;

      if (riskRewardRatio !== undefined) {
        if (riskRewardRatio >= 3) score += 0.2;
        else if (riskRewardRatio >= 2) score += 0.1;
        else if (riskRewardRatio < 1) score -= 0.1;
      }

      if (entryPrice !== undefined && targetPrice !== undefined && stopLossPrice !== undefined) {
        const hasCompleteSetup = true;
        if (hasCompleteSetup) score += 0.1;
      }
    }

    if (input.confidenceScore) {
      if (input.confidenceScore.dataQuality >= 0.8) {
        score += 0.1;
      } else if (input.confidenceScore.dataQuality < 0.5) {
        score -= 0.1;
      }
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateMarketConditions(input: ExplanationInput): number {
    let score = 0.5;

    if (input.riskFactors) {
      const highRisks = input.riskFactors.filter(
        r => r.severity === 'high' || r.severity === 'critical',
      );
      score -= highRisks.length * 0.1;
    }

    if (input.indicators) {
      const adxIndicator = input.indicators.find(i => i.indicator === 'ADX');
      if (adxIndicator) {
        if (adxIndicator.value >= 25) {
          score += 0.1;
        } else {
          score -= 0.05;
        }
      }
    }

    return Math.min(1, Math.max(0, score));
  }

  private applyDiminishingReturns(value: number): number {
    return 1 - Math.exp(-3 * value);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private buildFactorList(
    indicatorAgreement: number,
    strategyAgreement: number,
    historicalSimilarity: number,
    signalQuality: number,
    marketConditions: number,
  ): string[] {
    const factors: string[] = [];

    if (indicatorAgreement >= 0.7) {
      factors.push('Göstergeler güçlü uyum içinde');
    } else if (indicatorAgreement < 0.4) {
      factors.push('Göstergeler çelişkili sinyaller üretiyor');
    }

    if (strategyAgreement >= 0.7) {
      factors.push('Teknik ve finansal analiz uyumlu');
    } else if (strategyAgreement < 0.4) {
      factors.push('Teknik ve finansal analiz çelişiyor');
    }

    if (historicalSimilarity >= 0.7) {
      factors.push('Tarihsel benzerlik güçlü');
    } else if (historicalSimilarity < 0.4) {
      factors.push('Tarihsel veriler yetersiz');
    }

    if (signalQuality >= 0.7) {
      factors.push('Sinyal kalitesi yüksek');
    } else if (signalQuality < 0.4) {
      factors.push('Sinyal kalitesi düşük');
    }

    if (marketConditions >= 0.6) {
      factors.push('Piyasa koşulları uygun');
    } else if (marketConditions < 0.4) {
      factors.push('Piyasa koşulları belirsiz');
    }

    return factors;
  }
}
