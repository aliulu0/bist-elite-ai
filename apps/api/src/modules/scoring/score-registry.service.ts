import { Injectable } from '@nestjs/common';
import { StrategyWeightProfile, ScoreWeights } from './scoring-types';
import { STRATEGY_WEIGHT_PROFILES } from './score-weights';

@Injectable()
export class ScoreRegistry {
  private readonly profiles = new Map<string, StrategyWeightProfile>();

  constructor() {
    for (const [id, { name, weights }] of Object.entries(STRATEGY_WEIGHT_PROFILES)) {
      this.profiles.set(id, { strategyId: id, strategyName: name, weights });
    }
  }

  register(profile: StrategyWeightProfile): void {
    this.profiles.set(profile.strategyId, profile);
  }

  unregister(strategyId: string): boolean {
    return this.profiles.delete(strategyId);
  }

  getWeightProfile(strategyId: string): StrategyWeightProfile | null {
    return this.profiles.get(strategyId) ?? null;
  }

  getWeights(strategyId: string): ScoreWeights | null {
    const profile = this.profiles.get(strategyId);
    return profile?.weights ?? null;
  }

  listWeightProfiles(): StrategyWeightProfile[] {
    return [...this.profiles.values()];
  }

  has(strategyId: string): boolean {
    return this.profiles.has(strategyId);
  }
}