import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class GrowthAnalysisHandler implements IAnalysisModule {
  readonly name = 'growth';
  readonly weight = 10;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (!input.incomeStatement && !input.financials) {
      warnings.push('No financial statement data for growth analysis');
      return this.buildResult(50, 10, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.revenue !== null) metrics.currentRevenue = income.revenue;
      if (income.netProfit !== null) metrics.currentNetProfit = income.netProfit;
      if (income.grossProfit !== null) metrics.currentGrossProfit = income.grossProfit;

      if (income.netProfit !== null && income.revenue !== null && income.revenue > 0) {
        const netMargin = (income.netProfit / income.revenue) * 100;
        metrics.netMargin = netMargin;
        if (netMargin > 20) {
          strengths.push('Excellent net profit margin indicating strong profitability');
          score += 12;
        } else if (netMargin > 10) {
          strengths.push('Healthy net profit margin');
          score += 6;
        } else if (netMargin > 0) {
          score += 1;
        } else {
          weaknesses.push('Negative net profit margin');
          score -= 10;
        }
      }

      if (income.operatingIncome !== null && income.revenue !== null && income.revenue > 0) {
        const operatingMargin = (income.operatingIncome / income.revenue) * 100;
        metrics.operatingMargin = operatingMargin;
        if (operatingMargin > 15) {
          strengths.push('Strong operating margin');
          score += 5;
        }
      }

      if (income.ebitda !== null && income.revenue !== null && income.revenue > 0) {
        const ebitdaMargin = (income.ebitda / income.revenue) * 100;
        metrics.ebitdaMargin = ebitdaMargin;
      }
    }

    if (input.financials) {
      const fin = input.financials.data;
      if (fin.revenue !== null) metrics.previousRevenue = fin.revenue;
      if (fin.netIncome !== null) metrics.previousNetIncome = fin.netIncome;
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;
      if (bs.totalAssets !== null) metrics.totalAssets = bs.totalAssets;
      if (bs.equity !== null) {
        metrics.equity = bs.equity;
        if (bs.totalAssets !== null && bs.totalAssets > 0) {
          const roa = (metrics.netProfit ?? 0) / bs.totalAssets * 100;
          metrics.roa = roa;
          if (roa > 10) {
            strengths.push('Strong return on assets');
            score += 8;
          } else if (roa > 5) {
            score += 3;
          } else if (roa < 0) {
            weaknesses.push('Negative return on assets');
            score -= 5;
          }
        }
        if (bs.totalDebt !== null && bs.equity > 0) {
          const roe = (metrics.netProfit ?? 0) / bs.equity * 100;
          metrics.roe = roe;
          if (roe > 15) {
            strengths.push('Strong return on equity');
            score += 8;
          } else if (roe > 8) {
            score += 3;
          } else if (roe < 0) {
            weaknesses.push('Negative return on equity');
            score -= 5;
          }
        }
      }
    }

    return this.buildResult(
      Math.max(0, Math.min(100, score)),
      this.calculateConfidence(input),
      [],
      strengths,
      weaknesses,
      risks,
      warnings,
      metrics,
    );
  }

  private calculateConfidence(input: PipelineInput): number {
    let confidence = 20;
    if (input.incomeStatement) confidence += 30;
    if (input.balanceSheet) confidence += 25;
    if (input.financials) confidence += 15;
    return Math.min(100, confidence);
  }

  private buildResult(
    score: number,
    confidence: number,
    signals: string[],
    strengths: string[],
    weaknesses: string[],
    risks: string[],
    warnings: string[],
    metrics: Record<string, number>,
  ): ModuleResult {
    return {
      module: this.name,
      score,
      confidence,
      signals,
      strengths,
      weaknesses,
      risks,
      warnings,
      metrics,
      explanation: this.buildExplanation(score, strengths, weaknesses),
      metadata: {},
    };
  }

  private buildExplanation(score: number, strengths: string[], weaknesses: string[]): string {
    const parts: string[] = [];
    if (score > 70) parts.push('Strong growth profile');
    else if (score > 55) parts.push('Moderate growth profile');
    else if (score > 45) parts.push('Neutral growth profile');
    else parts.push('Weak growth profile');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
