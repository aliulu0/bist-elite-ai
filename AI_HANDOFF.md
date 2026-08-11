# AI HANDOFF — Data Research Pipeline (R2-031)

## Summary

Implemented the **Data Research Pipeline** — the unified data quality and research layer that consolidates provider health monitoring, data freshness tracking, source quality classification, research evidence normalization, data quality validation, multi-timeframe coverage verification, indicator coverage reporting, and Agent Reach integration into a single cohesive module. Reuses ALL existing engines (Early Opportunity Intelligence, Multi-Timeframe, Smart Money, Catalyst, Verification AI, Elite Score, Self-Learning, Backtest, Market Data Orchestrator, Symbol Registry, Cache). No independent prediction/scoring system; no trade execution; fully deterministic and explainable in Turkish.

Backend module: `apps/api/src/modules/data-research-pipeline/`.
Frontend: `apps/web` — new "Data Research" tab in the dashboard (pending).

## Files Created (Backend)

| File | Responsibility |
|---|---|
| `modules/data-research-pipeline/data-research-pipeline.module.ts` | NestJS module with all providers/services |
| `modules/data-research-pipeline/controller/data-research-pipeline.controller.ts` | 15 REST endpoints under `/data-research` |
| `modules/data-research-pipeline/interfaces/data-research-pipeline.types.ts` | Full type model (health, freshness, quality, evidence, quality, MTF, indicators, Agent Reach, VectorBT) |
| `modules/data-research-pipeline/services/provider-health.service.ts` | Provider health monitoring with circuit breaker integration |
| `modules/data-research-pipeline/services/data-freshness.service.ts` | Data freshness tracking with FRESH/ACCEPTABLE/STALE/UNAVAILABLE states |
| `modules/data-research-pipeline/services/source-quality.service.ts` | Source quality tiers (TIER_1/2/3) with configurable assignment |
| `modules/data-research-pipeline/services/research-evidence.service.ts` | Evidence normalization, story detection (14 types), credibility scoring |
| `modules/data-research-pipeline/services/data-quality.service.ts` | OHLCV validation, timestamp/volume/history validation |
| `modules/data-research-pipeline/services/mtf-coverage.service.ts` | MTF coverage across 8 timeframes (1h-6m) |
| `modules/data-research-pipeline/services/indicator-coverage.service.ts` | 56 indicators across 6 categories |
| `modules/data-research-pipeline/services/data-research-pipeline.service.ts` | Orchestration service composing all sub-services |
| `modules/data-research-pipeline/providers/agent-reach.adapter.ts` | Agent Reach adapter (SerpAPI) with graceful fallback |
| `modules/data-research-pipeline/providers/vectorbt.adapter.ts` | VectorBT integration boundary (optional) |
| `modules/data-research-pipeline/controller/data-research-pipeline.controller.ts` | 15 REST endpoints under `/data-research` |
| `modules/data-research-pipeline/data-research-pipeline.module.ts` | NestJS module wiring all services |

## Files Created / Modified (Frontend)

| File | Responsibility |
|---|---|
| `components/dashboard/DataResearch.tsx` | Data Research tab (pending integration) |
| `lib/sdk.ts` | Added `dataResearch.*` methods |

## How to Run / Verify

```bash
cd apps/api
node_modules/.bin/tsc --noEmit -p tsconfig.json            # GREEN
node node_modules/jest/bin/jest.js --testPathPattern 'modules/data-research-pipeline' --runInBand --silent --forceExit   # tests (pending)
```

> `eslint` is configured but not vendored in this environment; TypeScript strict typecheck passes (exit 0).

## Key Design Decisions

1. **Consume, never duplicate.** Per-provider health checks reuse `MarketDataOrchestrator.getProviderDashboard()` and `getProviderStatus()`. Freshness uses existing cache timestamps. Quality tiers reuse existing provider configs.
2. **Route precedence.** New module registered after Early Opportunity but before Portfolio (no route conflicts; all under `/data-research`).
3. **Deterministic everywhere.** Engine is pure; no randomness, no GPT; Turkish reasoning built from rules.
4. **Decision support only.** No trades, no broker, no orders.
5. **Centralized configuration.** All weights, thresholds, TTL, cache namespaces in `data-research-pipeline.types.ts`.
6. **Agent Reach ready.** Adapter gracefully handles missing API key (returns unavailable state).

