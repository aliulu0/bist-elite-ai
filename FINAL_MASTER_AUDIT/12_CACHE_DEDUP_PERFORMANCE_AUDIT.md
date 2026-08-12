# 12 — CACHE, DEDUP & PERFORMANCE AUDIT

> R2-043 / R2-042 claims verified structurally.

## Implemented (verified in code)

- **`CacheService`** (`common/cache`) — namespaced TTL cache; namespaces registered: financialDataQuality, source-quality, research-evidence, data-health, data-freshness, agent-reach, historical, historicalMeta, historicalBackfill, latestPrice, portfolio, indicator-cache, etc.
- **`IndicatorCacheService`** (`indicator-cache`) — caches `IndicatorEngine.calculateAll()` per `symbol:timeframe:lastBarTimestamp`; timeframe TTLs (1h/2h 60s, 4h 120s, 1d 300s, 1w 600s, 1m 900s, 3m 1800s, 6m 3600s).
- **`RequestDeduplicatorService`** — short-memory (15s) sequential+parallel dedup; 500-entry cap; `memoryHits` metric; failures never cached.
- **`MarketDataOrchestrator`** — one fetch per symbol with fallback chain + caching (AGENTS.md convention honored).
- **`LatestPriceIncrementalService`** (R2-041) — 5-case flow, TTL-aware.
- **Performance endpoints** — `GET /performance/cache|indicators|dedup|summary` (`@Public`).

## Truth check

- Cold=1 call/1 compute; warm=0/0 — proven by call-count specs (unit).
- Cache/dedup layer is **REAL_AND_WORKING** (deterministic, well-tested).
- **BUT** caching only masks provider cost; with no provider returning candles, warm hits just return cached empties.

## Findings

- R2-046 `historical-early-opportunity-backtest.service.ts` imports `CacheService` from a **wrong path** (`../common/cache/cache.service`), which is exactly why it does not compile — the caching infra exists, the import is just broken.
- `historical:*` namespace reused by R2-046 — matches convention (no new namespace), good.

## Verdict

- Caching/dedup: **STRONG** (one of the best-verified subsystems).
- Not the blocker; provider/data is.