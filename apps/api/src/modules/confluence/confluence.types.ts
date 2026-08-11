export type AgreementLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

export interface AlignmentScore {
  score: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: string[];
}

export interface ConfluenceResult {
  confluenceScore: number;
  agreement: AgreementLevel;
  financialAlignment: AlignmentScore;
  technicalAlignment: AlignmentScore;
  smartMoneyAlignment: AlignmentScore;
  trendAlignment: AlignmentScore;
  confidence: number;
  metadata: Record<string, unknown>;
  isValid: boolean;
}
