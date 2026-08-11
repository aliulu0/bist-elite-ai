# 19. CACHING & REDIS

> Dedicated deep-dive; complements `14_CACHING.md`.

## 19.1 Code-level inventory

| Component | File | Backing | TTL |
|---|---|---|---|
| `CacheService` | `common/cache/cache.service.ts` | in-memory `Map` | per-set |
| `MarketDataCacheService` | `modules/market-data/cache/market-data-cache.service.ts` | in-memory `Map` | config |
| `ResearchCacheService` | `modules/research/cache/research-cache.service.ts` | in-memory `Map` | config |
| `CacheInterceptor` | `common/cache/cache.interceptor.ts` | `CacheService` | global |
| `RequestDeduplicationInterceptor` | `common/cache` (or security) | in-flight map | request |

## 19.2 Redis verification

- **No `redis` / `ioredis` in `apps/api/package.json`** — confirmed.
- **No `RedisService` / `RedisModule`** anywhere under `src/`.
- Docs and/or `.env` references to Redis are aspirational only.

## 19.3 Findings

1. **M2 — Redis declared, never used.** If docs claim "Redis cache layer", they are inaccurate. Impact: cross-process invalidation impossible; multi-replica caches diverge; cache loss on restart.
2. **No distributed lock** — scheduler could double-run a job on multiple replicas (if ever scaled).
3. **No cache-aside persistence** — engine results exist only in memory; after restart the dashboard shows empty until the chain re-runs.
4. **TTL defaults inconsistent** across the three cache services (each has its own default).
5. **No cache statistics endpoint** (hit/miss rates) for tuning.

## 19.4 Verdict

The in-memory caching is competent but there is no Redis layer, contradicting any documentation that claims one. Acceptable for single-node dev; a documented production gap.
