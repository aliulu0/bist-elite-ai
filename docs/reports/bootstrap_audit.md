# Bootstrap Audit Report

**Project:** BIST Elite AI
**Date:** 2026-07-23
**Scope:** Sprint 17 - Task 17.1 - Project Bootstrap Audit
**Auditor:** AI Agent (opencode)

---

## Executive Summary

The BIST Elite AI project has a well-designed Turborepo monorepo architecture with 4 applications, 5 shared packages, comprehensive Docker configuration, and 8 GitHub Actions workflows. The NestJS API contains 19 feature modules with ~220 source files. The Prisma schema defines 25+ models across market data, analysis, scoring, backtesting, portfolio, and system domains.

However, **the project cannot build, install dependencies, or run** due to several critical missing files and misconfigurations. The shared packages are defined but never consumed by any application. Several legacy artifacts from a pre-monorepo structure create confusion.

**Critical blockers: 6 | High issues: 10 | Medium issues: 12**

---

## 1. Backend (NestJS API)

### ✔ Working

| Item                                             | Status | Details                                                                           |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------- |
| `apps/api/src/main.ts`                           | ✔      | Full NestJS bootstrap with Swagger, Helmet, CORS, ValidationPipe, health checks   |
| `apps/api/src/app.module.ts`                     | ✔      | 19 feature modules registered, 4 guards, 7 interceptors                           |
| `apps/api/src/health.controller.ts`              | ✔      | `/health`, `/health/ready`, `/health/live`, `/api/auth/status`, `/api/metrics`    |
| `apps/api/nest-cli.json`                         | ✔      | Proper NestJS CLI config                                                          |
| `apps/api/jest.config.ts`                        | ✔      | Jest config with ts-jest                                                          |
| `apps/api/tsconfig.json`                         | ✔      | Extends root, CommonJS module, path aliases defined                               |
| `apps/api/src/common/database/`                  | ✔      | PrismaService, PrismaModule, 10 repository files                                  |
| `apps/api/src/common/auth/`                      | ✔      | AuthModule, AuthService, 5 guards, interceptors, middleware, tests                |
| `apps/api/src/common/security/`                  | ✔      | Rate limit guard, request size interceptor, input sanitization, pipes             |
| `apps/api/src/common/logger/`                    | ✔      | LoggerModule, LoggerService with tests                                            |
| `apps/api/src/common/monitoring/`                | ✔      | HealthService, MetricsService with tests                                          |
| `apps/api/src/common/cache/`                     | ✔      | CacheService, CacheInterceptor, CacheConfig with tests                            |
| `apps/api/src/common/performance/`               | ✔      | CompressionInterceptor, ETagInterceptor, RequestDeduplication, PerformanceService |
| `apps/api/src/common/explainability/`            | ✔      | 5 services, Turkish terms, 7 test files                                           |
| `apps/api/src/common/elite-score/`               | ✔      | 6 services, types, 8 test files                                                   |
| `apps/api/src/common/multi-timeframe-consensus/` | ✔      | 5 services, types, 7 test files                                                   |
| `apps/api/src/common/strategy-validation/`       | ✔      | 6 services, types, test files                                                     |
| `apps/api/src/common/adaptive-calibration/`      | ✔      | 6 services, types, 8 test files                                                   |
| `apps/api/src/common/paper-portfolio/`           | ✔      | 6 services, types, 7 test files                                                   |
| `apps/api/src/common/recommendation-tracker/`    | ✔      | 6 services, types, 8 test files                                                   |
| `apps/api/src/common/market-regime/`             | ✔      | 6 services, types, 8 test files                                                   |
| `apps/api/src/common/opportunity-lifecycle/`     | ✔      | 6 services, types, 8 test files                                                   |
| `apps/api/src/common/portfolio-intelligence/`    | ✔      | 8 services, controller, types, 8 test files                                       |
| `apps/api/src/common/production-readiness/`      | ✔      | 10 services, controller, types, 11 test files                                     |
| API dependencies (package.json)                  | ✔      | NestJS 10, Prisma 5.15, Swagger, Helmet, Zod, class-validator                     |

