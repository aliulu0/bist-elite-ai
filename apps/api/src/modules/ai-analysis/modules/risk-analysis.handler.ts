import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class RiskAnalysisHandler implements IAnalysisModule {
  readonly name = 'risk';
  readonly weight = 10;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let riskScore = 0;

    if (!input.balanceSheet && !input.cashFlow && !input.incomeStatement) {
      warnings.push('No financial data for risk assessment');
      return this.buildResult(50, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;
      if (bs.totalDebt !== null && bs.totalAssets !== null && bs.totalAssets > 0) {
        const debtRatio = bs.totalDebt / bs.totalAssets;
        metrics.debtRatio = debtRatio;
        if (debtRatio > 0.7) {
          riskScore += 25;
          risks.push('High debt ratio above 70%');
          weaknesses.push('Significant financial leverage');
        } else if (debtRatio > 0.5) {
          riskScore += 12;
          risks.push('Moderate debt levels');
        } else {
          riskScore -= 5;
          strengths.push('Low debt levels');
        }
      }

      if (bs.currentAssets !== null && bs.currentLiabilities !== null && bs.currentLiabilities > 0) {
        const currentRatio = bs.currentAssets / bs.currentLiabilities;
        metrics.currentRatio = currentRatio;
        if (currentRatio < 1) {
          riskScore += 20;
          risks.push('Current ratio below 1.0');
          weaknesses.push('Potential liquidity stress');
        } else if (currentRatio < 1.5) {
          riskScore += 5;
        } else {
          riskScore -= 5;
          strengths.push('Adequate liquidity');
        }
      }

      if (bs.totalDebt !== null && bs.equity !== null && bs.equity > 0) {
        const debtToEquity = bs.totalDebt / bs.equity;
        metrics.debtToEquity = debtToEquity;
        if (debtToEquity > 2) {
          riskScore += 15;
          risks.push('High debt-to-equity ratio');
        } else if (debtToEquity > 1) {
          riskScore += 5;
        }
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.operatingCashFlow !== null) {
        metrics.operatingCashFlow = cf.operatingCashFlow;
        if (cf.operatingCashFlow < 0) {
          riskScore += 20;
          risks.push('Negative operating cash flow');
          weaknesses.push('Cash flow deficit');
        } else {
          riskScore -= 5;
          strengths.push('Positive operating cash flow');
        }
      }

      if (cf.freeCashFlow !== null) {
        metrics.freeCashFlow = cf.freeCashFlow;
        if (cf.freeCashFlow < 0) {
          riskScore += 10;
          risks.push('Negative free cash flow');
        }
      }
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.netProfit !== null && income.revenue !== null && income.revenue > 0) {
        const netMargin = (income.netProfit / income.revenue) * 100;
        metrics.netMargin = netMargin;
        if (netMargin < -10) {
          riskScore += 15;
          risks.push('Deeply negative net margin');
        } else if (netMargin < 0) {
          riskScore += 8;
          risks.push('Negative net margin');
        } else if (netMargin > 10) {
          riskScore -= 5;
          strengths.push('Healthy profit margin');
        }
      }
    }

    if (input.company) {
      const company = input.company.data;
      if (company.marketCap !== null) {
        metrics.marketCap = company.marketCap;
        if (company.marketCap < 500_000_000) {
          riskScore += 8;
          risks.push('Small-cap risk');
        } else if (company.marketCap > 10_000_000_000) {
          riskScore -= 3;
          strengths.push('Large-cap stability');
        }
      }
    }

    const clampedRisk = Math.max(0, Math.min(100, 50 + riskScore));
    const riskInverseScore = 100 - clampedRisk;

    return this.buildResult(
      Math.max(0, Math.min(100, riskInverseScore)),
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
    if (input.cashFlow) confidence += 25;
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
      explanation: this.buildExplanation(score, risks, strengths),
      metadata: {},
    };
  }

  private buildExplanation(score: number, risks: string[], strengths: string[]): string {
    const parts: string[] = [];
    if (score > 70) parts.push('Low overall risk profile');
    else if (score > 55) parts.push('Moderate risk profile');
    else if (score > 45) parts.push('Elevated risk profile');
    else parts.push('High risk profile');
    if (risks.length > 0) parts.push(`Key risk: ${risks[0]}`);
    if (strengths.length > 0) parts.push(strengths[0]);
    return parts.join('. ') + '.';
  }
}
