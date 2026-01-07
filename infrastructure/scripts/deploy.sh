#!/bin/bash
set -euo pipefail

# ============================================================
# Agent Control Plane Deployment Script
# ============================================================
# Deploys the infrastructure and application to AWS EKS
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PULUMI_DIR="${SCRIPT_DIR}/../pulumi"
ROOT_DIR="${SCRIPT_DIR}/../.."

# Default values
ENVIRONMENT="${1:-dev}"
ACTION="${2:-preview}"

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Agent Control Plane Deployment${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
echo -e "  Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "  Action:      ${GREEN}${ACTION}${NC}"
echo ""

# ============================================================
# Validation
# ============================================================
echo -e "${YELLOW}Validating prerequisites...${NC}"

# Check AWS credentials
echo -e "  Checking AWS credentials..."
AWS_IDENTITY=$(aws sts get-caller-identity --output json 2>&1) || {
    echo -e "${RED}ERROR: AWS credentials not configured${NC}"
    exit 1
}

AWS_ACCOUNT_ID=$(echo "$AWS_IDENTITY" | jq -r '.Account')
AWS_USER_ARN=$(echo "$AWS_IDENTITY" | jq -r '.Arn')

echo -e "  ${GREEN}AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo -e "  ${GREEN}AWS User: ${AWS_USER_ARN}${NC}"

# Confirm AWS account
echo ""
read -p "  Continue with this AWS account? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

# Check Pulumi passphrase
if [ -z "${PULUMI_CONFIG_PASSPHRASE:-}" ]; then
    echo -e "${RED}ERROR: PULUMI_CONFIG_PASSPHRASE not set${NC}"
    echo -e "  Please set: export PULUMI_CONFIG_PASSPHRASE='your-passphrase'"
    exit 1
fi

# Check Pulumi is logged in
echo -e "  Checking Pulumi backend..."
if ! pulumi whoami 2>/dev/null; then
    echo -e "${RED}ERROR: Not logged in to Pulumi${NC}"
    echo -e "  Run: ./setup-pulumi-backend.sh"
    exit 1
fi

echo -e "  ${GREEN}Prerequisites validated${NC}"

# ============================================================
# Build and Deploy
# ============================================================
cd "$PULUMI_DIR"

echo ""
echo -e "${YELLOW}Selecting stack: ${ENVIRONMENT}${NC}"
pulumi stack select "$ENVIRONMENT"

echo ""
echo -e "${YELLOW}Running: pulumi ${ACTION}${NC}"
echo ""

case "$ACTION" in
    preview)
        pulumi preview
        ;;
    up)
        pulumi up --yes
        ;;
    destroy)
        echo -e "${RED}WARNING: This will destroy all infrastructure!${NC}"
        read -p "Are you sure? (yes/no): " DESTROY_CONFIRM
        if [ "$DESTROY_CONFIRM" = "yes" ]; then
            pulumi destroy --yes
        else
            echo "Aborted."
        fi
        ;;
    refresh)
        pulumi refresh --yes
        ;;
    *)
        echo -e "${RED}Unknown action: ${ACTION}${NC}"
        echo "  Valid actions: preview, up, destroy, refresh"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