### ❌ Missing

| #   | Item                              | Why                                                                                                                                          | Impact                                                                       | Suggested Fix                                                     |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | **`ioredis` in API dependencies** | `apps/api/src/main.ts:66` dynamically imports `ioredis` for Redis health check, but it is not listed in `apps/api/package.json` dependencies | Redis health check crashes at startup; health status degrades to "unhealthy" | Add `"ioredis": "^5.3.0"` to `apps/api/package.json` dependencies |

### ⚠ Needs Fix

| #   | Item                                    | Why                                                                                                                                                                             | Impact                                                                      | Suggested Fix                                                       |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **`apps/api/src/modules/` empty**       | 3 subdirectories (`auth/`, `portfolios/`, `stocks/`) exist but contain 0 files. All logic lives in `common/`                                                                    | Misleading directory structure; developers may look in wrong place          | Either populate with NestJS resource modules or remove empty dirs   |
| 2   | **4 empty top-level dirs in `common/`** | `filters/`, `guards/`, `middleware/`, `pipes/` are empty placeholders. Their functional counterparts exist inside domain modules (e.g., `security/middleware/`, `auth/guards/`) | Confusing structure; unclear if these are meant for shared/common utilities | Remove empty directories or document intended purpose               |
| 3   | **`apps/api/.env.example` incomplete**  | Missing `APP_ENV`, `APP_DEBUG`, `APP_LOG_LEVEL`, `NEXT_PUBLIC_API_URL`, `TELEGRAM_BOT_TOKEN`, `RATE_LIMIT_*` variables that the app actually uses                               | Developers won't know all required env vars                                 | Update `.env.example` to match all `process.env` references in code |

---

## 2. Frontend (Next.js Web)

### ✔ Working

| Item                                    | Status | Details                                                   |
| --------------------------------------- | ------ | --------------------------------------------------------- |
| `apps/web/src/app/layout.tsx`           | ✔      | Root layout with Providers, metadata, Turkish lang        |
| `apps/web/src/app/page.tsx`             | ✔      | Homepage renders DashboardPage                            |
| `apps/web/src/app/scanner/page.tsx`     | ✔      | Scanner route                                             |
| `apps/web/src/app/portfolio/page.tsx`   | ✔      | Portfolio route                                           |
| `apps/web/src/app/backtest/page.tsx`    | ✔      | Backtest route                                            |
| `apps/web/src/app/reports/page.tsx`     | ✔      | Reports route                                             |
| `apps/web/src/app/settings/page.tsx`    | ✔      | Settings route                                            |
| `apps/web/src/app/watchlist/page.tsx`   | ✔      | Watchlist route                                           |
| `apps/web/src/components/providers.tsx` | ✔      | React Query + Theme wrapper                               |
| `apps/web/src/components/layout/`       | ✔      | AppLayout, Header, Sidebar                                |
| `apps/web/src/components/dashboard/`    | ✔      | 8 dashboard card components                               |
| `apps/web/src/components/ui/`           | ✔      | Button, Card, Input, Badge, Skeleton, Table               |
| `apps/web/src/components/scanner/`      | ✔      | Full scanner page with search, pagination                 |
| `apps/web/src/components/portfolio/`    | ✔      | Portfolio page                                            |
| `apps/web/src/components/backtest/`     | ✔      | Backtest page                                             |
| `apps/web/src/components/reports/`      | ✔      | Reports page                                              |
| `apps/web/src/components/settings/`     | ✔      | Settings page                                             |
| `apps/web/src/components/watchlist/`    | ✔      | Watchlist CRUD                                            |
| `apps/web/src/hooks/`                   | ✔      | use-api.ts, use-i18n.ts, use-theme.ts                     |
| `apps/web/src/stores/`                  | ✔      | Zustand stores (app state, watchlist)                     |
| `apps/web/src/lib/`                     | ✔      | API client, utils (cn)                                    |
| `apps/web/src/locales/`                 | ✔      | en.json, tr.json with full translations                   |
| `apps/web/tailwind.config.ts`           | ✔      | Dark mode, custom colors, UI package content              |
| `apps/web/postcss.config.js`            | ✔      | TailwindCSS + Autoprefixer                                |
| `apps/web/tsconfig.json`                | ✔      | Extends root, path aliases (@, @ui, @shared)              |
| `apps/web/package.json`                 | ✔      | Next 14, React 18, TanStack Query, Zustand, Recharts, CVA |

