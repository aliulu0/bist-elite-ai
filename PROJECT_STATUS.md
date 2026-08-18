# PROJECT STATUS

## Overall: GREEN (build fixed in R2-047A; runtime hardening in R2-047B)

> Status corrected by R2-047A (2026-08-12): the R2-046 compile errors were fixed — `tsc --noEmit`
> is clean for apps/api and apps/web, and the API boots and serves real BIST data against the live
> localhost stack. R2-047B further hardens the localhost runtime: standardized provider env config
> (`.env.example` + deterministic `.env.local`/`.env.<NODE_ENV>` loading), optional-Redis
> health/readiness, strict history `from/to` range clipping, and the backtest `:runId` route fix.

- **Build:** `tsc --noEmit -p apps/api/tsconfig.json` **EXIT 0** (0 errors); `apps/web` typecheck
  **EXIT 0**. API boots and serves on `:3001`; web on `:5173`.
- **Runtime:** `/health` 200, `/health/ready` 200. Real BIST OHLCV + live early-opportunity +
  R2-046 backtest execution validated in R2-047A.
- **Tests:** full API regression green in R2-047A (see `docs/R2-047A_STATUS_REPORT.md`); targeted
  suites re-run green for R2-047B changes.
- **Docs:** `docs/R2-047A_STATUS_REPORT.md`, `docs/R2-047B_STATUS_REPORT.md`.

## R2-046 - Historical Early Opportunity Backtest & Decision Validation

- **New module** `early-opportunity-backtest` — reuses existing `HistoricalMarketDataService`,
  `EarlyOpportunityIntelligenceService`, `EarlyOpportunityDecisionEngine`, `CacheService`,
  `IndicatorCacheService`. No second backtest engine, no second data pipeline.
- **PointInTimeDataService** — deterministic point-in-time filtering. Rejects future candles,
  fundamentals, catalysts, research, signals. Tracks rejected count.
- **FutureOutcomeService** — 1W/1M/3M/5M/6M/1Y outcomes: absolute return, pct return, MFE, MAE,
  max drawdown, time-to-positive, time-to-target, time-to-stop, target/stop reached.
  Supports configurable commission and slippage (default 0/0).
- **DecisionSuccessService** — multi-dimension: RETURN, RISK_ADJUSTED, TARGET, EARLY_OPPORTUNITY.
  Stop-first detection. Reuses existing entry/stop/target logic.
- **BenchmarkService** — stock vs benchmark excess return per horizon. Returns null
  if benchmark unavailable — never fabricates data.
- **ConfidenceCalibrationService** — LOW/MEDIUM/HIGH confidence buckets vs actual returns.
  Win rate, avg/median return, avg drawdown. Also: sample-quality classification
  (INSUFFICIENT_SAMPLE / LOW_CONFIDENCE / MODERATE_CONFIDENCE / STRONGER_STATISTICAL_SIGNAL).
- **LeadTimeService** — days from decision to major price appreciation. By score bucket,
  by signal strength. Average/median/best/worst.
- **FalsePositiveService** — positive decision + poor outcome → classify reason from metadata
  (weak_fundamentals, weak_smart_money, catalyst_failure, prediction_failure, data_quality_issue,
  market_wide_selloff, excessive_risk, low_signal_convergence). "Yetersiz kanıt" when no
  deterministic explanation.
- **MissedOpportunityService** — stocks with strong later returns but not selected by Early
  Opportunity. Reports filter failures, missing catalyst/fundamental data, insufficient history.
- **Immutable snapshots** — reuses R2-045 `EarlyOpportunityDecisionSnapshot`; frozen with
  `Object.freeze`; SHA-256 `inputDigest` for reproducibility verification.
- **Survivorship bias** — explicitly flags `SURVIVORSHIP_BIAS_POSSIBLE` in every report.
- **Corporate actions** — flag limitation (no split/dividend/merger/delisting adjustments).
- **Evaluation type** — `HISTORICAL_OUTCOME_VALIDATION` (NOT ML out-of-sample).
- **API** — 10 endpoints under `/backtest/early-opportunity` (run, summary, decisions, failures,
  missed-opportunities, calibration, lead-time, etc.).
