import { Injectable } from '@nestjs/common';
import {
  EarlyOpportunityInput,
  EarlyOpportunityOutput,
  ScoringConfig,
  getScoringConfig,
} from './types';

@Injectable()
export class EarlyOpportunityDetector {
  private readonly config: ScoringConfig['earlyOpportunity'];

  constructor() {
    const config = getScoringConfig();
    this.config = config.earlyOpportunity;
  }

  detect(input: EarlyOpportunityInput): EarlyOpportunityOutput {
    const freshnessBonus = this.calculateFreshnessBonus(
      input.signalFreshness,
      input.timeSinceDetection,
    );
    const confirmationPenalty = this.calculateConfirmationPenalty(
      input.confirmationLevel,
      input.competitorConfirmation,
    );
    const earlyDetectionBonus = this.calculateEarlyDetectionBonus(input.timeSinceDetection);

    let score = 50 + freshnessBonus + earlyDetectionBonus + confirmationPenalty;
    score = this.clamp(score);

    const description = this.generateDescription(
      freshnessBonus,
      confirmationPenalty,
      earlyDetectionBonus,
    );

    return {
      score,
      freshnessBonus,
      confirmationPenalty,
      earlyDetectionBonus,
      description,
    };
  }

  private calculateFreshnessBonus(signalFreshness: number, timeSinceDetection: number): number {
    if (signalFreshness >= 0.8 && timeSinceDetection <= 24) {
      return this.config.maxBonus * 0.8;
    }
    if (signalFreshness >= 0.6 && timeSinceDetection <= 48) {
      return this.config.maxBonus * 0.5;
    }
    if (signalFreshness >= 0.4 && timeSinceDetection <= 72) {
      return this.config.maxBonus * 0.2;
    }
    const decay = Math.exp((-this.config.freshnessDecayRate * timeSinceDetection) / 24);
    return this.config.maxBonus * decay * 0.3;
  }

  private calculateConfirmationPenalty(
    confirmationLevel: number,
    competitorConfirmation: number,
  ): number {
    const lowConfirmationPenalty =
      (1 - confirmationLevel) * this.config.confirmationPenaltyRate * -30;
    const competitorPenalty = competitorConfirmation * -10;
    return lowConfirmationPenalty + competitorPenalty;
  }

  private calculateEarlyDetectionBonus(timeSinceDetection: number): number {
    if (timeSinceDetection <= 6) return 15;
    if (timeSinceDetection <= 12) return 10;
    if (timeSinceDetection <= 24) return 5;
    if (timeSinceDetection <= 48) return 2;
    return 0;
  }

  private generateDescription(
    freshnessBonus: number,
    confirmationPenalty: number,
    earlyDetectionBonus: number,
  ): string {
    const parts: string[] = [];

    if (freshnessBonus > 10) {
      parts.push('Taze sinyal tespit edildi');
    } else if (freshnessBonus > 5) {
      parts.push('Orta tazelikte sinyal');
    }

    if (earlyDetectionBonus >= 10) {
      parts.push('Erken tespit avantajı yüksek');
    } else if (earlyDetectionBonus >= 5) {
      parts.push('Erken tespit avantajı mevcut');
    }

    if (confirmationPenalty < -15) {
      parts.push('Düşük onay seviyesi riskli');
    } else if (confirmationPenalty < -5) {
      parts.push('Onay seviyesi yeterli değil');
    }

    if (parts.length === 0) {
      parts.push('Standart tespit koşulları');
    }

    return parts.join('. ') + '.';
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value));
  }
}
