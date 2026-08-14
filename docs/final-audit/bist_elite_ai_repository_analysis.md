# BIST ELITE AI Repository Complete Analysis

## Overview
BIST ELITE AI is a personal early opportunity detection platform for BIST (Borsa Istanbul) stocks. The system is designed to:
- Detect early/mispriced opportunities in BIST-listed stocks
- Use real market data from multiple providers (Yahoo, Finnhub, Alpha Vantage, SerpAPI)
- Provide technical analysis, fundamental validation, smart money tracking
- Run backtests with point-in-time semantics (R2-046)
- Generate Turkish-language explanations
- Send Telegram notifications
- Remain lightweight, personal-use, no enterprise infrastructure

### Core Mission
**EARLY OPPORTUNITY DETECTION PLATFORM** - NOT a stock screener, NOT Bloomberg-scale, NOT institutional platform.

### Key Characteristics
- Personal-use level, not enterprise
- Real BIST data verified end-to-end
- Point-in-time data safety (no look-ahead bias)
- Turkish UI and explanations
- No authentication/subscriptions/monetization
- Telegram-ready event model
- Lightweight, maintainable, practical
- 27 R2-048 acceptance criteria met
- tsc = 0, tests GREEN, regression GREEN

### Architecture Highlights
```
Data Sources (Yahoo/Finnhub/Alpha Vantage/SerpAPI)
       ↓
MarketDataOrchestrator + IncrementalMarketDataService
       ↓
LatestPriceIncrementalService + IndicatorCacheService
       ↓
EarlyOpportunityIntelligenceService (core analysis)
       ↓
EarlyOpportunityDecisionEngine (score/entry/stop/target)
       ↓
EarlySignalScanner (per-ticker signals)
       ↓
Backtest Engine (R2-046, point-in-time validated)
       ↓
UI (React + Vite proxy on :3001/:5173)
```

### Acceptance Criteria (All ✅)
- `tsc = 0` ✅
- Radar engine implemented with staged analysis ✅
- Deterministic state machine ✅
- Snapshot comparison ✅
- Real data path verified (cold/warm provider-call counts) ✅
- Incremental data reused ✅
- Latest price cache reused ✅
- Indicator cache reused ✅
- Request dedup verified ✅
- Staged analysis implemented ✅
- Provider call reduction measured (1→0 cold→warm for 8 symbols) ✅
- `/radar/top` works ✅
- `/radar/:ticker` works ✅
- `/radar/:ticker/explain` works ✅
- `/radar/run` works ✅
- `/radar/status` works ✅
- Turkish explanations verified ✅
- `/radar` frontend works ✅
- No fake production data ✅
- No secrets exposed ✅
- Telegram event contract created ✅
- Deployment NOT implemented yet ✅
- Documentation complete ✅
- Git status clean ✅
- Intended changes committed ✅
- `origin/main` pushed ✅

### Main Modules / Services

| Module | Key Files | Purpose |
|--------|-----------|---------|
| **early-opportunity-backtest** (R2-046) | 10 service files + 10 DTOs + 10 test suites (52 tests) | Historical backtest & decision validation, point-in-time |
| **prediction** | service.engine.controller.module | Price-direction predictions using ensemble models |
| **catalyst** | service.engine.controller.module | Scores opportunities based on weighted evidence dimensions |
| **verification-ai** | service.controller.registry.rule-engine | Validates opportunities via rule-engine; confidence scores |
| **data-research-pipeline** | module/controller/interfaces.providers.services | SerpAPI-driven research: fetch, validate, store evidence |
| **opportunity-detection** | engine.services.modules.dtos | Scans symbols for early-opportunity signals (30+ detectors) |
| **market-data** | orchestrator.providers.historical.incremental.dedup.health | Central data flow: fetch, cache, deduplicate, validate |
| **decision** (R2-045) | controller.service.module | Produces EarlyOpportunityDecision snapshots |
| **early-opportunity-intelligence** | common.service | Supplies confluence, technical rules, macro regime data |
| **signal-scanner** | referenced in AI_HANDOFF.md | Scans universe, flags early-opportunity criteria |
| **market-data-orchestrator** | orchestrator.spec.ts | Schedules provider calls, applies cache, circuit-breaker, coverage |
| **cache services** (common) | cache.service.ts cache.module.ts | In-memory/Redis cache for market data & computed indicators |
| **indicator-cache** | indicator-cache.service.module | Caches technical-indicator results |
| **technical-analysis** | module.dto indicators (trend.momentum.volatility.volume.money-flow) | Computes technical indicators used by detectors |
| **macro** | module.engine | Macro-regime analysis (interest-rate, inflation) |
| **portfolio** | module.engine.services.repositories | Portfolio management, risk calculations, position sizing |
| **alerts** | module.engine.services.dto | Telegram/email alert engine; integrates with apps/worker |
| **scheduler** | module.jobs | Background job scheduler (cron-based) for recurring backtest/signal runs |
| **scoring** | | Score calculations |
| **ranking** | | Opportunity ranking |
| **smart-money** | | Institutional flow tracking |
| **workflow** | | Workflow orchestration |
| **entry** | | Entry point calculations |
| **event-bus** | | Event system for inter-component communication |
| **configuration** | | System configuration |
| **confluence** | | Confluence analysis |
| **contract-validator** | | Contract validation |
| **historical-data** | | Historical data management |
| **indicator-cache** | | Indicator result caching |
| **multi-market** | | Multi-market support |
| **opportunity-center** | | Opportunity center UI/page |
| **performance-metrics** | | Performance monitoring |
| **performance-monitor** | | Performance monitoring |
| **persistence** | | Data persistence |
| **rule-analytics** | | Rule-based analytics |
| **stocks** | | Stock-specific logic |
| **system-diagnostics** | | System health diagnostics |
| **technical-rules** | | Technical rule definitions |
| **technical-score** | | Technical scoring |
| **tomorrow** | | Tomorrow-prediction logic |
| **weight-optimizer** | | Weight optimization for scores |
| **websocket-gateway** | | WebSocket real-time data gateway |

