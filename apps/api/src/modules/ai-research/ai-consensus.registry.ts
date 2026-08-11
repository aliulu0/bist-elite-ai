import { Injectable } from '@nestjs/common';
import { AIConsensus } from './ai-research.types';

@Injectable()
export class AIConsensusRegistry {
  private readonly store = new Map<string, AIConsensus>();
  private readonly order: string[] = [];
  private readonly maxEntries = 200;

  save(consensus: AIConsensus): AIConsensus {
    const key = consensus.ticker.toUpperCase();
    this.store.set(key, consensus);
    const existing = this.order.indexOf(key);
    if (existing !== -1) this.order.splice(existing, 1);
    this.order.unshift(key);
    if (this.order.length > this.maxEntries) {
      const evicted = this.order.pop();
      if (evicted) this.store.delete(evicted);
    }
    return consensus;
  }

  get(ticker: string): AIConsensus | undefined {
    return this.store.get(ticker.toUpperCase());
  }

  has(ticker: string): boolean {
    return this.store.has(ticker.toUpperCase());
  }

  getTop(limit = 10): AIConsensus[] {
    return this.order
      .slice(0, limit)
      .map((key) => this.store.get(key))
      .filter((entry): entry is AIConsensus => entry !== undefined);
  }

  getAll(): AIConsensus[] {
    return this.order.map((key) => this.store.get(key)).filter((entry): entry is AIConsensus => entry !== undefined);
  }

  clear(): void {
    this.store.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.store.size;
  }
}