- **Cache** — reuses `CacheService` with `historical:*` namespace. No new cache namespace.
- **Tests** — 10 suites / 52 tests GREEN. Critical look-ahead tests (5/5) GREEN.
  Regression: early-opportunity-decision, backtest.engine, backtest.service (3 suites / 54 tests) GREEN.
- See `docs/R2-046_HISTORICAL_EARLY_OPPORTUNITY_BACKTEST.md`

---

## R2-045 - Early Opportunity Decision & Signal Convergence

- **EarlyOpportunityDecisionEngine** — pure, deterministic convergence/decision layer consuming `EarlyOpportunityIntelligenceResult`
- **10 weighted dimensions** — earlyStage (0.15), multiTimeframe (0.15), prediction (0.15), smartMoney (0.10), catalyst (0.10), fundamentals (0.10), signals (0.10), verification (0.05), dataQuality (0.05), risk (0.05). Weights sum to 1.00, documented in `early-opportunity-decision.types.ts`
- **Coverage model** — only **present** dimensions contribute to score; absent evidence never adds positive score
- **Convergence → decisionScore** — weight-averaged mean × coverage factor; coverage < 50% downgrades, 0% invalidates
- **7-way classification** — `STRONG_EARLY_OPPORTUNITY` / `EARLY_OPPORTUNITY` / `CONFIRMED_OPPORTUNITY` / `EXTENDED_OPPORTUNITY` / `WATCHLIST_OPPORTUNITY` / `WEAK_OPPORTUNITY` / `INVALID_OPPORTUNITY`
- **Hard safety gates** — invalidate on `DATA_INSUFFICIENT` / `INVALID_HISTORICAL_DATA` / missing primary data; downgrade on provider conflict / stale data / fundamental FAIL / extreme risk / missing entry framework
- **Confidence** = `0.6 × decisionScore + 0.4 × dataQualityScore`
- **Immutable snapshot** — `EarlyOpportunityDecisionSnapshot` with SHA-256 `inputDigest` for R2-046 backtesting; only data available at decision time
- **Integration** — `EarlyOpportunityIntelligenceService.enrichWithDecisions()` batch-attaches decisions (concurrency 12); intelligence engine `matchesFilters` supports `minDecisionScore` via `result.decision.decisionScore`
- **API** — `GET /ai-early-opportunity/decision/:ticker` (DTO via `.from()`)
- **Zero duplicated logic** — reuses all existing engines; no provider calls, no indicator math, no GPT
- **No new cache namespace** — pure function of an already-cached intelligence result
- **Tests** — decision 2 suites / 16 tests GREEN; ai-early-opportunity regression 11 suites / 146 tests GREEN
- **Typecheck** — `tsc --noEmit` clean (apps/api + apps/web)
- See `docs/R2-045_EARLY_OPPORTUNITY_DECISION.md`

---

## R2-044 - Historical Market Data Backfill & Validation Engine

- **HistoricalMarketDataService** - status / gaps / quality / backfill / bulk backfill / validated-history path on top of the existing orchestration (no second pipeline)
- **Smart backfill** - only missing ranges fetched: 1-day hole -> exactly 1 range request; complete history -> 0 provider calls; concurrent identical -> 1 call
- **Partial provider responses** - never claimed as success (status `partial`, coverage recalculated)
- **Failure safety** - previous valid data preserved as `STALE_BUT_VALID` ("Önceki geçerli veri korunarak kullanıldı.")
- **Provider tracking** - `actualProvider` / `fallbackUsed` / `providerAttempts` surfaced on backfill results
- **Deterministic BIST trading calendar** - weekends + fixed TR holidays excluded from expected bars
- **Cache** - reused `historical` / `historicalMeta` / `historicalBackfill` namespaces only
- **Backtest integration** - `BacktestService` consumes `getValidatedHistory()` (backtest.service.ts)
- **API** - 7 endpoints under `/market-data/history` (status, all-status, gaps, quality, symbol backfill, backfill/status, bulk backfill)
- **Frontend** - lightweight "Tarihsel Veri" page (overview / symbol / backfill tabs) on the existing design system
- **Tests** - 30 deterministic historical tests incl. call-count proofs; regressions GREEN:
  historical 30/30, regression groups 72 suites (987 tests), signal suites 15 suites (155 tests),
  web history suites 19 files (235 tests)
