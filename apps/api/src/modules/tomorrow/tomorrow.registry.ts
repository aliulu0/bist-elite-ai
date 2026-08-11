import { Injectable } from '@nestjs/common';
import { TomorrowCandidateResult, TomorrowRegistryEntry } from './tomorrow.types';

@Injectable()
export class TomorrowRegistry {
  private readonly entries = new Map<string, TomorrowRegistryEntry>();

  set(entry: TomorrowRegistryEntry): void {
    this.entries.set(entry.ticker, entry);
  }

  get(ticker: string): TomorrowRegistryEntry | null {
    return this.entries.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.entries.has(ticker);
  }

  getAll(): TomorrowRegistryEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  top(limit: number = 100): TomorrowCandidateResult[] {
    return this.getAll()
      .map((e) => e.result)
      .sort((a, b) => {
        const scoreDiff = b.tomorrowScore - a.tomorrowScore;
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        const eliteDiff = b.eliteDaily - a.eliteDaily;
        if (eliteDiff !== 0) {
          return eliteDiff;
        }
        const aiDiff = (b.aiScore ?? 0) - (a.aiScore ?? 0);
        if (aiDiff !== 0) {
          return aiDiff;
        }
        const confDiff = b.tomorrowConfidence - a.tomorrowConfidence;
        if (confDiff !== 0) {
          return confDiff;
        }
        return a.ticker.localeCompare(b.ticker);
      })
      .slice(0, limit);
  }
}
