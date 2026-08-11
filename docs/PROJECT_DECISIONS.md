# BIST ELITE AI
# PROJECT DECISIONS
# Architecture Decision Log

Version: 1.0
Last Updated: 2026-08-05

---

# PURPOSE

This document is the permanent record of every important technical decision made in the BIST Elite AI project.

Future AI agents must consult this file before implementing anything.

Every decision is verified against the source code.

Nothing is assumed.

---

# DECISION 001

**Decision ID:** D001

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Localization

**Reason:**

The project targets Turkish investors. All user-visible text must be in Turkish to ensure clarity and usability for the target audience. Financial indicator names (RSI, EMA, MACD, ATR, etc.) are globally recognized technical terms and remain in English.

**Alternatives Considered:**

- English-only UI — Rejected. Target audience is Turkish.
- Mixed Turkish-English UI — Rejected. Inconsistent user experience.
- Turkish with English indicator names — Accepted. Best approach.

**Final Decision:**

Everything shown to the user must be Turkish. Indicator names (RSI, EMA, MACD, ATR, Bollinger Bands, Ichimoku, Fibonacci, etc.) remain English. Only globally accepted financial abbreviations and technical terms remain in English.

**Impact:**

All frontend components, API responses, and dashboard labels must use Turkish. Tests must verify Turkish rendering. English strings in user-facing code are failures.

**Related Sprint:**

R2-003 (Research Intelligence Layer) — Localization standard established.

---

# DECISION 002

**Decision ID:** D002

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Provider Priority

**Reason:**

Market data quality varies by provider. The system must prioritize the highest-quality production data sources first to ensure accurate analysis and reliable signals.

**Alternatives Considered:**

- Alphabetical provider order — Rejected. No quality consideration.
- Random provider order — Rejected. Unreliable results.
- Priority-based provider order — Accepted. Ensures best data first.

**Final Decision:**

Provider Priority Order:

1. Fintables (highest quality production data)
2. TradingView
3. Google Finance
4. Finnhub
5. Yahoo Finance
6. Alpha Vantage

Lower-priority providers serve as fallback when higher-priority providers are unavailable.

**Impact:**

All market data requests follow this priority order. The MarketDataOrchestrator uses this order for provider selection and fallback logic.

**Related Sprint:**

R2-001 (Production Data Activation) — Provider priority established.

---

# DECISION 003

**Decision ID:** D003

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Research Strategy

**Reason:**

Reliance on a single AI source introduces hallucination risk and single-point-of-failure. Multi-source research verification ensures evidence-based conclusions with no hallucinations and no mock data.

**Alternatives Considered:**

- Single AI source (ChatGPT only) — Rejected. Hallucination risk.
- Two AI sources — Rejected. Still vulnerable to correlated errors.
- Multi-source research combining AI + search — Accepted. Most reliable approach.

**Final Decision:**

Research is NOT based on a single AI. Research combines:

- ChatGPT
- Gemini
- Perplexity
- Google Search
- Google News
- Finnhub News
- SerpAPI
- Internal AI Engines

Every conclusion must be evidence-based. No hallucinations. No mock data. No demo implementations.

**Impact:**

All research workflows must aggregate results from multiple sources. The Verification Engine checks for conflicts and confidence levels across sources.

**Related Sprint:**

R2-003 (Research Intelligence Layer) — Multi-source research strategy implemented.

---

# DECISION 004

**Decision ID:** D004

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Indicator Calculation

**Reason:**

Duplicate indicator calculations waste CPU, memory, and introduce inconsistency. A single source of truth for indicator calculations ensures consistency across all modules that depend on technical indicators.

**Alternatives Considered:**

- Each module calculates its own indicators — Rejected. Duplication and inconsistency.
- Indicator calculation in the database — Rejected. Performance bottleneck.
- Centralized IndicatorEngine — Accepted. Single source of truth.

**Final Decision:**

Indicators must be calculated ONLY by IndicatorEngine. Never duplicate calculations. All modules (Analyst, Elite Score, Decision, Opportunity, Scanner, etc.) must use IndicatorEngine for indicator computation.

**Impact:**

The IndicatorEngine is the sole provider of technical indicator calculations. No module may implement its own indicator calculation logic. All indicator results flow through IndicatorEngine.

**Related Sprint:**

R2-003 (Research Intelligence Layer) — IndicatorEngine established as central calculation service.

---

# DECISION 005

**Decision ID:** D005

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Provider Request Routing

**Reason:**

Direct provider calls bypass caching, circuit breaking, rate limiting, and health monitoring. Centralizing all market data requests through a single orchestrator ensures consistent behavior, proper fallback, and observability.

**Alternatives Considered:**

- Direct provider calls from services — Rejected. No caching, no circuit breaking, no observability.
- Provider calls through a middleware layer — Rejected. Still lacks orchestration.
- Centralized MarketDataOrchestrator — Accepted. Full control over request lifecycle.

