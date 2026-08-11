import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class ATRExpansionDetector implements IDetectionModule {
  readonly name = 'atrExpansion';
  readonly weight = 4;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const volatility = input.moduleResults.find((m) => m.module === 'volatility');
    if (volatility) {
      metrics.volatilityScore = volatility.score;
      if (volatility.score > 65) {
        score += 12;
        strengths.push('ATR expansion environment detected');
      } else if (volatility.score < 35) {
        score -= 8;
        weaknesses.push('ATR contraction — limited opportunity');
      }
    } else {
      warnings.push('No volatility data for ATR assessment');
    }

    if (input.signal === 'STRONG_BUY' || input.signal === 'BUY') {
      score += 8;
      strengths.push('ATR expansion aligns with buy signal');
    } else if (input.signal === 'STRONG_SELL') {
      score -= 8;
      risks.push('ATR expansion with strong sell signal');
    }

    metrics.atrScore = score;

    return this.buildResult(Math.max(0, Math.min(100, score)), 55, strengths, weaknesses, risks, warnings, metrics);
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
    if (score > 60) parts.push('ATR expansion favourable');
    else if (score > 40) parts.push('ATR neutral');
    else parts.push('ATR contraction');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
