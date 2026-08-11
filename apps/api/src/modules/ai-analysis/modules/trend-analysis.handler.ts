import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class TrendAnalysisHandler implements IAnalysisModule {
  readonly name = 'trend';
  readonly weight = 10;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (!input.company) {
      warnings.push('No company data for trend analysis');
      return this.buildResult(50, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    const company = input.company.data;

    if (company.sector && company.sector !== 'Unknown') {
      metrics.sectorRelevance = 1;
      strengths.push(`Sector: ${company.sector}`);
    } else {
      warnings.push('Unknown sector classification');
      metrics.sectorRelevance = 0;
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.revenue !== null) {
        metrics.revenue = income.revenue;
        if (income.revenue > 0) {
          strengths.push('Positive revenue base');
          score += 5;
        }
      }
      if (income.netProfit !== null) {
        metrics.netProfit = income.netProfit;
        if (income.netProfit > 0) {
          strengths.push('Positive net profit trend');
          score += 8;
        } else {
          weaknesses.push('Negative net profit');
          score -= 8;
        }
      }
      if (income.ebitda !== null) {
        metrics.ebitda = income.ebitda;
        if (income.ebitda > 0) {
          strengths.push('Positive EBITDA trend');
          score += 5;
        }
      }
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;
      if (bs.totalAssets !== null) metrics.totalAssets = bs.totalAssets;
      if (bs.equity !== null && bs.totalAssets !== null && bs.totalAssets > 0) {
        const equityRatio = bs.equity / bs.totalAssets;
        metrics.equityRatio = equityRatio;
        if (equityRatio > 0.5) {
          strengths.push('Strong equity position supports positive trend');
          score += 8;
        } else if (equityRatio < 0.2) {
          weaknesses.push('Weak equity position');
          score -= 8;
          risks.push('Equity erosion risk');
        }
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.operatingCashFlow !== null) metrics.operatingCashFlow = cf.operatingCashFlow;
      if (cf.freeCashFlow !== null) {
        metrics.freeCashFlow = cf.freeCashFlow;
        if (cf.freeCashFlow > 0) {
          strengths.push('Positive free cash flow trend');
          score += 8;
        } else {
          weaknesses.push('Negative free cash flow');
          score -= 5;
        }
      }
    }

    if (input.financials) {
      const fin = input.financials.data;
      if (fin.revenue !== null) metrics.previousRevenue = fin.revenue;
      if (fin.netIncome !== null) metrics.previousNetIncome = fin.netIncome;
    }

    if (input.company?.metadata?.qualityScore) {
      metrics.aggregationQuality = input.company.metadata.qualityScore;
      if (input.company.metadata.qualityScore > 80) {
        strengths.push('High data quality supports reliable trend analysis');
        score += 3;
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
    if (input.company) confidence += 15;
    if (input.incomeStatement) confidence += 20;
    if (input.balanceSheet) confidence += 20;
    if (input.cashFlow) confidence += 15;
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
    if (score > 70) parts.push('Strong positive trend');
    else if (score > 55) parts.push('Moderate positive trend');
    else if (score > 45) parts.push('Neutral trend');
    else parts.push('Negative trend');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