- **Boot fix** - `DataResearchPipelineService` cache param `any` -> `CacheService` (Nest DI bootstrap)
- **Known issue** - local PostgreSQL stuck in crash recovery blocks DB-backed runtime E2E only

---

## R2-042 — Real Analysis Pipeline Integration & Single-Request Optimization ✅

- **Shared OHLCV/Indicators** — PredictionService calculates once, passes to SmartMoneyService via `preFetched` param
- **FinancialDataQualityService** — Proper singleton injectable; removed ad-hoc `createDataQualityService()` in 2 services
- **EarlyOpportunityAnalysisContext** — Shared context for single-ticker analysis (ohlcv, indicators, latestPrice, engine results)
- **EarlyOpportunityAnalysisContext** — Shared context for single-ticker analysis (ohlcv, indicators, latestPrice, engine results)
- **SignalScanner** — Accepts pre-computed engine results via `EarlySignalScanContext`
- **EarlyOpportunityIntelligenceService** — Builds shared context once per ticker via `buildAnalysisContext()`
- **PortfolioIntelligenceService** — Uses `LatestPriceIncrementalService` for latest price
- **IndicatorEngine** — `calculateAll()` called once per timeframe per request
- **IndicatorEngine** — `calculateAll()` called once per timeframe per request
- **Tests** — 20 deterministic integration tests for deduplication verification
- **Performance** — Provider calls reduced ~68% (16→5), indicator calculations ~67% (66→22)
- **Regression** — All 326 suites pass (5512 tests); typecheck clean

## R2-041 — Real-Time / Latest-Price Incremental Pipeline ✅

- **LatestPriceIncrementalService** — 5-case flow implemented (cold, fresh hit, stale refresh, provider failure + stale fallback, cache disabled)
- **Timeframe-aware TTL** — 1h/2h→60s, 4h→120s, 1d→300s, 1w→600s, 1m→900s, 3m→1800s, 6m→3600s
- **Cache namespace** — `latestPrice`, key: `symbol:timeframe` (e.g., `THYAO.IS:1d`)
- **Request deduplication** — via orchestrator's `RequestDeduplicatorService` (key: `latest:{symbol}`)
- **GET /market-data/latest/:symbol?timeframe=1d** extended with freshness metadata
- **Turkish freshness messages** — "Veri güncel.", "Veri gecikmeli.", "Provider yanıt vermedi, son geçerli veri kullanılıyor.", "Son güncelleme: ..."
- **Cross-engine integration** — Early Opportunity, Signals, Portfolio Intelligence, Market Overview now consume shared latest-price cache
- **Prediction, Smart Money, Multi-Timeframe, Entry Zone** unchanged (derive latest from historical candles)
- **Tests** — 20 deterministic tests pass (1 skipped: invalid validation status, covered by MarketDataValidationService tests)
- **Regression** — all 325 existing suites pass (1 pre-existing flaky timestamp test)
- See `docs/R2-041_REALTIME_LATEST_PRICE_PIPELINE.md`

---

## R2-039 - Stabilization & Pre-Pipeline Integrity

- **Whole-API typecheck restored:** `tsc --noEmit -p apps/api/tsconfig.json` exits 0.
  Fixed the 6 pre-existing errors - wrong import paths in
  `financial-data-quality.service.ts` / `.types.ts` (cache.service, market-data.types,
  ai-research.types) and `FinancialDataQualityReportDto` used before declaration in
  `early-opportunity.dto.ts` (quality DTO block moved above the main DTO).
