# LOCAL_DEVELOPMENT.md

# BIST Elite AI - Local Development Guide

## Requirements

- **Node.js** v20+
- **pnpm** v11+ (`corepack enable` to activate)
- **Docker Desktop** (for database, cache, and full stack)

---

## Quick Start

### Option 1: Docker Compose (Full Stack)

One command to start everything:

```bash
docker compose up
```

Or with build:

```bash
docker compose up --build
```

This starts:

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000         |
| API        | http://localhost:3001         |
| API Docs   | http://localhost:3001/api/docs|
| PostgreSQL | localhost:5432               |
| Redis      | localhost:6379               |

The scheduler runs as a separate container (`bist-scheduler`) with no exposed HTTP port.

### Option 2: Hybrid (Docker infra + local apps)

Start only infrastructure:

```bash
docker compose up -d postgres redis
```

Then run the apps locally:

```bash
# Terminal 1: API
cd apps/api
npm run dev

# Terminal 2: Web
cd apps/web
npm run dev

# Terminal 3: Scheduler (optional)
cd apps/api
npm run dev:scheduler
```

### Option 3: pnpm dev (turbo parallel)

```bash
pnpm dev
```

Runs API and Web in parallel via Turborepo.

---

## Available Scripts

### Docker

| Script                 | Description                         |
|------------------------|-------------------------------------|
| `pnpm docker`         | Start all services (detached)       |
| `pnpm docker:build`   | Rebuild and start all services      |
| `pnpm docker:down`    | Stop all services                   |
| `pnpm docker:reset`   | Stop, remove volumes, rebuild       |
| `pnpm docker:logs`    | Tail logs from all services         |

### Prisma

| Script                  | Description                        |
|------------------------|-------------------------------------|
| `pnpm prisma:generate` | Generate Prisma client             |
| `pnpm prisma:migrate`  | Run Prisma migrations (dev)        |
| `pnpm prisma:studio`   | Open Prisma Studio                 |
| `pnpm prisma:push`     | Push schema to database            |

### Development

| Script          | Description                        |
|----------------|-------------------------------------|
| `pnpm dev`     | Start API + Web in parallel        |
| `pnpm dev:api` | Start API only                     |
| `pnpm dev:web` | Start Web only                     |
| `pnpm build`   | Build all packages                 |
| `pnpm test`    | Run all tests                      |
| `pnpm lint`    | Lint all packages                  |

---

## Environment Variables

### File Structure

| File              | Purpose                                  |
|-------------------|------------------------------------------|
| `.env`            | Local development defaults (localhost)   |
| `.env.development`| Docker development (container hostnames) |
| `.env.production` | Production template (fill in secrets)    |
| `.env.docker`     | Docker Compose defaults                  |

### Key Variables

| Variable          | Local Value                           | Docker Value                     |
|-------------------|---------------------------------------|----------------------------------|
| `DATABASE_URL`    | `postgresql://...@localhost:5432/...` | `postgresql://...@postgres:5432/...` |
| `REDIS_URL`       | `redis://localhost:6379/0`            | `redis://redis:6379/0`           |
| `PORT`            | `3001`                                | `3001`                           |
| `CORS_ORIGINS`    | `http://localhost:3000`               | `http://localhost:3000`          |

---

## Database

### Reset Database

With Docker:

```bash
docker compose down -v
docker compose up -d postgres
# Wait for health check, then:
pnpm prisma:push
```

Without Docker:

```bash
# Ensure PostgreSQL is running locally
pnpm prisma:push
```

### Apply Migrations (Production)

```bash
pnpm prisma migrate deploy
```

### Open Prisma Studio

```bash
pnpm prisma:studio
```

---

## Reset Everything

```bash
docker compose down -v --remove-orphans
docker compose up --build
```

This removes all data volumes and rebuilds from scratch.

---

## Common Issues

### Port Already in Use

```bash
# Find process using the port
netstat -ano | findstr :5432

# Kill it (Windows)
taskkill /PID <pid> /F
```

### Database Connection Refused

1. Ensure Docker Desktop is running
2. Check container health: `docker compose ps`
3. Check logs: `docker compose logs postgres`

### Prisma Client Out of Date

```bash
pnpm prisma:generate
```

### Redis Connection Refused

```bash
# Check Redis container
docker compose logs redis

# Test connection
docker compose exec redis redis-cli ping
```

### API Starts Without Database

The API is designed to start gracefully without a database connection. It defers connection until the first query. If the database is unavailable:

- Health check returns `degraded`
- Persistence operations are silently skipped
- Scheduler jobs will fail individual runs but retry

### Frontend Cannot Reach API

In Docker production, nginx proxies `/api/*` to the API container. In local development:

- Vite dev server proxies `/api/*` to `http://localhost:3001`
- Ensure `VITE_API_URL` or `NEXT_PUBLIC_API_URL` points to the API

---

## Troubleshooting

### Full Health Check

```bash
# Check all containers
docker compose ps

# Check API health
curl http://localhost:3001/health

# Check scheduler status
curl http://localhost:3001/api/scheduler

# Check API docs
curl http://localhost:3001/api/docs
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f scheduler
docker compose logs -f web

# Last 100 lines
docker compose logs --tail=100 api
```

### Prisma Issues

```bash
# Regenerate client
cd packages/database
npx prisma generate

# Validate schema
npx prisma validate

# Push schema (dev only)
npx prisma db push
```

---

## Startup Order

```
PostgreSQL
    ↓
Redis
    ↓
API (runs prisma migrate + starts server)
    ↓
Scheduler (waits for API health)
    ↓
Web (waits for API health)
```

Each service has a health check that must pass before dependent services start.

---

## Ports

| Service   | Internal | External | Description          |
|-----------|----------|----------|----------------------|
| PostgreSQL| 5432     | 5432     | Database             |
| Redis     | 6379     | 6379     | Cache                |
| API       | 3001     | 3001     | NestJS backend       |
| Web       | 3000     | 3000     | React/Vite frontend  |
| Scheduler | -        | -        | No HTTP (worker)     |
