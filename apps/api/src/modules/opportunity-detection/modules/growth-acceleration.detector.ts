import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class GrowthAccelerationDetector implements IDetectionModule {
  readonly name = 'growthAcceleration';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const growth = input.moduleResults.find((m) => m.module === 'growth');
    if (growth) {
      metrics.growthScore = growth.score;
      if (growth.score > 70) {
        score += 18;
        strengths.push('Strong growth acceleration detected');
      } else if (growth.score > 55) {
        score += 8;
        strengths.push('Moderate growth acceleration');
      } else if (growth.score < 35) {
        score -= 12;
        risks.push('Growth deceleration');
      }
    } else {
      warnings.push('No growth module data');
    }

    if (input.strengths.some((s) => s.includes('margin') || s.includes('profit'))) {
      score += 6;
      strengths.push('Margin improvement supports growth');
    }

    metrics.accelerationScore = score;

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
    if (score > 65) parts.push('Growth acceleration positive');
    else if (score > 45) parts.push('Growth neutral');
    else parts.push('Growth concerns');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
