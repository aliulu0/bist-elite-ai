import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class ValuationAnalysisHandler implements IAnalysisModule {
  readonly name = 'valuation';
  readonly weight = 10;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (!input.balanceSheet && !input.incomeStatement && !input.company) {
      warnings.push('No data available for valuation analysis');
      return this.buildResult(50, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.company) {
      const company = input.company.data;
      if (company.marketCap !== null) {
        metrics.marketCap = company.marketCap;
        if (company.sharesOutstanding !== null && company.sharesOutstanding > 0) {
          metrics.sharesOutstanding = company.sharesOutstanding;
        }
      }
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;

      if (bs.equity !== null && company_sharesOutstanding(input) !== null && company_sharesOutstanding(input)! > 0) {
        const bookValuePerShare = bs.equity / company_sharesOutstanding(input)!;
        metrics.bookValuePerShare = bookValuePerShare;
      }

      if (bs.totalAssets !== null) metrics.totalAssets = bs.totalAssets;
      if (bs.equity !== null) metrics.equity = bs.equity;
      if (bs.totalDebt !== null) metrics.totalDebt = bs.totalDebt;

      if (bs.equity !== null && bs.totalAssets !== null && bs.totalAssets > 0) {
        const equityRatio = bs.equity / bs.totalAssets;
        metrics.equityRatio = equityRatio;
        if (equityRatio > 0.6) {
          strengths.push('High equity ratio indicates asset-backed value');
          score += 8;
        } else if (equityRatio < 0.3) {
          weaknesses.push('Low equity ratio');
          score -= 5;
        }
      }

      if (bs.totalAssets !== null && bs.totalDebt !== null) {
        const netAssetValue = bs.totalAssets - bs.totalDebt;
        metrics.netAssetValue = netAssetValue;
        if (netAssetValue > 0) {
          strengths.push('Positive net asset value');
          score += 5;
        } else {
          weaknesses.push('Negative net asset value');
          score -= 10;
          risks.push('Insolvent balance sheet');
        }
      }
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.netProfit !== null) metrics.netProfit = income.netProfit;
      if (income.revenue !== null) metrics.revenue = income.revenue;
      if (income.ebitda !== null) metrics.ebitda = income.ebitda;

      if (income.netProfit !== null && income.revenue !== null && income.revenue > 0) {
        const netMargin = (income.netProfit / income.revenue) * 100;
        metrics.netMargin = netMargin;
        if (netMargin > 20) {
          strengths.push('High net margin supports premium valuation');
          score += 8;
        } else if (netMargin > 10) {
          score += 3;
        } else if (netMargin < 0) {
          weaknesses.push('Negative net margin');
          score -= 8;
        }
      }

      if (income.grossProfit !== null && income.costOfRevenue !== null) {
        const totalCost = income.costOfRevenue;
        if (totalCost > 0) {
          const grossMargin = (income.grossProfit / totalCost) * 100;
          metrics.grossMargin = grossMargin;
        }
      }
    }

    if (input.financials) {
      const fin = input.financials.data;
      if (fin.ebitda !== null) metrics.previousEbitda = fin.ebitda;
      if (fin.netIncome !== null) metrics.previousNetIncome = fin.netIncome;
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
    if (input.balanceSheet) confidence += 25;
    if (input.incomeStatement) confidence += 25;
    if (input.company) confidence += 15;
    if (input.financials) confidence += 10;
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
    if (score > 70) parts.push('Attractive valuation');
    else if (score > 55) parts.push('Fair valuation');
    else if (score > 45) parts.push('Neutral valuation');
    else parts.push('Overvalued or weak fundamentals');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}

function company_sharesOutstanding(input: PipelineInput): number | null {
  return input.company?.data?.sharesOutstanding ?? null;
}
