import { Injectable } from '@nestjs/common';
import { EliteScoreHorizon, EliteScoreRegistryEntry, EliteScoreResult } from './elite-score.types';

@Injectable()
export class EliteScoreRegistry {
  private readonly entries = new Map<string, EliteScoreRegistryEntry>();

  set(entry: EliteScoreRegistryEntry): void {
    this.entries.set(entry.ticker, entry);
  }

  get(ticker: string): EliteScoreRegistryEntry | null {
    return this.entries.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.entries.has(ticker);
  }

  getAll(): EliteScoreRegistryEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  top(limit: number = 100): EliteScoreResult[] {
    return this.getAll()
      .map((e) => e.result)
      .sort((a, b) => {
        const dailyDiff = this.horizonScore(b, 'GUNLUK') - this.horizonScore(a, 'GUNLUK');
        if (dailyDiff !== 0) {
          return dailyDiff;
        }
        const weeklyDiff = this.horizonScore(b, 'HAFTALIK') - this.horizonScore(a, 'HAFTALIK');
        if (weeklyDiff !== 0) {
          return weeklyDiff;
        }
        return a.ticker.localeCompare(b.ticker);
      })
      .slice(0, limit);
  }

  rankedByHorizon(horizon: EliteScoreHorizon, limit: number = 100): EliteScoreResult[] {
    return this.getAll()
      .map((e) => e.result)
      .sort((a, b) => {
        const diff = this.horizonScore(b, horizon) - this.horizonScore(a, horizon);
        if (diff !== 0) {
          return diff;
        }
        return a.ticker.localeCompare(b.ticker);
      })
      .slice(0, limit);
  }

  private horizonScore(result: EliteScoreResult, horizon: EliteScoreHorizon): number {
    const found = result.horizons.find((h) => h.horizon === horizon);
    return found?.skor ?? 0;
  }
}