**Final Decision:**

Every market data request must go through MarketDataOrchestrator. Never call providers directly. The orchestrator manages caching, circuit breaking, rate limiting, fallback logic, and health monitoring.

**Impact:**

All market data access is routed through MarketDataOrchestrator. Direct provider calls are prohibited. This ensures consistent behavior, proper fallback, and full observability of all data requests.

**Related Sprint:**

R2-003 (Research Intelligence Layer) — MarketDataOrchestrator established.

---

# DECISION 006

**Decision ID:** D006

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Portfolio Architecture

**Reason:**

Portfolio logic must build on top of existing analysis engines rather than duplicating their logic. Reusing Analyst, Elite Score, Decision, Opportunity, Tomorrow, Entry, Verification, and Catalyst engines ensures consistency and eliminates redundant calculations.

**Alternatives Considered:**

- Independent portfolio logic — Rejected. Duplicates existing engine logic.
- Portfolio as a thin wrapper around existing engines — Accepted. Clean composition.
- Portfolio with its own calculation engine — Rejected. Inconsistency risk.

**Final Decision:**

Portfolio Engine must reuse Analyst, Elite Score, Decision, Opportunity, Tomorrow, Entry, Verification, and Catalyst engines. No duplicated logic. Portfolio Engine orchestrates existing engines rather than reimplementing their logic.

**Impact:**

Portfolio calculations depend on outputs from existing engines. Changes to those engines automatically propagate to portfolio calculations. No redundant code paths.

**Related Sprint:**

R2-001 (Production Data Activation) — Portfolio module foundation established.

---

# DECISION 007

**Decision ID:** D007

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Backtesting Architecture

**Reason:**

Backtesting must leverage existing data and calculation infrastructure rather than duplicating it. Reusing the Historical Module, Indicator Engine, Strategy Engine, and Portfolio Engine ensures backtest results are consistent with live analysis.

**Alternatives Considered:**

- Independent backtesting logic — Rejected. Duplicates existing infrastructure.
- Backtesting as a standalone system — Rejected. Inconsistency with live analysis.
- Backtesting reusing existing modules — Accepted. Consistent and efficient.

**Final Decision:**

Backtesting Engine must reuse Historical Module, Indicator Engine, Strategy Engine, and Portfolio Engine. No duplicated logic. Backtesting is built on top of existing infrastructure.

**Impact:**

Backtest results are consistent with live analysis because they use the same indicator calculations, strategy logic, and portfolio engine. Changes to underlying engines automatically affect backtesting.

**Related Sprint:**

R2-003 (Research Intelligence Layer) — Backtesting foundation established.

---

# DECISION 008

**Decision ID:** D008

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Architecture

**Reason:**

A well-defined architecture ensures maintainability, scalability, and consistency. The Registry Pattern enables centralized data access. The Provider Pattern abstracts data sources. The Adapter Pattern ensures uniform interfaces. Clean Architecture separates concerns. Dependency Injection enables testability and modularity.

**Alternatives Considered:**

- Monolithic architecture — Rejected. Not maintainable or scalable.
- Microservices architecture — Rejected. Over-engineering for a personal project.
- Modular monolith with clean architecture — Accepted. Best balance of simplicity and structure.

**Final Decision:**

Architecture follows these patterns:

- Single Source of Truth
- Registry Pattern
- Provider Pattern
- Adapter Pattern
- Clean Architecture
- Dependency Injection

**Impact:**

All new modules must follow these patterns. Existing modules are expected to conform. New AI agents must use the Adapter Pattern for integration. All data access goes through Registries. All external services use Adapters.

**Related Sprint:**

R1 (Core Platform) — Architecture patterns established.

---

# DECISION 009

**Decision ID:** D009

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Testing

**Reason:**

Releasing code without verified builds and tests introduces regressions and bugs. Every sprint must produce a fully working, tested, and documented increment.

**Alternatives Considered:**

- Skip tests for speed — Rejected. Introduces regressions.
- Build only, no tests — Rejected. No quality guarantee.
- Tests only, no build — Rejected. Type errors undetected.
- GREEN BUILD + GREEN TESTS + Documentation Update — Accepted. Full quality gate.

**Final Decision:**

Every sprint must end with:

- GREEN BUILD (pnpm build)
- GREEN TESTS (pnpm test)
- Documentation Update (MASTER_ROADMAP.md, AI_HANDOFF.md, PROJECT_STATUS.md, PROJECT_DECISIONS.md)

**Impact:**

No sprint is considered complete unless all three gates pass. This ensures code quality, reliability, and documentation accuracy at every step.

**Related Sprint:**

R1 (Core Platform) — Testing standard established.

---

# DECISION 010

**Decision ID:** D010

**Date:** 2026-08-05

**Status:** Accepted

**Category:** Documentation

**Reason:**

Documentation that drifts from the actual codebase becomes misleading and harmful. Automatic documentation updates at the end of every sprint ensure the project baseline remains accurate and useful.

