import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class DebtImprovementDetector implements IDetectionModule {
  readonly name = 'debtImprovement';
  readonly weight = 4;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (input.strengths.some((s) => s.includes('debt') || s.includes('leverage'))) {
      score += 15;
      strengths.push('Debt levels improving');
    }
    if (input.weaknesses.some((w) => w.includes('debt') || w.includes('leverage'))) {
      score -= 12;
      weaknesses.push('Debt concerns identified');
    }
    if (input.risks.some((r) => r.includes('debt') || r.includes('leverage'))) {
      score -= 10;
      risks.push('High leverage risk');
    }

    const health = input.moduleResults.find((m) => m.module === 'financialHealth');
    if (health) {
      metrics.healthScore = health.score;
      if (health.score > 60) {
        score += 8;
        strengths.push('Financial health supports debt improvement');
      } else if (health.score < 40) {
        score -= 8;
        weaknesses.push('Financial health weak');
      }
    }

    metrics.debtScore = score;

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
    if (score > 60) parts.push('Debt improvement detected');
    else if (score > 40) parts.push('Debt levels stable');
    else parts.push('Debt concerns');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
