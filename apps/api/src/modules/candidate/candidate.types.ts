export type CandidatePriority = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECT';

export interface DimensionEvaluation {
  score: number;
  passed: boolean;
  factors: string[];
}

export interface CandidateResult {
  candidate: boolean;
  candidateScore: number;
  priority: CandidatePriority;
  reasons: string[];
  confidence: number;
  metadata: Record<string, unknown>;
  isValid: boolean;
}
