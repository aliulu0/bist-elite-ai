# Troubleshooting Guide

## Common Issues

### Installation

#### `pnpm install` fails

```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm store prune
pnpm install
```

#### Prisma client not generated

```bash
pnpm --filter @bist-elite/database prisma:generate
```

#### TypeScript errors after install

```bash
# Regenerate all generated files
pnpm build
```

### Database

#### Connection refused

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### Migration conflicts

```bash
# Reset database (destructive)
pnpm --filter @bist-elite/database prisma:migrate -- --reset

# Re-seed
pnpm --filter @bist-elite/database prisma:seed
```

#### `relation does not exist` error

Run migrations to create missing tables:

```bash
pnpm --filter @bist-elite/database prisma:migrate
```

### Redis

#### Connection refused

```bash
# Check Redis status
docker-compose ps redis

# Restart Redis
docker-compose restart redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### API

#### Port 3001 already in use

```bash
# Find and kill process on port 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use a different port
PORT=3002 pnpm --filter @bist-elite/api dev
```

#### Swagger docs not loading

Ensure the API is running and access http://localhost:3001/api/docs.

#### Health check failing

```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
curl http://localhost:3001/health/live
```

### Web

#### Port 3000 already in use

```bash
PORT=3001 pnpm --filter @bist-elite/web dev
```

#### Build errors

```bash
# Clear Next.js cache
rm -rf apps/web/.next
pnpm --filter @bist-elite/web build
```

### Worker

#### Python module not found

```bash
cd apps/worker
pip install -r requirements.txt
```

#### Port 8000 already in use

```bash
PORT=8001 python main.py
```

### Docker

#### Build fails

```bash
# Clear Docker cache
docker system prune -f

# Rebuild without cache
docker-compose build --no-cache
```

#### Container exits immediately

```bash
# Check container logs
docker-compose logs <service-name>

# Common fix: ensure env vars are set
cp .env.example .env
```

### Testing

#### Tests fail with module not found

```bash
# Ensure Prisma client is generated
pnpm --filter @bist-elite/database prisma:generate

# Run tests
pnpm test
```

#### `jest` worker process exit

This is usually a pre-existing NestJS DI issue in module-level tests. Individual service tests should pass:

```bash
# Run specific test suite
npx jest --config jest.config.ts --testPathPattern "common/production-readiness"
```

### Performance

#### Slow API responses

1. Check Redis is running: `docker-compose ps redis`
2. Check database connections: `curl http://localhost:3001/health`
3. Check memory usage: `curl http://localhost:3001/api/metrics`

#### High memory usage

The API includes a `MemoryMonitorService`. Check metrics endpoint for heap usage trends.

## Getting Help

1. Check the [docs/](./docs/) directory for detailed guides
2. Search [GitHub Issues](https://github.com/bist-elite-ai/bist-elite-ai/issues)
3. Open a new issue with the troubleshooting template
4. Check [GitHub Discussions](https://github.com/bist-elite-ai/bist-elite-ai/discussions)

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment mode |
| `PORT` | No | `3001` | API port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `APP_VERSION` | No | `1.0.0` | Application version |
| `LOG_LEVEL` | No | `info` | Log level (trace/debug/info/warn/error/fatal) |
| `CACHE_ENABLED` | No | `true` | Enable caching |
| `FEATURE_FLAGS` | No | — | Comma-separated feature flag overrides |
