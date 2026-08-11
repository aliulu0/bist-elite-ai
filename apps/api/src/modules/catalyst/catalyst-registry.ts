import { Injectable } from '@nestjs/common';
import { CatalystResult } from './catalyst.types';

@Injectable()
export class CatalystRegistry {
  private readonly store = new Map<string, CatalystResult>();
  private readonly order: string[] = [];
  private readonly maxEntries = 200;

  save(result: CatalystResult): CatalystResult {
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

  get(ticker: string): CatalystResult | undefined {
    return this.store.get(ticker.toUpperCase());
  }

  has(ticker: string): boolean {
    return this.store.has(ticker.toUpperCase());
  }

  getTop(limit = 10): CatalystResult[] {
    return this.order
      .slice(0, limit)
      .map((key) => this.store.get(key))
      .filter((entry): entry is CatalystResult => entry !== undefined);
  }

  getAll(): CatalystResult[] {
    return this.order.map((key) => this.store.get(key)).filter((entry): entry is CatalystResult => entry !== undefined);
  }

  clear(): void {
    this.store.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.store.size;
  }
}
