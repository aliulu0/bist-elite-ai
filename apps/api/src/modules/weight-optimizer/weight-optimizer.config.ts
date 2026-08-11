export type OptimizationProfile = 'conservative' | 'balanced' | 'aggressive';

export interface WeightOptimizerConfig {
  profile: OptimizationProfile;
  minWeight: number;
  maxWeight: number;
  learningRate: number;
  normalizationTarget: number;
  minTradesForOptimization: number;
  maxAdjustmentPercent: number;
}

export const DEFAULT_WEIGHT_OPTIMIZER_CONFIG: WeightOptimizerConfig = {
  profile: 'balanced',
  minWeight: 5,
  maxWeight: 40,
  learningRate: 0.3,
  normalizationTarget: 100,
  minTradesForOptimization: 5,
  maxAdjustmentPercent: 30,
};

export const PROFILE_CONFIGS: Record<OptimizationProfile, Partial<WeightOptimizerConfig>> = {
  conservative: {
    learningRate: 0.15,
    maxAdjustmentPercent: 15,
    minWeight: 8,
    maxWeight: 35,
  },
  balanced: {
    learningRate: 0.3,
    maxAdjustmentPercent: 30,
    minWeight: 5,
    maxWeight: 40,
  },
  aggressive: {
    learningRate: 0.5,
    maxAdjustmentPercent: 50,
    minWeight: 2,
    maxWeight: 50,
  },
};
