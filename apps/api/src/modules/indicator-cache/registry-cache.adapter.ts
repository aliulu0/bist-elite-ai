import { Injectable } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';

export interface RegistryCacheAdapterMetrics {
  registryHits: number;
  cacheHits: number;
  computed: number;
  registryHitRate: number;
  cacheHitRate: number;
}

export interface AdapterRegistry<T> {
  get(key: string): T | undefined;
  save(value: T): T | Promise<T>;
}

@Injectable()
export class RegistryCacheAdapter {
  private registryHits = 0;
  private cacheHits = 0;
  private computed = 0;

  constructor(private readonly cache: CacheService) {}

  async getOrCompute<T>(
    registry: AdapterRegistry<T>,
    registryKey: string,
    cacheKey: string,
    namespace: string,
    ttlMs: number,
    compute: () => T | Promise<T>,
  ): Promise<T> {
    const registered = registry.get(registryKey);
    if (registered !== undefined) {
      this.registryHits++;
      return registered;
    }

    const cached = this.cache.get<T>(cacheKey, namespace);
    if (cached !== undefined) {
      this.cacheHits++;
      return cached;
    }

    const value = await compute();
    this.computed++;
    const saved = await registry.save(value);
    this.cache.set(cacheKey, saved, ttlMs, namespace);
    return saved;
  }

  getStats(): RegistryCacheAdapterMetrics {
    const registryTotal = this.registryHits + this.cacheHits + this.computed;
    const cacheTotal = this.cacheHits + this.computed;
    return {
      registryHits: this.registryHits,
      cacheHits: this.cacheHits,
      computed: this.computed,
      registryHitRate: registryTotal > 0 ? this.registryHits / registryTotal : 0,
      cacheHitRate: cacheTotal > 0 ? this.cacheHits / cacheTotal : 0,
    };
  }
}
