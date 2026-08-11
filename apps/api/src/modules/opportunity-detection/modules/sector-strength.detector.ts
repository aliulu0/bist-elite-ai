import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class SectorStrengthDetector implements IDetectionModule {
  readonly name = 'sectorStrength';
  readonly weight = 4;
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
        score += 12;
        strengths.push('Sector trend strongly positive');
      } else if (trend.score > 55) {
        score += 5;
        strengths.push('Sector trend moderately positive');
      } else if (trend.score < 35) {
        score -= 10;
        risks.push('Sector trend negative');
      }
    } else {
      warnings.push('No trend data for sector assessment');
    }

    if (input.strengths.some((s) => s.includes('sector'))) {
      score += 8;
      strengths.push('Sector classification supports opportunity');
    }
    if (input.weaknesses.some((w) => w.includes('sector'))) {
      score -= 5;
      weaknesses.push('Sector weakness identified');
    }

    metrics.sectorScore = score;

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
    if (score > 60) parts.push('Sector strength favourable');
    else if (score > 40) parts.push('Sector neutral');
    else parts.push('Sector weakness');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
