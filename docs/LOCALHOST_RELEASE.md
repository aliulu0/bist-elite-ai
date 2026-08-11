# BIST Elite AI — Localhost Release Guide (R1-003 FINAL)

This document describes how to install, run, and validate **BIST Elite AI v1.0.0** on a single localhost machine (Windows 10/11, verified 2026-08-02).

## Prerequisites

| Tool | Version (verified) |
|---|---|
| Node.js | >= 20 |
| pnpm | **11.16.0** (via `corepack` or standalone) |
| Google Chrome | current (only needed for the automated E2E sweep) |

PostgreSQL and Redis are **optional** on localhost. Without them the API runs in a fully functional **degraded mode** (see "Known environmental states").

## 1. Install

```powershell
pnpm install          # installs all 9 workspace projects (verified: 1.4s when up-to-date)
```

## 2. Environment

A minimal `.env` already exists at the repo root. For a full template with comments:

```powershell
Copy-Item .env.production .env    # then edit values
```

Minimum required for a working localhost run:

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 3001) |
| `SCHEDULER_ENABLED` | `true` to run the 13 background timers (market open scan, provider health, cache refresh) |
| `JWT_SECRET` | any non-empty value (auth module requires it) |

Market data works out of the box: `yahoo-finance` is the default active provider and needs **no API key**
(`YAHOO_FINANCE_BASE_URL` defaults to `https://query1.finance.yahoo.com/v8/finance/chart`).

## 3. Build & run

```powershell
pnpm build        # turbo build — all workspaces (verified: 5/5 tasks, web 1m08s)
```

Run the API (production mode, compiled dist — recommended for validation):

```powershell
cd apps/api
pnpm build        # compile to dist/
node dist/main    # serves http://localhost:3001
```

Run the web app (Vite dev server):

```powershell
cd apps/web
pnpm dev          # serves http://localhost:5173 (proxies /api and /health -> :3001)
```

Or use the combined dev script from the root: `pnpm dev` (turbo watch mode for API + Vite for web).

## 4. Access

| URL | Purpose |
|---|---|
| `http://localhost:5173` | Web app (dashboard) |
| `http://localhost:5173/health` | Health probe (proxied to API `/health`) |
| `http://localhost:3001/health` | API health probe (live/ready variants: `/health/live`, `/health/ready`) |
| `http://localhost:3001/api` | REST API (all routes under `/api`) |

**Health path note:** the global API prefix is `api`, but the health endpoints intentionally live at
`/health`, `/health/ready`, `/health/live` (outside the prefix) so external probes work without auth.
The Vite proxy forwards both `/api` and `/health`.

## 5. Verified status (R1-003 FINAL, 2026-08-02)

Full details in `docs/QA_RUNTIME_VALIDATION.md`.

| Check | Result |
|---|---|
| API live endpoint sweep | **111/111 GREEN** |
| Web E2E (15 routes, headless sweep) | **GREEN, 0 failures** |
| Dashboard widgets (CDP) | all render real data; health card reports real checks |
| Web tests | 1901/1902 pass (1 flaky timeout, passes in isolation) |
| API provider tests | `yahoo-finance` 26/26, `pipeline-orchestrator` 20/20, health integration 14/14 |
| Build | turbo 5/5; web prod build 13.68s |
| Runtime stress | ~586 requests: 0 crashes, p50 16ms, p95 80ms; rate limiter engages cleanly |
| Performance | 565 requests, 0 failed, avg 68.5ms, p95 89ms, RSS ~107MB stable |

## 6. Known environmental states (expected on a bare localhost)

These are **environmental**, not application defects. They produce the `unhealthy`/`degraded`
status reported by `/health` but do not block the app:

- **Postgres** (`database`): `DATABASE_URL` points at a local `postgres` instance whose credentials
  are not valid on this machine → health component `unhealthy`. Scans/analysis run fully in-memory.
- **Redis** (`redis`): not running → health component `degraded` ("Connection is closed").
- **Provider auth** (fintables, finnhub, mkk, kap, tcmb, investing, google_discovery): no API keys on
  this machine → company-profile enrichment fails; the aggregate/opportunity pipeline therefore stays
  at `no_data` for company fundamentals. `yahoo-finance` remains the sole **healthy** provider and
  supplies all market data (11,178 points across 44 symbols in the last scan).

## 7. Notes for future work

- The web `lint` script (`eslint src`) fails because `eslint` is not installed in `apps/web` — add
  eslint + config, or remove the script. Type safety is enforced by `tsc -b` in the build.
- `providers: ["fintables", "finnhub"]` in the `fetch_market_data` pipeline result is hardcoded and
  does not reflect the active `yahoo-finance` provider — cosmetic telemetry, needs a cleanup.
- The `/api/performance/health` endpoint is subject to the API rate limiter (like all `/api/*`);
  use `/health` for unthrottled probes.
