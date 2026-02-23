#!/usr/bin/env bash
# =============================================================================
# EpicWeave — Run Frontend Locally
# Usage: ./scripts/dev.sh [--port 3000]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=3000

for arg in "$@"; do
  case $arg in
    --port) PORT="$2"; shift ;;
  esac
done

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
  warn ".env.local not found — copying from .env.example..."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  warn "Edit $ENV_FILE with your actual values before running the app."
fi

# ── Install deps if needed ────────────────────────────────────────────────────
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  info "Installing frontend dependencies..."
  npm install --prefix "$ROOT_DIR/frontend" --silent
fi

# ── Copy env to frontend dir (Next.js reads from project root) ────────────────
if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  info "Symlinking .env.local into frontend/..."
  ln -sf "$ROOT_DIR/.env.local" "$ROOT_DIR/frontend/.env.local"
fi

# ── Kill any process already using the port ───────────────────────────────────
if lsof -i ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  warn "Port $PORT already in use — killing existing process..."
  lsof -i ":$PORT" -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
  sleep 1
fi

info "Starting Next.js dev server on http://localhost:${PORT} ..."
info "Press Ctrl+C to stop."
echo ""

exec npm run dev --prefix "$ROOT_DIR/frontend"
