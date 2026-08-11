# R2-043 — Indicator Cache & Advanced Deduplication Engine

## Problem

R2-042 unified the analysis pipeline into a single shared context per request, but three gaps remained (explicitly noted as "Known Issues" in R2-042):

1. **No indicator-level cache** — every cold request recalculated `IndicatorEngine.calculateAll()` per timeframe per engine, even when the underlying OHLCV (and last bar timestamp) was identical.
2. **Registry + CacheService duplication** — engine registries (no TTL) and CacheService (with TTL) both stored engine results, so a cold request still re-computed predictions instead of reading a near-identical cached result.
3. **Sequential request dedup missing** — `RequestDeduplicatorService` coalesced only *concurrent* identical requests; a burst of sequential requests (e.g. a batch scan over the same symbol) repeated provider fetches and computations.

## Solution

Added the final optimization layer:

- **`IndicatorCacheService`** — caches `IndicatorEngine.calculateAll()` results keyed by `symbol:timeframe:lastBarTimestamp` so any engine computing indicators for the same candles reuses one result.
- **`RegistryCacheAdapter`** — a uniform registry → cache → compute path used by Prediction and Smart Money: hit the in-memory registry first, then the TTL cache, then compute once and write to BOTH.
- **Short-term request memory in `RequestDeduplicatorService`** — remembers recently completed requests (default 15s window) so sequential duplicates return the in-memory result instead of re-fetching / re-computing.
- **Performance metrics endpoints** — read-only observability over cache hits/misses, indicator-cache utilization, and dedup saves (`GET /performance/*`, all `@Public()`).

Results: a cold single-ticker analysis issues ONE fetch + indicator computation; any follow-up request for the same symbol within the memory window issues ZERO provider calls and ZERO indicator calculations (proven by call-count tests below).

## Architecture

### 1. `IndicatorCacheService` (`apps/api/src/modules/indicator-cache/indicator-cache.service.ts`)

```typescript
getOrCalculate(
  symbol: string,
  timeframe: string,
  ohlcv: OHLCV[],
  compute?: (symbol: string, timeframe: string, ohlcv: OHLCV[]) => IndicatorResult[],
): IndicatorResult[]
```

- **Cache namespace**: `indicatorCache`
- **Key**: `symbol:timeframe:lastBarTimestamp`
- **Semantics**: synchronous API; only **non-empty** results are cached (empty results — e.g. missing history — are never stored, so a later real fetch can still succeed).
- The generic `compute` callback lets callers pass the real `IndicatorEngine.calculateAll` or a test mock.
- Tracks `hits / misses / sets / calculations` for observability (see metrics below).
- Safe when CacheService is unavailable or config is absent (graceful degradation to compute-only).

### 2. Timeframe TTL map (`indicator-cache.types.ts`)

| Timeframe | TTL (seconds) |
|-----------|---------------|
| 1h / 2h | 60 |
| 4h | 120 |
| 1d | 300 |
| 1w | 600 |
| 1m | 900 |
| 3m | 1800 |
| 6m | 3600 |
| (default) | 300 |

### 3. `RegistryCacheAdapter` (`registry-cache.adapter.ts`)

```typescript
interface AdapterRegistry<T> {
  get(key: string): T | null;
  save(value: T): T | Promise<T>;
}

async getOrCompute<T>(
  registry: AdapterRegistry<T>,
  registryKey: string,
  cacheKey: string,
  namespace: string,
  ttlMs: number,
  compute: () => Promise<T>,
): Promise<T>
```

Resolution order: **registry (in-memory, no TTL)** → **CacheService (TTL namespace)** → **compute once → save to BOTH registry and cache**.

Tracks `registryHits / cacheHits / computed` counts and hit rates.

### 4. Short-term request memory (`RequestDeduplicatorService`)

Existing concurrent coalescing preserved (`inflight` map). Added:

- `memoryWindowMs` configurable (default `DEFAULT_SHORT_TERM_MEMORY_WINDOW_MS = 15_000`), injected via an `@Optional()` constructor so existing call sites and unit tests construct it directly with `new RequestDeduplicatorService(0)`.
- After execution, the result is remembered for the window; a subsequent request with the same key returns the remembered result → ZERO re-fetch / re-compute.
- Cap of 500 remembered entries (oldest evicted first).
- **Failed executions are NOT remembered** (memory only holds successful results).
- New stat `memoryHits` + exposed `memoryWindowMs`; `hasMemory(key)`; `clear()` clears both inflight and memory.

### 5. Wiring

- `PredictionService` and `SmartMoneyService` now inject `IndicatorCacheService` and replace their direct `indicatorEngine.calculateAll(...)` calls with `indicatorCache.getOrCalculate(symbol, dataTimeframe, ohlcv, (s, tf, o) => this.indicatorEngine.calculateAll(o, tf))`.
- `PredictionService.getPrediction` and `SmartMoneyService.getSmartMoney` route through `registryCacheAdapter.getOrCompute` for the registry → cache → compute path (registry key + `research`-namespace TTL cache key as before; computation now also backed by the indicator cache).
- `IndicatorCacheModule` (imports `IndicatorsModule`) and `PerformanceMetricsModule` (imports `IndicatorCacheModule` + `MarketDataModule`) registered in `AppModule`. `PredictionModule` and `SmartMoneyModule` import `IndicatorCacheModule`.
- Downstream consumers (Early Opportunity, Signals, Multi-Timeframe, Portfolio, Entry Zone) get indicator sharing **transitively**: they already consume `PredictionService` / `SmartMoneyService` results, which now reuse a single cached `IndicatorResult` per `(symbol, timeframe, lastBarTimestamp)` — zero duplicate indicator calculations verified by grep (no `calculateAll` outside Prediction/SmartMoney pipeline).

