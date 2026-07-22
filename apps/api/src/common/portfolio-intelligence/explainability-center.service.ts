import { Injectable } from '@nestjs/common';
import {
  ExplanationWidget,
  RiskLevel,
} from './types';

@Injectable()
export class ExplainabilityCenterService {
  getExplanation(
    symbol: string,
    eliteScore: number,
    confidence: number,
    positiveFactors: { factor: string; contribution: number; description: string }[] = [],
    negativeFactors: { factor: string; contribution: number; description: string }[] = [],
    riskFactors: { type: string; severity: string; score: number; description: string; mitigation: string }[] = [],
    consensusSummary: string = '',
    regimeContext: string = '',
  ): ExplanationWidget {
    return {
      symbol,
      eliteScore,
      confidence,
      positiveFactors,
      negativeFactors,
      riskFactors,
      consensusSummary,
      regimeContext,
      explanation: this.generateExplanationText(eliteScore, confidence, positiveFactors, negativeFactors),
      lastUpdated: new Date().toISOString(),
    };
  }

  getExplanationBatch(
    symbols: Array<{
      symbol: string;
      eliteScore: number;
      confidence: number;
      positiveFactors?: { factor: string; contribution: number; description: string }[];
      negativeFactors?: { factor: string; contribution: number; description: string }[];
      riskFactors?: { type: string; severity: string; score: number; description: string; mitigation: string }[];
      consensusSummary?: string;
      regimeContext?: string;
    }>,
  ): ExplanationWidget[] {
    return symbols.map(s => this.getExplanation(
      s.symbol,
      s.eliteScore,
      s.confidence,
      s.positiveFactors,
      s.negativeFactors,
      s.riskFactors,
      s.consensusSummary,
      s.regimeContext,
    ));
  }

  generateFactorSummary(positiveFactors: { factor: string; contribution: number }[], negativeFactors: { factor: string; contribution: number }[]): string {
    if (positiveFactors.length === 0 && negativeFactors.length === 0) {
      return 'Yeterli veri yok';
    }
    const topPositive = positiveFactors.sort((a, b) => b.contribution - a.contribution).slice(0, 3);
    const topNegative = negativeFactors.sort((a, b) => a.contribution - b.contribution).slice(0, 3);
    const parts: string[] = [];
    if (topPositive.length > 0) {
      parts.push(`Olumlu: ${topPositive.map(f => f.factor).join(', ')}`);
    }
    if (topNegative.length > 0) {
      parts.push(`Olumsuz: ${topNegative.map(f => f.factor).join(', ')}`);
    }
    return parts.join(' | ');
  }

  getRiskLevelFromScore(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.LOW;
    if (score >= 60) return RiskLevel.MEDIUM;
    if (score >= 40) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  private generateExplanationText(
    eliteScore: number,
    confidence: number,
    positiveFactors: { factor: string; contribution: number; description: string }[],
    negativeFactors: { factor: string; contribution: number; description: string }[],
  ): string {
    const parts: string[] = [];
    parts.push(`${eliteScore.toFixed(1)} elite skoru ile`);

    if (confidence >= 0.8) {
      parts.push('yüksek güvenle');
    } else if (confidence >= 0.6) {
      parts.push('orta güvenle');
    } else {
      parts.push('düşük güvenle');
    }

    if (positiveFactors.length > 0) {
      parts.push(`${positiveFactors.length} olumlu faktör`);
    }
    if (negativeFactors.length > 0) {
      parts.push(`${negativeFactors.length} olumsuz faktör`);
    }

    return parts.join(', ');
  }
}
