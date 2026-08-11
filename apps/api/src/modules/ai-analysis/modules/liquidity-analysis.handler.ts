import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class LiquidityAnalysisHandler implements IAnalysisModule {
  readonly name = 'liquidity';
  readonly weight = 8;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (!input.balanceSheet && !input.cashFlow) {
      warnings.push('No balance sheet or cash flow data for liquidity analysis');
      return this.buildResult(50, 0, warnings, strengths, weaknesses, risks, warnings, metrics);
    }

    if (input.balanceSheet) {
      const bs = input.balanceSheet.data;

      if (bs.currentAssets !== null) metrics.currentAssets = bs.currentAssets;
      if (bs.currentLiabilities !== null) metrics.currentLiabilities = bs.currentLiabilities;

      if (bs.currentAssets !== null && bs.currentLiabilities !== null && bs.currentLiabilities > 0) {
        const currentRatio = bs.currentAssets / bs.currentLiabilities;
        metrics.currentRatio = currentRatio;
        if (currentRatio > 2.5) {
          strengths.push('Very strong current ratio above 2.5');
          score += 15;
        } else if (currentRatio > 1.5) {
          strengths.push('Healthy current ratio above 1.5');
          score += 8;
        } else if (currentRatio > 1) {
          score += 2;
        } else {
          weaknesses.push('Current ratio below 1.0');
          score -= 15;
          risks.push('Severe liquidity constraint');
        }
      }

      if (bs.totalAssets !== null) metrics.totalAssets = bs.totalAssets;
      if (bs.totalLiabilities !== null) metrics.totalLiabilities = bs.totalLiabilities;

      if (bs.totalAssets !== null && bs.totalLiabilities !== null && bs.totalAssets > 0) {
        const assetLiabilityRatio = bs.totalAssets / bs.totalLiabilities;
        metrics.assetLiabilityRatio = assetLiabilityRatio;
        if (assetLiabilityRatio > 2) {
          strengths.push('Strong asset-to-liability coverage');
          score += 8;
        } else if (assetLiabilityRatio > 1) {
          score += 3;
        } else {
          weaknesses.push('Insufficient asset coverage for liabilities');
          score -= 10;
        }
      }
    }

    if (input.cashFlow) {
      const cf = input.cashFlow.data;
      if (cf.operatingCashFlow !== null) metrics.operatingCashFlow = cf.operatingCashFlow;
      if (cf.financingCashFlow !== null) metrics.financingCashFlow = cf.financingCashFlow;

      if (cf.operatingCashFlow !== null && cf.operatingCashFlow > 0) {
        strengths.push('Positive operating cash flow supports liquidity');
        score += 10;
      } else if (cf.operatingCashFlow !== null && cf.operatingCashFlow < 0) {
        weaknesses.push('Negative operating cash flow');
        score -= 10;
        risks.push('Cash flow liquidity risk');
      }

      if (cf.freeCashFlow !== null) {
        metrics.freeCashFlow = cf.freeCashFlow;
        if (cf.freeCashFlow > 0) {
          strengths.push('Free cash flow available');
          score += 5;
        } else if (cf.freeCashFlow < 0) {
          weaknesses.push('Negative free cash flow');
          score -= 5;
        }
      }
    }

    if (input.company) {
      const company = input.company.data;
      if (company.marketCap !== null) {
        metrics.marketCap = company.marketCap;
        if (company.marketCap > 10_000_000_000) {
          strengths.push('Large market cap provides liquidity');
          score += 5;
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
    if (input.balanceSheet) confidence += 40;
    if (input.cashFlow) confidence += 30;
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
    if (score > 70) parts.push('Strong liquidity position');
    else if (score > 55) parts.push('Adequate liquidity');
    else if (score > 45) parts.push('Moderate liquidity concerns');
    else parts.push('Weak liquidity position');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
