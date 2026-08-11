import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class RelativeStrengthDetector implements IDetectionModule {
  readonly name = 'relativeStrength';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (input.overallScore > 70) {
      score += 15;
      strengths.push('Strong relative strength vs market');
    } else if (input.overallScore > 55) {
      score += 5;
      strengths.push('Moderate relative strength');
    } else if (input.overallScore < 40) {
      score -= 12;
      weaknesses.push('Weak relative strength');
    }

    const technical = input.moduleResults.find((m) => m.module === 'technical');
    const fundamental = input.moduleResults.find((m) => m.module === 'fundamental');
    if (technical && fundamental) {
      const avg = (technical.score + fundamental.score) / 2;
      metrics.combinedScore = avg;
      if (avg > 65) {
        score += 8;
        strengths.push('Combined technical-fundamental strength');
      } else if (avg < 40) {
        score -= 8;
        weaknesses.push('Combined technical-fundamental weakness');
      }
    }

    metrics.relativeScore = score;

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
    if (score > 65) parts.push('Strong relative strength');
    else if (score > 45) parts.push('Average relative strength');
    else parts.push('Weak relative strength');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