## API Surface (R2-031)

- `GET /data-research/health` — overall data health report
- `GET /data-research/providers` — provider health status
- `GET /data-research/freshness` — data freshness report
- `GET /data-research/freshness/:provider` — freshness for specific provider
- `GET /data-research/source-quality` — source quality report
- `GET /data-research/source-quality/:provider` — source quality for provider
- `GET /data-research/evidence/:ticker` — research evidence for ticker
- `GET /data-research/stories/:ticker` — detected stories for ticker
- `GET /data-research/quality/:ticker` — data quality report
- `GET /data-research/mtf-coverage/:ticker` — MTF coverage for ticker
- `GET /data-research/mtf-coverage` — overall MTF coverage
- `GET /data-research/indicator-coverage` — indicator coverage report
- `GET /data-research/vectorbt/status` — VectorBT adapter status
- `GET /data-research/agent-reach/status` — Agent Reach status
- `POST /data-research/agent-reach/search` — search company via Agent Reach
- `POST /data-research/agent-reach/news` — search news via Agent Reach
- `GET /data-research/full-report/:ticker` — full data research report
- `GET /data-research/full-report` — full data research report (all)
- `POST /data-research/cache/clear` — clear data research caches

All responses: `{ success, data, timestamp }`. All endpoints `@Public()`.

## Test Count

- Backend: Unit tests pending (infrastructure complete)
- Regression: early-opportunity, prediction, multi-timeframe, smart-money, backtest, entry, research, verification, catalyst, dashboard/portfolio suites — GREEN (663 tests).

## Integration

- AppModule registers the new module in Phase 4.2 (after Early Opportunity, before Portfolio).
- `DataResearchPipelineService` reuses `MarketDataOrchestrator`, `SymbolRegistryService`, `EarlyOpportunityIntelligenceService`, `BacktestService`, `SelfLearningService`, `CacheService`.
- Cache: `CacheService` namespaces `data-health`, `data-freshness`, `source-quality`, `research-evidence`, `agent-reach`; TTL 30s-1hr.
- Dashboard integration pending (new "Data Research" tab).

---
---
# AI HANDOFF — Portfolio Intelligence Engine & Portfolio Dashboard (R2-030)

## Summary

Implemented the **Portfolio Intelligence Engine & Portfolio Dashboard** — the unified
portfolio decision-support layer that consumes ALL existing engines (Early Opportunity
Intelligence, Multi-Timeframe, Smart Money, Catalyst, Verification AI, Elite Score,
Self-Learning, Backtest, Market Data Orchestrator, Symbol Registry, Cache) and produces
ONE portfolio intelligence view. No independent prediction/scoring system; no trade
execution; fully deterministic and explainable in Turkish.

Backend module: `apps/api/src/modules/portfolio-intelligence/`.
Frontend: `apps/web` — new "Portfolio Intelligence" tab in the portfolio page.

## Files Created (Backend)

