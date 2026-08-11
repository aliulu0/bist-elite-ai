import { Injectable } from '@nestjs/common';
import { getDecisionStrength } from './decision-rules';
import { DecisionRegistryEntry } from './decision.types';

@Injectable()
export class DecisionRegistry {
  private readonly entries = new Map<string, DecisionRegistryEntry>();

  set(entry: DecisionRegistryEntry): void {
    this.entries.set(entry.ticker, entry);
  }

  get(ticker: string): DecisionRegistryEntry | null {
    return this.entries.get(ticker) ?? null;
  }

  has(ticker: string): boolean {
    return this.entries.has(ticker);
  }

  getAll(): DecisionRegistryEntry[] {
    return [...this.entries.values()];
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  top(limit: number = 10): DecisionRegistryEntry[] {
    return this.getAll()
      .sort((a, b) => {
        const strengthDiff =
          getDecisionStrength(b.result.decision) -
          getDecisionStrength(a.result.decision);
        if (strengthDiff !== 0) {
          return strengthDiff;
        }
        const aiDiff = (b.result.aiScore ?? 0) - (a.result.aiScore ?? 0);
        if (aiDiff !== 0) {
          return aiDiff;
        }
        return (b.result.confidence ?? 0) - (a.result.confidence ?? 0);
      })
      .slice(0, limit);
  }
}
