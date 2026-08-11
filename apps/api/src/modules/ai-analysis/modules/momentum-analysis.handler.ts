import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class MomentumAnalysisHandler implements IAnalysisModule {
  readonly name = 'momentum';
  readonly weight = 10;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const company = input.company?.data;
    if (!company) {
      warnings.push('No company data for momentum analysis');
      return this.buildResult(50, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.financials) {
      const fin = input.financials.data;
      if (fin.revenue !== null) metrics.revenue = fin.revenue;
      if (fin.netIncome !== null) metrics.netIncome = fin.netIncome;
      if (fin.ebitda !== null) metrics.ebitda = fin.ebitda;
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.revenue !== null && income.netProfit !== null && income.revenue > 0) {
        const profitMomentum = (income.netProfit / income.revenue) * 100;
        metrics.profitMomentum = profitMomentum;
        if (profitMomentum > 15) {
          strengths.push('Strong profit momentum');
          score += 10;
        } else if (profitMomentum > 5) {
          score += 3;
        } else if (profitMomentum < 0) {
          weaknesses.push('Negative profit momentum');
          score -= 8;
        }
      }

      if (income.grossProfit !== null && income.costOfRevenue !== null && income.costOfRevenue > 0) {
        const grossMargin = (income.grossProfit / (income.grossProfit + income.costOfRevenue)) * 100;
        metrics.grossMomentum = grossMargin;
        if (grossMargin > 40) {
          strengths.push('Strong gross margin momentum');
          score += 5;
        }
      }
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;
      if (bs.totalAssets !== null) metrics.totalAssets = bs.totalAssets;
      if (bs.equity !== null) metrics.equity = bs.equity;

      if (bs.equity !== null && bs.totalAssets !== null && bs.totalAssets > 0) {
        const equityMomentum = (bs.equity / bs.totalAssets) * 100;
        metrics.equityMomentum = equityMomentum;
        if (equityMomentum > 50) {
          strengths.push('Strong equity momentum');
          score += 5;
        } else if (equityMomentum < 20) {
          weaknesses.push('Weak equity momentum');
          score -= 5;
        }
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.freeCashFlow !== null) {
        metrics.freeCashFlow = cf.freeCashFlow;
        if (cf.freeCashFlow > 0) {
          strengths.push('Positive free cash flow momentum');
          score += 8;
        } else {
          weaknesses.push('Negative free cash flow');
          score -= 5;
        }
      }
    }

    if (company.marketCap !== null) {
      metrics.marketCap = company.marketCap;
      if (company.marketCap > 50_000_000_000) {
        strengths.push('Large market cap provides stability');
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
    let confidence = 25;
    if (input.incomeStatement) confidence += 25;
    if (input.balanceSheet) confidence += 20;
    if (input.cashFlow) confidence += 20;
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
    if (score > 70) parts.push('Strong momentum indicators');
    else if (score > 55) parts.push('Moderate momentum');
    else if (score > 45) parts.push('Neutral momentum');
    else parts.push('Weak momentum');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
