import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class MovingAverageStructureDetector implements IDetectionModule {
  readonly name = 'movingAverageStructure';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (input.overallScore > 65) {
      score += 12;
      strengths.push('Overall score above moving average threshold');
    } else if (input.overallScore < 40) {
      score -= 12;
      weaknesses.push('Overall score below moving average threshold');
    }

    const technical = input.moduleResults.find((m) => m.module === 'technical');
    if (technical) {
      metrics.technicalScore = technical.score;
      if (technical.score > 70) {
        score += 10;
        strengths.push('Technical indicators above average');
      } else if (technical.score < 40) {
        score -= 8;
        weaknesses.push('Technical indicators below average');
      }
    } else {
      warnings.push('No technical data for MA structure');
    }

    if (input.strengths.some((s) => s.includes('margin'))) {
      score += 5;
      strengths.push('Margin strength supports MA structure');
    }

    metrics.maStructureScore = score;

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
    if (score > 65) parts.push('Moving average structure bullish');
    else if (score > 45) parts.push('Moving average structure neutral');
    else parts.push('Moving average structure bearish');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
