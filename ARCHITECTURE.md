# Architecture

## Overview

BIST Elite AI is a **Turborepo monorepo** with 4 applications and 5 shared packages, designed for AI-powered early opportunity detection on Borsa Istanbul.

## High-Level Architecture

```
                    ┌─────────────┐
                    │   Next.js   │
                    │   Web App   │
                    └──────┬──────┘
                           │ REST API
                    ┌──────▼──────┐
                    │   NestJS    │
                    │     API     │◄──── grammY Bot
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │ PostgreSQL │ │ Redis │ │  Python   │
        │   Database │ │ Cache │ │  Worker   │
        └───────────┘ └───────┘ └───────────┘
```

## Applications

### `apps/web` — Frontend

- **Stack**: Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui
- **Features**: Dashboard, Scanner, Portfolio, Backtest, Reports, Settings
- **Port**: 3000

### `apps/api` — Backend API

- **Stack**: NestJS 10, TypeScript, Prisma ORM, PostgreSQL
- **Features**: REST API, Authentication, Rate Limiting, Swagger docs
- **Port**: 3001
- **Modules**: 19 feature modules covering scoring, analysis, and operations

### `apps/worker` — Background Worker

- **Stack**: Python 3.12, FastAPI
- **Features**: Data processing, ML pipelines, indicator calculations
- **Port**: 8000

### `apps/telegram` — Telegram Bot

- **Stack**: grammY (TypeScript)
- **Features**: Bot interface consuming the same backend API
- **No business logic** — purely a presentation layer

## Shared Packages

### `packages/shared`

Types, utilities, constants, configuration, validation schemas, and logging shared across all apps.

### `packages/ui`

Reusable React components (Button, Card, Input, Badge) with TailwindCSS.

### `packages/config`

Shared configuration management for environment variables and feature flags.

### `packages/types`

Shared TypeScript type definitions.

### `packages/database`

Prisma schema, migrations, and database client.

## API Module Architecture

The NestJS API follows a **feature-based module** pattern with 19 modules:

### Core Infrastructure
- `PrismaModule` — Database access
- `AuthModule` — Authentication, RBAC, guards
- `LoggerModule` — Structured logging with sensitive data masking
- `MonitoringModule` — Health checks, metrics
- `SecurityModule` — Rate limiting, input sanitization
- `CacheModule` — LRU cache with namespaces
- `PerformanceModule` — Compression, deduplication, memory monitoring

### Analysis Engines
- `ExplainabilityModule` — AI explanation generation (Turkish)
- `EliteScoreModule` — Multi-factor opportunity scoring
- `MultiTimeframeConsensusModule` — Cross-timeframe analysis
- `StrategyValidationModule` — Backtest-based validation
- `AdaptiveCalibrationModule` — Self-tuning score calibration

### Business Modules
- `PaperPortfolioModule` — Simulated portfolio management
- `RecommendationTrackerModule` — Performance tracking
- `MarketRegimeModule` — Market condition detection
- `OpportunityLifecycleModule` — Opportunity stage tracking
- `PortfolioIntelligenceModule` — Dashboard data aggregation
- `ProductionReadinessModule` — Deployment validation

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic isolation
- **Dependency Injection**: NestJS IoC container
- **Global Modules**: Monitoring, logging available app-wide
- **Interceptor Pattern**: Request/response transformation
- **Guard Pattern**: Authentication, authorization, rate limiting

## Data Flow

```
Market Data → Worker → PostgreSQL → API → Web/Bot
                    ↘ Redis Cache ↗
```

1. **Worker** fetches and processes market data from BIST APIs
2. **PostgreSQL** stores historical data, scores, recommendations
3. **Redis** caches indicators, scores, market data (TTL-based)
4. **API** serves computed analyses via REST endpoints
5. **Web** displays dashboards, charts, portfolios
6. **Telegram** provides mobile notifications and queries

## Key Design Decisions

1. **Monorepo**: Shared types and utilities across all apps
2. **API-First**: Telegram bot consumes same API as web app
3. **Turkish Explainability**: All AI explanations in professional Turkish
4. **Backtest-First**: Every strategy validated against historical data
5. **Configuration-Driven**: Zero hardcoded thresholds or parameters
6. **Modular Architecture**: Each engine is an independent, testable module

## Directory Structure

```
bist-elite-ai/
├── apps/
│   ├── api/              # NestJS backend
│   │   └── src/
│   │       ├── common/   # 19 feature modules
│   │       └── modules/  # Additional modules
│   ├── web/              # Next.js frontend
│   ├── worker/           # Python FastAPI
│   └── telegram/         # grammY bot
├── packages/
│   ├── shared/           # Shared utilities
│   ├── ui/               # React components
│   ├── config/           # Configuration
│   ├── types/            # TypeScript types
│   └── database/         # Prisma schema
├── docker/               # Dockerfiles
├── scripts/              # Setup utilities
├── docs/                 # Documentation
└── .github/              # CI/CD workflows
```
