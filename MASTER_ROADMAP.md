# MASTER ROADMAP

> Platform-wide roadmap for BIST ELITE AI.

## Current Status: Sprint 20 (v2.16.0)

## Completed

### Phase 4.9: Historical Market Data Backfill & Validation (Sprint 20)
- [x] R2-044 - Historical Market Data Backfill & Validation Engine
  - HistoricalMarketDataService on top of MarketDataOrchestrator / IncrementalMarketDataService (NO second pipeline)
  - Per-symbol status, all-symbol metadata-only report, gap detection, quality, backfill safety gate
  - Smart backfill: only missing ranges fetched (proven: 1 range request for a 1-day hole; 0 provider calls when complete)
  - Partial provider responses never reported as success (status=partial, "Provider yaniti eksik; bosluklar korundu.")
  - Failure preserves previous valid data: STALE_BUT_VALID ("Onceki gecerli veri korunarak kullanildi.")
  - Provider fallback reused from orchestrator; actualProvider / fallbackUsed / providerAttempts surfaced
  - Deterministic BIST trading calendar (weekends + fixed TR holidays never counted as gaps)
  - Cache namespaces reused (historical / historicalMeta / historicalBackfill) - no duplicates
  - Backtest Engine consumes validated history via getValidatedHistory() (backtest.service.ts)
  - API: GET /market-data/history/status, /:symbol/status, /:symbol/gaps, /:symbol/quality,
    POST /:symbol/backfill, GET /:symbol/backfill/status, POST /backfill (bulk, conservative concurrency)
  - Lightweight web "Tarihsel Veri" page (overview / symbol / backfill tabs)
  - 30 deterministic historical tests + all call-count proofs; regression 72 suites (987 tests) + 15 signal suites (155) GREEN
  - tsc --noEmit clean (apps/api + apps/web); web history suite 19 files / 235 tests GREEN
  - Fixed pre-existing boot blocker: DataResearchPipelineService cache param typed `any` -> CacheService
  - Known issue: local PostgreSQL stuck in crash recovery blocks DB-backed runtime E2E (not a code defect)
  - See docs/R2-044_HISTORICAL_MARKET_DATA_BACKFILL.md

### Phase 4.8: Indicator Cache & Advanced Deduplication (Sprint 19)
- [x] R2-043 — Indicator Cache & Advanced Deduplication Engine
  - IndicatorCacheService: caches IndicatorEngine.calculateAll() results by symbol:timeframe:lastBarTimestamp
  - Timeframe TTLs (1h/2h 60s, 4h 120s, 1d 300s, 1w 600s, 1m 900s, 3m 1800s, 6m 3600s); only non-empty results cached
  - RegistryCacheAdapter: registry → cache → compute-once → dual-save path shared by Prediction + Smart Money
  - RequestDeduplicatorService short-term memory (default 15s window): sequential repeats return in-memory result,
    ZERO re-fetch / re-compute; failures never remembered; 500-entry cap; memoryHits stat
  - Performance metrics endpoints (read-only, @Public): GET /performance/cache, /indicators, /dedup, /summary
  - All downstream engines (Signals, MTF, Portfolio, Early Opportunity) share cached indicators transitively
  - Cold request: 1 provider call / 1 indicator computation; warm sequential repeat: 0 / 0 (call-count tests)
  - Dedup proof: 5 parallel → 1 call; 10 sequential → 0 recalcs
  - All regression GREEN (329/329 suites, 5535 tests, 1 skipped)
  - See docs/R2-043_INDICATOR_CACHE_AND_DEDUP.md

### Phase 4.7: Real Analysis Pipeline Integration (Sprint 18)
- [x] R2-042 — Real Analysis Pipeline Integration & Single-Request Optimization
  - Shared OHLCV/Indicators between PredictionService and SmartMoneyService (pre-fetched context)
  - FinancialDataQualityService as proper singleton injectable (removed ad-hoc instantiation)
  - EarlyOpportunityAnalysisContext: shared context for single-ticker analysis
  - SignalScanner accepts pre-computed engine results via context
  - EarlyOpportunityIntelligenceService builds shared context once per ticker
  - PortfolioIntelligenceService uses LatestPriceIncrementalService
  - PortfolioIntelligenceService uses LatestPriceIncrementalService
  - IndicatorEngine.calculateAll() called once per timeframe per request
  - 20 deterministic integration tests for deduplication verification
  - Provider call reduction: ~68% fewer calls (16→5), ~67% fewer indicator calculations
  - All regression suites GREEN (326/326 suites, 5512 tests)
  - See docs/R2-042_ANALYSIS_PIPELINE_INTEGRATION.md

