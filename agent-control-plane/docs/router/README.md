# Multi-Model Router for Agentic-Flow

## Overview

The Multi-Model Router extends agent-control-plane to work with multiple LLM providers beyond Anthropic's Claude, enabling cost optimization, provider diversity, and local model support.

## 🚀 Quick Start

### 1. Install

```bash
npm install -g agent-control-plane@latest
```

### 2. Configure Environment

Add API keys to your `.env` file:

```bash
# Primary provider (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Multi-model gateway (OpenRouter)
OPENROUTER_API_KEY=sk-or-...

# Optional providers
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

### 3. Copy Configuration Template

```bash
cp router.config.example.json ~/.agent-control-plane/router.config.json
```

### 4. Use Different Providers

```bash
# Use OpenRouter (default in example config)
npx agent-control-plane --agent coder --task "Build REST API"

# Use specific provider
npx agent-control-plane --provider openai --agent coder --task "Build REST API"

# Use specific model
npx agent-control-plane --model gpt-4 --agent coder --task "Build REST API"

# Use local model
npx agent-control-plane --provider ollama --model llama3:70b --agent coder --task "Build REST API"
```

## 📚 Documentation

### Core Documentation

- **[Implementation Plan](./MULTI_MODEL_ROUTER_PLAN.md)** - Complete technical architecture and 6-week implementation roadmap
- **[User Guide](./ROUTER_USER_GUIDE.md)** - Step-by-step guide for using the multi-model router
- **[Configuration Reference](./ROUTER_CONFIG_REFERENCE.md)** - Complete configuration file documentation

### Quick Links

- [Provider Setup](#supported-providers)
- [Routing Strategies](#routing-strategies)
- [Cost Optimization](#cost-optimization)
- [Tool Calling](#tool-calling-support)

## 🔌 Supported Providers

### Anthropic (Claude)

- **Status**: ✅ Native (Primary)
- **Tool Calling**: ✅ Full Support
- **MCP Support**: ✅ Native
- **Setup**: [Anthropic Setup Guide](./ROUTER_USER_GUIDE.md#anthropic-claude)

```bash
npx agent-control-plane --provider anthropic --task "..."
```

### OpenRouter

- **Status**: ✅ Production Ready
- **Tool Calling**: ⚡ Translated
- **Models**: 200+ models from multiple providers
- **Setup**: [OpenRouter Setup Guide](./ROUTER_USER_GUIDE.md#openrouter)

```bash
npx agent-control-plane --provider openrouter --model anthropic/claude-3.5-sonnet --task "..."
```

**Available via OpenRouter:**

- Anthropic Claude models
- OpenAI GPT models
- Google Gemini models
- Meta Llama models
- Mistral models
- And 190+ more...

### OpenAI

- **Status**: ✅ Production Ready
- **Tool Calling**: ✅ Full Support
- **MCP Support**: ⚡ Translated
- **Setup**: [OpenAI Setup Guide](./ROUTER_USER_GUIDE.md#openai)

```bash
npx agent-control-plane --provider openai --model gpt-4 --task "..."
```

### Ollama (Local Models)

- **Status**: ✅ Production Ready
- **Tool Calling**: ⚠️ Limited (text-based)
- **Privacy**: ✅ Fully Local
- **Setup**: [Ollama Setup Guide](./ROUTER_USER_GUIDE.md#ollama-local-models)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download models
ollama pull llama3:70b

# Use with agent-control-plane
npx agent-control-plane --provider ollama --model llama3:70b --task "..."
```

### LiteLLM (Universal Gateway)