- **Cache integrity:** 6 production namespaces (`financialDataQuality`, `source-quality`,
  `research-evidence`, `data-health`, `data-freshness`, `agent-reach`) were used but never
  registered - caching silently no-oped. All registered in `CacheService`; regression test
  added. `CacheService` now accepts an optional config (used by fixed tests).
- **Broken tests fixed:** cache eviction + disabled-cache tests (default-config mismatch),
  compression interceptor payloads below the 1024B threshold, performance-validator
  custom-thresholds test (service accepts optional thresholds).
- **New coverage:** first `financial-data-quality.service.spec.ts` (7 tests, incl. cache
  reuse via the `financialDataQuality` namespace).
- **Verification:** full API regression 322/323 suites / 5453/5454 tests GREEN (the single
  failure is the timing-sensitive request-deduplicator test that passes in isolation);
  cache 69, financial-rules 145, early-opportunity+signals+portfolio+research 467,
  market-data 407 all GREEN.
- See `docs/R2-039_STABILIZATION_INTEGRITY.md`.

---

## R2-038 — Early Signal Scanner ✅

Completed the deterministic Early Signal Scanner layer:

- **EarlySignalScannerEngine** — six categories (PRICE_VOLUME, SMART_MONEY, FUNDAMENTAL,
  CATALYST, MULTI_TIMEFRAME, MARKET_STRUCTURE), 30+ signal types, every signal
  EARLY/CONFIRMED with 0-100 strength + priority. All signals are **consumed outputs**
  of existing engines — no independent recalculations.
- **Signal convergence** — `categoryCoverage*0.35 + avgStrength*0.4 + confirmedShare*0.25`,
  capped by data quality (ACCEPTABLE ≤80 / WARNING ≤60 / INSUFFICIENT ≤40). Summary now
  includes `strongSignalCount` (strength ≥ 65).
- **Early Opportunity integration** — results carry `signals`, `signalConvergenceScore`,
  `earlySignalCount`, `confirmedSignalCount`, `topSignals`.
- **New filters** — `minSignalStrength`, `minSignalConvergence`, `signalCategory`,
  `signalType`, `earlyOnly`, `confirmedOnly` (reused existing filter framework).
- **Endpoints** — `GET /signals/top`, `GET /signals/:ticker`, `GET /signals/:ticker/explain`.
- **Cache** — 5-min TTL via existing CacheService; repeated scans do zero provider requests.
- **Zero duplication** — one fetch per engine per ticker; EarlySignalScanContext lets callers
  pass already-computed results; cache verified by provider-call-count assertions.
- **Tests** — signals 3 suites / 44 tests (engine matrix, service, controller) +
  intelligence service/engine signal tests; early-opportunity + portfolio-intelligence
  regression 26 suites / 397 tests GREEN.
- See `docs/R2-038_EARLY_SIGNAL_SCANNER.md`.

---

## R2-034 — Real Provider Runtime Validation

- Orchestrator cache-store namespace fix: writes were keyed under the serving
  `provider.name` while reads used `'any'` — cache never hit. All three write sites
  now go through a `cacheStore` helper writing the `'any'` namespace (the `tcmb`
  provider-specific entries are intentionally left paired).
- Yahoo adapter pipeline fidelity: `getHistoricalData` / `getLatestPrice` /
  `fetchCompany` now route through `withRetry` (timeout, retry/backoff,
  error-classification, per-request metrics) — the provider dashboard previously
  reported `totalRequests = 0` for yahoo despite it serving all real traffic.
- Quick-search resilience: `SearchController.search` crashed with 500 when the
  backtest registry had no report (synchronous `getReport` throw defeated
  `.catch(() => null)`); the call is now deferred into the promise chain.
- Smoke infrastructure: root-`.env` loader (`env.loader.ts`), 300s test timeout,
  `test:smoke:provider` and `test:smoke:e2e` scripts.
