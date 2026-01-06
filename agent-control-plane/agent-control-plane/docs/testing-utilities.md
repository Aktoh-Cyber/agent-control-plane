# Testing Utilities Documentation

Comprehensive test utilities framework for the Hive Mind collective intelligence system.

## Table of Contents

1. [Overview](#overview)
2. [Data Builders](#data-builders)
3. [Mock Utilities](#mock-utilities)
4. [Test Helpers](#test-helpers)
5. [Fixtures](#fixtures)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

## Overview

The testing utilities framework provides a complete set of tools for testing AI agent systems, swarm coordination, memory management, and workflow orchestration.

### Key Features

- **Fluent Data Builders**: Create test data with expressive, chainable API
- **Comprehensive Mocks**: In-memory mocks for databases, APIs, and external services
- **Rich Assertions**: Custom assertions for common test scenarios
- **Async Utilities**: Tools for testing asynchronous code
- **Test Fixtures**: Pre-configured scenarios for common use cases
- **Type Safety**: Full TypeScript support with type inference

## Data Builders

Data builders provide a fluent API for creating test data with sensible defaults.

### User Builder

```typescript
import { aUser, userBuilders } from './tests/utils';

// Basic usage
const user = aUser().withEmail('test@example.com').withUsername('testuser').build();

// Quick builders
const admin = userBuilders.admin();
const guest = userBuilders.guest();
const inactive = userBuilders.inactive();

// Chaining
const customUser = aUser()
  .asAdmin()
  .withCredits(50000)
  .withMetadata('department', 'engineering')
  .build();
```

### Agent Builder

```typescript
import { anAgent, agentBuilders } from './tests/utils';

// Create specific agent types
const researcher = anAgent().asResearcher().build();
const coder = anAgent().asCoder().build();
const tester = anAgent().asTester().build();

// Custom configuration
const agent = anAgent()
  .withName('Custom Agent')
  .withModel('claude-sonnet-4-5-20250929')
  .withTemperature(0.8)
  .withCapability('code-analysis')
  .inSwarm('swarm-123')
  .build();

// Quick builders
const runningAgent = agentBuilders.running();
const failedAgent = agentBuilders.failed();
```

### Task Builder

```typescript
import { aTask, taskBuilders } from './tests/utils';

// Create different task types
const codingTask = aTask()
  .asCodingTask()
  .withTitle('Implement feature X')
  .assignedTo('agent-123')
  .withPriority('high')
  .build();

// Add dependencies
const reviewTask = aTask()
  .asReviewTask()
  .dependsOn('task-coding')
  .dependsOn('task-testing')
  .build();

// Quick builders
const completed = taskBuilders.completed();
const failed = taskBuilders.failed();
const critical = taskBuilders.critical();
```

### Job Builder

```typescript
import { aJob, jobBuilders } from './tests/utils';

// Create swarm job
const job = aJob()
  .asSwarmJob()
  .withName('Development Swarm')
  .withTasks(['task-1', 'task-2', 'task-3'])
  .withAgents(['agent-1', 'agent-2'])
  .withParallel(true)
  .withAutoScale()
  .build();

// Pipeline job
const pipeline = jobBuilders.pipeline();
```

### Memory Builder

```typescript
import { aMemory, memoryBuilders } from './tests/utils';

// Different memory types
const shortTerm = aMemory()
  .inNamespace('session')
  .withValue({ data: 'test' })
  .withTTL(3600)
  .build();

const longTerm = aMemory().asLongTerm().withImportance(0.95).withAccessCount(100).build();

// Quick builders
const episodic = memoryBuilders.episodic();
const semantic = memoryBuilders.semantic();
const procedural = memoryBuilders.procedural();
```

### Vector Builder

```typescript
import { aVector, vectorBuilders, vectorUtils } from './tests/utils';

// Create from text
const vector = aVector()
  .fromText('Sample text for embedding')
  .withMetadata('type', 'documentation')
  .inNamespace('docs')
  .build();

// Different dimensions
const openai = vectorBuilders.openai(); // 1536 dimensions
const small = vectorBuilders.small(); // 384 dimensions
const large = vectorBuilders.large(); // 4096 dimensions

// Calculate similarity
const similarity = vectorUtils.cosineSimilarity(vector1.embedding, vector2.embedding);
```

### Configuration Builders

```typescript
import { aSwarmConfig, anAgentConfig, configBuilders } from './tests/utils';

// Swarm configuration
const swarmConfig = aSwarmConfig()
  .asMesh()
  .withMaxAgents(10)
  .withConsensus('gossip')
  .withMemory('redis', 'swarm-memory')
  .withAutoScale()
  .build();

// Agent configuration
const agentConfig = anAgentConfig()
  .withModel('claude-sonnet-4-5-20250929')
  .withTemperature(0.7)
  .asHighCreativity()
  .withStreaming()
  .build();
```

## Mock Utilities

### Mock Database

```typescript
import { createMockDatabase } from './tests/utils';

const db = createMockDatabase();

// Create table
db.createTable('users');

// Insert records
const user = db.insert('users', { name: 'Test User', email: 'test@example.com' });

// Find records
const found = db.findById('users', user.id);
const all = db.findAll('users');
const filtered = db.find('users', { name: 'Test User' });

// Update records
db.update('users', user.id, { email: 'new@example.com' });

// Delete records
db.delete('users', user.id);

// Query history
const queries = db.getQueryHistory();

// Statistics
const stats = db.getStats();

// Cleanup
db.clearAll();
```

### Mock MCP Server

```typescript
import { createMockMCPServer, createMockMCPServerWithTools } from './tests/utils';

// Basic server
const server = createMockMCPServer();

await server.connect();
await server.initialize({});

// Register custom tool
server.registerTool(
  {
    name: 'custom_tool',
    description: 'A custom test tool',
    inputSchema: { type: 'object' },
  },
  async (params) => {
    return { success: true, data: params };
  }
);

// Call tool
const result = await server.callTool('custom_tool', { arg: 'value' });

// Pre-configured server with common tools
const serverWithTools = createMockMCPServerWithTools();
```

### Mock API Client

```typescript
import { createMockAPIClient } from './tests/utils';

const client = createMockAPIClient();

// Mock specific response
client.mockResponse('GET', '/api/users', {
  status: 200,
  data: { users: [] },
});

// Make requests
const response = await client.get('/api/users');

// Check request history
const requests = client.getRequests();
const lastRequest = client.getLastRequest();
const getRequests = client.getRequestsByMethod('GET');

// Statistics
const stats = client.getStats();
```

### Mock Filesystem

```typescript
import { createMockFilesystem } from './tests/utils';

const fs = createMockFilesystem();

// Write files
await fs.writeFile('/test/file.txt', 'content');

// Read files
const content = await fs.readFile('/test/file.txt', 'utf8');

// Check existence
const exists = await fs.exists('/test/file.txt');

// Create directories
await fs.mkdir('/test/nested/dir', { recursive: true });

// List directory
const files = await fs.readdir('/test');

// Get stats
const stat = await fs.stat('/test/file.txt');
```

### Mock Redis

```typescript
import { createMockRedis } from './tests/utils';

const redis = createMockRedis();

// String operations
await redis.set('key', 'value', { EX: 3600 });
const value = await redis.get('key');

// List operations
await redis.rpush('list', 'item1', 'item2');
const items = await redis.lrange('list', 0, -1);

// Set operations
await redis.sadd('set', 'member1', 'member2');
const members = await redis.smembers('set');

// Hash operations
await redis.hset('hash', 'field', 'value');
const hashValue = await redis.hget('hash', 'field');

// Expiration
await redis.expire('key', 60);
const ttl = await redis.ttl('key');
```

### Mock Vector Store

```typescript
import { createMockVectorStore } from './tests/utils';

const store = createMockVectorStore();

// Insert vectors
await store.insert(
  'vec-1',
  [0.1, 0.2, 0.3, ...],
  { type: 'code', language: 'typescript' },
  'code-namespace'
);

// Batch insert
await store.insertBatch([
  { id: 'vec-1', embedding: [...], metadata: {} },
  { id: 'vec-2', embedding: [...], metadata: {} },
]);

// Search
const results = await store.search(
  queryVector,
  {
    limit: 10,
    namespace: 'code-namespace',
    filter: { language: 'typescript' },
    minScore: 0.8,
  }
);

// Get by ID
const vector = await store.get('vec-1');

// Delete
await store.delete('vec-1');
```

## Test Helpers

### Assertions

```typescript
import { assert } from './tests/utils';

// Type assertions
assert.defined(value);
assert.type(value, 'string');
assert.instanceOf(value, MyClass);

// Collection assertions
assert.contains(array, item);
assert.length(array, 5);
assert.empty(array);
assert.notEmpty(array);

// Comparison assertions
assert.deepEqual(actual, expected);
assert.inRange(value, 0, 100);

// String assertions
assert.matches(string, /pattern/);

// Property assertions
assert.hasProperty(obj, 'propertyName');

// Predicate assertions
assert.all(array, (item) => item > 0);
assert.some(array, (item) => item > 100);

// Error assertions
await assert.throws(async () => {
  throw new Error('test');
});

await assert.throws(async () => {
  throw new Error('test');
}, /test/);

// Timeout assertions
await assert.resolvesWithin(promise, 1000);
```

### Async Utilities

```typescript
import { asyncUtils } from './tests/utils';

// Wait utilities
await asyncUtils.wait(1000);

await asyncUtils.waitFor(() => condition === true, { timeout: 5000, interval: 100 });

// Retry logic
const result = await asyncUtils.retry(async () => unstableFunction(), {
  maxRetries: 3,
  delay: 1000,
  backoff: 'exponential',
});

// Timeout
const result = await asyncUtils.withTimeout(
  async () => slowFunction(),
  5000,
  'Operation timed out'
);

// Polling
const value = await asyncUtils.poll(async () => checkValue(), { timeout: 5000, interval: 100 });

// Parallel execution with limit
const results = await asyncUtils.parallelLimit(
  tasks,
  5 // concurrency limit
);

// Deferred promise
const deferred = asyncUtils.defer();
setTimeout(() => deferred.resolve('value'), 1000);
await deferred.promise;

// Measure time
const { result, duration } = await asyncUtils.measureTime(async () => expensiveOperation());
```

### Setup and Teardown

```typescript
import { setupUtils } from './tests/utils';

// Test lifecycle
const lifecycle = new setupUtils.TestLifecycle();

lifecycle
  .beforeEach(async () => {
    // Setup code
  })
  .afterEach(async () => {
    // Cleanup code
  });

await lifecycle.runSetup();
// ... run tests ...
await lifecycle.runTeardown();

// Test environment
const env = setupUtils.createTestEnvironment();

env.setEnv('NODE_ENV', 'test');
env.mockGlobal('fetch', mockFetch);
env.store('testData', { key: 'value' });

const data = env.get('testData');

await env.cleanup();

// Database setup
const dbSetup = setupUtils.setupDatabase({
  setup: async () => createDatabase(),
  teardown: async () => dropDatabase(),
  seed: async () => seedData(),
  clear: async () => clearData(),
});

await dbSetup.beforeAll();
await dbSetup.beforeEach();
// ... run tests ...
await dbSetup.afterEach();
await dbSetup.afterAll();
```

### Time Utilities

```typescript
import { timeUtils } from './tests/utils';

// Mock clock
const clock = new timeUtils.MockClock();

const timerId = clock.setTimeout(() => {
  console.log('Timer fired');
}, 1000);

clock.tick(1000); // Advance time
clock.runAll(); // Run all pending timers

// Freeze time
const unfreeze = timeUtils.freezeTime(new Date('2024-01-01'));
// ... tests with frozen time ...
unfreeze();

// Travel to specific time
const restore = timeUtils.travelTo(new Date('2024-12-31'));
// ... tests ...
restore();

// Format duration
const formatted = timeUtils.formatDuration(12345); // "12.35s"
```

### Test Context

```typescript
import { contextUtils } from './tests/utils';

// Context manager
const manager = new contextUtils.TestContextManager();

const context = manager.createContext('test-1');
context.data.set('key', 'value');
context.cleanup.push(async () => {
  // Cleanup logic
});

await manager.cleanupContext('test-1');

// Scoped context
await contextUtils.withContext('test-suite', async (context) => {
  context.data.set('data', value);
  // Test code
});

// Test suite
const suite = contextUtils.createTestSuite('MyTestSuite');

await suite.beforeAll(async (context) => {
  context.data.set('sharedData', {});
});

await suite.test('test 1', async (context) => {
  const data = suite.getSuiteData('sharedData');
  // Test code
});

await suite.afterAll();
```

## Fixtures

Pre-configured test scenarios for common use cases.

### Common Fixtures

```typescript
import { sampleUsers, sampleAgents, sampleTasks, sampleJobs } from './tests/utils';

const admin = sampleUsers.admin();
const researcher = sampleAgents.researcher();
const codingTask = sampleTasks.codingTask();
const swarmJob = sampleJobs.swarmJob();
```

### Swarm Fixtures

```typescript
import {
  createSmallSwarm,
  createMediumSwarm,
  createLargeSwarm,
  createHierarchicalSwarm,
  createMeshSwarm,
} from './tests/utils';

// Small swarm (2-3 agents)
const { agents, tasks, job, config } = createSmallSwarm();

// Medium swarm (4-6 agents)
const mediumSwarm = createMediumSwarm();

// Large swarm (10+ agents)
const largeSwarm = createLargeSwarm();

// Specific topologies
const hierarchical = createHierarchicalSwarm();
const mesh = createMeshSwarm();
```

### Memory Fixtures

```typescript
import {
  sampleMemories,
  sampleVectors,
  createMemoryCollection,
  createVectorCollection,
} from './tests/utils';

const shortTerm = sampleMemories.shortTerm();
const longTerm = sampleMemories.longTerm();

const codeVector = sampleVectors.codeSnippet();
const docVector = sampleVectors.documentation();

const memories = createMemoryCollection(100);
const vectors = createVectorCollection(100);
```

### Workflow Fixtures

```typescript
import {
  createLinearWorkflow,
  createParallelWorkflow,
  createConditionalWorkflow,
  createIterativeWorkflow,
  createMultiStagePipeline,
} from './tests/utils';

// Linear workflow (sequential tasks)
const { tasks, agents } = createLinearWorkflow();

// Parallel workflow (concurrent execution)
const parallel = createParallelWorkflow();

// Conditional workflow (branching)
const conditional = createConditionalWorkflow();

// Iterative workflow (loops)
const iterative = createIterativeWorkflow();

// Multi-stage pipeline
const pipeline = createMultiStagePipeline();
```

## Usage Examples

### Complete Test Example

```typescript
import {
  aUser,
  anAgent,
  aTask,
  createMockDatabase,
  createMockMCPServer,
  assert,
  asyncUtils,
  setupUtils,
} from './tests/utils';

describe('Agent Task Execution', () => {
  let db: ReturnType<typeof createMockDatabase>;
  let mcpServer: ReturnType<typeof createMockMCPServer>;
  let env: ReturnType<typeof setupUtils.createTestEnvironment>;

  beforeEach(async () => {
    // Setup
    db = createMockDatabase();
    mcpServer = createMockMCPServer();
    env = setupUtils.createTestEnvironment();

    await mcpServer.connect();
    await mcpServer.initialize({});

    env.setEnv('TEST_MODE', 'true');
  });

  afterEach(async () => {
    // Cleanup
    db.clearAll();
    mcpServer.reset();
    await env.cleanup();
  });

  test('should execute task successfully', async () => {
    // Arrange
    const user = aUser().asAdmin().build();
    const agent = anAgent().asCoder().asRunning().build();
    const task = aTask().asCodingTask().assignedTo(agent.id).build();

    db.insert('users', user);
    db.insert('agents', agent);
    db.insert('tasks', task);

    // Act
    const result = await asyncUtils.withTimeout(async () => {
      return await executeTask(agent, task);
    }, 5000);

    // Assert
    assert.defined(result);
    assert.hasProperty(result, 'success');
    assert.deepEqual(result.success, true);

    const queries = db.getQueryHistory();
    assert.notEmpty(queries);
  });

  test('should handle task failure', async () => {
    // Arrange
    const agent = anAgent().asFailed().build();
    const task = aTask().asCritical().assignedTo(agent.id).build();

    // Assert error
    await assert.throws(async () => executeTask(agent, task), /execution failed/i);
  });

  test('should retry on transient failures', async () => {
    // Arrange
    let attempts = 0;
    const unstableFn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Transient error');
      }
      return { success: true };
    };

    // Act
    const result = await asyncUtils.retry(unstableFn, {
      maxRetries: 3,
      delay: 100,
    });

    // Assert
    assert.deepEqual(result.success, true);
    assert.inRange(attempts, 3, 3);
  });
});
```

### Integration Test Example

```typescript
import {
  createMediumSwarm,
  createMockVectorStore,
  createMockRedis,
  assert,
  asyncUtils,
} from './tests/utils';

describe('Swarm Coordination Integration', () => {
  test('should coordinate multi-agent workflow', async () => {
    // Arrange
    const { agents, tasks, job, config } = createMediumSwarm();
    const vectorStore = createMockVectorStore();
    const redis = createMockRedis();

    // Store agent embeddings
    for (const agent of agents) {
      const embedding = generateEmbedding(agent.name);
      await vectorStore.insert(agent.id, embedding, { type: 'agent', role: agent.role });
    }

    // Store job state in Redis
    await redis.hset('jobs', job.id, JSON.stringify(job));

    // Act
    const results = await Promise.all(agents.map((agent) => executeAgent(agent, tasks)));

    // Assert
    assert.length(results, agents.length);
    assert.all(results, (result) => result.success === true);

    // Verify vector store
    const agentVectors = await vectorStore.search(queryEmbedding, {
      namespace: 'default',
      limit: 10,
    });
    assert.notEmpty(agentVectors);

    // Verify Redis state
    const storedJob = await redis.hget('jobs', job.id);
    assert.defined(storedJob);
  });
});
```

## Best Practices

### 1. Use Builders for Test Data

```typescript
// Good
const user = aUser().asAdmin().withEmail('admin@test.com').build();

// Avoid
const user = {
  id: 'user-1',
  email: 'admin@test.com',
  role: 'admin',
  // ... many more fields
};
```

### 2. Leverage Fixtures for Complex Scenarios

```typescript
// Good
const { agents, tasks, job } = createMediumSwarm();

// Avoid
const agent1 = {
  /* ... */
};
const agent2 = {
  /* ... */
};
// ... manual setup
```

### 3. Use Mocks for External Dependencies

```typescript
// Good
const db = createMockDatabase();
const api = createMockAPIClient();

// Avoid
// Connecting to real database or API in tests
```

### 4. Clean Up Resources

```typescript
// Good
afterEach(async () => {
  db.clearAll();
  await env.cleanup();
});

// Avoid
// Leaving resources dirty between tests
```

### 5. Use Async Utilities for Time-Dependent Tests

```typescript
// Good
await asyncUtils.waitFor(() => taskCompleted === true, { timeout: 5000 });

// Avoid
await new Promise((resolve) => setTimeout(resolve, 5000));
```

### 6. Make Assertions Explicit

```typescript
// Good
assert.defined(result);
assert.hasProperty(result, 'data');
assert.length(result.items, 5);

// Avoid
expect(result).toBeTruthy();
```

### 7. Test Edge Cases with Fixtures

```typescript
// Good
const failedAgent = agentBuilders.failed();
const expiredMemory = memoryBuilders.expiring();

// Tests edge cases explicitly
```

## API Reference

See individual module documentation for complete API details:

- [Builders API](./builders/README.md)
- [Mocks API](./mocks/README.md)
- [Helpers API](./helpers/README.md)
- [Fixtures API](./fixtures/README.md)

## Contributing

When adding new test utilities:

1. Follow the builder pattern for data creation
2. Provide sensible defaults
3. Make APIs fluent and chainable
4. Include TypeScript types
5. Add usage examples
6. Update this documentation

## License

Same as parent project
