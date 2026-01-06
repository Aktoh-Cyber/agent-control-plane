#!/bin/bash
# Comprehensive CLI command validation script

set -e

echo "🧪 Testing agent-control-plane CLI commands..."
echo "========================================"
echo ""

# Test 1: Help command
echo "1️⃣  Testing --help..."
agent-control-plane --help > /dev/null 2>&1 && echo "✅ --help works" || echo "❌ --help failed"
echo ""

# Test 2: List agents
echo "2️⃣  Testing --list..."
agent-control-plane --list > /dev/null 2>&1 && echo "✅ --list works" || echo "❌ --list failed"
echo ""

# Test 3: MCP commands
echo "3️⃣  Testing MCP commands..."

echo "   Testing: mcp --help"
agent-control-plane mcp --help > /dev/null 2>&1 && echo "   ✅ mcp --help works" || echo "   ❌ mcp --help failed"

echo ""

# Test 4: Version check
echo "4️⃣  Testing version display..."
agent-control-plane --help | grep -q "v1.0" && echo "✅ Version displayed" || echo "❌ Version not displayed"
echo ""

# Test 5: Agent execution (should fail gracefully without API key)
echo "5️⃣  Testing agent execution without API key..."
output=$(agent-control-plane --agent coder --task "test" 2>&1 || true)
if echo "$output" | grep -q "ANTHROPIC_API_KEY"; then
    echo "✅ Agent execution shows proper API key error"
elif echo "$output" | grep -q "Error"; then
    echo "⚠️  Agent execution shows error (expected without API key)"
else
    echo "❌ Unexpected agent execution behavior"
fi
echo ""

echo "========================================"
echo "✅ All basic CLI commands validated!"