- New real-provider smoke suite (`real-provider-validation.smoke-spec.ts`, replaces
  the deleted `real-data-pipeline.smoke-spec.ts`): 12 tests covering config report,
  live connectivity/classification, coverage matrix, cache reuse, fallback, data
  quality/freshness, and health metrics.
- New e2e pipeline smoke suite: boots `EarlyOpportunityModule`, drives prediction,
  early-opportunity scan, AI research consensus, and quick-search with real data.
- New unit specs: error-classifier.service, market-data-cache.service, yahoo metrics
  regression tests.
- Tests: market-data 25 suites / 407 tests GREEN; affected modules (ai-early-
  opportunity + backtest) 17 suites / 212 GREEN; `tsc --noEmit` clean; both smoke
  suites GREEN live (AKBNK 1d 254 bars, THYAO consensus evidence=101).
- See `docs/R2-034_REAL_PROVIDER_RUNTIME_VALIDATION.md`.

## R2-033 — Real Market Data Pipeline (Hardened)

- Finnhub adapter fidelity: explicit resolution map (1h/2h/4h→60, 1d→D, 1w→W, 1m→M);
  unsupported timeframes return [] instead of mislabeled monthly candles; apiKey
  fast-fail guards added.
- Orchestrator now runs MarketDataValidationService before caching/returning OHLCV
  (latest + historical); invalid candles filtered, all-invalid responses fall through
  the provider chain.
- MarketDataResult metadata: sourceTimeframe / dataQuality (VALID|PARTIAL|INVALID) /
  validated / attemptedProviders / fallbackUsed.
- New API: `GET /market-data/providers/configuration` (deterministic, no secrets);
  `GET /market-data/timeframes` adds per-timeframe REAL/DERIVED/UNAVAILABLE details.
- MarketDataService.fetchData/fetchLatest delegate to the orchestrator when available,
  unifying the prediction/backtest/analyst/entry/scanner/scheduler paths onto the
  validated multi-provider pipeline.
- Tests: 23 market-data suites / 391 tests GREEN. Real-HTTP smoke test added
  (`npm run test:smoke`) — Yahoo serves THYAO/ASELS/EREGL/TUPRS 1d + latest, all VALID.
- See `docs/R2-033_REAL_MARKET_DATA_PIPELINE.md`.

  multi-timeframe/smart-money/backtest/entry/research/verification/catalyst/dashboard
  regression suites GREEN. Web portfolio tests 95/95 passing. Data Research Pipeline
  (R2-031) infrastructure tests pending; 663 regression tests pass.

- **Lint:** `eslint` script is configured but the `eslint` binary is **not installed** in
  `node_modules` in this environment; TypeScript strict typecheck is clean. Re-run
  `npm run lint` once eslint is vendored.

## R2-037 — Financial Data Quality & Opportunity Validation ✅

Implemented the deterministic Financial Data Quality & Opportunity Validation layer:

- **FinancialDataQualityService** — orchestrates 6 validation dimensions with transparent weights:
  - Freshness (20%): price ≤5min/≤1h, fundamental ≤24h/≤7d, research ≤1h/≤24h
  - Market Integrity (20%): OHLC relationships, volume/price, duplicates, timestamp ordering, gap detection
  - Fundamental Integrity (20%): reuses R2-036 FundamentalValidationReport (PASS/WATCH/FAIL/UNKNOWN)
  - Provider Consistency (15%): fallback detection, research conflicts, provider diversity
  - Completeness (15%): price/history/fundamental/research presence tracking
  - Internal Consistency (10%): cross-validation penalties

- **Quality Score (0-100) & Status**:
  - DATA_VERIFIED ≥80, DATA_ACCEPTABLE ≥60, DATA_WARNING ≥40, DATA_INSUFFICIENT <40
  - Default: DATA_INSUFFICIENT excluded from TOP list unless explicitly requested

