# Debugging Guide

Comprehensive guide for debugging Agentic Flow applications, troubleshooting common issues, and resolving problems efficiently.

## Table of Contents

1. [Common Errors and Solutions](#common-errors-and-solutions)
2. [Debug Configuration](#debug-configuration)
3. [Logging Best Practices](#logging-best-practices)
4. [Profiling Tools](#profiling-tools)
5. [Database Debugging](#database-debugging)
6. [Network Debugging](#network-debugging)
7. [Memory Debugging](#memory-debugging)
8. [Performance Debugging](#performance-debugging)

## Common Errors and Solutions

### Configuration Errors

#### Error: Missing API Key

```
ConfigurationError: Missing required environment variable: ANTHROPIC_API_KEY
```

**Solution:**

```bash
# Set API key in .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Or export in shell
export ANTHROPIC_API_KEY=sk-ant-...

# Verify
cat .env | grep ANTHROPIC_API_KEY
```

#### Error: Invalid Configuration Value

```
ConfigValidationError: Invalid value for 'embedding.dimensions': must be between 128 and 4096
```

**Solution:**

```bash
# Check current value
node -e "console.log(process.env.EMBEDDING_DIMENSIONS)"

# Set valid value
export EMBEDDING_DIMENSIONS=384

# Verify configuration
npx agentopia config validate
```

#### Error: Configuration Not Initialized

```
ConfigurationError: Configuration not initialized
```

**Solution:**

```typescript
import { config } from './config/index.js';

// Reload configuration
config.reload();

// Check configuration
console.log(config.getAll());
```

### Database Errors

#### Error: Database Connection Timeout

```
DatabaseError [DB_2100]: Connection timeout to database after 5000ms
```

**Solution:**

```bash
# Increase timeout
export DB_TIMEOUT=10000

# Check database file exists
ls -la ./data/reasoningbank.db

# Test database connection
sqlite3 ./data/reasoningbank.db ".tables"
```

#### Error: Database Locked

```
DatabaseError [DB_2600]: Database is locked
```

**Solution:**

```bash
# Check for other processes
lsof ./data/reasoningbank.db

# Kill stale processes if needed
kill -9 <PID>

# Increase connection pool
export DB_MAX_CONNECTIONS=10
```

#### Error: Table Not Found

```
DatabaseError [DB_2400]: Table 'memories' does not exist
```

**Solution:**

```bash
# Initialize database
npx agentdb init

# Or manually create schema
sqlite3 ./data/reasoningbank.db < schema.sql

# Verify tables
sqlite3 ./data/reasoningbank.db ".schema"
```

### Network Errors

#### Error: Connection Refused

```
NetworkError [NET_4100]: Connection refused to api.anthropic.com:443
```

**Solution:**

```bash
# Check internet connection
ping api.anthropic.com

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Test API connectivity
curl https://api.anthropic.com/v1/complete -H "x-api-key: $ANTHROPIC_API_KEY"
```

#### Error: Request Timeout

```
NetworkError [NET_4200]: Request timeout after 30000ms
```

**Solution:**

```bash
# Increase timeout
export REQUEST_TIMEOUT=60000

# Check network latency
ping -c 5 api.anthropic.com

# Use faster model
npx agentopia --agent coder --task "task" --model "gemini-2.5-flash"
```

#### Error: Rate Limit Exceeded

```
NetworkError [NET_4290]: API rate limit exceeded, retry after 60s
```

**Solution:**

```bash
# Wait and retry
sleep 60
npx agentopia --agent coder --task "retry task"

# Use different model
npx agentopia --agent coder --task "task" --model "meta-llama/llama-3.1-8b"

# Check rate limit status
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
  https://api.anthropic.com/v1/messages \
  -I | grep -i rate
```

### Validation Errors

#### Error: Missing Required Field

```
ValidationError [VAL_3100]: Missing required fields: name, email
```

**Solution:**

```typescript
// Ensure all required fields are provided
const user = {
  name: 'John Doe', // Required
  email: 'john@test.com', // Required
  age: 30, // Optional
};

await createUser(user);
```

#### Error: Type Validation Failed

```
ValidationError [VAL_3110]: Expected type 'number' for field 'age', got 'string'
```

**Solution:**

```typescript
// Convert to correct type
const age = parseInt(ageString, 10);

// Or use type validation
import { z } from 'zod';

const schema = z.object({
  age: z.number().int().min(0).max(120),
});

const validated = schema.parse({ age: 25 });
```

### Agent Errors

#### Error: Agent Not Found

```
AgentError [AGT_7100]: Agent 'unknown-agent' not found
```

**Solution:**

```bash
# List available agents
npx agentopia --list

# Use correct agent name
npx agentopia --agent coder --task "task"
```

#### Error: Task Execution Failed

```
AgentError [AGT_7200]: Task execution failed: Timeout waiting for response
```

**Solution:**

```bash
# Increase timeout
export AGENT_TIMEOUT=120000

# Simplify task
npx agentopia --agent coder --task "simpler task"

# Check agent logs
tail -f .logs/agent-*.log
```

### Memory Errors

#### Error: Out of Memory

```
Error: JavaScript heap out of memory
```

**Solution:**

```bash
# Increase Node.js memory
node --max-old-space-size=4096 dist/index.js

# Or set environment variable
export NODE_OPTIONS="--max-old-space-size=4096"

# Check memory usage
node -e "console.log(process.memoryUsage())"
```

#### Error: Memory Exceeded

```
AgentError [AGT_7600]: Memory exceeded for agent 'agent-123': 1073741824 bytes (limit: 536870912)
```

**Solution:**

```bash
# Increase memory limit
export AGENT_MEMORY_LIMIT=2147483648

# Clear agent cache
npx agentopia cache clear

# Monitor memory usage
npx agentopia agent stats agent-123
```

## Debug Configuration

### Enable Debug Mode

```bash
# Set debug environment variable
export FEATURE_DEBUG=true

# Enable verbose logging
export FEATURE_LOGGING=true
export LOG_LEVEL=debug

# Run with debug output
npx agentopia --agent coder --task "debug task" --verbose
```

### VS Code Debug Configuration

Create `.vscode/launch.json`:

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
        "LOG_LEVEL": "debug",
        "ANTHROPIC_API_KEY": "${env:ANTHROPIC_API_KEY}"
      },
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-coverage", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Process",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
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

### Debug with Inspector

```bash
# Start with inspector
node --inspect dist/index.js --agent coder --task "debug task"

# Or pause on start
node --inspect-brk dist/index.js --agent coder --task "debug task"

# Connect with Chrome DevTools
# Open chrome://inspect in Chrome
```

## Logging Best Practices

### Configure Logging

```bash
# Set log level
export LOG_LEVEL=debug  # debug, info, warn, error

# Enable logging
export FEATURE_LOGGING=true

# Set log file
export LOG_FILE=./logs/agent-control-plane.log
```

### Structured Logging

```typescript
import { logger } from './utils/logger.js';

// Log with context
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: Date.now(),
});

// Log errors
logger.error('Operation failed', {
  error: formatErrorForLogging(error),
  context: { userId, operation: 'createUser' },
});

// Log performance
const startTime = Date.now();
await operation();
logger.debug('Operation completed', {
  duration: Date.now() - startTime,
  operation: 'processData',
});
```

### Debug Specific Components

```typescript
import { config } from './config/index.js';

// Debug configuration
if (config.get('features').enableDebug) {
  console.log('Config:', JSON.stringify(config.getAll(), null, 2));
}

// Debug database queries
const db = new Database('./data/reasoningbank.db');
db.on('trace', (sql) => {
  console.log('SQL:', sql);
});

// Debug API requests
axios.interceptors.request.use((request) => {
  console.log('Request:', request.method, request.url);
  return request;
});

axios.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('Error:', error.message);
    return Promise.reject(error);
  }
);
```

## Profiling Tools

### CPU Profiling

```bash
# Generate CPU profile
node --prof dist/index.js --agent coder --task "task"

# Process profile
node --prof-process isolate-*.log > profile.txt

# View profile
less profile.txt
```

### Memory Profiling

```bash
# Generate heap snapshot
node --expose-gc --inspect dist/index.js

# In Chrome DevTools:
# 1. Connect to inspector
# 2. Go to Memory tab
# 3. Take heap snapshot
# 4. Compare snapshots
```

### Performance Profiling

```typescript
import { asyncUtils } from '../tests/utils';

// Measure execution time
const { result, duration } = await asyncUtils.measureTime(async () => expensiveOperation());

console.log(`Operation took ${duration}ms`);

// Profile multiple operations
const results = await asyncUtils.profile([
  { name: 'operation1', fn: async () => op1() },
  { name: 'operation2', fn: async () => op2() },
  { name: 'operation3', fn: async () => op3() },
]);

results.forEach((r) => {
  console.log(`${r.name}: ${r.duration}ms`);
});
```

## Database Debugging

### Inspect Database

```bash
# Open database
sqlite3 ./data/reasoningbank.db

# List tables
.tables

# View schema
.schema memories

# Query data
SELECT COUNT(*) FROM memories;
SELECT * FROM memories LIMIT 10;
SELECT namespace, COUNT(*) FROM memories GROUP BY namespace;

# Check indexes
.indexes memories

# Analyze query plan
EXPLAIN QUERY PLAN SELECT * FROM memories WHERE namespace = 'api';
```

### Database Statistics

```bash
# Database size
du -h ./data/reasoningbank.db

# Table sizes
sqlite3 ./data/reasoningbank.db "
  SELECT
    name,
    SUM(pgsize) as size
  FROM dbstat
  GROUP BY name
  ORDER BY size DESC;
"

# Vacuum database
sqlite3 ./data/reasoningbank.db "VACUUM;"
```

### Query Performance

```typescript
import Database from 'better-sqlite3';

const db = new Database('./data/reasoningbank.db');

// Enable query logging
db.on('trace', (sql) => {
  console.log('SQL:', sql);
});

// Measure query time
const startTime = Date.now();
const results = db.prepare('SELECT * FROM memories WHERE namespace = ?').all('api');
const duration = Date.now() - startTime;
console.log(`Query took ${duration}ms, returned ${results.length} rows`);

// Analyze query plan
const plan = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM memories WHERE namespace = ?').all('api');
console.log('Query plan:', plan);
```

## Network Debugging

### Inspect HTTP Requests

```bash
# Use curl for API testing
curl -v https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Check DNS resolution
nslookup api.anthropic.com

# Trace network path
traceroute api.anthropic.com

# Monitor network traffic
tcpdump -i any host api.anthropic.com
```

### Debug API Calls

```typescript
import axios from 'axios';

// Add request interceptor
axios.interceptors.request.use(
  (request) => {
    console.log('Request:', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      data: request.data,
    });
    return request;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axios.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);
```

## Memory Debugging

### Monitor Memory Usage

```typescript
// Check current memory usage
const usage = process.memoryUsage();
console.log('Memory usage:', {
  rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
  heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
  heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
  external: `${Math.round(usage.external / 1024 / 1024)}MB`,
});

// Monitor over time
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`Heap used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
}, 5000);
```

### Detect Memory Leaks

```typescript
// Track object creation
let objectCount = 0;

class TrackedObject {
  constructor() {
    objectCount++;
    console.log(`Created object #${objectCount}`);
  }

  destroy() {
    objectCount--;
    console.log(`Destroyed object, remaining: ${objectCount}`);
  }
}

// Force garbage collection (run with --expose-gc)
if (global.gc) {
  global.gc();
  console.log('Garbage collection triggered');
}
```

### Find Memory Leaks

```bash
# Run with heap snapshot
node --expose-gc --inspect dist/index.js

# Take snapshots at different points
# Compare snapshots in Chrome DevTools
# Look for objects that should have been garbage collected
```

## Performance Debugging

### Benchmark Operations

```typescript
import { Benchmark } from './utils/benchmark.js';

const bench = new Benchmark('Database Query');

await bench.run(
  async () => {
    const results = db.prepare('SELECT * FROM memories WHERE namespace = ?').all('api');
  },
  {
    iterations: 100,
    warmup: 10,
  }
);

bench.report();
// Output:
// Database Query
// Iterations: 100
// Average: 5.23ms
// Min: 3.12ms
// Max: 12.45ms
// p50: 4.89ms
// p95: 8.76ms
// p99: 11.23ms
```

### Identify Bottlenecks

```typescript
import { asyncUtils } from '../tests/utils';

// Profile workflow
const results = await asyncUtils.profile([
  { name: 'Load config', fn: async () => config.reload() },
  { name: 'Initialize DB', fn: async () => initDatabase() },
  { name: 'Generate embedding', fn: async () => generateEmbedding('test') },
  { name: 'Store memory', fn: async () => storeMemory('key', 'value') },
  { name: 'Query memory', fn: async () => queryMemories('test') },
]);

// Find slowest operation
const slowest = results.reduce((a, b) => (a.duration > b.duration ? a : b));
console.log(`Slowest operation: ${slowest.name} (${slowest.duration}ms)`);
```

### Optimize Performance

```typescript
// Use caching
const cache = new Map();

async function getCachedUser(userId: string): Promise<User> {
  if (cache.has(userId)) {
    return cache.get(userId)!;
  }

  const user = await fetchUser(userId);
  cache.set(userId, user);
  return user;
}

// Batch operations
async function batchInsert(items: Item[]): Promise<void> {
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await db.prepare('INSERT INTO items VALUES (?, ?)').run(...batch);
  }
}

// Use connection pooling
class ConnectionPool {
  private pool: Connection[] = [];

  async acquire(): Promise<Connection> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return await createConnection();
  }

  release(conn: Connection): void {
    this.pool.push(conn);
  }
}
```

## Additional Resources

- [Error Handling Guide](./error-handling.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Testing Guide](./testing-utilities.md)
- [Common Workflows](./COMMON_WORKFLOWS.md)

## Getting Help

If you're still stuck:

1. Check [GitHub Issues](https://github.com/tafyai/agent-control-plane/issues)
2. Search [GitHub Discussions](https://github.com/tafyai/agent-control-plane/discussions)
3. Review [documentation](.)
4. Ask for help in Discussions