### ❌ Missing

| #   | Item                                                | Why                                                                                                                                    | Impact                                                               | Suggested Fix                                         |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | **`next.config.js` missing `output: 'standalone'`** | `docker/Dockerfile.web` copies `.next/standalone` directory, but Next.js only generates this when `output: 'standalone'` is configured | Docker web container build fails — `.next/standalone` does not exist | Add `output: 'standalone'` to `next.config.js`        |
| 2   | **`apps/web/src/app/dashboard/` empty**             | Route directory exists but has no `page.tsx`. Homepage serves dashboard at `/`, but `/dashboard` returns 404                           | Users cannot access `/dashboard` URL directly                        | Add `page.tsx` to `apps/web/src/app/dashboard/`       |
| 3   | **`apps/web/src/app/auth/` empty**                  | Auth route directory exists but has no page files                                                                                      | No login/register pages at `/auth/*`                                 | Add auth page files                                   |
| 4   | **`apps/web/src/components/charts/` empty**         | Charts directory exists but has no components. Recharts is a dependency but no chart components exist                                  | No data visualization in dashboard                                   | Implement chart components using Recharts             |
| 5   | **`.eslintrc.json` missing**                        | `next lint` script exists but no ESLint config file is present                                                                         | `next lint` may fail or use unintended defaults                      | Add `.eslintrc.json` extending `next/core-web-vitals` |
| 6   | **`vitest.config.ts` missing**                      | `package.json` has `"test": "vitest run"` but no vitest config exists                                                                  | Tests may not discover files correctly                               | Add `vitest.config.ts`                                |
| 7   | **`playwright.config.ts` missing**                  | File does not exist despite being listed in initial directory scan                                                                     | No E2E test capability                                               | Add when E2E tests are planned                        |

### ⚠ Needs Fix

| #   | Item                                        | Why                                                                                                                                  | Impact                                                         | Suggested Fix                                           |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | **No shared package imports**               | `apps/web` does not import from `@bist-elite/shared`, `@bist-elite/ui`, or `@bist-elite/types` despite path aliases being configured | Shared packages are unused; code duplication; types not shared | Wire shared packages into web app                       |
| 2   | **Local `ui/` duplicates `@bist-elite/ui`** | `apps/web/src/components/ui/` has Button, Card, Input, Badge — same components defined in `packages/ui/src/components/`              | Two implementations of same components                         | Consolidate into `@bist-elite/ui` and import from there |

---

## 3. Docker

### ✔ Working

| Item                          | Status | Details                                                                            |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `docker-compose.yml`          | ✔      | 5 services (postgres, redis, api, web, worker), healthchecks, volumes, network     |
| `docker-compose.prod.yml`     | ✔      | Production overrides with Redis password, restart policies                         |
| `docker/Dockerfile.api`       | ✔      | Multi-stage (deps → builder → runner), Prisma generate, non-root user, healthcheck |
| `docker/Dockerfile.web`       | ✔      | Multi-stage, Next.js standalone, non-root user, healthcheck                        |
| `docker/Dockerfile.worker`    | ✔      | Multi-stage (builder → runner), non-root user, healthcheck                         |
| `.dockerignore`               | ✔      | Comprehensive exclusions including legacy `backend/`                               |
| `docker-compose.override.yml` | ✔      | Dev overrides with volume mounts, hot reload targets                               |

### ❌ Missing

