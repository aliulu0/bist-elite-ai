# BIST Elite AI — Deployment Guide

## Overview

This document describes how to deploy the BIST Elite AI platform to production using free cloud infrastructure.

### Recommended Stack (Free Tier)

| Component          | Service                             | Cost      | Notes                           |
| ------------------ | ----------------------------------- | --------- | ------------------------------- |
| Frontend           | Cloudflare Pages                    | Free      | SPA with _redirects for routing |
| Backend API        | Render (Docker)                     | Free tier | 750 hrs/mo, 512 MB RAM          |
| Scheduler          | Render (Background Worker)          | Free tier | Same Docker image as API        |
| Database           | Supabase PostgreSQL (free 500MB)    | Free      | Pooler port 6543, TLS enforced  |
| Redis              | Upstash Redis (free 100MB)          | Free      | 20 concurrent connections       |
| Monitoring         | UptimeRobot (free 50 monitors)      | Free      | 5-min interval checks           |
| CI/CD              | GitHub Actions (free 2000 min/mo)   | Free      | Build + Docker + Deploy         |
| Container Registry | GitHub Container Registry (ghcr.io) | Free      | SHA + latest tags               |
| Domain             | Cloudflare DNS (free plan)          | Free      | Proxy enabled, SSL Full(strict) |

---

## Prerequisites

1. **GitHub repository** with push access
2. **Cloudflare account** (for DNS + Pages)
3. **Supabase account** (for PostgreSQL)
4. **Upstash account** (for Redis)
5. **Render account** (for API + Scheduler Docker deployment)
6. **Docker** installed locally (for testing)

### Architecture

```
Browser ──► Cloudflare DNS ──► Cloudflare Pages (static) ──► Render API (Docker) ──► Supabase PostgreSQL
                                   │                                                   └── Upstash Redis
                                   └── /api/* proxy via _redirects
```

---

## 1. Infrastructure Setup

### 1.1 Database — Supabase PostgreSQL

1. Create a Supabase project at https://supabase.com
2. Go to Project Settings → Database → Connection string
3. Copy the `postgresql://...` connection URI
4. Use the **pooler port (6543)** with `?pgbonder=true` for production

**Required connection string format:**

```
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbonder=true
```

**SSL:** Supabase enforces TLS automatically. Prisma handles SSL transparently. No additional `sslmode` parameter needed.

**Note:** Previous docs referenced `?pgbouncer=true` — the correct parameter is `?pgbonder=true` (no 'u'). Verify in Supabase dashboard.

**Prisma schema creation:** The Docker entrypoint runs `prisma migrate deploy` with fallback to `prisma db push`. On first deploy, `db push` creates all tables automatically. For production, create an initial migration:

```bash
pnpm --filter @bist-elite/database exec prisma migrate dev --name init --schema=../../packages/database/prisma/schema.prisma
```

### 1.2 Redis — Upstash

1. Create a Redis database at https://upstash.com
2. Select global region closest to your Render deployment region
3. Copy the `redis://...` connection URL
4. Save as `REDIS_URL` in your environment

**Required connection string format:**

```
redis://default:YOUR_PASSWORD@xxxxx.upstash.io:6379
```

**Note:** Upstash uses TLS on port 6379. The ioredis client is configured with exponential backoff retry (10 attempts, max 5s), lazy connect, and `READONLY` error reconnect. If Redis is unreachable, the API starts gracefully without cache.

### 1.3 Domain — Cloudflare DNS

1. Add your domain to Cloudflare
2. Create DNS records:

| Type  | Name  | Value                                           |
| ----- | ----- | ----------------------------------------------- |
| CNAME | `@`   | `yourdomain.com` (redirect to Cloudflare Pages) |
| CNAME | `api` | `your-app.onrender.com`                         |
| CNAME | `www` | `@`                                             |

