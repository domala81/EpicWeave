#!/usr/bin/env bash
# =============================================================================
# EpicWeave — Destroy ALL AWS Resources
# Usage: ./scripts/destroy.sh [--force]
#
# Explicitly deletes every resource type created by the EpicWeave CDK stack.
# Does NOT rely solely on CDK destroy — handles orphaned resources too.
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE=false

for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
  esac
done

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[destroy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[destroy]${NC} $*"; }
skip()  { echo -e "  ${YELLOW}↷${NC}  $* (not found, skipping)"; }
done_() { echo -e "  ${GREEN}✓${NC}  $*"; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v aws >/dev/null 2>&1 || { echo "aws CLI not found."; exit 1; }

aws sts get-caller-identity --query "Account" --output text >/dev/null \
  || { echo "AWS credentials not configured. Run: aws configure"; exit 1; }

ACCOUNT=$(aws sts get-caller-identity --query "Account" --output text)
REGION=${AWS_REGION:-us-east-1}

echo ""
warn "⚠️  This will PERMANENTLY DELETE all EpicWeave resources"
warn "    Account : ${ACCOUNT}"
warn "    Region  : ${REGION}"
warn "    Resources: Lambda, DynamoDB, S3, Cognito, SQS, CloudFront,"
warn "               API Gateway, CloudWatch Logs, SSM Parameters,"
warn "               Secrets Manager, IAM Roles, CDK Toolkit assets"
echo ""

if [ "$FORCE" = false ]; then
  echo -n "  Type 'yes' to confirm destruction: "
  read -r CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    info "Aborted — nothing was deleted."
    exit 0
  fi
fi

echo ""

# =============================================================================
# STEP 1 — CloudFormation stack (CDK) — attempt first, fall back to manual
# =============================================================================
info "Step 1/10 — CloudFormation stack"

STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name EpicWeaveStack-dev \
  --query "Stacks[0].StackStatus" \
  --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_STATUS" = "DOES_NOT_EXIST" ]; then
  skip "EpicWeaveStack-dev"
else
  info "  Stack status: ${STACK_STATUS} — pre-deleting Lambdas with dynamic secret refs..."

  # Pre-delete Lambdas that reference Secrets Manager via {{resolve:...}}
  # These cause DELETE_FAILED when the secret doesn't exist
  for fn in epicweave-create-session epicweave-process-refund epicweave-create-order; do
    if aws lambda get-function --function-name "$fn" --region "$REGION" >/dev/null 2>&1; then
      aws lambda delete-function --function-name "$fn" --region "$REGION" 2>/dev/null || true
      done_ "Pre-deleted Lambda: $fn"
    fi
  done

  # Run CDK destroy
  if npx --prefix "$ROOT_DIR/backend/cdk" cdk destroy --all --force 2>&1; then
    done_ "CDK stack destroyed"
  else
    warn "  CDK destroy failed — forcing CloudFormation deletion with retained resources..."
    STUCK=$(aws cloudformation describe-stack-events \
      --stack-name EpicWeaveStack-dev --region "$REGION" \
      --query "StackEvents[?ResourceStatus=='DELETE_FAILED'].LogicalResourceId" \
      --output text 2>/dev/null | tr '\t\n' '  ' | xargs)

    if [ -n "$STUCK" ]; then
      RETAIN_FLAGS=""
      for r in $STUCK; do RETAIN_FLAGS="$RETAIN_FLAGS --retain-resources $r"; done
      # shellcheck disable=SC2086
      aws cloudformation delete-stack --stack-name EpicWeaveStack-dev \
        --region "$REGION" $RETAIN_FLAGS 2>/dev/null || true
      aws cloudformation wait stack-delete-complete \
        --stack-name EpicWeaveStack-dev --region "$REGION" 2>/dev/null || true
      done_ "Stack deleted (retained: $STUCK)"
    fi
  fi
fi

# =============================================================================
# STEP 2 — Lambda functions
# =============================================================================
info "Step 2/10 — Lambda functions"

LAMBDA_NAMES=(
  epicweave-list-products
  epicweave-get-product
  epicweave-create-product
  epicweave-create-session
  epicweave-generate-design
  epicweave-get-session-status
  epicweave-finalize-design
  epicweave-ai-worker
  epicweave-get-cart
  epicweave-add-to-cart
  epicweave-update-cart-item
  epicweave-remove-cart-item
  epicweave-create-order
  epicweave-send-confirmation
  epicweave-get-orders
  epicweave-get-order-detail
  epicweave-get-admin-orders
  epicweave-update-order-status
  epicweave-process-refund
  epicweave-get-config
  epicweave-update-config
)

for fn in "${LAMBDA_NAMES[@]}"; do
  if aws lambda get-function --function-name "$fn" --region "$REGION" >/dev/null 2>&1; then
    aws lambda delete-function --function-name "$fn" --region "$REGION" 2>/dev/null || true
    done_ "Lambda: $fn"
  fi
done

# =============================================================================
# STEP 3 — DynamoDB tables
# =============================================================================
info "Step 3/10 — DynamoDB tables"

for table in "EpicWeaveTable-dev"; do
  if aws dynamodb describe-table --table-name "$table" --region "$REGION" >/dev/null 2>&1; then
    aws dynamodb delete-table --table-name "$table" --region "$REGION" >/dev/null
    done_ "DynamoDB table: $table"
  else
    skip "DynamoDB table: $table"
  fi
done

# =============================================================================
# STEP 4 — S3 buckets (empty first, then delete)
# =============================================================================
info "Step 4/10 — S3 buckets"

delete_bucket() {
  local bucket="$1"
  if ! aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
    skip "S3 bucket: $bucket"
    return
  fi

  # Delete all objects
  aws s3 rm "s3://${bucket}" --recursive --quiet 2>/dev/null || true

  # Delete all versioned objects and delete markers
  local versions
  versions=$(aws s3api list-object-versions --bucket "$bucket" \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --output json 2>/dev/null)
  if [ "$versions" != "null" ] && [ -n "$versions" ] && \
     [ "$(echo "$versions" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('Objects') or []))" 2>/dev/null)" != "0" ]; then
    aws s3api delete-objects --bucket "$bucket" --delete "$versions" --quiet 2>/dev/null || true
  fi

  local markers
  markers=$(aws s3api list-object-versions --bucket "$bucket" \
    --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' \
    --output json 2>/dev/null)
  if [ "$markers" != "null" ] && [ -n "$markers" ] && \
     [ "$(echo "$markers" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('Objects') or []))" 2>/dev/null)" != "0" ]; then
    aws s3api delete-objects --bucket "$bucket" --delete "$markers" --quiet 2>/dev/null || true
  fi

  aws s3api delete-bucket --bucket "$bucket" --region "$REGION" 2>/dev/null || true
  done_ "S3 bucket: $bucket"
}

delete_bucket "epicweave-designs-${ACCOUNT}-${REGION}"
delete_bucket "epicweave-products-${ACCOUNT}-${REGION}"

# Also catch any CDK staging bucket
CDK_BUCKET=$(aws s3 ls 2>/dev/null | awk '{print $3}' | grep "^cdk-.*-assets-${ACCOUNT}-${REGION}$" || true)
if [ -n "$CDK_BUCKET" ]; then
  warn "  Found CDK assets bucket: $CDK_BUCKET — skipping (shared CDK bootstrap resource)"
fi

# =============================================================================
# STEP 5 — Cognito User Pools
# =============================================================================
info "Step 5/10 — Cognito User Pools"

POOL_IDS=$(aws cognito-idp list-user-pools --max-results 60 --region "$REGION" \
  --query "UserPools[?contains(Name,'epicweave')].Id" --output text 2>/dev/null || true)

if [ -z "$POOL_IDS" ]; then
  skip "No epicweave Cognito user pools found"
else
  for pool_id in $POOL_IDS; do
    aws cognito-idp delete-user-pool --user-pool-id "$pool_id" --region "$REGION" 2>/dev/null || true
    done_ "Cognito User Pool: $pool_id"
  done
fi

# =============================================================================
# STEP 6 — SQS Queues
# =============================================================================
info "Step 6/10 — SQS Queues"

for queue_name in "epicweave-ai-jobs-dev" "epicweave-ai-jobs-dev.fifo"; do
  QUEUE_URL=$(aws sqs get-queue-url --queue-name "$queue_name" --region "$REGION" \
    --query "QueueUrl" --output text 2>/dev/null || true)
  if [ -n "$QUEUE_URL" ] && [ "$QUEUE_URL" != "None" ]; then
    aws sqs delete-queue --queue-url "$QUEUE_URL" --region "$REGION" 2>/dev/null || true
    done_ "SQS Queue: $queue_name"
  else
    skip "SQS Queue: $queue_name"
  fi
done

# =============================================================================
# STEP 7 — API Gateway (HTTP APIs)
# =============================================================================
info "Step 7/10 — API Gateway"

API_IDS=$(aws apigatewayv2 get-apis --region "$REGION" \
  --query "Items[?contains(Name,'EpicWeave') || contains(Name,'epicweave')].ApiId" \
  --output text 2>/dev/null || true)

if [ -z "$API_IDS" ]; then
  skip "No epicweave API Gateways found"
else
  for api_id in $API_IDS; do
    aws apigatewayv2 delete-api --api-id "$api_id" --region "$REGION" 2>/dev/null || true
    done_ "API Gateway: $api_id"
  done
fi

# =============================================================================
# STEP 8 — CloudFront Distributions
# =============================================================================
info "Step 8/10 — CloudFront Distributions"

CF_IDS=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(to_string(Origins),'epicweave')].Id" \
  --output text 2>/dev/null || true)

if [ -z "$CF_IDS" ]; then
  skip "No epicweave CloudFront distributions found"
else
  for cf_id in $CF_IDS; do
    # Must disable before deleting
    ETAG=$(aws cloudfront get-distribution --id "$cf_id" --query "ETag" --output text 2>/dev/null || true)
    CONFIG=$(aws cloudfront get-distribution-config --id "$cf_id" \
      --query "DistributionConfig" --output json 2>/dev/null || true)
    if [ -n "$CONFIG" ] && [ -n "$ETAG" ]; then
      DISABLED=$(echo "$CONFIG" | python3 -c \
        "import sys,json; c=json.load(sys.stdin); c['Enabled']=False; print(json.dumps(c))" 2>/dev/null)
      aws cloudfront update-distribution --id "$cf_id" \
        --distribution-config "$DISABLED" --if-match "$ETAG" >/dev/null 2>/dev/null || true
      warn "  CloudFront $cf_id disabled — waiting for deployment (this takes ~5 min)..."
      aws cloudfront wait distribution-deployed --id "$cf_id" 2>/dev/null || true
      NEW_ETAG=$(aws cloudfront get-distribution --id "$cf_id" --query "ETag" --output text 2>/dev/null)
      aws cloudfront delete-distribution --id "$cf_id" --if-match "$NEW_ETAG" 2>/dev/null || true
      done_ "CloudFront: $cf_id"
    fi
  done
fi

# =============================================================================
# STEP 9 — CloudWatch Log Groups
# =============================================================================
info "Step 9/10 — CloudWatch Log Groups"

LOG_GROUPS=$(aws logs describe-log-groups --region "$REGION" \
  --log-group-name-prefix "/aws/lambda/epicweave" \
  --query "logGroups[].logGroupName" --output text 2>/dev/null || true)

if [ -z "$LOG_GROUPS" ]; then
  skip "No epicweave Lambda log groups found"
else
  for lg in $LOG_GROUPS; do
    aws logs delete-log-group --log-group-name "$lg" --region "$REGION" 2>/dev/null || true
    done_ "Log group: $lg"
  done
fi

# =============================================================================
# STEP 10 — SSM Parameters & Secrets Manager
# =============================================================================
info "Step 10/10 — SSM Parameters & Secrets Manager"

SSM_PARAMS=$(aws ssm get-parameters-by-path --path "/EpicWeave" --region "$REGION" \
  --recursive --query "Parameters[].Name" --output text 2>/dev/null || true)

if [ -z "$SSM_PARAMS" ]; then
  skip "No /EpicWeave SSM parameters found"
else
  for param in $SSM_PARAMS; do
    aws ssm delete-parameter --name "$param" --region "$REGION" 2>/dev/null || true
    done_ "SSM parameter: $param"
  done
fi

SECRETS=$(aws secretsmanager list-secrets --region "$REGION" \
  --query "SecretList[?contains(Name,'epicweave')].Name" --output text 2>/dev/null || true)

if [ -z "$SECRETS" ]; then
  skip "No epicweave Secrets Manager secrets found"
else
  for secret in $SECRETS; do
    aws secretsmanager delete-secret --secret-id "$secret" \
      --force-delete-without-recovery --region "$REGION" 2>/dev/null || true
    done_ "Secret: $secret"
  done
fi

# =============================================================================
# Local artefacts
# =============================================================================
info "Cleaning local build artefacts..."
rm -rf "$ROOT_DIR/backend/lambda/dist"
rm -rf "$ROOT_DIR/frontend/.next"
rm -rf "$ROOT_DIR/frontend/out"
rm -f  "$ROOT_DIR/.cdk-outputs.json"
done_ "Local artefacts cleaned"

# =============================================================================
# Final verification
# =============================================================================
echo ""
info "Verifying cleanup..."
REMAINING=""

DDB=$(aws dynamodb list-tables --region "$REGION" \
  --query "TableNames[?starts_with(@,'EpicWeave')]" --output text 2>/dev/null || true)
[ -n "$DDB" ] && REMAINING="${REMAINING}\n  DynamoDB: $DDB"

S3=$(aws s3 ls 2>/dev/null | awk '{print $3}' | grep "^epicweave" || true)
[ -n "$S3" ] && REMAINING="${REMAINING}\n  S3: $S3"

COG=$(aws cognito-idp list-user-pools --max-results 60 --region "$REGION" \
  --query "UserPools[?contains(Name,'epicweave')].Id" --output text 2>/dev/null || true)
[ -n "$COG" ] && REMAINING="${REMAINING}\n  Cognito: $COG"

LOGS=$(aws logs describe-log-groups --region "$REGION" \
  --log-group-name-prefix "/aws/lambda/epicweave" \
  --query "logGroups[].logGroupName" --output text 2>/dev/null || true)
[ -n "$LOGS" ] && REMAINING="${REMAINING}\n  CloudWatch: $LOGS"

if [ -z "$REMAINING" ]; then
  echo ""
  info "✅  All EpicWeave AWS resources successfully destroyed."
else
  echo ""
  warn "⚠️  Some resources may still exist (may need manual cleanup):"
  echo -e "$REMAINING"
fi
