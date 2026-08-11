import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class MACDBehaviourDetector implements IDetectionModule {
  readonly name = 'macdBehaviour';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const momentum = input.moduleResults.find((m) => m.module === 'momentum');
    const trend = input.moduleResults.find((m) => m.module === 'trend');

    if (momentum && trend) {
      metrics.momentumScore = momentum.score;
      metrics.trendScore = trend.score;

      if (momentum.score > 60 && trend.score > 60) {
        score += 18;
        strengths.push('MACD convergence confirmed by momentum and trend');
      } else if (momentum.score > 55 || trend.score > 55) {
        score += 8;
        strengths.push('Partial MACD convergence signal');
      } else if (momentum.score < 40 && trend.score < 40) {
        score -= 15;
        risks.push('MACD divergence — bearish alignment');
      }
    } else {
      warnings.push('Insufficient data for MACD assessment');
    }

    if (input.signal === 'BUY' || input.signal === 'STRONG_BUY') {
      score += 8;
      strengths.push('MACD direction aligned with buy signal');
    } else if (input.signal === 'SELL' || input.signal === 'STRONG_SELL') {
      score -= 8;
      risks.push('MACD direction aligned with sell signal');
    }

    metrics.macdScore = score;

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
    if (score > 65) parts.push('MACD behaviour bullish');
    else if (score > 45) parts.push('MACD behaviour neutral');
    else parts.push('MACD behaviour bearish');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
