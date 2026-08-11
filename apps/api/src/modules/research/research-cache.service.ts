import { Injectable } from '@nestjs/common';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class ResearchCacheService {
  private readonly store = new Map<string, CacheEntry>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = 60_000): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): { size: number } {
    return { size: this.store.size };
  }
}