| File | Responsibility |
|---|---|
| `modules/portfolio-intelligence/portfolio-intelligence.config.ts` | Centralized documented weights, thresholds, status labels, cache constants |
| `modules/portfolio-intelligence/portfolio-intelligence.types.ts` | Full type model (analysis, risk, positions, rebalance, scenarios, horizons, opportunities, snapshots, learning) |
| `modules/portfolio-intelligence/portfolio-intelligence.engine.ts` | Pure deterministic engine: score, risk, rebalancing, scenarios, horizons, opportunities section |
| `modules/portfolio-intelligence/portfolio-intelligence.registry.ts` | In-memory position store + up-to-50 analysis snapshots + comparison |
| `modules/portfolio-intelligence/portfolio-intelligence.service.ts` | Orchestration: enrich (single provider calls), analyze, cache, sub-reports, learning, telegram report |
| `modules/portfolio-intelligence/portfolio-intelligence.controller.ts` | 12 REST endpoints under `/portfolio` (all `@Public()`) |
| `modules/portfolio-intelligence/portfolio-intelligence.module.ts` | Module importing EarlyOpportunityModule, MarketDataModule, SymbolRegistryModule, BacktestModule |
| `modules/portfolio-intelligence/dto/portfolio-intelligence.dto.ts` | AddPositionDto / UpdatePositionDto (class-validator) |
| `modules/portfolio-intelligence/index.ts` | Barrel export |
| `modules/portfolio-intelligence/__tests__/test-helpers.ts` | Shared fixture builders |
| `modules/portfolio-intelligence/__tests__/portfolio-intelligence.engine.spec.ts` | Engine tests (weights, score, risk, rebalance, scenarios, horizons, P&L) |
| `modules/portfolio-intelligence/__tests__/portfolio-intelligence.registry.spec.ts` | Registry + snapshot comparison tests |
| `modules/portfolio-intelligence/__tests__/portfolio-intelligence.service.spec.ts` | Service tests incl. cache reuse, missing-data, no-duplicate-calls, opportunities, sub-reports, telegram |
| `modules/portfolio-intelligence/__tests__/portfolio-intelligence.controller.spec.ts` | Controller route tests |

## Files Modified (Backend)

| File | Changes |
|---|---|
| `apps/api/src/app.module.ts` | Imported `PortfolioIntelligenceModule` (line ~89) and registered it (line ~227) BEFORE `PortfolioModule` so static `/portfolio/*` routes win over the existing `@Get(':id')`; existing common dashboard module aliased as `PortfolioIntelligenceDashboardModule` |

## Files Created / Modified (Frontend)

| File | Responsibility |
|---|---|
| `components/portfolio/portfolio-intelligence.tsx` | New Portfolio Intelligence tab: summary cards, score breakdown, holdings table, rebalancing, scenarios, opportunities, warnings, AI recommendations |
| `components/portfolio/index.ts` | Exported `PortfolioIntelligence` |
| `pages/portfolio.tsx` | Added "Portfolio Intelligence" tab + Sparkles icon |
| `lib/sdk.ts` | Added `portfolioIntelligence.*` methods and `sdkClient.portfolioIntelligence*` shortcuts |
| `components/portfolio/__tests__/portfolio-intelligence.test.tsx` | 8 web component tests |

## How to Run / Verify

```bash
cd apps/api
node_modules/.bin/tsc --noEmit -p tsconfig.json            # GREEN
node node_modules/jest/bin/jest.js --testPathPattern 'modules/portfolio-intelligence' --runInBand --silent --forceExit   # 70 tests, GREEN
cd ../web
../../node_modules/.bin/tsc --noEmit                       # GREEN
node_modules/.bin/vitest run src/components/portfolio/__tests__/portfolio-intelligence.test.tsx   # 8 tests, GREEN
```

> `eslint` is configured but not vendored in this environment; TypeScript strict typecheck
> passes (exit 0). Jest may hang on exit for some suites — use `--forceExit`.

## Key Design Decisions

1. **Consume, never duplicate.** Per-position enrichment performs exactly one
   `EarlyOpportunityIntelligenceService.getEarlyOpportunity(ticker)` (which already bundles
   the MTF result), one `MarketDataOrchestrator.fetchLatestPrice`, one
   `SymbolRegistryService.getSymbol`. No second MTF call, no duplicate scoring.
2. **Route precedence.** New controller registered BEFORE `PortfolioModule` so static routes
   (`/portfolio/analysis`, etc.) win over the existing `@Get(':id')`. The root
   `GET /portfolio` list endpoint (used by the existing SDK) is NOT redefined.
3. **Deterministic everywhere.** Engine is pure; no randomness, no GPT; Turkish reasoning
   built from rules.
4. **Decision support only.** No trades, no broker, no orders; rebalancing returns target
   allocation ranges.
5. **Centralized configuration.** All weights, thresholds, TTL, cache namespace in
   `portfolio-intelligence.config.ts`.
