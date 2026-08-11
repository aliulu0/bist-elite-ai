# R2-034 - Real Provider Runtime Validation

**Version:** 1.0.0
**Status:** COMPLETE
**Scope:** Automated runtime validation of the real market-data provider fleet -
orchestrator cache-key consistency fix, provider pipeline fidelity (yahoo metrics),
quick-search resilience, and two gated real-HTTP smoke suites.

---

## 1. Problem

After R2-033 hardened the unified market-data pipeline, four runtime defects and a
testability gap remained:

1. **Orchestrator cache never hit.** The orchestrator *wrote* cache entries under the
   serving `provider.name` namespace but *read* them under the literal `'any'`
   namespace. Every repeated fetch re-hit the network - the cache was dead weight and
   the R2-033 caching work was effectively inert.
2. **Yahoo bypassed the adapter pipeline.** `YahooUnifiedAdapter.getHistoricalData` /
   `getLatestPrice` / `fetchCompany` delegated straight to the inner
   `YahooFinanceProvider`, skipping `withRetry` entirely - so yahoo calls had no
   timeout/retry/error-classification, and the provider dashboard reported
   `totalRequests = 0` for the provider that was actually serving all real traffic.
3. **Quick-search 500 on missing backtest.** `SearchController.search` wrapped
   `backtestService.getReport(...)` in `Promise.resolve(...).catch(() => null)`, but
   `getReport` is *synchronous* and threw `NotFoundException` before the promise was
   created - a cold start (no backtest registry) crashed the whole quick-search
   endpoint.
4. **No repeatable runtime validation.** The R2-033 smoke test was a single manual
   file, gated by a module-level constant, with no `.env` loading and an 180s default
   jest timeout - not a reliable gate, and nothing validated the end-to-end
   early-opportunity pipeline against real data.

## 2. Changes

### 2.1 Orchestrator cache-store consistency - `orchestrator/market-data-orchestrator.ts`

Added a private `cacheStore` helper that normalises the write namespace, and routed
all three cache write sites through it:

- `fetchLatestPrice` (historical TTL)
- `doFetchHistoricalData` (historical TTL)
- `executeWithFallback` (per-type TTL)

All reads already use the `'any'` namespace, so cache hits now actually occur. The
remaining intentional exceptions use a provider-specific namespace on both read and
write (`tcmb` macro indicators, `tcmb` interest decisions) and are left untouched.

### 2.2 Yahoo adapter pipeline fidelity - `providers/unified/yahoo-unified.adapter.ts`

`getHistoricalData`, `getLatestPrice` and `fetchCompany` now route through
`BaseProviderAdapter.withRetry`:

- Timeout and retry/backoff now apply (previously raw `fetch` with no outer guard).
- Success/failure metrics are recorded per request (dashboard now shows real traffic).
- Failures are classified via `ProviderErrorClassifier` and recorded in diagnostics.
- The inner `YahooFinanceProvider` keeps its spec'd defensive contract (returns
  `[]`/`null` on errors); the adapter maps a `null` retry result back to `[]` for
  `getHistoricalData`.

### 2.3 Quick-search resilience - `ai-early-opportunity/search.controller.ts`

The synchronous `backtestService.getReport` throw is now deferred into the promise
chain so the existing `.catch(() => null)` guard works:

```ts
Promise.resolve()
  .then(() => this.backtestService.getReport(normalized, '1d'))
  .catch(() => null),
```

Missing backtest data no longer 500s the endpoint; the response reports
`winRate/totalTrades/sharpeRatio = 0`.

### 2.4 Smoke infrastructure

- `jest.smoke.config.ts` - added `setupFiles: ['<rootDir>/modules/market-data/__smoke__/env.loader.ts']` and raised `testTimeout` to 300000ms.
- `modules/market-data/__smoke__/env.loader.ts` (NEW) - loads the repo-root `.env`
  (then a local `.env`) into `process.env` without overriding pre-set variables.
- `apps/api/package.json` - added `test:smoke:provider` (`--testPathPattern=market-data`)
  and `test:smoke:e2e` (`--testPathPattern=ai-early-opportunity`).

### 2.5 Real-provider smoke suite - `modules/market-data/__smoke__/real-provider-validation.smoke-spec.ts` (NEW)

Supersedes and replaces `real-data-pipeline.smoke-spec.ts` (deleted). 12 tests in
7 blocks, all gated by `SMOKE_TEST=1` via a shared `describeOrSkip`:

1. **Provider configuration report** - complete config entry + status/timeframe
   reports without network calls.