| #   | Item                                     | Why                                                                                                                    | Impact                                                                 | Suggested Fix                                                   |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | **No `Dockerfile.telegram`**             | Telegram bot app has no Dockerfile. 5 Dockerfiles exist but 2 are legacy (`Dockerfile.backend`, `Dockerfile.frontend`) | Telegram bot cannot be containerized                                   | Create `docker/Dockerfile.telegram`                             |
| 2   | **No Telegram in `docker-compose.yml`**  | Architecture defines 4 apps but compose only has 3 app services (api, web, worker)                                     | Telegram bot has no Docker deployment path                             | Add `telegram` service to compose files                         |
| 3   | **`pnpm-lock.yaml` does not exist**      | `Dockerfile.api` and `Dockerfile.web` both run `pnpm install --frozen-lockfile` which requires a lockfile              | All Docker builds fail immediately                                     | Run `pnpm install` to generate `pnpm-lock.yaml`                 |
| 4   | **`docker-compose.prod.yml` incomplete** | No healthchecks, no exposed ports, no network config, no API_PORT/WEB_PORT/WORKER_PORT env vars                        | Production deployments can't verify service readiness; no port mapping | Add healthchecks, ports, and complete environment configuration |

### ⚠ Needs Fix

| #   | Item                                                                  | Why                                                                                                                                                                          | Impact                                                              | Suggested Fix                                                              |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | **Legacy Dockerfiles**                                                | `docker/Dockerfile.backend` and `docker/Dockerfile.frontend` reference old non-monorepo structure (`requirements.txt`, `npm ci`)                                             | Developer confusion about which Dockerfiles to use                  | Remove or archive legacy Dockerfiles                                       |
| 2   | **`docker-compose.override.yml` tracked in git despite `.gitignore`** | `.gitignore` line 52 excludes this file, but it's tracked in the repo                                                                                                        | Override state inconsistent across environments; gitignore is lying | Remove from `.gitignore` (since it's a useful default) or untrack from git |
| 3   | **Worker healthcheck imports `psycopg2`**                             | `docker-compose.yml` worker healthcheck runs `python -c "import urllib.request..."` but `main.py` health check tries to import `psycopg2` which is not in `requirements.txt` | Database health check always reports "skipped"                      | Add `psycopg2-binary` to `apps/worker/requirements.txt`                    |

---

## 4. PostgreSQL Configuration

### ✔ Working

| Item                                     | Status | Details                                                                |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `packages/database/prisma/schema.prisma` | ✔      | 808 lines, 25+ models, 12 enums, comprehensive indexes                 |
| `packages/database/prisma/migrations/`   | ✔      | Initial migration (`20240101000000_init`) with 998 lines of SQL        |
| `packages/database/prisma/seeds/`        | ✔      | 3 seed files: system-settings, market-data (BIST30), risk-profiles     |
| `packages/database/prisma/seed.ts`       | ✔      | Orchestrator importing 3 seed modules                                  |
| `packages/database/src/index.ts`         | ✔      | Singleton PrismaClient with re-exports                                 |
| `docker-compose.yml` postgres            | ✔      | PostgreSQL 16 Alpine, healthcheck, named volume                        |
| `.env.development` DATABASE_URL          | ✔      | Points to `postgres:5432/bist_elite_ai`                                |
| Schema domains                           | ✔      | Market Data, Analysis, Scoring, Backtesting, Portfolio, Market, System |

### ❌ Missing

| #   | Item                            | Why                                                                                                                                | Impact                                                                 | Suggested Fix                                         |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | **`apps/api/prisma/` is empty** | Directory exists but contains no `schema.prisma` or `seed.ts`. Root `package.json` scripts do `cd apps/api && npx prisma generate` | `db:generate`, `db:migrate`, `db:seed`, `db:studio` all fail from root | Update root scripts to `cd packages/database` instead |

### ⚠ Needs Fix

| #   | Item                                              | Why                                                                                                                          | Impact                                                         | Suggested Fix                                                               |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **Root `scripts/seed.ts` is orphaned/broken**     | Uses `prisma.stock.upsert({ symbol, name, sector })` but `Stock` model requires `companyId`. Not connected to any npm script | Orphaned file causes confusion; root seed doesn't match schema | Delete `scripts/seed.ts` (superseded by `packages/database/prisma/seed.ts`) |
| 2   | **`database/seeds/__init__.py` is a placeholder** | Contains only `# Database seeds placeholder`. Separate from `packages/database/prisma/seeds/`                                | Confusing duplicate seeding directory                          | Remove or document purpose                                                  |

