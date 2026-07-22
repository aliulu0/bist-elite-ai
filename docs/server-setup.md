# Server Setup Guide

## Prerequisites

- Fresh Ubuntu 22.04/24.04 LTS server
- Root or sudo access
- SSH access configured
- Domain name (optional, for SSL)

## Step 1: Initial Server Access

```bash
ssh root@your-server-ip
```

## Step 2: Run Setup Script

```bash
# Download or clone the repository
git clone https://github.com/bist-elite-ai/bist-elite-ai.git /tmp/bist-elite-ai
cd /tmp/bist-elite-ai

# Run server setup (installs all dependencies)
sudo bash deploy/setup-server.sh
```

### What the Setup Script Does

1. Updates system packages
2. Installs essential tools (curl, git, build-essential, ufw, fail2ban)
3. Creates `bist` application user
4. Installs Node.js 20 + pnpm 9
5. Installs Python 3.12
6. Installs PostgreSQL 16
7. Installs Redis
8. Installs Nginx
9. Configures firewall (SSH, HTTP, HTTPS only)
10. Configures fail2ban (SSH brute force protection)
11. Creates 2GB swap file
12. Configures log rotation
13. Optimizes kernel parameters

## Step 3: Install Application

```bash
# From the cloned repository
bash deploy/install.sh
```

### What the Install Script Does

1. Clones repository to `/opt/bist-elite-ai`
2. Creates `.env` with generated secrets
3. Installs Node.js dependencies
4. Generates Prisma client
5. Creates PostgreSQL database and user
6. Runs database migrations
7. Seeds initial data
8. Builds API and Web applications
9. Installs Python worker dependencies
10. Installs systemd service files
11. Configures Nginx reverse proxy
12. Sets up automated backups (cron)
13. Configures log rotation

## Step 4: Configure SSL

### With Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Edit nginx config to set your domain
sudo nano /etc/nginx/sites-available/bist-elite-ai
# Change: server_name your-domain.com;

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### With Cloudflare (Simpler)

1. Add domain to Cloudflare
2. Set DNS A record to your server IP
3. Enable SSL mode "Full" in Cloudflare
4. No server-side certificate needed

## Step 5: Start Services

```bash
# Start all services
sudo systemctl start bist-api bist-web bist-worker bist-telegram

# Check status
sudo systemctl status bist-api

# Verify health
bash deploy/health-check.sh
```

## Step 6: Verify Deployment

```bash
# API health
curl http://localhost:3001/health

# API docs
curl http://localhost:3001/api/docs

# Web app
curl http://localhost:3000

# Worker health
curl http://localhost:8000/health
```

## Firewall Rules

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (redirects to HTTPS) |
| 443 | TCP | HTTPS |

All other ports (3000, 3001, 5432, 6379, 8000) are internal-only.

## Post-Setup Checklist

- [ ] Services running: `systemctl status bist-*`
- [ ] Health checks passing: `bash deploy/health-check.sh`
- [ ] SSL configured and working
- [ ] Firewall active: `ufw status`
- [ ] Fail2ban active: `fail2ban-client status`
- [ ] Backups configured: `crontab -l -u bist`
- [ ] Log rotation working: `logrotate -d /etc/logrotate.d/bist-elite-ai`

## Troubleshooting

### Services won't start

```bash
# Check logs
journalctl -u bist-api -n 50

# Check environment
sudo -u bist cat /opt/bist-elite-ai/.env

# Check permissions
ls -la /opt/bist-elite-ai/
```

### Database connection refused

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check pg_hba.conf
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep bist

# Test connection
psql -h localhost -U bist -d bist_elite_ai
```

### Redis connection refused

```bash
# Check Redis status
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

### Nginx 502 Bad Gateway

```bash
# Check if services are running
curl http://localhost:3001/health
curl http://localhost:3000

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```
