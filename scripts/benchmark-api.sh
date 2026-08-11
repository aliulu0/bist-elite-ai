#!/usr/bin/env bash
# ==========================================================
# API Latency Benchmarks
# Measures response times for key endpoints
# ==========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:5173}"
ITERATIONS="${ITERATIONS:-20}"
RESULTS_DIR="$PROJECT_ROOT/docs/benchmarks"

mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="$RESULTS_DIR/benchmark-$TIMESTAMP.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "=== API Latency Benchmarks ==="
echo "Target: $API_URL"
echo "Iterations: $ITERATIONS"
echo ""

measure_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local body="${4:-}"

  local times=()
  local successes=0
  local failures=0
  local status_code=0

  for i in $(seq 1 "$ITERATIONS"); do
    local start_ms
    start_ms=$(date +%s%N)

    if [ -n "$body" ]; then
      status_code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "$url" \
        -H 'Content-Type: application/json' \
        -d "$body" 2>/dev/null || echo "000")
    else
      status_code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "$url" 2>/dev/null || echo "000")
    fi

    local end_ms
    end_ms=$(date +%s%N)
    local duration_ms=$(( (end_ms - start_ms) / 1000000 ))

    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 400 ]; then
      times+=("$duration_ms")
      ((successes++))
    else
      ((failures++))
    fi
  done

  if [ ${#times[@]} -eq 0 ]; then
    echo "  ${RED}$name${NC}: All ${ITERATIONS} requests failed"
    echo "{\"name\":\"$name\",\"method\":\"$method\",\"url\":\"$url\",\"success\":false,\"failures\":$failures}"
    return
  fi

  # Sort times for percentile calculation
  IFS=$'\n' sorted=($(sort -n <<<"${times[*]}")); unset IFS
  local count=${#sorted[@]}
  local sum=0
  for t in "${sorted[@]}"; do sum=$((sum + t)); done
  local avg=$((sum / count))
  local p50_idx=$(( (count * 50) / 100 ))
  local p95_idx=$(( (count * 95) / 100 ))
  local p99_idx=$(( (count * 99) / 100 ))
  local min="${sorted[0]}"
  local max="${sorted[$((count - 1))]}"
  local p50="${sorted[$p50_idx]}"
  local p95="${sorted[$p95_idx]}"
  local p99="${sorted[$p99_idx]}"

  if [ "$avg" -lt 100 ]; then
    color=$GREEN
  elif [ "$avg" -lt 500 ]; then
    color=$YELLOW
  else
    color=$RED
  fi

  echo -e "  ${color}$name${NC}: avg=${avg}ms p50=${p50}ms p95=${p95}ms p99=${p99}ms min=${min}ms max=${max}ms (${successes}/${ITERATIONS} ok)"

  echo "{\"name\":\"$name\",\"method\":\"$method\",\"url\":\"$url\",\"success\":true,\"iterations\":$ITERATIONS,\"successes\":$successes,\"failures\":$failures,\"avg\":$avg,\"p50\":$p50,\"p95\":$p95,\"p99\":$p99,\"min\":$min,\"max\":$max}"
}

echo "--- API Endpoints ---"
RESULTS=()
RESULTS+=("$(measure_endpoint "GET /health" "GET" "$API_URL/health")")
RESULTS+=("$(measure_endpoint "GET /health/ready" "GET" "$API_URL/health/ready")")
RESULTS+=("$(measure_endpoint "GET /health/live" "GET" "$API_URL/health/live")")
RESULTS+=("$(measure_endpoint "GET /api/auth/status" "GET" "$API_URL/api/auth/status")")
RESULTS+=("$(measure_endpoint "GET /api/metrics" "GET" "$API_URL/api/metrics")")
RESULTS+=("$(measure_endpoint "GET /api/scheduler" "GET" "$API_URL/api/scheduler")")

echo ""
echo "--- Web Frontend ---"
WEB_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL" 2>/dev/null || echo "000")
if [ "$WEB_STATUS" -ge 200 ] && [ "$WEB_STATUS" -lt 400 ]; then
  echo -e "  ${GREEN}Web frontend${NC}: responding (HTTP $WEB_STATUS)"
else
  echo -e "  ${YELLOW}Web frontend${NC}: not available (HTTP $WEB_STATUS)"
fi

echo ""
echo "--- Generating Report ---"

# Build JSON report
{
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"config\": {"
  echo "    \"apiUrl\": \"$API_URL\","
  echo "    \"iterations\": $ITERATIONS"
  echo "  },"
  echo "  \"results\": ["
  for i in "${!RESULTS[@]}"; do
    if [ "$i" -gt 0 ]; then echo "    ,"; fi
    echo -n "    ${RESULTS[$i]}"
  done
  echo ""
  echo "  ]"
  echo "}"
} > "$REPORT"

echo "Report saved to: $REPORT"
echo ""
echo "=== Benchmark Complete ==="
