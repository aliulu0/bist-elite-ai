# 01. PROJECT STRUCTURE

## 1.1 Top-level layout

```
bist-elite-ai/
├── apps/                      # Monorepo applications (pnpm workspace)
│   ├── api/                   # NestJS 10 backend (the production service)
│   ├── web/                   # React 19 + Vite 6 frontend
│   ├── telegram/              # Telegram bot (NestJS/TSC)
│   └── worker/                # Python FastAPI worker (notification queue + health)
├── packages/                  # Shared libraries
│   ├── config/                # @bist-elite/config — re-export facade of shared
│   ├── database/              # @bist-elite/database — Prisma schema/migrations/seeds
│   ├── shared/                # @bist-elite/shared — types, validation, i18n, utils
│   ├── types/                 # @bist-elite/types — re-export facade of shared
│   └── ui/                    # @bist-elite/ui — 4 React primitives (Button, Card, Input, Badge)
├── docs/                      # 55 top-level files + plans/, recovery/, runtime/, reports/
├── backend/                   # LEGACY Python FastAPI + SQLAlchemy (27 engines) — NOT integrated
├── frontend/                  # LEGACY Next.js 14 app (superseded by apps/web Vite)
├── database/seeds/            # empty placeholder (only __init__.py)
├── shared/types/              # legacy shared types
├── tests/                     # legacy test dirs (backend/, frontend/)
├── deploy/                    # nginx, systemd, logrotate
├── docker/                    # Dockerfiles (Dockerfile.worker, Dockerfile.backend — orphaned)
├── exports/                   # empty
├── scripts/                   # setup, health, smoke, benchmark, validate-docker
├── .plan/                     # planning artifacts
├── .github/                   # CI workflows (deploy, docker, security/trufflehog, label-sync)
├── .husky/                    # git hooks
└── root docs                  # README, ARCHITECTURE (stale), AUDIT_REPORT (stale), *.md guides
```

## 1.2 Backend structure — `apps/api/src`

```
apps/api/src/
├── main.ts                    # HTTP bootstrap (helmet, CORS, validation pipe, swagger, health)
├── main-scheduler.ts          # separate scheduler process (no HTTP)
├── health.controller.ts       # /health, /health/ready, /health/live, /auth/status, /metrics
├── app.module.ts              # 77 imported modules, 4 global guards, 8 global interceptors
├── common/                    # 24 cross-cutting dirs (auth, cache, security, filters(empty), ...)
│   ├── auth/                  # AuthService (disabled by default), guards, decorators, middleware
│   ├── cache/                 # CacheService (in-memory), cache.config, cache.interceptor
│   ├── security/              # guards (rate-limit, api-key), middleware, pipes, interceptors
│   ├── logger/                # AppLoggerService (structured, sensitive-field masking)
│   ├── filters/               # EMPTY — no global exception filter
│   ├── portfolio-optimization/# common variant (NOT wired; modules-level used)
│   └── ...
└── modules/                   # 59 subdirectories (incl. 3 empty: auth/, portfolios/, stocks/)
```

### 1.2.1 Modules with code (56) — all wired into AppModule

`ai-analysis, ai-assistant, ai-elite-score, ai-opportunity, alerts, analysis-pipeline, analyst, audit-log, backtest, backtest-validation, benchmark, candidate, configuration, confluence, contract-validator, decision, elite-score, entry, event-bus, financial-rules, historical-data, indicators, macro, market-data, market-scanner, market-structure, multi-market, openapi, opportunity-center, opportunity-detection, opportunity, performance-monitor, persistence, pipeline-orchestrator, portfolio, portfolio-optimization, provider-health-monitor, ranking, research, rule-analytics, scanner, scheduler, scoring, sdk-generator, smart-money, system-diagnostics, technical-analysis, technical-rules, technical-score, technical-summary, tomorrow, websocket-gateway, weight-optimizer, workflow, workflow-integration, workflow-queue`

### 1.2.2 Empty module dirs (3)

`modules/auth/`, `modules/portfolios/`, `modules/stocks/` — contain no files.

### 1.2.3 Orphan / dead classes

- `modules/research/catalyst-engine.service.ts` (`CatalystEngineService`) — not provided by any module.
- `modules/research/catalyst-repository.service.ts` (`CatalystRepository`) — not provided by any module.
- `modules/scheduler/jobs/catalyst-refresh.job.ts` (`CatalystRefreshJob`) — not in `JOB_CLASSES`.
- `modules/market-scanner/scanner.controller.ts` — `controllers: []` in module.

## 1.3 Frontend structure — `apps/web/src`

```
apps/web/src/
├── main.tsx / App.tsx         # React 19 entry; react-router v7 BrowserRouter
├── lib/                       # constants.ts (API_BASE_URL='/api'), sdk.ts (central fetch client), utils.ts
├── pages/                     # 20 page components (dashboard, scanner, analysis, backtest, portfolio, ...)
├── stores/                    # 17 zustand stores
├── components/                # shared/(15), layout/(4), feature dirs (14), ui/(empty)
├── hooks/                     # useWebSocket.ts (socket.io-client)
├── design/tokens.ts           # design tokens
└── styles/                    # empty
```

## 1.4 Database — `packages/database/prisma`

- `schema.prisma` — 35 models, 12 enums, PostgreSQL.
- `migrations/20240101000000_init/migration.sql` — single migration, 29 tables (6 F11-005 models missing).
- `seeds/` — system-settings, market-data (30 BIST-30 companies), risk-profiles.
- `src/index.ts` — singleton PrismaClient.

## 1.5 Legacy trees (dead or standalone)

- `backend/` — FastAPI + SQLAlchemy, 27 module engines, `backend/docs/ARCHITECTURE_AUDIT.md` self-audit: score 61/100, "ARCHITECTURE FREEZE — REVISION REQUIRED". Not integrated with NestJS.
- `frontend/` — Next.js 14 app; not documented by live docs (README describes Vite app).
- `shared/types/`, `tests/`, `database/seeds/`, `exports/`, `backend/exports/` — empty or legacy placeholders.

## 1.6 Findings

1. **Dual frontend:** `apps/web` (Vite, current) + `frontend/` (Next.js, legacy) both exist on disk.
2. **Dual backend:** `apps/api` (NestJS, current) + `backend/` (Python, legacy) both exist.
3. **Facade packages:** `packages/config` and `packages/types` contain only `export * from '@bist-elite/shared'` — no unique logic.
4. **Empty artifacts:** `exports/`, `database/seeds/`, `common/filters/`, `apps/web/src/styles/`, `packages/ui` has no test files.
5. **No orphan code-modules** — every module with code is imported; only specific classes are dead.