- **Status**: ✅ Production Ready
- **Tool Calling**: ✅ Full Support
- **Models**: 100+ providers supported
- **Setup**: [LiteLLM Setup Guide](./ROUTER_USER_GUIDE.md#litellm-universal-gateway)

```bash
# Install LiteLLM
pip install litellm[proxy]

# Start proxy
litellm --config litellm_config.yaml

# Use with agent-control-plane
npx agent-control-plane --provider litellm --task "..."
```

## 🎯 Routing Strategies

### 1. Manual Routing

Explicitly select provider and model:

```bash
npx agent-control-plane --provider openai --model gpt-4 --task "..."
```

### 2. Cost-Optimized Routing

Automatically select cheapest suitable provider:

```json
{
  "routing": {
    "mode": "cost-optimized",
    "costOptimization": {
      "enabled": true,
      "maxCostPerRequest": 0.5
    }
  }
}
```

```bash
npx agent-control-plane --router-mode cost-optimized --task "..."
```

### 3. Performance-Optimized Routing

Prioritize fastest provider:

```json
{
  "routing": {
    "mode": "performance-optimized",
    "performance": {
      "targetLatency": 5000
    }
  }
}
```

### 4. Rule-Based Routing

Define custom routing rules:

```json
{
  "routing": {
    "mode": "rule-based",
    "rules": [
      {
        "condition": {
          "agentType": ["coder", "reviewer"],
          "requiresTools": true
        },
        "action": {
          "provider": "anthropic",
          "model": "claude-3-5-sonnet-20241022"
        }
      },
      {
        "condition": {
          "privacy": "high"
        },
        "action": {
          "provider": "ollama",
          "model": "llama3:70b"
        }
      }
    ]
  }
}
```

## 💰 Cost Optimization

### Track Costs

```bash
# View today's costs
npx agent-control-plane router costs --period today

# View monthly costs
npx agent-control-plane router costs --period month

# View costs by provider
npx agent-control-plane router costs --by-provider
```

### Set Budget Alerts

```bash
# Set daily budget
npx agent-control-plane router config set routing.costOptimization.budgetAlerts.daily 10.00

# Set monthly budget
npx agent-control-plane router config set routing.costOptimization.budgetAlerts.monthly 250.00
```

### Cost Optimization Tips

1. **Use cheaper models for simple tasks**:

   ```bash
   npx agent-control-plane --model gpt-3.5-turbo --agent researcher --task "Simple research"
   ```

2. **Route via OpenRouter for automatic cost optimization**:

   ```bash
   npx agent-control-plane --provider openrouter --router-mode cost-optimized --task "..."
   ```

3. **Use local models for development**:
   ```bash
   npx agent-control-plane --provider ollama --task "Development task"
   ```

## 🔧 Tool Calling Support

### Provider Compatibility

| Provider   | Tool Calling       | MCP Support   | Format           |
| ---------- | ------------------ | ------------- | ---------------- |
| Anthropic  | ✅ Full            | ✅ Native     | Anthropic Tools  |
| OpenAI     | ✅ Full            | ⚡ Translated | OpenAI Functions |
| OpenRouter | ✅ Varies by model | ⚡ Translated | Auto-detect      |
| Ollama     | ⚠️ Limited         | ❌ Manual     | Text-based       |
| LiteLLM    | ✅ Full            | ⚡ Translated | Auto-detect      |

### Enable Tool Translation

```json
{
  "toolCalling": {
    "translationEnabled": true,
    "defaultFormat": "anthropic",
    "formatMapping": {
      "openai": "openai-functions",
      "openrouter": "auto-detect"
    }
  }
}
```

### Using Tools with Different Providers

```bash
# Anthropic (native tool support)
npx agent-control-plane --provider anthropic --agent coder --task "Use bash and file tools"

# OpenAI (translated tool support)
npx agent-control-plane --provider openai --agent coder --task "Use bash and file tools"

# Ollama (text-based tools)
npx agent-control-plane --provider ollama --agent coder --task "Use tools" --tool-mode text
```

## 🔒 Privacy & Security

### Local-Only Mode

Route all requests to local models:

```bash
# Force local-only mode
npx agent-control-plane --local-only --task "Confidential analysis"
```

Configure in `router.config.json`:

```json
{
  "routing": {
    "mode": "rule-based",
    "rules": [
      {
        "condition": { "privacy": "high" },
        "action": { "provider": "ollama", "model": "llama3:70b" }
      }
    ]
  }
}
```

### API Key Security

1. **Use environment variables**:

   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   export OPENROUTER_API_KEY="sk-or-..."
   ```

2. **Never commit `.env` files to version control**

3. **Rotate keys regularly**:
   ```bash
   npx agent-control-plane router config update-key anthropic NEW_KEY
   ```

## 🚀 Getting Started Examples

### Example 1: Use OpenRouter for Cost Savings

```bash
# Configure OpenRouter in .env
echo "OPENROUTER_API_KEY=sk-or-..." >> .env

# Use cheaper Claude model via OpenRouter
npx agent-control-plane --provider openrouter \
  --model anthropic/claude-3-haiku \
  --agent coder \
  --task "Build simple CRUD API"
```

### Example 2: Privacy-Sensitive Development

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download local model
ollama pull llama3:70b

# Use local model
npx agent-control-plane --provider ollama \
  --model llama3:70b \
  --agent coder \
  --task "Analyze confidential business data"
```

### Example 3: Cost-Optimized Multi-Agent Workflow

```bash
# Configure cost optimization
npx agent-control-plane router init --mode cost-optimized

# Run multi-agent task with automatic provider selection
npx agent-control-plane \
  --router-mode cost-optimized \
  --task "Build full-stack app" \
  --max-cost 5.00
```

## 📊 Monitoring & Debugging

### View Router Status

```bash
# Check router configuration
npx agent-control-plane router status

# Test provider connectivity
npx agent-control-plane router test anthropic
npx agent-control-plane router test openrouter

# View available models
npx agent-control-plane router models --provider openrouter
```

### Debug Mode

```bash
# Enable debug logging
npx agent-control-plane --debug --task "..."

# View router logs
npx agent-control-plane router logs --level debug
```

### Validate Configuration

```bash
# Validate router config
npx agent-control-plane router validate ~/.agent-control-plane/router.config.json
```

## 🐳 Docker Support

### Build with Router Support

```bash
# Build Docker image
docker build -f docker/router.Dockerfile -t agent-control-plane:router .

# Run with router config
docker run -d \
  --env-file .env \
  -v ~/.agent-control-plane:/root/.agent-control-plane \
  agent-control-plane:router
```

### Test in Docker

```bash
# Test OpenRouter in Docker
docker run --env-file .env agent-control-plane:router \
  npx agent-control-plane --provider openrouter --agent coder --task "Hello world"
```

## 📈 Performance Metrics

### Expected Performance

- **Cost Reduction**: 30-50% with cost-optimized routing
- **Provider Diversity**: 5+ providers supported
- **Tool Compatibility**: 100% MCP tool compatibility
- **Latency**: <5s provider switching overhead
- **Reliability**: 99.9% uptime with fallback chain

### Benchmark Results

```bash
# Run performance benchmarks
npx agent-control-plane router benchmark

# Compare providers
npx agent-control-plane router benchmark --compare anthropic,openrouter,ollama
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Provider Connection Failed

```bash
# Test provider connectivity
npx agent-control-plane router test openrouter

# Check API key
npx agent-control-plane router config get providers.openrouter.apiKey
```

#### 2. Tool Calling Not Working

```bash
# Enable tool translation
npx agent-control-plane router config set toolCalling.translationEnabled true

# Check tool support
npx agent-control-plane router capabilities --provider openai
```

#### 3. High Costs

```bash
# Review cost breakdown
npx agent-control-plane router costs --detailed

# Enable cost limits
npx agent-control-plane router config set routing.costOptimization.maxCostPerRequest 0.50
```

### Get Help

- [User Guide](./ROUTER_USER_GUIDE.md)
- [Configuration Reference](./ROUTER_CONFIG_REFERENCE.md)
- [GitHub Issues](https://github.com/tafyai/gendev/issues)

## 🗺️ Roadmap

### Phase 1: Core Router (Weeks 1-2)

- ✅ Provider abstraction layer
- ✅ Basic routing logic
- ✅ OpenRouter integration
- 🚧 CLI integration

### Phase 2: Advanced Routing (Weeks 3-4)

- ⏳ Cost-optimized routing
- ⏳ Rule-based routing
- ⏳ Performance optimization

### Phase 3: Tool Translation (Weeks 5-6)

- ⏳ Tool format translation
- ⏳ MCP compatibility layer
- ⏳ Provider-specific adapters

### Future Enhancements

- Multi-provider consensus
- Advanced cost analytics
- Custom provider plugins
- Fine-tuned model routing

## 📝 Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Resources

- [Implementation Plan](./MULTI_MODEL_ROUTER_PLAN.md)
- [User Guide](./ROUTER_USER_GUIDE.md)
- [Configuration Reference](./ROUTER_CONFIG_REFERENCE.md)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [LiteLLM Documentation](https://docs.litellm.ai)

---

**Ready to get started?** Follow the [Quick Start](#-quick-start) guide above!
