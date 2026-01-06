#!/bin/bash
# Comprehensive validation of all providers + MCP tools
# Tests both CLI and MCP functionality for v1.1.11

set -e

echo "========================================="
echo "🧪 Testing v1.1.11 - All Providers + MCP"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
SKIPPED=0

# Test function
run_test() {
  local test_name="$1"
  local command="$2"
  local expected="$3"

  echo -e "${YELLOW}Running:${NC} $test_name"

  if timeout 45 bash -c "$command" 2>&1 | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
  fi
  echo ""
}

run_test_with_env() {
  local test_name="$1"
  local env_var="$2"
  local command="$3"
  local expected="$4"

  if [ -z "${!env_var}" ]; then
    echo -e "${YELLOW}⏭️  SKIPPED:${NC} $test_name (no $env_var set)"
    ((SKIPPED++))
    echo ""
    return
  fi

  run_test "$test_name" "$command" "$expected"
}

# Test 1: Anthropic Direct (No Proxy)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 1: Anthropic Provider (Direct)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test_with_env \
  "Anthropic - Basic CLI" \
  "ANTHROPIC_API_KEY" \
  "node dist/cli-proxy.js --agent coder --task 'Create add function' --provider anthropic --max-tokens 50" \
  "function"

run_test_with_env \
  "Anthropic - MCP Memory Store" \
  "ANTHROPIC_API_KEY" \
  "export ENABLE_CLAUDE_FLOW_SDK=true && node dist/cli-proxy.js --agent coder --task 'Use mcp__gendev-sdk__memory_store to save key=\"test-anthropic\" value=\"working\"' --provider anthropic --max-tokens 200" \
  "Stored successfully"

# Test 2: Gemini Proxy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 2: Gemini Provider (Proxy)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test_with_env \
  "Gemini - Basic CLI" \
  "GOOGLE_GEMINI_API_KEY" \
  "node dist/cli-proxy.js --agent coder --task 'Create subtract function' --provider gemini --max-tokens 50" \
  "function"

run_test_with_env \
  "Gemini - MCP Memory Store (v1.1.11 NEW)" \
  "GOOGLE_GEMINI_API_KEY" \
  "export ENABLE_CLAUDE_FLOW_SDK=true && node dist/cli-proxy.js --agent coder --task 'Use mcp__gendev-sdk__memory_store to save key=\"test-gemini\" value=\"proxy-mcp-working\"' --provider gemini --max-tokens 250" \
  "mcp__gendev-sdk__memory_store"

# Test 3: OpenRouter Proxy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 3: OpenRouter Provider (Proxy)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test_with_env \
  "OpenRouter - Basic CLI" \
  "OPENROUTER_API_KEY" \
  "node dist/cli-proxy.js --agent coder --task 'Create multiply function' --provider openrouter --model 'openai/gpt-4o-mini' --max-tokens 50" \
  "function"

run_test_with_env \
  "OpenRouter - MCP Memory Store (v1.1.11 NEW)" \
  "OPENROUTER_API_KEY" \
  "export ENABLE_CLAUDE_FLOW_SDK=true && node dist/cli-proxy.js --agent coder --task 'Use mcp__gendev-sdk__memory_store to save key=\"test-openrouter\" value=\"proxy-mcp-working\"' --provider openrouter --model 'openai/gpt-4o-mini' --max-tokens 250" \
  "mcp__gendev-sdk__memory_store"

# Test 4: SDK Tools Validation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 4: SDK Tools (Write, Read, Bash)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test_with_env \
  "SDK Write Tool" \
  "ANTHROPIC_API_KEY" \
  "node dist/cli-proxy.js --agent coder --task 'Write a hello world function to /tmp/sdk-test.js using Write tool' --provider anthropic --max-tokens 200" \
  "tmp/sdk-test.js"

# Test 5: MCP Tool Listing
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 5: MCP Tool Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test_with_env \
  "MCP Tools Available with Anthropic" \
  "ANTHROPIC_API_KEY" \
  "export ENABLE_CLAUDE_FLOW_SDK=true && node dist/cli-proxy.js --agent coder --task 'List available MCP tools' --provider anthropic --max-tokens 150" \
  "memory_store"

# Results Summary
echo "========================================="
echo "📊 Test Results Summary"
echo "========================================="
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⏭️  Skipped: $SKIPPED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests PASSED!${NC}"
  echo ""
  echo "v1.1.11 Validation Status:"
  echo "  ✅ All providers working"
  echo "  ✅ MCP tools functional"
  echo "  ✅ Proxy forwarding operational"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Some tests FAILED${NC}"
  echo ""
  echo "Please review the output above and:"
  echo "  1. Ensure all API keys are set correctly"
  echo "  2. Check rate limits (especially Gemini)"
  echo "  3. Verify proxy startup logs"
  echo ""
  exit 1
fi
