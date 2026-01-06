# AgentDB v2.0.0-alpha.2.5 Changelog

## 🚨 CRITICAL BUG FIX - Schema Loading

### Release Date

January 30, 2025

### Version

2.0.0-alpha.2.5

---

## 🔧 Critical Fix

### Schema File Resolution for npx Execution

**Problem**: Alpha.2.4 failed to load database schemas when executed via `npx agentdb@alpha`, causing "no such table: episodes" errors during reflexion operations.

**Root Cause**: The schema file path resolution didn't account for npm's temporary installation directory structure used by npx (e.g., `~/.npm/_npx/*/node_modules/agentdb`).

**Fix**: Added `path.join(__dirname, '../../schemas')` to the basePaths array in agentdb-cli.ts, which correctly resolves to `dist/schemas/` in the published package structure.

**File Modified**: `src/cli/agentdb-cli.ts` (line 78)

**Before**:

```typescript
const basePaths = [
  path.join(__dirname, '../schemas'), // dist/cli/../schemas
  path.join(__dirname, '../../src/schemas'), // dist/cli/../../src/schemas
  path.join(process.cwd(), 'dist/schemas'),
  path.join(process.cwd(), 'src/schemas'),
  path.join(process.cwd(), 'node_modules/agentdb/dist/schemas'),
];
```

**After**:

```typescript
const basePaths = [
  path.join(__dirname, '../schemas'), // dist/cli/../schemas (local dev)
  path.join(__dirname, '../../schemas'), // dist/schemas (published package) ✅ NEW
  path.join(__dirname, '../../src/schemas'),
  path.join(process.cwd(), 'dist/schemas'),
  path.join(process.cwd(), 'src/schemas'),
  path.join(process.cwd(), 'node_modules/agentdb/dist/schemas'),
];
```

---

## 📊 Impact

### What Worked in Alpha.2.4

- ✅ `npm install agentdb@alpha` (local installation)
- ✅ `agentdb init` (after local install)
- ✅ Direct execution via `node dist/cli/agentdb-cli.js`

### What Failed in Alpha.2.4

- ❌ `npx agentdb@alpha init` (schema not found)
- ❌ `npx agentdb@alpha reflexion store` (table creation failed)
- ❌ Docker benchmarks using npx execution

### What Now Works in Alpha.2.5

- ✅ **ALL execution methods**
- ✅ `npx agentdb@alpha` - full functionality restored
- ✅ Docker testing with npx
- ✅ Benchmark suite execution
- ✅ All reflexion, skill, causal operations

---

## 🧪 Validation

### Test Commands

```bash
# Test schema loading with npx
npx agentdb@alpha init /tmp/test.db --dimension 384
npx agentdb@alpha status /tmp/test.db --verbose

# Test reflexion operations
npx agentdb@alpha reflexion store session-1 "test-task" 0.95 true \
  "critique" "input" "output" 100 50 --db /tmp/test.db

# Test in Docker
docker run --rm node:20-slim bash -c \
  "npm install -g agentdb@alpha && \
   npx agentdb@alpha init /tmp/test.db && \
   npx agentdb@alpha status /tmp/test.db"
```

### Expected Output

```
✅ AgentDB initialized successfully
✅ Using sql.js (WASM SQLite, no build tools required)
✅ Status check complete
💭 Storing Episode
✅ Episode stored successfully
```

---

## 📦 Package Information

### npm Registry

```bash
npm install agentdb@alpha
# or
npx agentdb@alpha --version
```

**Version**: 2.0.0-alpha.2.5
**Published**: January 30, 2025
**Tag**: alpha
**Size**: ~1.8 MB (including all features)

### Included in Package

- ✅ Schema files (dist/schemas/\*.sql)
- ✅ TypeScript definitions
- ✅ Browser bundle
- ✅ Simulation scenarios
- ✅ Complete CLI
- ✅ All controllers and backends

---

## 🔄 Migration from Alpha.2.4

**No breaking changes** - this is a pure bug fix release.

If you experienced "no such table" errors with alpha.2.4:

```bash
# Simply update to alpha.2.5
npm update agentdb@alpha
# or
npx agentdb@alpha init  # Will automatically use latest alpha
```

**No database migration required** - existing databases are fully compatible.

---

## 🎯 Features Preserved from Alpha.2.4

All features from alpha.2.4 remain intact:

### Embedding Model Support

- ✅ 7+ embedding models available
- ✅ Smart defaults (384-dim → MiniLM, 768-dim → bge-base)
- ✅ Model selection via `--model` flag
- ✅ MTEB benchmark documentation

### CLI Parameters

- ✅ `--model` - Select embedding model
- ✅ `--preset` - Performance hints (small/medium/large)
- ✅ `--in-memory` - Zero disk I/O testing mode
- ✅ `--dimension` - Vector dimensions (384, 768)
- ✅ `--backend` - Backend selection (auto, ruvector, hnswlib)

### Documentation

- ✅ EMBEDDING-MODELS-GUIDE.md (476 lines)
- ✅ README.md embedding section
- ✅ Complete CLI help text
- ✅ Comprehensive parameter coverage

---

## 🐛 Known Issues

None currently identified. All alpha.2.4 functionality working correctly.

---

## 📖 Documentation

### Primary Documentation

- **Embedding Models Guide**: `docs/EMBEDDING-MODELS-GUIDE.md`
- **Main README**: `README.md`
- **Alpha 2.4 Report**: `ALPHA-2.4-COMPLETE-REPORT.md`
- **This Changelog**: `docs/CHANGELOG-ALPHA-2.5.md`

### CLI Help

```bash
npx agentdb@alpha --help
npx agentdb@alpha init --help
npx agentdb@alpha reflexion --help
```

---

## 🙏 Acknowledgments

Thanks to Docker testing that revealed this critical npx execution path issue during benchmark validation.

---

## 📝 Summary

**v2.0.0-alpha.2.5** is a critical bug fix release that resolves schema loading issues when AgentDB is executed via `npx`. This ensures all execution methods work consistently:

- ✅ Local installation (`npm install agentdb@alpha`)
- ✅ npx execution (`npx agentdb@alpha`)
- ✅ Docker containerization
- ✅ CI/CD pipelines

**Recommendation**: All alpha.2.4 users should upgrade immediately to alpha.2.5.

```bash
npx agentdb@alpha --version
# Expected: agentdb v2.0.0-alpha.2.5
```

---

**Full Changelog**: alpha.2.4...alpha.2.5
**Published**: 2025-01-30
**npm**: https://www.npmjs.com/package/agentdb
