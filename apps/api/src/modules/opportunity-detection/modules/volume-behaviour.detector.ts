import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class VolumeBehaviourDetector implements IDetectionModule {
  readonly name = 'volumeBehaviour';
  readonly weight = 6;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const supportingMetrics = input.supportingMetrics;
    const marketCap = supportingMetrics.find((m) => m.name === 'marketCap');
    if (marketCap && typeof marketCap.value === 'number') {
      metrics.marketCap = marketCap.value;
      if (marketCap.value > 10_000_000_000) {
        score += 10;
        strengths.push('Large-cap liquidity supports volume');
      } else if (marketCap.value < 500_000_000) {
        score -= 10;
        risks.push('Small-cap volume risk');
      }
    } else {
      warnings.push('Market cap data unavailable for volume assessment');
    }

    const technical = input.moduleResults.find((m) => m.module === 'technical');
    if (technical) {
      metrics.technicalScore = technical.score;
      if (technical.score > 65) {
        score += 8;
        strengths.push('Volume conditions favourable');
      }
    }

    if (input.strengths.some((s) => s.toLowerCase().includes('volume'))) {
      score += 10;
      strengths.push('Volume expansion detected in analysis');
    }
    if (input.weaknesses.some((w) => w.toLowerCase().includes('volume'))) {
      score -= 8;
      weaknesses.push('Volume weakness detected');
    }

    metrics.volumeScore = score;

    return this.buildResult(Math.max(0, Math.min(100, score)), 60, strengths, weaknesses, risks, warnings, metrics);
  }

  private buildResult(score: number, confidence: number, strengths: string[], weaknesses: string[], risks: string[], warnings: string[], metrics: Record<string, number>): DetectionModuleResult {
    return {
      module: this.name,
      score, confidence,
      signals: [], strengths, weaknesses, risks, warnings,
      metrics,
      explanation: this.buildExplanation(score, strengths, weaknesses),
      metadata: {},
    };
  }

  private buildExplanation(score: number, strengths: string[], weaknesses: string[]): string {
    const parts: string[] = [];
    if (score > 65) parts.push('Volume behaviour supportive');
    else if (score > 45) parts.push('Volume behaviour neutral');
    else parts.push('Volume behaviour weak');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
