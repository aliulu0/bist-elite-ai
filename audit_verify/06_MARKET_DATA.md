# 06. MARKET DATA

## 6.1 Dual architecture (H3)

Two parallel market-data stacks coexist:

### Stack A — Legacy (`MarketDataService`)
- File: `modules/market-data/services/market-data.service.ts`
- Provider: `YahooFinanceProvider` (legacy)
- Powers: **public** `/api/market-data/:symbol/latest` and `/api/market-data/:symbol/history`
- Uses in-memory cache with configurable TTL.

### Stack B — Unified orchestrator (8 adapters)
- Files: `modules/market-data/providers/unified/*` + `orchestrator/market-data-orchestrator.ts` + `market-data.config.ts`
- Providers: Yahoo, Finnhub, Alpha Vantage, TCMB, KAP, MKK, Fintables (+ SerpAPI adapter that is NOT registered — C3)
- Powers: **dashboard/aggregation only** (`/providers/dashboard`, aggregation module, macro TCMB capture).

### Why this matters (D005 violation)
`docs/PROJECT_DECISIONS.md` D005 requires **all** market data to flow through `MarketDataOrchestrator`. In practice the public endpoints read from the legacy Yahoo stack. Consequences:
1. Priority logic (Fintables→Yahoo→…) never applies to the API surface users actually hit.
2. Provider health monitoring does not reflect the data powering public responses.
3. Two cache layers, two TTL configs, two code paths to maintain.
4. Adding a provider to the unified config has no effect on `/market-data/:symbol/latest`.

## 6.2 Timeframes & symbols

- Timeframe support via `market-data.config.ts`; defaults align with documented intervals (5m…1M).
- `database/seeds` / system-settings load 30 BIST-30 companies.
- `MarketDataOrchestrator` normalizes quotes to a common `PriceQuote` shape with `source`, `provider`, `isSynthetic`.

## 6.3 Providers: observed behavior

- Yahoo is the only provider with a working end-to-end live path in both stacks.
- Alpha Vantage, TCMB, KAP, MKK, Fintables adapters exist; their live success depends on external keys/endpoints.
- SerpAPI market-data adapter exists but **cannot** be selected (unregistered) — a configured provider that silently never runs.

## 6.4 Caching

- `market-data-cache.service.ts` + `research-cache.service.ts` — in-memory `Map`-backed TTL caches.
- Redis is **not** used anywhere (see `19_CACHING_REDIS.md`).

## 6.5 Findings summary

1. **C3 — SerpAPI unregistered:** adapter present, config missing → orchestrator runs 7 providers, not 8.
2. **H3 — dual stack:** public endpoints bypass the orchestrator; priority + health don't govern real traffic.
3. **H2 — provider duplication:** Yahoo 2 classes, Fintables 2+, SerpAPI 3, Finnhub news 2 paths.
4. **Phantom identities** `investing`, `google_discovery` in health monitor with no adapters.
5. **TradingView documented but zero code.**

## 6.6 Market-data score rationale

Solid adapter interface and normalization, but the dual stack + unregistered SerpAPI + phantom identities mean the "unified" architecture is partially fictional in practice.