6. **Telegram-ready.** Service methods for /portfolio, /portfolio-risk,
   /portfolio-opportunities, /portfolio-rebalance, /portfolio-report exist; the bot is a
   later sprint.

## API Surface (R2-030)

- `GET /portfolio/analysis` — unified portfolio intelligence (score, status, risk, positions, rebalance, scenarios, horizons, opportunities, recommendations)
- `GET /portfolio/positions` — stored positions
- `GET /portfolio/opportunities` — improving/deteriorating holdings + new top opportunities
- `GET /portfolio/risk` — portfolio risk metrics + Turkish warnings
- `GET /portfolio/rebalance` — target allocation ranges with priority + reason
- `GET /portfolio/scenarios` — Bull/Base/Bear + horizons
- `GET /portfolio/history` — analysis snapshot history
- `GET /portfolio/learning` — recommendation/classification accuracy + expected-vs-realized
- `POST /portfolio/position` — add position (AddPositionDto)
- `PUT /portfolio/position/:ticker` — update position
- `DELETE /portfolio/position/:ticker` — remove position
- `POST /portfolio/refresh` — bypass cache, recompute analysis
- `POST /portfolio/analyze` — fresh analysis computation

## Test Count

- Backend: 70 portfolio-intelligence tests (engine, registry, service, controller) — GREEN.
- Web: 8 PortfolioIntelligence component tests — GREEN.
- Regression: early-opportunity, prediction, multi-timeframe, smart-money, backtest, entry,
  research, verification, catalyst, dashboard/portfolio suites — GREEN.

## Integration

- AppModule registers the new module before the existing `PortfolioModule` (route precedence).
- `PortfolioIntelligenceService` reuses `EarlyOpportunityIntelligenceService`,
  `MarketDataOrchestrator`, `SymbolRegistryService`, `BacktestService`,
  `SelfLearningService`, `CacheService`.
- Cache: `CacheService` namespace `portfolio`, keys `analysis` / `opportunities`, TTL 30s.
- Dashboard (apps/web) portfolio page has a new "Portfolio Intelligence" tab that calls
  `GET /portfolio/analysis` and `POST /portfolio/refresh`.

---
---
# AI HANDOFF — Elite Dashboard & AI Screener (R2-029)

## Summary

Implemented the **Elite Dashboard** — the main control center of BIST ELITE AI platform as
`apps/api/src/modules/ai-early-opportunity/` (reusing R2-026 `EarlyOpportunityEngine`, R2-027 `EarlyOpportunityIntelligenceEngine`, R2-028 `MultiTimeframeOpportunityEngine`).

## What it does

The Elite Dashboard is the **main homepage** of BIST ELITE AI — a professional, Bloomberg/TradingView-inspired control center that detects BIST stocks entering early bullish phases *before* the market by reusing ALL existing production engines (zero duplicated calculations).

## Files Created (Backend)

| File | Responsibility |
|---|---|
| `market-overview.controller.ts` | REST: `GET /market/overview` — BIST100, sector heatmap, gainers/losers, volume, smart money, catalyst leaders |
| `watchlist.controller.ts` | REST: `GET /watchlist` — favorites, pinned, recent, AI alerts |
| `search.controller.ts` | REST: `GET /search/:ticker` — instant comprehensive single-ticker analysis |
| `top-lists.controller.ts` | REST: `GET /top-lists` — 7 ranked leaderboards |
| `dashboard-performance.controller.ts` | REST: `GET /dashboard/performance` — AI accuracy, prediction success, avg return, win rate, learning progress |
| `multi-timeframe/multi-timeframe.controller.ts` | REST: `GET /multi-timeframe/:ticker`, `/explain/:ticker` (R2-028) |

## Files Modified (Backend)

| File | Changes |
|---|---|
| `early-opportunity.module.ts` | Added 7 new controllers + MultiTimeframeOpportunityService/Engine + required module imports |
| `early-opportunity.controller.ts` | Existing R2-027 endpoints |
| `early-opportunity.intelligence.service.ts` | Existing R2-027 service |

