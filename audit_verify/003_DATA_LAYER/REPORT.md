# 003 — DATA LAYER AUDIT

## Verdict: PROVIDERS REAL (62/100) — TradingView MISSING, QualityScorer BUG

## Provider Table

| Provider | File | Status | Real HTTP | Key needed | Used by |
|---|---|---|---|---|---|
| Yahoo Finance | providers/yahoo-finance.provider.ts | Working | ✅ | No | Legacy MarketDataService, orchestrator (prio 4) |
| Fintables | providers/fintables.provider.ts + fintables-unified.adapter.ts | Working | ✅ | Yes | FUNDAMENTAL_PROVIDER, orchestrator (prio 1) |
| Finnhub | providers/unified/finnhub.adapter.ts | Working | ✅ | Yes | Orchestrator (prio 3) |
| AlphaVantage | providers/unified/alpha-vantage.adapter.ts | Working | ✅ | Yes | Orchestrator (prio 2) |
| SerpAPI | providers/unified/serpapi.adapter.ts + research + agent-reach | Working | ✅ | Yes | Orchestrator (prio 8), research |
| Google News | research/providers/google-news.provider.ts | Working | ✅ | No | ResearchModule, NewsAggregation |
| KAP | providers/unified/kap.adapter.ts | Working | ✅ | No | Orchestrator (prio 5), MacroData |
| TCMB | providers/unified/tcmb.adapter.ts | Working | ✅ | Yes | Orchestrator (prio 6), MacroData |
| MKK | providers/unified/mkk.adapter.ts | Working | ✅ | Yes | Orchestrator (prio 7) |
| **TradingView** | — | **MISSING (H1)** | ❌ | — | Documented in priority list but zero code |
| Google Finance | — | Missing | ❌ | — | Listed in D002 priority, no adapter found |

## Data Machinery (all real)

- **MarketDataOrchestrator** — priority fallback (Fintables→TradingView→GoogleFinance→Finnhub→Yahoo→AlphaVantage), cache, circuit breaker, provider dashboard.
- **AggregationEngine / QualityScorer / ConflictResolver / DataValidator** — multi-source merging.
- **CircuitBreakerService** — 3-failure threshold, 5-min recovery.
- **SymbolRegistry** — 11,936-line master registry, 638+ symbols.
- **HistoricalDataPipeline** — pure normalization.
- **ProviderHealthMonitorEngine** — rolling 5-min window, p50/95/99 latency, reliability scoring.

## Findings

- **QualityScorer staleness bug** — `quality-scorer.service.ts:82`: `new Date(c.provider)` parses a provider NAME → `NaN` → always scores 50.
- Health-monitor references phantom identities `investing`, `google_discovery` (no implementation).
- **Dual stack:** legacy `MarketDataService`→Yahoo still used by internal engines; public `/market-data` routes use orchestrator (per D012). Migration incomplete.
- AggregationEngine orchestrator-per-provider loop calls full fallback each iteration (redundant, cache-mitigated).
- **No provider API keys configured** anywhere; only Yahoo/GoogleNews/KAP work keyless (`.env.example` documents none).
- TradingView adapter missing is the single largest data-layer gap (D002 priority #2).
