export interface SimulationResult {
  currentScore: number;
  optimizedScore: number;
  improvementPercent: number;
  tradesAnalyzed: number;
}

export interface WeightOptimizationResult {
  recommendedWeights: Record<string, number>;
  expectedImprovement: number;
  confidence: number;
  simulation: SimulationResult;
  metadata: Record<string, unknown>;
}
