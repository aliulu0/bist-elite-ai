import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class CashFlowImprovementDetector implements IDetectionModule {
  readonly name = 'cashFlowImprovement';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    if (input.strengths.some((s) => s.toLowerCase().includes('cash flow'))) {
      score += 15;
      strengths.push('Positive cash flow improvement');
    }
    if (input.weaknesses.some((w) => w.toLowerCase().includes('cash flow'))) {
      score -= 12;
      weaknesses.push('Cash flow weakness detected');
    }
    if (input.risks.some((r) => r.toLowerCase().includes('cash flow'))) {
      score -= 10;
      risks.push('Cash flow risk factor');
    }

    const liquidity = input.moduleResults.find((m) => m.module === 'liquidity');
    if (liquidity) {
      metrics.liquidityScore = liquidity.score;
      if (liquidity.score > 60) {
        score += 8;
        strengths.push('Cash flow supports liquidity');
      }
    }

    if (input.strengths.some((s) => s.includes('operating cash flow'))) {
      score += 8;
      strengths.push('Operating cash flow positive');
    }

    metrics.improvementScore = score;

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
    if (score > 65) parts.push('Cash flow improving');
    else if (score > 45) parts.push('Cash flow neutral');
    else parts.push('Cash flow concerns');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
