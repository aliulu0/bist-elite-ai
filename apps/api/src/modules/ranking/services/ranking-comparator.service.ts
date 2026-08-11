import { Injectable } from '@nestjs/common';
import { RankedOpportunity, ComparisonView, RankingRecommendation } from '../ranking.types';

@Injectable()
export class RankingComparator {
  compare(candidates: RankedOpportunity[], view: ComparisonView, limit: number = 10): RankedOpportunity[] {
    switch (view) {
      case 'TOP_GAINERS':
        return this.topGainers(candidates, limit);
      case 'TOP_LOSERS':
        return this.topLosers(candidates, limit);
      case 'MOST_IMPROVED':
        return this.mostImproved(candidates, limit);
      case 'MOST_CONSISTENT':
        return this.mostConsistent(candidates, limit);
      case 'HIGHEST_CONFIDENCE':
        return this.highestConfidence(candidates, limit);
      case 'LOWEST_RISK':
        return this.lowestRisk(candidates, limit);
      case 'HIGHEST_GROWTH':
        return this.highestGrowth(candidates, limit);
      case 'HIGHEST_VALUE':
        return this.highestValue(candidates, limit);
      default:
        return candidates.slice(0, limit);
    }
  }

  private topGainers(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates]
      .filter((c) => c.metadata.rankChange !== null && c.metadata.rankChange! < 0)
      .sort((a, b) => (a.metadata.rankChange ?? 0) - (b.metadata.rankChange ?? 0))
      .slice(0, limit);
  }

  private topLosers(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates]
      .filter((c) => c.metadata.rankChange !== null && c.metadata.rankChange! > 0)
      .sort((a, b) => (b.metadata.rankChange ?? 0) - (a.metadata.rankChange ?? 0))
      .slice(0, limit);
  }

  private mostImproved(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates]
      .filter((c) => c.metadata.rankingTrend === 'IMPROVING')
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
  }

  private mostConsistent(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates]
      .sort((a, b) => {
        const aSpread = a.metadata.worstRank - a.metadata.bestRank;
        const bSpread = b.metadata.worstRank - b.metadata.bestRank;
        return aSpread - bSpread;
      })
      .slice(0, limit);
  }

  private highestConfidence(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates].sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }

  private lowestRisk(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates].sort((a, b) => a.risk - b.risk).slice(0, limit);
  }

  private highestGrowth(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates]
      .sort((a, b) => {
        const aGrowth = a.rankingFactors.find((f) => f.name === 'growth')?.normalizedValue ?? 0;
        const bGrowth = b.rankingFactors.find((f) => f.name === 'growth')?.normalizedValue ?? 0;
        return bGrowth - aGrowth;
      })
      .slice(0, limit);
  }

  private highestValue(candidates: RankedOpportunity[], limit: number): RankedOpportunity[] {
    return [...candidates]
      .sort((a, b) => {
        const aVal = a.rankingFactors.find((f) => f.name === 'valuation')?.normalizedValue ?? 0;
        const bVal = b.rankingFactors.find((f) => f.name === 'valuation')?.normalizedValue ?? 0;
        return bVal - aVal;
      })
      .slice(0, limit);
  }
}
