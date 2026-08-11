import { Injectable } from '@nestjs/common';
import { SelfLearningEntry } from '../early-opportunity.types';

@Injectable()
export class SelfLearningRegistry {
  private readonly entries = new Map<string, SelfLearningEntry>();

  upsert(entry: SelfLearningEntry): SelfLearningEntry {
    this.entries.set(entry.ticker, entry);
    return entry;
  }

  get(ticker: string): SelfLearningEntry | null {
    return this.entries.get(ticker.toUpperCase()) ?? null;
  }

  getModifier(ticker: string): number {
    return this.get(ticker)?.modifier ?? 1;
  }

  getAll(): SelfLearningEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  resetToBase(): void {
    for (const entry of this.entries.values()) {
      entry.modifier = 1;
      entry.lastUpdated = new Date().toISOString();
    }
  }
}
