#!/bin/bash
# Docker QUIC Validation Script
# Runs comprehensive QUIC tests in isolated Docker environment

set -e

echo "🐳 QUIC Docker Validation Suite"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to package directory
cd "$(dirname "$0")/.."

echo "📦 Building Docker validation image..."
docker build -f Dockerfile.quic-validation -t agent-control-plane-quic-validation . 2>&1 | tail -20

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"
echo ""

echo "🧪 Running QUIC validation tests in Docker..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run validation container
docker run --rm \
  --name quic-validation \
  -e QUIC_PORT=4433 \
  -e NODE_ENV=production \
  agent-control-plane-quic-validation

VALIDATION_RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $VALIDATION_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ All QUIC validations passed in Docker!${NC}"
  echo ""
  echo "✨ QUIC is ready for:"
  echo "  • npm publish"
  echo "  • Remote deployment"
  echo "  • Production use"
  exit 0
else
  echo -e "${RED}❌ QUIC validation failed in Docker${NC}"
  echo ""
  echo "⚠️  Issues detected - fix before publishing"
  exit 1
fi
