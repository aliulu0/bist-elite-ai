import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class LiquidityImprovementDetector implements IDetectionModule {
  readonly name = 'liquidityImprovement';
  readonly weight = 5;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    let score = 50;

    const liquidity = input.moduleResults.find((m) => m.module === 'liquidity');
    if (liquidity) {
      metrics.liquidityScore = liquidity.score;
      if (liquidity.score > 70) {
        score += 15;
        strengths.push('Strong liquidity position');
      } else if (liquidity.score > 55) {
        score += 6;
        strengths.push('Liquidity improving');
      } else if (liquidity.score < 35) {
        score -= 12;
        risks.push('Weak liquidity position');
      }
    } else {
      warnings.push('No liquidity module data');
    }

    if (input.strengths.some((s) => s.toLowerCase().includes('cash flow'))) {
      score += 8;
      strengths.push('Cash flow supports liquidity');
    }
    if (input.weaknesses.some((w) => w.toLowerCase().includes('cash flow'))) {
      score -= 6;
      weaknesses.push('Cash flow weakness affects liquidity');
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
    if (score > 65) parts.push('Liquidity conditions favourable');
    else if (score > 45) parts.push('Liquidity neutral');
    else parts.push('Liquidity concerns');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
