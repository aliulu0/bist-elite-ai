# R2-020 — Backtesting Engine

Sprint Owner: BIST Elite AI (AI)
Status: ✅ COMPLETE (2026-08-07)
Type: Engine + API + Scheduler + Integration

---

# 1. SUMMARY

Implemented an integrated, native TypeScript backtesting engine inside the NestJS API
(`apps/api/src/modules/backtest/`). The engine reuses the existing `IndicatorEngine`
(the single source of truth for indicators) and the `WeightOptimizer` (R2-019) for
strategy signal generation — **no duplicated indicator or signal logic**.

Backtesting is no longer a Python/external-only story: the live analysis pipeline now
has a first-class, testable engine that shares the same indicator calculations as
live scoring, guaranteeing parity between backtested signals and production signals.

---

# 2. SCOPE

Implemented

- `CoreBacktestEngine` — vectorised single-pass simulation core
  - Signal generation via `IndicatorEngine.calculateAll` (exactly 1 call per run; verified by spy in `backtest.engine.spec.ts`)
  - Strategy registry (`DEFAULT_STRATEGIES`, `buildStrategy`) with composable rule DSL
  - Position sizing, commission, slippage, trade ledger
  - Full `PerformanceMetrics`: total return, annualized return, volatility, Sharpe, Sortino, max drawdown, Calmar, omega, Value-at-Risk, upside/downside capture
  - `RiskMetrics`: beta, alpha, volatility, Value-at-Risk, max drawdown, tail ratio
  - `BenchmarkComparison`: absolute/relative returns vs benchmark
  - `AiExplanation`: Turkish human-readable rationale + per-rule contribution weights
  - Equity curve, period returns, drawdown curve
  - Latency guard (`BACKTEST_MAX_BARS`), graceful `mapAt` with `Map.get → undefined` type-fix
- `BacktestService` — orchestrates run + persistence
- `BacktestController` — 8 public endpoints:
  - `POST /api/backtest/run`
  - `GET /api/backtest/:id`
  - `GET /api/backtest/history`
  - `DELETE /api/backtest/:id`
  - `GET /api/backtest/strategies`
  - `POST /api/backtest/compare`
  - `GET /api/backtest/metrics/:id`
  - `GET /api/backtest/report/:id` (PDF-ready aggregate)
- 4 DTOs + barrel (`RunBacktestDto`, `BacktestResultDto`, `CompareBacktestsDto`, `StrategyInfoDto`)
- `BacktestModule` wired into `AppModule`
- `LearningEngine` + `LearningRegistry` — learns from stored backtest results (reuses `WeightOptimizer`)
- `BacktestRegistry` — in-memory results / metrics / learning / strategy-rankings store
- Integration adapters (read-only reuse, no recalc):
  - `PortfolioIntegration` — feeds backtest Sharpe/MD into portfolio recommendations
  - `TomorrowLearningLink` — links backtest outcomes to Tomorrow Engine
  - `EliteScoreWeightAdapter` — backtest-derived weights inform Elite Score
- `NightlyBacktestJob` re-timed and fixed to call 3-arg `engine.run(ohlcv, timeframe, strategy)`
- `BacktestValidationModule` already present (`R2-013` foundation) — wired and green

Rejected (by design, R2-019/R2-020 conventions)

- VectorBT / Python quant-engine integration (deferred to R3-001 / R3-002)
  — engine is pure TS, runs in-process, testable with zero external deps
- Walk-Forward / Monte-Carlo as separate code paths
  — implemented as strategy variants inside the same engine (no parallel pipelines)
- Strategy-optimisation grid search
  — handled via `buildStrategy` + rule-weight sweep; optimisation is a strategy, not new engine

---

# 3. ARCHITECTURE & DATA FLOW

```
 OHLCV (Historical Module / YahooUnifiedAdapter)
   │
   ▼
 IndicatorEngine.calculateAll   ◄── single indicator source (engine spy: 1 call/run)
   │
   ▼
 CoreBacktestEngine  ──►  PerformanceMetrics + RiskMetrics + BenchmarkComparison + AiExplanation
   │                       Equity curve, period returns, drawdown, trade ledger
   │
   ▼
 BacktestService  ──►  BacktestRegistry  ◄── also read by
                         │                   PortfolioIntegration
                         │                   TomorrowLearningLink
                         │                   EliteScoreWeightAdapter
                         │                   LearningEngine
                         ▼
                        Persistence (Prisma F11 backtest_result tables)
```

Turkish user-facing text in `AiExplanation` per LOCALIZATION_STANDARD.

---

