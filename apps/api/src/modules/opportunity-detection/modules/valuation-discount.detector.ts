import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class ValuationDiscountDetector implements IDetectionModule {
  readonly name = 'valuationDiscount';
  readonly weight = 6;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const valuation = input.moduleResults.find((m) => m.module === 'valuation');
    if (valuation) {
      metrics.valuationScore = valuation.score;
      if (valuation.score > 75) {
        score += 18;
        strengths.push('Significant undervaluation detected');
      } else if (valuation.score > 60) {
        score += 8;
        strengths.push('Moderate undervaluation');
      } else if (valuation.score < 35) {
        score -= 10;
        risks.push('Overvaluation concern');
      }
    } else {
      warnings.push('No valuation data available');
    }

    if (input.signal === 'STRONG_BUY' || input.signal === 'BUY') {
      score += 8;
      strengths.push('Buy signal supports undervaluation thesis');
    }

    metrics.discountScore = score;

    return this.buildResult(Math.max(0, Math.min(100, score)), 65, strengths, weaknesses, risks, warnings, metrics);
  }

  private buildResult(score: number, confidence: number, strengths: string[], weaknesses: string[], risks: string[], warnings: string[], metrics: Record<string, number>): DetectionModuleResult {
    return {
      module: this.name, score, confidence,
      signals: [], strengths, weaknesses, risks, warnings, metrics,
      explanation: this.buildExplanation(score, strengths, weaknesses),
      metadata: {},
    };
  }

  private buildExplanation(score: number, strengths: string[], weaknesses: string[]): string {
    const parts: string[] = [];
    if (score > 65) parts.push('Valuation discount opportunity');
    else if (score > 45) parts.push('Fairly valued');
    else parts.push('Potential overvaluation');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
