# Docker Guide

## Architecture

```
┌─────────────────────────────────────────┐
│              Docker Network              │
│                (bridge)                  │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ postgres  │  │  redis   │            │
│  │  :5432    │  │  :6379   │            │
│  └────┬─────┘  └────┬─────┘            │
│       │              │                   │
│  ┌────┴─────┐  ┌────┴─────┐  ┌──────┐ │
│  │   api    │  │  worker  │  │ web  │ │
│  │  :3001   │  │  :8000   │  │:3000 │ │
│  └──────────┘  └──────────┘  └──────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Docker Files

| File | Purpose |
|------|---------|
| `docker/Dockerfile.api` | NestJS API (multi-stage build) |
| `docker/Dockerfile.web` | Next.js frontend (multi-stage build) |
| `docker/Dockerfile.worker` | FastAPI worker (multi-stage build) |
| `docker-compose.yml` | Base compose configuration |
| `docker-compose.override.yml` | Development overrides (auto-merged) |
| `docker-compose.prod.yml` | Production overrides |
| `.dockerignore` | Files excluded from Docker builds |

## Commands

### Start All Services

```powershell
docker compose up -d
```

### Start with Rebuild

```powershell
docker compose up -d --build
```

### View Logs

```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
```

### Stop Services

```powershell
# Keep data
docker compose down

# Remove volumes (delete data)
docker compose down -v
```

### Rebuild Specific Service

```powershell
docker compose build api --no-cache
docker compose up -d api
```

### Access Container Shell

```powershell
docker compose exec api sh
docker compose exec worker bash
docker compose exec postgres psql -U postgres -d bist_elite_ai
docker compose exec redis redis-cli
```

### Database Operations

```powershell
# Run migrations
docker compose exec api npx prisma migrate deploy

# Generate Prisma client
docker compose exec api npx prisma generate

# Open Prisma Studio
docker compose exec api npx prisma studio
```

## Multi-Stage Builds

Each Dockerfile uses multi-stage builds:

1. **deps** - Install dependencies (cached layer)
2. **builder** - Compile/build application
3. **runner** - Minimal production image

This ensures:
- Smaller final images (no dev dependencies)
- Better build caching (deps layer rarely changes)
- Security (non-root user in production)

## Development vs Production

### Development (`docker-compose.yml` + `docker-compose.override.yml`)

- Hot reload enabled
- Volume mounts for live code changes
- Debug logging
- All ports exposed

### Production (`docker-compose.prod.yml`)

- No hot reload
- Environment variables from `.env`
- Health checks enforced
- Restart policies
- No debug logging

## Performance Tips

### Build Cache

```powershell
# First build is slow, subsequent builds use cache
docker compose build

# Force rebuild only when dependencies change
docker compose build --no-cache api
```

### Layer Caching

Dockerfiles are ordered to maximize cache hits:
1. System packages (rarely change)
2. Dependencies (change on package.json update)
3. Source code (changes frequently)

## Troubleshooting

### Container Won't Start

```powershell
# Check logs
docker compose logs <service>

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
```

### Build Fails

```powershell
# Clean build
docker compose build --no-cache

# Check Docker Desktop resources
# Settings > Resources > Advanced
# Increase memory to 4GB+
```

### Database Won't Connect

```powershell
# Check PostgreSQL logs
docker compose logs postgres

# Verify health
docker compose ps postgres

# Reset volumes
docker compose down -v
docker compose up -d postgres
```

### Out of Disk Space

```powershell
# Clean unused images
docker image prune -a

# Clean build cache
docker builder prune -a

# Remove all unused resources
docker system prune -a
```
