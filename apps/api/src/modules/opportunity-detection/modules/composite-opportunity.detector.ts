import { Injectable } from '@nestjs/common';
import { IDetectionModule } from '../interfaces/detection-module.interface';
import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

@Injectable()
export class CompositeOpportunityDetector implements IDetectionModule {
  readonly name = 'compositeOpportunity';
  readonly weight = 10;
  readonly enabled = true;

  detect(input: AnalysisResult): DetectionModuleResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};

    let positiveCount = 0;
    let negativeCount = 0;
    let totalScore = 0;
    let moduleCount = 0;

    for (const mod of input.moduleResults) {
      totalScore += mod.score;
      moduleCount++;
      if (mod.score > 60) positiveCount++;
      else if (mod.score < 40) negativeCount++;
    }

    const avgScore = moduleCount > 0 ? totalScore / moduleCount : 0;
    metrics.averageModuleScore = avgScore;
    metrics.positiveModules = positiveCount;
    metrics.negativeModules = negativeCount;
    metrics.totalModules = moduleCount;

    let score = 50;
    if (positiveCount >= 6) {
      score += 20;
      strengths.push(`${positiveCount} modules signalling positive opportunity`);
    } else if (positiveCount >= 3) {
      score += 10;
      strengths.push(`${positiveCount} modules with positive signals`);
    }

    if (negativeCount >= 5) {
      score -= 20;
      risks.push(`${negativeCount} modules signalling negative conditions`);
    } else if (negativeCount >= 3) {
      score -= 10;
      weaknesses.push(`${negativeCount} modules with negative signals`);
    }

    if (input.overallScore > 70 && input.confidenceScore > 65) {
      score += 10;
      strengths.push('High composite score with strong confidence');
    } else if (input.overallScore < 40) {
      score -= 10;
      weaknesses.push('Low composite score');
    }

    const multiFactorTypes = this.detectMultiFactorTypes(input);
    if (multiFactorTypes.length >= 3) {
      score += 8;
      strengths.push(`Multi-factor opportunity: ${multiFactorTypes.length} factors aligned`);
    }

    metrics.compositeScore = score;

    return {
      module: this.name,
      score: Math.max(0, Math.min(100, score)),
      confidence: this.calculateConfidence(input),
      signals: multiFactorTypes,
      strengths,
      weaknesses,
      risks,
      warnings,
      metrics,
      explanation: this.buildExplanation(score, strengths, weaknesses),
      metadata: { multiFactorTypes },
    };
  }

  private calculateConfidence(input: AnalysisResult): number {
    return Math.min(100, input.confidenceScore + 10);
  }

  private detectMultiFactorTypes(input: AnalysisResult): string[] {
    const types: string[] = [];
    if (input.moduleResults.some((m) => m.module === 'momentum' && m.score > 60)) types.push('momentum');
    if (input.moduleResults.some((m) => m.module === 'fundamental' && m.score > 60)) types.push('fundamental');
    if (input.moduleResults.some((m) => m.module === 'valuation' && m.score > 60)) types.push('valuation');
    if (input.moduleResults.some((m) => m.module === 'risk' && m.score > 60)) types.push('low_risk');
    if (input.moduleResults.some((m) => m.module === 'liquidity' && m.score > 60)) types.push('liquidity');
    if (input.moduleResults.some((m) => m.module === 'trend' && m.score > 60)) types.push('trend');
    if (input.moduleResults.some((m) => m.module === 'growth' && m.score > 60)) types.push('growth');
    return types;
  }

  private buildExplanation(score: number, strengths: string[], weaknesses: string[]): string {
    const parts: string[] = [];
    if (score > 70) parts.push('Strong composite opportunity');
    else if (score > 50) parts.push('Moderate composite opportunity');
    else parts.push('Weak composite opportunity');
    if (strengths.length > 0) parts.push(strengths[0]);
    if (weaknesses.length > 0) parts.push(weaknesses[0]);
    return parts.join('. ') + '.';
  }
}
