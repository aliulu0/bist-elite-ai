# 07. DATA STORES

## 7.1 Datastore inventory

| Store | Tech | Location | Used by | Status |
|---|---|---|---|---|
| Primary DB | PostgreSQL + Prisma | `packages/database` | persistence layer, portfolio module | 35 models, 1 migration |
| In-memory registries | `Map` | `modules/*/registry.ts` | 20+ engines (scanner, decision, opportunity, elite-score, tomorrow, analyst, entry, portfolio-optimization, opportunity-center, scoring) | primary runtime datastore |
| In-memory cache | `Map` + TTL | `common/cache`, `market-data/cache`, `research-cache` | market data, research | TTL eviction |
| Redis | — | — | **not used** | declared in config, no client |
| SQLite | — | `backend/` legacy | legacy Python only | not integrated |
| SQLAlchemy | Python | `backend/` | legacy engines | not integrated |

## 7.2 Prisma schema — `packages/database/prisma/schema.prisma`

- 35 models, 12 enums, PostgreSQL provider.
- Models include: User, Portfolio, PortfolioPosition, PortfolioTransaction, Strategy, Trades, ProviderData, AIAnalysis, EliteScore, BacktestRun, BacktestResult, Signal, AuditLog, ScanHistory, CandidateData, Decision, Opportunity, Alert, ApiKey, Session, Notification, SystemSetting, CatalystEvent, NewsSource, Watchlist, WatchlistItem, RiskProfile, Job, JobRun, MarketData, MacroIndicator, DataProviderStatus, ResearchAnalysis, ModelProviderConfig.
- **Migration gap:** `migrations/20240101000000_init/migration.sql` creates only **29 tables**. Six F11-005 models are **missing from the migration**: `AIAnalysis`, `MacroIndicator`, `DataProviderStatus`, `ResearchAnalysis`, `ModelProviderConfig`, `Notification` (6). `prisma db push` / a new migration is required before these tables exist in the database (C4).

## 7.3 Seeds

- `seeds/system-settings.seed.ts` — app settings.
- `seeds/market-data.seed.ts` — 30 BIST-30 companies.
- `seeds/risk-profiles.seed.ts` — risk profile templates.
- `database/seeds/` at repo root — empty placeholder (`__init__.py` only).

## 7.4 Registries (in-memory datastores)

Uniform pattern: `set / get / getAll / has / count / clear / top` over a `Map`. See `08_REGISTRIES.md`. All engine results live only in memory unless explicitly persisted (persistence module F11-005).

## 7.5 Findings

1. **C4 — migration vs schema drift:** 6 models declared in Prisma schema have no table in the single migration → runtime persistence for those models fails until a migration is created.
2. **Registries are volatile:** engine output lost on restart unless the persistence module runs; the persistence wiring is newer than most engines.
3. **Legacy datastores** (SQLite + SQLAlchemy in `backend/`) are fully separate; no data flows between NestJS and Python.
4. **No Redis** despite config references.
5. **No data versioning / soft-delete conventions** observed; audit-log module provides immutable logging instead.
