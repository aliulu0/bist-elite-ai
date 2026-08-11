import { Injectable } from '@nestjs/common';
import { IAnalysisModule } from '../interfaces/analysis-module.interface';
import { PipelineInput, ModuleResult } from '../ai-analysis.types';

@Injectable()
export class TechnicalAnalysisHandler implements IAnalysisModule {
  readonly name = 'technical';
  readonly weight = 12;
  readonly enabled = true;

  async analyze(input: PipelineInput): Promise<ModuleResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const company = input.company.data;
    if (!company) {
      return this.buildResult(0, 0, ['No company data'], strengths, weaknesses, risks, warnings, metrics);
    }

    metrics.marketCap = company.marketCap ?? 0;
    metrics.sharesOutstanding = company.sharesOutstanding ?? 0;

    if (company.marketCap && company.marketCap > 0) {
      if (company.marketCap > 10_000_000_000) {
        strengths.push('Large-cap stock with market stability');
        score += 8;
      } else if (company.marketCap > 1_000_000_000) {
        strengths.push('Mid-cap stock with growth potential');
        score += 5;
      } else {
        weaknesses.push('Small-cap stock with higher volatility');
        score -= 3;
        risks.push('Small-cap liquidity risk');
      }
    } else {
      warnings.push('Market cap data unavailable');
    }

    if (input.sector) {
      const sector = input.sector.data;
      if (sector && sector.sector && sector.sector !== 'Unknown') {
        strengths.push(`Listed in ${sector.sector} sector`);
        score += 3;
      } else {
        warnings.push('Sector classification unknown');
      }
    }

    if (input.financials) {
      const financials = input.financials.data;
      if (financials.revenue !== null && financials.netIncome !== null) {
        const profitMargin = financials.revenue > 0 ? (financials.netIncome / financials.revenue) * 100 : 0;
        metrics.profitMargin = profitMargin;
        if (profitMargin > 15) {
          strengths.push('Strong profit margin');
          score += 10;
        } else if (profitMargin > 5) {
          score += 3;
        } else if (profitMargin < 0) {
          weaknesses.push('Negative profit margin');
          score -= 10;
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
    let confidence = 50;
    if (input.company?.metadata?.qualityScore) {
      confidence = Math.min(100, confidence + input.company.metadata.qualityScore * 0.3);
    }
    if (input.financials) confidence += 10;
    if (input.sector) confidence += 5;
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
    if (score > 70) parts.push('Strong technical position');
    else if (score > 55) parts.push('Moderate technical position');
    else if (score > 45) parts.push('Neutral technical position');
    else parts.push('Weak technical position');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
