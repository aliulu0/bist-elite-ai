import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class TrendTransitionDetector implements IDetectionModule {
  readonly name = 'trendTransition';
  readonly weight = 6;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const trend = input.moduleResults.find((m) => m.module === 'trend');
    if (trend) {
      metrics.trendScore = trend.score;
      if (trend.score > 70) {
        score += 15;
        strengths.push('Strong uptrend detected');
      } else if (trend.score > 55) {
        score += 6;
        strengths.push('Trend transitioning positively');
      } else if (trend.score < 35) {
        score -= 12;
        risks.push('Downtrend or trend weakness');
      }
    } else {
      warnings.push('No trend module data available');
    }

    if (input.strengths.some((s) => s.toLowerCase().includes('sector'))) {
      score += 5;
      strengths.push('Sector alignment supports trend');
    }

    const volatility = input.moduleResults.find((m) => m.module === 'volatility');
    if (volatility && volatility.score > 60) {
      score += 5;
      strengths.push('Favourable volatility environment');
    }

    metrics.transitionScore = score;

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
    if (score > 65) parts.push('Positive trend transition');
    else if (score > 45) parts.push('Neutral trend environment');
    else parts.push('Negative trend conditions');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
