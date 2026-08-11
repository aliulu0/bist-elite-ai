# R2-040 Incremental Real Market Data Pipeline

Status: COMPLETE
Completed: 2026-08-10

## Overview

R2-040 adds an incremental market-data update layer on top of the EXISTING
`MarketDataOrchestrator`. The platform must never re-download historical data
it already has. For every `GET historical data` request the pipeline decides what
exists, finds the newest known candle, requests only the missing/new data, merges
the result with the cached series, validates, de-duplicates, updates the cache,
and exposes the merged dataset to every downstream engine.

Primary goal: **FETCH ONLY WHAT IS NECESSARY.**

R2-039 (Stabilization & Pre-Pipeline Integrity) is COMPLETE and is the stable
base for this sprint: whole-API `tsc --noEmit` is green, all production cache
namespaces are registered, and the orchestrator already validates + falls back
across providers. R2-040 builds only a thin incremental layer on top and reuses
every existing component.

## Architecture

```
[Engine / API]
      |
      v
IncrementalMarketDataService  <-- new thin layer (this sprint)
      |
      v
MarketDataOrchestrator  <-- reused: providers, fallback, retry, circuit-breaker, dedup
      |
      v
providers (Yahoo / Finnhub / Alpha Vantage / Fintables / ...) -> real HTTP
      |
      v
MarketDataCacheService (existing CacheService) <-- single cache, single key space
```

- New module: `apps/api/src/modules/market-data/incremental/`
  - `incremental-market-data.service.ts` (the layer)
  - `incremental-timeframe.config.ts` (freshness, TTL, workable-timeframe rules)
  - `incremental-market-data.types.ts` (state + incremental metadata types)
- The layer owns NO provider. It owns NO cache implementation. It owns NO
  validation rules. It delegates all three to the existing orchestrator,
  `CacheService`, and `MarketDataValidationService` / `FinancialDataQualityService`.

### Incremental data model

A minimal `IncrementalMarketDataState` is stored per `symbol|timeframe` cache key
in the existing `historicalMeta` namespace (a second entry alongside the
`historical` namespace that holds the candle array). This is the only new stored
fact and it is small:

- `ticker`, `timeframe` (the fetchable form, e.g. `4h`)
- `lastTimestamp` (newest cached candle ts)
- `firstTimestamp`
- `barCount`
- `provider` (last provider that produced data)
- `updatedAt`, `dataVersion`
- `stale` (bool)

No database models, no Redis, no new persistence. The metadata lives in the same
`CacheService` the orchestrator already uses, so the orchestrator and the
incremental layer share the SAME cache entries and NEVER duplicate data.

## Data flow

For a request `GET historical data(symbol, timeframe)`:

1. **Resolve timeframe** via `incremental-timeframe.config.resolveFetchableTimeframe`
   which reuses the existing `PREDICTION_TIMEFRAME_MAPPING`. Derived intraday
   timeframes `1h` / `2h` map to `4h`, so all three share ONE cache key
   (`THYAO|4h`). No new timeframes are introduced and no conversion logic is
   duplicated.
2. **Read cache + meta** for `${normalizedSymbol}|${fetchable}`.
3. **Decide the case** (see Required Behavior below).
4. **Provider call** happens ONLY through `MarketDataOrchestrator` (either
   `fetchHistoricalData` for a full fetch, or `fetchHistoricalRange` for an
   incremental range request starting at `lastTs + 1 interval`). Every request
   passes provider selection, retry, timeout, circuit-breaker and health checks.
5. **Merge**: existing + incoming -> dedupe by timestamp (incoming replaces a
   stale duplicate at the same ts) -> ascending sort -> drop malformed bars.
6. **Validate**: run `MarketDataValidationService` (existing) on the merged
   series. Invalid OHLC / impossible volume / duplicates are removed.
7. **Quality enrich** (optional): lazily load `FinancialDataQualityService`
   (constructed with a disabled-cache `CacheService` to avoid the
   `financial-rules` -> `market-data` circular import). It runs
   `assess(...)` on the merged series to produce a market-integrity + freshness
   report. If the assessor is unavailable or the series is empty, quality is
   `undefined` -- validation is never weakened, quality is never a hard gate.
8. **Cache write**: store the merged candles in `historical` and the updated
   meta in `historicalMeta`, with a timeframe-scoped TTL.
9. **Return** the merged series together with deterministic `incremental`
   metadata (see Observability).

## Cache strategy

- Reuses the existing `CacheService` + `MarketDataCacheService`. No new cache.
- Two namespaces per logical key: `historical` (candle array) and the existing
  `historicalMeta` namespace (state record). Both keyed by `symbol|timeframe` so
  read and write keys are identical.
- Cache-disabled mode still works: reads return `undefined`, the service falls
  back to the orchestrator, and `set` is a no-op -- callers still get data.
