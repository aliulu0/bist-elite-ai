import { Injectable } from '@nestjs/common';
import { EntryRegistryEntry, EntryZoneResult } from './entry-zone.types';

@Injectable()
export class EntryRegistry {
  private readonly entries = new Map<string, EntryRegistryEntry>();

  set(entry: EntryRegistryEntry): void {
    this.entries.set(entry.ticker, entry);
  }

  get(ticker: string): EntryRegistryEntry | null {
    return this.entries.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.entries.has(ticker);
  }

  getAll(): EntryRegistryEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  top(limit: number = 10): EntryZoneResult[] {
    return this.getAll()
      .map((e) => e.result)
      .sort((a, b) => {
        const confidenceDiff = b.entryConfidence - a.entryConfidence;
        if (confidenceDiff !== 0) {
          return confidenceDiff;
        }
        const rrDiff = (b.riskRewardRatio ?? 0) - (a.riskRewardRatio ?? 0);
        if (rrDiff !== 0) {
          return rrDiff;
        }
        return a.ticker.localeCompare(b.ticker);
      })
      .slice(0, limit);
  }
}
