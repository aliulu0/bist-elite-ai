import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class FundamentalChangeDetector implements IDetectionModule {
  readonly name = 'fundamentalChange';
  readonly weight = 7;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const fundamental = input.moduleResults.find((m) => m.module === 'fundamental');
    if (fundamental) {
      metrics.fundamentalScore = fundamental.score;
      if (fundamental.score > 70) {
        score += 18;
        strengths.push('Strong fundamental improvement detected');
      } else if (fundamental.score > 55) {
        score += 8;
        strengths.push('Moderate fundamental improvement');
      } else if (fundamental.score < 35) {
        score -= 15;
        risks.push('Fundamental deterioration');
      }
    } else {
      warnings.push('No fundamental data available');
    }

    const valuation = input.moduleResults.find((m) => m.module === 'valuation');
    if (valuation) {
      metrics.valuationScore = valuation.score;
      if (valuation.score > 70) {
        score += 10;
        strengths.push('Valuation improvement');
      } else if (valuation.score < 40) {
        score -= 8;
        weaknesses.push('Valuation deterioration');
      }
    }

    if (input.strengths.some((s) => s.includes('margin') || s.includes('profit'))) {
      score += 6;
      strengths.push('Profitability metrics improving');
    }

    metrics.changeScore = score;

    return this.buildResult(Math.max(0, Math.min(100, score)), 70, strengths, weaknesses, risks, warnings, metrics);
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
    if (score > 70) parts.push('Strong fundamental improvement');
    else if (score > 50) parts.push('Moderate fundamental change');
    else parts.push('Fundamental weakness');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
