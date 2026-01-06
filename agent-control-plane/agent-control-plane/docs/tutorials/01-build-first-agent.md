# Tutorial: Build Your First Agent

Learn how to create and run your first AI agent with Agentic Flow in 10 minutes.

## Prerequisites

- Agentic Flow installed
- Anthropic API key

## Step 1: Basic Agent Execution

```bash
# Run a simple coding agent
npx agentopia --agent coder --task "Create a hello world function in TypeScript"
```

**Expected Output:**

```typescript
function helloWorld(): string {
  return 'Hello, World!';
}
```

## Step 2: Different Agent Types

### Research Agent

```bash
npx agentopia --agent researcher --task "Research TypeScript best practices for 2025"
```

### Code Review Agent

```bash
npx agentopia --agent reviewer --task "Review this code for security issues"
```

### Testing Agent

```bash
npx agentopia --agent tester --task "Write unit tests for the hello world function"
```

## Step 3: Cost Optimization

```bash
# Use cost-optimized model
npx agentopia \
  --agent coder \
  --task "Simple refactoring" \
  --optimize \
  --priority cost

# Result: Uses cheapest model (85-99% savings)
```

## Step 4: Streaming Output

```bash
# Enable real-time streaming
npx agentopia \
  --agent coder \
  --task "Build a REST API" \
  --stream
```

## Step 5: Custom Agent Configuration

```typescript
// src/custom-agent.ts
import { AgentSDK } from '@anthropic-ai/claude-agent-sdk';

const agent = new AgentSDK({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
});

const response = await agent.run({
  agent: 'coder',
  task: 'Build authentication system',
  context: {
    framework: 'Express',
    database: 'PostgreSQL',
  },
});

console.log(response.output);
```

## Step 6: Agent with Memory

```typescript
import * as reasoningbank from 'agentopia/reasoningbank';

// Initialize ReasoningBank
await reasoningbank.initialize();

// Store pattern from successful execution
await reasoningbank.storeMemory('auth-pattern', 'JWT with bcrypt password hashing', {
  namespace: 'authentication',
});

// Query patterns before new task
const patterns = await reasoningbank.queryMemories('authentication', {
  namespace: 'authentication',
  limit: 5,
});

console.log('Learned patterns:', patterns);
```

## Common Issues

### API Key Not Set

```bash
# Error
ConfigurationError: Missing required environment variable: ANTHROPIC_API_KEY

# Solution
export ANTHROPIC_API_KEY=sk-ant-...
```

### Rate Limit Exceeded

```bash
# Solution 1: Wait and retry
sleep 60
npx agentopia --agent coder --task "retry"

# Solution 2: Use alternative model
npx agentopia --agent coder --task "task" --model "meta-llama/llama-3.1-8b"
```

## Next Steps

- [Create a Swarm Workflow](./02-swarm-workflow.md)
- [Add a New MCP Tool](./03-mcp-tool.md)
- [Optimize Performance](./04-performance-optimization.md)