2. **Live connectivity and failure classification** - every provider outcome maps to
   data or a known failure category; HTTP-level classification is deterministic.
3. **Real coverage matrix** - latest price + 1d history for the active-symbol sample;
   a timeframe resolution matrix for every platform timeframe.
4. **Cache reuse (real CacheService)** - second fetch for the same symbol+timeframe
   served from cache.
5. **Fallback with real providers** - a `FailFast` adapter proves fallback to a
   working provider, and that no data is fabricated when every provider fails.
6. **Real data quality and freshness** - OHLCV invariants, ordering and 1d freshness.
7. **Health and diagnostics after real traffic** - per-provider request metrics and
   diagnostics reflect the traffic the orchestrator actually handled.

### 2.6 End-to-end pipeline smoke suite - `modules/ai-early-opportunity/__smoke__/early-opportunity-pipeline.smoke-spec.ts` (NEW)

Boots the full `EarlyOpportunityModule` (prediction -> smart money -> catalyst ->
verification -> AI research consensus -> early opportunity engine) via
`Test.createTestingModule` with real HTTP. 4 tests: valid 1d prediction for THYAO,
`scanTicker`, AI research consensus (tolerant when no provider is online), and the
quick-search endpoint.

### 2.7 Unit specs (NEW)

- `modules/market-data/error/error-classifier.service.spec.ts` - classification of
  HTTP statuses, timeouts, network errors, message patterns, retryability table.
- `modules/market-data/cache/market-data-cache.service.spec.ts` - key building,
  TTL selection, pass-through on miss/hit, invalidation, provider cache-entry counts.
- `modules/market-data/providers/unified/yahoo-unified.adapter.spec.ts` - added
  regression tests asserting success and failure metrics flow through `withRetry`.

## 3. Tests

- **Typecheck:** `tsc --noEmit` - clean (exit 0).
- **Unit - market-data:** 25 suites / 407 tests GREEN.
- **Unit - affected modules:** ai-early-opportunity + backtest: 17 suites / 212
  tests GREEN.
- **Unit - full suite:** 5356 passed. 3 suites fail for pre-existing,
  environment-dependent reasons unrelated to this sprint (cache fake-timer config,
  compression header detection, load-sensitive performance validator).
- **Smoke (live, real HTTP):** `npm run test:smoke:provider` -> 12/12 GREEN;
  `npm run test:smoke:e2e` -> 4/4 GREEN.

Smoke highlights (live run, 2026-08-09):

```
[smoke] AKBNK 1d: bars=254 latestAgeDays=2.3      (real yahoo series)
[smoke] THYAO early-opportunity: score=36 level=BEKLE confidence=52 timeframes=[1d] reasons=3
[smoke] THYAO consensus: agreement=0.42 score=64 evidence=101   (real research corpus)
[smoke] search THYAO: bullish=25% confidence=52% trend=sideways (real news consensus)
```

## 4. Files touched

```
apps/api/src/modules/market-data/
  orchestrator/market-data-orchestrator.ts          # cacheStore namespace consistency
  providers/unified/yahoo-unified.adapter.ts        # withRetry for market-data + company calls
  providers/unified/yahoo-unified.adapter.spec.ts   # metrics regression tests
  error/error-classifier.service.spec.ts            # NEW unit spec
  cache/market-data-cache.service.spec.ts           # NEW unit spec
  __smoke__/env.loader.ts                           # NEW root-.env loader
  __smoke__/real-provider-validation.smoke-spec.ts  # NEW (replaces real-data-pipeline.smoke-spec.ts)
  __smoke__/real-data-pipeline.smoke-spec.ts        # DELETED (superseded)
apps/api/src/modules/ai-early-opportunity/
  search.controller.ts                              # sync-throw backtest guard fix
  __smoke__/early-opportunity-pipeline.smoke-spec.ts# NEW e2e smoke suite
apps/api/jest.smoke.config.ts                        # setupFiles + timeout
apps/api/package.json                                # test:smoke:provider / test:smoke:e2e
```

## 5. Follow-ups

- Quick-search `backtest` fields stay `0` until the backtest registry is populated by
  the scheduler; smoke asserts the endpoint no longer 500s rather than asserting data.
- Finnhub (HTTP 403) and Alpha Vantage (rate-limit) were observed failing live without
  valid keys - both classified correctly as non-retryable / rate-limit; wire valid
  keys and re-run `test:smoke:provider` to confirm keyed coverage.
- The provider dashboard now receives real yahoo metrics; surface them in the
  frontend provider panel.
