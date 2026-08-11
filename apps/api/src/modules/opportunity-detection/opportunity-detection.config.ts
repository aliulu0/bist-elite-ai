export interface DetectionModuleWeights {
  priceStructure: number;
  volumeBehaviour: number;
  momentumShift: number;
  trendTransition: number;
  movingAverageStructure: number;
  rsiBehaviour: number;
  macdBehaviour: number;
  atrExpansion: number;
  volatilityCompression: number;
  liquidityImprovement: number;
  relativeStrength: number;
  sectorStrength: number;
  fundamentalChange: number;
  valuationDiscount: number;
  financialQuality: number;
  cashFlowImprovement: number;
  debtImprovement: number;
  growthAcceleration: number;
  institutionalInterest: number;
  compositeOpportunity: number;
}

export interface DetectionModuleEnabled {
  priceStructure: boolean;
  volumeBehaviour: boolean;
  momentumShift: boolean;
  trendTransition: boolean;
  movingAverageStructure: boolean;
  rsiBehaviour: boolean;
  macdBehaviour: boolean;
  atrExpansion: boolean;
  volatilityCompression: boolean;
  liquidityImprovement: boolean;
  relativeStrength: boolean;
  sectorStrength: boolean;
  fundamentalChange: boolean;
  valuationDiscount: boolean;
  financialQuality: boolean;
  cashFlowImprovement: boolean;
  debtImprovement: boolean;
  growthAcceleration: boolean;
  institutionalInterest: boolean;
  compositeOpportunity: boolean;
}

export interface OpportunityLevelThresholds {
  support: number;
  none: number;
  watch: number;
  interesting: number;
  emerging: number;
  strong: number;
  veryStrong: number;
  exceptional: number;
}

export interface PriorityThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface PenaltyConfig {
  lowLiquidityPenalty: number;
  highVolatilityPenalty: number;
  lowProviderConfidencePenalty: number;
  missingFundamentalsPenalty: number;
  weakConfirmationsPenalty: number;
  contradictingIndicatorsPenalty: number;
  lowAggregationQualityPenalty: number;
}

export interface ConfirmationConfig {
  singleThreshold: number;
  doubleThreshold: number;
  tripleThreshold: number;
  multiThreshold: number;
  minModulesForConfirmation: number;
}

export interface AgeConfig {
  newDurationMs: number;
  growingDurationMs: number;
  stableDurationMs: number;
  weakeningDurationMs: number;
  expiredDurationMs: number;
  scoreDeltaGrowing: number;
  scoreDeltaWeakening: number;
}

export interface OpportunityDetectionConfig {
  moduleWeights: DetectionModuleWeights;
  moduleEnabled: DetectionModuleEnabled;
  levelThresholds: OpportunityLevelThresholds;
  priorityThresholds: PriorityThresholds;
  penalty: PenaltyConfig;
  confirmation: ConfirmationConfig;
  age: AgeConfig;
  minConfidence: number;
  minDataCompleteness: number;
  maxDuplicateHistory: number;
  version: string;
}

export const DEFAULT_DETECTION_MODULE_WEIGHTS: DetectionModuleWeights = {
  priceStructure: 6,
  volumeBehaviour: 6,
  momentumShift: 7,
  trendTransition: 6,
  movingAverageStructure: 5,
  rsiBehaviour: 5,
  macdBehaviour: 5,
  atrExpansion: 4,
  volatilityCompression: 5,
  liquidityImprovement: 5,
  relativeStrength: 5,
  sectorStrength: 4,
  fundamentalChange: 7,
  valuationDiscount: 6,
  financialQuality: 5,
  cashFlowImprovement: 5,
  debtImprovement: 4,
  growthAcceleration: 5,
  institutionalInterest: 4,
  compositeOpportunity: 10,
};

export const DEFAULT_DETECTION_MODULE_ENABLED: DetectionModuleEnabled = {
  priceStructure: true,
  volumeBehaviour: true,
  momentumShift: true,
  trendTransition: true,
  movingAverageStructure: true,
  rsiBehaviour: true,
  macdBehaviour: true,
  atrExpansion: true,
  volatilityCompression: true,
  liquidityImprovement: true,
  relativeStrength: true,
  sectorStrength: true,
  fundamentalChange: true,
  valuationDiscount: true,
  financialQuality: true,
  cashFlowImprovement: true,
  debtImprovement: true,
  growthAcceleration: true,
  institutionalInterest: true,
  compositeOpportunity: true,
};

export const DEFAULT_LEVEL_THRESHOLDS: OpportunityLevelThresholds = {
  support: 0,
  none: 15,
  watch: 30,
  interesting: 45,
  emerging: 60,
  strong: 72,
  veryStrong: 82,
  exceptional: 90,
};

export const DEFAULT_PRIORITY_THRESHOLDS: PriorityThresholds = {
  critical: 85,
  high: 70,
  medium: 50,
  low: 30,
};

export const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  lowLiquidityPenalty: 8,
  highVolatilityPenalty: 6,
  lowProviderConfidencePenalty: 10,
  missingFundamentalsPenalty: 12,
  weakConfirmationsPenalty: 5,
  contradictingIndicatorsPenalty: 15,
  lowAggregationQualityPenalty: 8,
};

export const DEFAULT_CONFIRMATION_CONFIG: ConfirmationConfig = {
  singleThreshold: 60,
  doubleThreshold: 65,
  tripleThreshold: 70,
  multiThreshold: 75,
  minModulesForConfirmation: 2,
};

export const DEFAULT_AGE_CONFIG: AgeConfig = {
  newDurationMs: 24 * 60 * 60 * 1000,
  growingDurationMs: 3 * 24 * 60 * 60 * 1000,
  stableDurationMs: 7 * 24 * 60 * 60 * 1000,
  weakeningDurationMs: 14 * 24 * 60 * 60 * 1000,
  expiredDurationMs: 30 * 24 * 60 * 60 * 1000,
  scoreDeltaGrowing: 5,
  scoreDeltaWeakening: -5,
};

export const DEFAULT_OPPORTUNITY_DETECTION_CONFIG: OpportunityDetectionConfig = {
  moduleWeights: DEFAULT_DETECTION_MODULE_WEIGHTS,
  moduleEnabled: DEFAULT_DETECTION_MODULE_ENABLED,
  levelThresholds: DEFAULT_LEVEL_THRESHOLDS,
  priorityThresholds: DEFAULT_PRIORITY_THRESHOLDS,
  penalty: DEFAULT_PENALTY_CONFIG,
  confirmation: DEFAULT_CONFIRMATION_CONFIG,
  age: DEFAULT_AGE_CONFIG,
  minConfidence: 30,
  minDataCompleteness: 0.3,
  maxDuplicateHistory: 50,
  version: '1.0.0',
};
