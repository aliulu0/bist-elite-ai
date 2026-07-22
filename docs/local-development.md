# Local Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | https://nodejs.org/ |
| pnpm | 9+ | `corepack enable` |
| Python | 3.12+ | https://python.org/ |
| Docker Desktop | Latest | https://docker.com/products/docker-desktop |

## Quick Start (Docker)

```powershell
# 1. Setup (first time only)
.\scripts\setup.ps1

# 2. Start all services
.\scripts\dev.ps1

# 3. Check health
.\scripts\health.ps1
```

## Quick Start (Without Docker)

```powershell
# 1. Install Node.js dependencies
pnpm install

# 2. Start PostgreSQL and Redis (must be installed locally)
# PostgreSQL: localhost:5432
# Redis: localhost:6379

# 3. Setup API
Copy-Item .env.development apps\api\.env
Push-Location apps\api
npx prisma generate
npx prisma migrate dev
npm run dev
Pop-Location

# 4. Setup Web (new terminal)
Push-Location apps\web
npm run dev
Pop-Location

# 5. Setup Worker (new terminal)
Push-Location apps\worker
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Pop-Location
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `.\scripts\setup.ps1` | First-time setup (install deps, start infra) |
| `.\scripts\dev.ps1` | Start all services |
| `.\scripts\dev.ps1 -Build` | Rebuild containers and start |
| `.\scripts\dev.ps1 -Detached` | Start in background |
| `.\scripts\stop.ps1` | Stop all services (keep data) |
| `.\scripts\stop.ps1 -Clean` | Stop all services and remove data |
| `.\scripts\health.ps1` | Check all service health |

## URLs

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| API Docs | http://localhost:3001/api/docs |
| Worker | http://localhost:8000 |
| Worker Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Project Structure

```
bist-elite-ai/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   ├── worker/       # FastAPI background worker
│   └── telegram/     # Telegram bot
├── packages/
│   ├── shared/       # Shared types, utils, constants
│   ├── ui/           # Shared React components
│   ├── database/     # Prisma schema
│   ├── config/       # Shared configuration
│   └── types/        # Shared TypeScript types
├── docker/           # Dockerfiles
├── scripts/          # Development scripts
├── docs/             # Documentation
└── backend/          # Legacy Python backend
```

## Development Workflow

### Making API Changes

1. Edit files in `apps/api/src/`
2. API auto-restarts (NestJS watch mode)
3. Test at http://localhost:3001/api/docs

### Making Frontend Changes

1. Edit files in `apps/web/src/`
2. Browser auto-reloads (Next.js HMR)
3. See changes at http://localhost:3000

### Making Worker Changes

1. Edit files in `apps/worker/`
2. Worker auto-restarts (uvicorn --reload)
3. Check health at http://localhost:8000/health

### Database Changes

1. Edit `packages/database/prisma/schema.prisma`
2. Run: `cd apps/api && npx prisma migrate dev --name description`
3. Run: `cd apps/api && npx prisma generate`

## Troubleshooting

### Port Already in Use

```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process
Stop-Process -Id <PID> -Force
```

### Docker Container Won't Start

```powershell
# Check logs
docker compose logs api
docker compose logs worker

# Restart specific service
docker compose restart api
```

### Database Connection Failed

```powershell
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Reset database
.\scripts\stop.ps1 -Clean
.\scripts\setup.ps1
```

### Prisma Generate Failed

```powershell
# Regenerate client
cd apps\api
npx prisma generate
```
