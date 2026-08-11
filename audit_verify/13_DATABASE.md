# 13. DATABASE

## 13.1 Stack

- **Provider:** PostgreSQL
- **ORM:** Prisma (`packages/database`)
- **Client:** `PrismaService` (singleton) + `src/index.ts` `PrismaClient` export.
- **Migrations:** single migration `20240101000000_init`.

## 13.2 Schema — `packages/database/prisma/schema.prisma`

- **35 models**, 12 enums.
- Model families:
  - **Auth/identity:** User, ApiKey, Session
  - **Portfolio:** Portfolio, PortfolioPosition, PortfolioTransaction, RiskProfile, Watchlist, WatchlistItem
  - **Analysis:** AIAnalysis, ResearchAnalysis, EliteScore, Decision, Opportunity, Signal, CandidateData
  - **Market data:** MarketData, ProviderData, DataProviderStatus, MacroIndicator
  - **Backtest:** BacktestRun, BacktestResult
  - **Ops:** AuditLog, ScanHistory, Alert, Notification, CatalystEvent, NewsSource, SystemSetting, Job, JobRun, Strategy, Trades, ModelProviderConfig

## 13.3 Migration drift (C4)

- `migrations/20240101000000_init/migration.sql` creates **29 tables**.
- **Six models have no table:** `AIAnalysis`, `MacroIndicator`, `DataProviderStatus`, `ResearchAnalysis`, `ModelProviderConfig`, `Notification`.
- Any code path that persists those models (persistence module F11-005, notifications, provider status) will fail at runtime with a missing-relation/table error until a new migration is generated.
- This is a **release blocker for the persistence feature** — the ORM schema and DB are out of sync.

## 13.4 Seeds

- `system-settings` (app settings), `market-data` (30 BIST-30 companies), `risk-profiles` (templates).
- Root `database/seeds/` is an empty placeholder.

## 13.5 Findings

1. **C4 — schema/migration drift (6 missing tables).**
2. **Single monolith migration** — no incremental migration history; teams cannot evolve schema without a second migration.
3. **No index strategy documented** for hot query paths (e.g., ticker lookups on MarketData/Decision).
4. **Soft-delete / audit columns** not uniform; AuditLog module provides separate immutable logging.
5. **Enum coverage:** 12 enums for market direction, timeframe, provider status, etc. — consistent.
6. **Legacy SQLite + SQLAlchemy** in `backend/` duplicate domain storage concepts outside Prisma.

## 13.6 Verdict

Schema design is reasonable and models the domain well; the single release blocker is the migration gap (C4). Secondary: no migration history, legacy datastore drift.
