# 14. CACHING

## 14.1 What exists

- **In-memory TTL caches** (`Map` + expiry):
  - `common/cache/cache.service.ts` — generic `CacheService` with TTL + eviction.
  - `modules/market-data/cache/market-data-cache.service.ts` — market data TTL cache.
  - `modules/research/cache/research-cache.service.ts` — research/news TTL cache.
- **Interceptors:** `CacheInterceptor` (global, from `common/cache`), `RequestDeduplicationInterceptor`.
- **ETag** responses via `ETagInterceptor`.

## 14.2 Redis

- **Redis is NOT used.** No `redis`/`ioredis` dependency in `apps/api/package.json`; no Redis client anywhere in `src/`.
- Config/health may reference Redis (see `29_INFRASTRUCTURE.md`), but nothing connects.
- Consequences:
  - Cache is per-process → scheduler and API processes have separate caches.
  - Multiple replicas would each have cold caches; no shared invalidation.
  - Restart wipes all caches (mitigated by DB-backed data where used).

## 14.3 Findings

1. **M2 — Redis declared but unused:** documented "Redis caching" is not implemented; everything is in-memory. Any infra or docs claiming Redis-backed cache is inaccurate.
2. **No cache key namespacing across modules** — `CacheService` is generic; risk of collisions if keys not prefixed per module (audit found module-specific prefixes in practice — low risk).
3. **TTL defaults** vary per service; no central tuning config for cache TTLs.
4. **ETag + CacheInterceptor interaction** untested for correctness on varying query params.
5. **No cache warming** on startup for BIST-30 seed symbols.

## 14.4 Verdict

In-memory caching is implemented cleanly and used consistently, but the documented Redis layer is absent (M2). For single-process dev this is fine; for production scale it's a gap.
