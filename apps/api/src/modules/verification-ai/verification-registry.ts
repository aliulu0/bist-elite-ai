import { Injectable } from '@nestjs/common';
import { VerificationResult } from './verification-ai.types';

@Injectable()
export class VerificationRegistry {
  private readonly store = new Map<string, VerificationResult>();
  private readonly order: string[] = [];
  private readonly maxEntries = 200;

  save(result: VerificationResult): VerificationResult {
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

  get(ticker: string): VerificationResult | undefined {
    return this.store.get(ticker.toUpperCase());
  }

  has(ticker: string): boolean {
    return this.store.has(ticker.toUpperCase());
  }

  getAll(): VerificationResult[] {
    return this.order.map((key) => this.store.get(key)).filter((entry): entry is VerificationResult => entry !== undefined);
  }

  clear(): void {
    this.store.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.store.size;
  }
}
