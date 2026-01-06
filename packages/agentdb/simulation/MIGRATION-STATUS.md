# AgentDB v2 Controller Migration Status

**Date**: 2025-11-30
**Status**: ⚠️ **PARTIAL - In Progress**

---

## ✅ Completed Migrations

### ReflexionMemory

- ✅ GraphDatabaseAdapter support added
- ✅ Detection pattern: `'storeEpisode' in this.graphBackend`
- ✅ Specialized methods: `storeEpisode()`, `searchSimilarEpisodes()`
- ✅ SQLite fallback maintained
- ✅ **3/4 working scenarios use this**

**Status**: ✅ **PRODUCTION READY**

---

## ⚠️ Partial Migrations

### CausalMemoryGraph

- ✅ GraphDatabaseAdapter import added
- ✅ Constructor updated to accept `graphBackend` parameter
- ✅ Detection pattern: `'createCausalEdge' in this.graphBackend`
- ✅ `addCausalEdge()` method migrated
- ⚠️ **ID mapping issue**: Episode IDs from `storeEpisode` return numeric IDs, but graph edges need full string node IDs
- ⚠️ Scenarios fail with: `Entity episode-{id} not found in hypergraph`

**Blockers**:

1. Need to track full node ID strings (e.g., "episode-89667068432584530")
2. ReflexionMemory returns numeric IDs but doesn't expose string IDs
3. Options:
   - Modify ReflexionMemory to return both numeric and string IDs
   - Create ID mapping service
   - Store full node IDs in scenario state

**Affected Scenarios**:

- strange-loops (blocked)
- causal-reasoning (blocked)

**Status**: ⚠️ **BLOCKED - Needs ID Resolution**

---

## ❌ Not Started

### SkillLibrary

- ❌ No migration started
- ❌ Still uses `this.db.prepare()` SQLite APIs
- ❌ Needs GraphDatabaseAdapter support

**Affected Scenarios**:

- skill-evolution (blocked)
- multi-agent-swarm (blocked)

**Status**: ❌ **NOT STARTED**

---

## 📊 Current Scenario Status

| Scenario                | Controller Dependencies            | Status     | Blocker      |
| ----------------------- | ---------------------------------- | ---------- | ------------ |
| lean-agentic-swarm      | None                               | ✅ Working | -            |
| reflexion-learning      | ReflexionMemory                    | ✅ Working | -            |
| voting-system-consensus | ReflexionMemory                    | ✅ Working | -            |
| stock-market-emergence  | ReflexionMemory                    | ✅ Working | -            |
| strange-loops           | ReflexionMemory, CausalMemoryGraph | ⚠️ Blocked | ID mapping   |
| causal-reasoning        | ReflexionMemory, CausalMemoryGraph | ⚠️ Blocked | ID mapping   |
| skill-evolution         | SkillLibrary                       | ❌ Blocked | No migration |
| multi-agent-swarm       | SkillLibrary                       | ❌ Blocked | No migration |
| graph-traversal         | Direct graph APIs                  | ❓ Unknown | Not tested   |

**Working**: 4/9 (44%)
**Blocked by ID Mapping**: 2/9 (22%)
**Blocked by No Migration**: 2/9 (22%)
**Unknown**: 1/9 (11%)

---

## 🔧 Solutions for ID Mapping Issue

### Option 1: Dual Return Values (Recommended)

Modify ReflexionMemory to return both IDs:

```typescript
interface EpisodeResult {
  numericId: number;  // For backward compatibility
  nodeId: string;     // Full graph node ID
}

async storeEpisode(episode: Episode): Promise<EpisodeResult> {
  if (this.graphBackend && 'storeEpisode' in this.graphBackend) {
    const nodeId = await graphAdapter.storeEpisode({...}, taskEmbedding);
    return {
      numericId: parseInt(nodeId.split('-').pop() || '0', 36),
      nodeId: nodeId  // Keep full ID
    };
  }
  // ...
}
```

**Pros**: Clean, explicit, type-safe
**Cons**: Breaking change to API

### Option 2: ID Mapping Service

Create a service to track node ID mappings:

```typescript
class NodeIdMapper {
  private map = new Map<number, string>();

  register(numericId: number, nodeId: string): void {
    this.map.set(numericId, nodeId);
  }

  getNodeId(numericId: number): string {
    return this.map.get(numericId) || `episode-${numericId}`;
  }
}
```

**Pros**: Non-breaking, easy to add
**Cons**: Extra state management

### Option 3: Store Full IDs in Scenarios

Scenarios track their own node IDs:

```typescript
const episodeIds = new Map<number, string>();
const numericId = await reflexion.storeEpisode(episode);
const nodeId = `episode-${Date.now()}${Math.random()}`; // Reconstruct
episodeIds.set(numericId, nodeId);
```

**Pros**: Minimal changes to controllers
**Cons**: Fragile, scenarios need extra logic

---

## 📋 Next Steps

### Immediate (Unblock Scenarios)

1. **Implement Option 1 or 2** to resolve ID mapping
2. **Test strange-loops and causal-reasoning**
3. **Migrate SkillLibrary** (same pattern as CausalMemoryGraph)
4. **Test skill-evolution and multi-agent-swarm**
5. **Test graph-traversal** to identify issues

### Short-term (Complete v2 Migration)

6. **Update all controllers** to use GraphDatabaseAdapter
7. **Remove SQLite fallback** after verification
8. **Optimize graph queries** for performance
9. **Add comprehensive tests** for all controllers

### Long-term (Advanced Features)

10. **Implement advanced graph traversal**
11. **Add multi-hop causal reasoning**
12. **Integrate LLM for causal mechanism generation**
13. **Build visualization tools** for graph exploration

---

## 🎯 Recommendation

**Priority**: Implement **Option 2 (ID Mapping Service)** for minimal disruption

```typescript
// Add to db-unified.ts
export class NodeIdMapper {
  private static instance: NodeIdMapper;
  private map = new Map<number, string>();

  static getInstance(): NodeIdMapper {
    if (!this.instance) {
      this.instance = new NodeIdMapper();
    }
    return this.instance;
  }

  register(numericId: number, nodeId: string): void {
    this.map.set(numericId, nodeId);
  }

  getNodeId(numericId: number): string | undefined {
    return this.map.get(numericId);
  }
}
```

**Implementation**:

1. Update ReflexionMemory to register IDs when storing episodes
2. Update CausalMemoryGraph to look up full node IDs before creating edges
3. Test with strange-loops scenario
4. Roll out to other scenarios

**Estimated Time**: 30-60 minutes

---

## 📈 Progress Tracking

- [x] Analyze controller dependencies
- [x] Migrate ReflexionMemory
- [x] Test ReflexionMemory with scenarios
- [x] Start CausalMemoryGraph migration
- [ ] Resolve ID mapping issue
- [ ] Complete CausalMemoryGraph migration
- [ ] Migrate SkillLibrary
- [ ] Test all scenarios
- [ ] Remove SQLite fallback
- [ ] Production deployment

**Progress**: 4/10 (40%)

---

**Created**: 2025-11-30
**System**: AgentDB v2.0.0
**Working Scenarios**: 4/9 (44%)
**Blocked Scenarios**: 5/9 (56%)
**Next Action**: Implement ID Mapping Service
