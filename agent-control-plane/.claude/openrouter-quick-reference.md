# OpenRouter Models Quick Reference for Claude Code

## Top 5 Models for Tool/Function Calling

### 🥇 1. Mistral Small 3.1 24B - BEST VALUE

```bash
Model: mistralai/mistral-small-3.1-24b
Cost: $0.02/M input | $0.04/M output
Speed: ⚡⚡⚡⚡ Fast
Tool Support: ⭐⭐⭐⭐⭐ Excellent
```

**Use for:** Production deployments - best cost/performance ratio

---

### 🥈 2. Cohere Command R7B - CHEAPEST PAID

```bash
Model: cohere/command-r7b-12-2024
Cost: $0.038/M input | $0.15/M output
Speed: ⚡⚡⚡⚡⚡ Very Fast
Tool Support: ⭐⭐⭐⭐⭐ Excellent
```

**Use for:** Budget-conscious deployments with agent workflows

---

### 🥉 3. Qwen Turbo - LARGE CONTEXT

```bash
Model: qwen/qwen-turbo
Cost: $0.05/M input | $0.20/M output
Speed: ⚡⚡⚡⚡⚡ Very Fast
Tool Support: ⭐⭐⭐⭐ Good
Context: 1M tokens
```

**Use for:** Projects needing massive context windows

---

### 🆓 4. DeepSeek V3 0324 - FREE

```bash
Model: deepseek/deepseek-chat-v3-0324:free
Cost: $0.00 (FREE!)
Speed: ⚡⚡⚡⚡ Fast
Tool Support: ⭐⭐⭐⭐ Good
```

**Use for:** Development, testing, cost-sensitive production

---

### ⭐ 5. Gemini 2.0 Flash - FREE (MOST POPULAR)

```bash
Model: google/gemini-2.0-flash-exp:free
Cost: $0.00 (FREE!)
Speed: ⚡⚡⚡⚡⚡ Very Fast
Tool Support: ⭐⭐⭐⭐⭐ Excellent
Limits: 20 req/min, 50/day if <$10 credits
```

**Use for:** Development, testing, low-volume production

---

## Quick Command Examples

```bash
# Best value - Mistral Small 3.1
agent-control-plane --agent coder --task "..." --provider openrouter \
  --model "mistralai/mistral-small-3.1-24b"

# Free tier - Gemini
agent-control-plane --agent researcher --task "..." --provider openrouter \
  --model "google/gemini-2.0-flash-exp:free"

# Cheapest provider auto-routing
agent-control-plane --agent optimizer --task "..." --provider openrouter \
  --model "deepseek/deepseek-chat:floor"
```

---

## Cost Comparison (per Million Tokens)

| Model             | Input  | Output | 50/50 Mix |
| ----------------- | ------ | ------ | --------- |
| Mistral Small 3.1 | $0.02  | $0.04  | $0.03     |
| Command R7B       | $0.038 | $0.15  | $0.094    |
| Qwen Turbo        | $0.05  | $0.20  | $0.125    |
| DeepSeek FREE     | $0.00  | $0.00  | $0.00     |
| Gemini FREE       | $0.00  | $0.00  | $0.00     |

---

## Pro Tips

1. **Use `:free` suffix** for free models
2. **Use `:floor` suffix** for cheapest provider
3. **Filter models:** https://openrouter.ai/models?supported_parameters=tools
4. **No extra fees** for tool calling - only token usage
5. **Free tier limits:** 20 req/min, 50/day (unlimited with $10+ balance)

---

## When to Use Which Model

- **Development/Testing:** Gemini 2.0 Flash Free
- **Production (Budget):** Mistral Small 3.1 24B
- **Production (Cheapest):** Command R7B
- **Large Context:** Qwen Turbo
- **Complex Reasoning:** DeepSeek Chat
- **Maximum Savings:** DeepSeek V3 0324 Free

---

Full research report: `/workspaces/agent-control-plane/agent-control-plane/.claude/openrouter-models-research.md`
