#!/bin/bash

# DeepSeek Chat Agent Demo
# Demonstrates using agent-control-plane with DeepSeek Chat via OpenRouter
# Cost: $0.14 input / $0.28 output per 1M tokens (97.7% savings vs Claude)

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         DeepSeek Chat Agent Demo via OpenRouter               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check environment
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Error: OPENROUTER_API_KEY not set"
    echo "   Get your key from: https://openrouter.ai/keys"
    exit 1
fi

echo "✅ Environment configured"
echo "   Model: deepseek/deepseek-chat"
echo "   Cost: $0.14/$0.28 per 1M tokens"
echo "   Savings: 97.7% vs Claude"
echo ""

# Ensure proxy is running
echo "🔍 Checking OpenRouter proxy..."
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "⚠️  Proxy not running, starting..."
    npx gendev proxy start --daemon > /dev/null 2>&1
    sleep 2
    echo "✅ Proxy started on port 8080"
else
    echo "✅ Proxy already running"
fi

# Set base URL for OpenRouter proxy
export ANTHROPIC_BASE_URL=http://localhost:8080

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Simple Code Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Simple code generation
cat << 'EOF' > /tmp/deepseek_task1.txt
Create a Python function that calculates the fibonacci sequence up to n terms.
Include:
- Function definition with docstring
- Input validation
- Efficient implementation
- Example usage
EOF

echo "📝 Task: Generate fibonacci function"
echo "🤖 Agent: coder"
echo "🔧 Model: deepseek/deepseek-chat"
echo ""
echo "⏳ Running..."

# Run the agent
npx gendev agent run \
  --agent coder \
  --model "deepseek/deepseek-chat" \
  --task "$(cat /tmp/deepseek_task1.txt)" \
  --max-tokens 500

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: API Design Task"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'EOF' > /tmp/deepseek_task2.txt
Design a REST API for a todo application.
Include:
- API endpoints (GET, POST, PUT, DELETE)
- Request/response schemas
- Authentication approach
- Error handling
Output as a structured markdown document.
EOF

echo "📝 Task: Design REST API"
echo "🤖 Agent: system-architect"
echo "🔧 Model: deepseek/deepseek-chat"
echo ""
echo "⏳ Running..."

npx gendev agent run \
  --agent system-architect \
  --model "deepseek/deepseek-chat" \
  --task "$(cat /tmp/deepseek_task2.txt)" \
  --max-tokens 800

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Code Review Task"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'EOF' > /tmp/deepseek_task3.txt
Review this Python code for best practices:

def process_data(data):
    result = []
    for i in range(len(data)):
        if data[i] % 2 == 0:
            result.append(data[i] * 2)
    return result

Provide:
- Code quality assessment
- Performance suggestions
- Pythonic improvements
- Refactored version
EOF

echo "📝 Task: Code review and refactoring"
echo "🤖 Agent: reviewer"
echo "🔧 Model: deepseek/deepseek-chat"
echo ""
echo "⏳ Running..."

npx gendev agent run \
  --agent reviewer \
  --model "deepseek/deepseek-chat" \
  --task "$(cat /tmp/deepseek_task3.txt)" \
  --max-tokens 600

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Demo Complete! ✅                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "💰 Cost Savings:"
echo "   DeepSeek: ~$0.42 per 1M tokens"
echo "   Claude:   ~$18.00 per 1M tokens"
echo "   Savings:  97.7%"
echo ""
echo "🚀 Next Steps:"
echo "   1. Try with your own tasks"
echo "   2. Experiment with other agents (backend-dev, ml-developer, etc.)"
echo "   3. Compare with other models (llama, gemini)"
echo ""
echo "📚 Documentation:"
echo "   - OpenRouter Deployment: docs/guides/OPENROUTER_DEPLOYMENT.md"
echo "   - Available Agents: npx gendev agent list"
echo "   - Available Models: https://openrouter.ai/models"
echo ""

# Clean up temp files
rm -f /tmp/deepseek_task*.txt

echo "✨ Thank you for using agent-control-plane with DeepSeek Chat!"
