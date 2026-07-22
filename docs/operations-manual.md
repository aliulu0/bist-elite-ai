# Operations Manual

## Service Management

### Start Services

```bash
# All services
sudo systemctl start bist-api bist-web bist-worker bist-telegram

# Individual service
sudo systemctl start bist-api
```

### Stop Services

```bash
# All services
sudo systemctl stop bist-telegram bist-worker bist-web bist-api

# Individual service
sudo systemctl stop bist-api
```

### Restart Services

```bash
# Restart specific service
sudo systemctl restart bist-api

# Reload configuration (nginx)
sudo systemctl reload nginx
```

### Check Status

```bash
# All services
sudo systemctl status bist-api bist-web bist-worker bist-telegram

# Detailed status with logs
sudo journalctl -u bist-api -n 50 --no-pager
```

## Monitoring

### Health Checks

```bash
# Full health check
bash deploy/health-check.sh

# Individual endpoints
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
curl http://localhost:3001/health/live
curl http://localhost:3000
curl http://localhost:8000/health
```

### Resource Monitoring

```bash
# Memory usage
free -h

# Disk usage
df -h

# CPU usage
top -bn1 | head -5

# Process-specific
ps aux | grep node
ps aux | grep python

# API metrics
curl http://localhost:3001/api/metrics
```

### Log Monitoring

```bash
# API logs (real-time)
sudo journalctl -u bist-api -f

# Worker logs
sudo journalctl -u bist-worker -f

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /opt/bist-elite-ai/logs/*.log
```

## Database Operations

### Connect to Database

```bash
# As bist user
psql -h localhost -U bist -d bist_elite_ai

# As postgres admin
sudo -u postgres psql
```

### Run Migrations

```bash
cd /opt/bist-elite-ai
pnpm --filter @bist-elite/database prisma:migrate
```

### View Schema

```bash
cd /opt/bist-elite-ai
pnpm --filter @bist-elite/database prisma:studio
```

### Manual Backup

```bash
# Full database backup
pg_dump -h localhost -U bist -d bist_elite_ai --format=custom > backup.dump

# Restore
pg_restore -h localhost -U bist -d bist_elite_ai backup.dump
```

## Backup Operations

### Manual Backup

```bash
bash deploy/backup.sh
```

### View Backups

```bash
ls -la /opt/bist-elite-ai/backups/database/
ls -la /opt/bist-elite-ai/backups/config/
```

### Restore from Backup

```bash
# Database restore
pg_restore -U bist -d bist_elite_ai /opt/bist-elite-ai/backups/database/db_YYYYMMDD_HHMMSS.dump

# Config restore
tar -xzf /opt/bist-elite-ai/backups/config/config_YYYYMMDD_HHMMSS.tar.gz -C /opt/bist-elite-ai/
```

## Update Procedures

### Application Update

```bash
cd /opt/bist-elite-ai

# 1. Create backup
bash deploy/backup.sh

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
pnpm install --frozen-lockfile

# 4. Build
pnpm --filter @bist-elite/api build

# 5. Run migrations
pnpm --filter @bist-elite/database prisma:migrate

# 6. Restart services
sudo systemctl restart bist-api bist-web bist-worker

# 7. Verify
bash deploy/health-check.sh
```

### System Update

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Reboot if kernel updated
sudo reboot
```

## Security Operations

### Review Firewall

```bash
sudo ufw status verbose
```

### Review Fail2ban

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### Check for Failed Login Attempts

```bash
sudo journalctl -u ssh --since "1 hour ago" | grep "Failed"
```

### Rotate Secrets

```bash
# Generate new JWT secret
NEW_JWT=$(openssl rand -hex 32)

# Update .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$NEW_JWT|" /opt/bist-elite-ai/.env

# Restart API
sudo systemctl restart bist-api
```

## Troubleshooting

### High Memory Usage

```bash
# Check which process uses most memory
ps aux --sort=-%mem | head -10

# Check systemd memory limits
systemctl show bist-api | grep Memory

# Restart service to free memory
sudo systemctl restart bist-api
```

### High CPU Usage

```bash
# Check which process uses most CPU
ps aux --sort=-%cpu | head -10

# Check API metrics
curl http://localhost:3001/api/metrics
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Find large files
du -sh /opt/bist-elite-ai/* | sort -rh | head

# Clean old logs
sudo journalctl --vacuum-time=7d

# Clean old backups
find /opt/bist-elite-ai/backups -mtime +30 -delete
```

### Service Crash Loop

```bash
# Check crash logs
sudo journalctl -u bist-api -n 100

# Check restart count
systemctl show bist-api | grep NRestarts

# Reset failure counter
sudo systemctl reset-failed bist-api
```
