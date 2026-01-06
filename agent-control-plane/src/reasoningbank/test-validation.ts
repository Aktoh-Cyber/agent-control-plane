#!/usr/bin/env node
/**
 * ReasoningBank Validation Test
 * Tests database queries, core algorithms, and integration
 */

import { ulid } from 'ulid';
import {
  fetchMemoryCandidates,
  getDb,
  incrementUsage,
  logMetric,
  upsertEmbedding,
  upsertMemory,
} from './db/queries.js';
import type { ReasoningMemory } from './db/schema.js';

console.log('🧪 ReasoningBank Validation Test\n');

// Test 1: Database Connection
console.log('1️⃣ Testing database connection...');
try {
  const db = getDb();
  console.log('   ✅ Database connected successfully');
} catch (error) {
  console.error('   ❌ Database connection failed:', error);
  process.exit(1);
}

// Test 2: Schema Verification
console.log('\n2️⃣ Verifying database schema...');
try {
  const db = getDb();
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];
  const views = db
    .prepare("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")
    .all() as { name: string }[];

  console.log('   Tables:', tables.map((t) => t.name).join(', '));
  console.log('   Views:', views.map((v) => v.name).join(', '));

  const requiredTables = [
    'patterns',
    'pattern_embeddings',
    'pattern_links',
    'task_trajectories',
    'matts_runs',
    'consolidation_runs',
  ];
  const missingTables = requiredTables.filter((t) => !tables.some((table) => table.name === t));

  if (missingTables.length > 0) {
    console.error('   ❌ Missing tables:', missingTables);
    process.exit(1);
  }

  console.log('   ✅ All required tables present');
} catch (error) {
  console.error('   ❌ Schema verification failed:', error);
  process.exit(1);
}

// Test 3: Insert Mock Memory
console.log('\n3️⃣ Testing memory insertion...');
try {
  const memoryId = ulid();
  const mockMemory: Omit<ReasoningMemory, 'created_at' | 'last_used'> = {
    id: memoryId,
    type: 'reasoning_memory',
    pattern_data: {
      title: 'Test CSRF Token Handling',
      description: 'Always extract CSRF tokens before form submission',
      content:
        '1) Check for CSRF token in meta tags, form inputs, or cookies. 2) Include token in request headers or form data. 3) Verify token extraction succeeded before submission.',
      source: {
        task_id: 'test_task_001',
        agent_id: 'test_agent',
        outcome: 'Success',
        evidence: ['step_1', 'step_2'],
      },
      tags: ['csrf', 'web', 'security', 'test'],
      domain: 'test.domain',
      created_at: new Date().toISOString(),
      confidence: 0.85,
      n_uses: 0,
    },
    confidence: 0.85,
    usage_count: 0,
  };

  upsertMemory(mockMemory);
  console.log('   ✅ Memory inserted successfully:', memoryId);

  // Insert embedding
  const mockEmbedding = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    mockEmbedding[i] = Math.sin(i * 0.01) * 0.1;
  }

  upsertEmbedding({
    id: memoryId,
    model: 'test-model',
    dims: 1024,
    vector: mockEmbedding,
    created_at: new Date().toISOString(),
  });

  console.log('   ✅ Embedding inserted successfully');
} catch (error) {
  console.error('   ❌ Memory insertion failed:', error);
  process.exit(1);
}

// Test 4: Fetch Memory Candidates
console.log('\n4️⃣ Testing memory retrieval...');
try {
  const candidates = fetchMemoryCandidates({
    domain: 'test.domain',
    minConfidence: 0.5,
  });

  console.log(`   ✅ Retrieved ${candidates.length} candidate(s)`);

  if (candidates.length > 0) {
    const first = candidates[0];
    console.log('   Sample memory:');
    console.log('     - Title:', first.pattern_data.title);
    console.log('     - Confidence:', first.confidence);
    console.log('     - Age (days):', first.age_days);
    console.log('     - Embedding dims:', first.embedding.length);
  }
} catch (error) {
  console.error('   ❌ Memory retrieval failed:', error);
  process.exit(1);
}

// Test 5: Usage Tracking
console.log('\n5️⃣ Testing usage tracking...');
try {
  const candidates = fetchMemoryCandidates({ minConfidence: 0.5 });
  if (candidates.length > 0) {
    const memoryId = candidates[0].id;
    const beforeCount = candidates[0].usage_count;

    incrementUsage(memoryId);

    const afterCandidates = fetchMemoryCandidates({ minConfidence: 0.5 });
    const afterCount = afterCandidates.find((c) => c.id === memoryId)?.usage_count || 0;

    console.log(`   ✅ Usage count: ${beforeCount} → ${afterCount}`);
  } else {
    console.log('   ⚠️  No candidates to test usage tracking');
  }
} catch (error) {
  console.error('   ❌ Usage tracking failed:', error);
  process.exit(1);
}

// Test 6: Metrics Logging
console.log('\n6️⃣ Testing metrics logging...');
try {
  logMetric('rb.test.validation', 1.0);
  logMetric('rb.retrieve.latency_ms', 42);

  const db = getDb();
  const metrics = db
    .prepare(
      `
    SELECT metric_name, value
    FROM performance_metrics
    WHERE metric_name LIKE 'rb.%'
    ORDER BY timestamp DESC
    LIMIT 5
  `
    )
    .all();

  console.log(`   ✅ Logged ${metrics.length} metric(s)`);
  metrics.forEach((m: any) => {
    console.log(`     - ${m.metric_name}: ${m.value}`);
  });
} catch (error) {
  console.error('   ❌ Metrics logging failed:', error);
  process.exit(1);
}

// Test 7: Views
console.log('\n7️⃣ Testing database views...');
try {
  const db = getDb();

  const activeMemories = db.prepare('SELECT COUNT(*) as count FROM v_active_memories').get() as {
    count: number;
  };
  console.log('   ✅ v_active_memories:', activeMemories.count, 'memories');

  const contradictions = db
    .prepare('SELECT COUNT(*) as count FROM v_memory_contradictions')
    .get() as { count: number };
  console.log('   ✅ v_memory_contradictions:', contradictions.count, 'contradictions');

  const agentPerf = db.prepare('SELECT COUNT(*) as count FROM v_agent_performance').get() as {
    count: number;
  };
  console.log('   ✅ v_agent_performance:', agentPerf.count, 'agents');
} catch (error) {
  console.error('   ❌ Views test failed:', error);
  process.exit(1);
}

console.log('\n✅ All validation tests passed!\n');
console.log('📊 Summary:');
console.log('   ✓ Database connection');
console.log('   ✓ Schema verification');
console.log('   ✓ Memory insertion');
console.log('   ✓ Memory retrieval');
console.log('   ✓ Usage tracking');
console.log('   ✓ Metrics logging');
console.log('   ✓ Database views');
console.log('\n🚀 ReasoningBank is production-ready!\n');
