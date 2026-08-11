import { Injectable } from '@nestjs/common';
import {
  DetectionModuleResult,
  OpportunityLevel,
  OpportunityType,
  ConfirmationLevel,
  OpportunityAge,
  SupportingMetric,
  PenaltyRecord,
} from '../opportunity-detection.types';

@Injectable()
export class ExplanationEngine {
  buildExplanation(
    opportunityScore: number,
    level: OpportunityLevel,
    types: OpportunityType[],
    confirmationLevel: ConfirmationLevel,
    strengths: string[],
    weaknesses: string[],
    penalties: PenaltyRecord[],
  ): string {
    const parts: string[] = [];

    parts.push(this.getScoreDescription(opportunityScore));
    parts.push(`Opportunity level: ${level}`);

    if (types.length > 0) {
      parts.push(`Type: ${types.join(', ')}`);
    }

    if (confirmationLevel !== 'NONE') {
      parts.push(`Confirmation: ${confirmationLevel}`);
    }

    const topStrengths = strengths.slice(0, 3);
    if (topStrengths.length > 0) {
      parts.push(`Key drivers: ${topStrengths.join('; ')}`);
    }

    const topWeaknesses = weaknesses.slice(0, 2);
    if (topWeaknesses.length > 0) {
      parts.push(`Concerns: ${topWeaknesses.join('; ')}`);
    }

    if (penalties.length > 0) {
      parts.push(`Penalties applied: ${penalties.map((p) => p.type).join(', ')}`);
    }

    return parts.join('. ') + '.';
  }

  collectStrengths(moduleResults: DetectionModuleResult[]): string[] {
    const all: string[] = [];
    for (const result of moduleResults) {
      all.push(...result.strengths);
    }
    return [...new Set(all)].slice(0, 15);
  }

  collectWeaknesses(moduleResults: DetectionModuleResult[]): string[] {
    const all: string[] = [];
    for (const result of moduleResults) {
      all.push(...result.weaknesses);
    }
    return [...new Set(all)].slice(0, 15);
  }

  collectRisks(moduleResults: DetectionModuleResult[]): string[] {
    const all: string[] = [];
    for (const result of moduleResults) {
      all.push(...result.risks);
    }
    return [...new Set(all)].slice(0, 15);
  }

  collectWarnings(moduleResults: DetectionModuleResult[]): string[] {
    const all: string[] = [];
    for (const result of moduleResults) {
      all.push(...result.warnings);
    }
    return [...new Set(all)].slice(0, 15);
  }

  buildSupportingMetrics(moduleResults: DetectionModuleResult[]): SupportingMetric[] {
    const metrics: SupportingMetric[] = [];
    for (const result of moduleResults) {
      for (const [key, value] of Object.entries(result.metrics)) {
        metrics.push({
          name: key,
          value: typeof value === 'number' ? Math.round(value * 100) / 100 : value,
          description: this.getMetricDescription(key),
          module: result.module,
        });
      }
    }
    return metrics;
  }

  private getScoreDescription(score: number): string {
    if (score >= 85) return 'Exceptional opportunity with multiple strong factors';
    if (score >= 72) return 'Strong opportunity with good multi-factor alignment';
    if (score >= 60) return 'Emerging opportunity with developing factors';
    if (score >= 45) return 'Interesting opportunity worth monitoring';
    if (score >= 30) return 'Watch-level opportunity with early signals';
    return 'Limited opportunity potential';
  }

  private getMetricDescription(key: string): string {
    const descriptions: Record<string, string> = {
      technicalScore: 'Technical analysis score',
      momentumScore: 'Momentum analysis score',
      trendScore: 'Trend analysis score',
      fundamentalScore: 'Fundamental analysis score',
      valuationScore: 'Valuation analysis score',
      healthScore: 'Financial health score',
      liquidityScore: 'Liquidity analysis score',
      volatilityScore: 'Volatility analysis score',
      growthScore: 'Growth analysis score',
      riskScore: 'Risk analysis score',
      overallScore: 'Overall analysis score',
      marketCap: 'Market capitalization',
      compositeScore: 'Composite detection score',
      averageModuleScore: 'Average score across all modules',
      compressionScore: 'Volatility compression score',
      improvementScore: 'Improvement detection score',
      discountScore: 'Valuation discount score',
      qualityScore: 'Financial quality score',
      changeScore: 'Fundamental change score',
      interestScore: 'Institutional interest score',
      accelerationScore: 'Growth acceleration score',
      debtScore: 'Debt improvement score',
      sectorScore: 'Sector strength score',
      relativeScore: 'Relative strength score',
      maStructureScore: 'Moving average structure score',
      rsiScore: 'RSI behaviour score',
      macdScore: 'MACD behaviour score',
      atrScore: 'ATR expansion score',
      volumeScore: 'Volume behaviour score',
    };
    return descriptions[key] ?? key;
  }
}