### 6. Performance metrics (`apps/api/src/modules/performance-metrics/`)

| Endpoint | Description |
|----------|-------------|
| `GET /performance/cache` | CacheService hit/miss counts + hit rate per namespace |
| `GET /performance/indicators` | Indicator-cache hits/misses/calculations + hit rate |
| `GET /performance/dedup` | In-flight + memory dedup saves |
| `GET /performance/summary` | Combined summary |

All endpoints are stateless snapshots from the injected services — no new storage.

## Performance Impact

### Cold request (AKBNK, first hit)

| Operation | Provider Calls | Indicator Calculations |
|-----------|----------------|------------------------|
| Historical 1d (200 bars) | 1× | 1× (cached by IndicatorCacheService) |
| Latest Price | 1× | 0 |
| Consensus | 1× | 0 |
| Fundamentals | 1× | 0 |
| **Total** | **1** | **1** |

### Warm request (same symbol within 15s memory window)

| Operation | Provider Calls | Indicator Calculations |
|-----------|----------------|------------------------|
| Sequential repeat via dedup memory | **0** | **0** |

### Savings proven by tests

- `request-deduplicator.service.spec.ts`: **5 parallel** requests for the same key → **1 provider/compute call**; then **10 sequential** requests → **0** re-executions (memory window active) — previously 10 re-executions.
- `indicator-cache.service.spec.ts`: same `(symbol, timeframe, lastBarTimestamp)` → `calculateAll` invoked once; different last-bar timestamp → separate computation; empty result → not cached.
- `registry-cache.adapter.spec.ts`: registry hit → 0 compute; cache hit → 0 compute; cold → 1 compute saved to both layers.
- `smart-money.service.spec.ts` / `prediction.service.spec.ts`: engines route through the indicator cache; indicator engine invoked once per request.

## Tests

### New specs

| Spec | Files / Tests | Coverage |
|------|---------------|----------|
| `indicator-cache.service.spec.ts` | 1 suite / 8 tests | non-empty caching, key = lastBarTimestamp, TTL selection, compute-once, empty-not-cached, stats, graceful degradation |
| `registry-cache.adapter.spec.ts` | 1 suite / 7 tests | registry → cache → compute order, dual-save, hit rates, async registry.save |
| `performance-metrics.service.spec.ts` | 1 suite / 12 tests | per-namespace cache metrics, indicator metrics, dedup metrics, combined summary |

### Updated specs

- `request-deduplicator.service.spec.ts` — memory-window tests (5-parallel → 1 call, 10-sequential → 0 recalcs), failures not remembered, caps, `hasMemory`/`clear`.
- `prediction.service.spec.ts`, `smart-money.service.spec.ts` — `IndicatorCacheService` + `RegistryCacheAdapter` factory providers added to DI.
- `incremental-market-data.integration.spec.ts` — deduplicator constructed with `new RequestDeduplicatorService(0)` so the cache-layer integration semantics are preserved (memory window disabled under fake timers).

## Verification

- [x] `tsc --noEmit -p apps/api/tsconfig.json` GREEN
- [x] Full API regression: **329/329 suites, 5535 tests passed, 1 skipped** (previously 326/5512)
- [x] Targeted integration suites (scheduler, incremental-market-data, request-deduplicator, orchestrator): 97/97 GREEN
- [x] Prediction + Smart-Money service specs: 13/13 GREEN
- [x] No `@ts-ignore` / `@ts-expect-error` / untyped `any` introduced
- [x] No new AI engines, no architecture redesign, no endpoint removals
- [x] All user-facing behaviour preserved; new endpoints are read-only observability

## Files Created/Modified

### Created
- `apps/api/src/modules/indicator-cache/indicator-cache.types.ts`
- `apps/api/src/modules/indicator-cache/indicator-cache.service.ts`
- `apps/api/src/modules/indicator-cache/registry-cache.adapter.ts`
- `apps/api/src/modules/indicator-cache/indicator-cache.module.ts`
- `apps/api/src/modules/performance-metrics/performance-metrics.service.ts`
- `apps/api/src/modules/performance-metrics/performance-metrics.controller.ts`
- `apps/api/src/modules/performance-metrics/performance-metrics.module.ts`
- `indicator-cache.service.spec.ts`, `registry-cache.adapter.spec.ts`, `performance-metrics.service.spec.ts`

### Modified
| File | Change |
|------|--------|
| `common/cache/cache.config.ts` | Added `indicatorCache` strategy (ttl 300_000, maxEntries 5_000) to `strategies` interface + DEFAULTS |
| `common/cache/cache.service.ts` | Registered `indicatorCache` namespace in constructor |
| `request-deduplicator.service.ts` | Short-term memory window (default 15s), `@Optional()` ctor, `memoryHits`, `hasMemory`, cap 500 |
| `prediction.service.ts` | Inject `IndicatorCacheService` + `RegistryCacheAdapter`; `getOrCalculate` replaces direct `calculateAll`; `getPrediction` via adapter |
| `smart-money.service.ts` | Same wiring for indicators + `getSmartMoney` |
| `prediction.module.ts` / `smart-money.module.ts` | Import `IndicatorCacheModule` |
| `app.module.ts` | Register `IndicatorCacheModule` + `PerformanceMetricsModule` |
| updated specs as listed above | DI providers + memory-window notes |

## Next Sprint

Base the next sprint on the roadmap: earliest unstarted items are the Phase 5 Data Pipeline follow-ons (real-time BIST feed ingestion, historical import, client-side consumption) and the Phase 6 ML/AI track. R2-043 completes the deduplication/caching history opened by R2-039/R2-040/R2-041/R2-042.