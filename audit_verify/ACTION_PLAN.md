# ACTION PLAN

Ordered by priority. Each item: Problem → Reason → Impact → Recommended Fix → Effort.

---

## CRITICAL (before any release)

### C1 — WebSocket gateway: wildcard CORS + no authentication
- **Problem:** `modules/websocket-gateway/websocket-gateway.ts:13` sets `cors: { origin: '*', credentials: true }` and connects with no auth.
- **Reason:** Dashboard needs a live feed; security was deferred.
- **Impact:** Any client can connect and receive broadcast data; combined with C2, the whole platform is public.
- **Fix:** Require handshake token (JWT or API key) via `@nestjs/websockets` middleware; restrict CORS to explicit origins; drop `credentials` on wildcard. Align with C2 rollout.
- **Effort:** 1–2 days.

### C2 — Authentication is disabled and a no-op
- **Problem:** `common/auth/auth.service.ts:22-56` — `validateToken()`/`validateApiKey()` return `null`; `AUTH_ENABLED` defaults `false`; no JWT library installed; all 15+ controllers + socket are public.
- **Reason:** Scaffolding (guards/decorators/middleware) was built before the implementation.
- **Impact:** Everything is reachable unauthenticated; the "auth" claim is false.
- **Fix:** Install `@nestjs/jwt`/`jose`; implement real `validateToken` (JWT_SECRET, expiry) and `validateApiKey` against the `ApiKey` table; add bearer-header support to `apps/web/src/lib/sdk.ts` and WS handshake; add auth spec matrix.
- **Effort:** 3–5 days (needs Q1 decision: public MVP vs login).

### C3 — SerpAPI adapter registered silently off
- **Problem:** `modules/market-data/providers/unified/serpapi` adapter exists but is missing from `market-data.config.ts` → `enabled=false`, `priority=99`.
- **Reason:** Config added before the adapter file; never wired.
- **Impact:** Orchestrator claims 8 providers but runs 7; SerpAPI data never used in market data.
- **Fix:** Add the adapter entry to `market-data.config.ts` with correct priority; unit-test orchestrator selection.
- **Effort:** 2–4 hours.

### C4 — Prisma schema ↔ migration drift (6 missing tables)
- **Problem:** `packages/database/prisma/schema.prisma` declares 35 models; the single migration creates 29 tables. Missing: `AIAnalysis`, `MacroIndicator`, `DataProviderStatus`, `ResearchAnalysis`, `ModelProviderConfig`, `Notification`.
- **Reason:** F11-005 persistence models added to schema without a migration.
- **Impact:** Any persistence path for those models fails at runtime with missing-relation/table errors.
- **Fix:** Generate a new migration; add `prisma migrate diff` + `prisma validate` to CI; document `db push` for dev.
- **Effort:** 1–2 days.

---

## HIGH

### H1 — TradingView documented complete, zero code
- **Problem:** `docs/` claim TradingView complete; no adapter/engine exists.
- **Reason:** Roadmap over-claimed before implementation.
- **Impact:** Trust/accuracy; users expect the feature; health monitor can't reflect it.
- **Fix:** Remove the claim now (docs fix) and schedule implementation after R2-020, or implement behind a config flag.
- **Effort:** docs 1 hour; implementation 2–3 days.

### H2 — Provider duplication
- **Problem:** Yahoo 2 classes, Fintables 2+, SerpAPI 3, Finnhub news 2 adapters; same provider name in two registries.
- **Reason:** Legacy + unified stacks grew in parallel.
- **Impact:** Divergent behavior, double maintenance, confused health reporting.
- **Fix:** Pick unified as canonical; convert legacy consumers; consolidate duplicate adapters; one identity per provider.
- **Effort:** 2–3 days.

### H3 — Dual market-data stacks (D005 violation)
- **Problem:** Public `/market-data` endpoints served by legacy `MarketDataService`+Yahoo; orchestrator only powers dashboard/aggregation.
- **Reason:** Migration from legacy incomplete.
- **Impact:** Priority logic (Fintables→…) never applies to real API traffic; health ≠ reality; two cache paths.
- **Fix:** Route public endpoints through `MarketDataOrchestrator`; retire legacy `MarketDataService` for reads; keep fallback only as an adapter.
- **Effort:** 2–4 days.

### H4 — Localization: ~30 English UI strings
- **Problem:** `apps/web/src` has hardcoded English strings; violates D001 (Turkish-only UI).
- **Reason:** Features added after the localization pass.
- **Impact:** Broken product-standard; inconsistent UX.
- **Fix:** Convert to `t()` keys; add missing keys to `tr`/`en` dictionaries; add an eslint i18n rule to prevent regressions.
- **Effort:** 1–2 days.

### H5 — Environment hygiene
- **Problem:** `.env.development`/`.env.production` committed; `.env.docker` not gitignored; production Docker falls back to dev JWT secret.
- **Reason:** Convenience during setup; never cleaned.
- **Impact:** Real secrets could be committed accidentally; deployed images share a known default secret.
- **Fix:** Add all `.env.*` to `.gitignore` except `.env.example`; force-fail boot if `JWT_SECRET` is the dev default in production; move secrets to CI/deploy secrets.
- **Effort:** 2–4 hours.

