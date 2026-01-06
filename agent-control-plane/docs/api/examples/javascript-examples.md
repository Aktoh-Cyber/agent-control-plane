# JavaScript/TypeScript Examples

Comprehensive examples for using Agentic Flow API with JavaScript and TypeScript.

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [Agent Execution](#agent-execution)
- [MCP Tools](#mcp-tools)
- [Memory Operations](#memory-operations)
- [Swarm Coordination](#swarm-coordination)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)

## Installation

```bash
npm install agent-control-plane
# or
yarn add agent-control-plane
# or
pnpm add agent-control-plane
```

## Authentication

### Using API Key

```javascript
import { AgenticFlow } from 'agent-control-plane';

const client = new AgenticFlow({
  apiKey: process.env.AGENTIC_FLOW_API_KEY,
});
```

### Using JWT Token

```javascript
const client = new AgenticFlow({
  token: 'your-jwt-token-here',
});
```

### Environment Variables

```bash
# .env
AGENTIC_FLOW_API_KEY=af_live_1234567890abcdef
AGENTIC_FLOW_BASE_URL=https://api.agent-control-plane.io
```

```javascript
import dotenv from 'dotenv';
dotenv.config();

const client = new AgenticFlow({
  apiKey: process.env.AGENTIC_FLOW_API_KEY,
  baseURL: process.env.AGENTIC_FLOW_BASE_URL,
});
```

## Agent Execution

### Basic Agent Execution

```javascript
async function executeAgent() {
  const result = await client.agents.execute({
    agent: 'coder',
    task: 'Build a REST API with authentication',
  });

  console.log(result.output);
}

executeAgent().catch(console.error);
```

### TypeScript with Full Configuration

```typescript
import { AgenticFlow, AgentExecutionRequest, AgentExecutionResponse } from 'agent-control-plane';

async function executeAgentTyped(): Promise<void> {
  const client = new AgenticFlow({
    apiKey: process.env.AGENTIC_FLOW_API_KEY!,
  });

  const request: AgentExecutionRequest = {
    agent: 'coder',
    task: 'Build a REST API with authentication',
    model: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 300000,
  };

  const response: AgentExecutionResponse = await client.agents.execute(request);

  console.log(`Agent: ${response.agent}`);
  console.log(`Execution Time: ${response.executionTime}ms`);
  console.log(`Tokens Used: ${response.tokensUsed}`);
  console.log(`Cost: $${response.cost}`);
  console.log(`\nOutput:\n${response.output}`);
}

executeAgentTyped().catch(console.error);
```

### Streaming Output

```javascript
async function executeWithStreaming() {
  const stream = await client.agents.executeStream({
    agent: 'coder',
    task: 'Build a REST API',
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.token);
  }

  console.log('\n\nCompleted!');
}

executeWithStreaming().catch(console.error);
```

### Batch Execution

```javascript
async function batchExecute() {
  const result = await client.agents.batch({
    tasks: [
      {
        agent: 'researcher',
        task: 'Research REST API best practices',
      },
      {
        agent: 'coder',
        task: 'Implement the API endpoints',
      },
      {
        agent: 'tester',
        task: 'Write comprehensive tests',
      },
    ],
    maxConcurrency: 3,
    failFast: false,
  });

  console.log(`Completed: ${result.completed}/${result.totalTasks}`);
  result.results.forEach((r, i) => {
    console.log(`\nTask ${i}: ${r.success ? '✓' : '✗'}`);
    console.log(r.output.substring(0, 100) + '...');
  });
}

batchExecute().catch(console.error);
```

## MCP Tools

### List All Tools

```javascript
async function listMcpTools() {
  const tools = await client.mcp.tools.list({
    package: 'all',
  });

  console.log(`Total MCP Tools: ${tools.totalCount}`);
  console.log(`Packages:`, tools.packages);

  tools.tools.forEach((tool) => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
}

listMcpTools().catch(console.error);
```

### Execute MCP Tool

```javascript
async function executeMcpTool() {
  const result = await client.mcp.tools.execute({
    toolName: 'agentic_flow_agent',
    parameters: {
      agent: 'coder',
      task: 'Build a REST API',
      provider: 'anthropic',
    },
  });

  console.log(result);
}

executeMcpTool().catch(console.error);
```

## Memory Operations

### Store Memory

```javascript
async function storeMemory() {
  const result = await client.memory.store({
    key: 'auth_implementation_pattern',
    value: 'JWT authentication with refresh tokens works best for stateless APIs',
    metadata: {
      category: 'authentication',
      confidence: 0.95,
      source: 'production_experience',
    },
  });

  console.log(`Memory stored: ${result.memoryId}`);
}

storeMemory().catch(console.error);
```

### Retrieve Memory

```javascript
async function retrieveMemory() {
  const results = await client.memory.retrieve({
    query: 'How to implement authentication in REST API?',
    limit: 5,
    threshold: 0.7,
  });

  console.log(`Found ${results.count} relevant memories:\n`);

  results.results.forEach((memory, i) => {
    console.log(`${i + 1}. [${memory.similarity.toFixed(2)}] ${memory.key}`);
    console.log(`   ${memory.value}\n`);
  });
}

retrieveMemory().catch(console.error);
```

## Swarm Coordination

### Initialize Swarm

```javascript
async function initializeSwarm() {
  const swarm = await client.swarm.init({
    topology: 'mesh',
    maxAgents: 10,
    consensusProtocol: 'raft',
  });

  console.log(`Swarm initialized: ${swarm.swarmId}`);
  console.log(`Topology: ${swarm.topology}`);
  console.log(`Status: ${swarm.status}`);

  return swarm.swarmId;
}

initializeSwarm().catch(console.error);
```

### Spawn Agents

```javascript
async function spawnAgents(swarmId) {
  const agents = await Promise.all([
    client.swarm.spawnAgent(swarmId, {
      agentType: 'coder',
      role: 'implementation',
      capabilities: ['coding', 'refactoring'],
    }),
    client.swarm.spawnAgent(swarmId, {
      agentType: 'tester',
      role: 'quality-assurance',
      capabilities: ['testing', 'debugging'],
    }),
    client.swarm.spawnAgent(swarmId, {
      agentType: 'reviewer',
      role: 'code-review',
      capabilities: ['review', 'security'],
    }),
  ]);

  console.log(`Spawned ${agents.length} agents:`);
  agents.forEach((a) => console.log(`- ${a.agentId}`));
}

// Usage
(async () => {
  const swarmId = await initializeSwarm();
  await spawnAgents(swarmId);
})().catch(console.error);
```

## Error Handling

### Basic Error Handling

```javascript
async function executeWithErrorHandling() {
  try {
    const result = await client.agents.execute({
      agent: 'coder',
      task: 'Build a REST API',
    });
    console.log(result.output);
  } catch (error) {
    console.error('Error executing agent:', error.message);
  }
}

executeWithErrorHandling().catch(console.error);
```

### Advanced Error Handling

```typescript
import {
  AgenticFlowError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
} from 'agent-control-plane';

async function executeWithAdvancedErrorHandling() {
  try {
    const result = await client.agents.execute({
      agent: 'coder',
      task: 'Build a REST API',
    });
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation error:', error.details);
      // Fix input and retry
    } else if (error instanceof AuthenticationError) {
      console.error('Authentication failed:', error.message);
      // Refresh token or get new API key
    } else if (error instanceof RateLimitError) {
      const retryAfter = error.retryAfter || 60;
      console.log(`Rate limited. Retrying in ${retryAfter} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return executeWithAdvancedErrorHandling(); // Retry
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

executeWithAdvancedErrorHandling().catch(console.error);
```

### Retry with Exponential Backoff

```javascript
async function executeWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.agents.execute({
        agent: 'coder',
        task: 'Build a REST API',
      });
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.min(1000 * Math.pow(2, i), 30000);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

executeWithRetry().catch(console.error);
```

## Advanced Patterns

### Progress Tracking

```javascript
class AgentExecutionTracker {
  constructor(client) {
    this.client = client;
    this.onProgress = null;
  }

  async execute(request) {
    const startTime = Date.now();

    this.emitProgress('started', { request });

    const stream = await this.client.agents.executeStream(request);
    let output = '';

    for await (const chunk of stream) {
      output += chunk.token;
      this.emitProgress('token', { token: chunk.token, output });
    }

    const executionTime = Date.now() - startTime;
    this.emitProgress('completed', { output, executionTime });

    return { success: true, output, executionTime };
  }

  emitProgress(event, data) {
    if (this.onProgress) {
      this.onProgress(event, data);
    }
  }
}

// Usage
const tracker = new AgentExecutionTracker(client);

tracker.onProgress = (event, data) => {
  switch (event) {
    case 'started':
      console.log('Agent started...');
      break;
    case 'token':
      process.stdout.write(data.token);
      break;
    case 'completed':
      console.log(`\n\nCompleted in ${data.executionTime}ms`);
      break;
  }
};

await tracker.execute({
  agent: 'coder',
  task: 'Build a REST API',
});
```

### Cost Optimization

```javascript
async function executeWithCostOptimization(task) {
  // Get model recommendations
  const optimization = await client.agents.optimize({
    agent: 'coder',
    task,
    priority: 'cost', // or 'quality', 'speed', 'balanced'
    maxCost: 0.01,
  });

  console.log(`Recommended model: ${optimization.recommendedModel}`);
  console.log(`Estimated cost: $${optimization.estimatedCost}`);
  console.log(`Quality score: ${optimization.qualityScore}`);

  // Execute with recommended settings
  const result = await client.agents.execute({
    agent: 'coder',
    task,
    model: optimization.recommendedModel,
    provider: optimization.provider,
  });

  return result;
}

executeWithCostOptimization('Build a simple REST API').catch(console.error);
```

### Parallel Processing with Worker Pool

```javascript
class AgentWorkerPool {
  constructor(client, maxWorkers = 3) {
    this.client = client;
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.queue = [];
  }

  async execute(tasks) {
    const results = [];

    const processTask = async (task, index) => {
      this.activeWorkers++;
      try {
        const result = await this.client.agents.execute(task);
        results[index] = { success: true, result };
      } catch (error) {
        results[index] = { success: false, error };
      } finally {
        this.activeWorkers--;
        this.processQueue();
      }
    };

    const processQueue = () => {
      while (this.activeWorkers < this.maxWorkers && this.queue.length > 0) {
        const { task, index } = this.queue.shift();
        processTask(task, index);
      }
    };

    // Start processing
    for (let i = 0; i < tasks.length; i++) {
      if (this.activeWorkers < this.maxWorkers) {
        processTask(tasks[i], i);
      } else {
        this.queue.push({ task: tasks[i], index: i });
      }
    }

    // Wait for all tasks to complete
    while (this.activeWorkers > 0 || this.queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }
}

// Usage
const pool = new AgentWorkerPool(client, 5);

const tasks = [
  { agent: 'researcher', task: 'Research task 1' },
  { agent: 'researcher', task: 'Research task 2' },
  { agent: 'coder', task: 'Code task 1' },
  { agent: 'coder', task: 'Code task 2' },
  { agent: 'tester', task: 'Test task 1' },
];

const results = await pool.execute(tasks);
console.log(`Completed ${results.filter((r) => r.success).length}/${results.length} tasks`);
```

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(client, { threshold = 5, timeout = 60000, resetTimeout = 300000 } = {}) {
    this.client = client;
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(request) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await Promise.race([
        this.client.agents.execute(request),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), this.timeout)),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`Circuit breaker OPEN. Next attempt at ${new Date(this.nextAttempt)}`);
    }
  }
}

// Usage
const breaker = new CircuitBreaker(client);

try {
  const result = await breaker.execute({
    agent: 'coder',
    task: 'Build a REST API',
  });
  console.log(result.output);
} catch (error) {
  console.error('Circuit breaker prevented execution:', error.message);
}
```

## Testing

### Unit Tests with Jest

```javascript
import { jest } from '@jest/globals';
import { AgenticFlow } from 'agent-control-plane';

describe('AgenticFlow Client', () => {
  let client;

  beforeEach(() => {
    client = new AgenticFlow({
      apiKey: 'test-api-key',
    });
  });

  test('should execute agent successfully', async () => {
    const mockExecute = jest.spyOn(client.agents, 'execute').mockResolvedValue({
      success: true,
      agent: 'coder',
      output: 'Mock output',
    });

    const result = await client.agents.execute({
      agent: 'coder',
      task: 'Test task',
    });

    expect(result.success).toBe(true);
    expect(result.agent).toBe('coder');
    expect(mockExecute).toHaveBeenCalledWith({
      agent: 'coder',
      task: 'Test task',
    });
  });

  test('should handle errors gracefully', async () => {
    jest.spyOn(client.agents, 'execute').mockRejectedValue(new Error('Test error'));

    await expect(client.agents.execute({ agent: 'coder', task: 'Test' })).rejects.toThrow(
      'Test error'
    );
  });
});
```

## Complete Example: Full Workflow

```typescript
import { AgenticFlow } from 'agent-control-plane';

async function fullWorkflow() {
  const client = new AgenticFlow({
    apiKey: process.env.AGENTIC_FLOW_API_KEY!,
  });

  try {
    // 1. Initialize swarm
    console.log('Initializing swarm...');
    const swarm = await client.swarm.init({
      topology: 'mesh',
      maxAgents: 5,
      consensusProtocol: 'raft',
    });

    // 2. Spawn agents
    console.log('Spawning agents...');
    await Promise.all([
      client.swarm.spawnAgent(swarm.swarmId, {
        agentType: 'researcher',
        role: 'research',
      }),
      client.swarm.spawnAgent(swarm.swarmId, {
        agentType: 'coder',
        role: 'implementation',
      }),
      client.swarm.spawnAgent(swarm.swarmId, {
        agentType: 'tester',
        role: 'quality-assurance',
      }),
    ]);

    // 3. Execute tasks in parallel
    console.log('Executing tasks...');
    const results = await client.agents.batch({
      tasks: [
        {
          agent: 'researcher',
          task: 'Research microservices architecture patterns',
        },
        {
          agent: 'coder',
          task: 'Implement user authentication service',
        },
        {
          agent: 'tester',
          task: 'Write integration tests',
        },
      ],
      maxConcurrency: 3,
    });

    // 4. Store results in memory
    console.log('Storing results in memory...');
    for (const result of results.results) {
      await client.memory.store({
        key: `task_${result.taskId}_result`,
        value: result.output,
        metadata: {
          agent: result.agent,
          success: result.success,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 5. Generate summary
    console.log('\n=== Workflow Summary ===');
    console.log(`Swarm ID: ${swarm.swarmId}`);
    console.log(`Tasks Completed: ${results.completed}/${results.totalTasks}`);
    console.log(`Total Execution Time: ${results.totalExecutionTime}ms`);

    return {
      swarmId: swarm.swarmId,
      results: results.results,
    };
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

fullWorkflow().then(console.log).catch(console.error);
```

---

**Last Updated**: 2025-12-08
**Version**: 1.10.3
