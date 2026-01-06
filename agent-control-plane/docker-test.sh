#!/bin/bash
# Docker test script for agent-control-plane v1.5.9

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║  agent-control-plane v1.5.9 - Docker Verification Test                  ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "✓ Docker is available"
echo ""

# Build Docker image
echo "📦 Building Docker test image..."
echo "   This will:"
echo "   1. Install agent-control-plane@1.5.9 from npm"
echo "   2. Verify package structure"
echo "   3. Test CLI commands"
echo "   4. Test ReasoningBank initialization"
echo "   5. Test model ID mapping"
echo "   6. Run demo sample"
echo ""

# Build with build args for API key (optional)
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo "   Using ANTHROPIC_API_KEY from environment"
    BUILD_ARGS="--build-arg ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
else
    echo "   ℹ  No ANTHROPIC_API_KEY provided (some features will be limited)"
    BUILD_ARGS=""
fi

docker build -f Dockerfile.test $BUILD_ARGS -t agent-control-plane-test:1.5.9 . 2>&1 | tee /tmp/docker-build.log

# Check build status
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                    ║"
    echo "║  ✓ Docker Build Successful!                                       ║"
    echo "║                                                                    ║"
    echo "║  All tests passed in Docker container:                            ║"
    echo "║  • NPM installation verified                                      ║"
    echo "║  • Package structure validated                                    ║"
    echo "║  • CLI commands working                                           ║"
    echo "║  • ReasoningBank initialization successful                        ║"
    echo "║  • Model ID mapping verified                                      ║"
    echo "║  • Demo execution tested                                          ║"
    echo "║  • OpenRouter model ID fix confirmed                              ║"
    echo "║                                                                    ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 agent-control-plane v1.5.9 is working correctly!"
    echo ""
    echo "To run the container interactively:"
    echo "  docker run -it --rm agent-control-plane-test:1.5.9"
    echo ""
    echo "To test with your API key:"
    echo "  docker run -it --rm -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY agent-control-plane-test:1.5.9"
    echo ""
    exit 0
else
    echo ""
    echo "❌ Docker build failed. Check /tmp/docker-build.log for details"
    echo ""
    tail -n 50 /tmp/docker-build.log
    exit 1
fi
