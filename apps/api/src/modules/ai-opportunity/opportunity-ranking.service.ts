import { Injectable } from '@nestjs/common';
import { getDecisionStrength } from '../decision/decision-rules';
import { getOpportunityLevelStrength } from './opportunity-rules';
import { OpportunityResult } from './opportunity.types';

@Injectable()
export class OpportunityRankingService {
  rank(results: OpportunityResult[], limit?: number): OpportunityResult[] {
    const sorted = [...results].sort((a, b) => {
      const levelDiff =
        getOpportunityLevelStrength(b.level) - getOpportunityLevelStrength(a.level);
      if (levelDiff !== 0) {
        return levelDiff;
      }
      const scoreDiff = b.opportunityScore - a.opportunityScore;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      const decisionDiff =
        getDecisionStrength(b.decision) - getDecisionStrength(a.decision);
      if (decisionDiff !== 0) {
        return decisionDiff;
      }
      const aiDiff = (b.aiScore ?? 0) - (a.aiScore ?? 0);
      if (aiDiff !== 0) {
        return aiDiff;
      }
      return b.confidence - a.confidence;
    });
    if (limit != null && limit > 0) {
      return sorted.slice(0, limit);
    }
    return sorted;
  }
}
