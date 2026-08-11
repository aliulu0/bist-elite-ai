# 18. PERFORMANCE

## 18.1 What exists

- **In-memory registries/caches** — engine results and market data are memory-backed with TTL.
- **Global interceptors:** `RequestDeduplication`, `CacheInterceptor`, `Compression`, `ETag`.
- **Index strategy:** Prisma schema relies on defaults; hot-path indexes (ticker) not explicitly declared.
- **Scheduler:** separate process (`main-scheduler.ts`) so HTTP requests don't share event loop with cron batches.
- **Pipeline:** batch endpoints (`POST /batch`) process multiple tickers per request.

## 18.2 Findings

1. **M5 — no load/benchmark evidence for full-suite:** `scripts/` has `benchmark` tooling, but no recorded baseline for API p50/p95 latencies at scale.
2. **Cache is per-process** (no Redis, M2) — multiple replicas duplicate cache and can't invalidate centrally.
3. **Registries unbounded** — no TTL/capacity cap; a long-running scheduler accumulates engine results indefinitely unless jobs clear them.
4. **`/metrics` endpoint** returns Prometheus metrics with no rate limit.
5. **No pagination on `GET /:ticker`-style collection endpoints** (scanner/`top`, opportunity-center lists return full arrays; for 30 BIST-30 tickers fine, but unbounded for larger universes).
6. **Scheduler shares full AppModule** — constructs HTTP tree + providers per scheduler boot (wasted memory/time).
7. **No DB connection pooling tuning documented** — Prisma default pool; fine for dev.
8. **Frontend:** Vite build is single-bundle; no code-splitting/lazy routes observed (`App.tsx` renders all routes eagerly).

## 18.3 Verdict

Reasonable architecture-level performance hygiene (dedup, cache, ETag, compression, separate scheduler), but no measured baseline, unbounded registries, per-process cache, and eager frontend loading limit confidence at scale (M5/M2).
