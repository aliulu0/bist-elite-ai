import { Injectable } from '@nestjs/common';
import {
  TOMORROW_CATEGORIES,
  TOMORROW_DIMENSION_LABELS,
  TOMORROW_SCORE_WEIGHTS,
  TomorrowScoreDimension,
} from './tomorrow.config';
import {
  TomorrowCandidateResult,
  TomorrowCategory,
  TomorrowInput,
} from './tomorrow.types';

@Injectable()
export class TomorrowOpportunityEngine {
  evaluate(input: TomorrowInput): TomorrowCandidateResult {
    const { opportunity, elite } = input;
    const tomorrowScore = this.computeTomorrowScore(input);
    const tomorrowConfidence = this.computeConfidence(input);
    const category = this.determineCategory(tomorrowScore);
    const daily = this.horizonScore(elite, 'GUNLUK');
    const weekly = this.horizonScore(elite, 'HAFTALIK');

    return {
      ticker: opportunity.ticker,
      company: opportunity.company,
      tomorrowScore,
      tomorrowConfidence,
      category: category.category,
      categoryLabel: category.label,
      categoryStars: category.stars,
      aiScore: opportunity.aiScore,
      eliteDaily: daily,
      eliteWeekly: weekly,
      decision: opportunity.decision,
      decisionLabel: opportunity.decisionLabel,
      opportunityLevel: opportunity.level,
      opportunityScore: opportunity.opportunityScore,
      strategyId: opportunity.strategyId,
      strategyName: opportunity.strategyName,
      strategyScore: opportunity.strategyScore,
      verification: opportunity.verification,
      catalyst: opportunity.catalyst,
      reasons: this.buildReasons(input, tomorrowScore, daily, weekly, category),
      warnings: this.buildWarnings(input),
      positiveSignals: opportunity.positiveSignals ?? [],
      negativeSignals: opportunity.negativeSignals ?? [],
      tags: opportunity.tags ?? [],
      evaluatedAt: new Date().toISOString(),
    };
  }

  private computeTomorrowScore(input: TomorrowInput): number {
    const { opportunity, elite } = input;
    const weights = TOMORROW_SCORE_WEIGHTS;
    const values: Record<TomorrowScoreDimension, number | null> = {
      eliteDaily: this.horizonScore(elite, 'GUNLUK'),
      eliteWeekly: this.horizonScore(elite, 'HAFTALIK'),
      opportunityScore: opportunity.opportunityScore,
      aiScore: opportunity.aiScore,
      decisionScore: opportunity.decisionScore,
      verification: opportunity.verification,
      catalyst: opportunity.catalyst,
    };
    let numerator = 0;
    let denominator = 0;
    for (const key of Object.keys(values) as TomorrowScoreDimension[]) {
      const value = values[key];
      const weight = weights[key];
      if (value != null && weight > 0) {
        numerator += value * weight;
        denominator += weight;
      }
    }
    return denominator > 0 ? Math.round(numerator / denominator) : 0;
  }

  private computeConfidence(input: TomorrowInput): number {
    const { opportunity, elite } = input;
    const present = [
      this.horizonConfidence(elite, 'GUNLUK'),
      opportunity.confidence,
      opportunity.aiConfidence,
    ].filter((v): v is number => v != null);
    if (present.length === 0) {
      return 0;
    }
    return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
  }

  private determineCategory(score: number) {
    for (const meta of TOMORROW_CATEGORIES) {
      if (score >= meta.minScore) {
        return meta;
      }
    }
    return TOMORROW_CATEGORIES[TOMORROW_CATEGORIES.length - 1];
  }

  private buildReasons(
    input: TomorrowInput,
    score: number,
    daily: number,
    weekly: number,
    category: { label: string; stars: string },
  ): string[] {
    const { opportunity } = input;
    const reasons: string[] = [];
    reasons.push(`Yarın Skoru: ${score}/100`);
    reasons.push(`Kategori: ${category.label} (${category.stars})`);
    reasons.push(`Günlük Elite Skor: ${daily}`);
    reasons.push(`Haftalık Elite Skor: ${weekly}`);
    reasons.push(`Karar: ${opportunity.decisionLabel}`);
    reasons.push(`Fırsat: ${opportunity.levelLabel}`);
    const top = this.topDimensions(input);
    for (const dim of top) {
      reasons.push(`${TOMORROW_DIMENSION_LABELS[dim.key]} katkısı güçlü (${dim.value})`);
    }
    return reasons;
  }

  private buildWarnings(input: TomorrowInput): string[] {
    const { opportunity, elite } = input;
    const warnings: string[] = [];
    for (const w of opportunity.warnings ?? []) {
      if (!warnings.includes(w)) {
        warnings.push(w);
      }
    }
    const daily = elite.horizons.find((h) => h.horizon === 'GUNLUK');
    for (const w of daily?.warnings ?? []) {
      if (!warnings.includes(w)) {
        warnings.push(w);
      }
    }
    if (opportunity.verification != null && opportunity.verification < 50) {
      warnings.push('Doğrulama zayıf, haber verileri sınırlı');
    }
    return warnings;
  }

  private topDimensions(input: TomorrowInput): Array<{ key: TomorrowScoreDimension; value: number }> {
    const { opportunity, elite } = input;
    const candidates: Array<{ key: TomorrowScoreDimension; value: number | null }> = [
      { key: 'eliteDaily', value: this.horizonScore(elite, 'GUNLUK') },
      { key: 'eliteWeekly', value: this.horizonScore(elite, 'HAFTALIK') },
      { key: 'opportunityScore', value: opportunity.opportunityScore },
      { key: 'aiScore', value: opportunity.aiScore },
      { key: 'decisionScore', value: opportunity.decisionScore },
      { key: 'verification', value: opportunity.verification },
      { key: 'catalyst', value: opportunity.catalyst },
    ];
    return candidates
      .filter((c): c is { key: TomorrowScoreDimension; value: number } => c.value != null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
  }

  private horizonScore(elite: TomorrowInput['elite'], horizon: string): number {
    const found = elite.horizons.find((h) => h.horizon === horizon);
    return found?.skor ?? 0;
  }

  private horizonConfidence(elite: TomorrowInput['elite'], horizon: string): number | null {
    const found = elite.horizons.find((h) => h.horizon === horizon);
    return found?.confidence ?? null;
  }
}
