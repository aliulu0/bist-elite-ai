import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class MomentumShiftDetector implements IDetectionModule {
  readonly name = 'momentumShift';
  readonly weight = 7;
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
        score += 18;
        strengths.push('Strong momentum shift detected');
      } else if (momentum.score > 55) {
        score += 8;
        strengths.push('Moderate momentum building');
      } else if (momentum.score < 35) {
        score -= 15;
        risks.push('Weak momentum');
      }
    } else {
      warnings.push('No momentum module data available');
    }

    if (input.signal === 'STRONG_BUY' || input.signal === 'BUY') {
      score += 10;
      strengths.push(`Buy signal confirms momentum: ${input.signal}`);
    } else if (input.signal === 'SELL' || input.signal === 'STRONG_SELL') {
      score -= 10;
      risks.push(`Sell signal indicates negative momentum: ${input.signal}`);
    }

    const growth = input.moduleResults.find((m) => m.module === 'growth');
    if (growth && growth.score > 60) {
      score += 5;
      strengths.push('Growth metrics support momentum');
    }

    metrics.compositeScore = score;

    return this.buildResult(Math.max(0, Math.min(100, score)), 75, strengths, weaknesses, risks, warnings, metrics);
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
    if (score > 70) parts.push('Strong momentum opportunity');
    else if (score > 50) parts.push('Moderate momentum');
    else parts.push('Weak momentum');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
