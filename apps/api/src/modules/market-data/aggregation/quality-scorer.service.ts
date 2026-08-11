import { Injectable } from '@nestjs/common';
import { ProviderContribution, AggregationMetadata } from './aggregation.types';

const WEIGHTS = {
  providerAgreement: 0.25,
  fieldCompleteness: 0.25,
  providerPriority: 0.20,
  providerHealth: 0.15,
  staleness: 0.15,
} as const;

@Injectable()
export class QualityScorer {
  calculate(
    contributions: ProviderContribution[],
    metadata: Pick<AggregationMetadata, 'validationWarnings' | 'conflictCount' | 'providersQueried'>,
  ): number {
    if (contributions.length === 0) return 0;

    const agreement = this.scoreProviderAgreement(contributions);
    const completeness = this.scoreFieldCompleteness(contributions);
    const priority = this.scoreProviderPriority(contributions);
    const health = this.scoreProviderHealth(contributions);
    const staleness = this.scoreStaleness(contributions);
    const warningPenalty = this.calculateWarningPenalty(metadata.validationWarnings);
    const conflictPenalty = Math.min(metadata.conflictCount * 2, 15);

    const raw =
      agreement * WEIGHTS.providerAgreement +
      completeness * WEIGHTS.fieldCompleteness +
      priority * WEIGHTS.providerPriority +
      health * WEIGHTS.providerHealth +
      staleness * WEIGHTS.staleness;

    const score = Math.max(0, Math.min(100, Math.round(raw - warningPenalty - conflictPenalty)));
    return score;
  }

  private scoreProviderAgreement(contributions: ProviderContribution[]): number {
    if (contributions.length <= 1) return 70;

    const totalFields = contributions.reduce((sum, c) => sum + c.fieldsReturned, 0);
    const maxPossible = contributions.reduce((sum, c) => sum + c.fieldsExpected, 0);

    if (maxPossible === 0) return 0;
    return (totalFields / maxPossible) * 100;
  }

  private scoreFieldCompleteness(contributions: ProviderContribution[]): number {
    if (contributions.length === 0) return 0;

    const bestCompleteness = Math.max(
      ...contributions.map((c) => (c.fieldsExpected > 0 ? c.fieldsReturned / c.fieldsExpected : 0)),
    );

    return bestCompleteness * 100;
  }

  private scoreProviderPriority(contributions: ProviderContribution[]): number {
    if (contributions.length === 0) return 0;

    const minPriority = Math.min(...contributions.map((c) => c.priority));
    const maxPriority = 10;

    return Math.max(0, ((maxPriority - minPriority) / maxPriority) * 100);
  }

  private scoreProviderHealth(contributions: ProviderContribution[]): number {
    if (contributions.length === 0) return 0;

    const healthyCount = contributions.filter((c) => c.healthy).length;
    return (healthyCount / contributions.length) * 100;
  }

  private scoreStaleness(contributions: ProviderContribution[]): number {
    if (contributions.length === 0) return 0;

    const now = Date.now();
    const stalenessThreshold = 24 * 60 * 60 * 1000;

    const scores = contributions.map((c) => {
      const lastUpdated = new Date(c.provider).getTime();
      if (isNaN(lastUpdated)) return 50;
      const age = now - lastUpdated;
      if (age <= 0) return 100;
      if (age >= stalenessThreshold) return 20;
      return 100 - (age / stalenessThreshold) * 80;
    });

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  private calculateWarningPenalty(warnings: Array<{ severity: string }>): number {
    let penalty = 0;
    for (const w of warnings) {
      if (w.severity === 'error') penalty += 5;
      else if (w.severity === 'warning') penalty += 2;
      else penalty += 0.5;
    }
    return Math.min(penalty, 25);
  }
}