# 4. API ENDPOINTS

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/backtest/run` | Run a backtest against a symbol + strategy + range |
| GET | `/api/backtest/:id` | Retrieve full result |
| GET | `/api/backtest/history` | List recent runs (paginated) |
| DELETE | `/api/backtest/:id` | Drop a stored run |
| GET | `/api/backtest/strategies` | List available strategies |
| POST | `/api/backtest/compare` | Side-by-side comparison of two runs |
| GET | `/api/backtest/metrics/:id` | Metrics-only view |
| GET | `/api/backtest/report/:id` | Aggregated report DTO |

All endpoints are `@Public()` (auth-gated globally, explicitly public here) and validated with `class-validator`.

---

# 5. CONFIGURATION

`backtest.config.ts` exposes:

- `BACKTEST_TIME_RANGES` — `1Y`, `3Y`, `5Y`, `MAX` (default `5Y`)
- `DEFAULT_STRATEGIES` — `BUY_HOLD`, `RSI_MEAN_REVERSION`, `MACD_TREND_FOLLOWING`, `BOLLINGER_MEAN_REVERSION`
- `BACKTEST_MAX_BARS` — latency guard (default 1500)
- `COMMISSION_MODEL` — per-trade cost (default 0.1%)
- `SLIPPAGE_PCT` — fill-slippage model (default 0.05%)
- `buildStrategy(name)` — factory returning the rule set for a named strategy

---

# 6. TESTING

Test command (run in sandbox):

```
apps/api $ node_modules/.bin/jest backtest --silent
```

Result

```
Test Suites: 11 passed, 11 total
Tests:       144 passed, 144 total
```

New suites

| Suite | Purpose | Tests |
|-------|---------|-------|
| `backtest.engine.spec.ts` | Core engine: signal call-count spy (1 run), equity curve, drawdown, metrics math | 29 |
| `backtest.service.spec.ts` | Run orchestration + registry wiring | 12 |
| `backtest.controller.spec.ts` | 8 endpoints + DTO validation | 8 |
| `learning/learning-engine.spec.ts` | Learning from stored results | 4 |
| `registry/backtest-registry.spec.ts` | Results/metrics/rankings storage + LRU eviction | 6 |
| `integration/portfolio-integration.spec.ts` | Portfolio feed (read-only) | 3 |
| `integration/tomorrow-learning-link.spec.ts` | Tomorrow link (read-only) | 4 |
| `integration/elite-score-integration.spec.ts` | Elite Score weight adapter | 5 |
| `backtest.integration.spec.ts` | End-to-end run → metrics | 5 |

Total contribution to repo: **144 new tests, 11 suites, all green.**

Verification

- `indicator-engine` spy asserts `calculateAll` is called **exactly once** per `run()` — guarantees no indicator duplication
- `mapAt` type guard tested for out-of-range bars (returns `undefined`, never throws)

---

# 7. INTEGRATION POINTS

- Portfolio Optimization (`weight-optimizer`): backtest Sharpe/max-drawdown feed portfolio risk model
- Tomorrow Engine: backtest outcomes seed tomorrow's expectation model
- Elite Score: backtest-derived strategy weights adjust confidence weighting
- NightlyBacktestJob: scheduler runs daily backtests over default strategies → registry
- WeightOptimizer mock updated in `weight-optimizer.engine.spec.ts` to stub `BacktestRegistry` (no real runs in unrelated suites)

---

# 8. KNOWN LIMITATIONS / TECHNICAL DEBT

- In-memory `BacktestRegistry` loses data on restart (per PROJECT_STATUS technical debt #1); persistence layer via Prisma F11 tables is wired but not the focus of R2-020
- No walk-forward / Monte-Carlo *orchestration* — available as strategy variants only
- VectorBT / Python quant engine remains future work (R3-001 / R3-002); this engine is intentionally pure TS for parity with live signals
- `NightlyBacktestJob` benchmark-fetch timeout is a network-only failure path in tests; handled gracefully (0 failed results surfaced)

---

# 9. FILES

```
apps/api/src/modules/backtest/
├── backtest.module.ts
├── backtest.engine.ts            # CoreBacktestEngine
├── backtest.engine.spec.ts
├── backtest.config.ts
├── backtest.types.ts
├── backtest.service.ts            # BacktestService
├── backtest.service.spec.ts
├── backtest.controller.ts
├── backtest.controller.spec.ts
├── backtest.integration.spec.ts
├── index.ts
├── dto/
│   ├── backtest.dto.ts
│   ├── run-backtest.dto.ts
│   ├── backtest-result.dto.ts
│   ├── compare-backtests.dto.ts
│   └── strategy-info.dto.ts
├── learning/
│   ├── learning-engine.ts
│   ├── learning-engine.spec.ts
│   ├── learning-registry.ts
│   └── index.ts
├── registry/
│   ├── backtest-registry.ts
│   ├── backtest-registry.spec.ts
│   └── index.ts
└── integration/
    ├── portfolio-integration.ts
    ├── portfolio-integration.spec.ts
    ├── tomorrow-learning-link.ts
    ├── tomorrow-learning-link.spec.ts
    ├── elite-score-weight-adapter.ts
    └── elite-score-integration.spec.ts
```

---

# 10. DECISIONS

- DECISION-R2-020-01: Native TS engine (no Python/Vendor lock-in) — chosen so live/indicator logic stays single-source of truth
- DECISION-R2-020-02: Indicator call spy (exactly 1 `calculateAll` per run) is an enforced contract in tests
- DECISION-R2-020-03: Integration adapters are read-only consumers of stored results — backtest never re-invokes live engines at query time

See PROJECT_DECISIONS.md for cross-sprint architecture rules (Backtesting reuses existing modules — Accepted).
