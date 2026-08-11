import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class PriceStructureDetector implements IDetectionModule {
  readonly name = 'priceStructure';
  readonly weight = 6;
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
      strengths.push('Strong overall price structure');
    } else if (input.overallScore < 40) {
      score -= 15;
      weaknesses.push('Weak price structure');
    }

    if (input.signal === 'STRONG_BUY' || input.signal === 'BUY') {
      score += 12;
      strengths.push(`Bullish signal: ${input.signal}`);
    } else if (input.signal === 'STRONG_SELL' || input.signal === 'SELL') {
      score -= 12;
      risks.push(`Bearish signal: ${input.signal}`);
    }

    const moduleResults = input.moduleResults;
    const technical = moduleResults.find((m) => m.module === 'technical');
    if (technical) {
      metrics.technicalScore = technical.score;
      if (technical.score > 70) {
        score += 10;
        strengths.push('Strong technical position');
      } else if (technical.score < 40) {
        score -= 10;
        weaknesses.push('Weak technical position');
      }
    } else {
      warnings.push('No technical module data');
    }

    metrics.overallScore = input.overallScore;

    return this.buildResult(Math.max(0, Math.min(100, score)), 70, strengths, weaknesses, risks, warnings, metrics);
  }

  private buildResult(score: number, confidence: number, strengths: string[], weaknesses: string[], risks: string[], warnings: string[], metrics: Record<string, number>): DetectionModuleResult {
    return {
      module: this.name,
      score,
      confidence,
      signals: [],
      strengths,
      weaknesses,
      risks,
      warnings,
      metrics,
      explanation: this.buildExplanation(score, strengths, weaknesses),
      metadata: {},
    };
  }

  private buildExplanation(score: number, strengths: string[], weaknesses: string[]): string {
    const parts: string[] = [];
    if (score > 70) parts.push('Strong price structure');
    else if (score > 50) parts.push('Moderate price structure');
    else parts.push('Weak price structure');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