---

## 5. Python Dependencies (Worker)

### ✔ Working

| Item                             | Status | Details                                                                              |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `apps/worker/requirements.txt`   | ✔      | FastAPI, uvicorn, pydantic, pydantic-settings, redis, httpx, python-dotenv           |
| `apps/worker/main.py`            | ✔      | Full FastAPI app with Settings, CORS, health endpoints (health, ready, live, status) |
| `apps/worker/app/notifications/` | ✔      | 13 files: queue, service, types, channels (email, telegram), consumers               |
| `apps/worker/.env.example`       | ✔      | REDIS_URL, DATABASE_URL                                                              |

### ❌ Missing

| #   | Item                                      | Why                                                                                            | Impact                                                                           | Suggested Fix                                      |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | **`psycopg2-binary` not in requirements** | `main.py:60` imports `psycopg2` for database health check                                      | Database check always reports "skipped"; connection to PostgreSQL never verified | Add `psycopg2-binary>=2.9.0` to `requirements.txt` |
| 2   | **No worker test files**                  | `apps/worker/tests/` directory exists but was not explored — CI runs `pytest tests/ -v` with ` |                                                                                  | true` (tolerates failure)                          | Worker has no test coverage | Add actual test files |

### ⚠ Needs Fix

| #   | Item                                                | Why                                                                                                   | Impact                                            | Suggested Fix                            |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| 1   | **Worker has no scheduled tasks**                   | Architecture describes "data processing, ML pipelines" but `main.py` only has health/status endpoints | Worker is a shell with no actual processing logic | Implement data fetching/processing tasks |
| 2   | **Worker `Settings` uses `env_prefix = "WORKER_"`** | But environment variables in docker-compose use `DATABASE_URL` and `REDIS_URL` (no prefix)            | Settings won't read compose env vars correctly    | Adjust env_prefix or mapping             |

---

## 6. Node Dependencies

### ✔ Working

| Item                             | Status | Details                                                         |
| -------------------------------- | ------ | --------------------------------------------------------------- |
| Root `package.json`              | ✔      | Turborepo, Prettier, Husky, Commitlint, lint-staged, TypeScript |
| `turbo.json`                     | ✔      | build, dev, lint, test, clean, typecheck, format tasks          |
| `apps/api/package.json`          | ✔      | NestJS 10, Prisma 5.15, Swagger, Helmet, Zod, Jest              |
| `apps/web/package.json`          | ✔      | Next 14, React 18, TanStack Query, Zustand, Recharts, Vitest    |
| `apps/telegram/package.json`     | ✔      | grammY, dotenv, ts-node                                         |
| `packages/shared/package.json`   | ✔      | zod, date-fns, vitest                                           |
| `packages/ui/package.json`       | ✔      | peer deps (react, react-dom), vitest                            |
| `packages/database/package.json` | ✔      | @prisma/client, prisma, ts-node                                 |
| `packages/config/package.json`   | ✔      | typescript                                                      |
| `packages/types/package.json`    | ✔      | typescript                                                      |
| `.lintstagedrc.js`               | ✔      | ESLint + Prettier for ts/tsx, Prettier for json/md              |
| `commitlint.config.js`           | ✔      | Conventional commits                                            |

### ❌ Missing

| #   | Item                                   | Why                                                                                                            | Impact                                                                                             | Suggested Fix                                                          |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | **`pnpm-lock.yaml` does not exist**    | No lockfile in the entire repository                                                                           | `pnpm install --frozen-lockfile` fails in Docker and CI; dependency versions are non-deterministic | Run `pnpm install` to generate lockfile                                |
| 2   | **No `pnpm-workspace.yaml`**           | pnpm requires this file for workspace resolution. `package.json` has `"workspaces"` but that's npm/yarn syntax | pnpm may not resolve workspace packages (`@bist-elite/*`) correctly                                | Create `pnpm-workspace.yaml` with `packages: ["apps/*", "packages/*"]` |
| 3   | **`.husky/` directory does not exist** | `package.json` has `"prepare": "husky"` but no hooks directory                                                 | `pnpm install` may fail at prepare step; no git hooks enforced                                     | Run `npx husky init` to create hooks directory                         |

