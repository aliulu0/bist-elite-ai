import { Injectable } from '@nestjs/common';
import { SmartMoneyScoreResult } from './smart-money.types';

@Injectable()
export class SmartMoneyRegistry {
  private readonly store = new Map<string, SmartMoneyScoreResult>();
  private readonly order: string[] = [];
  private readonly maxEntries = 200;

  save(result: SmartMoneyScoreResult): SmartMoneyScoreResult {
    const key = result.ticker.toUpperCase();
    this.store.set(key, result);
    const existing = this.order.indexOf(key);
    if (existing !== -1) this.order.splice(existing, 1);
    this.order.unshift(key);
    if (this.order.length > this.maxEntries) {
      const evicted = this.order.pop();
      if (evicted) this.store.delete(evicted);
    }
    return result;
  }

  get(ticker: string): SmartMoneyScoreResult | undefined {
    return this.store.get(ticker.toUpperCase());
  }

  has(ticker: string): boolean {
    return this.store.has(ticker.toUpperCase());
  }

  getTop(limit = 10): SmartMoneyScoreResult[] {
    return this.order
      .slice(0, limit)
      .map((key) => this.store.get(key))
      .filter((entry): entry is SmartMoneyScoreResult => entry !== undefined);
  }

  getAll(): SmartMoneyScoreResult[] {
    return this.order
      .map((key) => this.store.get(key))
      .filter((entry): entry is SmartMoneyScoreResult => entry !== undefined);
  }

  clear(): void {
    this.store.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.store.size;
  }
}
