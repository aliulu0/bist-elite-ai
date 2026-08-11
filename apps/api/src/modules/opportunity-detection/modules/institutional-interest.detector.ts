import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class InstitutionalInterestDetector implements IDetectionModule {
  readonly name = 'institutionalInterest';
  readonly weight = 4;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (input.overallScore > 70 && input.confidenceScore > 70) {
      score += 15;
      strengths.push('High score + high confidence suggests institutional interest');
    } else if (input.overallScore > 60 && input.confidenceScore > 60) {
      score += 6;
      strengths.push('Moderate institutional signals');
    } else if (input.overallScore < 40) {
      score -= 8;
      weaknesses.push('Low score — unlikely institutional interest');
    }

    const risk = input.moduleResults.find((m) => m.module === 'risk');
    if (risk && risk.score > 65) {
      score += 8;
      strengths.push('Low risk profile attracts institutional capital');
    }

    const volume = input.moduleResults.find((m) => m.module === 'technical');
    if (volume && volume.score > 65) {
      score += 5;
      strengths.push('Volume conditions support institutional participation');
    }

    metrics.interestScore = score;

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
    if (score > 60) parts.push('Institutional interest likely');
    else if (score > 40) parts.push('Institutional interest uncertain');
    else parts.push('Unlikely institutional interest');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
