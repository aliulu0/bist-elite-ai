import { Injectable } from '@nestjs/common';
import { OpportunityRankingService } from '../ai-opportunity/opportunity-ranking.service';
import {
  OpportunityCenterCard,
  OpportunityCenterRegistryEntry,
} from './opportunity-center.types';

@Injectable()
export class OpportunityCenterRegistry {
  private readonly entries = new Map<string, OpportunityCenterRegistryEntry>();
  private readonly tomorrowEntries = new Map<string, OpportunityCenterRegistryEntry>();

  constructor(private readonly ranking: OpportunityRankingService) {}

  set(entry: OpportunityCenterRegistryEntry): void {
    this.entries.set(entry.ticker, entry);
  }

  get(ticker: string): OpportunityCenterRegistryEntry | null {
    return this.entries.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.entries.has(ticker);
  }

  getAll(): OpportunityCenterRegistryEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  top(limit: number = 100): OpportunityCenterCard[] {
    const ranked = this.ranking.rank(
      this.getAll().map((e) => e.kart),
      limit,
    );
    const byTicker = new Map(this.getAll().map((e) => [e.ticker, e]));
    return ranked.map((kart) => byTicker.get(kart.ticker)!.kart);
  }

  setTomorrow(entry: OpportunityCenterRegistryEntry): void {
    this.tomorrowEntries.set(entry.ticker, entry);
  }

  getTomorrowEntries(): OpportunityCenterRegistryEntry[] {
    return [...this.tomorrowEntries.values()];
  }

  hasTomorrow(ticker: string): boolean {
    return this.tomorrowEntries.has(ticker);
  }

  countTomorrow(): number {
    return this.tomorrowEntries.size;
  }

  clearTomorrow(): void {
    this.tomorrowEntries.clear();
  }
}
