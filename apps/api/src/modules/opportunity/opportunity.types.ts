export type OpportunityLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface OpportunityResult {
  opportunityScore: number;
  earlyOpportunity: boolean;
  opportunityLevel: OpportunityLevel;
  confidence: number;
  strengths: string[];
  riskFactors: string[];
  reasons: string[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}
