# Yahoo Finance Provider Validation Report

**Sprint:** R2-002X-2 — Production Data Repair & Multi-Source Market Data
**Phase:** 2 — Yahoo Provider Validation
**Date:** 2026-08-02
**Status:** VALIDATED (price/history) — PARTIAL (company/sector)

## 1. Summary

Yahoo Finance is validated as the **only production-viable price/history source** in this codebase. It requires no API key and returns live BIST data over public endpoints. Company/sector enrichment via the Yahoo quote API is **not usable without crumb authentication** and must be treated as best-effort (fall through to other providers).

## 2. Live endpoint validation (2026-08-02)

| Endpoint | Result | Notes |
| --- | --- | --- |
| `v8/finance/chart/ASELS.IS?interval=1d&range=5d` | **200 OK** | Live: `symbol=ASELS.IS`, `price=342.25`, `currency=TRY`, 5 points returned |
| `v7/finance/quote?symbols=ASELS.IS,GARAN.IS,THYAO.IS` | **401 Unauthorized** | Requires crumb + cookie auth; unusable unauthenticated |
| `v10/finance/quoteSummary/...` | **401 (expected)** | Same crumb gate; not relied upon |

### Consequences for the unified adapter (`YahooUnifiedAdapter`)
- `getHistoricalData`, `getLatestPrice`, `getAvailableTimeframes`, `validateConnection` → delegate to the existing `YahooFinanceProvider` (v8 chart). **Fully functional.**
- `fetchCompany` / `fetchSector` (v7 quote) → returns `null` on 401, which is **honest degradation**: the orchestrator's fallback chain continues to KAP / Fintables / Alpha Vantage for company data instead of fabricating values.

## 3. Ticker mapping validation

| Canonical | Yahoo symbol | Chart OK |
| --- | --- | --- |
| ASELS | `ASELS.IS` | ✅ |
| GARAN | `GARAN.IS` | ✅ (quote returned by chart meta) |
| THYAO | `THYAO.IS` | ✅ |

Uniform rule: canonical BIST ticker + `.IS` suffix. Confirmed for all 51 active symbols in `SymbolRegistryService` (see `symbol-registry.service.spec.ts`, test asserts every active symbol maps to `${T}.IS`).

## 4. Test coverage

- `yahoo-unified.adapter.spec.ts` — 8 tests: company mapping, `.IS` request formation, history delegation, sector, timeframes.
- `symbol-registry.service.spec.ts` — 8 tests: all active symbols map to `.IS`, canonical reverse-lookup from `ASELS.IS`/`BIMAS.IS`.
- Provider registered in `MarketDataModule` orchestrator with priority 4 (after fintables=1, alpha_vantage=2, finnhub=3).

## 5. Known limitations

1. **v7 quote requires crumb** — company/sector/metadata unavailable unauthenticated. Sector falls through to other providers.
2. **No API key / rate-limit controls** — Yahoo imposes soft rate limits; bursts may return 429/blank arrays. The adapter's circuit breaker + retry (maxRetries=2) absorb this.
3. **BIST intraday gaps** — `60m` interval data for `4h` timeframe can be sparse for small caps.

## 6. Recommendations

1. Keep Yahoo as the default fallback for price/history (priority 4) — zero-config and reliable.
2. Enrich company/sector from the **Symbol Registry** (static sector/ISIN data) instead of Yahoo quotes where providers return null.
3. Revisit `v7` quote only if crumb flow is implemented behind an env flag (`YAHOO_USE_CRUMB=true`).
