import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class RSIBehaviourDetector implements IDetectionModule {
  readonly name = 'rsiBehaviour';
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
    if (momentum) {
      metrics.momentumScore = momentum.score;
      if (momentum.score > 70) {
        score += 15;
        strengths.push('RSI exiting oversold zone — early recovery');
      } else if (momentum.score > 55) {
        score += 8;
        strengths.push('RSI improving from low levels');
      } else if (momentum.score < 30) {
        score -= 10;
        risks.push('RSI in deeply oversold territory');
      } else if (momentum.score > 85) {
        score -= 5;
        risks.push('RSI approaching overbought — limited upside');
      }
    } else {
      warnings.push('No momentum data for RSI assessment');
    }

    const risk = input.moduleResults.find((m) => m.module === 'risk');
    if (risk && risk.score > 60) {
      score += 5;
      strengths.push('Risk profile supports RSI recovery');
    }

    metrics.rsiScore = score;

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
    if (score > 65) parts.push('RSI behaviour bullish');
    else if (score > 45) parts.push('RSI behaviour neutral');
    else parts.push('RSI behaviour bearish');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