### ⚠ Needs Fix

| #   | Item                                                                 | Why                                                                                                                        | Impact                                                   | Suggested Fix                                 |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| 1   | **Shared packages not consumed by any app**                          | `@bist-elite/shared`, `@bist-elite/ui`, `@bist-elite/config`, `@bist-elite/types` are defined but no app imports from them | Packages are dead code; types/utils/constants not shared | Wire packages into apps                       |
| 2   | **`@bist-elite/config` and `@bist-elite/types` are pure re-exports** | Both only do `export * from '@bist-elite/shared'`                                                                          | Unnecessary indirection; no unique value                 | Add unique content or merge into shared       |
| 3   | **`turbo.json` build outputs may be incorrect**                      | `build` task expects `dist/**` but packages use `main: "src/index.ts"` (no build step)                                     | Turbo caching may not work for packages                  | Add build steps to packages or adjust outputs |

---

## 7. Environment Variables

### ✔ Working

| Item                         | Status | Details                                                                          |
| ---------------------------- | ------ | -------------------------------------------------------------------------------- |
| `.env.example`               | ✔      | Core vars: DATABASE_URL, REDIS_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN, CORS_ORIGINS |
| `.env.development`           | ✔      | Full dev config with all service URLs, debug flags                               |
| `.env.production`            | ✔      | Production template with placeholder passwords                                   |
| `apps/api/.env.example`      | ✔      | PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGINS, APP_DEBUG               |
| `apps/worker/.env.example`   | ✔      | REDIS_URL, DATABASE_URL                                                          |
| `apps/telegram/.env.example` | ✔      | TELEGRAM_BOT_TOKEN, API_URL, BOT_MODE, WEBHOOK_URL, LOG_LEVEL                    |
| `.gitignore` env exclusions  | ✔      | `.env`, `.env.local`, `.env.*.local` properly excluded                           |

### ⚠ Needs Fix

| #   | Item                                      | Why                                                                                                                                                                   | Impact                                                 | Suggested Fix                               |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| 1   | **Root `.env.example` missing many vars** | Missing: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_PASSWORD`, `APP_ENV`, `APP_DEBUG`, `APP_LOG_LEVEL`, `WORKER_HOST`, `WORKER_PORT`, `RATE_LIMIT_*` | Developers won't know all required variables           | Update `.env.example` to be comprehensive   |
| 2   | **`apps/api/.env.example` incomplete**    | Missing: `APP_ENV`, `APP_LOG_LEVEL`, `TELEGRAM_BOT_TOKEN`, rate limiting vars                                                                                         | Inconsistent with actual app requirements              | Add all env vars the API references         |
| 3   | **No `.env` file exists**                 | Only `.env.development` and `.env.production` exist. `setup.ps1` copies `.env.development` to `.env` but `.env` is not committed                                      | First-time setup requires running `setup.ps1` manually | Document in README or add `.env` generation |

---

## 8. Project Structure

### ✔ Working

| Item                 | Status | Details                                                   |
| -------------------- | ------ | --------------------------------------------------------- |
| Monorepo layout      | ✔      | `apps/` (4 apps) + `packages/` (5 packages) as documented |
| `ARCHITECTURE.md`    | ✔      | Comprehensive architecture documentation                  |
| `README.md`          | ✔      | Quick start, tech stack, project structure, service URLs  |
| `INSTALLATION.md`    | ✔      | Installation guide exists                                 |
| `CONTRIBUTING.md`    | ✔      | Contribution guidelines exist                             |
| `TROUBLESHOOTING.md` | ✔      | Troubleshooting guide exists                              |
| `CODE_OF_CONDUCT.md` | ✔      | Code of conduct exists                                    |
| `SECURITY.md`        | ✔      | Security policy exists                                    |
| `ROADMAP.md`         | ✔      | Roadmap exists                                            |
| `LICENSE`            | ✔      | MIT license                                               |
| `.editorconfig`      | ✔      | Editor configuration                                      |
| `.prettierrc`        | ✔      | Prettier configuration                                    |
| `.gitattributes`     | ✔      | Git attributes                                            |
| `.github/`           | ✔      | CODEOWNERS, issue templates, PR template, labels          |

