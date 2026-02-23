# =============================================================================
# EpicWeave — Makefile
# Usage: make <target>
# =============================================================================

SHELL := /bin/bash
ROOT  := $(shell pwd)

# Detect Node path (Homebrew node@20 on macOS)
export PATH := /opt/homebrew/opt/node@20/bin:$(PATH)

.DEFAULT_GOAL := help

.PHONY: help install dev build deploy destroy \
        test test-unit test-bdd test-e2e test-load test-coverage \
        lint clean logs

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  EpicWeave — Available Commands"
	@echo "  ─────────────────────────────────────────────────────────"
	@echo "  make install        Install all workspace dependencies"
	@echo "  make dev            Run Next.js frontend locally (port 3000)"
	@echo "  make build          Build Lambda + frontend"
	@echo ""
	@echo "  make deploy         Full AWS deploy (Lambda + CDK + frontend)"
	@echo "  make deploy-skip-fe Full AWS deploy, skip frontend build"
	@echo "  make destroy        Destroy ALL AWS resources (confirms first)"
	@echo "  make destroy-force  Destroy without confirmation prompt"
	@echo ""
	@echo "  make test           Run unit + BDD tests"
	@echo "  make test-unit      Run Vitest unit tests"
	@echo "  make test-bdd       Run Cucumber BDD scenarios"
	@echo "  make test-e2e       Run Playwright end-to-end tests"
	@echo "  make test-load      Run k6 load tests (requires k6)"
	@echo "  make test-coverage  Run unit tests with coverage report"
	@echo "  make test-all       Run every test suite"
	@echo ""
	@echo "  make lint           TypeScript type-check all workspaces"
	@echo "  make clean          Remove all build artefacts"
	@echo "  make logs           Tail Lambda logs in CloudWatch"
	@echo "  ─────────────────────────────────────────────────────────"
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────
install:
	@echo "→ Installing workspace dependencies..."
	npm install
	@echo "✅ Done"

# ── Local Development ─────────────────────────────────────────────────────────
dev: install
	@bash scripts/dev.sh

# ── Build ─────────────────────────────────────────────────────────────────────
build: build-lambda build-frontend

build-lambda:
	@echo "→ Building Lambda (TypeScript → JS)..."
	npm run build --prefix backend/lambda
	@echo "✅ Lambda build complete"

build-frontend:
	@echo "→ Building Next.js frontend..."
	npm run build --prefix frontend
	@echo "✅ Frontend build complete"

# ── Deploy ────────────────────────────────────────────────────────────────────
deploy: install
	@bash scripts/deploy.sh

deploy-skip-fe: install
	@bash scripts/deploy.sh --skip-frontend

# ── Destroy ───────────────────────────────────────────────────────────────────
destroy:
	@bash scripts/destroy.sh

destroy-force:
	@bash scripts/destroy.sh --force

# ── Tests ─────────────────────────────────────────────────────────────────────
test:
	@bash scripts/test.sh

test-unit:
	@bash scripts/test.sh --unit

test-bdd:
	@bash scripts/test.sh --bdd

test-e2e:
	@bash scripts/test.sh --e2e

test-load:
	@bash scripts/test.sh --load

test-coverage:
	@bash scripts/test.sh --coverage

test-all:
	@bash scripts/test.sh --all

# ── Lint / Type-check ─────────────────────────────────────────────────────────
lint:
	@echo "→ Type-checking Lambda..."
	npx --prefix backend/lambda tsc --noEmit
	@echo "→ Type-checking CDK..."
	npx --prefix backend/cdk tsc --noEmit
	@echo "✅ No type errors"

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	@echo "→ Removing build artefacts..."
	rm -rf backend/lambda/dist
	rm -rf frontend/.next
	rm -rf frontend/out
	rm -f  .cdk-outputs.json
	@echo "✅ Clean done"

# ── CloudWatch Logs ───────────────────────────────────────────────────────────
logs:
	@echo "→ Tailing epicweave-create-session logs (Ctrl+C to stop)..."
	aws logs tail /aws/lambda/epicweave-create-session --follow --format short
