#!/usr/bin/env bash
# =============================================================================
# EpicWeave — Local Dev (NO AWS, NO deployment)
# Usage: ./scripts/local.sh
#
# Starts:
#   1. Local API server  → http://localhost:3001  (Express + OpenAI DALL-E)
#   2. Next.js frontend  → http://localhost:3000
#
# No Cognito, no DynamoDB, no Stripe, no SQS, no AWS at all.
# Session fee always bypassed. Login: dev@epicweave.local / password123
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[local]${NC} $*"; }
warn()  { echo -e "${YELLOW}[local]${NC} $*"; }
error() { echo -e "${RED}[local] ERROR${NC} $*" >&2; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || error "node not found. Install Node.js 20."
command -v npm  >/dev/null 2>&1 || error "npm not found."

# ── Check .env.local ──────────────────────────────────────────────────────────
ENV_FILE="$ROOT_DIR/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  warn ".env.local not found — creating from .env.example..."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  warn ""
  warn "  ⚠️  Set OPENAI_API_KEY in .env.local then re-run this script."
  warn ""
  exit 1
fi

# ── Check OPENAI_API_KEY ──────────────────────────────────────────────────────
OPENAI_KEY=$(grep -E '^OPENAI_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
if [ -z "$OPENAI_KEY" ] || [ "$OPENAI_KEY" = "sk-..." ]; then
  error "OPENAI_API_KEY not set in .env.local\n\n  Add:  OPENAI_API_KEY=sk-your-key-here\n"
fi

# ── Install local server deps if needed ───────────────────────────────────────
if [ ! -d "$ROOT_DIR/local/node_modules" ]; then
  info "Installing local server dependencies..."
  npm install --prefix "$ROOT_DIR/local" --silent
fi

# ── Install frontend deps if needed ──────────────────────────────────────────
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  info "Installing frontend dependencies..."
  npm install --prefix "$ROOT_DIR/frontend" --silent
fi

# ── Ensure frontend/.env.local symlink ───────────────────────────────────────
if [ ! -e "$ROOT_DIR/frontend/.env.local" ]; then
  info "Linking .env.local → frontend/.env.local"
  ln -sf "$ROOT_DIR/.env.local" "$ROOT_DIR/frontend/.env.local"
fi

# ── Free up ports ─────────────────────────────────────────────────────────────
for PORT in 3000 3001; do
  if lsof -i ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "Port $PORT busy — freeing it..."
    lsof -i ":$PORT" -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done

# ── Cleanup on Ctrl+C / exit ──────────────────────────────────────────────────
cleanup() {
  echo ""
  info "Stopping servers..."
  kill "$API_PID" "$FE_PID" 2>/dev/null || true
  wait "$API_PID" "$FE_PID" 2>/dev/null || true
  info "Stopped."
}
trap cleanup EXIT INT TERM

# ── Start local API server (port 3001) ───────────────────────────────────────
info "Starting local API server..."
(cd "$ROOT_DIR/local" && npx ts-node-dev --respawn --transpile-only server.ts 2>&1 \
  | sed "s/^/${CYAN}[api]${NC} /") &
API_PID=$!

# Wait up to 15s for API to be ready
for i in $(seq 1 30); do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then break; fi
  sleep 0.5
done
curl -sf http://localhost:3001/health >/dev/null 2>&1 \
  && info "✅ API server ready at http://localhost:3001" \
  || warn "⚠️  API server didn't respond in time — check logs above"

# ── Start Next.js frontend (port 3000) ───────────────────────────────────────
info "Starting Next.js frontend..."
(cd "$ROOT_DIR/frontend" && npm run dev 2>&1 \
  | sed "s/^/${CYAN}[web]${NC} /") &
FE_PID=$!

echo ""
echo -e "${CYAN}  ┌──────────────────────────────────────────────────┐"
echo -e "  │  EpicWeave — Local Dev (no AWS)                   │"
echo -e "  │                                                    │"
echo -e "  │  Frontend  →  http://localhost:3000               │"
echo -e "  │  API       →  http://localhost:3001               │"
echo -e "  │  Health    →  http://localhost:3001/health        │"
echo -e "  │                                                    │"
echo -e "  │  Default login:                                    │"
echo -e "  │    email   :  dev@epicweave.local                 │"
echo -e "  │    password:  password123                         │"
echo -e "  │                                                    │"
echo -e "  │  Press Ctrl+C to stop                             │"
echo -e "  └──────────────────────────────────────────────────┘${NC}"
echo ""

wait "$API_PID" "$FE_PID"