### H6 — Python layer not integrated
- **Problem:** `apps/worker` (FastAPI) + legacy `backend/` have no package.json, omitted from docker-compose, excluded by `.dockerignore`.
- **Reason:** Worker/backtest/notification intended in Python; never wired into deploy path.
- **Impact:** Documented architecture includes a component that doesn't run anywhere.
- **Fix:** Decide (Q3): if needed, give worker a build/deploy path; otherwise delete `backend/` and document the decision.
- **Effort:** 1–2 days (integration) or 1 hour (deletion).

---

## MEDIUM

### M1 — Duplicate module registration
- **Problem:** `PortfolioOptimizationModule` imported twice in `app.module.ts` (lines 207, 231).
- **Impact:** Double side-effects, confusing DI tree. Fix: remove one import; add a test asserting unique module imports. **Effort:** 30 min.

### M2 — Redis declared, never used
- **Problem:** Infra/docs reference Redis; no client exists; cache is per-process in-memory.
- **Impact:** Multi-replica divergence, no shared invalidation, cold caches on restart.
- **Fix:** Either remove Redis from compose/docs, or implement a `RedisCache` behind `CacheService` interface when scaling. **Effort:** 1 day (remove) / 3 days (implement).

### M3 — No global exception filter / error envelope
- **Problem:** `common/filters/` empty; no `APP_FILTER`; errors are Nest defaults with no codes.
- **Impact:** Inconsistent client errors, no programmatic handling, stack leakage in dev.
- **Fix:** Add a global `HttpExceptionFilter` producing `{ statusCode, code, message, details, traceId }`; thread correlation id. **Effort:** 1 day.

### M4 — Dual validation systems (class-validator + Zod)
- **Problem:** HTTP layer uses class-validator; engines use Zod in `shared`.
- **Impact:** Duplication; a field change needs two edits; SDK types can drift.
- **Fix:** Document one source of truth (recommend Zod → generate DTOs); add a drift test comparing Swagger schema to Zod schemas. **Effort:** 2–3 days.

### M5 — Root `pnpm test` broken
- **Problem:** `@bist-elite/ui` has no test files → `No test files found, exiting with code 1`; full API/web suites hang on Windows when run whole.
- **Impact:** CI test gate is red despite all-green modules.
- **Fix:** Add a smoke spec to `ui`; set `passWithNoTests` scoped or a dedicated root test; investigate the Windows hang (I1, bisect specs). **Effort:** 1 day.

### M6 — Roadmap duplicate sprint IDs + gap
- **Problem:** `MASTER_ROADMAP.md` reuses R2-008/010/011 vs R2-022/023/024; no completed R2-012…018.
- **Impact:** Ambiguous references in docs and PRs.
- **Fix:** Renumber; backfill completed sprints; enforce uniqueness (CI check optional). **Effort:** 1–2 hours.

### M7 — Dead code & empty facade packages
- **Problem:** `packages/config` + `packages/types` are pure re-exports of `shared`; `CatalystEngineService`/`CatalystRepository`/`CatalystRefreshJob` unwired; `ScannerController` `controllers: []`; `common/portfolio-optimization/` unused.
- **Impact:** Confusion, wasted tree, wrong impressions of coverage.
- **Fix:** Delete facades (migrate imports to `@bist-elite/shared`); remove dead classes; add a dead-code lint check. **Effort:** 1 day.

### M8 — Frontend: eager loading, no page tests, legacy app
- **Problem:** All 20 pages eager-loaded; no web component tests; `frontend/` (Next.js) on disk.
- **Impact:** Bundle/perf, low confidence in UI, stale duplicate.
- **Fix:** React.lazy routes; add vitest component tests for 2–3 key pages; delete/move `frontend/` (Q6). **Effort:** 2 days.

---

## LOW (representative)

| ID | Item | Effort |
|---|---|---|
| L1 | Enforce `coverageThresholds` in jest/vitest configs | 2 h |
| L2 | Add e2e (Playwright) + pipeline integration test | 3–5 d |
| L3 | Rename duplicate `EliteScoreEngine`/`OpportunityEngine` classes | 1 d |
| L4 | Central prompt registry + LLM cost tracking + eval harness | 2–3 d |
| L5 | Migration step in CI/CD; fix readiness Redis claim | 2 h |

---

## Suggested sprint order (hardening, then R2-020)

1. **Week 1:** C1+C2 (auth + WS) with Q1 decision → M5 test gate → C4 migration + CI check.
2. **Week 2:** C3 + H2/H3 provider consolidation → H4 localization → H5 env hygiene → M1/M3/M6/M7.
3. **Week 3:** H1/Q2 docs honesty → H6/Q3 Python decision → M2/M4/M8 as capacity allows.
4. **Then R2-020 Backtesting** on a green, authenticated, honest baseline.
