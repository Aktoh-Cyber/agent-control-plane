# Getting Started in 5 Minutes

Welcome to Agentic Flow - the AI agent framework that gets smarter AND faster every time it runs. This guide will have you running your first agent in under 5 minutes.

## What You'll Learn

- [Minute 0: Quick Setup](#minute-0-quick-setup-30-seconds) (30 seconds)
- [Minute 1: Your First Agent](#minute-1-your-first-agent-60-seconds) (60 seconds)
- [Minute 2: First Swarm](#minute-2-your-first-swarm-90-seconds) (90 seconds)
- [Minute 3: Learning Memory](#minute-3-learning-memory-60-seconds) (60 seconds)
- [Minute 4: Cost Optimization](#minute-4-cost-optimization-60-seconds) (60 seconds)
- [Minute 5: Next Steps](#minute-5-verification--next-steps-30-seconds) (30 seconds)

---

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm or pnpm** installed (`npm --version`)
- [ ] **API Key** from one of:
  - Anthropic Claude (recommended): [console.anthropic.com](https://console.anthropic.com)
  - OpenRouter (100+ models): [openrouter.ai](https://openrouter.ai)
  - Or use ONNX for free local inference (no API key needed)

---

## Minute 0: Quick Setup (30 seconds)

### Installation

```bash
# Option 1: Global installation (recommended)
npm install -g agent-control-plane

# Option 2: Use directly with npx (no installation)
npx agent-control-plane --help
```

### Set Your API Key

Choose your preferred provider:

```bash
# Option A: Anthropic Claude (recommended for quality)
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option B: OpenRouter (recommended for cost savings)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Option C: ONNX (free local inference, no API key needed)
export USE_ONNX=true
```

**Pro Tip:** Add your API key to `~/.bashrc` or `~/.zshrc` to make it permanent:

```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.bashrc
source ~/.bashrc
```

### Verify Installation

```bash
# Check version
npx agent-control-plane --version

# List available agents (150+ built-in)
npx agent-control-plane --list
```

**Expected Output:**

```
🤖 Agentic Flow v1.10.3

Available Agents (150+):
  Core Development: coder, reviewer, tester, planner, researcher
  Specialized: backend-dev, mobile-dev, ml-developer, system-architect
  Swarm Coordinators: hierarchical-coordinator, mesh-coordinator
  ...
```

---

## Minute 1: Your First Agent (60 seconds)

### Hello World Agent

Run your first agent to analyze a simple task:

```bash
npx agent-control-plane \
  --agent researcher \
  --task "Explain how Agentic Flow works in 3 bullet points"
```

**What's Happening:**

1. Spawns a `researcher` agent
2. Agent analyzes the task
3. Returns structured analysis
4. Automatically uses Agent Booster for 352x faster code operations

### Expected Output

```
🤖 Starting Researcher Agent...

Agent Response:
• Agentic Flow is an AI agent orchestration platform with 150+ specialized agents
• It includes Agent Booster (352x faster code edits) and ReasoningBank (learning memory)
• Supports 213 MCP tools across 4 servers for swarm coordination and automation

✓ Task completed in 2.3 seconds
💰 Cost: $0.002 (using Claude Sonnet 4.5)
```

### Try Different Agents

```bash
# Coder agent - Write code
npx agent-control-plane \
  --agent coder \
  --task "Write a function to calculate fibonacci numbers"

# Reviewer agent - Code review
npx agent-control-plane \
  --agent reviewer \
  --task "Review best practices for REST API error handling"

# Tester agent - Create tests
npx agent-control-plane \
  --agent tester \
  --task "Create test cases for user authentication"
```

---

## Minute 2: Your First Swarm (90 seconds)

### Parallel Agent Execution

Run multiple agents concurrently for complex tasks:

```bash
# Parallel mode: Spawns 3 agents (researcher, coder, tester)
npx agent-control-plane
```

This automatically:

1. Spawns researcher agent to analyze requirements
2. Spawns coder agent to implement solution
3. Spawns tester agent to create test suite
4. Coordinates results via shared memory

### Custom Multi-Agent Workflow

Create a file `multi-agent-task.sh`:

```bash
#!/bin/bash

# Run multiple agents in parallel for a full-stack app
echo "Building Full-Stack Application..."

# Research phase
npx agent-control-plane --agent researcher --task "Analyze REST API best practices for Node.js" &
PID1=$!

# Implementation phase (waits for research)
wait $PID1
npx agent-control-plane --agent backend-dev --task "Build Express.js REST API with authentication" &
npx agent-control-plane --agent coder --task "Create React frontend with API integration" &
PID2=$!
PID3=$!

# Testing phase (waits for implementation)
wait $PID2 $PID3
npx agent-control-plane --agent tester --task "Create integration tests for API and frontend"

echo "✓ Full-stack app complete!"
```

Run it:

```bash
chmod +x multi-agent-task.sh
./multi-agent-task.sh
```

### Swarm Coordination (Advanced)

Use the swarm-learning optimizer for automatic topology selection:

```bash
# Automatically selects best topology (mesh/hierarchical/ring)
# based on task complexity and agent count
npx agent-control-plane \
  --agent hierarchical-coordinator \
  --task "Coordinate 10 agents to refactor a large codebase"
```

**Performance:**

- **Mesh topology**: 2.5x speedup for 1-10 agents
- **Hierarchical topology**: 3.5-4.0x speedup for 6-50 agents (recommended)
- **Ring topology**: Sequential processing with parallel execution

---

## Minute 3: Learning Memory (60 seconds)

### ReasoningBank Demo

See how agents learn from experience:

```bash
# Run interactive demo showing 0% → 100% success transformation
npx agent-control-plane reasoningbank demo
```

**Expected Output:**

```
🧠 ReasoningBank Learning Demo

Without Memory:
  Attempt 1: ❌ Failed (70% success rate)
  Attempt 2: ❌ Failed (repeats same mistake)
  Attempt 3: ❌ Failed (no improvement)

With ReasoningBank:
  Attempt 1: ❌ Failed (learning...)
  Attempt 2: ⚠️  Partial (applying patterns...)
  Attempt 3: ✓ Success (90% success rate, 46% faster!)

Memory stored: 15 patterns learned
Next execution: Predicted 95% success rate
```

### Initialize Memory System

```bash
# Create local memory database
npx agent-control-plane reasoningbank init

# Check memory status
npx agent-control-plane reasoningbank status
```

### Use Memory in Agents

Agents automatically query and store memories:

```bash
# First run: Agent learns the task
npx agent-control-plane \
  --agent coder \
  --task "Refactor authentication middleware for better error handling"

# Second run: Agent recalls previous patterns (46% faster!)
npx agent-control-plane \
  --agent coder \
  --task "Refactor authorization middleware for better error handling"
```

### AgentDB CLI (Advanced Memory Operations)

```bash
# Store reflexion (agent self-critique)
npx agentdb reflexion store "session-1" "implement_auth" 0.95 true "Success!"

# Search for learned skills
npx agentdb skill search "authentication" 10

# Query causal relationships
npx agentdb causal query "" "code_quality" 0.8

# Run learning optimizer
npx agentdb learner run
```

---

## Minute 4: Cost Optimization (60 seconds)

### Automatic Model Selection

Let the router choose the best model for you:

```bash
# Auto-select model balancing quality vs cost
npx agent-control-plane \
  --agent coder \
  --task "Build a simple REST API endpoint" \
  --optimize

# Optimize for lowest cost (99% savings!)
npx agent-control-plane \
  --agent coder \
  --task "Add error handling to API" \
  --optimize \
  --priority cost

# Optimize for highest quality
npx agent-control-plane \
  --agent reviewer \
  --task "Security audit of authentication system" \
  --optimize \
  --priority quality
```

### Cost Comparison

| Priority   | Model Selected    | Cost per Task | Use Case                           |
| ---------- | ----------------- | ------------- | ---------------------------------- |
| `quality`  | Claude Sonnet 4.5 | $0.08         | Complex reasoning, security audits |
| `balanced` | DeepSeek R1       | $0.012        | General development (85% cheaper)  |
| `cost`     | Llama 3.1 8B      | $0.001        | Simple tasks (99% cheaper)         |
| `privacy`  | ONNX Phi-4        | $0.00         | Offline, private (100% free)       |

### Budget Control

Set maximum cost per task:

```bash
# Never spend more than $0.001 per task
npx agent-control-plane \
  --agent coder \
  --task "Simple code cleanup" \
  --optimize \
  --max-cost 0.001
```

### Monthly Savings Example

**Without Optimization:**

- 100 code reviews/day × $0.08 = **$8/day = $240/month**

**With Optimization (DeepSeek R1):**

- 100 code reviews/day × $0.012 = **$1.20/day = $36/month**
- **Savings: $204/month (85% reduction)**

---

## Minute 5: Verification & Next Steps (30 seconds)

### Verify Everything Works

Run the complete test suite:

```bash
# Quick verification
npx agent-control-plane --agent researcher --task "Say hello world"

# ReasoningBank validation (27 tests)
npx agent-control-plane reasoningbank test

# List all agents
npx agent-control-plane --list
```

**Expected Results:**

- ✓ Agent executes successfully
- ✓ ReasoningBank tests pass (27/27)
- ✓ 150+ agents available

---

## Visual Flow Diagrams

### Agent Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Agentic Flow Architecture                │
└─────────────────────────────────────────────────────────────┘

User Request
     │
     ▼
┌─────────────────┐
│   CLI Parser    │  Parse --agent, --task, --optimize
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Model Router    │  Select best model (if --optimize)
│ (Optional)      │  • Quality: Claude Sonnet
└────────┬────────┘  • Cost: DeepSeek/Llama
         │           • Privacy: ONNX local
         ▼
┌─────────────────┐
│ Agent Spawner   │  Load agent from 150+ built-in
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│            Agent Execution Loop             │
│  ┌────────────────────────────────────┐   │
│  │ 1. Query ReasoningBank (Memory)    │   │
│  │    → Retrieve past patterns        │   │
│  └──────────────┬─────────────────────┘   │
│                 ▼                           │
│  ┌────────────────────────────────────┐   │
│  │ 2. Execute Task with Context       │   │
│  │    → Apply Agent Booster (352x)    │   │
│  └──────────────┬─────────────────────┘   │
│                 ▼                           │
│  ┌────────────────────────────────────┐   │
│  │ 3. Store Learning (Episode)        │   │
│  │    → Save patterns to memory       │   │
│  └────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         │
         ▼
    ┌──────────┐
    │  Result  │  Return to user + cost/time stats
    └──────────┘
```

### Swarm Coordination Flow

```
┌──────────────────────────────────────────────────────────────┐
│              Multi-Agent Swarm Coordination                  │
└──────────────────────────────────────────────────────────────┘

User Task: "Build full-stack application"
     │
     ▼
┌─────────────────────────────────────┐
│  Swarm Learning Optimizer (v2.0)   │
│  • Analyze task complexity          │
│  • Select topology (mesh/hierarchical/ring)
│  • Expected speedup: 3.5x           │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Topology: Hierarchical │
    │  (6-50 agents)        │
    └──────────┬─────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
     ▼                    ▼
┌──────────┐      ┌──────────────┐
│Coordinator│      │ Shared Memory │
│  Agent   │◄────►│ (ReasoningBank)│
└────┬─────┘      └──────────────┘
     │
     │ Delegates tasks
     │
     ├──────────────┬────────────────┬─────────────┐
     ▼              ▼                ▼             ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Researcher│  │Backend   │  │Frontend  │  │  Tester  │
│ Agent   │  │Dev Agent │  │Coder     │  │  Agent   │
└────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │            │             │             │
     └────────────┴─────────────┴─────────────┘
                  │
                  ▼
           ┌─────────────┐
           │Aggregated   │
           │Results      │
           └─────────────┘
```

### ReasoningBank Learning Cycle

```
┌────────────────────────────────────────────────────────────┐
│          ReasoningBank: Learning from Experience           │
└────────────────────────────────────────────────────────────┘

First Execution (No Memory)
     │
     ▼
┌────────────────┐
│ Task: Auth     │  70% success rate
│ Attempt 1      │  ❌ Missing edge cases
└────────┬───────┘
         │ STORE
         ▼
┌─────────────────────────────────┐
│    ReasoningBank Database       │
│  • Task: "authentication"       │
│  • Pattern: "check null inputs" │
│  • Reward: 0.7                  │
│  • Critique: "Add validation"   │
└──────────┬──────────────────────┘
           │
           │ QUERY (similar task)
           ▼
Second Execution (With Memory)
     │
     ▼
┌────────────────────────────────┐
│ Task: Authorization            │
│ Retrieve: "authentication"     │ ◄── Semantic search
│           "check null inputs"  │
└────────┬───────────────────────┘
         │ APPLY PATTERNS
         ▼
┌────────────────┐
│ Task: Auth     │  90% success rate
│ Attempt 2      │  ✓ 46% faster
└────────┬───────┘  ✓ Fewer errors
         │ UPDATE
         ▼
┌─────────────────────────────────┐
│    ReasoningBank Database       │
│  • Task: "authorization"        │
│  • Pattern: "null + role check" │
│  • Reward: 0.9                  │
│  • Critique: "Excellent!"       │
└─────────────────────────────────┘

Continuous Improvement: 0.7 → 0.9 → 0.95 → ...
```

---

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not set"

**Symptoms:**

```
Error: ANTHROPIC_API_KEY environment variable not set
```

**Solutions:**

1. **Set API key in current session:**

   ```bash
   export ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

2. **Make it permanent (recommended):**

   ```bash
   # For bash
   echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.bashrc
   source ~/.bashrc

   # For zsh (macOS default)
   echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Use alternative provider:**

   ```bash
   # OpenRouter (100+ models)
   export OPENROUTER_API_KEY=sk-or-v1-your-key-here
   npx agent-control-plane --agent coder --task "Your task" --provider openrouter

   # ONNX (free local inference)
   export USE_ONNX=true
   npx agent-control-plane --agent coder --task "Your task"
   ```

### Issue: "Agent not found"

**Symptoms:**

```
Error: Agent 'my-agent' not found
```

**Solutions:**

1. **List available agents:**

   ```bash
   npx agent-control-plane --list
   ```

2. **Check agent name spelling:**

   ```bash
   # ❌ Wrong
   npx agent-control-plane --agent "code reviewer" --task "Review code"

   # ✓ Correct
   npx agent-control-plane --agent reviewer --task "Review code"
   ```

3. **Create custom agent:**
   ```bash
   npx agent-control-plane agent create
   # Follow interactive prompts
   ```

### Issue: "Module not found" after installation

**Symptoms:**

```
Error: Cannot find module 'agent-control-plane'
```

**Solutions:**

1. **Verify installation:**

   ```bash
   npm list -g agent-control-plane
   ```

2. **Reinstall package:**

   ```bash
   npm uninstall -g agent-control-plane
   npm install -g agent-control-plane
   ```

3. **Use npx (no installation needed):**

   ```bash
   npx agent-control-plane --help
   ```

4. **Check Node.js version:**
   ```bash
   node --version  # Must be 18.0.0 or higher
   ```

### Issue: "Rate limit exceeded"

**Symptoms:**

```
Error: Rate limit exceeded (429)
```

**Solutions:**

1. **Use cost optimization to reduce API calls:**

   ```bash
   npx agent-control-plane \
     --agent coder \
     --task "Your task" \
     --optimize \
     --priority cost
   ```

2. **Switch to cheaper model:**

   ```bash
   # Use OpenRouter with budget models
   export OPENROUTER_API_KEY=sk-or-v1-your-key
   npx agent-control-plane \
     --agent coder \
     --task "Your task" \
     --provider openrouter \
     --model "meta-llama/llama-3.1-8b-instruct"
   ```

3. **Use ONNX local inference (no rate limits):**
   ```bash
   export USE_ONNX=true
   npx agent-control-plane --agent coder --task "Your task"
   ```

### Issue: "ReasoningBank database not initialized"

**Symptoms:**

```
Warning: ReasoningBank not initialized, skipping memory queries
```

**Solutions:**

1. **Initialize database:**

   ```bash
   npx agent-control-plane reasoningbank init
   ```

2. **Verify database exists:**

   ```bash
   npx agent-control-plane reasoningbank status
   ```

3. **Check database location:**
   ```bash
   # Default: ./agentdb.db
   ls -lh agentdb.db
   ```

### Issue: Slow agent execution

**Symptoms:**

- Agent takes >30 seconds to respond
- High latency between operations

**Solutions:**

1. **Enable streaming for real-time output:**

   ```bash
   npx agent-control-plane --agent coder --task "Your task" --stream
   ```

2. **Use faster model:**

   ```bash
   npx agent-control-plane \
     --agent coder \
     --task "Your task" \
     --optimize \
     --priority speed
   ```

3. **Check network connection:**

   ```bash
   curl -I https://api.anthropic.com
   ```

4. **Use local ONNX inference:**
   ```bash
   export USE_ONNX=true
   npx agent-control-plane --agent coder --task "Your task"
   ```

### Common Pitfalls

1. **Forgetting to set API key before running:**
   - Always run `export ANTHROPIC_API_KEY=...` first
   - Or add to shell config for persistence

2. **Using wrong agent for the task:**
   - Use `researcher` for analysis
   - Use `coder` for implementation
   - Use `reviewer` for code review
   - Use `tester` for test creation

3. **Not using --optimize flag:**
   - Always add `--optimize` to save costs
   - Add `--priority cost` for maximum savings

4. **Ignoring ReasoningBank:**
   - Initialize with `npx agent-control-plane reasoningbank init`
   - Let agents learn from experience (46% faster!)

---

## Next Steps

### Explore Advanced Features

1. **Agent Booster (352x faster code edits)**

   ```bash
   # Automatic: Detects code editing tasks
   npx agent-control-plane --agent coder --task "Refactor code"

   # Manual control
   npx agent-control-plane --agent coder --task "Add types" --agent-booster
   ```

2. **Multi-Model Router (99% cost savings)**

   ```bash
   # Learn about model capabilities
   cat docs/agent-control-plane/benchmarks/MODEL_CAPABILITIES.md

   # Use specific model
   npx agent-control-plane \
     --agent coder \
     --task "Build API" \
     --provider openrouter \
     --model "deepseek/deepseek-chat"
   ```

3. **MCP Tools (213 available)**

   ```bash
   # Start MCP server
   npx agent-control-plane mcp start

   # List all 213 tools
   npx agent-control-plane mcp list

   # Tools include:
   # • Neural networks (training, inference)
   # • GitHub integration (PR management, code review)
   # • Swarm coordination (multi-agent orchestration)
   # • Workflow automation (CI/CD, task orchestration)
   ```

4. **QUIC Transport (50-70% faster communication)**

   ```bash
   # Start QUIC server
   npx agent-control-plane quic

   # Perfect for swarm coordination and real-time agent communication
   ```

5. **Federation Hub (ephemeral agents)**

   ```bash
   # Start federation hub
   npx agent-control-plane federation start

   # Spawn ephemeral agent (5s-15min lifetime)
   npx agent-control-plane federation spawn

   # View statistics
   npx agent-control-plane federation stats
   ```

### Read Documentation

- **Agent Booster**: `docs/guides/AGENT-BOOSTER.md`
- **ReasoningBank**: `docs/guides/REASONINGBANK.md`
- **Multi-Model Router**: `docs/guides/MULTI-MODEL-ROUTER.md`
- **Docker Deployment**: `docs/guides/DOCKER_AGENT_USAGE.md`
- **Implementation Examples**: `docs/guides/IMPLEMENTATION_EXAMPLES.md`

### Join Community

- **GitHub**: [github.com/Aktoh-Cyber/agent-control-plane](https://github.com/Aktoh-Cyber/agent-control-plane)
- **Issues**: [Report bugs or request features](https://github.com/Aktoh-Cyber/agent-control-plane/issues)
- **Discussions**: [Ask questions](https://github.com/Aktoh-Cyber/agent-control-plane/discussions)

---

## Quick Reference

### Essential Commands

```bash
# Basic agent execution
npx agent-control-plane --agent <agent-name> --task "<description>"

# With optimization (recommended)
npx agent-control-plane --agent <agent-name> --task "<description>" --optimize

# List all agents
npx agent-control-plane --list

# ReasoningBank demo
npx agent-control-plane reasoningbank demo

# MCP server
npx agent-control-plane mcp start

# Help
npx agent-control-plane --help
```

### Common Workflows

```bash
# 1. Code Review
npx agent-control-plane \
  --agent reviewer \
  --task "Review authentication middleware" \
  --optimize

# 2. Bug Fix
npx agent-control-plane \
  --agent coder \
  --task "Fix race condition in database connection pool" \
  --optimize \
  --priority quality

# 3. Test Creation
npx agent-control-plane \
  --agent tester \
  --task "Create integration tests for payment API" \
  --optimize

# 4. Research
npx agent-control-plane \
  --agent researcher \
  --task "Analyze GraphQL vs REST for microservices" \
  --optimize \
  --priority quality

# 5. System Design
npx agent-control-plane \
  --agent system-architect \
  --task "Design scalable notification system" \
  --optimize
```

---

## Summary

Congratulations! You've completed the 5-minute quick start. You now know how to:

- ✓ Install and configure Agentic Flow
- ✓ Run your first agent
- ✓ Create multi-agent swarms
- ✓ Use learning memory (ReasoningBank)
- ✓ Optimize costs (up to 99% savings)
- ✓ Troubleshoot common issues

**Key Takeaways:**

1. **Speed**: Agent Booster provides 352x faster code operations
2. **Intelligence**: ReasoningBank learns from experience (46% faster execution)
3. **Cost**: Model optimization saves up to 99% on API costs
4. **Scale**: Swarm coordination enables 3.5-5.0x speedup with hierarchical topology

**Next Actions:**

1. Run `npx agent-control-plane reasoningbank demo` to see learning in action
2. Try `npx agent-control-plane --optimize` on your next task
3. Explore 150+ built-in agents with `npx agent-control-plane --list`
4. Read advanced guides in `docs/guides/`

---

**Need Help?**

- Documentation: [github.com/Aktoh-Cyber/agent-control-plane/tree/main/docs](https://github.com/Aktoh-Cyber/agent-control-plane/tree/main/docs)
- Issues: [github.com/Aktoh-Cyber/agent-control-plane/issues](https://github.com/Aktoh-Cyber/agent-control-plane/issues)
- Quick Start: You're reading it!

**Built with ❤️ by [@ruvnet](https://github.com/ruvnet)**
