# 05. PROVIDER LAYER

## 5.1 Market-data providers

### Legacy stack (powers public `/market-data` endpoints)

- `modules/market-data/providers/legacy/yahoo-finance.provider.ts` → `YahooFinanceProvider` (the primary live data source).
- `modules/market-data/providers/legacy/` — legacy providers wired through the classic `MarketDataService`.
- Public endpoints `/api/market-data/:symbol/latest`, `/history` are served by this stack (D005 violation — should go through the orchestrator).

### Unified 8-provider orchestrator (dashboard/aggregation only)

`modules/market-data/providers/unified/` + `orchestrator/market-data-orchestrator.ts` + `market-data.config.ts`:

| Provider | Adapter class | Priority | Enabled | Notes |
|---|---|---|---|---|
| Yahoo | `YahooUnifiedAdapter` | 1 | true | depends on legacy `YahooFinanceProvider` |
| Finnhub | `FinnhubUnifiedAdapter` | 2 | true | news sourced separately by 2 adapters |
| SerpAPI | *(adapter class exists in unified/)* | **99** | **false** | **NOT registered in market-data.config.ts** (C3/H4) |
| Alpha Vantage | `AlphaVantageUnifiedAdapter` | 3 | true | |
| TCMB | `TcmbUnifiedAdapter` | 4 | true | |
| KAP | `KapUnifiedAdapter` | 5 | true | |
| MKK | `MkkUnifiedAdapter` | 6 | true | |
| Fintables | `FintablesUnifiedAdapter` | 7 | true | |

> **SerpAPI finding (C3):** `modules/market-data/providers/unified/serpapi` adapter implements the unified interface but is missing from `market-data.config.ts`, so `enabled=false`, `priority=99`, never queried. The orchestrator therefore runs 7 providers in practice, while `market-data.config.ts` claims 8.

## 5.2 Research providers

- `research/providers/serpapi-research.service.ts` → `SerpApiResearchService` (priority 1)
- `research/providers/agent-reach.service.ts` → `AgentReachService`
- `research/providers/` also includes `google-news`, `rss`/`feed` aggregation
- `NewsAggregationService` aggregates ChatGPT/Gemini/Perplexity/Google/Finnhub/SerpAPI.

## 5.3 Provider duplication (H2)

| Logical provider | Duplicate classes (same identity) |
|---|---|
| Yahoo | 2 — `YahooFinanceProvider` (legacy) + `YahooUnifiedAdapter` (delegates to legacy) |
| Fintables | 2+ — legacy + unified adapter, same provider name string in both registries |
| SerpAPI | 3 — market-data unified adapter (unregistered), research `SerpApiResearchService`, legacy SerpAPI service |
| Finnhub | 2 news paths — market-data unified adapter + research adapter |

## 5.4 Provider identity & health

- `ProviderHealthMonitorEngine` tracks statuses; phantom identities `investing` and `google_discovery` are tracked by the health monitor but have **no corresponding adapter class** anywhere → health dashboards report providers that don't exist.
- Priority map in `market-data.config.ts` (D002): Fintables→Yahoo→Finnhub→SerpAPI→AlphaVantage→TCMB→KAP→MKK — but **public endpoints bypass the priority orchestrator entirely**.

## 5.5 Missing/documented providers

| Provider | Documented as | Actual state |
|---|---|---|
| TradingView | `docs/` claims complete | **Zero code exists** (H1/C1) |
| Fintables | documented complete | code exists, duplicated |
| TCMB/KAP/MKK | documented complete | code exists |
| Investing | phantom (health monitor) | no code |
| google_discovery | phantom (health monitor) | no code |

## 5.6 Verdict

Provider layer has a solid unified-adapter design but is degraded by: SerpAPI not registered (silently disabled), public endpoints bypassing the orchestrator (dual stack), duplicate provider classes across legacy/unified, phantom health identities, and a documented-but-nonexistent TradingView provider.
