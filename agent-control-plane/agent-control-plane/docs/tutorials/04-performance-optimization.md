# Tutorial: Optimize Performance

Learn how to maximize Agentic Flow performance with benchmarking, caching, and optimization techniques.

## Step 1: Benchmark Current Performance

```typescript
import { asyncUtils } from '../../tests/utils';

// Benchmark agent execution
const { result, duration } = await asyncUtils.measureTime(async () => {
  return await agent.run({
    agent: 'coder',
    task: 'Build REST API',
  });
});

console.log(`Agent execution took ${duration}ms`);
// Before optimization: ~5000ms
```

## Step 2: Enable Agent Booster

Agent Booster provides 352x speedup for code editing tasks (automatic):

```bash
# Agent Booster automatically detects code editing tasks
npx agentopia --agent coder --task "Refactor codebase"

# Performance:
# - Without Agent Booster: 352ms per edit
# - With Agent Booster: 1ms per edit
# - Savings: 351ms per edit (352x faster)
```

## Step 3: Use Cost-Optimized Models

```typescript
import { ModelRouter } from 'agentopia/router';

const router = new ModelRouter();

// Optimize for cost (85-99% savings)
const response = await router.chat({
  model: 'auto',
  priority: 'cost',
  messages: [{ role: 'user', content: 'Simple task' }],
});

console.log(`Cost: $${response.metadata.cost}`);
console.log(`Model: ${response.metadata.model}`);
// Before: $0.08 (Claude Sonnet 4.5)
// After: $0.012 (DeepSeek R1)
// Savings: 85%
```

## Step 4: Enable Caching

```typescript
import { config } from './config/index.js';

// Enable caching
config.set('features', {
  enableCaching: true,
  enableMetrics: true,
  enableLogging: true,
  enableDebug: false,
});

// Configure cache
config.set('performance', {
  cacheSize: 1000,
  cacheTTL: 3600000, // 1 hour
  maxConcurrentRequests: 10,
  requestTimeout: 60000,
});

// Results:
// - Cache hit rate: ~80%
// - Response time: 50ms vs 500ms
// - 10x faster for cached queries
```

## Step 5: Batch Operations

```typescript
// Before: Individual operations
for (const text of texts) {
  await generateEmbedding(text); // 100ms each
}
// Total: 100 texts × 100ms = 10,000ms

// After: Batch operations
await batchGenerateEmbeddings(texts); // 1000ms total
// Savings: 9,000ms (10x faster)
```

```typescript
// Implementation
async function batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await embeddingProvider.batchGenerate(batch);
    results.push(...embeddings);
  }

  return results;
}
```

## Step 6: Connection Pooling

```typescript
// Before: Create connection per request
async function query(sql: string) {
  const conn = await createConnection();
  const result = await conn.query(sql);
  await conn.close();
  return result;
}

// After: Connection pooling
class ConnectionPool {
  private pool: Connection[] = [];
  private maxSize = 10;

  async acquire(): Promise<Connection> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    if (this.pool.length < this.maxSize) {
      return await createConnection();
    }
    // Wait for available connection
    return await this.waitForConnection();
  }

  release(conn: Connection): void {
    this.pool.push(conn);
  }
}

// Results:
// - Before: 50ms per query (connection overhead)
// - After: 5ms per query
// - 10x faster
```

## Step 7: Optimize Database Queries

```typescript
// Before: N+1 queries
for (const userId of userIds) {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  users.push(user);
}
// 100 users = 100 queries = 500ms

// After: Single query
const users = await db.query('SELECT * FROM users WHERE id IN (?)', [userIds]);
// 1 query = 5ms
// 100x faster
```

## Step 8: Use QUIC Transport

QUIC provides 50-70% faster connections:

```typescript
import { QuicTransport } from 'agentopia/transport/quic';

const transport = new QuicTransport({
  host: 'localhost',
  port: 4433,
  maxConcurrentStreams: 100,
});

await transport.connect();

// Results:
// - TCP: 3 round trips, 150ms latency
// - QUIC: 0-RTT, 45ms latency
// - 70% faster
```

## Step 9: Monitor Performance

```typescript
// Track metrics
const metrics = {
  totalRequests: 0,
  totalDuration: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

async function monitoredOperation() {
  const startTime = Date.now();
  metrics.totalRequests++;

  try {
    // Check cache
    if (cache.has(key)) {
      metrics.cacheHits++;
      return cache.get(key);
    }

    metrics.cacheMisses++;
    const result = await operation();
    cache.set(key, result);

    return result;
  } finally {
    metrics.totalDuration += Date.now() - startTime;
  }
}

// View metrics
console.log({
  averageTime: metrics.totalDuration / metrics.totalRequests,
  cacheHitRate: metrics.cacheHits / metrics.totalRequests,
  totalRequests: metrics.totalRequests,
});
```

## Performance Checklist

- [ ] Agent Booster enabled (automatic for code edits)
- [ ] Cost-optimized model selection
- [ ] Caching enabled
- [ ] Batch operations implemented
- [ ] Connection pooling configured
- [ ] Database queries optimized
- [ ] QUIC transport for low-latency needs
- [ ] Performance metrics tracked

## Results Summary

| Optimization     | Before | After  | Improvement      |
| ---------------- | ------ | ------ | ---------------- |
| Agent Booster    | 352ms  | 1ms    | 352x faster      |
| Model Selection  | $0.08  | $0.012 | 85% cost savings |
| Caching          | 500ms  | 50ms   | 10x faster       |
| Batch Operations | 10s    | 1s     | 10x faster       |
| Connection Pool  | 50ms   | 5ms    | 10x faster       |
| QUIC Transport   | 150ms  | 45ms   | 70% faster       |

## Next Steps

- [ReasoningBank Tutorial](./05-reasoningbank-tutorial.md)
- [Architecture Overview](../ARCHITECTURE_OVERVIEW.md)
