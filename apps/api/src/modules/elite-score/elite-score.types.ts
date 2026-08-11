export type EliteScoreRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D';
export type EliteScorePriority = 'CRITICAL' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface EliteScoreBreakdownItem {
  score: number;
  weight: number;
  contribution: number;
}

export interface EliteScoreBreakdown {
  financial: EliteScoreBreakdownItem;
  technical: EliteScoreBreakdownItem;
  opportunity: EliteScoreBreakdownItem;
  confluence: EliteScoreBreakdownItem;
  candidate: EliteScoreBreakdownItem;
}

export interface EliteScoreResult {
  eliteScore: number;
  rating: EliteScoreRating;
  priority: EliteScorePriority;
  confidence: number;
  earlyOpportunity: boolean;
  summary: string;
  breakdown: EliteScoreBreakdown;
  metadata: Record<string, unknown>;
  isValid: boolean;
}
