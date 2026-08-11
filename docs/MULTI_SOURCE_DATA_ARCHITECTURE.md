# Multi-Source Market Data Architecture

**Sprint:** R2-002X-2 — Production Data Repair & Multi-Source Market Data
**Status:** IMPLEMENTED

## 1. Overview

Production BIST data is served by a **multi-source fallback chain** with a single canonical symbol registry. No provider is a single point of failure: price/history, company/sector, fundamentals, news, and macro data each fall through ordered providers until one returns valid, non-fabricated data.

Two execution paths exist and must not be confused:

- **Unified orchestration path** (production): `MarketDataOrchestrator` → 7 unified adapters, priority-ordered, circuit-breaker protected.
- **Legacy registry path**: `MarketDataProviderRegistry` → Yahoo-only (used by `MarketDataService`/`/market-data` endpoints). Yahoo is also now exposed inside the unified path via `YahooUnifiedAdapter`.

## 2. Provider priority

| Priority | Provider | Key | Auth | Price/History | Company | Fundamentals | News |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | fintables | `FINTABLES_API_KEY` | API key | partial | ✅ | ✅ | – |
| 2 | alpha_vantage | `ALPHA_VANTAGE_API_KEY` | API key | ✅ | ✅ | partial | – |
| 3 | finnhub | `FINNHUB_API_KEY` | API key | ✅ | partial | ✅ | – |
| 4 | yahoo | – (public) | none | ✅ | partial* | – | – |
| 5 | kap | `KAP_API_KEY` | Bearer | – | ✅ | – | disclosures |
| 6 | tcmb | `TCMB_API_KEY` | API key | – | – | – | macro |
| 7 | mkk | `MKK_API_KEY` | API key | – | partial | – | – |

\* Yahoo `v7/quote` requires crumb auth (401 unauthenticated) — company/sector from Yahoo is best-effort and falls through.

Priorities are read from env (`*_PRIORITY`) and mirrored in `aggregation-engine.service.ts::getProviderPriority`.

## 3. Symbol registry

`apps/api/src/modules/market-data/symbol-registry/`

- **52 BIST symbols** (union of `BIST_SYMBOLS` from pipeline-orchestrator + `BIST_TRACKED_SYMBOLS` from scheduler).
- Each entry: canonical ticker, company name, sector, exchange, ISIN, active flag, per-provider ticker mapping (`.IS` for yahoo/finnhub, `.IST` for alpha_vantage, bare code for KAP/TCMB/MKK/Fintables).
- Single source of truth for provider→symbol resolution, sector grouping, coverage counting, and ISIN metadata.
- `TRAK` marked inactive (delisted 2023-05-02) so it never enters the scan universe.
- ISINs are populated where confirmed from public sources; unconfirmed entries are `null` (honest absence, never fabricated).

## 4. Data flow

```
Canonical symbol (registry)
        │
        ▼
MarketDataOrchestrator.executeWithFallback(type, symbol)
        │  cache hit?  ──► return cached {provider: "cache"}
        │
        ▼
sort providers by priority
  for each enabled, circuit-closed provider:
        fetch ── success? ──► cache.set(provider.name, ...) ──► return
                      │
                      └── failure ──► circuitBreaker.recordFailure → next provider
        │
        ▼
  all failed ──► return null (no fabrication)
```

News aggregation runs the same pattern in the `research` module:

```
GoogleNewsProvider (RSS) ──► NewsAggregationService.aggregate()
        dedupe by url/title ──► enrich sector via registry ──► naive sentiment
        ──► cached (research:company, 300s) ──► GET /api/research/news
```

## 5. New capabilities

- `AlphaVantageAdapter` implements `ITechnicalIndicatorProvider`: RSI, MACD, EMA, SMA, ADX, ATR, OBV series + sector performance. Rate limited (default 15s between calls, 25/day) to respect the free tier.
- `YahooUnifiedAdapter` wraps the existing `YahooFinanceProvider` for price/history and adds company/sector via v7 quote (best-effort).
- Provider dashboard: `GET /api/market-data/providers/dashboard` — per provider: status, latency, request counts, last sync, auth configured, cache entries, symbol coverage.

## 6. Configuration

`.env` additions:
```
ALPHA_VANTAGE_BASE_URL=...    ALPHA_VANTAGE_TIMEOUT_MS=20000
ALPHA_VANTAGE_RETRY_COUNT=3   ALPHA_VANTAGE_PRIORITY=2
ALPHA_VANTAGE_RATE_LIMIT_MS=15000  ALPHA_VANTAGE_DAILY_LIMIT=25
YAHOO_PRIORITY=4              FINTABLES_PRIORITY=1
KAP_PRIORITY=5                TCMB_PRIORITY=6    MKK_PRIORITY=7
```

No secrets are committed — keys remain empty by default; providers without keys report `unconfigured` on the dashboard and are skipped.

## 7. Verification

- `pnpm --filter @bist-elite/api build` — clean (exit 0), includes new providers, research module, registry.
- 10 targeted test suites, 101 tests pass (symbol registry, orchestration, aggregation, alpha vantage, yahoo unified, google news, news aggregation, RSS parser, pipeline-orchestrator).
- Live validation: Yahoo v8 chart OK (ASELS.IS, 342.25 TRY); v7 quote 401 (crumb-gated); Google News RSS 200 with items; Alpha Vantage reachable (key required).

## 8. Known limitations

1. **Yahoo company/sector**: v7 quote is crumb-gated → company data falls through to KAP/Fintables. Price/history unaffected.
2. **Alpha Vantage free tier**: 25 req/day — technical indicators are intentionally rate-limited; heavy scans should prefer fintables/finnhub.
3. **KAP disclosures** require `mkkMemberOid`; disclosures for symbols without a member OID resolve to `[]`.
4. **TCMB/MKK/Finnhub/Fintables** remain unauthenticated in this environment (no keys) → marked `unconfigured`, not `down`.
5. **Research news** is Google News only (RSS); KAP/TCMB announcement endpoints return `[]` (honest — not implemented by this provider).
6. **ESLint is not installed** in the API workspace (referenced by `lint` script but absent from devDependencies) — typecheck via `nest build` is the lint gate.
