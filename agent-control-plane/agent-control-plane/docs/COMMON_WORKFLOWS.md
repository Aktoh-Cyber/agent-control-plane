# Common Workflows

This guide provides step-by-step instructions for common development workflows in Agentic Flow.

## Table of Contents

1. [Running Agents](#running-agents)
2. [Adding New Features](#adding-new-features)
3. [Writing Tests](#writing-tests)
4. [Debugging](#debugging)
5. [Performance Profiling](#performance-profiling)
6. [Working with ReasoningBank](#working-with-reasoningbank)
7. [Contributing Code](#contributing-code)

## Running Agents

### Basic Agent Execution

```bash
# Run a simple agent
npx agentopia --agent coder --task "Create a hello world function"

# With streaming output
npx agentopia --agent coder --task "Build REST API" --stream

# With specific model
npx agentopia \
  --agent researcher \
  --model "claude-sonnet-4-5-20250929" \
  --task "Research AI trends 2025"
```

### Cost-Optimized Execution

```bash
# Auto-optimize for cost
npx agentopia \
  --agent coder \
  --task "Simple refactoring" \
  --optimize \
  --priority cost

# Set budget limit
npx agentopia \
  --agent coder \
  --task "Code cleanup" \
  --optimize \
  --max-cost 0.001

# Use specific budget model
npx agentopia \
  --agent coder \
  --task "Quick fix" \
  --model "meta-llama/llama-3.1-8b-instruct"
```

### Multi-Agent Workflows

```bash
# Sequential workflow
npx agentopia --agent researcher --task "Research requirements"
npx agentopia --agent planner --task "Create implementation plan"
npx agentopia --agent coder --task "Implement features"
npx agentopia --agent tester --task "Write tests"
npx agentopia --agent reviewer --task "Review code"

# Parallel execution (requires swarm)
npx agentopia swarm create mesh
npx agentopia swarm add researcher coder tester
npx agentopia swarm execute --parallel
```

## Adding New Features

### Step 1: Plan the Feature

```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Use planner agent for guidance
npx agentopia --agent planner --task "Plan feature: [description]"
```

### Step 2: Implement the Feature

**Example: Adding a new configuration option**

1. **Update types** (`src/config/types.ts`):

```typescript
export interface MyFeatureConfig {
  enabled: boolean;
  timeout: number;
  retries: number;
}

export interface ConfigSchema {
  // ... existing config
  myFeature: MyFeatureConfig;
}
```

2. **Update validator** (`src/config/validator.ts`):

```typescript
function validateMyFeatureConfig(config: any): MyFeatureConfig {
  return {
    enabled: parseBoolean(config.enabled ?? true),
    timeout: parseNumber(config.timeout, 1000, 60000, 5000),
    retries: parseNumber(config.retries, 1, 10, 3),
  };
}

export function validateConfig(raw: any): ConfigSchema {
  return {
    // ... existing validation
    myFeature: validateMyFeatureConfig(raw.myFeature || {}),
  };
}
```

3. **Update config service** (`src/config/index.ts`):

```typescript
function loadFromEnvironment(): Partial<ConfigSchema> {
  return {
    // ... existing config
    myFeature: {
      enabled: process.env.MY_FEATURE_ENABLED !== 'false',
      timeout: parseInt(process.env.MY_FEATURE_TIMEOUT || '5000'),
      retries: parseInt(process.env.MY_FEATURE_RETRIES || '3'),
    },
  };
}
```

4. **Implement the feature**:

```typescript
// src/my-feature/index.ts
import { config } from '../config/index.js';

export class MyFeature {
  private config: MyFeatureConfig;

  constructor() {
    this.config = config.get('myFeature');
  }

  async execute(): Promise<Result> {
    if (!this.config.enabled) {
      throw new ConfigurationError('MyFeature is disabled');
    }

    // Implementation
  }
}
```

### Step 3: Write Tests

```typescript
// tests/my-feature/index.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { MyFeature } from '../../src/my-feature';
import { config } from '../../src/config';

describe('MyFeature', () => {
  beforeEach(() => {
    config.set('myFeature', {
      enabled: true,
      timeout: 5000,
      retries: 3,
    });
  });

  it('should execute successfully', async () => {
    const feature = new MyFeature();
    const result = await feature.execute();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should throw when disabled', async () => {
    config.set('myFeature', { ...config.get('myFeature'), enabled: false });

    const feature = new MyFeature();
    await expect(feature.execute()).rejects.toThrow('MyFeature is disabled');
  });
});
```

### Step 4: Update Documentation

```bash
# Update CONFIGURATION.md
# Add environment variables to .env.example
# Update CHANGELOG.md
```

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { aUser, anAgent, createMockDatabase, assert } from '../utils';

describe('UserService', () => {
  let db: ReturnType<typeof createMockDatabase>;
  let service: UserService;

  beforeEach(() => {
    db = createMockDatabase();
    service = new UserService(db);
  });

  afterEach(() => {
    db.clearAll();
  });

  it('should create user', async () => {
    const userData = aUser().asAdmin().build();

    const user = await service.createUser(userData);

    assert.defined(user);
    assert.hasProperty(user, 'id');
    expect(user.email).toBe(userData.email);
  });
});
```

### Integration Tests

```typescript
import { createMediumSwarm, createMockVectorStore, asyncUtils } from '../utils';

describe('Swarm Coordination', () => {
  it('should coordinate multi-agent workflow', async () => {
    const { agents, tasks, job } = createMediumSwarm();
    const vectorStore = createMockVectorStore();

    // Store agent embeddings
    for (const agent of agents) {
      const embedding = await generateEmbedding(agent.name);
      await vectorStore.insert(agent.id, embedding, { role: agent.role });
    }

    // Execute workflow
    const results = await Promise.all(agents.map((agent) => executeAgent(agent, tasks)));

    // Verify
    expect(results).toHaveLength(agents.length);
    expect(results.every((r) => r.success)).toBe(true);
  });
});
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run specific E2E test
pnpm test tests/e2e/agent-execution.test.ts
```

## Debugging

### Enable Debug Mode

```bash
# Set debug environment variable
export FEATURE_DEBUG=true

# Run with debug logging
npx agentopia --agent coder --task "debug task" --verbose
```

### VS Code Debugging

1. **Create launch configuration** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Agent",
      "program": "${workspaceFolder}/dist/index.js",
      "args": ["--agent", "coder", "--task", "${input:taskDescription}"],
      "env": {
        "FEATURE_DEBUG": "true",
        "ANTHROPIC_API_KEY": "${env:ANTHROPIC_API_KEY}"
      },
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ],
  "inputs": [
    {
      "id": "taskDescription",
      "type": "promptString",
      "description": "Task description"
    }
  ]
}
```

2. **Set breakpoints** in source files

3. **Start debugging** (F5)

### Debugging Configuration Issues

```typescript
import { config } from './config/index.js';

// Print current configuration
console.log('Current config:', JSON.stringify(config.getAll(), null, 2));

// Check specific setting
const embeddingConfig = config.get('embedding');
console.log('Embedding provider:', embeddingConfig.provider);
console.log('Dimensions:', embeddingConfig.dimensions);
```

### Debugging ReasoningBank

```bash
# Check database
sqlite3 ./data/reasoningbank.db ".schema"
sqlite3 ./data/reasoningbank.db "SELECT COUNT(*) FROM memories;"

# View memories
npx agentdb memory search "" --namespace "your-namespace"

# Check statistics
npx agentdb stats
```

### Debugging Errors

```typescript
import { isBaseError, formatErrorForLogging, getErrorChain } from './errors/index.js';

try {
  await operation();
} catch (error) {
  if (isBaseError(error)) {
    // Log detailed error
    console.error('Error details:', formatErrorForLogging(error));

    // Get error chain
    const chain = getErrorChain(error);
    console.error(
      'Error chain:',
      chain.map((e) => `[${e.code}] ${e.message}`)
    );
  }
}
```

## Performance Profiling

### Measure Execution Time

```typescript
import { asyncUtils } from '../tests/utils';

const { result, duration } = await asyncUtils.measureTime(async () => expensiveOperation());

console.log(`Operation took ${duration}ms`);
```

### Profile Memory Usage

```bash
# Run with memory profiling
node --expose-gc --max-old-space-size=4096 dist/index.js

# Use Node.js profiler
node --prof dist/index.js
node --prof-process isolate-*.log > profile.txt
```

### Benchmark Performance

```typescript
// benchmarks/my-benchmark.ts
import { Benchmark } from '../utils/benchmark';

const bench = new Benchmark('My Operation');

await bench.run(
  async () => {
    await myOperation();
  },
  {
    iterations: 100,
    warmup: 10,
  }
);

bench.report();
```

### Monitor Agent Performance

```bash
# Use agent metrics
npx agentopia --agent coder --task "build api" --metrics

# View performance stats
cat .metrics/agent-performance.json
```

## Working with ReasoningBank

### Store Memories

```bash
# CLI: Store memory
npx agentdb memory store "best-practice" "Always validate input" \
  --namespace "coding" \
  --metadata '{"type": "validation", "priority": "high"}'
```

```typescript
// Programmatic
import * as reasoningbank from 'agentopia/reasoningbank';

await reasoningbank.initialize();

await reasoningbank.storeMemory('best-practice', 'Always validate input', {
  namespace: 'coding',
  metadata: { type: 'validation', priority: 'high' },
});
```

### Query Memories

```bash
# CLI: Search memories
npx agentdb memory search "validation" \
  --namespace "coding" \
  --limit 10 \
  --min-score 0.8
```

```typescript
// Programmatic
const results = await reasoningbank.queryMemories('validation', {
  namespace: 'coding',
  limit: 10,
  minScore: 0.8,
});

for (const memory of results) {
  console.log(`[${memory.score}] ${memory.key}: ${memory.value}`);
}
```

### Consolidate Memories

```bash
# CLI: Consolidate similar memories
npx agentdb memory consolidate \
  --namespace "coding" \
  --threshold 0.9
```

```typescript
// Programmatic
const stats = await reasoningbank.consolidateMemories({
  namespace: 'coding',
  similarityThreshold: 0.9,
  minQuality: 0.7,
});

console.log('Consolidated:', stats.consolidated);
console.log('Removed duplicates:', stats.duplicatesRemoved);
```

### Train Patterns

```bash
# Store successful trajectory
npx agentdb reflexion store \
  "session-1" \
  "implement_auth" \
  0.95 \
  true \
  "Successfully implemented JWT authentication"

# Learn from patterns
npx agentdb learner run --sessions "session-*"
```

## Contributing Code

### Step 1: Sync with Upstream

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

### Step 2: Create Feature Branch

```bash
# Create branch
git checkout -b feature/my-feature

# Or for bug fix
git checkout -b fix/bug-description
```

### Step 3: Make Changes

```bash
# Edit files
# Add tests
# Update documentation
```

### Step 4: Test Locally

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Build project
pnpm build

# Test manually
npx agentopia --agent coder --task "test my feature"
```

### Step 5: Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add new feature

- Implement feature X
- Add tests for feature X
- Update documentation

Closes #123"
```

**Conventional Commit Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `chore:` Maintenance

### Step 6: Push and Create PR

```bash
# Push to your fork
git push origin feature/my-feature
```

Then:

1. Go to GitHub
2. Click "Compare & pull request"
3. Fill in PR template
4. Submit for review

### Step 7: Address Review Feedback

```bash
# Make requested changes
# Test again
pnpm test

# Commit changes
git add .
git commit -m "fix: address review feedback"

# Push update
git push origin feature/my-feature
```

### Step 8: Merge

Once approved:

1. Squash commits (if requested)
2. Merge PR
3. Delete branch

```bash
# Delete local branch
git checkout main
git branch -D feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

## Best Practices

### Code Style

- Use TypeScript strict mode
- Add types for all functions
- Document public APIs
- Use meaningful variable names
- Keep functions small (< 50 lines)

### Testing

- Write tests for new features
- Aim for 80%+ coverage
- Use test builders
- Mock external dependencies
- Test edge cases

### Documentation

- Update docs for API changes
- Add code examples
- Document configuration
- Explain design decisions
- Keep README current

### Git

- Use conventional commits
- Write descriptive messages
- Squash fixup commits
- Rebase before merge
- Keep commits atomic

### Performance

- Profile before optimizing
- Use caching appropriately
- Batch operations
- Monitor memory usage
- Measure improvements

## Troubleshooting Common Issues

### Build Fails

```bash
# Clean and rebuild
rm -rf dist
pnpm build

# Check TypeScript errors
pnpm tsc --noEmit
```

### Tests Fail

```bash
# Run specific test
pnpm test path/to/test.ts

# Run with coverage
pnpm test --coverage

# Debug test
node --inspect-brk node_modules/.bin/jest path/to/test.ts
```

### Configuration Issues

```bash
# Verify environment
cat .env | grep API_KEY

# Test configuration
node -e "console.log(require('./dist/config').config.getAll())"
```

### Memory Issues

```bash
# Increase Node.js memory
node --max-old-space-size=4096 dist/index.js

# Check database size
du -h ./data/reasoningbank.db
```

## Next Steps

- [Developer Onboarding](./DEVELOPER_ONBOARDING.md)
- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Debugging Guide](./DEBUGGING_GUIDE.md)
- [Interactive Tutorials](./tutorials/)
