import { Injectable } from '@nestjs/common';
import {
  PortfolioOptimizationEntry,
  PortfolioOptimizationResult,
} from './portfolio-optimization.types';

@Injectable()
export class PortfolioOptimizationRegistry {
  private readonly map = new Map<string, PortfolioOptimizationEntry>();

  set(entry: PortfolioOptimizationEntry): void {
    this.map.set(entry.ticker, entry);
  }

  get(ticker: string): PortfolioOptimizationEntry | null {
    return this.map.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.map.has(ticker);
  }

  getAll(): PortfolioOptimizationEntry[] {
    return Array.from(this.map.values());
  }

  count(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  top(limit = 10): PortfolioOptimizationResult[] {
    return this.getAll()
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
      .slice(0, limit)
      .map((e) => e.result);
  }
}