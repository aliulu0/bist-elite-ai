export interface EliteScoreDimensionWeights {
  financial: number;
  technical: number;
  opportunity: number;
  confluence: number;
  candidate: number;
}

export interface RatingThresholds {
  aaa: number;
  aa: number;
  a: number;
  bbb: number;
  bb: number;
  b: number;
  c: number;
}

export interface PriorityThresholds {
  critical: number;
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
}

export interface EliteScoreConfig {
  dimensionWeights: EliteScoreDimensionWeights;
  ratingThresholds: RatingThresholds;
  priorityThresholds: PriorityThresholds;
  minConfidenceForEarlyOpportunity: number;
}

export const DEFAULT_ELITE_SCORE_CONFIG: EliteScoreConfig = {
  dimensionWeights: {
    financial: 25,
    technical: 25,
    opportunity: 20,
    confluence: 15,
    candidate: 15,
  },
  ratingThresholds: {
    aaa: 90,
    aa: 80,
    a: 70,
    bbb: 60,
    bb: 50,
    b: 40,
    c: 30,
  },
  priorityThresholds: {
    critical: 90,
    veryHigh: 80,
    high: 70,
    medium: 55,
    low: 40,
  },
  minConfidenceForEarlyOpportunity: 0.5,
};
