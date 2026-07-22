#!/bin/bash
# ==========================================================
# BIST Elite AI - Automated Backup
# Usage: bash backup.sh [--full] [--app-dir /opt/bist-elite-ai]
# Cron: 0 3 * * * /opt/bist-elite-ai/deploy/backup.sh
# ==========================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bist-elite-ai}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

source "${APP_DIR}/.env" 2>/dev/null || true

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

mkdir -p "$BACKUP_DIR"/{database,config,logs}

log "=== BIST Elite AI Backup ==="

# 1. Database backup
log "Backing up database..."
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-bist_elite_ai}"
DB_USER="${POSTGRES_USER:-bist}"

if command -v pg_dump &>/dev/null; then
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=custom --compress=6 \
    -f "$BACKUP_DIR/database/db_${TIMESTAMP}.dump" 2>/dev/null && \
    log "Database backup: db_${TIMESTAMP}.dump" || \
    log "WARNING: Database backup failed"
else
  log "WARNING: pg_dump not found, skipping database backup"
fi

# 2. Configuration backup
log "Backing up configuration..."
tar -czf "$BACKUP_DIR/config/config_${TIMESTAMP}.tar.gz" \
  -C "$APP_DIR" \
  .env \
  deploy/systemd/*.service \
  deploy/nginx/*.conf \
  2>/dev/null && \
  log "Configuration backup: config_${TIMESTAMP}.tar.gz" || \
  log "WARNING: Configuration backup failed"

# 3. Log archive
log "Archiving logs..."
tar -czf "$BACKUP_DIR/logs/logs_${TIMESTAMP}.tar.gz" \
  -C "$APP_DIR" logs/ \
  2>/dev/null && \
  log "Log archive: logs_${TIMESTAMP}.tar.gz" || \
  log "WARNING: Log archive failed"

# 4. Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# 5. Backup verification
log "Verifying backups..."
LATEST_DB=$(ls -t "$BACKUP_DIR/database/"*.dump 2>/dev/null | head -1)
if [ -n "$LATEST_DB" ]; then
  DB_SIZE=$(du -h "$LATEST_DB" | cut -f1)
  log "Latest DB backup: $(basename "$LATEST_DB") ($DB_SIZE)"
else
  log "WARNING: No database backups found"
fi

LATEST_CONFIG=$(ls -t "$BACKUP_DIR/config/"*.tar.gz 2>/dev/null | head -1)
if [ -n "$LATEST_CONFIG" ]; then
  CONFIG_SIZE=$(du -h "$LATEST_CONFIG" | cut -f1)
  log "Latest config backup: $(basename "$LATEST_CONFIG") ($CONFIG_SIZE)"
fi

# 6. Disk usage report
DISK_USAGE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
log "Total backup size: $DISK_USAGE ($BACKUP_COUNT files)"

log "=== Backup Complete ==="
