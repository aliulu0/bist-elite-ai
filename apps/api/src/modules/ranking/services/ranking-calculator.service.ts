import { Injectable } from '@nestjs/common';
import { RankingFactorWeights, RankingFactor, RankingConfig } from '../ranking.types';
import { ScannerResult } from '../../scanner/scanner.types';

@Injectable()
export class RankingCalculator {
  private readonly weights: RankingFactorWeights;

  constructor(weights: RankingFactorWeights) {
    this.weights = weights;
  }

  calculateFactors(
    candidate: ScannerResult,
    historicalConsistency: number,
  ): RankingFactor[] {
    const freshness = this.calculateFreshness(candidate.timestamp);
    const ageFactor = this.calculateAgeFactor(candidate.age);
    const confirmationFactor = this.calculateConfirmationFactor(candidate);

    return [
      {
        name: 'opportunityScore',
        rawValue: candidate.opportunityScore,
        normalizedValue: candidate.opportunityScore,
        weight: this.weights.opportunityScore,
        contribution: 0,
        description: 'Core opportunity signal from detection engine',
      },
      {
        name: 'scannerScore',
        rawValue: candidate.scannerScore,
        normalizedValue: candidate.scannerScore,
        weight: this.weights.scannerScore,
        contribution: 0,
        description: 'Scanner composite score',
      },
      {
        name: 'confidence',
        rawValue: candidate.confidence,
        normalizedValue: candidate.confidence,
        weight: this.weights.confidence,
        contribution: 0,
        description: 'Data and analysis confidence',
      },
      {
        name: 'risk',
        rawValue: 100 - candidate.risk,
        normalizedValue: 100 - candidate.risk,
        weight: this.weights.risk,
        contribution: 0,
        description: 'Inverted risk (lower risk = higher score)',
      },
      {
        name: 'trendStrength',
        rawValue: this.extractMetric(candidate, 'trendStrength', 'trendTransition', 50),
        normalizedValue: 0,
        weight: this.weights.trendStrength,
        contribution: 0,
        description: 'Trend alignment strength',
      },
      {
        name: 'momentum',
        rawValue: this.extractMetric(candidate, 'momentum', 'momentumShift', 50),
        normalizedValue: 0,
        weight: this.weights.momentum,
        contribution: 0,
        description: 'Price momentum indicator',
      },
      {
        name: 'sectorStrength',
        rawValue: this.extractMetric(candidate, 'sectorStrength', 'sectorStrength', 50),
        normalizedValue: 0,
        weight: this.weights.sectorStrength,
        contribution: 0,
        description: 'Sector tailwind indicator',
      },
      {
        name: 'liquidity',
        rawValue: this.extractMetric(candidate, 'liquidity', 'liquidityImprovement', 50),
        normalizedValue: 0,
        weight: this.weights.liquidity,
        contribution: 0,
        description: 'Tradeability and liquidity',
      },
      {
        name: 'financialQuality',
        rawValue: this.extractMetric(candidate, 'financialQuality', 'financialQuality', 50),
        normalizedValue: 0,
        weight: this.weights.financialQuality,
        contribution: 0,
        description: 'Financial health quality',
      },
      {
        name: 'growth',
        rawValue: this.extractMetric(candidate, 'growth', 'growthAcceleration', 50),
        normalizedValue: 0,
        weight: this.weights.growth,
        contribution: 0,
        description: 'Growth potential',
      },
      {
        name: 'valuation',
        rawValue: this.extractMetric(candidate, 'valuation', 'valuationDiscount', 50),
        normalizedValue: 0,
        weight: this.weights.valuation,
        contribution: 0,
        description: 'Valuation attractiveness',
      },
      {
        name: 'providerConfidence',
        rawValue: candidate.metadata?.providerConfidence ?? 50,
        normalizedValue: 0,
        weight: this.weights.providerConfidence,
        contribution: 0,
        description: 'Provider data confidence',
      },
      {
        name: 'aggregationQuality',
        rawValue: candidate.metadata?.aggregationQuality ?? 50,
        normalizedValue: 0,
        weight: this.weights.aggregationQuality,
        contribution: 0,
        description: 'Data aggregation quality',
      },
      {
        name: 'freshness',
        rawValue: freshness,
        normalizedValue: 0,
        weight: this.weights.freshness,
        contribution: 0,
        description: 'Data freshness recency',
      },
      {
        name: 'confirmation',
        rawValue: confirmationFactor,
        normalizedValue: 0,
        weight: this.weights.confirmation,
        contribution: 0,
        description: 'Confirmation level strength',
      },
      {
        name: 'historicalConsistency',
        rawValue: historicalConsistency,
        normalizedValue: 0,
        weight: this.weights.historicalConsistency,
        contribution: 0,
        description: 'Historical ranking consistency',
      },
      {
        name: 'duplicatePenalty',
        rawValue: candidate.metadata?.duplicateCount ?? 0,
        normalizedValue: 0,
        weight: this.weights.duplicatePenalty,
        contribution: 0,
        description: 'Duplicate signal penalty',
      },
      {
        name: 'age',
        rawValue: ageFactor,
        normalizedValue: 0,
        weight: this.weights.age,
        contribution: 0,
        description: 'Opportunity lifecycle position',
      },
    ];
  }

  calculateRawScore(factors: RankingFactor[]): number {
    let score = 0;
    for (const f of factors) {
      score += f.normalizedValue * f.weight;
    }
    return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
  }

  private extractMetric(candidate: ScannerResult, metricName: string, moduleName: string, fallback: number): number {
    const metric = candidate.metadata?.supportingMetrics?.find(
      (m) => m.name === metricName || m.module === moduleName,
    );
    return metric && typeof metric.value === 'number' ? metric.value : fallback;
  }

  private calculateFreshness(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (age < oneDay) return 100;
    if (age < 3 * oneDay) return 80;
    if (age < 7 * oneDay) return 60;
    if (age < 30 * oneDay) return 40;
    return 20;
  }

  private calculateAgeFactor(age: string): number {
    switch (age) {
      case 'NEW': return 100;
      case 'GROWING': return 85;
      case 'STABLE': return 60;
      case 'WEAKENING': return 30;
      case 'EXPIRED': return 5;
      default: return 50;
    }
  }

  private calculateConfirmationFactor(candidate: ScannerResult): number {
    const level = candidate.opportunityLevel;
    switch (level) {
      case 'EXCEPTIONAL': return 100;
      case 'VERY_STRONG': return 85;
      case 'STRONG': return 70;
      case 'EMERGING': return 55;
      case 'INTERESTING': return 40;
      case 'WATCH': return 25;
      case 'NONE': return 10;
      default: return 5;
    }
  }
}
