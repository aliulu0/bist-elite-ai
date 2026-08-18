# R2-047B STATUS REPORT — Environment, Runtime & Integration Hardening

Branch: `main` (working tree, not yet committed)
Base: `c97f2a2f` (R2-047A)
Date: 2026-08-12

---

## VERDICT (per-sprint criteria)

| Criterion                 | Status      | Evidence                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUILD                     | ✅ VERIFIED | API `tsc --noEmit` = **EXIT 0** (0 errors); web `tsc` = **EXIT 0**.                                                                                                                                                                                                                                                                                           |
| ENV / PROVIDER CONFIG     | ✅ VERIFIED | `.env.example` documents every provider variable (Finnhub, Alpha Vantage, SerpAPI, Fintables, Yahoo, KAP, TCMB, MKK: `*_ENABLED`, `*_PRIORITY`, `*_TIMEOUT_MS`, `*_RETRY_COUNT`, `*_API_KEY`). Variable names match `market-data.config.ts` and all adapters exactly. `.env`/`.env.local`/`.env.*.local` remain gitignored; keys never reach source/git/logs. |
| DETERMINISTIC ENV LOADING | ✅ VERIFIED | `load-env.ts` now loads `.env.<NODE_ENV>.local` > `.env.local` > `.env.<NODE_ENV>` > `.env` (first-wins, app-local dir before repo root); shell env has highest precedence. Restarting localhost yields the same provider config.                                                                                                                             |
| REDIS OPTIONAL            | ✅ VERIFIED | `REDIS_URL` is no longer a required env var; health check registered with `optional: true`. Optional components no longer degrade overall health/readiness but stay visible in `components`. 3 new health specs (optional degraded, optional unhealthy, required-degraded not masked).                                                                        |
| HEALTH / READINESS        | ✅ VERIFIED | `/health` and `/health/ready` aggregate only required checks; Redis shows as degraded component without flipping status.                                                                                                                                                                                                                                      |
| HISTORY RANGE CLIPPING    | ✅ VERIFIED | Strict `[from,to]` clipping in `IncrementalMarketDataService` (cache-hit, full-fetch, incremental paths) + `HistoricalMarketDataService.getValidatedHistory`. 3 new specs (warm-cache clip, no-range full series, cold-fetch clip).                                                                                                                           |
| BACKTEST ROUTE FIX        | ✅ VERIFIED | `@Get(':runId(UUID-regex)')` declared before `@Get(':ticker')`; UUID no longer shadowed. New controller spec verifies UUID constraint metadata + payload + 404 + ticker fallback.                                                                                                                                                                             |
| EO DATA-QUALITY PRICE     | ✅ VERIFIED | `financialDataQuality.price` no longer "Fiyat verisi yok": intelligence + scanner fall back to the last historical bar when the latest-price state is unavailable.                                                                                                                                                                                            |
| TESTS / REGRESSION        | ✅ VERIFIED | Incremental 62/62, health 44/44, intelligence + scanner 59/59 (incl. controller 6/6); broad regression over market-data / early-opportunity-backtest / ai-early-opportunity / monitoring = **53 suites / 758 pass / 1 skip**.                                                                                                                                 |
| SECRETS                   | ✅ VERIFIED | `git grep` for key patterns on tracked `*.ts` = clean; no secrets in `.env.example` (empty values only); new test file contains no keys.                                                                                                                                                                                                                      |

## WORK DONE

### 1. Environment / provider configuration (sprint items 1, 6, 7)

- `.env.example` expanded with the complete provider config surface (8 providers, per-provider
  `ENABLED`/`PRIORITY`/`TIMEOUT_MS`/`RETRY_COUNT`/`API_KEY` + app-level `LOG_LEVEL`,
  `SCHEDULER_ENABLED`, `AUTH_ENABLED`, `AUTH_ALLOW_ANONYMOUS`), with comments pointing at
  `market-data.config.ts` as the source of truth.
- `env-validator.ts`: `REDIS_URL` demoted from `required: true` to optional (documented fallback).
- `load-env.ts`: deterministic multi-file loading with explicit precedence —
  `.env.<NODE_ENV>.local` > `.env.local` > `.env.<NODE_ENV>` > `.env`, app dir before repo root,
  shell env untouched (highest precedence). Restarts are deterministic.
- Verified (read-only) that `getMarketDataConfig()` reads exactly the documented variables and
  that all adapters fall back to the same `process.env.*_API_KEY`.

### 2. Redis optional + health/readiness alignment (sprint items 2, 5)

- `HealthService`: `HealthCheck.optional` + `ComponentHealth.optional`. Aggregate status is computed
  from required checks only; optional components are reported in `components` for visibility.
- `main.ts`: the Redis ping check is registered with `optional = true` (in-memory cache fallback).
- Specs: optional degraded/unhealthy keep overall HEALTHY; a required degraded check still degrades.

### 3. Strict history `from/to` range clipping (sprint item 3)

- `IncrementalMarketDataService`: all three read paths (fresh warm-cache, full fetch, incremental
  fetch) now strictly clip to the caller's `[startDate, endDate]` (date-string compare, cache
  storage never mutated).
- `HistoricalMarketDataService.getValidatedHistory`: cache read and incremental result both clipped.
- Effect: backtest engine and `/history?from&to` consumers receive only in-range bars.

### 4. Backtest `:runId` route shadow fix (sprint item 4)

- `HistoricalEarlyOpportunityBacktestController`: `getRun` moved before `getTickerSummary` and
  constrained with a UUID regex param so `GET /backtest/early-opportunity/{runId}` resolves the run
  instead of the ticker-helper message. `{runId}/summary|decisions|failures|...` unchanged.
- New controller spec (6 tests): route-path metadata assertions, run payload, 404, ticker fallback.

### 5. Remaining runtime integration defect (sprint item 8)

- `EarlyOpportunityIntelligenceService` + `EarlySignalScannerService`: `financialDataQuality` now
  falls back to the last validated historical bar (plus provider/timestamp metadata) when the
  latest-price state is absent, closing the "Fiyat verisi yok" inconsistency.

## VERIFICATION COMMANDS (local, no turbo/pnpm wrapper)

```
node node_modules/typescript/bin/tsc --noEmit -p apps/api/tsconfig.json        # EXIT 0
node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json        # EXIT 0
node apps/api/node_modules/jest/bin/jest.js --config apps/api/jest.config.ts \
  --testPathPattern="incremental|historical-market-data|health|controller" --forceExit  # GREEN
```

## NEXT STEP

- Commit + push this sprint (keys stay out of `.env*`; grep clean).
- Add real keys to local `.env` (gitignored) and re-run a live `/market-data/providers` +
  `/early-opportunities/:ticker` smoke against the restarted stack.
- Full `turbo run test --filter=@bist-elite/api` in CI.
