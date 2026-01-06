# ReasoningBank Storage Backends

ReasoningBank provides **two storage implementations** optimized for different environments:

## 📊 Backend Comparison

| Backend     | Environment  | Storage   | Persistence | Performance | Use Case                     |
| ----------- | ------------ | --------- | ----------- | ----------- | ---------------------------- |
| **Node.js** | CLI, servers | SQLite    | ✅ Yes      | 2-5ms/op    | Production, long-term memory |
| **WASM**    | Browser      | IndexedDB | ✅ Yes      | 1-3ms/op    | Web apps, client-side        |
| **WASM**    | Node.js      | RAM       | ❌ No       | 0.04ms/op   | Temporary data, fast access  |

---

## 🔧 Usage

### Node.js Backend (Recommended for CLIs)

**Use when:** Building CLIs, servers, or any application needing persistent storage.

```javascript
import { ReasoningBank } from 'agent-control-plane/dist/reasoningbank/index.js';

// Initialize with SQLite database
const rb = new ReasoningBank({
  dbPath: '.swarm/memory.db',
});

// Store pattern (persists to disk)
await rb.storePattern({
  task_description: 'Implement authentication',
  task_category: 'auth',
  strategy: 'jwt-tokens',
  success_score: 0.9,
});

// Search patterns (queries SQLite database)
const patterns = await rb.searchByCategory('auth', 10);
// Returns: All patterns from database ✅

// Semantic search
const similar = await rb.findSimilar('user login', 'auth', 5);
// Returns: Similar patterns with scores (e.g., 0.54-0.62)
```

**Features:**

- ✅ Persistent SQLite storage
- ✅ Automatic embedding generation
- ✅ Fast semantic search (2-5ms)
- ✅ Production-ready
- ✅ Cross-session memory

---

### WASM Backend (For Browsers)

**Use when:** Building web applications that need client-side storage.

```javascript
import { createReasoningBank } from 'agent-control-plane/dist/reasoningbank/wasm-adapter.js';

// Initialize WASM instance (uses IndexedDB in browser)
const rb = await createReasoningBank('my-app-db');

// Store pattern (persists to IndexedDB)
await rb.storePattern({
  task_description: 'Handle form validation',
  task_category: 'ui',
  strategy: 'real-time-validation',
  success_score: 0.95,
});

// Semantic search
const similar = await rb.findSimilar('user input validation', 'ui', 5);
// Returns: Similar patterns with scores
```

**Features:**

- ✅ Persistent IndexedDB storage (browser)
- ✅ Native performance via WASM
- ✅ Ultra-fast operations (0.04ms in-memory)
- ✅ Browser-optimized
- ⚠️ In-memory only in Node.js (ephemeral)

---

## 🎯 Backend Selection Guide

### Automatic Selection (Recommended)

```javascript
// Environment-aware import
const ReasoningBankImpl =
  typeof window !== 'undefined'
    ? await import('agent-control-plane/dist/reasoningbank/wasm-adapter.js')
    : await import('agent-control-plane/dist/reasoningbank/index.js');

const rb =
  typeof window !== 'undefined'
    ? await ReasoningBankImpl.createReasoningBank('app-memory')
    : new ReasoningBankImpl.ReasoningBank({ dbPath: '.swarm/memory.db' });

// Now use rb normally - it will work optimally in both environments
const patterns = await rb.searchByCategory('category', 10);
```

### Manual Selection

**Choose Node.js backend when:**

- Building CLI tools
- Need persistent storage
- Running on servers
- Require SQLite features

**Choose WASM backend when:**

- Building web apps
- Need client-side storage
- Want maximum browser performance
- Require offline capabilities

---

## 🔍 Key Differences

### Storage Location

**Node.js:**

```
.swarm/memory.db (SQLite database on disk)
├── patterns table
├── pattern_embeddings table
└── Full SQL query support
```

**WASM (Browser):**

```
IndexedDB: my-app-db (browser storage)
├── patterns store
├── embeddings store
└── Fast key-value lookups
```

**WASM (Node.js):**

```
RAM only (ephemeral, lost on process exit)
├── In-memory HashMap
└── Fastest access, no persistence
```

### Embedding Generation

Both backends **automatically generate embeddings** when you store patterns:

```rust
// Internal: reasoningbank-core/src/engine.rs
pub fn prepare_pattern(&self, mut pattern: Pattern) -> Result<Pattern> {
    // Auto-generate embedding if not present
    if pattern.embedding.is_none() {
        let embedding = VectorEmbedding::from_text(&pattern.task_description);
        pattern.embedding = Some(embedding.values);
    }
    Ok(pattern)
}
```

**You don't need to manually generate embeddings!** They are created automatically from your task description.

---

## 📦 Package.json Integration

For projects supporting both Node.js and browsers, use conditional exports:

```json
{
  "name": "my-app",
  "exports": {
    "./memory": {
      "node": "./dist/memory-node.js",
      "browser": "./dist/memory-browser.js"
    }
  }
}
```

**memory-node.js:**

```javascript
export { ReasoningBank } from 'agent-control-plane/dist/reasoningbank/index.js';
```