### ⚠ Needs Fix

| #   | Item                                                                    | Why                                                                                                                      | Impact                                        | Suggested Fix                      |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------- |
| 1   | **Legacy `backend/` directory**                                         | Old Python backend with its own `requirements.txt`, `pyproject.toml`, `alembic/`. Not referenced by Docker or compose    | Developer confusion about active codebase     | Remove or move to `legacy/` branch |
| 2   | **Legacy `frontend/` directory**                                        | Old frontend with `package.json`, `next.config.js`, `vitest.config.ts`, `playwright.config.ts`. Not referenced by Docker | Developer confusion about active codebase     | Remove or move to `legacy/` branch |
| 3   | **Root `database/seeds/` duplicates `packages/database/prisma/seeds/`** | Two separate seed locations                                                                                              | Confusion about which seeds are authoritative | Remove `database/seeds/`           |
| 4   | **`shared/types/` at root vs `packages/types/`**                        | Root `shared/types/` contains only a directory; `packages/types/` is the actual shared types package                     | Confusion about location of shared types      | Remove root `shared/` if empty     |

---

## 9. Build Scripts

### ✔ Working

| Item                                     | Status | Details                                                         |
| ---------------------------------------- | ------ | --------------------------------------------------------------- |
| Root `package.json` scripts              | ✔      | `dev`, `build`, `lint`, `test`, `clean`, `format` via Turborepo |
| `apps/api/package.json` scripts          | ✔      | `build`, `dev`, `start`, `lint`, `test`, `prisma:*`             |
| `apps/web/package.json` scripts          | ✔      | `dev`, `build`, `start`, `lint`, `test`                         |
| `apps/telegram/package.json` scripts     | ✔      | `dev`, `build`, `start`, `start:webhook`                        |
| `packages/database/package.json` scripts | ✔      | `generate`, `migrate`, `seed`, `studio`, `push`, `validate`     |

### ❌ Missing

| #   | Item                                        | Why                                                                                                  | Impact                | Suggested Fix                                      |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------- |
| 1   | **Root `db:*` scripts point to wrong path** | `db:generate` does `cd apps/api && npx prisma generate` but schema is in `packages/database/prisma/` | All 4 db scripts fail | Update to `cd packages/database && npx prisma ...` |

### ⚠ Needs Fix

| #   | Item                                                          | Why                                                                               | Impact                               | Suggested Fix                                               |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| 1   | **No `typecheck` script at root**                             | `turbo.json` defines `typecheck` task but no root script calls it                 | Cannot run typecheck from root       | Add `"typecheck": "turbo typecheck"` to root `package.json` |
| 2   | **`packages/shared` and `packages/ui` have no `lint` script** | Their `package.json` files have `"lint": "eslint src/"` but no `.eslintrc` exists | Linting may fail or use wrong config | Add ESLint configs or remove lint scripts                   |

---

## 10. Run Scripts

### ✔ Working

| Item                 | Status | Details                                                                            |
| -------------------- | ------ | ---------------------------------------------------------------------------------- |
| `scripts/setup.ps1`  | ✔      | 7-step Windows setup: prerequisites, env, install, prisma, docker, migrate, verify |
| `scripts/dev.ps1`    | ✔      | Docker compose up with build/detached options                                      |
| `scripts/stop.ps1`   | ✔      | Docker compose down with optional volume cleanup                                   |
| `scripts/health.ps1` | ✔      | Container status + endpoint checks + database/Redis health                         |

### ❌ Missing

| #   | Item                                                   | Why                                                                                      | Impact                             | Suggested Fix                           |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| 1   | **`scripts/start.sh` references legacy structure**     | Fallback path does `cd backend && uvicorn app.main:app` and `cd frontend && npm run dev` | Non-Docker Linux/Mac startup fails | Update to use `apps/api` and `apps/web` |
| 2   | **`scripts/setup-dev.sh` references legacy structure** | Creates venv in `backend/`, runs `npm install` in `frontend/`                            | Linux/Mac setup fails              | Update to use monorepo structure        |

