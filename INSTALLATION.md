# Installation Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime for API, Web, Telegram |
| pnpm | 9+ | Package manager |
| Python | 3.12+ | Worker runtime |
| Docker | 24+ | Container runtime |
| Docker Compose | v2+ | Service orchestration |
| PostgreSQL | 16 | Database (via Docker) |
| Redis | 7 | Cache (via Docker) |

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/bist-elite-ai/bist-elite-ai.git
cd bist-elite-ai
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
# Copy environment templates
cp .env.example .env.development
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
cp apps/telegram/.env.example apps/telegram/.env
```

Edit `.env.development` with your configuration. Minimum required:

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bist_elite_ai
REDIS_URL=redis://localhost:6379
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

### 5. Initialize Database

```bash
# Generate Prisma client
pnpm --filter @bist-elite/database prisma:generate

# Run migrations
pnpm --filter @bist-elite/database prisma:migrate

# Seed initial data
pnpm --filter @bist-elite/database prisma:seed
```

### 6. Start Development

```bash
# Start all services
pnpm dev
```

## Individual Services

### API Only

```bash
pnpm --filter @bist-elite/api dev
# API running at http://localhost:3001
# Swagger docs at http://localhost:3001/api/docs
```

### Web Only

```bash
pnpm --filter @bist-elite/web dev
# Web running at http://localhost:3000
```

### Worker Only

```bash
cd apps/worker
pip install -r requirements.txt
python main.py
# Worker running at http://localhost:8000
```

### Telegram Only

```bash
pnpm --filter @bist-elite/telegram dev
```

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Available Services

| Service | Dev URL | Description |
|---------|---------|-------------|
| Web | http://localhost:3000 | Next.js frontend |
| API | http://localhost:3001 | NestJS backend |
| API Docs | http://localhost:3001/api/docs | Swagger documentation |
| Worker | http://localhost:8000 | FastAPI worker |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## IDE Setup

### VS Code

Recommended extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- GitLens

Open the project root as a workspace for full TypeScript support.

### JetBrains (WebStorm/IntelliJ)

1. Open project root
2. Enable TypeScript service
3. Configure Prettier as code formatter

## Verification

```bash
# Verify installation
pnpm lint          # Should pass
pnpm test          # Should pass (1366+ tests)
pnpm build         # Should succeed
```

## Next Steps

- Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if you encounter issues
- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the codebase
