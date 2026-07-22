#!/bin/bash
# ==========================================================
# BIST Elite AI - Health Check Script
# Usage: bash health-check.sh
# ==========================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bist-elite-ai}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() { echo -e "  ${GREEN}PASS${NC} $1"; }
check_fail() { echo -e "  ${RED}FAIL${NC} $1"; FAILURES=$((FAILURES + 1)); }
check_warn() { echo -e "  ${YELLOW}WARN${NC} $1"; }

FAILURES=0

echo "========================================="
echo " BIST Elite AI - Health Check"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# System services
echo "System Services:"
for svc in bist-api bist-web bist-worker bist-telegram; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    check_pass "$svc (running)"
  else
    check_fail "$svc (not running)"
  fi
done

for svc in postgresql redis-server nginx; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    check_pass "$svc (running)"
  else
    check_warn "$svc (not running - may use Docker)"
  fi
done
echo ""

# Endpoints
echo "Endpoints:"
for endpoint in \
  "API Health|http://localhost:3001/health" \
  "API Ready|http://localhost:3001/health/ready" \
  "API Live|http://localhost:3001/health/live" \
  "Web App|http://localhost:3000" \
  "Worker Health|http://localhost:8000/health" \
; do
  name="${endpoint%%|*}"
  url="${endpoint##*|}"
  if curl -sf --max-time 3 "$url" > /dev/null 2>&1; then
    check_pass "$name ($url)"
  else
    check_fail "$name ($url)"
  fi
done
echo ""

# Database
echo "Database:"
if command -v psql &>/dev/null; then
  if su - postgres -c "pg_isready" &>/dev/null; then
    check_pass "PostgreSQL accepting connections"
  else
    check_fail "PostgreSQL not accepting connections"
  fi
else
  check_warn "psql not found (Docker mode?)"
fi
echo ""

# Redis
echo "Redis:"
if command -v redis-cli &>/dev/null; then
  if redis-cli ping 2>/dev/null | grep -q PONG; then
    check_pass "Redis responding (PONG)"
  else
    check_fail "Redis not responding"
  fi
else
  check_warn "redis-cli not found (Docker mode?)"
fi
echo ""

# Disk
echo "Disk Usage:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
  check_pass "Root filesystem: ${DISK_USAGE}% used"
elif [ "$DISK_USAGE" -lt 90 ]; then
  check_warn "Root filesystem: ${DISK_USAGE}% used (elevated)"
else
  check_fail "Root filesystem: ${DISK_USAGE}% used (critical)"
fi

# Memory
echo ""
echo "Memory:"
MEM_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 80 ]; then
  check_pass "Memory: ${MEM_USAGE}% used"
elif [ "$MEM_USAGE" -lt 90 ]; then
  check_warn "Memory: ${MEM_USAGE}% used (elevated)"
else
  check_fail "Memory: ${MEM_USAGE}% used (critical)"
fi

echo ""
echo "========================================="
if [ "$FAILURES" -eq 0 ]; then
  echo -e " ${GREEN}All checks passed${NC}"
else
  echo -e " ${RED}$FAILURES check(s) failed${NC}"
fi
echo "========================================="

exit $FAILURES
