# BIST Elite AI

[![CI](https://github.com/your-org/bist-elite-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/bist-elite-ai/actions/workflows/ci.yml)
[![Security](https://github.com/your-org/bist-elite-ai/actions/workflows/security.yml/badge.svg)](https://github.com/your-org/bist-elite-ai/actions/workflows/security.yml)
[![Docker](https://github.com/your-org/bist-elite-ai/actions/workflows/docker.yml/badge.svg)](https://github.com/your-org/bist-elite-ai/actions/workflows/docker.yml)

AI-Powered Early Opportunity Detection Platform for Borsa Istanbul

## Overview

BIST Elite AI is an enterprise-grade platform that detects investment opportunities before they are priced by the market. The system uses AI-driven analysis across multiple dimensions: technical indicators, fundamental analysis, market regime detection, portfolio construction, and risk management. Features an AI Chat Assistant, AI Investment Reports, and AI Portfolio Advisor.

## Architecture

This is a **Turborepo monorepo** with the following structure:

```
bist-elite-ai/
├── apps/
│   ├── web/          # Vite + React frontend (TypeScript, TailwindCSS, shadcn/ui)
│   ├── api/          # NestJS backend (TypeScript, Prisma ORM, PostgreSQL)
│   └── telegram/     # Telegram bot (grammY)
├── packages/
│   ├── shared/       # Shared types, utils, constants, config, logger
│   ├── ui/           # Shared React components (Button, Card, Input, Badge)
│   ├── config/       # Shared configuration
│   ├── types/        # Shared TypeScript types
│   └── database/     # Prisma schema, migrations, client
├── docker/           # Dockerfiles for each service
├── scripts/          # Database seeding, utilities
├── docs/             # Architecture, API, guides
└── .github/          # CI/CD workflows
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite, React 18, TypeScript, TailwindCSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Telegram | grammY |
| Monorepo | Turborepo, pnpm |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Development

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d postgres redis

# Run database migrations
pnpm --filter @bist-elite/database prisma:migrate

# Seed database
pnpm --filter @bist-elite/database prisma:seed

# Start all services in development mode
pnpm dev
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Web | http://localhost:3000 | React frontend (Vite) |
| API | http://localhost:3001 | NestJS backend |
| API Docs | http://localhost:3001/api/docs | Swagger documentation |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## Production Deployment

The production stack uses free cloud services:

| Component | Service | Deployment Method |
|-----------|---------|-----------------|
| Frontend | Cloudflare Pages | Static build from `apps/web` |
| Backend API | Render (Web Service) | Docker (`docker/Dockerfile.api`) |
| Scheduler | Render (Background Worker) | Docker (`docker/Dockerfile.scheduler`) |
| Database | Supabase PostgreSQL | Connection pooler port 6543 |
| Redis | Upstash Redis | TLS on port 6379 |

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete deployment instructions and [docs/GO_LIVE_CHECKLIST.md](./docs/GO_LIVE_CHECKLIST.md) for the go-live checklist.

### Docker

```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up -d --build

# Production mode
docker-compose -f docker-compose.prod.yml up -d
```

## Development

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Build all packages
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @bist-elite/api test
pnpm --filter @bist-elite/web test

# Run with coverage
pnpm --filter @bist-elite/api test:cov
```

## Project Structure

### Apps

- **web**: Dashboard, Scanner, Portfolio, Watchlist, Alerts, AI Assistant, AI Reports, Backtest, Settings
- **api**: REST API with authentication, authorization, rate limiting
- **telegram**: Telegram bot consuming the same API

### Packages

- **shared**: Types, utilities, constants, config, validation, logger
- **ui**: Reusable React components with TailwindCSS
- **config**: Shared configuration management
- **types**: TypeScript type definitions
- **database**: Prisma schema and database client

## Environment Variables

See `.env.example` in root and each app for required environment variables.

## AI Features

The platform includes four AI-powered modules:

| Feature | Description | API Endpoint |
|---------|-------------|-------------|
| **AI Chat Assistant** | Natural language queries about stocks, portfolio, macro, sectors | `POST /ai/chat` |
| **AI Investment Reports** | Structured 7-section investment reports with technical, financial, and opportunity analysis | symbol + timeframe input |
| **AI Portfolio Advisor** | Risk analysis, concentration detection, sector imbalance, position-level recommendations | Part of portfolio page |
| **Portfolio Optimization** | Diversification scoring, sector allocation suggestions, risk contribution analysis | Part of portfolio page |

### AI Chat

Ask questions like:
- "RSI değeri yüksek hisseler hangileri?"
- "Portföyümdeki risk nedir?"
- "Sektör dağılımım nasıl olmalı?"
- "Makro ekonomik görünüm nedir?"
- "Momentumu güçlü hisseler hangileri?"

### AI Reports

Generate investment reports for any BIST symbol:
- Company summary with sector and market cap
- Technical analysis with trend indicators and RSI
- Financial analysis with revenue and P/E
- Opportunity assessment with Elite Score
- Confluence analysis across 4 timeframes
- Macro economic overview
- Buy/Hold/Sell recommendation

## Multi Market Support

Exchange metadata for BIST, NASDAQ, and NYSE including trading hours, timezone, lot sizes, and real-time open/close status.

## Code Splitting

All frontend routes use React.lazy for on-demand loading — initial bundle ~396 kB with 18 separate page chunks.

## Documentation

- [Architecture Bible](./docs/ARCHITECTURE_BIBLE.md) — Complete system architecture
- [Deployment Guide](./docs/DEPLOYMENT.md) — Production deployment instructions
- [Final Release Notes](./docs/FINAL_RELEASE.md) — Version 1.0.0 release documentation

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT
