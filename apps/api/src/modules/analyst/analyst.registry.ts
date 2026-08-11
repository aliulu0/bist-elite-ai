import { Injectable } from '@nestjs/common';
import {
  AnalystRegistryEntry,
  AnalystResult,
} from './analyst.types';
import { ANALYST_DEFAULT_TOP_LIMIT } from './analyst.config';

@Injectable()
export class AnalystRegistry {
  private readonly map = new Map<string, AnalystRegistryEntry>();

  set(entry: AnalystRegistryEntry): void {
    this.map.set(entry.ticker, entry);
  }

  get(ticker: string): AnalystRegistryEntry | null {
    return this.map.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.map.has(ticker);
  }

  getAll(): AnalystRegistryEntry[] {
    return Array.from(this.map.values());
  }

  count(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  top(limit = ANALYST_DEFAULT_TOP_LIMIT): AnalystResult[] {
    return this.getAll()
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
      .slice(0, limit)
      .map((e) => e.result);
  }
}