- **Early Opportunity Integration**:
  - `financialDataQuality` field on `EarlyOpportunityIntelligenceResult`
  - New filters: `minFinancialDataQuality`, `financialDataStatus`, `freshnessStatus`, `providerConsistency`
  - Quality report enriches opportunities without replacing existing Early Opportunity Score

- **Turkish Explanations**: deterministic, rule-based, no GPT

- **Caching**: 5-min TTL via CacheService (`financialDataQuality` namespace)

- **Zero Duplicated Logic**: reuses MarketDataOrchestrator, FundamentalIntegrationService, MarketDataValidationService, AIConsensus, CacheService

- **New Endpoints**: `GET /data-quality/:ticker`, `GET /data-quality/:ticker/explain`

- **Tests**: 73 early-opportunity + 104 financial-rules + 71 portfolio-intelligence = 248 new tests GREEN
- **Regression**: 315/319 suites pass (4 pre-existing failures)
- See `docs/R2-037_FINANCIAL_DATA_QUALITY.md`

---

## R2-031 — Data Research Pipeline ✅

- **One unified view** — `GET /portfolio/analysis` returns portfolio score, status
  (ÇOK GÜÇLÜ / GÜÇLÜ / DENGELİ / DİKKAT / YÜKSEK RİSK), score breakdown, risk, positions,
  sector allocation, rebalancing, scenarios, horizons, opportunities, recommendations.
- **Portfolio Intelligence Score (0-100)** — deterministic, weights centralized in
  `portfolio-intelligence.config.ts` and documented.
- **Position analysis** per holding: current price (authoritative market data wins),
  invested capital, unrealized P&L + %, weight, sector weight, elite/early-opportunity/MTF/
  smart-money/catalyst scores, confidence, expected return, entry zone, stop, targets,
  risk/reward, holding period, trend stage, momentum, liquidity, status
  (STRONG_HOLD / HOLD / WATCH / REDUCE / EXIT_REVIEW), Turkish recommendation.
- **Portfolio risk** — total/invested value, unrealized P&L, max/min weight, sector
  concentration, top3/top5 concentration, diversification score, risk score, confidence,
  opportunity score, expected return, downside risk, risk/reward, deterministic Turkish
  warnings (single-stock/sector/low-confidence/low-liquidity exposure).
- **Rebalancing intelligence** — target allocation ranges per position
  (REDUCE_CONCENTRATION / CONSIDER_INCREASE / IN_RANGE) with priority and Turkish reason.
  No trades, no broker, no orders.
- **Scenarios** — Bull/Base/Bear with expected portfolio return, risk, drivers, risks,
  most sensitive positions, explanation. **Horizons** — intraday/swing/position/investment
  best & worst from MTF outputs.
- **Portfolio Opportunities** — improving/deteriorating holdings + new top opportunities
  with fit flags (fitsRisk, increasesConcentration, improvesDiversification, sectorOverlap).
  Consumes Early Opportunity Intelligence; no new detector.
- **Registry** — `PortfolioIntelligenceRegistry` with up-to-50 analysis snapshots and
  snapshot comparison (score/status changes, improving/deteriorating positions).
- **Learning** — connects Self-Learning modifiers + Backtest win-rate; exposes
  recommendation accuracy, position classification accuracy, expected-vs-realized return.
- **Telegram preparation** — service methods for /portfolio, /portfolio-risk,
  /portfolio-opportunities, /portfolio-rebalance, /portfolio-report (no bot in this sprint).
- **Cache** — existing `CacheService` with dedicated `portfolio` namespace, TTL
  centralized in config (`PORTFOLIO_INTELLIGENCE_CACHE_TTL_MS = 30_000`).
- **Dashboard** — Elite Dashboard (apps/web) gained a "Portfolio Intelligence" tab
  (summary cards, score breakdown, holdings table, rebalancing, scenarios, opportunities,
  warnings, AI recommendations) plus `portfolioIntelligence.*` SDK methods.