### Phase 4.6: Real-Time Latest Price Pipeline (Sprint 17)
- [x] R2-041 — Real-Time / Latest-Price Incremental Pipeline
  - LatestPriceIncrementalService: 5-case flow (cold, fresh hit, stale refresh, provider failure + stale fallback, cache disabled)
  - Timeframe-aware TTL: 1h/2h→60s, 4h→120s, 1d→300s, 1w→600s, 1m→900s, 3m→1800s, 6m→3600s
  - Cache namespace: latestPrice, key: symbol:timeframe
  - Request deduplication via orchestrator's RequestDeduplicatorService (key: latest:{symbol})
  - GET /market-data/latest/:symbol?timeframe=1d extended with freshness metadata
  - Turkish freshness messages: "Veri güncel.", "Veri gecikmeli.", "Provider yanıt vermedi, son geçerli veri kullanılıyor.", "Son güncelleme: ..."
  - Cross-engine integration: Early Opportunity, Signals, Portfolio Intelligence, Market Overview now consume shared latest-price cache
  - Prediction, Smart Money, Multi-Timeframe, Entry Zone unchanged (derive from historical candles)
  - 20 deterministic tests + all regression suites GREEN (325/326 suites, 1 pre-existing flaky)
  - See docs/R2-041_REALTIME_LATEST_PRICE_PIPELINE.md

### Phase 4.5: Stabilization & Pre-Pipeline Integrity (Sprint 16)
- [x] R2-039 — Stabilization & Pre-Pipeline Integrity
  - Whole-API typecheck restored: `tsc --noEmit` exits 0 (fixed 6 pre-existing errors in
    financial-data-quality imports + early-opportunity.dto class ordering)
  - Cache integrity: registered 6 orphan namespaces (financialDataQuality, source-quality,
    research-evidence, data-health, data-freshness, agent-reach) that were silently no-oping;
    CacheService now takes an optional config for direct construction
  - Fixed 3 broken test suites: cache eviction/disabled tests (default-config mismatch),
    compression interceptor payloads below the 1024B threshold, performance-validator
    custom-thresholds test (service now accepts optional thresholds)
  - Added first FinancialDataQualityService spec (7 tests incl. cache reuse)
  - No @ts-ignore / @ts-expect-error / untyped any introduced
  - Full API regression 322/323 suites / 5453/5454 tests GREEN; tsc clean
  - See docs/R2-039_STABILIZATION_INTEGRITY.md

### Phase 4.4: Early Signal Scanner (Sprint 15)
- [x] R2-038 — Early Signal Scanner
  - Deterministic EARLY/CONFIRMED signal detection layer consumed by Early Opportunity Intelligence
  - Six categories: PRICE_VOLUME, SMART_MONEY, FUNDAMENTAL, CATALYST, MULTI_TIMEFRAME, MARKET_STRUCTURE
  - 30+ signals; every signal has 0-100 strength (Weak/Medium/Strong/Very Strong), priority, evidence sourceFields
  - Composite Smart Money signals (accumulation+breakout, smart_money+catalyst, smart_money+fundamental) — no independent recalculation
  - Catalyst groups reuse KAP / Research Hub evidence (contract, investment, partnership, capital action, regulatory, corporate event)
  - Deterministic signal convergence: categoryCoverage 35% + avgStrength 40% + confirmedShare 25%, with data-quality caps
  - Convergence summary exposes signalCount, strongSignalCount, earlyCount, confirmedCount, convergenceScore, topSignals
  - Early Opportunity integration: signals, signalConvergenceScore, earlySignalCount, confirmedSignalCount, topSignals on the result
  - New filters: minSignalStrength, minSignalConvergence, signalCategory, signalType, earlyOnly, confirmedOnly
  - Endpoints: GET /signals/top, GET /signals/:ticker, GET /signals/:ticker/explain
  - Reuses Prediction, Smart Money, Catalyst, MTF, Fundamental Validation, Financial Data Quality, Market Data Orchestrator, Symbol Registry, Cache — zero duplicated calculations/requests
  - 5-min TTL cache via CacheService; data-quality caps DATA_ACCEPTABLE ≤80 / WARNING ≤60 / INSUFFICIENT ≤40
  - 44 signal tests + intelligence service/engine signal tests; early-opportunity + portfolio-intelligence regression 26 suites / 397 tests GREEN
  - See docs/R2-038_EARLY_SIGNAL_SCANNER.md