**memory-browser.js:**

```javascript
export { createReasoningBank as ReasoningBank } from 'agent-control-plane/dist/reasoningbank/wasm-adapter.js';
```

---

## 🧪 Validation

### Test Node.js Backend

```bash
node <<EOF
import { ReasoningBank } from 'agent-control-plane/dist/reasoningbank/index.js';

const rb = new ReasoningBank({ dbPath: '.swarm/memory.db' });

// Store
const id = await rb.storePattern({
  task_description: 'Test pattern',
  task_category: 'test',
  strategy: 'validation',
  success_score: 0.95
});

// Search
const patterns = await rb.searchByCategory('test', 10);
console.log(\`Found \${patterns.length} patterns\`);
// Expected: 1 pattern

// Get stats
const stats = await rb.getStats();
console.log(stats);
// Expected: { total_patterns: 1, total_categories: 1 }
EOF
```

### Test WASM Backend (Browser)

```javascript
// In browser console or webpack bundle
import { createReasoningBank } from 'agent-control-plane/dist/reasoningbank/wasm-adapter.js';

const rb = await createReasoningBank('test-db');

// Store
await rb.storePattern({
  task_description: 'Browser test',
  task_category: 'test',
  strategy: 'client-side',
  success_score: 0.9,
});

// Search
const patterns = await rb.searchByCategory('test', 10);
console.log(`Found ${patterns.length} patterns`);
// Expected: 1 pattern

// Semantic search
const similar = await rb.findSimilar('test validation', 'test', 5);
console.log(`Similarity: ${similar[0]?.similarity_score}`);
// Expected: score > 0.5
```

### Test WASM Backend (Node.js - In-Memory)

```bash
node --experimental-wasm-modules <<EOF
import { createReasoningBank } from 'agent-control-plane/dist/reasoningbank/wasm-adapter.js';

const rb = await createReasoningBank('test');

// Store
await rb.storePattern({
  task_description: 'Node WASM test',
  task_category: 'test',
  strategy: 'in-memory',
  success_score: 0.92
});

// Search (same session)
const patterns = await rb.searchByCategory('test', 10);
console.log(\`Found \${patterns.length} patterns\`);
// Expected: 1 pattern (only in current session)

// Stats
const stats = await rb.getStats();
console.log(\`Backend: \${stats.storage_backend}\`);
// Expected: "wasm-memory"
EOF
```

---

## ⚠️ Important Notes

### WASM in Node.js

When using WASM in Node.js:

- Storage is **in-memory only** (not persistent)
- Data is **lost** when process exits
- Useful for temporary/ephemeral data
- **Use Node.js backend instead** for persistent storage

### Node.js Flag Requirement

When importing WASM in Node.js, you need the experimental flag:

```bash
node --experimental-wasm-modules your-script.mjs
```

This is **not required** for:

- Node.js backend (SQLite)
- WASM in browsers
- Production builds with bundlers (webpack, vite, rollup)

---

## 🚀 Recommendations

### For agent-control-plane Package

1. **Default to environment-appropriate backend**:
   - Node.js → SQLite backend
   - Browser → WASM backend

2. **Document WASM limitations** in Node.js:
   - In-memory only
   - No cross-session persistence
   - Use Node.js backend for CLIs

3. **Provide helper function**:

```typescript
export function getRecommendedBackend(): 'nodejs' | 'wasm' {
  return typeof window === 'undefined' ? 'nodejs' : 'wasm';
}
```

### For Integration Projects

1. **Use Node.js backend** for:
   - CLI tools (like gendev)
   - Server applications
   - Long-running processes
   - Persistent memory requirements

2. **Use WASM backend** for:
   - Browser applications
   - Client-side AI features
   - Offline-first apps
   - WebAssembly-optimized environments

---

## 📊 Performance Metrics

### Storage Operations

| Operation           | Node.js | WASM (Browser) | WASM (Node.js) |
| ------------------- | ------- | -------------- | -------------- |
| **Store Pattern**   | 2-5ms   | 1-3ms          | 0.04ms         |
| **Category Search** | 2-3ms   | 1-2ms          | 0.02ms         |
| **Semantic Search** | 3-5ms   | 2-4ms          | 0.06ms         |
| **Get Stats**       | 1ms     | 0.5ms          | 0.01ms         |

### Embedding Generation

Both backends generate embeddings at the same speed:

- **1024-dimensional vectors**
- **Generated from text** via `VectorEmbedding::from_text()`
- **Automatically created** on `storePattern()`

---

## 🔗 Related Documentation

- [ReasoningBank Core](https://github.com/Aktoh-Cyber/agent-control-plane/tree/main/agent-control-plane/src/reasoningbank)
- [WASM ESM Fix](./WASM_ESM_FIX.md)
- [ReasoningBank Investigation](./REASONINGBANK_INVESTIGATION.md)
- [ReasoningBank Fixes](./REASONINGBANK_FIXES.md)

---

**Status**: Production Ready ✅
**Maintained by**: [@ruvnet](https://github.com/ruvnet)
**Version**: 1.5.12+
