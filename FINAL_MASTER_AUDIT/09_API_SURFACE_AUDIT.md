# 09 — API SURFACE AUDIT

> Controller/route inventory (from code; not runnable live due to compile break).

## Overview

- 65 API modules; NestJS controllers with DTOs, validation (class-validator pattern), Swagger/openapi module present (`openapi`), `sdk-generator` present.

## Non-exhaustive route map (key surfaces)

| Area | Routes |
|---|---|
| Early Opportunities | `GET /early-opportunities`, `/early-opportunities/:ticker`, `/early-opportunities/explain/:ticker`, `/ai-early-opportunity/decision/:ticker` |
| Scanner | `GET /scanner/*` (market-scanner) |
| Multi-Timeframe | `GET /multi-timeframe/:ticker`, `/multi-timeframe/:ticker/explain` or `/mtf/*` |
| Market Data | `GET /market-data/latest/:symbol`, `/market-data/history/*`, `/market-data/providers/configuration`, `/market-data/timeframes` |
| Portfolio | `GET/POST/PUT/DELETE /portfolio/*` (12 endpoints) |
| Backtest | `/backtest/*` + R2-046 `/backtest/early-opportunity/*` (10 endpoints) |
| Signals | `GET /signals/top`, `/signals/:ticker`, `/signals/:ticker/explain` |
| Data Quality | `GET /data-quality/:ticker`, `/data-quality/:ticker/explain` |
| Research | `/data-research/*` (15 endpoints claimed) |
| Scheduler | `/scheduler/*` |
| Performance | `GET /performance/cache`, `/indicators`, `/dedup`, `/summary` |
| WebSocket | `websocket-gateway` module |

## Health

- Old hand-off docs mention `/health` 200; `system-diagnostics` module exists.

## Truth check

- Routes exist in code; **none verified live** (API won't boot).
- DTO validation and `@Public()` guards observed in `performance-metrics` — pattern consistent.

## Verdict

- API surface is **broad and coherent**; no route-level defects found in code.
- Verified live: `NO` (compile break).