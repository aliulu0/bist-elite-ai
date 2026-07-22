#!/bin/bash
# ==========================================================
# BIST Elite AI - Ubuntu Server Setup
# Target: Ubuntu 22.04/24.04 LTS, 2 CPU, 2GB RAM minimum
# Usage: sudo bash setup-server.sh
# ==========================================================
set -euo pipefail

APP_USER="${APP_USER:-bist}"
APP_DIR="${APP_DIR:-/opt/bist-elite-ai}"
NODE_VERSION="20"
PYTHON_VERSION="3.12"
POSTGRES_VERSION="16"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "=== BIST Elite AI Server Setup ==="

# 1. System update
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# 2. Essential packages
log "Installing essential packages..."
apt-get install -y -qq \
  curl wget git unzip build-essential \
  software-properties-common apt-transport-https ca-certificates \
  gnupg lsb-release ufw fail2ban \
  logrotate htop iotop

# 3. Create app user
log "Creating application user: $APP_USER..."
if ! id "$APP_USER" &>/dev/null; then
  adduser --system --group --home "$APP_DIR" --shell /bin/bash "$APP_USER"
  log "User $APP_USER created"
else
  log "User $APP_USER already exists"
fi

# 4. Node.js
log "Installing Node.js $NODE_VERSION..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y -qq nodejs
  npm install -g pnpm@9
  log "Node.js $(node --version) and pnpm $(pnpm --version) installed"
else
  log "Node.js already installed: $(node --version)"
fi

# 5. Python
log "Installing Python $PYTHON_VERSION..."
if ! command -v python3 &>/dev/null; then
  add-apt-repository -y ppa:deadsnakes/ppa
  apt-get install -y -qq python${PYTHON_VERSION} python${PYTHON_VERSION}-venv python3-pip
  update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1
  log "Python $(python3 --version) installed"
else
  log "Python already installed: $(python3 --version)"
fi

# 6. PostgreSQL
log "Installing PostgreSQL $POSTGRES_VERSION..."
if ! command -v psql &>/dev/null; then
  sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg
  apt-get update -qq
  apt-get install -y -qq postgresql-${POSTGRES_VERSION} postgresql-client-${POSTGRES_VERSION}
  systemctl enable postgresql
  log "PostgreSQL $POSTGRES_VERSION installed"
else
  log "PostgreSQL already installed"
fi

# 7. Redis
log "Installing Redis..."
if ! command -v redis-cli &>/dev/null; then
  apt-get install -y -qq redis-server
  systemctl enable redis-server
  log "Redis installed"
else
  log "Redis already installed"
fi

# 8. Nginx
log "Installing Nginx..."
if ! command -v nginx &>/dev/null; then
  apt-get install -y -qq nginx
  systemctl enable nginx
  log "Nginx installed"
else
  log "Nginx already installed"
fi

# 9. Firewall
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configured (SSH, HTTP, HTTPS)"

# 10. Fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# 11. Swap (for 2GB RAM systems)
log "Configuring swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
  log "2GB swap created"
else
  log "Swap already configured"
fi

# 12. Node.js memory optimization
log "Configuring Node.js memory limits..."
cat > /etc/sysctl.d/99-bist.conf << 'EOF'
vm.swappiness=10
net.core.somaxconn=1024
net.ipv4.tcp_max_syn_backlog=1024
fs.file-max=65535
EOF
sysctl --system

# 13. Log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/bist-elite-ai << 'EOF'
/opt/bist-elite-ai/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 bist bist
    sharedscripts
    postrotate
        systemctl reload bist-api bist-worker bist-telegram 2>/dev/null || true
    endscript
}
EOF

log "=== Server Setup Complete ==="
log ""
log "Next steps:"
log "  1. Run: bash deploy/install.sh"
log "  2. Configure: cp .env.example .env && nano .env"
log "  3. Start: systemctl start bist-api bist-web bist-worker bist-telegram"
