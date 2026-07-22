import { Injectable } from '@nestjs/common';
import {
  EvidenceMatrixEntry,
  ScoreComponentWeights,
  ScoringProfile,
  Timeframe,
} from './types';
import { WeightManager } from './weight-manager.service';

@Injectable()
export class EvidenceMatrixService {
  constructor(private readonly weightManager: WeightManager) {}

  generate(
    componentScores: Record<string, number>,
    profile: ScoringProfile,
    componentLabels?: Record<string, string>,
  ): EvidenceMatrixEntry[] {
    const weights = this.weightManager.getWeights(profile);
    const entries: EvidenceMatrixEntry[] = [];

    for (const [component, weight] of Object.entries(weights) as Array<[string, number]>) {
      const rawScore = componentScores[component] ?? 50;
      const normalizedScore = this.weightManager.normalizeScore(rawScore);
      const contribution = normalizedScore * weight;

      entries.push({
        component: componentLabels?.[component] ?? component,
        weight,
        rawScore,
        normalizedScore,
        contribution,
        positiveImpact: this.getPositiveImpact(component, rawScore),
        negativeImpact: this.getNegativeImpact(component, rawScore),
        confidence: this.calculateConfidence(rawScore),
      });
    }

    return entries.sort((a, b) => b.contribution - a.contribution);
  }

  calculateTotalContribution(entries: EvidenceMatrixEntry[]): number {
    return entries.reduce((sum, e) => sum + e.contribution, 0);
  }

  getTopContributors(entries: EvidenceMatrixEntry[], limit = 3): EvidenceMatrixEntry[] {
    return entries.slice(0, limit);
  }

  getWeakestContributors(entries: EvidenceMatrixEntry[], limit = 3): EvidenceMatrixEntry[] {
    return [...entries].sort((a, b) => a.contribution - b.contribution).slice(0, limit);
  }

  private getPositiveImpact(component: string, score: number): string {
    if (score >= 70) return `${component} güçlü pozitif etki`;
    if (score >= 55) return `${component} ılımlı pozitif etki`;
    return `${component} nötr`;
  }

  private getNegativeImpact(component: string, score: number): string {
    if (score <= 30) return `${component} güçlü negatif risk`;
    if (score <= 45) return `${component} ılımlı negatif risk`;
    return `${component} düşük risk`;
  }

  private calculateConfidence(score: number): number {
    const distance = Math.abs(score - 50);
    return Math.min(1, distance / 50);
  }
}
