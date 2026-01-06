# Test Utilities Framework

Comprehensive testing utilities for the Hive Mind collective intelligence system.

## Quick Start

```typescript
import {
  // Builders
  aUser,
  anAgent,
  aTask,
  aJob,
  aMemory,
  aVector,

  // Mocks
  createMockDatabase,
  createMockMCPServer,
  createMockVectorStore,

  // Helpers
  assert,
  asyncUtils,
  setupUtils,

  // Fixtures
  sampleUsers,
  createSmallSwarm,
  createLinearWorkflow,
} from './tests/utils';

// Create test data
const user = aUser().asAdmin().build();
const agent = anAgent().asResearcher().build();
const task = aTask().asCodingTask().build();

// Use mocks
const db = createMockDatabase();
db.insert('users', user);

// Make assertions
assert.defined(user.id);
assert.deepEqual(user.role, 'admin');
```

## Structure

```
tests/utils/
├── builders/          # Fluent data builders
│   ├── user-builder.ts
│   ├── agent-builder.ts
│   ├── task-builder.ts
│   ├── job-builder.ts
│   ├── memory-builder.ts
│   ├── vector-builder.ts
│   └── config-builder.ts
├── mocks/            # Mock implementations
│   ├── mock-database.ts
│   ├── mock-mcp-server.ts
│   ├── mock-api-client.ts
│   ├── mock-filesystem.ts
│   ├── mock-redis.ts
│   └── mock-vector-store.ts
├── helpers/          # Test helper utilities
│   ├── assertions.ts
│   ├── async-helpers.ts
│   ├── setup-teardown.ts
│   ├── snapshot-helpers.ts
│   ├── time-helpers.ts
│   └── test-context.ts
├── fixtures/         # Pre-configured scenarios
│   ├── common-fixtures.ts
│   ├── swarm-fixtures.ts
│   ├── memory-fixtures.ts
│   └── workflow-fixtures.ts
└── index.ts         # Main export
```

## Key Features

### 1. Fluent Data Builders

Create test data with expressive, chainable API:

```typescript
const agent = anAgent()
  .asResearcher()
  .withName('Research Agent')
  .withCapability('analysis')
  .inSwarm('swarm-123')
  .build();
```

### 2. Comprehensive Mocks

In-memory implementations for testing:

```typescript
const db = createMockDatabase();
const mcp = createMockMCPServer();
const api = createMockAPIClient();
const redis = createMockRedis();
const vectors = createMockVectorStore();
```

### 3. Rich Assertions

Custom assertions for common scenarios:

```typescript
assert.defined(value);
assert.contains(array, item);
assert.inRange(value, 0, 100);
await assert.throws(fn, /error/);
await assert.resolvesWithin(promise, 1000);
```

### 4. Async Utilities

Tools for testing asynchronous code:

```typescript
await asyncUtils.wait(1000);
await asyncUtils.waitFor(() => ready, { timeout: 5000 });
await asyncUtils.retry(fn, { maxRetries: 3 });
const { result, duration } = await asyncUtils.measureTime(fn);
```

### 5. Pre-configured Fixtures

Ready-to-use test scenarios:

```typescript
const { agents, tasks, job } = createMediumSwarm();
const { tasks, agents } = createLinearWorkflow();
const memories = createMemoryCollection(100);
```

## Usage Examples

### Basic Test

```typescript
import { aUser, createMockDatabase, assert } from './tests/utils';

describe('User Service', () => {
  let db;

  beforeEach(() => {
    db = createMockDatabase();
  });

  test('should create user', () => {
    const user = aUser().withEmail('test@example.com').build();
    db.insert('users', user);

    const found = db.findById('users', user.id);
    assert.deepEqual(found, user);
  });
});
```

### Integration Test

```typescript
import { createMediumSwarm, createMockVectorStore, asyncUtils, assert } from './tests/utils';

test('swarm coordination', async () => {
  const { agents, tasks } = createMediumSwarm();
  const vectors = createMockVectorStore();

  // Execute agents in parallel
  const results = await asyncUtils.parallelLimit(
    agents.map((agent) => () => executeAgent(agent)),
    3 // concurrency limit
  );

  assert.length(results, agents.length);
  assert.all(results, (r) => r.success === true);
});
```

### Async Test

```typescript
import { asyncUtils, assert } from './tests/utils';

test('retry logic', async () => {
  let attempts = 0;
  const unstable = async () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await asyncUtils.retry(unstable, {
    maxRetries: 3,
    delay: 100,
    backoff: 'exponential',
  });

  assert.deepEqual(result, 'success');
  assert.deepEqual(attempts, 3);
});
```

## Documentation

See [testing-utilities.md](../../docs/testing-utilities.md) for complete documentation including:

- Detailed API reference for all utilities
- Advanced usage patterns
- Best practices and guidelines
- Complete code examples

## Statistics

- **30+ Utilities**: Comprehensive testing toolkit
- **7 Data Builders**: User, Agent, Task, Job, Memory, Vector, Config
- **6 Mock Implementations**: Database, MCP, API, Filesystem, Redis, VectorStore
- **6 Helper Modules**: Assertions, Async, Setup, Snapshots, Time, Context
- **4 Fixture Collections**: Common, Swarm, Memory, Workflow
- **Full TypeScript Support**: Type-safe with inference

## Contributing

When adding new utilities:

1. Follow existing patterns and conventions
2. Provide sensible defaults
3. Make APIs fluent and chainable
4. Include comprehensive TypeScript types
5. Add usage examples
6. Update documentation

## Support

For questions or issues, refer to:

- [Complete Documentation](../../docs/testing-utilities.md)
- [Examples](./examples/)
- [Project Issues](https://github.com/tafyai/gendev/issues)
