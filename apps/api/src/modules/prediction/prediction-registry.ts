import { Injectable } from '@nestjs/common';
import { PREDICTION_MAX_REGISTRY_ENTRIES } from './prediction.config';
import { PredictionResult } from './prediction.types';

@Injectable()
export class PredictionRegistry {
  private readonly store = new Map<string, PredictionResult>();
  private readonly order: string[] = [];
  private readonly maxEntries = PREDICTION_MAX_REGISTRY_ENTRIES;

  private key(ticker: string, timeframe: string): string {
    return `${ticker.toUpperCase()}:${timeframe}`;
  }

  save(result: PredictionResult): PredictionResult {
    const k = this.key(result.ticker, result.timeframe);
    this.store.set(k, result);
    const existing = this.order.indexOf(k);
    if (existing !== -1) this.order.splice(existing, 1);
    this.order.unshift(k);
    if (this.order.length > this.maxEntries) {
      const evicted = this.order.pop();
      if (evicted) this.store.delete(evicted);
    }
    return result;
  }

  get(ticker: string, timeframe: string): PredictionResult | undefined {
    return this.store.get(this.key(ticker, timeframe));
  }

  has(ticker: string, timeframe: string): boolean {
    return this.store.has(this.key(ticker, timeframe));
  }

  getTop(limit = 10): PredictionResult[] {
    return this.order
      .map((key) => this.store.get(key))
      .filter((entry): entry is PredictionResult => entry !== undefined)
      .sort((a, b) => b.bullishProbability - a.bullishProbability)
      .slice(0, limit);
  }

  getAll(): PredictionResult[] {
    return this.order
      .map((key) => this.store.get(key))
      .filter((entry): entry is PredictionResult => entry !== undefined);
  }

  clear(): void {
    this.store.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.store.size;
  }
}
