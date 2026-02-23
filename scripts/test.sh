#!/usr/bin/env bash
# =============================================================================
# EpicWeave — Run Tests Locally
# Usage: ./scripts/test.sh [--unit | --bdd | --e2e | --load | --coverage | --all]
# Default: unit + bdd
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="default"

for arg in "$@"; do
  case $arg in
    --unit)     MODE="unit" ;;
    --bdd)      MODE="bdd" ;;
    --e2e)      MODE="e2e" ;;
    --load)     MODE="load" ;;
    --coverage) MODE="coverage" ;;
    --all)      MODE="all" ;;
  esac
done

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[test]${NC} $*"; }
warn()    { echo -e "${YELLOW}[test]${NC} $*"; }
error()   { echo -e "${RED}[test] ERROR${NC} $*" >&2; exit 1; }
section() { echo -e "\n${GREEN}━━━ $* ━━━${NC}"; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || error "node not found. Install Node.js 20."
command -v npm  >/dev/null 2>&1 || error "npm not found."

# ── Install test deps if needed ───────────────────────────────────────────────
if [ ! -d "$ROOT_DIR/tests/node_modules" ]; then
  info "Installing test dependencies..."
  npm install --prefix "$ROOT_DIR/tests" --silent
fi

# ── Set environment variables for tests ───────────────────────────────────────
ENV_FILE="$ROOT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  info "Loading environment from .env.local..."
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
else
  warn ".env.local not found — tests using environment as-is."
fi

export API_ENDPOINT="${NEXT_PUBLIC_API_ENDPOINT:-http://localhost:3001}"
export COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-}"
export COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:-}"
export DYNAMODB_TABLE_NAME="${DYNAMODB_TABLE_NAME:-EpicWeaveTable-dev}"
export AWS_REGION="${AWS_REGION:-us-east-1}"

PASS=0; FAIL=0

run_suite() {
  local name="$1"; local cmd="$2"
  section "$name"
  if eval "$cmd"; then
    info "✅  $name passed"
    PASS=$((PASS + 1))
  else
    warn "❌  $name FAILED (exit $?)"
    FAIL=$((FAIL + 1))
  fi
}

# ── Run suites ────────────────────────────────────────────────────────────────
case "$MODE" in
  unit)
    run_suite "Unit Tests (vitest)" "npm run test:unit --prefix '$ROOT_DIR/tests'"
    ;;
  bdd)
    run_suite "BDD Tests (cucumber)" "npm run test:bdd --prefix '$ROOT_DIR/tests'"
    ;;
  e2e)
    command -v npx >/dev/null 2>&1 || error "npx not found."
    info "Checking Playwright browsers are installed..."
    npx --prefix "$ROOT_DIR/tests" playwright install --with-deps chromium 2>/dev/null || true
    run_suite "E2E Tests (playwright)" "npm run test:e2e --prefix '$ROOT_DIR/tests'"
    ;;
  load)
    command -v k6 >/dev/null 2>&1 || error "k6 not found. Install: brew install k6"
    run_suite "Load Tests (k6)" "npm run test:load --prefix '$ROOT_DIR/tests'"
    ;;
  coverage)
    run_suite "Unit Tests with Coverage" "npm run test:coverage --prefix '$ROOT_DIR/tests'"
    ;;
  all)
    run_suite "Unit Tests (vitest)"    "npm run test:unit --prefix '$ROOT_DIR/tests'"
    run_suite "BDD Tests (cucumber)"   "npm run test:bdd --prefix '$ROOT_DIR/tests'"
    if command -v k6 >/dev/null 2>&1; then
      run_suite "Load Tests (k6)"      "npm run test:load --prefix '$ROOT_DIR/tests'"
    else
      warn "k6 not installed — skipping load tests. Install: brew install k6"
    fi
    ;;
  default)
    run_suite "Unit Tests (vitest)"  "npm run test:unit --prefix '$ROOT_DIR/tests'"
    run_suite "BDD Tests (cucumber)" "npm run test:bdd --prefix '$ROOT_DIR/tests'"
    ;;
esac

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Summary: ${PASS} passed / ${FAIL} failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ "$FAIL" -eq 0 ] || exit 1
