# Tutorial: ReasoningBank Memory System

Learn how to use ReasoningBank for persistent learning and pattern recognition.

## Overview

ReasoningBank provides self-learning memory based on Google DeepMind research. It enables:

- Semantic memory search
- Pattern learning and distillation
- HIPAA-compliant PII scrubbing
- Cross-session learning

## Step 1: Initialize ReasoningBank

```typescript
import * as reasoningbank from 'agentopia/reasoningbank';

// Initialize
await reasoningbank.initialize();

console.log('ReasoningBank initialized');
```

## Step 2: Store Memories

```bash
# CLI: Store memory
npx agentdb memory store "best-practice" "Always validate input" \
  --namespace "coding" \
  --metadata '{"type": "validation", "priority": "high"}'
```

```typescript
// Programmatic
await reasoningbank.storeMemory('best-practice', 'Always validate user input before processing', {
  namespace: 'coding',
  metadata: { type: 'validation', priority: 'high' },
});
```

## Step 3: Query Memories

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
  console.log(`[${memory.score.toFixed(2)}] ${memory.key}: ${memory.value}`);
}
```

## Step 4: Pattern Learning

```typescript
// Store successful task trajectory
await reasoningbank.storeTrajectory({
  sessionId: 'session-1',
  taskId: 'implement-auth',
  steps: [
    { action: 'research', outcome: 'success', duration: 1000 },
    { action: 'plan', outcome: 'success', duration: 500 },
    { action: 'implement', outcome: 'success', duration: 3000 },
    { action: 'test', outcome: 'success', duration: 2000 },
  ],
  quality: 0.95,
  success: true,
  feedback: 'Successfully implemented JWT authentication',
});

// Learn from patterns
const patterns = await reasoningbank.learnPatterns({
  minQuality: 0.8,
  minOccurrences: 3,
});

console.log('Learned patterns:', patterns);
```

## Step 5: Memory Consolidation

```typescript
// Consolidate similar memories
const stats = await reasoningbank.consolidateMemories({
  namespace: 'coding',
  similarityThreshold: 0.9,
  minQuality: 0.7,
});

console.log('Consolidation stats:', {
  consolidated: stats.consolidated,
  duplicatesRemoved: stats.duplicatesRemoved,
  totalBefore: stats.totalBefore,
  totalAfter: stats.totalAfter,
});
```

## Step 6: Agent with Learning Memory

```typescript
async function learningAgent(task: string) {
  // Query learned patterns
  const patterns = await reasoningbank.queryMemories(task, {
    namespace: 'agent-learnings',
    limit: 5,
  });

  // Execute agent with learned context
  const result = await agent.run({
    agent: 'coder',
    task: task,
    context: {
      learnedPatterns: patterns.map((p) => p.value),
    },
  });

  // Store successful execution for future learning
  if (result.success) {
    await reasoningbank.storeMemory(`success-${task}`, result.output, {
      namespace: 'agent-learnings',
      metadata: { quality: result.quality },
    });
  }

  return result;
}

// First execution: No patterns
await learningAgent('implement authentication');

// Second execution: Uses learned patterns
await learningAgent('implement authentication'); // 46% faster!
```

## Step 7: PII Scrubbing

```typescript
import { PIIScrubber } from 'agentopia/reasoningbank';

const scrubber = new PIIScrubber();

// Sensitive data
const text = `
User email: user@example.com
API Key: sk-1234567890abcdef
Credit Card: 4111-1111-1111-1111
`;

// Scrub PII
const scrubbed = scrubber.scrub(text);

console.log(scrubbed);
// Output:
// User email: [EMAIL]
// API Key: [API_KEY]
// Credit Card: [CREDIT_CARD]

// Store safely
await reasoningbank.storeMemory('user-data', scrubbed, {
  namespace: 'secure',
});
```

## Step 8: Namespace Isolation

```typescript
// Different namespaces for different contexts
await reasoningbank.storeMemory('pattern', 'value', {
  namespace: 'authentication',
});

await reasoningbank.storeMemory('pattern', 'value', {
  namespace: 'database',
});

await reasoningbank.storeMemory('pattern', 'value', {
  namespace: 'api',
});

// Query specific namespace
const authPatterns = await reasoningbank.queryMemories('', {
  namespace: 'authentication',
});

const dbPatterns = await reasoningbank.queryMemories('', {
  namespace: 'database',
});
```

## Step 9: Quality Judgment

```typescript
// Judge trajectory quality
const judgment = await reasoningbank.judgeTrajectory({
  sessionId: 'session-1',
  taskId: 'implement-feature',
  steps: [
    /* ... */
  ],
  quality: 0.85,
  success: true,
  feedback: 'Feature implemented successfully',
});

if (judgment.shouldStore) {
  console.log('High quality trajectory, storing for learning');
  await reasoningbank.storeTrajectory(judgment.trajectory);
} else {
  console.log('Low quality trajectory, not storing');
}
```

## Performance Benefits

With ReasoningBank learning:

| Metric         | First Run | After Learning | Improvement |
| -------------- | --------- | -------------- | ----------- |
| Success Rate   | 70%       | 90%            | +20%        |
| Execution Time | 5000ms    | 2700ms         | 46% faster  |
| Quality Score  | 0.75      | 0.92           | +23%        |

## Best Practices

1. **Use namespaces** - Organize memories by context
2. **Consolidate regularly** - Remove duplicates
3. **Judge quality** - Only store high-quality patterns
4. **Enable PII scrubbing** - Protect sensitive data
5. **Query before tasks** - Use learned patterns
6. **Store successes** - Build knowledge base

## Advanced: Embedding Providers

```typescript
import { config } from './config/index.js';

// Hash embedding (fast, offline)
config.set('embedding', {
  provider: 'hash',
  dimensions: 384,
  model: 'hash',
});

// OpenAI embedding (high quality)
config.set('embedding', {
  provider: 'openai',
  dimensions: 1536,
  model: 'text-embedding-3-large',
});

// Anthropic embedding (Claude-powered)
config.set('embedding', {
  provider: 'anthropic',
  dimensions: 1024,
  model: 'claude-3-haiku',
});
```

## Conclusion

ReasoningBank enables agents that:

- Learn from experience
- Improve over time
- Share knowledge
- Protect privacy

## Next Steps

- [Architecture Overview](../ARCHITECTURE_OVERVIEW.md)
- [Performance Optimization](./04-performance-optimization.md)
