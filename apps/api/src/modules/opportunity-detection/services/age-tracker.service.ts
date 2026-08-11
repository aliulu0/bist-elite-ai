import { Injectable } from '@nestjs/common';
import { OpportunityAge, OpportunityLevel, OpportunityHistoryEntry } from '../opportunity-detection.types';
import { AgeConfig } from '../opportunity-detection.config';

@Injectable()
export class AgeTracker {
  determineAge(
    history: OpportunityHistoryEntry[],
    config: AgeConfig,
  ): OpportunityAge {
    if (history.length === 0) return 'NEW';

    const latest = history[history.length - 1];
    const first = history[0];
    const now = Date.now();
    const ageMs = now - new Date(first.timestamp).getTime();
    const latestMs = now - new Date(latest.timestamp).getTime();

    if (latestMs > config.expiredDurationMs) return 'EXPIRED';

    const scoreDelta = latest.score - first.score;

    if (scoreDelta > config.scoreDeltaGrowing && history.length >= 2) return 'GROWING';
    if (scoreDelta < config.scoreDeltaWeakening && history.length >= 2) return 'WEAKENING';

    if (ageMs < config.newDurationMs) return 'NEW';
    if (ageMs < config.stableDurationMs) return 'STABLE';

    return 'STABLE';
  }

  getAgeFactor(age: OpportunityAge): number {
    const factors: Record<OpportunityAge, number> = {
      NEW: 100,
      GROWING: 90,
      STABLE: 60,
      WEAKENING: 30,
      EXPIRED: 0,
    };
    return factors[age];
  }

  shouldNotify(age: OpportunityAge, lastNotifiedMs: number | null, cooldownMs: number): boolean {
    if (age === 'EXPIRED') return false;
    if (lastNotifiedMs === null) return true;
    return Date.now() - lastNotifiedMs > cooldownMs;
  }
}
