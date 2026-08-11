# 02. ARCHITECTURE

## 2.1 Overall pattern

**Modular monolith** (per `docs/PROJECT_DECISIONS.md` D008). A single NestJS application (`apps/api`) hosts all domain modules; a separate scheduler process (`main-scheduler.ts`) boots the same `AppModule` and runs the scheduler engine. Frontend is a separate Vite SPA; Telegram is a separate NestJS app; a Python worker app exists but is not wired.

**Data flow (documented in `docs/AI_HANDOFF.md:30-76`):**
`Providers → Research → Verification → Catalyst → Consensus → Elite Score → Portfolio Optimization → Backtesting → Telegram / Dashboard`

## 2.2 Layers

| Layer | Location | Notes |
|---|---|---|
| Presentation | `modules/*/controller.ts` | REST controllers under global prefix `/api` |
| Application | `modules/*/service.ts`, `*-engine.service.ts` | Orchestrates engines/registries |
| Domain | `modules/*/engine.ts`, `*.types.ts`, `*-rules.ts` | Pure engines + typed interfaces |
| Data | `modules/*/registry.ts`, `common/database/prisma.service.ts` | In-memory registries + Prisma |
| Infrastructure | `market-data/providers/*`, `research/providers/*`, `common/cache`, `common/logger` | Providers, cache, logging |

## 2.3 Cross-cutting concerns (globals)

- **Global prefix:** `api` (health routes excluded). `main.ts`
- **Validation:** global `ValidationPipe` — `whitelist:true, transform:true, forbidNonWhitelisted:true`, `disableErrorMessages` in production. `main.ts:52-59`
- **Security headers:** `helmet` with strict CSP + HSTS + COOP/COEP/CORP. `main.ts`
- **CORS:** `securityConfig.cors` from env `CORS_ORIGINS`. `main.ts`
- **Compression:** `compression()` + `CompressionInterceptor`. 
- **Global guards (APP_GUARD):** `RateLimitGuard`, `AuthGuard`, `RolesGuard`, `PermissionsGuard` — but AuthGuard short-circuits when auth is disabled (default). `app.module.ts:238-241`
- **Global interceptors (APP_INTERCEPTOR):** RequestSize, RequestLogging, Metrics, AuditLog, Compression, ETag, RequestDeduplication, Cache. `app.module.ts:242-249`
- **Middleware:** RequestTimeout (408), RequestSize (414), SecurityHeaders, CorrelationId, InputSanitization. `common/security/middleware/*`
- **Swagger:** `/api/docs`, bearer + api-key schemes. `main.ts`

## 2.4 Module wiring

`app.module.ts` imports **77 modules** in ~9 groups (infrastructure, shared/common, providers, core engines, scanner/ranking/scheduler, pipeline, portfolio, alerts/macro, dashboard/API, assistant, multi-market, websocket).

### Architecture findings

1. **Architecture pattern is sound** — clean engine/registry/service/controller separation is consistent across all ~20 audited modules (scanner, decision, opportunity, elite-score, tomorrow, analyst, entry, portfolio-optimization). Engine reuse is genuine: analyst/elite/decision/opportunity/tomorrow all compose the earlier engines rather than re-implementing.
2. **Registry pattern** is uniformly applied (set/get/has/getAll/count/clear/top) with in-memory `Map` backing. See `08_REGISTRIES.md`.
3. **Two parallel market-data architectures** (legacy `MarketDataService`+`YahooFinanceProvider` vs unified orchestrator with 8 adapters) coexist. See `06_MARKET_DATA.md`, `05_PROVIDER_LAYER.md`.
4. **Module registration defect:** `PortfolioOptimizationModule` appears twice in `app.module.ts` (lines 207 and 231).
5. **Global exception filter missing** — `common/filters/` is empty; no `APP_FILTER`.
6. **`common/portfolio-optimization/`** exists but is NOT wired (the `modules/portfolio-optimization/` variant is used) — a leftover duplicate tree.
7. **Auth architecture is scaffolded but inert** — guards/decorators/middleware exist, but `AUTH_ENABLED=false` default makes them pass-through. See `27_SECURITY.md`.
8. **Process split:** API (HTTP, port 3001) and Scheduler (separate process) share the same `AppModule` — acceptable, but the scheduler also instantiates the whole HTTP module tree (wasteful but functional).

## 2.5 Consistency with documented decisions

| Decision | Status |
|---|---|
| D001 Turkish-only UI | Partially violated — ~30 English UI strings remain (`26_LOCALIZATION.md`) |
| D002 Provider priority Fintables→…→Alpha Vantage | Priority map exists but public endpoints bypass the orchestrator (H3) |
| D003 Multi-source research | Implemented (ChatGPT/Gemini/Perplexity/Google/Finnhub/SerpAPI) |
| D004 Only IndicatorEngine calculates indicators | Followed (no duplicate indicator math found) |
| D005 All data through MarketDataOrchestrator | **Violated** — legacy MarketDataService still serves public endpoints |
| D006/D007 Reuse engines in portfolio/backtest | Portfolio-optimization reuses engines; backtesting not yet implemented |
| D008 Modular monolith | Followed |
| D009 GREEN build+tests each sprint | Build GREEN; full test run not reproducible on Windows (M5) |
| D010 Auto-update docs | Followed for 4 live docs, but roadmap has duplicate sprint IDs |

## 2.6 Architecture score rationale

Strong separation of concerns, consistent engine/registry/service pattern, real engine reuse, good module boundaries, and genuinely typed interfaces. Deductions for: dual data stacks (D005 violation), dead/orphan code, duplicate module registration, missing global exception filter, inert auth, and the legacy trees coexisting undocumented.
