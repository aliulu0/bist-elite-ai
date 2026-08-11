import { Injectable } from '@nestjs/common';
import { StabilityConfig, RankHistoryEntry, RankedOpportunity } from '../ranking.types';

@Injectable()
export class RankingStabilizer {
  private readonly config: StabilityConfig;
  private readonly previousRanks: Map<string, number> = new Map();

  constructor(config: StabilityConfig) {
    this.config = config;
  }

  stabilize(candidates: RankedOpportunity[], history: Map<string, RankHistoryEntry[]>): RankedOpportunity[] {
    if (!this.config.enabled) return candidates;

    return candidates.map((c) => {
      const prevRank = this.previousRanks.get(c.symbol);
      if (prevRank === undefined) {
        this.previousRanks.set(c.symbol, c.rank);
        return c;
      }

      const rankDelta = Math.abs(c.rank - prevRank);
      if (rankDelta < this.config.minRankChangeForMove) {
        return { ...c, rank: prevRank, metadata: { ...c.metadata, previousRank: prevRank, rankChange: 0 } };
      }

      this.previousRanks.set(c.symbol, c.rank);
      return c;
    });
  }

  getPreviousRank(symbol: string): number | null {
    return this.previousRanks.get(symbol) ?? null;
  }

  clear(): void {
    this.previousRanks.clear();
  }
}
