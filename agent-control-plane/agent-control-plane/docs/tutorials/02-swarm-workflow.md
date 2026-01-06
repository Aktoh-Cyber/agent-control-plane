# Tutorial: Create a Swarm Workflow

Learn how to orchestrate multiple agents working together.

## Prerequisites

- Completed "Build Your First Agent" tutorial
- Understanding of multi-agent systems

## Step 1: Sequential Workflow

```bash
# Research -> Plan -> Code -> Test -> Review
npx agentopia --agent researcher --task "Research authentication patterns"
npx agentopia --agent planner --task "Plan JWT authentication implementation"
npx agentopia --agent coder --task "Implement JWT authentication"
npx agentopia --agent tester --task "Write tests for authentication"
npx agentopia --agent reviewer --task "Review authentication implementation"
```

## Step 2: Programmatic Swarm

```typescript
// src/workflows/auth-swarm.ts
import { AgentSDK } from '@anthropic-ai/claude-agent-sdk';
import * as reasoningbank from 'agentopia/reasoningbank';

async function authSwarm() {
  const agent = new AgentSDK({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Initialize memory
  await reasoningbank.initialize();

  // Step 1: Research
  const research = await agent.run({
    agent: 'researcher',
    task: 'Research JWT authentication best practices',
  });

  await reasoningbank.storeMemory('research', research.output, {
    namespace: 'auth-swarm',
  });

  // Step 2: Plan
  const researchContext = await reasoningbank.queryMemories('research', {
    namespace: 'auth-swarm',
  });

  const plan = await agent.run({
    agent: 'planner',
    task: 'Create implementation plan',
    context: { research: researchContext[0].value },
  });

  // Step 3: Implement
  const code = await agent.run({
    agent: 'coder',
    task: 'Implement JWT authentication',
    context: { plan: plan.output },
  });

  // Step 4: Test
  const tests = await agent.run({
    agent: 'tester',
    task: 'Write tests for authentication',
    context: { code: code.output },
  });

  // Step 5: Review
  const review = await agent.run({
    agent: 'reviewer',
    task: 'Review implementation and tests',
    context: {
      code: code.output,
      tests: tests.output,
    },
  });

  return {
    research: research.output,
    plan: plan.output,
    code: code.output,
    tests: tests.output,
    review: review.output,
  };
}

authSwarm().then((result) => {
  console.log('Swarm completed:', result);
});
```

## Step 3: Parallel Execution

```typescript
// src/workflows/parallel-swarm.ts
async function parallelSwarm() {
  const agent = new AgentSDK({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Execute multiple agents in parallel
  const [backend, frontend, tests] = await Promise.all([
    agent.run({
      agent: 'backend-dev',
      task: 'Build REST API',
    }),
    agent.run({
      agent: 'mobile-dev',
      task: 'Build React Native UI',
    }),
    agent.run({
      agent: 'tester',
      task: 'Write E2E tests',
    }),
  ]);

  return { backend, frontend, tests };
}
```

## Step 4: Conditional Workflows

```typescript
async function conditionalSwarm() {
  const agent = new AgentSDK({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Step 1: Code review
  const review = await agent.run({
    agent: 'reviewer',
    task: 'Review code quality',
  });

  // Step 2: Conditional refactoring
  if (review.metadata.quality < 0.8) {
    const refactored = await agent.run({
      agent: 'coder',
      task: 'Refactor code based on review',
      context: { review: review.output },
    });

    // Re-review
    return await agent.run({
      agent: 'reviewer',
      task: 'Review refactored code',
      context: { code: refactored.output },
    });
  }

  return review;
}
```

## Step 5: Shared Memory Swarm

```typescript
async function sharedMemorySwarm() {
  await reasoningbank.initialize();

  const agents = ['researcher', 'planner', 'coder', 'tester'];
  const results = [];

  for (const agentType of agents) {
    // Get context from previous agents
    const context = await reasoningbank.queryMemories('', {
      namespace: 'shared-swarm',
      limit: 10,
    });

    // Execute agent
    const result = await agent.run({
      agent: agentType,
      task: `Perform ${agentType} task`,
      context: { previous: context },
    });

    // Store result for next agents
    await reasoningbank.storeMemory(`${agentType}-result`, result.output, {
      namespace: 'shared-swarm',
    });

    results.push(result);
  }

  return results;
}
```

## Common Patterns

### Error Handling in Swarms

```typescript
async function robustSwarm() {
  try {
    const result = await agent.run({
      agent: 'coder',
      task: 'Implement feature',
    });
    return result;
  } catch (error) {
    // Fallback to simpler model
    return await agent.run({
      agent: 'coder',
      task: 'Implement feature',
      model: 'meta-llama/llama-3.1-8b',
    });
  }
}
```

### Progress Tracking

```typescript
async function trackedSwarm() {
  const tasks = ['research', 'plan', 'code', 'test', 'review'];
  const total = tasks.length;

  for (let i = 0; i < total; i++) {
    console.log(`Progress: ${i + 1}/${total} - ${tasks[i]}`);

    await agent.run({
      agent: tasks[i],
      task: `Perform ${tasks[i]} task`,
    });
  }
}
```

## Next Steps

- [Add a New MCP Tool](./03-mcp-tool.md)
- [Optimize Performance](./04-performance-optimization.md)
- [ReasoningBank Tutorial](./05-reasoningbank-tutorial.md)
