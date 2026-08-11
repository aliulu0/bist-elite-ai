# 001 — ARCHITECTURE AUDIT

## Verdict: PRODUCTION-GRADE (85/100)

## Repository Topology

Turborepo + pnpm monorepo with **4 apps, 5 packages**, plus legacy/unmaintained directories.

| Component | Stack | Port | Role | Status |
|---|---|---|---|---|
| `apps/api` | NestJS 10 + Prisma/PostgreSQL | 3001 | Main backend (monolith) | **Production** |
| `apps/web` | Vite + React 19 + React Router 7 + Zustand + TanStack Query + Recharts | 5173 | Canonical frontend SPA | **Production** |
| `apps/worker` | Python FastAPI | 8000 | Health-check-only stub (per D011) | Stub |
| `apps/telegram` | grammY | — | Telegram bot | Working (gaps) |
| `packages/shared, ui, types, database, config` | TS | — | Shared libraries | Used |
| `frontend/` | Next.js 14 (NOT in pnpm workspace) | 3000 | Legacy R2-029 dashboard | **Unmaintained / broken route** |
| `backend/` | Python (deleted per D011) | — | Orphaned | Deleted |

## Architecture Pattern

- **Modular monolith** (NestJS modules) — clean, layered, DI-driven (ADR-058/060).
- **5-stage pipeline** (ARCHITECTURE_BIBLE): Data Collection → Normalization → Opportunity Engine → AI Engine → Portfolio & Dashboard.
- `app.module.ts` imports **~78 modules**; global guards: RateLimit → Auth → Roles → Permissions; global interceptors: RequestSize → RequestLogging → Metrics → AuditLog → Compression → ETag → RequestDeduplication → Cache.
- 5 critical architecture decisions documented (D001–D012) and followed: Turkish UI, provider priority, single IndicatorEngine (D004), MarketDataOrchestrator-only access (D005), composition over duplication (D006/D007).

## Verified Strengths

- Single source of truth for indicators (D004 respected).
- Orchestrator-mediated data access (D005 respected).
- Clean registry + provider + adapter pattern (D008).
- WebSocket pipeline gateway (`/pipeline`, 8 event types).
- Event bus (9 categories, history cap, stats).
- 17 scheduler jobs auto-registered in `onModuleInit`.
- Production hardening: helmet strict CSP, HSTS, validation whitelist, shutdown hooks, non-root containers.

## Verified Weaknesses

- **5 duplicate `@Controller` prefixes** → route collisions (`portfolio`, `watchlist`, `scanner`, `dashboard`, `analysis`).
- 1 orphaned controller (`market-scanner/scanner.controller.ts` — not registered).
- 2 stub controllers (`watchlist` in-memory, `market-overview` partial mock).
- **Dual frontend stack** (`apps/web` vs `frontend/`) — duplication risk; legacy app not verified by build.
- Version drift across tooling: pnpm 9 (CI/deploy) vs pnpm 11.16.0 (root/Docker); Node 20 (CI) vs 22 (Docker).
- `node_modules.bak_corrupt` leftover junk directory.
- MacroDataService still uses `Math.random()` for demo signals (ADR-058 noted).