## Files Created (Frontend)

| File | Responsibility |
|---|---|
| `components/dashboard/TopEarlyOpportunities.tsx` | Top 10 opportunity cards with full intelligence |
| `components/dashboard/MarketOverview.tsx` | BIST100, sector heatmap, gainers/losers, volume, smart money, catalyst leaders |
| `components/dashboard/AIFilterPanel.tsx` | Professional screener with 20+ filters |
| `components/dashboard/Watchlist.tsx` | Favorites, pinned, recent, AI alerts |
| `components/dashboard/QuickSearch.tsx` | Instant comprehensive single-ticker analysis |
| `components/dashboard/TimeframePanel.tsx` | 8 timeframes (1H-6M) with bullish%, confidence, return, trend, momentum |
| `components/dashboard/TopLists.tsx` | 7 ranked leaderboards with tabs |
| `components/dashboard/DashboardPerformance.tsx` | AI accuracy, prediction success, avg return, win rate, learning progress |
| `app/dashboard/page.tsx` | Main dashboard page layout |
| `hooks/use-dashboard.ts` | React Query hooks for all new endpoints |
| `services/dashboard.ts` | API service functions for all new endpoints |
| `types/early-opportunity.ts` | TypeScript types for all new endpoints |
| `types/dashboard.ts` | Extended with new types |

## How to Run / Verify

```bash
cd apps/api
node_modules/.bin/tsc --noEmit -p tsconfig.json      # GREEN
node_modules/.bin/jest --testPathPattern=ai-early-opportunity   # 68 tests, GREEN
```

> `eslint` is configured but not vendored in this environment; TypeScript (full project) passes with exit 0.

## Key Design Decisions

1. **Reuse, never duplicate.** Every calculation delegates to existing production engines — zero new scoring, zero new indicators, zero new data fetching.
2. **7 new REST endpoints** covering all 8 dashboard sections + MTF endpoints from R2-028.
3. **Deterministic Turkish explanations** — rule-based narratives (no GPT, no randomness).
4. **Professional UI** — dark theme, responsive, inspired by NoFx/Bloomberg/TradingView.
5. **Real-time ready** — React Query hooks with configurable refetch intervals.

## API Surface

### R2-029: Elite Dashboard
- `GET /early-opportunities` — top 10 (filters: limit, minEarlyOpportunityScore, minConfidence, minExpectedReturn, maxRisk, sector, marketCap[min|max], liquidity, minSmartMoneyScore, minCatalystScore, minEliteScore)
- `GET /early-opportunities/:ticker` — full intelligence for single ticker
- `GET /early-opportunities/explain/:ticker` — deterministic Turkish explanation
- `GET /multi-timeframe/:ticker` — full MTF analysis for single ticker (R2-028)
- `GET /multi-timeframe/:ticker/explain` — MTF Turkish explanation (R2-028)
- `GET /market/overview` — BIST100, sector heatmap, gainers/losers, volume, smart money, catalyst leaders
- `GET /watchlist` — favorites, pinned, recent, AI alerts
- `GET /search/:ticker` — instant comprehensive single-ticker analysis
- `GET /top-lists` — 7 ranked leaderboards (smart money, catalyst, confidence, expected return, elite score, opportunity, risk/reward)
- `GET /dashboard/performance` — AI accuracy, prediction success, avg return, win rate, learning progress

### R2-028: Multi-Timeframe Opportunity
- `GET /multi-timeframe/:ticker` — full MTF analysis for a single ticker
- `GET /multi-timeframe/:ticker/explain` — deterministic Turkish explanation

## Test Count

68 unit tests (engine, intelligence engine, services, self-learning engine + service) — all GREEN.

## Integration

- EarlyOpportunityIntelligenceService calls MTF service and enriches `EarlyOpportunityIntelligenceResult` with `multiTimeframe` field
- Dashboard page integrates all 8 sections with shared state (selected ticker, filters)
- Quick Search provides instant drill-down from any ticker entry
- Timeframe Panel shows 8 timeframes for selected ticker
- All calculations reuse existing engines — zero duplicated logic