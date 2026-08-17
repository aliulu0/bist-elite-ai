# BIST Elite AI — Go-Live Checklist

## Sprint R1-001 — Production Deployment Preparation

---

## 1. Cloud Account Setup

- [ ] **Supabase** account created (https://supabase.com)
  - [ ] Project created, database initialized
  - [ ] Connection string copied (Settings > Database > Connection string > URI)
  - [ ] Pooler port 6543 noted (for production connection pooling)
  - [ ] SSL mode confirmed (Supabase enforces TLS by default)

- [ ] **Upstash** account created (https://upstash.com)
  - [ ] Redis database created (global region, closest to Render)
  - [ ] Connection URL copied (redis://default:PASSWORD@xxxxx.upstash.io:6379)
  - [ ] Max concurrent connections: 20 (free tier)

- [ ] **Render** account created (https://render.com)
  - [ ] GitHub connected
  - [ ] Billing setup (free tier: 750 hours/month per service)

- [ ] **Cloudflare** account created (https://cloudflare.com)
  - [ ] Domain added to Cloudflare
  - [ ] DNS records configured
  - [ ] SSL/TLS set to Full (strict)

- [ ] **GitHub** secrets configured (Settings > Secrets and Variables > Actions)
  - [ ] `RENDER_DEPLOY_HOOK_API` — Render deploy hook URL for API
  - [ ] `RENDER_DEPLOY_HOOK_WEB` — Render deploy hook URL for Web
  - [ ] `RENDER_DEPLOY_HOOK_SCHEDULER` — Render deploy hook URL for Scheduler
  - [ ] `DATABASE_URL` — Supabase connection string
  - [ ] `REDIS_URL` — Upstash connection URL
  - [ ] `JWT_SECRET` — 64-char random string
  - [ ] Provider API keys (SerpAPI, Fintables, etc.)

---

## 2. DNS Configuration

- [ ] **Cloudflare DNS records** created:

| Type  | Name  | Value                                           |
| ----- | ----- | ----------------------------------------------- |
| CNAME | `@`   | `yourdomain.com` (redirect to Cloudflare Pages) |
| CNAME | `api` | `your-app.onrender.com`                         |
| CNAME | `www` | `yourdomain.com`                                |

- [ ] **Cloudflare Proxy** enabled (orange cloud) for all records
- [ ] **SSL/TLS** → Full (strict)
- [ ] **Always Use HTTPS** → ON
- [ ] **Automatic HTTPS Rewrites** → ON
- [ ] **Minimum TLS Version** → 1.2

---

## 3. Environment Variables — Backend (Render)

### Required (validated at startup)

| Variable            | Source      | Notes                                                                         |
| ------------------- | ----------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`      | Supabase    | `postgresql://postgres:pass@db.xxxxx.supabase.co:6543/postgres?pgbonder=true` |
| `REDIS_URL`         | Upstash     | `redis://default:pass@xxxxx.upstash.io:6379`                                  |
| `JWT_SECRET`        | Generate    | `openssl rand -hex 64` (min 64 chars)                                         |
| `CORS_ORIGINS`      | Your domain | `https://yourdomain.com,https://www.yourdomain.com`                           |
| `PORT`              | —           | `3001`                                                                        |
| `NODE_ENV`          | —           | `production`                                                                  |
| `LOG_LEVEL`         | —           | `info`                                                                        |
| `SCHEDULER_ENABLED` | —           | `true` (scheduler service) / `false` (API service)                            |

### Market Data Providers (leave disabled — unconfigured providers return no data)

| Variable            | Value   |
| ------------------- | ------- |
| `FINTABLES_ENABLED` | `false` |
| `KAP_ENABLED`       | `false` |
| `TCMB_ENABLED`      | `false` |
| `MKK_ENABLED`       | `false` |

### Other Backend Variables

Set from `.env.production` template. Key overrides:

| Variable                  | Production Value |
| ------------------------- | ---------------- |
| `APP_DEBUG`               | `false`          |
| `APP_LOG_LEVEL`           | `info`           |
| `RATE_LIMIT_MAX_REQUESTS` | `100`            |
| `CACHE_ENABLED`           | `true`           |

---

## 4. Environment Variables — Frontend (Cloudflare Pages)

| Variable       | Value                        | Notes                                             |
| -------------- | ---------------------------- | ------------------------------------------------- |
| `VITE_API_URL` | `https://api.yourdomain.com` | Only used for Vite dev proxy; not read at runtime |
| `NODE_VERSION` | `22`                         | Cloudflare Pages build environment                |

**Note:** The frontend SDK uses relative URL `/api` (see `apps/web/src/lib/constants.ts`). In production, `/api` requests are proxied via the deployed frontend's domain or redirected via Cloudflare Pages redirects. If deploying API separately on `api.yourdomain.com`, the `_redirects` file handles cross-origin routing.

---

## 5. Deploy Steps

### 5.1 Database — Supabase

```bash
# 1. Create Supabase project
# 2. Go to SQL Editor and run the initial schema from Prisma
#    OR use the Supabase connection string locally:
npx prisma db push --schema=packages/database/prisma/schema.prisma
# 3. Seed the database:
pnpm --filter @bist-elite/database seed
```

### 5.2 Backend API — Render (Docker)

1. Create **Web Service** in Render dashboard:
   - Name: `bist-elite-api`
   - Runtime: Docker
   - Repository: your GitHub repo
   - Branch: `main`
   - Dockerfile Path: `docker/Dockerfile.api`
   - Port: `3001`
   - Health Check Path: `/health`
   - Plan: Free

2. Add all environment variables from Section 3.

3. Deploy.

### 5.3 Scheduler — Render (Background Worker)

1. Create **Background Worker** in Render dashboard:
   - Name: `bist-elite-scheduler`
   - Runtime: Docker
   - Repository: your GitHub repo
   - Branch: `main`
   - Dockerfile Path: `docker/Dockerfile.scheduler`
   - Start Command: (uses entrypoint.sh — runs `node dist/main-scheduler.js`)
   - Plan: Free

2. Add all environment variables from Section 3, with `SCHEDULER_ENABLED=true`.

3. Deploy.

### 5.4 Frontend — Cloudflare Pages

1. Create **Pages** project in Cloudflare dashboard:
   - Connect to GitHub repo
   - Branch: `main`
   - Build command: `pnpm build --filter=@bist-elite/web`
   - Output directory: `apps/web/dist`
   - Build system: Version 2

2. Add environment variables:
   - `VITE_API_URL`: `https://api.yourdomain.com`
   - `NODE_VERSION`: `22`

3. Configure custom domain:
   - Cloudflare Pages → Custom domains → Add `yourdomain.com`

4. Deploy.

---

## 6. Post-Deploy Verification

### 6.1 Health Checks

```bash
# API Health
curl -f https://api.yourdomain.com/health
curl -f https://api.yourdomain.com/health/ready
curl -f https://api.yourdomain.com/health/live

# Swagger Docs
curl -f https://api.yourdomain.com/api/docs

# Frontend
curl -f https://yourdomain.com
```

### 6.2 System Verification

- [ ] Frontend loads without errors (browser console)
- [ ] Backend responds with 200 on `/health`
- [ ] Swagger UI loads at `/api/docs`
- [ ] Database health check shows `healthy`
- [ ] Redis health check shows `healthy` (or `degraded` if Upstash not configured)
- [ ] Memory health check shows `healthy`
- [ ] Pipeline health check shows `healthy`
- [ ] Scheduler health check shows `healthy` (scheduler service)
- [ ] WebSocket health check shows `healthy`
- [ ] CORS working from frontend domain
- [ ] HTTPS enforced (HTTP → HTTPS redirect)
- [ ] Rate limiting headers present (`X-RateLimit-*`)
- [ ] Security headers present:
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy`

### 6.3 Feature Verification

- [ ] Dashboard loads with KPI cards
- [ ] Scanner page loads and shows results
- [ ] Ranking page loads with ranked opportunities
- [ ] Portfolio page loads with skeleton → data flow
- [ ] Watchlist page loads with skeleton → data flow
- [ ] Alerts page loads
- [ ] AI Chat Assistant responds (`POST /ai/chat`)
- [ ] AI Reports page generates report
- [ ] Multi Market endpoints return data (`/markets/bist`, `/markets/nasdaq`, `/markets/nyse`)
- [ ] Backtest page loads
- [ ] Settings page loads
- [ ] Swagger docs browsable

---

## 7. Monitoring Setup

### 7.1 UptimeRobot Monitors

| Monitor      | URL                                      | Interval |
| ------------ | ---------------------------------------- | -------- |
| API Health   | `https://api.yourdomain.com/health`      | 5 min    |
| API Liveness | `https://api.yourdomain.com/health/live` | 5 min    |
| Frontend     | `https://yourdomain.com`                 | 5 min    |

### 7.2 Render Dashboard Monitoring

- [ ] CPU/Memory usage monitored in Render dashboard
- [ ] Logs accessible via Render UI
- [ ] Deploy notifications configured

### 7.3 Health Endpoint Monitoring

The `/health` endpoint returns:

```json
{
  "status": "healthy",
  "checks": [
    { "name": "database", "status": "healthy", "duration": 5 },
    { "name": "redis", "status": "healthy", "duration": 2 },
    { "name": "memory", "status": "healthy", "heapUsed": 85.2, "heapTotal": 512 },
    { "name": "pipeline", "status": "healthy", "running": 0, "failed": 0 },
    { "name": "scheduler", "status": "healthy", "enabled": true, "activeJobs": 13 },
    { "name": "websocket", "status": "healthy", "connectedClients": 0 }
  ]
}
```

---

## 8. Backup & Recovery

### 8.1 Database Backup

| Method                | Frequency         | Retention     | Command                                                         |
| --------------------- | ----------------- | ------------- | --------------------------------------------------------------- |
| Supabase Daily Backup | Daily (automatic) | 7 days (free) | Enabled by default in Supabase                                  |
| Manual pg_dump        | On-demand         | Indefinite    | `pg_dump -Fc "YOUR_DATABASE_URL" > backup_$(date +%Y%m%d).dump` |

**Restore:**

```bash
pg_restore --clean --if-exists -d "YOUR_DATABASE_URL" backup_20250101.dump
```

### 8.2 Redis Recovery

Upstash Redis data is persisted automatically. No manual backup needed. In case of data loss, the application will rebuild cache on demand.

### 8.3 Deployment Rollback

**Render:**

1. Go to Render Dashboard → bist-elite-api → Deploys
2. Find the last working deploy
3. Click "Manual Deploy" → "Deploy existing image"

**Cloudflare Pages:**

1. Go to Cloudflare Dashboard → Pages → bist-elite-ai
2. Find the last working deployment
3. Click "Rollback to this deployment"

**GitHub:**

```bash
git revert HEAD  # Revert last commit
git push origin main  # Triggers deploy workflow
```

---

## 9. Rollback Procedure

```bash
# 1. Identify the last known good deployment
git log --oneline -10

# 2. Revert to it
git revert <bad-commit-hash>
git push origin main

# 3. OR manually roll back on Render:
#    Dashboard → Deploys → Manual Deploy → Deploy existing image

# 4. Verify health after rollback
curl -f https://api.yourdomain.com/health
```

---

## 10. Troubleshooting

### Common Issues

| Symptom                 | Likely Cause                              | Solution                                       |
| ----------------------- | ----------------------------------------- | ---------------------------------------------- |
| API won't start         | Missing `DATABASE_URL` or `JWT_SECRET`    | Check env validator error in logs              |
| Database health fails   | Supabase connection string wrong          | Verify `?pgbonder=true` and password           |
| Redis health fails      | Upstash URL wrong or network restricted   | Check `REDIS_URL` format, ensure no firewall   |
| Frontend loads blank    | SPA routing not set up                    | Verify `_redirects` file deployed with build   |
| CORS errors in browser  | `CORS_ORIGINS` doesn't match frontend URL | Add frontend domain to CORS_ORIGINS            |
| WebSocket won't connect | Socket.io path not proxied                | Ensure `/socket.io` is forwarded in Cloudflare |
| Scheduler not running   | `SCHEDULER_ENABLED` not `true`            | Add env var to scheduler service               |
| HTTPS warning           | SSL not set to Full (strict)              | Cloudflare SSL/TLS → Full (strict)             |

### Logs

```bash
# Render: Dashboard → Logs tab
# Cloudflare Pages: Dashboard → Pages → Logs
# Local docker: docker compose logs -f api scheduler web
```

---

## 11. Known Limitations (Pre-Deployment)

1. **No real provider adapters**: Market data uses simulated data (`Math.random()`). All external API keys are optional.
2. **Portfolio & Watchlist demo data**: Frontend pages use hardcoded examples, not real PortfolioEngine API.
3. **No auto-scaling**: Render free tier limits: 750 hours/month, 512 MB RAM, 0.5 CPU.
4. **No WebSocket-driven auto-refresh**: Frontend KPI cards require manual REST calls.
5. **No multi-language**: UI is Turkish-only.
6. **No PWA**: No service worker, offline support, or mobile app.
7. **ESLint not installed**: Linting binaries missing from all packages — pre-existing issue.
8. **No Prisma migrations**: The entrypoint falls back to `prisma db push` for schema sync. Create initial migration post-deploy:
   ```bash
   npx prisma migrate dev --name init --schema=packages/database/prisma/schema.prisma
   ```

---

## 12. Final Go/No-Go

- [ ] All cloud accounts created and configured
- [ ] DNS propagated (can take 24-48 hours)
- [ ] SSL certificates issued (Cloudflare: instant)
- [ ] Environment variables verified in all services
- [ ] Health checks passing
- [ ] All features verified working
- [ ] Monitoring configured
- [ ] Backup strategy documented
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

**Go-Live Date:** _________________

**Verified By:** _________________

---

_End of Go-Live Checklist — R1-001_
