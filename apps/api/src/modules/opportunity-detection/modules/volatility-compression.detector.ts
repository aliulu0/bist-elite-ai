import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class VolatilityCompressionDetector implements IDetectionModule {
  readonly name = 'volatilityCompression';
  readonly weight = 5;
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
      if (volatility.score < 40) {
        score += 15;
        strengths.push('Volatility compression detected — breakout potential');
      } else if (volatility.score > 70) {
        score -= 8;
        risks.push('High volatility — increased risk');
      } else {
        score += 3;
        strengths.push('Moderate volatility environment');
      }
    } else {
      warnings.push('No volatility data for compression assessment');
    }

    const atr = input.moduleResults.find((m) => m.module === 'volatility');
    if (atr && atr.metrics.atrScore !== undefined) {
      metrics.atrScore = atr.metrics.atrScore;
    }

    if (input.strengths.some((s) => s.includes('margin'))) {
      score += 5;
      strengths.push('Margin improvement during compression');
    }

    metrics.compressionScore = score;

    return this.buildResult(Math.max(0, Math.min(100, score)), 60, strengths, weaknesses, risks, warnings, metrics);
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
    if (score > 60) parts.push('Volatility compression — breakout imminent');
    else if (score > 40) parts.push('Volatility neutral');
    else parts.push('High volatility environment');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
