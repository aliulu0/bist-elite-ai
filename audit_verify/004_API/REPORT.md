# 004 — API AUDIT

## Verdict: RICH SURFACE (~150+ ENDPOINTS) WITH ROUTE COLLISIONS (70/100)

## Surface Overview

- **48 controllers** (47 + root HealthController), 225 services, 58 DTOs.
- Global prefix `/api`, Swagger at `/api/docs`, port 3001.
- Global guards: RateLimit → Auth → Roles → Permissions.
- Global interceptors: RequestSize → RequestLogging → Metrics → AuditLog → Compression → ETag → RequestDeduplication → Cache.
- ValidationPipe: whitelist, transform, forbidNonWhitelisted, disableErrorMessages in prod.

## Endpoints by Area

| Area | Example routes |
|---|---|
| Health | `/health`, `/health/ready`, `/health/live`, `/metrics` |
| Early Opportunity (CORE) | `/early-opportunities`, `/:ticker`, `/explain/:ticker`, `/learning/run` |
| Multi-Timeframe | `/multi-timeframe/:ticker`, `/:ticker/explain` |
| Market Data | `/market-data/providers/dashboard`, `/:symbol/latest`, `/:symbol/history` |
| Prediction | `/prediction/top`, `/:ticker` |
| Research | `/research/hub/*`, `/research/*`, `/research/intelligence/*` |
| Smart Money / Catalyst | `/smart-money/top`, `/catalyst/top` |
| Elite Score | `/elite-score/{top,daily,weekly,monthly,3m,6m,:ticker}` |
| Portfolio | `/portfolio/*` (metrics, positions, risk, allocation, report) |
| Backtest | `/backtest/run`, `/report/:symbol`, `/strategies`, `/elite-score/:symbol` |
| Scheduler | `/scheduler/*` (jobs, history, enable/disable) |
| Macro | `/macro/*` (regime, central-bank, combined-confidence, dashboard, risk) |
| Dashboard (R2-029) | `/market/overview`, `/watchlist`, `/search/:ticker`, `/top-lists`, `/dashboard/performance` |
| Misc | ai, alerts, analysis, decision, entry, scanner, workflow, event-bus, configuration, performance, providers, pipeline, opportunity-center, tomorrow, multi-market, financial-analysis, production-readiness |

## Critical Findings

1. **5 duplicate `@Controller` prefixes** (both loaded into DI → URL collisions):
   - `portfolio` — portfolio-optimization.module vs portfolio.module
   - `watchlist` — alerts.module (real) vs early-opportunity.module (**STUB** shadows real)
   - `scanner` — scanner.module vs market-scanner (**orphaned, not registered**)
   - `dashboard` — portfolio-intelligence (real) vs early-opportunity (R2-029)
   - `analysis` — analysis-pipeline.module vs analyst.module
2. **Orphaned controller:** `market-scanner/scanner.controller.ts` registered in no module (dead code).
3. **Stub controllers:**
   - `watchlist.controller.ts` (early-opportunity) — in-memory store, comment "replace with database in production".
   - `market-overview.controller.ts` — mock smart-money/catalyst leaders, BIST100 "simple average for demo".
4. 3 e2e spec files in `tests/` are **not wired** into any jest config / CI.
5. Audit-log API endpoint missing → frontend Audit page always fails.
