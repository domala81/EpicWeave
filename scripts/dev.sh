#!/usr/bin/env bash
# =============================================================================
# EpicWeave — AWS-connected Frontend Dev
# Usage: ./scripts/dev.sh
#
# Starts Next.js frontend only (port 3000), pointing at the deployed AWS backend.
# Requires a deployed backend (run make deploy first).
#
# For fully local testing with NO AWS, use:  ./scripts/local.sh  (or make local)
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[dev]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev]${NC} $*"; }
error() { echo -e "${RED}[dev] ERROR${NC} $*" >&2; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || error "node not found. Install Node.js 20."
command -v npm  >/dev/null 2>&1 || error "npm not found."

# ── Check .env.local ──────────────────────────────────────────────────────────
ENV_FILE="$ROOT_DIR/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  warn ".env.local not found — creating from .env.example..."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  warn "Edit $ENV_FILE with your AWS values, then re-run."
  exit 1
fi

# ── Install frontend deps if needed ──────────────────────────────────────────
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  info "Installing frontend dependencies..."
  npm install --prefix "$ROOT_DIR/frontend" --silent
fi

# ── Ensure frontend/.env.local symlink ───────────────────────────────────────
if [ ! -e "$ROOT_DIR/frontend/.env.local" ]; then
  ln -sf "$ROOT_DIR/.env.local" "$ROOT_DIR/frontend/.env.local"
fi

# ── Free up port 3000 ────────────────────────────────────────────────────────
if lsof -i ":3000" -sTCP:LISTEN -t >/dev/null 2>&1; then
  warn "Port 3000 already in use — freeing it..."
  lsof -i ":3000" -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
  sleep 1
fi

info "Starting Next.js frontend on http://localhost:3000 (pointing at AWS API)..."
info "For local-only testing with no AWS: use  ./scripts/local.sh  instead"
echo ""

exec npm run dev --prefix "$ROOT_DIR/frontend"