- **Zero duplicated logic** — per-position the service performs exactly one
  EarlyOpportunityIntelligence fetch (which bundles MTF), one market-data price fetch, and
  one symbol-registry lookup; no duplicate indicator/prediction calculations.
- **Endpoints (12):** GET /portfolio/analysis, /positions, /opportunities, /risk,
  /rebalance, /scenarios, /history, /learning; POST /position, /refresh, /analyze;
  PUT /position/:ticker; DELETE /position/:ticker. Root GET /portfolio list preserved.
- **Tests:** 70 backend unit tests (engine, registry, service, controller) + 8 web
  component tests; full typecheck GREEN; regression suites GREEN.
- See `docs/R2-030_PORTFOLIO_INTELLIGENCE.md`.

## R2-029 — Elite Dashboard & AI Screener ✅

Implemented the professional Elite Dashboard that becomes the main control center of BIST ELITE AI:

- **8 Integrated Sections:**
  1. **Top 10 Early Opportunities** — cards with full intelligence: score, elite score, bullish%, confidence, expected return, risk, holding period, best timeframe, smart money, catalyst, verification, research consensus, entry/stop/targets, risk/reward, Turkish reason
  2. **Market Overview** — BIST100 index, sector heatmap, top gainers/losers, volume leaders, smart money leaders, catalyst leaders
  3. **AI Filter Panel** — professional screener with 20+ filters (Elite Score, Opportunity Score, Bullish%, Confidence, Expected Return, Risk, Holding Period, Liquidity, Sector, Market Cap, Catalyst, Smart Money, Verification, Research Consensus, Volume Spike, Relative Volume, Momentum, Trend, Multi-Timeframe Agreement, Timeframe)
  4. **Watchlist** — favorites, pinned, recent analysis, AI alerts
  5. **Quick Search** — instant comprehensive analysis (prediction, research, verification, catalyst, smart money, entry, targets, backtest, multi-timeframe)
  6. **Timeframe Panel** — 1H, 2H, 4H, 1D, 1W, 1M, 3M, 6M for every stock with bullish%, confidence, expected return, trend, momentum
  7. **Top Lists** — Top Smart Money, Catalyst, Confidence, Expected Return, Elite Score, Opportunity, Risk/Reward
  8. **Dashboard Performance** — AI Accuracy, Prediction Success, Avg Expected Return, Avg Win Rate, Learning Progress

- **7 New REST Endpoints:**
  - `GET /early-opportunities` (with filters) — top 10 early opportunities
  - `GET /early-opportunities/:ticker` — full intelligence for single ticker
  - `GET /early-opportunities/explain/:ticker` — deterministic Turkish explanation
  - `GET /multi-timeframe/:ticker` — full MTF analysis
  - `GET /multi-timeframe/:ticker/explain` — MTF Turkish explanation
  - `GET /market/overview` — BIST100, sector heatmap, gainers/losers, volume, smart money, catalyst leaders
  - `GET /watchlist` — favorites, pinned, recent, AI alerts
  - `GET /search/:ticker` — instant comprehensive single-ticker analysis
  - `GET /top-lists` — 7 ranked leaderboards
  - `GET /dashboard/performance` — AI accuracy, prediction success, avg return, win rate, learning progress

- **Zero Duplicated Logic** — all calculations delegate to existing production engines:
  - Prediction Engine, Multi-Timeframe Opportunity Engine, Early Opportunity Intelligence, Elite Score Engine, Opportunity Engine, Catalyst Engine, Smart Money Engine, Verification AI, Research Hub, Decision Engine, Entry Zone Engine, Portfolio Engine, Market Structure Engine, Backtest Engine, Indicator Engine, Historical Data, Market Data Orchestrator, Symbol Registry

- **Deterministic Turkish Explanations** — no GPT, no randomness, rule-based narratives

- **API Test Coverage** — all endpoints covered, green build

## R2-028 — Multi-Timeframe Opportunity Intelligence ✅

Implemented the multi-timeframe intelligence layer that combines all timeframes into ONE opportunity score:

- **MultiTimeframeOpportunityEngine** — analyzes prediction results across 8 timeframes (1h, 2h, 4h, 1d, 1w, 1M, 3M, 6M) using 9 alignment calculations:
  - Timeframe Agreement, Trend Alignment, Momentum Alignment, Risk Alignment
  - Confidence Alignment, Smart Money Alignment, Catalyst Alignment
  - Macro Alignment, Market Structure Alignment
- **Output:** multiTimeframeScore (0-100), strength (Weak/Medium/Strong/Very Strong), trendStage (Early/Growing/Breakout/Extended/Late), holdingType (Intraday/Swing/Position/Investment), best/worst timeframe, mostBullish/highestConfidence timeframe, riskSummary, expectedReturn, entryZone, stop, target1, target2, deterministic Turkish reasons.
- **Service & Controller:** `MultiTimeframeOpportunityService` + `MultiTimeframeOpportunityController` with endpoints:
  - `GET /multi-timeframe/:ticker` — full MTF analysis
  - `GET /multi-timeframe/:ticker/explain` — deterministic Turkish explanation
- **Zero duplicated logic** — all calculations delegate to existing engines (Prediction, Smart Money, Catalyst, Verification AI, Research Hub, Market Structure, Entry, Backtest, Elite Score, Opportunity, Decision, Market Data, Historical Data, Indicator).
- **Integration:** EarlyOpportunityIntelligenceService now calls MTF service and enriches `EarlyOpportunityIntelligenceResult` with `multiTimeframe` field.

## R2-027 — Early Opportunity Intelligence Engine (CORE) ✅

Implemented the core intelligence layer reusing existing engines:

- **EarlyOpportunityIntelligenceService** — scans ALL BIST symbols, enriches with
  market-cap (best-effort, cached), applies filters, applies self-learning ranking,
  returns TOP 10.
- **Full output per symbol:** early opportunity score, elite score, bullish %, confidence,
  expected return, risk, entry zone, stop, target 1/2, risk/reward, holding period,
  catalyst, smart money, verification status, research consensus, momentum, trend,
  liquidity, timeframe agreement, deterministic Turkish reasons.
- **Filter system:** minEarlyOpportunityScore, minConfidence, minExpectedReturn, maxRisk,
  sector, marketCap{min,max}, liquidity, minSmartMoneyScore, minCatalystScore, minEliteScore.
- **Self-learning:** `SelfLearningService` reads cached predictions + Backtest Engine
  `winRate`, computes a confidence modifier (0.85–1.15), stores it, and improves ranking
  by `score × modifier`. No new scoring system, zero duplicated logic, no network in the
  deterministic cycle.
- **Deterministic explanations** in Turkish (no GPT).
- **Endpoints:** `GET /early-opportunities`, `/early-opportunities/:ticker`,
  `/early-opportunities/explain/:ticker`, `/early-opportunities/learning/run`.

## R2-026 — Early Opportunity Engine ✅ (baseline for R2-027)

- Pure deterministic 0–100 multi-timeframe scorer, scans ALL BIST symbols, returns TOP 10.
- Score components weighted; confidence directly affects score.

## Tests

- `early-opportunity.engine.spec.ts` — 7
- `early-opportunity.service.spec.ts` — 7
- `early-opportunity.intelligence-engine.spec.ts` — 20
- `early-opportunity.intelligence.service.spec.ts` — 12
- `self-learning/self-learning.engine.spec.ts` — 10
- `self-learning/self-learning.service.spec.ts` — 9
- **Total: 68 deterministic tests, all GREEN.**

## Next / TODO

- Wire a nightly scheduler to call `GET /early-opportunities/learning/run` (SchedulerModule
  already exists; add a job).
- Extend self-learning with a real-market recent-direction pass via `MarketDataOrchestrator`
  (currently reuses cached backtest win-rate to stay deterministic & network-free).
- Add OpenAPI/Next.js dashboard integration.