### Phase 4.2: Market Data Hardening
- [x] R2-033 — Real Market Data Pipeline (Hardened)
  - Finnhub resolution fidelity fix (no more mislabeled 1h/2h/4h/3m/6m candles)
  - Fast-fail guards for unconfigured API-key providers (no wasted 401 retries)
  - MarketDataValidationService gate inside the orchestrator fallback path
    (invalid candles filtered, all-invalid responses fall through)
  - Result provenance metadata: sourceTimeframe / dataQuality / validated /
    attemptedProviders / fallbackUsed
  - GET /market-data/providers/configuration (deterministic, no secrets)
  - GET /market-data/timeframes now reports REAL / DERIVED / UNAVAILABLE per timeframe
  - MarketDataService delegates to the orchestrator (unified validated pipeline for
    prediction/backtest/analyst/entry/scanner/scheduler)
  - Real-HTTP smoke test: npm run test:smoke — Yahoo serves THYAO/ASELS/EREGL/TUPRS
    1d + latest, all VALID
  - 23 market-data suites / 391 tests GREEN
  - See docs/R2-033_REAL_MARKET_DATA_PIPELINE.md
- [x] R2-034 — Real Provider Runtime Validation
  - Orchestrator cache-store namespace fix: writes now match the 'any' read
    namespace, so repeated fetches are actually served from cache
  - Yahoo adapter now routes through withRetry (timeout/retry/error-classification/
    metrics) — provider dashboard reports real request traffic
  - Quick-search no longer 500s when a backtest report is missing (sync-throw guard)
  - Smoke infra: env.loader (root .env), 300s timeouts, test:smoke:provider +
    test:smoke:e2e scripts
  - Real-provider smoke suite (12 tests: config, connectivity/classification,
    coverage matrix, cache reuse, fallback, data quality, health metrics)
  - E2E pipeline smoke suite (4 tests: prediction, scan, AI consensus, quick-search)
  - New unit specs: error-classifier, market-data-cache, yahoo metrics regression
  - market-data 25 suites / 407 tests GREEN; tsc clean; both smoke suites GREEN live
  - See docs/R2-034_REAL_PROVIDER_RUNTIME_VALIDATION.md

## Completed

### Phase 4: Core Intelligence Layer (Sprint 11)
- [x] R2-026 — Early Opportunity Engine (pure 0-100 multi-timeframe scorer, scans ALL BIST symbols)
- [x] R2-027 — Early Opportunity Intelligence Engine (CORE)
  - Core intelligence service reusing Prediction, Research Hub, Smart Money, Catalyst,
    Verification AI, Elite Score, Opportunity, Decision, Entry Zone, Backtest, and
    Market Data engines.
  - Full early-opportunity output: entry zone, stop, target 1/2, holding period,
    catalyst, smart money, verification status, research consensus.
  - Deterministic Turkish "WHY" explanations.
  - Filter system: Early Opportunity Score, Confidence, Expected Return, Risk, Sector,
    Market Cap, Liquidity, Smart Money, Catalyst, Elite Score.
  - Self-learning cycle: reuses Backtest Engine to compare predictions vs realized
    performance and adjust confidence / improve ranking (no new scoring system).
  - Top 10 output, 68 deterministic unit tests, green build.
- [x] R2-028 — Multi-Timeframe Opportunity Intelligence
  - Unified opportunity score across 8 timeframes (1h, 2h, 4h, 1d, 1w, 1M, 3M, 6M)
  - 9 alignment calculations: Timeframe, Trend, Momentum, Risk, Confidence,
    Smart Money, Catalyst, Macro, Market Structure
  - Output: score 0-100, strength, trend stage, holding type, best/worst timeframe,
    entry/stop/targets, risk summary, expected return
  - REST endpoints: GET /multi-timeframe/:ticker, GET /multi-timeframe/:ticker/explain
  - Deterministic Turkish explanations
  - All existing engines reused — zero duplicated logic
  - 68 deterministic unit tests, green build
