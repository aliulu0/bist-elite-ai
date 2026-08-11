import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class FinancialQualityDetector implements IDetectionModule {
  readonly name = 'financialQuality';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const health = input.moduleResults.find((m) => m.module === 'financialHealth');
    if (health) {
      metrics.healthScore = health.score;
      if (health.score > 70) {
        score += 15;
        strengths.push('Strong financial health');
      } else if (health.score > 55) {
        score += 6;
        strengths.push('Moderate financial health');
      } else if (health.score < 35) {
        score -= 12;
        risks.push('Weak financial health');
      }
    } else {
      warnings.push('No financial health data');
    }

    if (input.strengths.some((s) => s.includes('debt') || s.includes('leverage'))) {
      score += 5;
      strengths.push('Debt structure improving');
    }
    if (input.weaknesses.some((w) => w.includes('debt') || w.includes('leverage'))) {
      score -= 5;
      weaknesses.push('Debt concerns identified');
    }

    metrics.qualityScore = score;

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
    if (score > 65) parts.push('Financial quality strong');
    else if (score > 45) parts.push('Financial quality moderate');
    else parts.push('Financial quality weak');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
