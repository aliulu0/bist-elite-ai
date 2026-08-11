# 33. FEATURES

## 33.1 Implemented features (verified)

- **Market data ingestion:** Yahoo (legacy live path) + unified orchestrator (7 of 8 providers effective; SerpAPI unregistered).
- **Research & news:** multi-provider aggregation (ChatGPT/Gemini/Perplexity/Google/Finnhub/SerpAPI) + verification + catalyst detection.
- **Analysis chain:** Scanner → Decision → Opportunity → Elite Score → Tomorrow → Analyst → Entry (each tested).
- **Portfolio:** CRUD, positions, transactions, risk, allocation, performance, reports.
- **Portfolio optimization:** engine + registry + service + 24 tests (R2-019).
- **Telegram bot:** thin consumer.
- **Web dashboard:** 20 pages, realtime WS feed.
- **Backtest UI:** page + engine skeleton (no real execution engine).
- **Audit log, provider health monitor, system diagnostics, metrics, alerts, scheduler.**
- **Multi-market, smart-money, market-structure, financial rules, weight optimizer, rule analytics.**
- **Localization (Turkish-first)** with tr/en dictionaries.

## 33.2 Missing / documented-but-not-implemented (H7)

| Feature | Claimed | Reality |
|---|---|---|
| **Backtesting engine (R2-020)** | roadmap "next" | only page-level skeleton; no real execution engine, no backtest pipeline step |
| **TradingView provider** | docs "complete" | **zero code** (H1) |
| **Redis caching** | infra docs | unused (M2) |
| **Python notification worker** | architecture | not integrated (H6) |
| **Auth (users, tokens, API keys)** | guards/decorators | disabled/no-op (C2) |
| **Persistence for AIAnalysis/Notification/MacroIndicator/ProviderStatus/ResearchAnalysis/ModelConfig** | schema | **no tables** (C4) |
| **SerpAPI in unified market-data** | config claims 8 | unregistered, disabled (C3) |

## 33.3 Feature-quality notes

- Decision/Opportunity/Elite/Tomorrow/Analyst/Entry chains are production-grade code with tests.
- Backtest and auth are the two largest feature gaps.
- Localization is ~95% complete (H4 cleanup).
- Docker/CI builds green for what's wired.

## 33.4 Verdict

Core analytical product is implemented and tested. Release-blocking feature gaps are auth enforcement (C2) and real backtesting (R2-020); documented-but-missing TradingView (H1) is an integrity issue.
