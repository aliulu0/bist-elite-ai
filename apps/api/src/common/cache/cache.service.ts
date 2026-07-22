import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { CacheConfig, getCacheConfig } from './cache.config';

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  memoryUsage: number;
  uptime: number;
}

interface CacheNamespace {
  entries: Map<string, CacheEntry>;
  config: { ttl: number; maxEntries: number };
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly namespaces = new Map<string, CacheNamespace>();
  private readonly globalEntries = new Map<string, CacheEntry>();
  private readonly config: CacheConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };
  private readonly startTime = Date.now();

  constructor(config?: Partial<CacheConfig>) {
    this.config = getCacheConfig(config);

    this.registerNamespace('indicators', this.config.strategies.indicators);
    this.registerNamespace('scores', this.config.strategies.scores);
    this.registerNamespace('marketData', this.config.strategies.marketData);
    this.registerNamespace('portfolio', this.config.strategies.portfolio);
    this.registerNamespace('api', this.config.strategies.api);

    if (this.config.enabled) {
      this.cleanupInterval = setInterval(() => this.cleanup(), 30_000);
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private registerNamespace(name: string, config: { ttl: number; maxEntries: number }): void {
    this.namespaces.set(name, { entries: new Map(), config });
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 64;
    }
  }

  private getNamespace(namespace: string): CacheNamespace | undefined {
    return this.namespaces.get(namespace);
  }

  get<T = any>(key: string, namespace?: string): T | undefined {
    if (!this.config.enabled) return undefined;

    const store = namespace ? this.getNamespace(namespace)?.entries : this.globalEntries;
    if (!store) return undefined;

    const entry = store.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      store.delete(key);
      this.stats.misses++;
      return undefined;
    }

    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    return entry.value as T;
  }

  set<T = any>(key: string, value: T, ttl?: number, namespace?: string): boolean {
    if (!this.config.enabled) return false;

    const store = namespace ? this.getNamespace(namespace)?.entries : this.globalEntries;
    const nsConfig = namespace ? this.getNamespace(namespace)?.config : undefined;
    if (!store) return false;

    const size = this.estimateSize(value);
    if (size > this.config.maxEntrySize) {
      this.logger.warn(`Cache entry too large: ${key} (${size} bytes)`);
      return false;
    }

    const effectiveTtl = ttl ?? nsConfig?.ttl ?? this.config.ttl;
    const effectiveMax = nsConfig?.maxEntries ?? this.config.maxEntries;

    while (store.size >= effectiveMax) {
      this.evictLeastUsed(store);
    }

    const now = Date.now();
    store.set(key, {
      value,
      expiresAt: now + effectiveTtl,
      size,
      accessCount: 0,
      lastAccessed: now,
      createdAt: now,
    });

    this.stats.sets++;
    return true;
  }

  delete(key: string, namespace?: string): boolean {
    const store = namespace ? this.getNamespace(namespace)?.entries : this.globalEntries;
    if (!store) return false;

    const existed = store.delete(key);
    if (existed) this.stats.deletes++;
    return existed;
  }

  has(key: string, namespace?: string): boolean {
    return this.get(key, namespace) !== undefined;
  }

  clear(namespace?: string): number {
    if (namespace) {
      const ns = this.getNamespace(namespace);
      if (!ns) return 0;
      const count = ns.entries.size;
      ns.entries.clear();
      return count;
    }

    let count = 0;
    for (const ns of this.namespaces.values()) {
      count += ns.entries.size;
      ns.entries.clear();
    }
    count += this.globalEntries.size;
    this.globalEntries.clear();
    return count;
  }

  getOrSet<T = any>(key: string, factory: () => T | Promise<T>, ttl?: number, namespace?: string): T | Promise<T> {
    const cached = this.get<T>(key, namespace);
    if (cached !== undefined) return cached;

    const value = factory();
    if (value instanceof Promise) {
      return value.then((v) => {
        this.set(key, v, ttl, namespace);
        return v;
      });
    }

    this.set(key, value, ttl, namespace);
    return value;
  }

  private evictLeastUsed(store: Map<string, CacheEntry>): void {
    let leastKey: string | null = null;
    let leastScore = Infinity;

    for (const [key, entry] of store) {
      const age = Date.now() - entry.lastAccessed;
      const score = entry.accessCount / (age + 1);
      if (score < leastScore) {
        leastScore = score;
        leastKey = key;
      }
    }

    if (leastKey) {
      store.delete(leastKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let totalCleaned = 0;

    for (const ns of this.namespaces.values()) {
      for (const [key, entry] of ns.entries) {
        if (now > entry.expiresAt) {
          ns.entries.delete(key);
          totalCleaned++;
        }
      }
    }

    for (const [key, entry] of this.globalEntries) {
      if (now > entry.expiresAt) {
        this.globalEntries.delete(key);
        totalCleaned++;
      }
    }

    if (totalCleaned > 0) {
      this.logger.debug(`Cache cleanup: removed ${totalCleaned} expired entries`);
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    let totalEntries = this.globalEntries.size;
    let totalSize = 0;

    for (const entry of this.globalEntries.values()) {
      totalSize += entry.size;
    }

    for (const ns of this.namespaces.values()) {
      totalEntries += ns.entries.size;
      for (const entry of ns.entries.values()) {
        totalSize += entry.size;
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      totalEntries,
      totalSize,
      memoryUsage: process.memoryUsage().heapUsed,
      uptime: Date.now() - this.startTime,
    };
  }

  getKeys(namespace?: string): string[] {
    if (namespace) {
      const ns = this.getNamespace(namespace);
      return ns ? Array.from(ns.entries.keys()) : [];
    }

    const keys = Array.from(this.globalEntries.keys());
    for (const ns of this.namespaces.values()) {
      keys.push(...Array.from(ns.entries.keys()));
    }
    return keys;
  }

  size(namespace?: string): number {
    if (namespace) {
      const ns = this.getNamespace(namespace);
      return ns ? ns.entries.size : 0;
    }

    let count = this.globalEntries.size;
    for (const ns of this.namespaces.values()) {
      count += ns.entries.size;
    }
    return count;
  }
}
