# BIST Elite AI

[![CI](https://github.com/your-org/bist-elite-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/bist-elite-ai/actions/workflows/ci.yml)
[![Security](https://github.com/your-org/bist-elite-ai/actions/workflows/security.yml/badge.svg)](https://github.com/your-org/bist-elite-ai/actions/workflows/security.yml)
[![Docker](https://github.com/your-org/bist-elite-ai/actions/workflows/docker.yml/badge.svg)](https://github.com/your-org/bist-elite-ai/actions/workflows/docker.yml)

AI-Powered Early Opportunity Detection Platform for Borsa Istanbul

## Overview

BIST Elite AI is an enterprise-grade platform that detects investment opportunities before they are priced by the market. The system uses AI-driven analysis across multiple dimensions: technical indicators, fundamental analysis, market regime detection, portfolio construction, and risk management.

## Architecture

This is a **Turborepo monorepo** with the following structure:

```
bist-elite-ai/
├── apps/
│   ├── web/          # Next.js 14 frontend (TypeScript, TailwindCSS, shadcn/ui)
│   ├── api/          # NestJS backend (TypeScript, Prisma ORM, PostgreSQL)
│   ├── worker/       # Python FastAPI worker (data processing, ML pipelines)
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
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Worker | Python 3.12, FastAPI |
| Telegram | grammY |
| Monorepo | Turborepo, pnpm |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Python 3.12+

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
| Web | http://localhost:3000 | Next.js frontend |
| API | http://localhost:3001 | NestJS backend |
| API Docs | http://localhost:3001/api/docs | Swagger documentation |
| Worker | http://localhost:8000 | FastAPI worker |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

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

- **web**: Dashboard, Scanner, Portfolio, Backtest, Reports, Settings
- **api**: REST API with authentication, authorization, rate limiting
- **worker**: Background data processing, ML model inference
- **telegram**: Telegram bot consuming the same API

### Packages

- **shared**: Types, utilities, constants, config, validation, logger
- **ui**: Reusable React components with TailwindCSS
- **config**: Shared configuration management
- **types**: TypeScript type definitions
- **database**: Prisma schema and database client

## Environment Variables

See `.env.example` in root and each app for required environment variables.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT
