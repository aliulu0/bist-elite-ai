# Deployment Guide

## Overview

BIST Elite AI supports two deployment modes:

1. **Docker Deployment** (recommended for development and containers)
2. **Native VPS Deployment** (optimized for low-cost Linux servers)

Both modes run the same application code. Docker is optional.

## Target Environment

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Network | Public IPv4 | Public IPv4 + domain |

## Quick Deployment (VPS)

```bash
# 1. Provision server
sudo bash deploy/setup-server.sh

# 2. Install application
bash deploy/install.sh

# 3. Start services
sudo systemctl start bist-api bist-web bist-worker bist-telegram

# 4. Verify
bash deploy/health-check.sh
```

## Docker Deployment

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d --build
```

## Service Ports

| Service | Port | Internal Only |
|---------|------|---------------|
| Nginx (HTTP) | 80 | No |
| Nginx (HTTPS) | 443 | No |
| API | 3001 | Yes |
| Web | 3000 | Yes |
| Worker | 8000 | Yes |
| PostgreSQL | 5432 | Yes |
| Redis | 6379 | Yes |

## SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d your-domain.com

# Auto-renewal
systemctl enable certbot.timer
```

### Option 2: Cloudflare

1. Add domain to Cloudflare
2. Enable SSL (Full mode)
3. No server-side certificates needed

### Option 3: Self-Signed (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/bist.key \
  -out /etc/ssl/certs/bist.crt

# Uncomment SSL lines in nginx config
# Update paths to /etc/ssl/private/bist.key and /etc/ssl/certs/bist.crt
```

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://bist:pass@localhost:5432/bist_elite_ai` |
| `REDIS_URL` | Redis connection | `redis://:pass@localhost:6379/0` |
| `JWT_SECRET` | JWT signing key | 64-char hex string |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API port |
| `APP_VERSION` | `1.0.0` | Application version |
| `LOG_LEVEL` | `info` | Log verbosity |
| `CACHE_ENABLED` | `true` | Enable caching |
| `FEATURE_FLAGS` | — | Feature flag overrides |

## Resource Limits (systemd)

Each service has configured memory and CPU limits:

| Service | Memory Limit | CPU Quota |
|---------|-------------|-----------|
| API | 512 MB | 80% |
| Web | 384 MB | 60% |
| Worker | 512 MB | 80% |
| Telegram | 256 MB | 40% |
| **Total** | **1.6 GB** | — |

On a 2GB RAM server with 2GB swap, the application fits comfortably.

## Monitoring

```bash
# Health check
bash deploy/health-check.sh

# Service status
systemctl status bist-api bist-web bist-worker bist-telegram

# Logs
journalctl -u bist-api -f
journalctl -u bist-worker -f

# Metrics
curl http://localhost:3001/api/metrics
curl http://localhost:3001/health
```

## Backup

Automated daily backups at 3 AM via cron:

```bash
# Manual backup
bash deploy/backup.sh

# View backups
ls -la /opt/bist-elite-ai/backups/

# Restore database
pg_restore -U bist -d bist_elite_ai /opt/bist-elite-ai/backups/database/db_latest.dump
```

## Updating

```bash
# Pull latest code
cd /opt/bist-elite-ai
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm --filter @bist-elite/api build

# Run migrations
pnpm --filter @bist-elite/database prisma:migrate

# Restart services
sudo systemctl restart bist-api bist-web bist-worker
```

## Rollback

```bash
# Revert to previous version
cd /opt/bist-elite-ai
git checkout <previous-tag>
pnpm install --frozen-lockfile
pnpm --filter @bist-elite/api build
sudo systemctl restart bist-api bist-web bist-worker

# Restore database (if needed)
pg_restore -U bist -d bist_elite_ai /opt/bist-elite-ai/backups/database/<backup>.dump
```
