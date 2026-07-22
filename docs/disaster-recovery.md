# Disaster Recovery Guide

## Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Service crash | 5 minutes | 0 (auto-restart) |
| Application bug | 15 minutes | 0 (rollback) |
| Database corruption | 1 hour | 24 hours (daily backup) |
| Server failure | 4 hours | 24 hours (daily backup) |
| Data center failure | 8 hours | 24 hours (off-site backup) |

## Recovery Procedures

### Scenario 1: Service Crash (Auto-Recovery)

systemd auto-restarts failed services:

```bash
# Verify auto-restart is working
systemctl show bist-api | grep Restart

# Check restart count
systemctl show bist-api | grep NRestarts
```

**Expected recovery time: < 5 minutes**

### Scenario 2: Application Bug (Rollback)

```bash
cd /opt/bist-elite-ai

# 1. Stop services
sudo systemctl stop bist-api bist-web bist-worker bist-telegram

# 2. Check out previous version
git log --oneline -5
git checkout <previous-tag>

# 3. Install and build
pnpm install --frozen-lockfile
pnpm --filter @bist-elite/api build

# 4. Start services
sudo systemctl start bist-api bist-web bist-worker bist-telegram

# 5. Verify
bash deploy/health-check.sh
```

**Expected recovery time: < 15 minutes**

### Scenario 3: Database Corruption

```bash
# 1. Stop API
sudo systemctl stop bist-api

# 2. Find latest backup
ls -lt /opt/bist-elite-ai/backups/database/

# 3. Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS bist_elite_ai;"
sudo -u postgres psql -c "CREATE DATABASE bist_elite_ai OWNER bist;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bist_elite_ai TO bist;"

# 4. Restore
pg_restore -h localhost -U bist -d bist_elite_ai \
  /opt/bist-elite-ai/backups/database/db_YYYYMMDD_HHMMSS.dump

# 5. Run any pending migrations
cd /opt/bist-elite-ai
pnpm --filter @bist-elite/database prisma:migrate

# 6. Start API
sudo systemctl start bist-api

# 7. Verify
curl http://localhost:3001/health
bash deploy/health-check.sh
```

**Expected recovery time: < 1 hour**

### Scenario 4: Server Failure (New Server)

```bash
# On new Ubuntu server:

# 1. Setup server
sudo bash deploy/setup-server.sh

# 2. Install application
bash deploy/install.sh

# 3. Restore database from off-site backup
scp user@backup-server:/backups/bist/database/*.dump /opt/bist-elite-ai/backups/database/
pg_restore -h localhost -U bist -d bist_elite_ai \
  /opt/bist-elite-ai/backups/database/db_latest.dump

# 4. Restore configuration
scp user@backup-server:/backups/bist/config/*.tar.gz /opt/bist-elite-ai/backups/config/
tar -xzf /opt/bist-elite-ai/backups/config/config_latest.tar.gz -C /opt/bist-elite-ai/

# 5. Start services
sudo systemctl start bist-api bist-web bist-worker bist-telegram

# 6. Update DNS to point to new server IP

# 7. Verify
bash deploy/health-check.sh
```

**Expected recovery time: < 4 hours**

### Scenario 5: Complete Data Loss

```bash
# 1. Provision new server
# 2. Follow Scenario 4 steps
# 3. If off-site backups are also lost:
#    - Database must be rebuilt from scratch
#    - Run: pnpm --filter @bist-elite/database prisma:migrate
#    - Run: pnpm --filter @bist-elite/database prisma:seed
#    - Historical data will be lost (re-fetch from market APIs)
```

**Expected recovery time: < 8 hours (data re-fetch may take longer)**

## Recovery Verification

After any recovery, verify:

```bash
# 1. All services running
systemctl status bist-api bist-web bist-worker bist-telegram

# 2. Health checks passing
bash deploy/health-check.sh

# 3. Database connectivity
curl http://localhost:3001/health

# 4. API responding
curl http://localhost:3001/api/metrics

# 5. Web app accessible
curl http://localhost:3000

# 6. Worker responding
curl http://localhost:8000/health

# 7. Check logs for errors
sudo journalctl -u bist-api --since "1 hour ago" | grep -i error
```

## Prevention

### Daily
- Automated database backups at 3 AM
- Health check monitoring
- Log rotation

### Weekly
- Verify backup integrity
- Review system resources
- Check security logs

### Monthly
- Test restore procedure
- Review and update documentation
- Update system packages
- Review firewall rules

## Contact Information

| Role | Contact | Purpose |
|------|---------|---------|
| System Admin | — | Server infrastructure |
| Database Admin | — | Database recovery |
| Development Lead | — | Application rollback |
| Security Contact | security@bist-elite-ai.com | Security incidents |