### Data Pipeline
```
Yahoo Finance API
       ↓
Finnhub API
       ↓
Alpha Vantage API
       ↓
SerpAPI (news, research, social sentiment)
       ↓
MarketDataOrchestrator (schedules, caches, deduplicates)
       ↓
Provider-Specific Adapters (unified-provider.interface.ts)
       ↓
LatestPriceIncrementalService (latest price tick)
       ↓
IndicatorCacheService (technical indicator cache)
       ↓
EarlySignalScanner (applies 30+ detectors)
       ↓
EarlyOpportunityIntelligenceService (confluence check)
       ↓
EarlyOpportunityDecisionEngine (score/entry/stop/target)
       ↓
Backtest Engine R2-046 (point-in-time validation)
       ↓
UI display + Telegram notifications
```

### Cache Strategy
- **MarketDataCache**: TTL-based in-memory cache for recent bars, Redis fallback
- **IndicatorCacheService**: Caches technical indicator results to avoid recomputation
- **RequestDeduplicatorService**: Removes duplicate requests within a session
- **CircuitBreaker**: Protects against misbehaving providers
- **CoverageReport**: Tracks which symbols/timeframes have been fetched

### Signal Detection
- 30+ detector modules (RSI, MACD, momentum-shift, trend-transition, volume-behaviour, etc.)
- ConfirmationEngine: Consolidates individual signals into composite confirmation
- PriorityEngine: Ranks opportunities by composite score, risk-adjusted return
- ScoreCalculator: Computes numeric score + Turkish explanation text
- DuplicateDetector: Ensures no duplicate symbols in output
- AgeTracker: Tracks signal age for stale-pruning
- PenaltyEngine: Applies penalties for known failure patterns

### Decision Engine
- Produces EarlyOpportunityDecision snapshots
- Includes: score, entry zone, stop loss, target price, status, explanation (Turkish)
- Used by backtest engine for outcome evaluation
- Integrated with research pipeline for confluence checks

### Research Pipeline (SerpAPI-driven)
- Fetches news, research reports, social sentiment from web
- Validates evidence quality and freshness
- Stores in research evidence store
- Used for fundamental/contextual scoring by decision engine
- Provider adapters: SerpAPI, Finnhub, Fintables, Yahoo, KAP, MKK, TCMB

### Backtest Engine (R2-046)
- Point-in-time data guaranteed (no look-ahead bias)
- Historical decision validation
- Outcome horizons: 1W/1M/3M/5M/6M/1Y
- Confidence calibration (LOW/MEDIUM/HIGH)
- Lead-time measurement
- False-positive evaluation
- Missed opportunity tracking
- Benchmark against buy-and-hold/index
- 52 unit tests (mocked, not real-DI)

### Notification/Telegram
- Telegram bot sends early-opportunity alerts
- Background worker (Python) consumes NestJS queue
- sends: new opportunities, status changes, backtest results
- Environment: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- Smoke test script: scripts/smoke-test.sh

### Frontend (React + Vite)
- Pages: backtest, dashboard, scanner, settings, radar, etc.
- Components: ai-assistant, alerts, analysis, dashboard, etc.
- Stores: global state (user, alerts, scanner results)
- Hooks: data fetching, websocket, form handling
- Types: early-opportunity.ts, dashboard.ts, etc.
- vitest.config.ts for component tests
- Tailwind-CSS for styling

## Repository Health
- **Stars**: Mission-focused, personal-use
- **Active Development**: R2-048 (radar engine) recently completed
- **Test Coverage**: 52 backtest unit tests + radar test suites pass
- **TypeScript**: 0 compilation errors
- **Real Data Verification**: Cold→warm provider call reduction proven
- **Mission Alignment**: Early opportunity detection (not stock screener)