# R2-044 — Historical Market Data Backfill & Validation Engine

## Problem

The Early Opportunity, Prediction, Signal, Backtest and Portfolio engines consume
historical OHLCV, but prior to this sprint there was no layer to answer:

- Which symbols have historical data?
- Which timeframes have historical data, and how much?
- Where do gaps exist?
- Is the data valid / stale?
- Can a series be safely used for backtesting?

R2-040 (Incremental Market Data Pipeline) and R2-041 (Latest-price pipeline) fetch
data on demand, but a history-management / backfill layer on top of the existing
pipeline was missing. This sprint adds exactly that: a deterministic, cache-backed
backfill and validation engine that reuses the existing provider, orchestrator,
validation and deduplication machinery. It does NOT create a second market-data
pipeline.

## Solution

A new `HistoricalMarketDataService` in `apps/api/src/modules/market-data/historical/`
sits ABOVE `IncrementalMarketDataService` / `MarketDataOrchestrator` and below all
consumers. Data flow:

```
Provider
   ==> MarketDataOrchestrator (provider fallback, retry, circuit breaker)
   ==> IncrementalMarketDataService
   ==> HistoricalMarketDataService  (R2-044)
   ==> Backtest / consumers / self-learning metadata
```

Key behaviours:

- **History status** — per symbol / timeframe coverage computed against the expected
  BIST trading calendar (weekends + fixed Turkish holidays excluded; never counted as
  missing candles).
- **All-symbol status** — metadata-only aggregation from the `historicalMeta` cache
  namespace; never fetches the whole market.
- **Gap detection** — missing ranges, duplicate timestamps, out-of-order candles,
  invalid OHLC, zero/negative prices, invalid volume, abnormal gaps.
- **Smart backfill** — inspects existing metadata, computes only missing ranges and
  requests exactly those ranges (proven: a small hole produces exactly ONE range
  request, not a full re-download).
