import { Injectable } from '@nestjs/common';
import { Priority, OpportunityLevel } from '../opportunity-detection.types';
import { PriorityThresholds } from '../opportunity-detection.config';

@Injectable()
export class PriorityEngine {
  calculate(
    opportunityScore: number,
    confidence: number,
    risk: number,
    freshness: number,
    ageFactor: number,
    thresholds: PriorityThresholds,
  ): Priority {
    const composite = this.calculateCompositeScore(opportunityScore, confidence, risk, freshness, ageFactor);

    if (composite >= thresholds.critical) return 'CRITICAL';
    if (composite >= thresholds.high) return 'HIGH';
    if (composite >= thresholds.medium) return 'MEDIUM';
    if (composite >= thresholds.low) return 'LOW';
    return 'IGNORE';
  }

  calculateCompositeScore(
    opportunityScore: number,
    confidence: number,
    risk: number,
    freshness: number,
    ageFactor: number,
  ): number {
    const normalizedConfidence = confidence;
    const normalizedRisk = 100 - risk;
    const normalizedFreshness = freshness;

    const composite =
      opportunityScore * 0.40 +
      normalizedConfidence * 0.20 +
      normalizedRisk * 0.15 +
      normalizedFreshness * 0.15 +
      ageFactor * 0.10;

    return Math.round(composite * 100) / 100;
  }

  getPriorityDescription(priority: Priority): string {
    const descriptions: Record<Priority, string> = {
      CRITICAL: 'Immediate investigation required — exceptional opportunity',
      HIGH: 'High priority — investigate within current session',
      MEDIUM: 'Medium priority — investigate when convenient',
      LOW: 'Low priority — monitor passively',
      IGNORE: 'Below priority threshold — no action needed',
    };
    return descriptions[priority];
  }
}