- TTL is timeframe-scoped (sensible, not blindly long):

  | Timeframe | TTL | Stale threshold |
  |-----------|-----|-----------------|
  | 4h (covers 1h/2h) | 12h | 4h x 1.5 = 6h |
  | 1d | 48h | 1d x 1.5 = 36h |
  | 1w | 14d | 1w x 1.5 |
  | 1m | 60d | 1m x 1.5 |
  | 3m | 182d | 3m x 1.5 |
  | 6m | 365d | 6m x 1.5 |

- Stale detection is deterministic via `computeFreshness` (last-ts age vs
  `intervalMs * staleFactor`, with a market-open escape hatch so a stale candle
  is not mistaken for a provider failure while the market is open).

## Incremental strategy (the four cases)

### CASE 1 - cold cache (no data)
`previousBarCount === 0` -> full `orchestrator.fetchHistoricalData(symbol, fetchable, opts)`
-> validate -> cache + meta -> return. `cacheHit=false`, `incrementalUpdate=false`.

### CASE 2 - warm + fresh cache
`existing.length > 0` and `computeFreshness(...) === 'fresh'` -> return the cached
candles directly. **Zero provider requests.** `cacheHit=true`.

### CASE 3 - stale cache (new candles may exist)
`existing.length > 0` and stale -> `orchestrator.fetchHistoricalRange(symbol, fetchable, { startDate: lastTs + 1 interval })`
-> merge existing + incoming -> dedupe -> validate -> cache + meta -> return.
`incrementalUpdate=true`, `newBarCount`/`mergedBarCount` populated. A single
range fetch replaces a full redownload.

### CASE 4 - range-unsupported / range returns nothing useful
If the provider cannot range-fetch (or returns no new candles), the smallest
supported request is issued, merged with cache, de-duplicated, validated and the
cache is replaced. The layer never pretends a provider supports incremental
querying if it does not.

## Timeframe handling

- Native fetchable timeframes: `4h`, `1d`, `1w`, `1m`, `3m`, `6m`.
- Derived platform timeframes `1h`, `2h` resolve to `4h` via the EXISTING
  `PREDICTION_TIMEFRAME_MAPPING` (no duplicate conversion logic). They are served
  from the shared `4h` cache key.
- The HTTP API (`/market-data/history`) still accepts only the 6 natively
  fetchable timeframes via `HistoryQueryDto` + `/timeframes`; `1h`/`2h` are
  service-level workable timeframes consumed directly by the engines (which call
  the service, not the HTTP route) and normalize to `4h`. This is intentional: it
  keeps the public API and `/timeframes` consistent while the engines still
  benefit from a single shared `4h` cache.

## Provider fallback

- Incremental fetching does NOT select providers. It calls the orchestrator
  (`fetchHistoricalData` / `fetchHistoricalRange`), which already implements
  provider fallback, retry, timeout, circuit-breaker and health.
- A failure in CASE 3 does NOT destroy valid cached data: if the range fetch
  throws and `existing.length > 0`, the service returns the cached series marked
  `dataFreshness: 'stale'` and `validationStatus: 'unvalidated'` (stale-but-valid
  preferred over no data). If there is no existing data, it returns an empty,
  unvalidated result.
- The `providerUsed` / `attemptedProviders` / `fallbackUsed` provenance from the
  orchestrator result is preserved through `IncrementalUpdate.providerUsed`.

## Data merge rules

1. Combine existing + incoming bars.
2. De-duplicate by `timestamp` (ISO string).
3. Incoming valid data may replace a stale duplicate at the same timestamp
   (last write wins on ts collision).
4. Sort ascending by timestamp.
5. Remove malformed bars (non-finite OHLC / non-positive volume) via the existing
   `MarketDataValidationService` (real validator) during merge.
6. Run existing validation on the merged series.
7. Preserve OHLCV integrity and timeframe consistency.
8. Never synthesise market data. No interpolation of missing candles unless the
   existing architecture already supports it (it does not here).

## Stale-data handling

`computeFreshness(lastTs, fetchable, now)` returns one of:

- `fresh`: `now - lastTs <= intervalMs * staleFactor` (or the market is closed,
  so a missing new candle is NOT treated as a provider failure).
- `stale`: cache exists but is older than the threshold -> CASE 3 incremental
  fetch.
- `no-data`: no last timestamp (or unconfigurable timeframe) -> CASE 1 full fetch.

The system distinguishes **no new market data** (provider returns an empty or
identical range -> `incrementalUpdate=false`, `newBarCount=0`) from **provider
failure** (the orchestrator throws -> stale-but-valid fallback as described
above).

## Observability (exposed metadata)

Every `MarketDataResult` returned by the incremental layer carries:

- `incremental.cacheHit`
- `incremental.incrementalUpdate`
- `incremental.providerUsed`
- `incremental.previousBarCount`
- `incremental.newBarCount`
- `incremental.mergedBarCount`
- `incremental.lastCachedTimestamp`
- `incremental.latestTimestamp`
- `incremental.dataFreshness`
- `incremental.validationStatus`
- `sourceTimeframe` (set when the requested timeframe was normalised, e.g. `1h` -> `4h`)
- `quality` (optional `FinancialDataQualityService` integrity + freshness report,
  `undefined` when degraded)

