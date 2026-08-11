#!/usr/bin/env bash
# ==========================================================
# BIST Elite AI - Smoke Test
# Quick validation of all system components
# ==========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
PASSED=0
FAILED=0
WARNED=0

pass() { echo -e "  ${GREEN}PASS${NC}: $1"; ((PASSED++)); }
fail() { echo -e "  ${RED}FAIL${NC}: $1"; ((FAILED++)); }
warn() { echo -e "  ${YELLOW}WARN${NC}: $1"; ((WARNED++)); }
section() { echo -e "\n${CYAN}=== $1 ===${NC}"; }

API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:5173}"
TIMEOUT="${TIMEOUT:-5}"

echo "============================================="
echo "  BIST Elite AI - Smoke Test"
echo "  $(date)"
echo "============================================="

# ==========================================================
section "1. Project Structure"
# ==========================================================

[ -f "package.json" ] && pass "Root package.json exists" || fail "Root package.json missing"
[ -f "pnpm-workspace.yaml" ] && pass "pnpm-workspace.yaml exists" || fail "pnpm-workspace.yaml missing"
[ -f "turbo.json" ] && pass "turbo.json exists" || fail "turbo.json missing"
[ -d "apps/api" ] && pass "apps/api directory exists" || fail "apps/api missing"
[ -d "apps/web" ] && pass "apps/web directory exists" || fail "apps/web missing"
[ -d "packages/database" ] && pass "packages/database directory exists" || fail "packages/database missing"
[ -d "packages/shared" ] && pass "packages/shared directory exists" || fail "packages/shared missing"
[ -f "docker-compose.yml" ] && pass "docker-compose.yml exists" || fail "docker-compose.yml missing"
[ -f "docker/Dockerfile.api" ] && pass "Dockerfile.api exists" || fail "Dockerfile.api missing"
[ -f "docker/Dockerfile.web" ] && pass "Dockerfile.web exists" || fail "Dockerfile.web missing"
[ -f "docker/Dockerfile.scheduler" ] && pass "Dockerfile.scheduler exists" || fail "Dockerfile.scheduler missing"

# ==========================================================
section "2. Source Code Validation"
# ==========================================================

API_MAIN="apps/api/src/main.ts"
APP_MODULE="apps/api/src/app.module.ts"
HEALTH_CTRL="apps/api/src/health.controller.ts"
HEALTH_SVC="apps/api/src/common/monitoring/health.service.ts"

[ -f "$API_MAIN" ] && pass "main.ts exists" || fail "main.ts missing"
[ -f "$APP_MODULE" ] && pass "app.module.ts exists" || fail "app.module.ts missing"
[ -f "$HEALTH_CTRL" ] && pass "health.controller.ts exists" || fail "health.controller.ts missing"
[ -f "$HEALTH_SVC" ] && pass "health.service.ts exists" || fail "health.service.ts missing"

CONTROLLER_COUNT=$(find apps/api/src -name "*.controller.ts" | wc -l)
if [ "$CONTROLLER_COUNT" -ge 10 ]; then
  pass "Controller count: $CONTROLLER_COUNT (>= 10 expected)"
else
  warn "Controller count: $CONTROLLER_COUNT (expected >= 10)"
fi

MODULE_COUNT=$(find apps/api/src/modules -maxdepth 1 -mindepth 1 -type d | wc -l)
if [ "$MODULE_COUNT" -ge 20 ]; then
  pass "Module count: $MODULE_COUNT (>= 20 expected)"
else
  warn "Module count: $MODULE_COUNT (expected >= 20)"
fi

# ==========================================================
section "3. Prisma Schema"
# ==========================================================

PRISMA_SCHEMA="packages/database/prisma/schema.prisma"
if [ -f "$PRISMA_SCHEMA" ]; then
  pass "Prisma schema exists"
  MODEL_COUNT=$(grep -c "^model " "$PRISMA_SCHEMA" 2>/dev/null || echo "0")
  if [ "$MODEL_COUNT" -ge 5 ]; then
    pass "Prisma models: $MODEL_COUNT"
  else
    warn "Prisma models: $MODEL_COUNT (expected >= 5)"
  fi
else
  fail "Prisma schema missing"
fi

# ==========================================================
section "4. API Health Endpoints"
# ==========================================================

