import { Injectable } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';
import { IndicatorCacheService } from '../indicator-cache/indicator-cache.service';
import { RegistryCacheAdapter } from '../indicator-cache/registry-cache.adapter';
import { RequestDeduplicatorService } from '../market-data/dedup/request-deduplicator.service';

export interface PerformanceCacheMetrics {
  cache: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
    uptimeMs: number;
  };
  indicatorCache: {
    hits: number;
    misses: number;
    sets: number;
    calculations: number;
    calculationsSaved: number;
    hitRate: number;
  };
}

export interface PerformanceIndicatorsMetrics {
  indicatorCache: {
    hits: number;
    misses: number;
    sets: number;
    calculations: number;
    calculationsSaved: number;
    hitRate: number;
  };
  perSymbolSkipped: number;
}

export interface PerformanceDedupMetrics {
  dedup: {
    executed: number;
    deduplicated: number;
    memoryHits: number;
    inFlight: number;
    completed: number;
    memoryWindowMs: number;
    deduplicatedCount: number;
  };
  registry: {
    registryHits: number;
    cacheHits: number;
    computed: number;
    registryHitRate: number;
    cacheHitRate: number;
  };
}

export interface PerformanceSummary {
  providerCallsSaved: number;
  indicatorCallsSaved: number;
  cacheHitRate: number;
  registryHitRate: number;
  dedupHitRate: number;
  averageResponseTimeMs: number;
}

@Injectable()
export class PerformanceMetricsService {
  private totalResponseTimeMs = 0;
  private totalRequests = 0;

  constructor(
    private readonly cache: CacheService,
    private readonly indicatorCache: IndicatorCacheService,
    private readonly registryAdapter: RegistryCacheAdapter,
    private readonly deduplicator: RequestDeduplicatorService,
  ) {}

  recordRequest(durationMs: number): void {
    this.totalResponseTimeMs += durationMs;
    this.totalRequests++;
  }

  getSummary(): PerformanceSummary {
    const cacheStats = this.cache.getStats();
    const registryStats = this.registryAdapter.getStats();
    const dedupStats = this.deduplicator.getStats();

    const cacheTotal = cacheStats.hits + cacheStats.misses;
    const dedupTotal = dedupStats.executed + dedupStats.deduplicated + dedupStats.memoryHits;

    return {
      providerCallsSaved: cacheStats.hits + dedupStats.deduplicated + dedupStats.memoryHits,
      indicatorCallsSaved: this.indicatorCache.getStats().calculationsSaved,
      cacheHitRate: cacheTotal > 0 ? cacheStats.hits / cacheTotal : 0,
      registryHitRate: registryStats.registryHitRate,
      dedupHitRate: dedupTotal > 0 ? (dedupStats.deduplicated + dedupStats.memoryHits) / dedupTotal : 0,
      averageResponseTimeMs: this.totalRequests > 0 ? this.totalResponseTimeMs / this.totalRequests : 0,
    };
  }

  getCacheMetrics(): PerformanceCacheMetrics {
    const stats = this.cache.getStats();
    const indicator = this.indicatorCache.getStats();
    return {
      cache: {
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        evictions: stats.evictions,
        hitRate: stats.hitRate,
        totalEntries: stats.totalEntries,
        memoryUsage: stats.memoryUsage,
        uptimeMs: stats.uptime,
      },
      indicatorCache: {
        hits: indicator.hits,
        misses: indicator.misses,
        sets: indicator.sets,
        calculations: indicator.calculations,
        calculationsSaved: indicator.calculationsSaved,
        hitRate: indicator.hitRate,
      },
    };
  }

  getIndicatorMetrics(): PerformanceIndicatorsMetrics {
    const indicator = this.indicatorCache.getStats();
    return {
      indicatorCache: {
        hits: indicator.hits,
        misses: indicator.misses,
        sets: indicator.sets,
        calculations: indicator.calculations,
        calculationsSaved: indicator.calculationsSaved,
        hitRate: indicator.hitRate,
      },
      perSymbolSkipped: indicator.calculationsSaved,
    };
  }

  getDedupMetrics(): PerformanceDedupMetrics {
    const stats = this.deduplicator.getStats();
    const registry = this.registryAdapter.getStats();
    return {
      dedup: {
        executed: stats.executed,
        deduplicated: stats.deduplicated,
        memoryHits: stats.memoryHits,
        inFlight: stats.inFlight,
        completed: stats.completed,
        memoryWindowMs: stats.memoryWindowMs,
        deduplicatedCount: stats.deduplicated + stats.memoryHits,
      },
      registry: {
        registryHits: registry.registryHits,
        cacheHits: registry.cacheHits,
        computed: registry.computed,
        registryHitRate: registry.registryHitRate,
        cacheHitRate: registry.cacheHitRate,
      },
    };
  }
}