- [x] R2-029 — Elite Dashboard & AI Screener
  - Professional dashboard inspired by NoFx/Bloomberg/TradingView (dark theme, responsive)
  - 8 integrated sections: Top 10 Early Opportunities, Market Overview, AI Filter Panel,
    Watchlist, Quick Search, Timeframe Panel, Top Lists, Dashboard Performance
  - 7 new REST endpoints: /early-opportunities, /early-opportunities/:ticker, /early-opportunities/explain/:ticker,
    /multi-timeframe/:ticker, /multi-timeframe/:ticker/explain, /market/overview,
    /watchlist, /search/:ticker, /top-lists, /dashboard/performance
  - Reuses ALL existing engines: Prediction, Multi-Timeframe Opportunity, Early Opportunity Intelligence,
    Elite Score, Opportunity, Catalyst, Smart Money, Verification AI, Research Hub, Decision,
    Entry Zone, Portfolio, Market Structure, Backtest, Indicator, Historical Data, Market Data Orchestrator, Symbol Registry
  - Zero duplicated logic — all calculations delegate to existing production engines
  - Deterministic Turkish explanations throughout
  - Full API test coverage, green build

### Phase 4.1: Portfolio Intelligence (Sprint 12)
- [x] R2-030 — Portfolio Intelligence Engine & Portfolio Dashboard
  - One unified /portfolio intelligence view consuming ALL existing engines (Early
    Opportunity Intelligence, Multi-Timeframe, Smart Money, Catalyst, Verification AI,
    Elite Score, Self-Learning, Backtest, Market Data Orchestrator, Symbol Registry, Cache)
  - Deterministic Portfolio Intelligence Score (0-100) with centralized documented weights
  - Portfolio status classification (ÇOK GÜÇLÜ / GÜÇLÜ / DENGELİ / DİKKAT / YÜKSEK RİSK)
  - Position status classification (STRONG_HOLD / HOLD / WATCH / REDUCE / EXIT_REVIEW)
  - Portfolio risk: total/invested value, unrealized P&L, max/min weight, sector + top3/top5
    concentration, diversification score, downside risk, risk/reward, Turkish warnings
  - Rebalancing intelligence: target allocation ranges, REDUCE_CONCENTRATION /
    CONSIDER_INCREASE / IN_RANGE, priority + Turkish reason (no trade execution)
  - Bull/Base/Bear portfolio scenarios + intraday/swing/position/investment horizons
  - Portfolio Opportunities section: improving/deteriorating holdings + new top opportunities
    with fit flags (risk, concentration, diversification) — consumed, not re-detected
  - Portfolio registry with up-to-50 snapshots + snapshot comparison (score/status changes)
  - Portfolio learning: connects Self-Learning, Backtest win-rate; recommendation/position
    classification accuracy metrics
  - Telegram-ready service methods (/portfolio, /portfolio-risk, /portfolio-opportunities,
    /portfolio-rebalance, /portfolio-report) — no bot built in this sprint
  - 12 REST endpoints under /portfolio (analysis, positions, opportunities, risk, rebalance,
    scenarios, history, learning, position CRUD, refresh, analyze); root GET /portfolio
    list preserved for the existing SDK
  - Elite Dashboard (apps/web) extended with a "Portfolio Intelligence" tab (summary, score
    breakdown, holdings, rebalancing, scenarios, opportunities, warnings, AI recommendations)
  - 70 deterministic backend unit tests + 8 web component tests, full typecheck GREEN,
    regression suites GREEN
  - See docs/R2-030_PORTFOLIO_INTELLIGENCE.md