3. Enable proxy (orange cloud) for all records
4. SSL/TLS → **Full (strict)**
5. Always Use HTTPS → ON
6. Automatic HTTPS Rewrites → ON
7. Minimum TLS Version → 1.2

---

## 2. Environment Variables

### 2.1 Required Variables (validated at startup)

These 8 variables are validated by `env-validator.ts` at API startup. Missing required vars cause immediate failure:

| Variable            | Required | Description                                             | Source                           |
| ------------------- | -------- | ------------------------------------------------------- | -------------------------------- |
| `DATABASE_URL`      | **Yes**  | PostgreSQL connection string                            | Supabase                         |
| `REDIS_URL`         | **Yes**  | Redis connection string                                 | Upstash                          |
| `JWT_SECRET`        | **Yes**  | JWT signing key (min 32 chars, recommend 64)            | Generate: `openssl rand -hex 64` |
| `CORS_ORIGINS`      | No       | Comma-separated allowed origins                         | Your domain                      |
| `PORT`              | No       | API server port (default 3001)                          | —                                |
| `NODE_ENV`          | No       | `development` / `production` / `staging`                | —                                |
| `LOG_LEVEL`         | No       | `trace` / `debug` / `info` / `warn` / `error` / `fatal` | —                                |
| `SCHEDULER_ENABLED` | No       | Enable scheduler (`true`/`false`)                       | —                                |

### 2.2 Provider API Keys (all optional — unconfigured providers return no data)

| Variable            | Description                      |
| ------------------- | -------------------------------- |
| `SERPAPI_API_KEY`   | SerpAPI (research: news/search)  |
| `FINTABLES_API_KEY` | Fintables market data            |
| `KAP_API_KEY`       | KAP (Public Disclosure Platform) |
| `TCMB_API_KEY`      | TCMB (Central Bank)              |
| `MKK_API_KEY`       | MKK (Central Registry)           |

Set all provider `*_ENABLED` vars to `false` if no API keys available (the default).

### 2.3 Full Environment Variable Reference

See `.env.production` for the complete categorized list (54 variables across 14 sections).

Key variable groups:

| Group      | Variables                                                                                 | Default Behavior               |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| App        | `APP_NAME`, `APP_VERSION`, `APP_ENV`, `APP_DEBUG`, `APP_LOG_LEVEL`                        | Production mode                |
| Database   | `DATABASE_URL`                                                                            | Bypassed if unset (graceful)   |
| Redis      | `REDIS_URL`                                                                               | Graceful fallback if unset     |
| Auth       | `JWT_SECRET`, `JWT_EXPIRES_IN`                                                            | Required for JWT signing       |
| CORS       | `CORS_ORIGINS`                                                                            | Comma-separated origins        |
| Rate Limit | `SECURITY_RATE_LIMIT_ENABLED`, `SECURITY_RATE_LIMIT_MAX`, `SECURITY_RATE_LIMIT_WINDOW_MS` | 100 req/min default            |
| Scheduler  | `SCHEDULER_ENABLED`, interval overrides                                                   | 13 production jobs             |
| Providers  | `*_ENABLED`, `*_API_KEY`, `*_BASE_URL`, `*_TIMEOUT_MS`, `*_RETRY_*`                       | Default to disabled            |
| Macro      | `FED_MACRO_ENABLED`, `ECB_MACRO_ENABLED`, `TCMB_MACRO_ENABLED`                            | Default to disabled            |
| Cache      | `CACHE_ENABLED`, `CACHE_TTL`, `CACHE_MAX_ENTRIES`, `CACHE_COMPRESSION_ENABLED`            | In-memory LRU + optional Redis |
| Security   | `SECURITY_MAX_BODY_SIZE`, `SECURITY_TIMEOUT_MS`, `SECURITY_FILE_MAX_SIZE`                 | 10mb body, 30s timeout         |
| Currency   | `CURRENCY_RATE_USD`, `CURRENCY_RATE_EUR`, `CURRENCY_RATE_GBP`                             | Static rates (TRY base)        |

---

## 3. Deployment Options

### 3.1 Render (Required — Docker-based)

Render is the primary backend host. Both API and Scheduler use Docker deployment.

**API Web Service:**

1. Push code to GitHub
2. Create a **Web Service** on Render:
   - **Name**: `bist-elite-api`
   - **Runtime**: Docker
   - **Repository**: your GitHub repo
   - **Branch**: `main`
   - **Dockerfile Path**: `docker/Dockerfile.api`
   - **Port**: `3001`
   - **Health Check Path**: `/health`
   - **Plan**: Free
3. Add all environment variables (from section 2, including full `.env.production` set)
4. **Important**: Set `SCHEDULER_ENABLED=false` for this service
5. Deploy

**Scheduler Background Worker:**

1. Create a **Background Worker** on Render:
   - **Name**: `bist-elite-scheduler`
   - **Runtime**: Docker
   - **Repository**: your GitHub repo
   - **Branch**: `main`
   - **Dockerfile Path**: `docker/Dockerfile.scheduler`
   - **Start Command**: (leave blank — entrypoint.sh handles this)
   - **Plan**: Free
2. Add same environment variables as API
3. **Important**: Set `SCHEDULER_ENABLED=true` for this service
4. Deploy

### 3.2 Railway (Not recommended for R1-001)

Railway is an alternative backend host, but **Render is the primary target for R1-001**. If using Railway:

1. Install Railway CLI or connect GitHub repo
2. Create a new project
3. Add PostgreSQL plugin (or use Supabase URL manually)
4. Deploy API service with `docker/Dockerfile.api`
5. Deploy scheduler separately with `docker/Dockerfile.scheduler`
6. Add environment variables

### 3.3 Cloudflare Pages (Required — Frontend)

**Important:** The frontend uses Vite for building and serves as a static SPA. Production build outputs to `apps/web/dist/`.

1. Connect GitHub repo to Cloudflare Pages
2. Build settings:
   - **Build command**: `pnpm build --filter=@bist-elite/web`
   - **Output directory**: `apps/web/dist`
   - **Build system**: Version 2
3. Environment variables:
   - `VITE_API_URL`: `https://api.yourdomain.com`
   - `NODE_VERSION`: `22`
4. Configure Custom Domain → Add `yourdomain.com`

**SPA Routing:**

The `apps/web/public/_redirects` file handles SPA routing:

```
/api/*  https://api.yourdomain.com 200
/*  /index.html 200
```

This ensures:

- All `/api/*` requests are forwarded to the backend
- All other routes return `index.html` for SPA client-side routing
- HTTP 200 is returned for all routes (no redirect)

**Security Headers:**

The `apps/web/public/_headers` file sets security headers automatically:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Static assets: 1-year immutable cache

5. Deploy

**Note:** Unlike the nginx-based Docker deployment, Cloudflare Pages does not proxy API requests directly. The `_redirects` file handles cross-origin forwarding. The frontend SDK uses relative `/api` paths (`API_BASE_URL = '/api'` in `constants.ts`), so all API calls go through the frontend domain first, then are redirected to the backend.

### 3.4 Vercel (Not recommended for R1-001)

**Cloudflare Pages is the primary frontend host for R1-001.** If using Vercel:

1. Import GitHub repo to Vercel
2. Framework preset: **Vite**
3. Root directory: `apps/web`
4. Build command: `pnpm build --filter=@bist-elite/web`
5. Output: `apps/web/dist`
6. Environment variables:
   - `VITE_API_URL`: `https://api.yourdomain.com`
7. Add `vercel.json` for SPA routing:
   ```json
   {
     "routes": [
       { "src": "/api/(.*)", "dest": "https://api.yourdomain.com/$1" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

---

## 4. CI/CD Pipeline

GitHub Actions workflows are located in `.github/workflows/`:

### 4.1 Automatic Workflows

| Workflow          | Trigger                 | Purpose                                                  |
| ----------------- | ----------------------- | -------------------------------------------------------- |
| `ci.yml`          | Push/PR to main/develop | Lint, typecheck, unit tests, build                       |
| `deploy.yml`      | Push to main            | Build Docker images → push to ghcr.io → deploy to Render |
| `docker.yml`      | Push/PR to main/develop | Docker compose validation                                |
| `integration.yml` | Push/PR to main/develop | Integration tests, smoke tests                           |
| `security.yml`    | Push/PR + weekly        | Dependency audit, secret scan, CodeQL                    |
| `release.yml`     | Tag `v*`                | GitHub release + changelog                               |

### 4.2 Deploy Flow

```
git push to main
    │
    ▼
GitHub Actions (ci.yml)
    ├── Lint
    ├── TypeCheck
    ├── Build
    └── Unit Tests
    │
    ▼ (on success)
GitHub Actions (deploy.yml)
    ├── Build Docker images (api, web, scheduler)
    ├── Push to ghcr.io
    └── Trigger Render deploy hooks
    │
    ▼
Render
    ├── Pull latest image
    ├── Run migrations (entrypoint.sh)
    └── Start service
```

### 4.3 Rollback

To roll back to a previous deployment:

1. **Render**: Go to Dashboard → Deploys → select previous deploy → "Manual Deploy" → "Deploy existing image"
2. **Docker**: Re-tag previous image: `docker pull ghcr.io/org/repo-api:sha-XXXXX` then deploy
3. **Database**: Run `pg_restore` from latest backup

---

## 5. Database Management

### 5.1 Migrations

Migrations run automatically on startup via `docker/entrypoint.sh`:

```bash
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```

To create a new migration:

```bash
pnpm --filter @bist-elite/database prisma:migrate --name migration_name
```

### 5.2 Backups

Automatic backup script at `deploy/backup.sh`:

| Backup                     | Frequency    | Retention |
| -------------------------- | ------------ | --------- |
| PostgreSQL dump            | Daily (3 AM) | 30 days   |
| Config files (.env, nginx) | Daily        | 30 days   |
| Log archive                | Daily        | 14 days   |

**Manual backup:**

```bash
pg_dump -Fc -h <host> -U postgres bist_elite_ai > backup_$(date +%Y%m%d).dump
```

### 5.3 Restore

```bash
pg_restore -h <host> -U postgres -d bist_elite_ai --clean --if-exists backup_20250101.dump
```

---

## 6. Monitoring

### 6.1 Health Endpoints

| Endpoint                            | Purpose                  |
| ----------------------------------- | ------------------------ |
| `GET /health`                       | Full system health       |
| `GET /health/ready`                 | Readiness probe          |
| `GET /health/live`                  | Liveness probe           |
| `GET /api/metrics`                  | Application metrics      |
| `POST /ai/chat`                     | AI Chat Assistant        |
| `GET /ai/suggestions`               | Suggested chat questions |
| `GET /api/pipeline/status`          | Pipeline status          |
| `POST /api/pipeline/run`            | Run full pipeline        |
| `GET /api/scheduler`                | Scheduler status         |
| `POST /api/scheduler/{job}/execute` | Trigger scheduler job    |
| `GET /markets/bist`                 | BIST exchange metadata   |
| `GET /markets/nasdaq`               | NASDAQ exchange metadata |
| `GET /markets/nyse`                 | NYSE exchange metadata   |

### 6.2 Health Check Components

The `/health` endpoint reports on:

| Component   | Statuses                       | Description               |
| ----------- | ------------------------------ | ------------------------- |
| `database`  | healthy / unhealthy            | PostgreSQL connectivity   |
| `redis`     | healthy / degraded             | Redis ping (3s timeout)   |
| `memory`    | healthy / degraded / unhealthy | Heap usage, GC pressure   |
| `pipeline`  | healthy / degraded             | Pipeline job success rate |
| `scheduler` | healthy / degraded             | Scheduler job health      |
| `websocket` | healthy                        | WebSocket gateway status  |

### 6.3 UptimeRobot Setup

1. Create account at https://uptimerobot.com
2. Add monitors:

| Monitor      | URL                                      | Interval |
| ------------ | ---------------------------------------- | -------- |
| API Health   | `https://api.yourdomain.com/health`      | 5 min    |
| API Liveness | `https://api.yourdomain.com/health/live` | 5 min    |
| Website      | `https://yourdomain.com`                 | 5 min    |

