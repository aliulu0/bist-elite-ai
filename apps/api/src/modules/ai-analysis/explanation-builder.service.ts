import { Injectable } from '@nestjs/common';
import { ModuleResult, AnalysisSignal, SupportingMetric } from './ai-analysis.types';

@Injectable()
export class ExplanationBuilder {
  buildExplanation(
    overallScore: number,
    signal: AnalysisSignal,
    moduleResults: ModuleResult[],
  ): string {
    const parts: string[] = [];

    parts.push(this.getScoreDescription(overallScore));

    const topStrengths = this.collectTopItems(moduleResults, 'strengths', 3);
    if (topStrengths.length > 0) {
      parts.push(`Key strengths: ${topStrengths.join('; ')}`);
    }

    const topWeaknesses = this.collectTopItems(moduleResults, 'weaknesses', 2);
    if (topWeaknesses.length > 0) {
      parts.push(`Key concerns: ${topWeaknesses.join('; ')}`);
    }

    const topRisks = this.collectTopItems(moduleResults, 'risks', 2);
    if (topRisks.length > 0) {
      parts.push(`Risks: ${topRisks.join('; ')}`);
    }

    return parts.join('. ') + '.';
  }

  collectStrengths(moduleResults: ModuleResult[]): string[] {
    return this.collectTopItems(moduleResults, 'strengths', 10);
  }

  collectWeaknesses(moduleResults: ModuleResult[]): string[] {
    return this.collectTopItems(moduleResults, 'weaknesses', 10);
  }

  collectRisks(moduleResults: ModuleResult[]): string[] {
    return this.collectTopItems(moduleResults, 'risks', 10);
  }

  collectWarnings(moduleResults: ModuleResult[]): string[] {
    return this.collectTopItems(moduleResults, 'warnings', 10);
  }

  buildSupportingMetrics(moduleResults: ModuleResult[]): SupportingMetric[] {
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

  private collectTopItems(moduleResults: ModuleResult[], field: 'strengths' | 'weaknesses' | 'risks' | 'warnings', limit: number): string[] {
    const all: string[] = [];
    for (const result of moduleResults) {
      all.push(...result[field]);
    }
    const unique = [...new Set(all)];
    return unique.slice(0, limit);
  }

  private getScoreDescription(score: number): string {
    if (score >= 80) return 'Excellent overall analysis score indicating a strong investment opportunity';
    if (score >= 65) return 'Good overall analysis score with favorable conditions';
    if (score >= 55) return 'Moderate overall analysis score with mixed conditions';
    if (score >= 45) return 'Neutral overall analysis score with balanced risk-reward';
    if (score >= 35) return 'Below-average overall analysis score with emerging concerns';
    return 'Poor overall analysis score with significant concerns across multiple dimensions';
  }

  private getMetricDescription(key: string): string {
    const descriptions: Record<string, string> = {
      revenue: 'Total revenue',
      netProfit: 'Net profit',
      netMargin: 'Net profit margin (%)',
      grossMargin: 'Gross profit margin (%)',
      operatingMargin: 'Operating margin (%)',
      ebitda: 'EBITDA',
      ebitdaMargin: 'EBITDA margin (%)',
      equity: 'Total equity',
      totalDebt: 'Total debt',
      totalAssets: 'Total assets',
      debtRatio: 'Debt-to-asset ratio',
      debtToEquity: 'Debt-to-equity ratio',
      currentRatio: 'Current ratio',
      freeCashFlow: 'Free cash flow',
      operatingCashFlow: 'Operating cash flow',
      marketCap: 'Market capitalization',
      sharesOutstanding: 'Shares outstanding',
      bookValuePerShare: 'Book value per share',
      netAssetValue: 'Net asset value',
      equityRatio: 'Equity ratio',
      roe: 'Return on equity (%)',
      roa: 'Return on assets (%)',
      profitMargin: 'Profit margin (%)',
      financialLeverage: 'Financial leverage',
      assetLiabilityRatio: 'Asset-to-liability ratio',
      aggregationQuality: 'Data aggregation quality',
    };
    return descriptions[key] ?? key;
  }
}
