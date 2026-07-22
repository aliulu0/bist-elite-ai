# Backup Guide

## Overview

BIST Elite AI includes automated and manual backup capabilities for:

1. **Database** — PostgreSQL dumps with compression
2. **Configuration** — Environment and service files
3. **Application** — Source code and build artifacts
4. **Logs** — Application and system logs

## Automated Backups

### Schedule

Automated backups run daily at 3:00 AM via cron:

```bash
# Cron entry (installed by deploy/install.sh)
0 3 * * * bist /opt/bist-elite-ai/deploy/backup.sh >> /opt/bist-elite-ai/logs/backup.log 2>&1
```

### What Gets Backed Up

| Type | Location | Retention |
|------|----------|-----------|
| Database | `backups/database/*.dump` | 30 days |
| Config | `backups/config/*.tar.gz` | 30 days |
| Logs | `backups/logs/*.tar.gz` | 30 days |

### Backup Location

```
/opt/bist-elite-ai/backups/
├── database/
│   ├── db_20260722_030000.dump
│   └── db_20260721_030000.dump
├── config/
│   ├── config_20260722_030000.tar.gz
│   └── config_20260721_030000.tar.gz
└── logs/
    ├── logs_20260722_030000.tar.gz
    └── logs_20260721_030000.tar.gz
```

## Manual Backup

```bash
# Full backup
bash deploy/backup.sh

# With custom retention
RETENTION_DAYS=60 bash deploy/backup.sh

# Custom backup directory
BACKUP_DIR=/mnt/external/backups bash deploy/backup.sh
```

## Backup Verification

### Check Backup Sizes

```bash
# Database backups
ls -lh /opt/bist-elite-ai/backups/database/

# Config backups
ls -lh /opt/bist-elite-ai/backups/config/

# Total backup size
du -sh /opt/bist-elite-ai/backups/
```

### Verify Database Backup Integrity

```bash
# Test restore to a temporary database
pg_restore -l /opt/bist-elite-ai/backups/database/db_latest.dump
```

## Restore Procedures

### Restore Database

```bash
# 1. Stop API service
sudo systemctl stop bist-api

# 2. Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS bist_elite_ai;"
sudo -u postgres psql -c "CREATE DATABASE bist_elite_ai OWNER bist;"

# 3. Restore from backup
pg_restore -h localhost -U bist -d bist_elite_ai \
  /opt/bist-elite-ai/backups/database/db_YYYYMMDD_HHMMSS.dump

# 4. Start API service
sudo systemctl start bist-api

# 5. Verify
curl http://localhost:3001/health
```

### Restore Configuration

```bash
# 1. Extract config backup
tar -xzf /opt/bist-elite-ai/backups/config/config_YYYYMMDD_HHMMSS.tar.gz \
  -C /opt/bist-elite-ai/

# 2. Restart services
sudo systemctl restart bist-api bist-web bist-worker bist-telegram
```

## Off-Site Backup

### Option 1: Rclone to S3

```bash
# Install rclone
apt install rclone

# Configure
rclone config

# Sync backups
rclone sync /opt/bist-elite-ai/backups/ remote:bist-backups/ --max-age 30d
```

### Option 2: SCP to Remote Server

```bash
# Add to cron for off-site backup
0 4 * * * bist scp -r /opt/bist-elite-ai/backups/ user@backup-server:/backups/bist/
```

### Option 3: Git Push (Config Only)

```bash
# Push configuration to a private repo
cd /opt/bist-elite-ai
git add .env deploy/
git commit -m "config: backup $(date +%Y-%m-%d)"
git push origin main
```

## Monitoring Backups

### Check Backup Status

```bash
# View latest backup log
tail -20 /opt/bist-elite-ai/logs/backup.log

# Check cron
crontab -l -u bist
```

### Backup Alerts

To receive alerts on backup failures, add to the backup script:

```bash
# Email on failure (requires mailx)
if [ $? -ne 0 ]; then
  echo "BIST backup failed on $(hostname)" | mail -s "BIST Backup Alert" admin@your-domain.com
fi
```

## Backup Size Estimation

| Component | Typical Size | Growth Rate |
|-----------|-------------|-------------|
| Database | 50-200 MB | ~10 MB/day |
| Configuration | < 1 MB | Negligible |
| Logs | 10-50 MB | ~5 MB/day |
| **Daily Total** | **60-250 MB** | — |
| **Monthly Total** | **2-8 GB** | — |

## Disaster Recovery

See [disaster-recovery.md](./disaster-recovery.md) for complete disaster recovery procedures.
