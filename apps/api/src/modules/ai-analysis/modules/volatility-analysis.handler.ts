import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class VolatilityAnalysisHandler implements IAnalysisModule {
  readonly name = 'volatility';
  readonly weight = 8;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (!input.company) {
      warnings.push('No company data for volatility analysis');
      return this.buildResult(50, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    const company = input.company.data;
    if (company.marketCap !== null) {
      metrics.marketCap = company.marketCap;
      if (company.marketCap > 50_000_000_000) {
        strengths.push('Large market cap reduces volatility');
        score += 12;
      } else if (company.marketCap > 10_000_000_000) {
        strengths.push('Moderate market cap with manageable volatility');
        score += 6;
      } else if (company.marketCap > 1_000_000_000) {
        score += 0;
      } else {
        weaknesses.push('Small market cap increases volatility risk');
        score -= 8;
        risks.push('Small-cap volatility');
      }
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;
      if (bs.totalAssets !== null && bs.totalLiabilities !== null && bs.totalAssets > 0) {
        const leverage = bs.totalLiabilities / bs.totalAssets;
        metrics.financialLeverage = leverage;
        if (leverage > 0.8) {
          weaknesses.push('High financial leverage amplifies volatility');
          score -= 10;
          risks.push('Leverage-driven volatility');
        } else if (leverage > 0.5) {
          score -= 3;
        } else {
          strengths.push('Low financial leverage reduces volatility');
          score += 8;
        }
      }

      if (bs.currentAssets !== null && bs.currentLiabilities !== null && bs.currentLiabilities > 0) {
        const currentRatio = bs.currentAssets / bs.currentLiabilities;
        metrics.currentRatio = currentRatio;
        if (currentRatio < 1) {
          weaknesses.push('Low liquidity amplifies price volatility');
          score -= 8;
        } else if (currentRatio > 2) {
          strengths.push('High liquidity dampens volatility');
          score += 5;
        }
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.operatingCashFlow !== null) {
        metrics.operatingCashFlow = cf.operatingCashFlow;
        if (cf.operatingCashFlow > 0) {
          strengths.push('Positive operating cash flow stabilizes the business');
          score += 5;
        } else {
          weaknesses.push('Negative operating cash flow increases uncertainty');
          score -= 5;
        }
      }
      if (cf.freeCashFlow !== null) {
        metrics.freeCashFlow = cf.freeCashFlow;
      }
    }

    if (input.incomeStatement) {
      const income = input.incomeStatement.data;
      if (income.revenue !== null && income.netProfit !== null && income.revenue > 0) {
        const netMargin = (income.netProfit / income.revenue) * 100;
        metrics.netMargin = netMargin;
        if (netMargin > 15) {
          strengths.push('High profit margin absorbs volatility');
          score += 5;
        } else if (netMargin < 0) {
          weaknesses.push('Negative margin increases earnings volatility');
          score -= 5;
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
    if (input.company) confidence += 20;
    if (input.balanceSheet) confidence += 25;
    if (input.cashFlow) confidence += 15;
    if (input.incomeStatement) confidence += 15;
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
    if (score > 70) parts.push('Low volatility profile');
    else if (score > 55) parts.push('Moderate volatility');
    else if (score > 45) parts.push('Elevated volatility');
    else parts.push('High volatility profile');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
