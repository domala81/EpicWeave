#!/usr/bin/env bash
# =============================================================================
# EpicWeave — Full AWS Deploy
# Usage: ./scripts/deploy.sh [--skip-frontend]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_FRONTEND=false

for arg in "$@"; do
  case $arg in
    --skip-frontend) SKIP_FRONTEND=true ;;
  esac
done

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $*"; }
error() { echo -e "${RED}[deploy] ERROR${NC} $*" >&2; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v node  >/dev/null 2>&1 || error "node not found. Install Node.js 20."
command -v npm   >/dev/null 2>&1 || error "npm not found."
command -v aws   >/dev/null 2>&1 || error "aws CLI not found. Run: brew install awscli"
command -v npx   >/dev/null 2>&1 || error "npx not found."

info "Checking AWS credentials..."
aws sts get-caller-identity --query "Account" --output text >/dev/null \
  || error "AWS credentials not configured. Run: aws configure"

# ── Install root deps ─────────────────────────────────────────────────────────
info "Installing workspace dependencies..."
npm install --prefix "$ROOT_DIR" --silent

# ── Build Lambda ──────────────────────────────────────────────────────────────
info "Building Lambda functions (TypeScript → JS)..."
npm run build --prefix "$ROOT_DIR/backend/lambda"

# ── CDK Bootstrap (idempotent) ────────────────────────────────────────────────
ACCOUNT=$(aws sts get-caller-identity --query "Account" --output text)
REGION=${AWS_REGION:-us-east-1}
info "Bootstrapping CDK for account ${ACCOUNT} / region ${REGION}..."
npx --prefix "$ROOT_DIR/backend/cdk" cdk bootstrap "aws://${ACCOUNT}/${REGION}" \
  --toolkit-stack-name CDKToolkit 2>&1 | grep -v "^$" || true

# ── Deploy CDK stack ──────────────────────────────────────────────────────────
info "Deploying CDK stack (EpicWeaveStack-dev)..."
npx --prefix "$ROOT_DIR/backend/cdk" cdk deploy --all \
  --require-approval never \
  --outputs-file "$ROOT_DIR/.cdk-outputs.json"

info "CDK outputs written to .cdk-outputs.json"

# ── Build & export Next.js frontend (optional) ────────────────────────────────
if [ "$SKIP_FRONTEND" = false ]; then
  info "Building Next.js frontend..."
  npm run build --prefix "$ROOT_DIR/frontend"
  info "Frontend build complete. Start with: npm run start --prefix frontend"
else
  warn "Skipping frontend build (--skip-frontend flag set)"
fi

info "✅  Deploy complete!"
echo ""
echo "  API Gateway : $(aws cloudformation describe-stacks \
  --stack-name EpicWeaveStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayApiEndpoint015055E7`].OutputValue' \
  --output text 2>/dev/null || echo 'see .cdk-outputs.json')"
echo "  Frontend    : npm run dev --prefix frontend"
