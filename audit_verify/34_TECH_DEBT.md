# 34. TECH DEBT

> Categorized. IDs match `ACTION_PLAN.md`.

## 34.1 Critical (must fix before release)

| ID | Debt | Root file(s) | Risk |
|---|---|---|---|
| C1 | WS wildcard CORS + no auth | `websocket-gateway.ts:13` | Exposed realtime surface |
| C2 | Auth disabled/no-op; all endpoints public | `auth.service.ts:22-56` | Everything public |
| C3 | SerpAPI unregistered (silent off) | `market-data.config.ts` | Orpheus data source not used |
| C4 | Schema vs migration drift (6 missing tables) | `prisma/schema.prisma` + `init/migration.sql` | Persistence fails at runtime |

## 34.2 High

| ID | Debt | Root | Risk |
|---|---|---|---|
| H1 | TradingView documented complete, zero code | docs | Trust/accuracy; users expect it |
| H2 | Provider duplication (Yahoo 2, Fintables 2+, SerpAPI 3, Finnhub news 2) | provider dirs | Maintenance drift, divergence |
| H3 | Dual market-data stacks; public endpoints bypass orchestrator (D005 violation) | `MarketDataService` vs orchestrator | Priority/health bypassed |
| H4 | ~30 English UI strings (D001 violation) | `apps/web/src` | Localization standard broken |
| H5 | Env hygiene: committed dev/prod env, docker env not ignored, dev-secret fallback | `.env.*`, Dockerfile | Secret leak risk |
| H6 | Python layer not integrated (worker/backend orphaned) | `apps/worker`, `backend/`, compose | Documented feature absent |

## 34.3 Medium

| ID | Debt | Root | Risk |
|---|---|---|---|
| M1 | Duplicate module registration (`PortfolioOptimizationModule` x2) | `app.module.ts` | Double side-effects |
| M2 | Redis declared/unused; cache per-process | config/docs | Scale ceiling |
| M3 | No global exception filter / error envelope | `common/filters/` empty | Inconsistent errors (M4 conflict) |
| M4 | Dual validation (class-validator + Zod) duplication | DTOs + shared | Drift |
| M5 | Root `pnpm test` broken (`@bist-elite/ui` no tests); full suites hang on Windows | `packages/ui`, jest configs | CI gate red |
| M6 | Roadmap duplicate sprint IDs + gap | `MASTER_ROADMAP.md` | Ambiguous references |
| M7 | `config`/`types` packages are empty facades; dead classes (Catalyst*, ScannerController) | packages, research, scanner | Dead weight |
| M8 | Frontend no route lazy-loading; no web page tests; legacy `frontend/` on disk | `apps/web`, `frontend/` | Bundle/perf, confidence |

## 34.4 Low (representative)

| ID | Debt |
|---|---|
| L1 | No coverage thresholds enforced |
| L2 | No e2e (Playwright/Cypress) or pipeline integration test |
| L3 | Two same-named engines (`EliteScoreEngine`, `OpportunityEngine`) in different trees |
| L4 | No prompt registry / LLM cost tracking / eval harness |
| L5 | No migration step in CI/CD; readiness claims Redis dependency |

## 34.5 Overall debt verdict

Debt is concentrated in **security enforcement (C1/C2)**, **provider-layer integrity (C3/H1/H2/H3)**, and **release gates (M5)**. The engine/pipeline code is low-debt and high-quality. Estimate: **~2 focused hardening sprints** before R2-020 backtesting can be trusted on real data.