**Alternatives Considered:**

- Manual documentation updates — Rejected. Inconsistent and easily forgotten.
- Documentation only at major milestones — Rejected. Too infrequent.
- Automatic documentation update at every sprint — Accepted. Keeps docs in sync.

**Final Decision:**

At the end of every sprint, automatically update:

- MASTER_ROADMAP.md
- AI_HANDOFF.md
- PROJECT_STATUS.md
- PROJECT_DECISIONS.md

**Impact:**

All documentation stays synchronized with the actual codebase. Future AI agents and developers always have accurate information. Documentation drift is eliminated.

**Related Sprint:**

R1 (Core Platform) — Documentation standard established.

---

# DECISION 011

**Decision ID:** D011

**Date:** 2026-08-06

**Status:** Accepted

**Category:** Python Layer / H6 (Production Hardening R2-019.1)

**Reason:**

The Enterprise Audit classified the Python layer as fully orphaned (score 20/100). `backend/` (1,088 Python files, 25 engine modules, 208 FastAPI endpoints) had **zero** references in the NestJS API, the React frontend, docker-compose, turbo/pnpm, CI test-job, and `.dockerignore` (which explicitly excludes it). It is dead code that risks rotting and can be confused with the active Node stack. `apps/worker/` (21 Python files) is a **health-check-only FastAPI stub** (only `/health*`), but IS wired into CI (`.github/workflows/ci.yml` `test-worker`), deploy (`deploy/systemd/bist-worker.service`, `deploy/install.sh`, `scripts/start.sh`, `deploy/nginx/.../worker/` route) and must keep running.

**Decision:**

1. **Delete `backend/`** in full. It is fully orphaned, gitignored from Docker, not in turbo, and referenced by no runtime/CI code. The legacy `tests/` Python packages under the repo root are also orphaned Python and are left in place (not run by CI; flagged for Q3 cleanup) to avoid touching the JS spec suite.
2. **Retain `apps/worker/`** unchanged as a FastAPI health/status stub. It is NOT promoted to the turbo build/deploy path (Python is out of scope — DO-NOT-implement). Its CI `test-worker` job and systemd/deploy wiring stay as-is until a Q3 product decision decides whether to give it real work or remove it. No Node integration is added.

**Impact:**

- Removes ~1,088 lines/files of dead Python from the active code tree, eliminating confusion with the NestJS API and stopping the "28+ Python modules" false completeness signal in docs.
- `apps/web` and `apps/api` are untouched; no runtime behavior changes.
- `apps/worker` continues to run as a health endpoint only; deploy pipelines still function.

**Related Sprint:**

R2-019.1 (Production Hardening) — H6.

---

# DECISION 012

**Decision ID:** D012

**Date:** 2026-08-06

**Status:** Accepted

**Category:** Provider Layer / H1 + H2 (Production Hardening R2-019.1)

**Reason:**

The audit found a dual market-data stack (D005 violation) and provider duplication: the public `/market-data` HTTP endpoints were served by the legacy `MarketDataService` → `YahooFinanceProvider` directly (name `'yahoo-finance'`, no circuit breaker / failover), while `MarketDataOrchestrator` powered only the provider dashboard + macro/aggregation. The same Yahoo data was reachable through two paths with different identities.

**Decision:**

1. Route **all public `/market-data` endpoints** (`/:symbol/latest`, `/:symbol/history`, `/timeframes`, `/providers`, `/providers/dashboard`) through `MarketDataOrchestrator` (single unified stack with circuit breaker, caching, priority failover). The legacy `MarketDataController` no longer injects `MarketDataService` or `MarketDataProviderRegistry` for reads.
2. Add `fetchLatestPrice`, `fetchHistoricalData`, and `getSupportedTimeframes` to `MarketDataOrchestrator`, delegating to the unified `YahooUnifiedAdapter` (the single `'yahoo'` identity) — eliminating the separate `'yahoo-finance'` registry path on the public API.
3. Keep `YahooUnifiedAdapter` and `AlphaVantageAdapter` exported from `providers/unified/index.ts` (they were omitted from the barrel — an inconsistency).
4. `MarketDataService` + `MarketDataProviderRegistry` are **retained** for internal engine consumers (scanner, analyst, entry, pipeline, scheduler jobs) — they are not part of the public dual-stack and are out of scope for this hardening sprint (no redesign).

**Impact:**

- Public market-data reads are no longer duplicated across two stacks; provider selection, circuit breaking, caching, and health monitoring now apply to all real API traffic (D005 restored).
- `market-data.controller.spec.ts` (16 previously-failing tests due to missing `MarketDataOrchestrator` DI in the test module) is fixed: it now mocks the orchestrator and is fully green.
- Internal engine consumers are unchanged; the legacy service remains available for them.

**Related Sprint:**

R2-019.1 (Production Hardening) — H1, H2.