3. Configure alert contacts (email, Slack, Telegram)

### 6.4 Logging

Structured JSON logs are output to stdout (console) with these fields:

```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "info",
  "context": "HTTP",
  "message": "GET /api/health 200 15ms",
  "requestId": "abc-123",
  "duration": 15,
  "statusCode": 200
}
```

Configure via environment:

- `LOG_LEVEL`: `trace` | `debug` | `info` | `warn` | `error` | `fatal`
- `LOG_CONSOLE`: `true` | `false`
- `LOG_FILE`: `true` | `false` (for file logging)

---

## 7. Security

### 7.1 HTTPS

SSL/TLS is handled automatically by:

- **Render**: Built-in SSL for `*.onrender.com` and custom domains
- **Cloudflare**: Universal SSL (free) for proxied domains
- **Railway**: Built-in SSL for `*.railway.app`

### 7.2 Security Headers

The API applies these headers via **Helmet** middleware:

| Header                              | Value                                              | Applied By                         |
| ----------------------------------- | -------------------------------------------------- | ---------------------------------- |
| `Strict-Transport-Security`         | `max-age=31536000; includeSubDomains; preload`     | Helmet                             |
| `X-Frame-Options`                   | `DENY`                                             | Helmet + SecurityHeadersMiddleware |
| `X-Content-Type-Options`            | `nosniff`                                          | SecurityHeadersMiddleware          |
| `Referrer-Policy`                   | `strict-origin-when-cross-origin`                  | SecurityHeadersMiddleware          |
| `Permissions-Policy`                | Restricted (camera, microphone, geolocation, etc.) | SecurityHeadersMiddleware          |
| `X-Permitted-Cross-Domain-Policies` | `none`                                             | SecurityHeadersMiddleware          |
| `Cross-Origin-Embedder-Policy`      | `require-corp`                                     | SecurityHeadersMiddleware          |
| `Cross-Origin-Opener-Policy`        | `same-origin`                                      | Helmet                             |
| `Cross-Origin-Resource-Policy`      | `same-origin`                                      | Helmet                             |
| `Content-Security-Policy`           | Restricted (self + CORS_ORIGINS for connect-src)   | Helmet                             |

The frontend also sets security headers via `_headers` file on Cloudflare Pages (see section 3.3).

### 7.3 Rate Limiting

The API uses a **custom rate limit guard** applied globally via `APP_GUARD`:

| Scope                                               | Limit                     | Window                          | Applied  |
| --------------------------------------------------- | ------------------------- | ------------------------------- | -------- |
| API (`/api/*`)                                      | 100 requests              | 60 seconds                      | Default  |
| Health (`/health`, `/health/ready`, `/health/live`) | No limit                  | —                               | Excluded |
| Custom override via env                             | `SECURITY_RATE_LIMIT_MAX` | `SECURITY_RATE_LIMIT_WINDOW_MS` | Optional |

Rate limiting uses in-memory storage (Map). Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

**Note:** Rate limits are per-instance. With multiple instances (future), a Redis-backed store would be needed.

### 7.4 Environment Secrets

Never commit secrets. The following files are gitignored:

- `.env`
- `.env.production`
- `.env.*local`

Secrets are injected via:

- **Render**: Dashboard → Environment Variables
- **GitHub Actions**: Settings → Secrets and Variables
- **Docker**: Docker secrets or `--env-file`

---

## 8. Performance

### 8.1 Compression