No provider credentials or API keys are logged. Debug logs only reference symbol,
timeframe and a `describe(error)` summary.

## Downstream integration (non-breaking)

Engines that already consume `MarketDataOrchestrator` are unchanged and
automatically benefit: they keep hitting the SAME cache. Engines that previously
called `MarketDataService.fetchData` are also covered because
`MarketDataService.fetchData` delegates to the orchestrator when wired, so one
logical analysis request results in at most one provider fetch per symbol. The
HTTP route `GET /market-data/history` already routes through the incremental
layer (R2-033) and now additionally exposes `incremental` + `sourceTimeframe`.

## Tests

Unit + integration, deterministic.

### Unit: `incremental-market-data.service.spec.ts` (29 tests)

Cache tests: cold cache (full fetch + cache write), warm cache (zero provider
requests), stale cache (range fetch + merge), cache disabled, namespace
verification, timeframe-scoped TTL.

Incremental tests: no cache -> full fetch, cache + new candle -> merge, duplicate
candle (incoming replaces stale duplicate), overlapping provider response
(de-duped union), out-of-order provider response (ascending), malformed candle
removed, provider returns no new data, provider failure -> stale-but-valid,
fallback provider, merge ordering.

Validation tests: invalid OHLC removed by the real validator during merge,
duplicate timestamps collapsed, timestamp conflict -> incoming replaces existing,
volume anomaly removed/filtered, stale data metadata.

Timeframe tests: `1h` normalised to `4h` (shared cache key), `4h`/`1d`/`1w`/`1m`
supported with timeframe-scoped cache keys.

Quality enrichment: happy path (fake assessor -> report mapped onto the result),
graceful degradation (no assessor -> `quality` undefined, no crash), empty series
-> no assessment run.

### Integration: `incremental-market-data.integration.spec.ts` (6 tests)

Real orchestrator + real `CacheService` + mocked Yahoo provider:
- two sequential `1d` requests -> exactly ONE provider fetch (cache hit on 2nd);
- shared cache benefits downstream consumers (orchestrator re-read -> 0 calls);
- CASE 3 stale cache -> ONE range fetch (startDate = lastTs + 1 interval),
  merged 1 + 1 = 2... waits, 2 + 1 = 3 bars, mergedBarCount asserted;
- `1h` normalisation: `1h` then `4h` on the shared `4h` cache -> ONE provider
  fetch total (call-count proof);
- zero duplication across the data chain: `MarketDataService.fetchData` after the
  incremental full fetch -> still exactly ONE provider fetch;
- provider fallback: `finnhub` (priority 3) throws, `yahoo` (priority 4) is used,
  `providerUsed = 'yahoo'`, finnhub attempted exactly once.

## Verification

- `tsc --noEmit -p apps/api/tsconfig.json`: GREEN
- `incremental-market-data.service.spec.ts`: 29/29 GREEN
- `incremental-market-data.integration.spec.ts`: 6/6 GREEN
- `market-data` suite: 27 suites / 442 tests GREEN
- Downstream regression (early-opportunity/signals, prediction, portfolio-
  intelligence, smart-money, catalyst, verification-ai): 44 suites / 539 tests
  GREEN (run with `--maxWorkers=4` to avoid parallelism-induced flakiness; the
  `prediction-score.engine.spec` is pure math with fixed dates and passes
  reliably in isolation and under sane parallelism)
- Smoke tests (`__smoke__`) are skipped unless `SMOKE_TEST=1` (require live API
  keys) -- not run here.
- No API keys printed (audited code paths).
- No duplicated provider requests: proven by call-count assertions (1h + 4h share
  one fetch; MarketDataService -> orchestrator -> MarketDataService = one fetch).

## Runtime behavior

- First request for a symbol/timeframe: one provider fetch, then cached.
- Repeated requests: cache hit, zero provider requests.
- New candle available: one incremental range fetch, merge, cache.
- Never a full historical download every time.
- Provider failure: stale-but-valid cached data returned with
  `dataFreshness: 'stale'` when safe; never destroys valid cache.

## Known limitations

- The HTTP API still accepts only the 6 natively fetchable timeframes; `1h`/`2h`
  are service-level workable timeframes (engines call the service directly).
- Intraday TTLs are timeframe-scoped but Borsa Istanbul's real-time/delayed/EOD
  data availability is provider-driven; the layer respects "no new candle yet" as
  "no data" rather than a provider failure, but does not implement a Borsa
  calendar (consistent with R2-039's "no institutional calendar" rule).
- `FinancialDataQualityService` is loaded lazily and gracefully degrades to
  `undefined` if it cannot be constructed; quality is informational, not a hard
  validation gate.

## Next sprint

R2-041: Real-time / Latest-Price Incremental Pipeline -- extend the incremental
layer to latest-price feeds and per-timeframe intraday TTLs; wire the cached
historical result into the Prediction / Early Opportunity / Signals / Portfolio
consumers so a single analysis request triggers at most one provider fetch per
symbol.
