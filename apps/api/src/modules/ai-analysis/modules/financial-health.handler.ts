import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class FinancialHealthHandler implements IAnalysisModule {
  readonly name = 'financialHealth';
  readonly weight = 10;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (!input.balanceSheet && !input.cashFlow && !input.incomeStatement) {
      warnings.push('No financial data available for health assessment');
      return this.buildResult(0, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;

      if (bs.currentAssets !== null && bs.currentLiabilities !== null && bs.currentLiabilities > 0) {
        const currentRatio = bs.currentAssets / bs.currentLiabilities;
        metrics.currentRatio = currentRatio;
        if (currentRatio > 2) {
          strengths.push('Strong current ratio above 2.0');
          score += 10;
        } else if (currentRatio > 1) {
          score += 3;
        } else {
          weaknesses.push('Current ratio below 1.0 - liquidity concern');
          score -= 10;
          risks.push('Short-term liquidity risk');
        }
      }

      if (bs.totalDebt !== null && bs.equity !== null && bs.equity > 0) {
        const debtToEquity = bs.totalDebt / bs.equity;
        metrics.debtToEquity = debtToEquity;
        if (debtToEquity < 0.5) {
          strengths.push('Low debt-to-equity ratio');
          score += 8;
        } else if (debtToEquity < 1.5) {
          score += 2;
        } else {
          weaknesses.push('High debt-to-equity ratio');
          score -= 8;
          risks.push('High financial leverage');
        }
      }

      if (bs.totalDebt !== null && bs.totalAssets !== null && bs.totalAssets > 0) {
        const debtRatio = bs.totalDebt / bs.totalAssets;
        metrics.healthDebtRatio = debtRatio;
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.operatingCashFlow !== null) metrics.operatingCashFlow = cf.operatingCashFlow;
      if (cf.investingCashFlow !== null) metrics.investingCashFlow = cf.investingCashFlow;
      if (cf.financingCashFlow !== null) metrics.financingCashFlow = cf.financingCashFlow;

      if (cf.operatingCashFlow !== null && cf.operatingCashFlow > 0) {
        strengths.push('Positive operating cash flow');
        score += 8;
      } else if (cf.operatingCashFlow !== null && cf.operatingCashFlow < 0) {
        weaknesses.push('Negative operating cash flow');
        score -= 10;
        risks.push('Operating cash flow deficit');
      }

      if (cf.freeCashFlow !== null) {
        metrics.freeCashFlow = cf.freeCashFlow;
        if (cf.freeCashFlow > 0) {
          strengths.push('Positive free cash flow');
          score += 5;
        }
      }
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.ebitda !== null && income.ebitda > 0) {
        metrics.ebitda = income.ebitda;
        strengths.push('Positive EBITDA');
        score += 3;
      } else if (income.ebitda !== null && income.ebitda < 0) {
        weaknesses.push('Negative EBITDA');
        score -= 5;
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
    if (input.balanceSheet) confidence += 30;
    if (input.cashFlow) confidence += 30;
    if (input.incomeStatement) confidence += 20;
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
    if (score > 70) parts.push('Strong financial health');
    else if (score > 55) parts.push('Adequate financial health');
    else if (score > 45) parts.push('Mixed financial health');
    else parts.push('Weak financial health');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