### Phase 4.2: Data & Research Pipeline (Sprint 13)
- [x] R2-031 — Data Research Pipeline
  - Provider health monitoring for 8 data providers (Yahoo, Finnhub, Alpha Vantage, Fintables, KAP, TCMB, MKK, SerpAPI)
  - Data freshness tracking with FRESH/ACCEPTABLE/STALE/UNAVAILABLE states
  - Source quality classification (TIER_1/2/3) with configurable tier assignment
  - Research evidence normalization (ticker, title, source, sourceTier, url, publishedAt, fetchedAt, sentiment, relevance, evidenceType, credibility, contentHash)
  - 25 evidence types including NEW_CONTRACT, NEW_FACILITY, EXPORT_AGREEMENT, PRODUCT_LAUNCH
  - Story detection for 14 story types (NEW_CONTRACT, MAJOR_INVESTMENT, etc.)
  - Data quality validation (OHLCV, timestamps, volume, history, gaps)
  - MTF data coverage verification across 8 timeframes (1h, 2h, 4h, 1d, 1w, 1m, 3m, 6m)
  - Indicator coverage reporting (56 indicators across 6 categories)
  - Agent Reach adapter (SerpAPI-based web research with graceful fallback)
  - VectorBT adapter boundary (Python integration optional)
  - 15 REST endpoints under /data-research
  - Full typecheck GREEN, build succeeds, 663 regression tests pass
  - See docs/R2-031_DATA_RESEARCH_PIPELINE.md

### Phase 4.3: Data Quality & Validation (Sprint 14)
- [x] R2-037 — Financial Data Quality & Opportunity Validation
  - FinancialDataQualityService: deterministic quality assessment (0-100) with 6 dimensions
  - Freshness validation (price/fundamental/research) with configurable thresholds
  - Market data integrity: OHLC relationships, volume/price checks, duplicate candles, timestamp ordering, gap detection
  - Fundamental integrity: reuses R2-036 FundamentalValidationReport (PASS/WATCH/FAIL/UNKNOWN)
  - Provider consistency: fallback detection, research conflicts, provider diversity
  - Completeness tracking: price, history, fundamental, research presence
  - Internal consistency: cross-validation of market/fundamental data
  - Transparent weighted scoring: Freshness 20%, Market Integrity 20%, Fundamental 20%, Provider 15%, Completeness 15%, Internal 10%
  - Status thresholds: DATA_VERIFIED (≥80), DATA_ACCEPTABLE (≥60), DATA_WARNING (≥40), DATA_INSUFFICIENT (<40)
  - Early Opportunity integration: quality report attached, new filters (minFinancialDataQuality, financialDataStatus, freshnessStatus, providerConsistency)
  - Default: DATA_INSUFFICIENT excluded from TOP list unless explicitly requested
  - Turkish explanations: deterministic, no GPT
  - 5-min TTL caching via CacheService, reuses all existing engines
  - New endpoints: GET /data-quality/:ticker, GET /data-quality/:ticker/explain
  - 73 early-opportunity tests, 104 financial-rules tests, 71 portfolio-intelligence tests GREEN
  - 315/319 regression suites pass (4 pre-existing failures)
  - See docs/R2-037_FINANCIAL_DATA_QUALITY.md

### Phase 3: Production (Sprint 10)
- [x] GitHub repository finalization
- [x] Documentation suite
- [x] CI/CD workflows
- [x] Repository validation tests

### Phase 2: Intelligence Engines (Sprints 6-9)
- [x] Explainability Engine
- [x] Elite Score Engine
- [x] Multi-Timeframe Consensus Engine
- [x] Strategy Validation Engine
- [x] Adaptive Calibration Engine
- [x] Paper Portfolio Engine
- [x] Recommendation Tracker
- [x] Market Regime Engine
- [x] Opportunity Lifecycle Engine
- [x] Portfolio Intelligence Dashboard
- [x] Production Readiness

### Phase 1: Foundation (Sprints 1-5)
- [x] Monorepo setup (Turborepo, pnpm)
- [x] Database schema, auth, security, observability

## In Progress
### Phase 5: Data Pipeline
- [ ] Real-time BIST data feed integration
- [ ] Historical data import (10+ years)
- [ ] Alternative data sources (sentiment, news)
- [x] Data quality validation (R2-037 ✅)
- [ ] Incremental data updates

## Planned
### Phase 6: ML & AI
- [ ] ML model training pipeline
- [ ] Feature engineering automation
- [ ] Model performance monitoring
- [ ] A/B testing framework
- [ ] Model versioning and rollback

### Phase 7: Frontend Integration
- [ ] Next.js dashboard with real-time data
- [ ] Interactive charts (TradingView lightweight-charts)
- [ ] Portfolio management UI
- [ ] Backtest visualization
- [ ] Mobile-responsive design
