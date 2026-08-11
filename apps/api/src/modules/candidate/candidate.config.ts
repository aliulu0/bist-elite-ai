export interface DimensionWeights {
  financial: number;
  technical: number;
  confluence: number;
}

export interface ScoreThresholds {
  minCandidateScore: number;
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
}

export interface FinancialCriteria {
  minScore: number;
  minPassedRules: number;
  maxFailedRules: number;
  minConfidence: number;
}

export interface TechnicalCriteria {
  minScore: number;
  minConfidence: number;
}

export interface ConfluenceCriteria {
  minScore: number;
  minConfidence: number;
}

export interface CandidateConfig {
  dimensionWeights: DimensionWeights;
  scoreThresholds: ScoreThresholds;
  financialCriteria: FinancialCriteria;
  technicalCriteria: TechnicalCriteria;
  confluenceCriteria: ConfluenceCriteria;
}

export const DEFAULT_CANDIDATE_CONFIG: CandidateConfig = {
  dimensionWeights: {
    financial: 30,
    technical: 30,
    confluence: 40,
  },
  scoreThresholds: {
    minCandidateScore: 40,
    veryHigh: 85,
    high: 70,
    medium: 55,
    low: 40,
  },
  financialCriteria: {
    minScore: 50,
    minPassedRules: 2,
    maxFailedRules: 3,
    minConfidence: 0.4,
  },
  technicalCriteria: {
    minScore: 40,
    minConfidence: 0.3,
  },
  confluenceCriteria: {
    minScore: 45,
    minConfidence: 0.3,
  },
};