- **Partial provider response** — a short response is never reported as success;
  coverage is recalculated and the status becomes `partial` ("Provider yaniti eksik;
  bosluklar korundu.").
- **Provider fallback** — reused entirely from `MarketDataOrchestrator.fetchHistoricalRange`;
  R2-044 tracks and surfaces `actualProvider`, `fallbackUsed` and `providerAttempts`.
- **Backtest safety gate** — deterministic `usableForBacktest` + Turkish reason built
  from coverage %, minimum bar depth per timeframe and OHLC integrity.
- **Failure safety** — a failed backfill never destroys previously valid history; it
  returns the previous dataset with status `STALE_BUT_VALID` ("Onceki gecerli veri
  korunarak kullanildi.").
- **Cache-disabled mode** — works without cache persistence (fetch -> validate ->
  merge -> return).

## Files

### API — `apps/api/src/modules/market-data/historical/`

| File | Purpose |
|------|---------|
| `historical-market-data.service.ts` | Core engine: status, gaps, quality, backfill, bulk backfill, validated-history path, backtest safety gate |
| `historical-market-data.controller.ts` | REST surface (6 endpoints below) |
| `historical-market-data.dto.ts` | DTOs (timeframe enum reuses existing platform timeframes) |
| `historical-market-data.types.ts` | `SymbolHistoricalStatus`, `HistoricalCoverage`, `HistoricalQuality`, `HistoricalBackfillResult`, run records, etc. |
| `historical-market-data.config.ts` | `defaultStartDate`, per-timeframe min bars, min coverage %, concurrency caps |
| `bist-trading-calendar.ts` | Deterministic trading calendar (weekdays + fixed TR holidays) |
| `historical-market-data.module.ts` | Nest module; imports `MarketDataModule`, exported to Backtest & root |
| `historical-market-data.service.spec.ts` | 30 deterministic tests incl. all call-count proofs |
| `index.ts` | Barrel export |

Wiring:

- Registered in `apps/api/src/app.module.ts`.
- Imported by `apps/api/src/modules/backtest/backtest.module.ts`; `BacktestService` calls
  `historical.getValidatedHistory(symbol, timeframe)` (cache + incremental only — never a
  second provider path) and falls back to its existing data source when no usable series
  exists.
- Prediction / Signals / Portfolio keep their existing single path via
  `IncrementalMarketDataService` + `IndicatorCacheService` (unchanged).

### Cache namespaces (reused, no new namespaces)

- `historical` — the cached OHLCV points, key `symbol|timeframe`.
- `historicalMeta` — `IncrementalMarketDataState` metadata (first/last timestamp, bar
  count, provider, updatedAt).
- `historicalBackfill` — last backfill run record (status, fetched bars, ranges).

The three namespaces above are the existing namespaces; no `historical2`, `history-cache`
or `backfill-cache` was invented.

## API

Base path: `/market-data/history` (all `@Public()`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/market-data/history/status` | Historical coverage summary for all active BIST symbols (metadata only: totalSymbols, symbolsWithHistory, averageCoverage, completeSymbols, staleSymbols, invalidSymbols, symbols) |
| GET | `/market-data/history/:symbol/status` | Per-symbol status: first/last timestamp, barCount, expectedBarCount, coveragePercent, gapCount, largestGap, freshness, qualityScore, provider, usableForBacktest |
| GET | `/market-data/history/:symbol/gaps` | Gap report: missing ranges, duplicateTimestamps, outOfOrderCount, invalidOhlcCount, zero/negative prices, invalid volume, abnormalGaps |
| GET | `/market-data/history/:symbol/quality` | Quality assessment: qualityScore, validationStatus, integrityValid, freshness, reason, usableForBacktest |
| POST | `/market-data/history/:symbol/backfill` | Backfill missing ranges. Body: `timeframe`, `from`, `to`, `force`, `concurrency` |
| GET | `/market-data/history/:symbol/backfill/status` | Last backfill run info (status, fetchedBars, requestedRanges, remainingRanges, message) |
| POST | `/market-data/history/backfill` | Bulk backfill. Body: optional `symbols[]`, `timeframe`, `from`, `to`, `concurrency` |

## Gap detection & trading calendar

`bist-trading-calendar.ts` is a small deterministic utility:

- `isTradingDay(date)` — weekday AND not a fixed Turkish holiday (01-01, 04-23, 05-01,
  05-19, 07-15, 08-30, 10-29).
- `eachTradingDay(start, end)` — enumerates only trading days.
- `nextTradingDay`, `mondayOfWeek`, `firstOfMonth`, `firstOfQuarter`, `firstOfHalf` and
  period-end helpers power per-timeframe expected-bar generation (1d & 4h use trading
  days; 1w/1m/3m/6m use calendar periods).

Coverage is computed by comparing present period keys against the expected periods;
missing keys are grouped into contiguous `{start, end}` ranges. Anomalies (duplicates,
out-of-order, invalid OHLC, bad prices/volume) are counted independently.

## Backfill algorithm

1. Inspect existing metadata + cached points (`readData`).
2. Compute missing ranges for the requested `[from, to]` window (`computeCoverage`).
3. No missing ranges -> `completed`, zero provider calls ("Veri zaten eksiksiz...").
4. Otherwise set a `running` run record, then fetch ONLY each missing range through
   `orchestrator.fetchHistoricalRange` with a conservative concurrency cap
   (default 1, max 4, max 50 ranges/run).
5. Merge fetched data with existing cache, dedupe by timestamp, sort chronologically,
   validate through `MarketDataValidationService` (invalid candles removed).
6. Persist points + metadata back into `historical` / `historicalMeta`.
7. Recalculate coverage + quality; derive final status. Never claim success when the
   provider returned less than requested (`partial`).
8. On total failure with existing valid data: `STALE_BUT_VALID`, previous data preserved.

Smart-range test proof: existing full July window minus ONE trading day produces a
single range request `{start: missingDay, end: missingDay}` and 1 fetch; consecutive
missing days group into one range.

## Backtest safety gate

`computeQuality`:

- No data -> `usableForBacktest: false`, reason "Gecmis veri yok.".
- Integrity broken -> false ("Veri kalitesi yetersiz (OHLC dogrulama hatasi).").
- Coverage below `minCoveragePctForBacktest` (default 90%) -> false
  ("Veri araliginda bosluklar bulundu.").
- Bars below the timeframe minimum (1d=250, 4h=750, 1w=100, 1m=36, 3m=12, 6m=6 by
  default) -> false ("Backtest icin tarihsel veri yetersiz.").
- All passed -> `usableForBacktest: true`, reason
  "Backtest icin yeterli tarihsel veri bulunuyor.".

`HistoricalMarketDataService.getValidatedHistory()` exposes this series to the Backtest
Engine without touching provider adapters directly.

## Tests

`historical-market-data.service.spec.ts` — 30 deterministic tests, including:

- Trading calendar: weekend + Turkish holidays excluded; trading-day enumeration.
- History status: empty / complete / partial / grouped gaps / multi-symbol report.
- Gap detection: duplicates, out-of-order, zero/negative prices, invalid volume,
  abnormal gaps.
- Backfill: cold cache full window (1 range), complete history (0 provider calls),
  small missing range (exactly 1 range request), repeated request (0 additional calls),
  concurrent identical backfill (1 call), failure -> STALE_BUT_VALID, force refetch,
  partial provider response (never claims success), cache-disabled mode, backfill
  status after failed run, provider-fallback metadata surfacing.
- Quality / backtest safety gate: sufficient data usable; too few bars not usable;
  invalid OHLC not usable.
- Timeframe resolution: 1h request uses the 4h fetchable key; unsupported timeframe
  rejected without touching the provider.
- Validated-history path used by the Backtest Engine.

Call-count proofs (spec #24) are asserted directly via `fetchHistoricalRange` call
counts: 0 / 1 / 0-extra / 1-deduped / preserved-on-failure.

### Test runs (this sprint)

- Historical spec: 30/30 pass.
- Regression groups (market-data, ai-early-opportunity/signals, prediction, portfolio,
  backtest, smart-money): 72 suites, 987 tests pass, 1 skipped.
- Signal suites (ai-analysis, strategy-validation): 15 suites, 155 tests pass.
- Web (history page, history components, lib/sdk): 19 suites, 235 tests pass.
- Whole-project `tsc --noEmit` (apps/api + apps/web): clean.

## Runtime verification

- API boots (the `data-research-pipeline.service.ts` constructor previously declared its
  `cache` dependency as `any`, preventing Nest DI resolution and blocking bootstrap; the
  type was corrected to `CacheService`).
- Live database-dependent E2E could not be completed: the local PostgreSQL 18 service is
  stuck in crash recovery ("FATAL: the database system is in recovery mode") and cannot
  be restarted from a non-elevated shell. Historical coverage/backfill behaviour is
  instead proven by the deterministic unit/integration suites above. The web dev server
  serves the Tarihsel Veri page on :5173.

## Performance & scope

- Provider calls are minimized by design: metadata-only status reads, smart-range
  backfill, and `RequestDeduplicatorService` (in-flight + short-memory) coalescing.
- Concurrency is conservative and bounded (default 1, hard cap 4) for personal use;
  provider rate limits / retries / circuit breaker are the orchestrator's existing
  responsibility (not re-implemented).
- No PostgreSQL/Redis/Kafka/K8s additions. Cache-backed in-memory architecture reused.

## Frontend

A lightweight "Tarihsel Veri" section (no new UI framework):

- Overview tab: all-symbol status table (symbol, timeframe, coverage, bar count,
  provider, backtest-ready badge).
- Symbol tab: detail cards (coverage + quality), gaps panel, quality panel.
- Backfill tab: single-symbol backfill control (ticker, timeframe, from/to) plus bulk
  backfill; shows requested ranges, downloaded bars, provider (+ fallback), quality,
  coverage, backtest-ready and backfill status.

Files: `apps/web/src/components/history/*`, `apps/web/src/stores/history-store.ts`,
`apps/web/src/pages/history.tsx`, `apps/web/src/lib/sdk.ts` (`marketDataHistory`),
route in `apps/web/src/App.tsx` and nav item in the sidebar.

## Known issues

- Local PostgreSQL 18 is stuck in crash recovery — DB-backed runtime E2E pending a
  service restart (admin). Not a code defect; unit/integration suites are green.
- Redis absent locally -> `redis: degraded` on /health; cache-service degrades gracefully.
- `analyzeAnomalies.providerDiscontinuities` is currently a counter placeholder (0);
  actual provider-switch detection would need per-bar provider provenance (not stored
  today).

## Next sprint

- Apply trusted WAL/service restart and run a live backfill against the real BIST symbol
  registry to record runtime provider calls / cache hits.
- Optional: persist historical metadata to the existing Prisma `historical-data` module
  for restart survival (out of scope for R2-044's cache-first, personal-use design).
- Optional: per-bar provider provenance to compute real `providerDiscontinuities`.