import { Injectable } from '@nestjs/common';
import { RankHistoryEntry, InvestmentGrade, RankingRecommendation, RankingTrend, HistoryConfig } from '../ranking.types';

@Injectable()
export class RankingHistory {
  private readonly history: Map<string, RankHistoryEntry[]> = new Map();
  private readonly config: HistoryConfig;

  constructor(config: HistoryConfig) {
    this.config = config;
  }

  record(symbol: string, rank: number, score: number, grade: InvestmentGrade, recommendation: RankingRecommendation): void {
    const entries = this.history.get(symbol) ?? [];
    entries.push({
      timestamp: new Date().toISOString(),
      rank,
      rankingScore: score,
      grade,
      recommendation,
    });
    if (entries.length > this.config.maxEntries) {
      this.history.set(symbol, entries.slice(-this.config.maxEntries));
    } else {
      this.history.set(symbol, entries);
    }
  }

  getHistory(symbol: string): RankHistoryEntry[] {
    return this.history.get(symbol) ?? [];
  }

  getPreviousRank(symbol: string): number | null {
    const entries = this.history.get(symbol);
    return entries && entries.length >= 2 ? entries[entries.length - 2].rank : null;
  }

  getBestRank(symbol: string): number {
    const entries = this.history.get(symbol);
    if (!entries || entries.length === 0) return 0;
    return Math.min(...entries.map((e) => e.rank));
  }

  getWorstRank(symbol: string): number {
    const entries = this.history.get(symbol);
    if (!entries || entries.length === 0) return 0;
    return Math.max(...entries.map((e) => e.rank));
  }

  getAverageRank(symbol: string): number {
    const entries = this.history.get(symbol);
    if (!entries || entries.length === 0) return 0;
    return Math.round(entries.reduce((s, e) => s + e.rank, 0) / entries.length);
  }

  getRankTrend(symbol: string): RankingTrend {
    const entries = this.history.get(symbol);
    if (!entries || entries.length < 2) return 'NEW';
    const windowSize = Math.min(entries.length, 5);
    const recent = entries.slice(-windowSize);
    if (recent.length < 2) return 'NEW';
    const first = recent[0].rank;
    const last = recent[recent.length - 1].rank;
    if (last < first - 1) return 'IMPROVING';
    if (last > first + 1) return 'DECLINING';
    return 'STABLE';
  }

  getHistoryCount(symbol: string): number {
    return (this.history.get(symbol) ?? []).length;
  }

  clear(): void {
    this.history.clear();
  }
}