HEALTH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout "$TIMEOUT" "$API_URL/health" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
  pass "GET /health → 200"

  HEALTH_BODY=$(curl -s --connect-timeout "$TIMEOUT" "$API_URL/health" 2>/dev/null || echo "{}")
  HEALTH_FIELD=$(echo "$HEALTH_BODY" | grep -o '"status"' || echo "")
  if [ -n "$HEALTH_FIELD" ]; then
    pass "Health response has 'status' field"
  else
    fail "Health response missing 'status' field"
  fi
else
  fail "GET /health → $HEALTH_STATUS (expected 200)"
fi

READY_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout "$TIMEOUT" "$API_URL/health/ready" 2>/dev/null || echo "000")
if [ "$READY_STATUS" = "200" ]; then
  pass "GET /health/ready → 200"
else
  fail "GET /health/ready → $READY_STATUS (expected 200)"
fi

LIVE_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout "$TIMEOUT" "$API_URL/health/live" 2>/dev/null || echo "000")
if [ "$LIVE_STATUS" = "200" ]; then
  pass "GET /health/live → 200"
else
  fail "GET /health/live → $LIVE_STATUS (expected 200)"
fi

# ==========================================================
section "5. API Endpoints (404 Handling)"
# ==========================================================

NOT_FOUND=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout "$TIMEOUT" "$API_URL/nonexistent" 2>/dev/null || echo "000")
if [ "$NOT_FOUND" = "404" ]; then
  pass "GET /nonexistent → 404 (correct 404 handling)"
else
  fail "GET /nonexistent → $NOT_FOUND (expected 404)"
fi

# ==========================================================
section "6. Docker Container Status"
# ==========================================================

if command -v docker &> /dev/null; then
  for container in bist-postgres bist-redis bist-api bist-scheduler bist-web; do
    STATE=$(docker inspect --format '{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    if [ "$STATE" = "running" ]; then
      pass "Container $container: running"
    elif [ "$STATE" = "not_found" ]; then
      warn "Container $container: not found (Docker may not be running)"
    else
      fail "Container $container: $STATE"
    fi
  done
else
  warn "Docker not available, skipping container checks"
fi

# ==========================================================
section "7. Web Frontend"
# ==========================================================

WEB_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout "$TIMEOUT" "$WEB_URL" 2>/dev/null || echo "000")
if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "304" ]; then
  pass "Web frontend responding (HTTP $WEB_STATUS)"
else
  warn "Web frontend not responding (HTTP $WEB_STATUS)"
fi

# ==========================================================
section "8. CI/CD Configuration"
# ==========================================================

[ -f ".github/workflows/ci.yml" ] && pass "CI workflow exists" || fail "CI workflow missing"
[ -f ".github/workflows/docker.yml" ] && pass "Docker workflow exists" || fail "Docker workflow missing"
[ -f ".github/workflows/security.yml" ] && pass "Security workflow exists" || fail "Security workflow missing"
[ -f ".github/workflows/integration.yml" ] && pass "Integration workflow exists" || warn "Integration workflow missing"

# ==========================================================
section "9. Build Artifacts"
# ==========================================================

if [ -f "apps/api/package.json" ]; then
  API_HAS_NEST=$(grep -c '"@nestjs' apps/api/package.json 2>/dev/null || echo "0")
  if [ "$API_HAS_NEST" -gt 0 ]; then
    pass "API uses NestJS framework"
  else
    fail "API missing NestJS dependency"
  fi
fi

if [ -f "apps/web/package.json" ]; then
  WEB_HAS_VITE=$(grep -c '"vite"' apps/web/package.json 2>/dev/null || echo "0")
  if [ "$WEB_HAS_VITE" -gt 0 ]; then
    pass "Web uses Vite build tool"
  else
    fail "Web missing Vite dependency"
  fi
fi

# ==========================================================
section "Summary"
# ==========================================================

echo ""
echo "============================================="
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "  ${YELLOW}Warned: $WARNED${NC}"
echo "============================================="

if [ "$FAILED" -gt 0 ]; then
  echo -e "\n${RED}SMOKE TEST FAILED${NC}"
  exit 1
else
  echo -e "\n${GREEN}SMOKE TEST PASSED${NC}"
  exit 0
fi
