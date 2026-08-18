# R2-078 FINAL REPORT

## Verdict

COMPLETE

## Summary

Full BIST daily scan + opportunity radar implemented, tested, and verified against live Yahoo Finance data. The
feature reuses the existing single market-data pipeline (MarketDataOrchestrator caching/dedup), the existing Elite
Score analysis pipeline, the existing MarketScannerEngine, and one in-memory CacheService namespace
(`scannerSnapshots`) for snapshot persistence. No second pipeline, cache, or engine was introduced.

## Daily Scan Flow

1. `orchestrator.discoverUniverse()` — real BIST universe discovery (795 symbols observed at runtime).
2. Equity filter — `status === 'AVAILABLE' && instrumentType !== null` (all `BistAssetType` values are equity-like;
   `null` instrument type excludes indices/bonds).
3. Bounded, concurrency-limited batch analysis (`concurrency = 5`, `Promise.allSettled`, per-symbol failures isolated).
4. Per symbol: `AnalysisService.analyzeSymbol(ticker, '1d')` (existing Elite Score pipeline) + real scanner features
   (`1d`/`1w` via orchestrator, multi-timeframe confluence from real available timeframes).
5. `MarketScannerEngine.scan(analyses)` — existing ranking engine sets TOP_CANDIDATE/WATCHLIST/REJECTED.
6. `OpportunityRadarService.rankEntries()` — Elite Score primary with deterministic tie-breakers → contiguous ranks.
7. Snapshot stored `current`/`previous` under `scannerSnapshots` cache namespace (immutable scanner state, NOT raw market data).
8. `detectRadarEvents(previous, current)` — deterministic previous/current comparison → radar events.
9. Summary (TOP10/20/50 + grouped event lists) + optional fire-and-forget Telegram notifier.

## Runtime Verification (real providers)

Run via `apps/api/src/modules/market-scanner/__smoke__/daily-scan.smoke-spec.ts` (gated behind `test:smoke`,
SMOKE_TEST=1):

- scan: `scan-1787047622398-dp14epzf` status=COMPLETE universe=795 evaluated=6 available=6 served=6 unavailable=0
- second run: `scan-1787047789943-d4nrq4wz` status=COMPLETE universe=795 evaluated=6 available=6 served=6
- data integrity gate: every AVAILABLE entry had finite close > 0 and eliteScore in [0,100]; every UNAVAILABLE entry had
  null price. No fabricated values.
- ranking gate: contiguous 1..N, no ties, unique symbols.
- persistence gate: snapshot readable from CacheService `scannerSnapshots` namespace.
- provider accounting gate: Yahoo provider summary present and consistent.
- bounded sample = first 6 alphabetically discovered candidates (ACSEL, ADEL, ADESE, AFYON, ADGYO, AGHOL). A full
  universe scan was NOT executed to protect the provider budget; the bounded run exercises the identical code path.

## Provider Reality

- Yahoo: VERIFIED — served all probed symbols (PRICE/OHLCV/HISTORICAL).
- Fintables: NOT_CONFIGURED — runtime HTTP 403 (unauthenticated). Fundamentals therefore report UNAVAILABLE; never
  fabricated.
- SerpAPI: research-only; Google Finance returned no results at runtime (research unavailable, non-fatal).
- 1H/2H: UNAVAILABLE (platform/Yahoo limitation, not fabricated).

## API Endpoints

- `POST /api/market-scanner/daily-scan` — run scan (`forceRefresh`, `maxSymbols`)
- `GET /api/market-scanner/daily-scan/latest` — last snapshot (404 until first scan)
- `GET /api/market-scanner/daily-scan/radar` — last radar events
- `GET /api/market-scanner/daily-scan/summary` — TOP10/20/50 + grouped event summaries (404 until first scan)

## Scheduler

- New `dailyScan` job registered in scheduler engine/controller/service (ALL_JOB_NAMES, VALID_JOB_NAMES, jobMap).
- DISABLED by default (`dailyScan.enabled=false`); job skips unless `DAILY_SCAN_ENABLED === 'true'`.
- Interval `TWENTY_FOUR_HOURS`, `retryAttempts=1`, `retryDelayMs=ONE_HOUR`.

## Frontend

- `/daily-scan` page (Turkish UI): stat cards, TOP ranking table, radar event groups, provider summary, manual run
  with poll-until-settled.
- SDK client: `sdkClient.dailyScanRun/Latest/Summary/Radar` + typed `sdk.dailyScan.*`.
- Nav link (sidebar), breadcrumb, and topbar title wired.

## Data Integrity

- fake data: NONE (absolute prohibition enforced; audit of new code clean)
- unavailable semantics: UNAVAILABLE/null explicitly reported, never 0/50/neutral/estimated/simulated
- provenance: every snapshot entry and radar event carries `sourceProvenance`
- look-ahead: no future data usage; calculations use data <= timestamp T
- score weights: unchanged (financial=20, technical=20, confluence=25, smartMoney=20, marketStructure=15)
- NEW_OPPORTUNITY events require a previous scan (first scan cannot flood the radar)

## Tests

- typecheck (API + web): 0 errors
- new unit tests: 47 (30 radar + 6 notifier + 3 job + 8 service) — all green
- regression: market-scanner 75/75, scheduler 144/144, web 1921/1921
- real-provider smoke: 6/6 green

## Notes / Caveats

- Daily scan scheduler job requires `DAILY_SCAN_ENABLED=true` to run automatically.
- Full-universe scan duration scales with provider budget; bounded concurrency and orchestrator caching/dedup protect it.
- Fintables credentials are not configured; fundamental data contributes as UNAVAILABLE until a provider is configured.