- **Gzip**: Enabled for API responses via `compression` middleware
- **Static files**: 1 year cache for hashed assets (Vite handles content hashing)
- **Nginx**: Gzip on, proxy cache for static assets

### 8.2 Caching

| Layer                    | Type                    | TTL          |
| ------------------------ | ----------------------- | ------------ |
| CacheService (in-memory) | LRU with namespaces     | Configurable |
| Browser (static assets)  | Cache-Control immutable | 1 year       |
| Nginx proxy cache        | Static assets           | 7 days       |
| Redis (optional)         | Enabled via REDIS_URL   | Configurable |

### 8.3 Frontend Performance

- **Code splitting**: All 18 routes use `React.lazy()` — initial bundle ~396 kB
- **Skeleton loaders**: Portfolio and Watchlist show skeleton cards during loading
- **Animation**: `animate-fade-in` for page transitions
- **Cloudflare Pages**: Automatic CDN caching, Brotli compression, HTTP/3 support
- **Static asset caching**: 1-year immutable cache for hashed assets (via `_headers`)

### 8.4 Database

- **Connection pooling**: Supabase pooler port 6543 with `?pgbonder=true`
- **Indexes**: Defined in Prisma schema
- **Query optimization**: Use `prisma.$queryRaw` for complex queries

---

## 9. Troubleshooting

### Common Issues

| Issue                                    | Solution                                                      |
| ---------------------------------------- | ------------------------------------------------------------- |
| API won't start — `DATABASE_URL` missing | Validate env vars — startup fails fast with clear message     |
| Redis connection refused                 | Check `REDIS_URL`, Upstash allows only TLS connections        |
| Scheduler not running                    | Set `SCHEDULER_ENABLED=true`                                  |
| WebSocket not connecting                 | Verify `/socket.io` proxy in Vite config or nginx             |
| CORS errors                              | Add domain to `CORS_ORIGINS`                                  |
| Prisma migration fails                   | Run `prisma migrate deploy` manually, check migration history |

### Health Check Debugging

```bash
# Full health
curl https://api.yourdomain.com/health

# Readiness
curl https://api.yourdomain.com/health/ready

# Liveness
curl https://api.yourdomain.com/health/live
```

---

## 10. Deployment Checklist

- [ ] Supabase project created and `DATABASE_URL` configured
- [ ] Upstash Redis created and `REDIS_URL` configured
- [ ] `JWT_SECRET` generated (min 64 chars random)
- [ ] `CORS_ORIGINS` set to your domain
- [ ] Provider API keys configured (SerpAPI, Fintables)
- [ ] Domain DNS pointing to the platform
- [ ] SSL enabled (Cloudflare or Render built-in)
- [ ] GitHub Actions secrets configured
- [ ] Render/Railway services created
- [ ] Health checks passing (`curl /health`)
- [ ] UptimeRobot monitors configured
- [ ] `pnpm build` passes locally
- [ ] `pnpm test` passes locally
- [ ] Database migrations applied
- [ ] WebSocket connection working
- [ ] Pipeline run successful
- [ ] Backup schedule confirmed
- [ ] Rollback procedure documented
- [ ] AI Chat Assistant responding (`POST /ai/chat`)
- [ ] Multi Market endpoints returning data (`GET /markets/bist`)
- [ ] Portfolio Advisor and Optimization visible in UI
- [ ] Code splitting verified (18 chunks, ~396 kB main bundle)
- [ ] `_redirects` and `_headers` deployed with frontend build
- [ ] Frontend SPA routing working (all routes, direct URL access)
- [ ] Cloudflare proxy enabled (orange cloud) for all DNS records
- [ ] SSL/TLS set to Full (strict) in Cloudflare
- [ ] Security headers verified via browser DevTools
- [ ] Rate limiting headers present in API responses
- [ ] Supabase connection pooler verified (port 6543, `?pgbonder=true`)
- [ ] CORS working from frontend domain
