#!/bin/bash
# ReasoningBank Benchmark Execution Script

set -e

echo "🧪 ReasoningBank Benchmark Suite"
echo "=================================="
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ Error: ANTHROPIC_API_KEY environment variable not set"
  echo "Please set it with: export ANTHROPIC_API_KEY='sk-ant-...'"
  exit 1
fi

# Create output directories
mkdir -p results reports

# Parse arguments
SCENARIOS="${1:-all}"
ITERATIONS="${2:-3}"

echo "Configuration:"
echo "  Scenarios: $SCENARIOS"
echo "  Iterations: $ITERATIONS"
echo "  API Key: ${ANTHROPIC_API_KEY:0:10}..."
echo ""

# Check if TypeScript is compiled
if [ ! -f "benchmark.js" ]; then
  echo "📦 Compiling TypeScript..."
  cd ..
  npm run build
  cd bench
  echo "✅ Build complete"
  echo ""
fi

# Initialize ReasoningBank database
echo "🗄️  Initializing ReasoningBank database..."
npx agent-control-plane reasoningbank init
echo ""

# Run benchmark
echo "🚀 Starting benchmark execution..."
echo "This may take several minutes depending on the number of scenarios and iterations."
echo ""

if [ "$SCENARIOS" = "all" ]; then
  node benchmark.js --iterations=$ITERATIONS
elif [ "$SCENARIOS" = "quick" ]; then
  node benchmark.js --scenarios=coding-tasks --iterations=1
else
  node benchmark.js --scenarios=$SCENARIOS --iterations=$ITERATIONS
fi

echo ""
echo "✅ Benchmark complete!"
echo ""
echo "📊 Results saved to:"
echo "  - JSON: ./results/"
echo "  - Markdown: ./reports/"
echo ""
echo "💡 View results:"
echo "  cat reports/benchmark-*.md | less"
echo ""
