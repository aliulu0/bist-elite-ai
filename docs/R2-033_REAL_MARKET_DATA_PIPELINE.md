# R2-033 — Real Market Data Pipeline (Hardened)

**Version:** 1.0.0
**Status:** ✅ COMPLETE
**Scope:** Hardening of the production market-data pipeline — provider fidelity,
validation gate, observability, and unified consumer access.

---

## 1. Problem

The platform had a working multi-provider orchestrator, but four gaps prevented it from
being a trustworthy production data layer:

1. **Provider fidelity (finnhub).** Every unsupported timeframe (`1h`, `2h`, `4h`, `3m`,
   `6m`) was silently mapped to finnhub's **monthly** resolution (`M`). A request for
   `4h` returned monthly candles labeled `4h` — mislabeled data fed straight into the
   indicator/prediction engines.
2. **No validation gate.** `MarketDataValidationService` ran in the legacy path only.
   The orchestrator cached and returned whatever a provider produced — including
   `NaN`/corrupt candles.
3. **No deterministic config/observability.** `/providers` performed live health probes;
   there was no way to see whether a provider was *enabled/configured/authenticated*
   without making network calls.
4. **Fragmented consumers.** Prediction, backtest, analyst, entry, scanner, etc. went
   through `MarketDataService` (legacy single-provider path) while the API went through
   the orchestrator — two different pipelines with different behavior.

## 2. Changes

### 2.1 Finnhub adapter fidelity — `providers/unified/finnhub.adapter.ts`

- Explicit resolution map: `1h/2h/4h → 60`, `1d → D`, `1w → W`, `1m → M`.
- Unsupported timeframes (`3m`, `6m`, …) now return `[]` **without** calling the API —
  no more mislabeled candles.
- Fast-fail guards: `getHistoricalData` returns `[]` and `getLatestPrice` returns `null`
  when no API key is configured (stops wasted HTTP 401 retries in dev).
- `getAvailableTimeframes()` now advertises `['1h','2h','4h','1d','1w','1m']`.

### 2.2 Validation gate in the orchestrator — `orchestrator/market-data-orchestrator.ts`

`MarketDataValidationService` is now injected into the orchestrator (optional — legacy
unit-test construction is unaffected):

- **Latest price:** returned point is validated; invalid points are treated as a miss
  and the fallback chain continues.
- **Historical data:** `validateDataPoints` runs before caching; `invalid` candles are
  filtered; an all-invalid response falls through to the next provider.
- Every result carries provenance metadata (see below), so consumers and dashboards can
  see *which* provider served the data, whether a fallback occurred, and how clean it was.

### 2.3 Result metadata — `interfaces/unified-domain.types.ts`

`MarketDataResult<T>` extended with optional provenance:

| Field | Meaning |
| --- | --- |
| `sourceTimeframe` | timeframe as originally requested |
| `dataQuality` | `VALID` / `PARTIAL` / `INVALID` (from validation status) |
| `validated` | whether the validation gate ran on this result |
| `attemptedProviders` | providers tried before success (fallback chain trace) |
| `fallbackUsed` | `true` when more than one provider was attempted |

### 2.4 Deterministic configuration & timeframe observability

- **`orchestrator.getProviderConfiguration()`** — per-provider `{enabled, configured,
  authenticated, priority, timeoutMs, retries, baseUrlHost, public}`. No secrets (host
  only, API keys never exposed).
- **`orchestrator.getTimeframeStatusReport()`** — for each platform timeframe
  (`1h…6m`), classifies `REAL` (natively served), `DERIVED` (via
  `PREDICTION_TIMEFRAME_MAPPING` base timeframe), or `UNAVAILABLE`, with the source
  timeframe and serving providers.

### 2.5 New/exposed API — `market-data.controller.ts`

- `GET /market-data/providers/configuration` — deterministic configuration status
  (no live probes, no secrets).
- `GET /market-data/timeframes` — now includes `details` with per-timeframe
  `REAL/DERIVED/UNAVAILABLE` status (backward compatible: `data` unchanged).

### 2.6 Unified consumer path — `market-data.service.ts`

`MarketDataService.fetchData` / `fetchLatest` now delegate to the orchestrator when one
is available (`@Optional` injection), so prediction/backtest/analyst/entry/scanner/
technical-analysis/scheduler all run through the same validated, multi-provider pipeline.
The legacy single-provider path remains as fallback for isolated test modules.

## 3. Tests

- **Unit:** 23 market-data suites, 391 tests — GREEN (includes new finnhub adapter,
  orchestrator validation/metadata, controller configuration, service-delegation specs).
- **Smoke (manual, real HTTP):** `npm run test:smoke` (gated by `SMOKE_TEST=1`,
  excluded from normal runs).

Smoke result (live run):

```
[smoke] THYAO  1d: provider=yahoo candles=254 q=VALID sourceTf=1d
[smoke] ASELS  1d: provider=yahoo candles=254 q=VALID sourceTf=1d
[smoke] EREGL  1d: provider=yahoo candles=254 q=VALID sourceTf=1d
[smoke] TUPRS  1d: provider=yahoo candles=254 q=VALID sourceTf=1d
```

Yahoo serves real BIST data end-to-end with validation and fallback metadata attached.

## 4. Files touched

```
apps/api/src/modules/market-data/
├── providers/unified/finnhub.adapter.ts          # resolution map + fast-fail guards
├── providers/unified/finnhub.adapter.spec.ts     # NEW
├── providers/unified/yahoo-unified.adapter.ts    # (verified .IS handling, no change needed)
├── interfaces/unified-domain.types.ts            # MarketDataResult metadata
├── orchestrator/market-data-orchestrator.ts      # validation gate + reports + metadata
├── orchestrator/market-data-orchestrator.spec.ts # validation/metadata/config/timeframe tests
├── market-data.service.ts                        # orchestrator delegation
├── market-data.service.spec.ts                   # delegation tests
├── market-data.controller.ts                     # /providers/configuration, timeframes details
├── market-data.controller.spec.ts                # endpoint tests
├── market-data.module.ts                         # inject ValidationService into orchestrator
├── dto/market-data-response.dto.ts               # ProviderConfigurationDto, TimeframeStatusDto
└── __smoke__/real-data-pipeline.smoke-spec.ts    # NEW real-HTTP smoke test
apps/api/jest.smoke.config.ts                     # NEW smoke jest config
apps/api/package.json                             # test:smoke script
```

## 5. Follow-ups

- Wire remaining API-key providers (finnhub, alpha_vantage, fintables, serpapi, KAP, MKK)
  and re-run `npm run test:smoke` to confirm non-yahoo fallbacks.
- Surface `attemptedProviders` / `dataQuality` / `sourceTimeframe` in the frontend
  provider dashboard.
