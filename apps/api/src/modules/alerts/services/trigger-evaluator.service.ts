import { Injectable, Logger } from '@nestjs/common';
import { TriggerCondition, AlertType } from '../alerts.types';
import { RankedOpportunity } from '../../ranking/ranking.types';
import { DEFAULT_TRIGGERS } from '../alerts.config';

export interface TriggerMatch {
  condition: TriggerCondition;
  matched: boolean;
  score: number;
  reason: string;
}

@Injectable()
export class TriggerEvaluator {
  private readonly logger = new Logger(TriggerEvaluator.name);
  private readonly triggers: TriggerCondition[];

  constructor(triggers?: TriggerCondition[]) {
    this.triggers = triggers ?? DEFAULT_TRIGGERS;
  }

  evaluate(ranked: RankedOpportunity): TriggerMatch[] {
    const results: TriggerMatch[] = [];
    for (const condition of this.triggers) {
      const result = this.evaluateCondition(condition, ranked);
      results.push(result);
    }
    return results;
  }

  private evaluateCondition(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    switch (condition.type) {
      case 'RANKING_CHANGE': return this.evaluateRankingChange(condition, ranked);
      case 'STRONG_BUY': return this.evaluateStrongBuy(condition, ranked);
      case 'STRONG_SELL': return this.evaluateStrongSell(condition, ranked);
      case 'CONFIDENCE_INCREASE': return this.evaluateConfidenceIncrease(condition, ranked);
      case 'CONFIDENCE_DROP': return this.evaluateConfidenceDrop(condition, ranked);
      case 'OPPORTUNITY': return this.evaluateOpportunity(condition, ranked);
      case 'RISK': return this.evaluateRisk(condition, ranked);
      case 'WATCHLIST': return this.evaluateWatchlist(condition, ranked);
      case 'PRICE_BREAKOUT': return this.evaluatePriceBreakout(condition, ranked);
      case 'VOLUME_SPIKE': return this.evaluateVolumeSpike(condition, ranked);
      default:
        return { condition, matched: false, score: 0, reason: `Unknown condition type: ${condition.type}` };
    }
  }

  private evaluateRankingChange(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    const reasons: string[] = [];
    const prevRank = ranked.metadata.previousRank;
    const rankChange = ranked.metadata.rankChange;

    if (condition.rankTopN !== undefined && ranked.rank <= condition.rankTopN) {
      reasons.push(`Rank ${ranked.rank} is in Top ${condition.rankTopN}`);
    }
    if (condition.rankPositionIncrease !== undefined && rankChange !== null && rankChange >= condition.rankPositionIncrease) {
      reasons.push(`Rank increased by ${rankChange} positions (>= ${condition.rankPositionIncrease})`);
    }
    if (prevRank === null) {
      reasons.push('New entry in rankings');
    }

    if (reasons.length > 0) {
      return { condition, matched: true, score: Math.max(1, 100 - ranked.rank), reason: reasons.join('; ') };
    }
    return { condition, matched: false, score: 0, reason: 'No ranking change trigger matched' };
  }

  private evaluateStrongBuy(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (condition.strongBuyOnly && ranked.recommendation === 'STRONG_BUY') {
      return { condition, matched: true, score: ranked.rankingScore, reason: 'Strong Buy recommendation' };
    }
    return { condition, matched: false, score: 0, reason: 'Not a Strong Buy' };
  }

  private evaluateStrongSell(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (ranked.recommendation === 'REDUCE' || ranked.recommendation === 'AVOID') {
      return { condition, matched: true, score: 100 - ranked.rankingScore, reason: `Strong sell signal: ${ranked.recommendation}` };
    }
    return { condition, matched: false, score: 0, reason: 'Not a sell signal' };
  }

  private evaluateConfidenceIncrease(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (condition.minConfidence !== undefined && ranked.confidence >= condition.minConfidence) {
      return { condition, matched: true, score: ranked.confidence, reason: `Confidence ${ranked.confidence} >= ${condition.minConfidence}` };
    }
    return { condition, matched: false, score: 0, reason: 'Confidence below threshold' };
  }

  private evaluateConfidenceDrop(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (condition.minConfidence !== undefined && ranked.confidence < condition.minConfidence) {
      return { condition, matched: true, score: 100 - ranked.confidence, reason: `Confidence dropped to ${ranked.confidence}` };
    }
    return { condition, matched: false, score: 0, reason: 'Confidence above threshold' };
  }

  private evaluateOpportunity(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (condition.minOpportunityScore !== undefined && ranked.opportunityScore >= condition.minOpportunityScore) {
      return { condition, matched: true, score: ranked.opportunityScore, reason: `Opportunity score ${ranked.opportunityScore} >= ${condition.minOpportunityScore}` };
    }
    return { condition, matched: false, score: 0, reason: 'Opportunity score below threshold' };
  }

  private evaluateRisk(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (condition.criticalRiskOnly && ranked.risk >= 80) {
      return { condition, matched: true, score: ranked.risk, reason: `Critical risk level: ${ranked.risk}` };
    }
    return { condition, matched: false, score: 0, reason: 'Risk below critical threshold' };
  }

  private evaluateWatchlist(condition: TriggerCondition, ranked: RankedOpportunity): TriggerMatch {
    if (condition.watchlistOnly) {
      return { condition, matched: true, score: 50, reason: 'Watchlist item' };
    }
    return { condition, matched: false, score: 0, reason: 'No watchlist filter' };
  }

  private evaluatePriceBreakout(_condition: TriggerCondition, _ranked: RankedOpportunity): TriggerMatch {
    return { condition: _condition, matched: false, score: 0, reason: 'Price breakout requires market data' };
  }

  private evaluateVolumeSpike(_condition: TriggerCondition, _ranked: RankedOpportunity): TriggerMatch {
    return { condition: _condition, matched: false, score: 0, reason: 'Volume spike requires market data' };
  }

  getTriggers(): TriggerCondition[] {
    return [...this.triggers];
  }
}
