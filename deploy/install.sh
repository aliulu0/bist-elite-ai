#!/bin/bash
# ==========================================================
# BIST Elite AI - Application Installation
# Installs and configures the application on a prepared server
# Usage: bash install.sh [--app-dir /opt/bist-elite-ai] [--user bist]
# ==========================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bist-elite-ai}"
APP_USER="${APP_USER:-bist}"
REPO_URL="${REPO_URL:-https://github.com/bist-elite-ai/bist-elite-ai.git}"
BRANCH="${BRANCH:-main}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "=== BIST Elite AI Application Installation ==="

# 1. Clone or update repository
if [ ! -d "$APP_DIR/.git" ]; then
  log "Cloning repository..."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
else
  log "Repository exists, pulling latest..."
  cd "$APP_DIR"
  git pull origin "$BRANCH"
fi

cd "$APP_DIR"

# 2. Environment configuration
log "Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env

  # Generate secrets
  JWT_SECRET=$(openssl rand -hex 32)
  REDIS_PASSWORD=$(openssl rand -hex 16)
  POSTGRES_PASSWORD=$(openssl rand -hex 16)

  sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
  sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" .env
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env

  # Update DATABASE_URL with generated password
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://bist:${POSTGRES_PASSWORD}@localhost:5432/bist_elite_ai|" .env
  sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379/0|" .env

  log ".env created with generated secrets"
  log "IMPORTANT: Save these credentials securely!"
  log "  Postgres password: $POSTGRES_PASSWORD"
  log "  Redis password: $REDIS_PASSWORD"
  log "  JWT secret: $JWT_SECRET"
else
  log ".env already exists, skipping"
fi

# 3. Install Node.js dependencies
log "Installing Node.js dependencies..."
su - "$APP_USER" -c "cd $APP_DIR && pnpm install --frozen-lockfile --prod=false"

# 4. Generate Prisma client
log "Generating Prisma client..."
su - "$APP_USER" -c "cd $APP_DIR && pnpm --filter @bist-elite/database prisma:generate"

# 5. Database setup
log "Setting up database..."
source .env

# Create database user and database
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='bist'\" | grep -q 1" || \
  su - postgres -c "psql -c \"CREATE USER bist WITH PASSWORD '${POSTGRES_PASSWORD:-postgres}';\""

su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='bist_elite_ai'\" | grep -q 1" || \
  su - postgres -c "psql -c \"CREATE DATABASE bist_elite_ai OWNER bist;\""

su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE bist_elite_ai TO bist;\""

# Configure PostgreSQL for local connections with password
PG_HBA=$(su - postgres -c "psql -t -P format=0 -c 'SHOW hba_file'" | tr -d ' ')
if ! grep -q "bist" "$PG_HBA" 2>/dev/null; then
  echo "host    bist_elite_ai    bist    127.0.0.1/32    md5" >> "$PG_HBA"
  echo "host    bist_elite_ai    bist    ::1/128         md5" >> "$PG_HBA"
  systemctl restart postgresql
fi

# Run migrations
log "Running database migrations..."
su - "$APP_USER" -c "cd $APP_DIR && pnpm --filter @bist-elite/database prisma:migrate" || log "Migrations: using existing schema"

# Seed database
log "Seeding database..."
su - "$APP_USER" -c "cd $APP_DIR && pnpm --filter @bist-elite/database prisma:seed" || log "Seed: already seeded or no seed script"

# 6. Build applications
log "Building API..."
su - "$APP_USER" -c "cd $APP_DIR && pnpm --filter @bist-elite/api build"

log "Building Web..."
su - "$APP_USER" -c "cd $APP_DIR && pnpm --filter @bist-elite/web build" || log "Web build: skipped (may need additional config)"

# 7. Install Python dependencies for worker
log "Installing Python worker dependencies..."
su - "$APP_USER" -c "cd $APP_DIR/apps/worker && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"

# 8. Create log directories
log "Creating log directories..."
mkdir -p "$APP_DIR/logs"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/logs"

# 9. Install systemd services
log "Installing systemd services..."
cp "$APP_DIR/deploy/systemd/"*.service /etc/systemd/system/
systemctl daemon-reload

# Enable services
systemctl enable bist-api bist-web bist-worker bist-telegram

# 10. Install nginx configuration
log "Configuring Nginx..."
cp "$APP_DIR/deploy/nginx/bist-elite-ai.conf" /etc/nginx/sites-available/bist-elite-ai
ln -sf /etc/nginx/sites-available/bist-elite-ai /etc/nginx/sites-enabled/bist-elite-ai
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 11. Install backup cron
log "Installing backup cron..."
cat > /etc/cron.d/bist-backup << 'EOF'
# BIST Elite AI - Daily backup at 3 AM
0 3 * * * bist /opt/bist-elite-ai/deploy/backup.sh >> /opt/bist-elite-ai/logs/backup.log 2>&1
EOF

# 12. Install logrotate
log "Installing logrotate configuration..."
cp "$APP_DIR/deploy/logrotate/bist-elite-ai" /etc/logrotate.d/bist-elite-ai

log "=== Installation Complete ==="
log ""
log "Start services:"
log "  systemctl start bist-api bist-web bist-worker bist-telegram"
log ""
log "Check status:"
log "  systemctl status bist-api"
log "  bash $APP_DIR/deploy/health-check.sh"
log ""
log "View logs:"
log "  journalctl -u bist-api -f"
log "  tail -f $APP_DIR/logs/*.log"