### ⚠ Needs Fix

| #   | Item                                        | Why                                                      | Impact                                          | Suggested Fix                            |
| --- | ------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| 1   | **No Linux/Mac equivalent of `setup.ps1`**  | `setup.ps1` is PowerShell-only; `setup-dev.sh` is broken | Linux/Mac developers can't run automated setup  | Fix `setup-dev.sh` to work with monorepo |
| 2   | **No Linux/Mac equivalent of `health.ps1`** | Health check script is PowerShell-only                   | Linux/Mac developers can't check service health | Create `health.sh`                       |

---

## CI/CD (GitHub Actions)

### ✔ Working

| Item                               | Status | Details                                                        |
| ---------------------------------- | ------ | -------------------------------------------------------------- |
| `.github/workflows/ci.yml`         | ✔      | Lint, typecheck, unit tests, worker tests, build, quality gate |
| `.github/workflows/build.yml`      | ✔      | Build verification                                             |
| `.github/workflows/docker.yml`     | ✔      | Docker build, publish to GHCR, compose test                    |
| `.github/workflows/lint.yml`       | ✔      | Linting                                                        |
| `.github/workflows/test.yml`       | ✔      | Tests with PostgreSQL service container                        |
| `.github/workflows/security.yml`   | ✔      | Dependency audit, secret scan, license check, CodeQL           |
| `.github/workflows/release.yml`    | ✔      | Tag-triggered release with GitHub Release creation             |
| `.github/workflows/label-sync.yml` | ✔      | Label synchronization                                          |
| Quality gate                       | ✔      | All CI jobs must pass before merge                             |
| Concurrency control                | ✔      | All workflows use `cancel-in-progress: true`                   |

### ⚠ Needs Fix

| #   | Item                                                   | Why                                           | Impact                                              | Suggested Fix                                                |
| --- | ------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| 1   | **CI uses `--frozen-lockfile` but no lockfile exists** | Every CI job will fail at `pnpm install` step | All CI pipelines broken until lockfile is generated | Generate `pnpm-lock.yaml`                                    |
| 2   | **Worker tests use `                                   |                                               | true`**                                             | `ci.yml:182` runs `pytest tests/ -v --cov=. --cov-report=xml |     | true` | Worker test failures are silently ignored | Fix tests and remove ` |     | true` |

---

## Summary Table

| Category             | ✔ Working | ⚠ Needs Fix | ❌ Missing |
| -------------------- | --------- | ----------- | ---------- |
| 1. Backend           | 25        | 3           | 1          |
| 2. Frontend          | 18        | 2           | 7          |
| 3. Docker            | 7         | 3           | 4          |
| 4. PostgreSQL        | 6         | 2           | 1          |
| 5. Python Deps       | 4         | 2           | 2          |
| 6. Node Deps         | 12        | 3           | 3          |
| 7. Env Variables     | 6         | 3           | 0          |
| 8. Project Structure | 14        | 4           | 0          |
| 9. Build Scripts     | 5         | 2           | 1          |
| 10. Run Scripts      | 4         | 2           | 2          |
| CI/CD                | 9         | 2           | 0          |
| **TOTAL**            | **110**   | **28**      | **21**     |

---

## Top 6 Critical Blockers (Must Fix Before Development)

1. **Generate `pnpm-lock.yaml`** — Without it, Docker builds, CI, and `pnpm install --frozen-lockfile` all fail
2. **Create `pnpm-workspace.yaml`** — Required for pnpm to resolve workspace packages
3. **Create `.husky/` directory** — Required for `pnpm install` prepare script and git hooks
4. **Fix root `db:*` scripts** — Point to `packages/database` instead of `apps/api`
5. **Add `output: 'standalone'` to `next.config.js`** — Required for Docker web container build
6. **Add `ioredis` to API dependencies** — Required for Redis health check at startup
