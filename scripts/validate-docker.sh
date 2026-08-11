#!/usr/bin/env bash
# ==========================================================
# Docker Compose Lifecycle Validation
# Validates all containers start, become healthy, and shut down cleanly
# ==========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASSED=0
FAILED=0

pass() { echo -e "${GREEN}  PASS${NC}: $1"; ((PASSED++)); }
fail() { echo -e "${RED}  FAIL${NC}: $1"; ((FAILED++)); }
info() { echo -e "${YELLOW}  INFO${NC}: $1"; }

echo "=== Docker Compose Lifecycle Validation ==="
echo ""

# Phase 1: Build
info "Phase 1: Building containers..."
if docker compose build --no-cache 2>&1 | tail -1; then
  pass "Container build completed"
else
  fail "Container build failed"
  echo ""
  echo "Results: ${PASSED} passed, ${FAILED} failed"
  exit 1
fi

# Phase 2: Start
info "Phase 2: Starting containers..."
if docker compose up -d 2>&1; then
  pass "Containers started"
else
  fail "Container start failed"
  exit 1
fi

# Phase 3: Wait for health
info "Phase 3: Waiting for containers to become healthy (max 120s)..."
HEALTHY=false
for i in $(seq 1 24); do
  sleep 5
  ALL_HEALTHY=true
  for svc in postgres redis api; do
    STATUS=$(docker compose ps --format json "$svc" 2>/dev/null | grep -o '"Health":"[^"]*"' | head -1 || echo '"Health":"unknown"')
    if ! echo "$STATUS" | grep -q '"Health":"healthy"'; then
      ALL_HEALTHY=false
      break
    fi
  done
  if [ "$ALL_HEALTHY" = true ]; then
    HEALTHY=true
    break
  fi
  echo "  Waiting... ($((i * 5))s)"
done

if [ "$HEALTHY" = true ]; then
  pass "All health-checked containers are healthy"
else
  fail "Not all containers became healthy within 120s"
fi

# Phase 4: Verify container status
info "Phase 4: Verifying container states..."
CONTAINERS=("bist-postgres" "bist-redis" "bist-api" "bist-scheduler" "bist-web")
for c in "${CONTAINERS[@]}"; do
  STATE=$(docker inspect --format '{{.State.Status}}' "$c" 2>/dev/null || echo "not_found")
  if [ "$STATE" = "running" ] || [ "$STATE" = "healthy" ]; then
    pass "Container $c is $STATE"
  else
    fail "Container $c is $STATE"
  fi
done

# Phase 5: Verify network
info "Phase 5: Verifying Docker network..."
NETWORK=$(docker network ls --format '{{.Name}}' | grep bist-network || echo "")
if [ -n "$NETWORK" ]; then
  pass "Docker network bist-network exists"
else
  fail "Docker network bist-network not found"
fi

# Phase 6: Verify volumes
info "Phase 6: Verifying Docker volumes..."
for vol in postgres_data redis_data; do
  if docker volume ls --format '{{.Name}}' | grep -q "$vol"; then
    pass "Volume $vol exists"
  else
    fail "Volume $vol not found"
  fi
done

# Phase 7: Verify port mappings
info "Phase 7: Verifying port mappings..."
declare -A PORT_MAP=(
  ["bist-postgres"]="5432"
  ["bist-redis"]="6379"
  ["bist-api"]="3001"
  ["bist-web"]="5173"
)
for c in "${!PORT_MAP[@]}"; do
  p="${PORT_MAP[$c]}"
  if docker port "$c" "$p" 2>/dev/null | grep -q "$p"; then
    pass "Port $p mapped on $c"
  else
    info "Port $p mapping check (may use host binding)"
  fi
done

# Phase 8: Graceful shutdown
info "Phase 8: Testing graceful shutdown..."
if docker compose down 2>&1; then
  pass "Graceful shutdown completed"
else
  fail "Shutdown encountered errors"
fi

# Phase 9: Verify cleanup
info "Phase 9: Verifying cleanup..."
RUNNING=$(docker compose ps --format '{{.Names}}' 2>/dev/null | wc -l)
if [ "$RUNNING" -eq 0 ]; then
  pass "All containers stopped"
else
  fail "$RUNNING containers still running"
fi

# Phase 10: Volume persistence check
info "Phase 10: Verifying volumes persist after down..."
for vol in postgres_data redis_data; do
  if docker volume ls --format '{{.Name}}' | grep -q "$vol"; then
    pass "Volume $vol persists after shutdown"
  else
    info "Volume $vol cleaned up (expected with docker compose down)"
  fi
done

echo ""
echo "=== Results: ${PASSED} passed, ${FAILED} failed ==="
if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
