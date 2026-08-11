import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class FundamentalAnalysisHandler implements IAnalysisModule {
  readonly name = 'fundamental';
  readonly weight = 12;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const hasIncome = !!input.incomeStatement;
    const hasBalance = !!input.balanceSheet;
    const hasCashFlow = !!input.cashFlow;

    if (!hasIncome && !hasBalance && !hasCashFlow) {
      warnings.push('No financial statement data available');
      return this.buildResult(0, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.revenue !== null) metrics.revenue = income.revenue;
      if (income.netProfit !== null) metrics.netProfit = income.netProfit;
      if (income.ebitda !== null) metrics.ebitda = income.ebitda;
      if (income.grossProfit !== null && income.revenue !== null && income.revenue > 0) {
        const grossMargin = (income.grossProfit / income.revenue) * 100;
        metrics.grossMargin = grossMargin;
        if (grossMargin > 30) {
          strengths.push('Strong gross margin above 30%');
          score += 10;
        } else if (grossMargin > 15) {
          score += 3;
        } else {
          weaknesses.push('Low gross margin below 15%');
          score -= 5;
        }
      }
      if (income.netProfit !== null && income.revenue !== null && income.revenue > 0) {
        const netMargin = (income.netProfit / income.revenue) * 100;
        metrics.netMargin = netMargin;
        if (netMargin > 15) {
          strengths.push('Excellent net profit margin');
          score += 10;
        } else if (netMargin > 5) {
          score += 3;
        } else if (netMargin < 0) {
          weaknesses.push('Negative net profit margin');
          score -= 10;
          risks.push('Unprofitable operations');
        }
      }
    }

    if (input.balanceSheet) {
      const balance = input.balanceSheet.data;
      if (balance.equity !== null) metrics.equity = balance.equity;
      if (balance.totalDebt !== null) metrics.totalDebt = balance.totalDebt;
      if (balance.totalAssets !== null) metrics.totalAssets = balance.totalAssets;

      if (balance.totalAssets !== null && balance.totalAssets > 0 && balance.totalDebt !== null) {
        const debtRatio = balance.totalDebt / balance.totalAssets;
        metrics.debtRatio = debtRatio;
        if (debtRatio < 0.3) {
          strengths.push('Low debt-to-asset ratio');
          score += 8;
        } else if (debtRatio < 0.6) {
          score += 2;
        } else {
          weaknesses.push('High debt-to-asset ratio');
          score -= 8;
          risks.push('High leverage risk');
        }
      }

      if (balance.equity !== null && balance.totalAssets !== null && balance.totalAssets > 0) {
        const equityRatio = balance.equity / balance.totalAssets;
        metrics.equityRatio = equityRatio;
        if (equityRatio > 0.5) {
          strengths.push('Strong equity position');
          score += 5;
        }
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.freeCashFlow !== null) metrics.freeCashFlow = cf.freeCashFlow;
      if (cf.operatingCashFlow !== null) metrics.operatingCashFlow = cf.operatingCashFlow;

      if (cf.freeCashFlow !== null && cf.freeCashFlow > 0) {
        strengths.push('Positive free cash flow');
        score += 8;
      } else if (cf.freeCashFlow !== null && cf.freeCashFlow < 0) {
        weaknesses.push('Negative free cash flow');
        score -= 8;
        risks.push('Cash burn concern');
      }

      if (cf.operatingCashFlow !== null && cf.operatingCashFlow > 0 && cf.freeCashFlow !== null && cf.freeCashFlow > 0) {
        strengths.push('Healthy operating and free cash flow');
        score += 5;
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
    let confidence = 30;
    if (input.incomeStatement) confidence += 20;
    if (input.balanceSheet) confidence += 20;
    if (input.cashFlow) confidence += 20;
    if (input.company?.metadata?.qualityScore) {
      confidence = Math.min(100, confidence + input.company.metadata.qualityScore * 0.1);
    }
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
    if (score > 70) parts.push('Strong fundamental position');
    else if (score > 55) parts.push('Moderate fundamental position');
    else if (score > 45) parts.push('Neutral fundamental position');
    else parts.push('Weak fundamental position');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
