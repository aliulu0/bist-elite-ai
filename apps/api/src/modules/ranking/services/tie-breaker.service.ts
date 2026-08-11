import { Injectable } from '@nestjs/common';

@Injectable()
export class TieBreaker {
  breakTies<T extends { symbol: string; rankingScore: number; confidence: number; risk: number; timestamp: string }>(
    items: T[],
  ): T[] {
    return [...items].sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      if (a.risk !== b.risk) return a.risk - b.risk;
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return a.symbol.localeCompare(b.symbol);
    });
  }
}
