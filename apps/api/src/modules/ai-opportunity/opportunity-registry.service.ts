import { Injectable } from '@nestjs/common';
import { OpportunityRankingService } from './opportunity-ranking.service';
import { OpportunityRegistryEntry } from './opportunity.types';

@Injectable()
export class OpportunityRegistry {
  private readonly entries = new Map<string, OpportunityRegistryEntry>();

  constructor(private readonly ranking: OpportunityRankingService) {}

  set(entry: OpportunityRegistryEntry): void {
    this.entries.set(entry.ticker, entry);
  }

  get(ticker: string): OpportunityRegistryEntry | null {
    return this.entries.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.entries.has(ticker);
  }

  getAll(): OpportunityRegistryEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  top(limit: number = 10): OpportunityRegistryEntry[] {
    return this.ranking
      .rank(
        this.getAll().map((e) => e.result),
        limit,
      )
      .map((result) => this.entries.get(result.ticker)!);
  }
}
