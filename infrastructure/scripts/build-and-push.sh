#!/bin/bash
set -euo pipefail

# ============================================================
# Build and Push Docker Images to ECR
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/../.."
PULUMI_DIR="${SCRIPT_DIR}/../pulumi"

# Get ECR URLs from Pulumi outputs
echo -e "${YELLOW}Fetching ECR URLs from Pulumi...${NC}"
cd "$PULUMI_DIR"

FEDERATION_HUB_ECR=$(pulumi stack output federationHubEcrUrl 2>/dev/null) || {
    echo -e "${RED}ERROR: Could not get ECR URL. Have you deployed the infrastructure?${NC}"
    exit 1
}

AGENT_ECR=$(pulumi stack output agentEcrUrl 2>/dev/null) || {
    echo -e "${RED}ERROR: Could not get ECR URL. Have you deployed the infrastructure?${NC}"
    exit 1
}

REGION=$(pulumi stack output region 2>/dev/null)
AWS_ACCOUNT_ID=$(pulumi stack output awsAccountId 2>/dev/null)

echo -e "  Federation Hub ECR: ${BLUE}${FEDERATION_HUB_ECR}${NC}"
echo -e "  Agent ECR:          ${BLUE}${AGENT_ECR}${NC}"

# Get image tag
TAG="${1:-latest}"
echo -e "  Tag: ${BLUE}${TAG}${NC}"

# ============================================================
# Login to ECR
# ============================================================
echo ""
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
echo -e "${GREEN}ECR login successful${NC}"

# ============================================================
# Build and Push Federation Hub
# ============================================================
echo ""
echo -e "${YELLOW}Building Federation Hub image...${NC}"
cd "$ROOT_DIR"

# First build the TypeScript
echo -e "  Building TypeScript..."
npm run build 2>/dev/null || pnpm run build

# Build Docker image
echo -e "  Building Docker image..."
docker build \
    -f agent-control-plane/docker/federation-test/Dockerfile.hub.production \
    -t "${FEDERATION_HUB_ECR}:${TAG}" \
    ./agent-control-plane

echo -e "${YELLOW}Pushing Federation Hub image...${NC}"
docker push "${FEDERATION_HUB_ECR}:${TAG}"
echo -e "${GREEN}Federation Hub image pushed: ${FEDERATION_HUB_ECR}:${TAG}${NC}"

# ============================================================
# Build and Push Agent
# ============================================================
echo ""
echo -e "${YELLOW}Building Agent image...${NC}"

docker build \
    -f agent-control-plane/docker/federation-test/Dockerfile.agent.production \
    -t "${AGENT_ECR}:${TAG}" \
    ./agent-control-plane

echo -e "${YELLOW}Pushing Agent image...${NC}"
docker push "${AGENT_ECR}:${TAG}"
echo -e "${GREEN}Agent image pushed: ${AGENT_ECR}:${TAG}${NC}"

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Images pushed successfully!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  Federation Hub: ${BLUE}${FEDERATION_HUB_ECR}:${TAG}${NC}"
echo -e "  Agent:          ${BLUE}${AGENT_ECR}:${TAG}${NC}"
echo ""
echo -e "  ${YELLOW}To update deployments:${NC}"
echo -e "    ${BLUE}kubectl rollout restart deployment/federation-hub -n agent-control-plane${NC}"
