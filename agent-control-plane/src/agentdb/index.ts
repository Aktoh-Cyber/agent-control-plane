/**
 * AgentDB Re-exports for Backwards Compatibility
 *
 * This module provides backwards-compatible exports for code that previously
 * used embedded AgentDB controllers. Now proxies to agentdb npm package.
 *
 * @deprecated Import directly from specific agentdb paths for better tree-shaking
 * @since v1.7.0 - Integrated agentdb as proper dependency
 *
 * Example migration:
 * ```typescript
 * // Old (still works)
 * import { ReflexionMemory } from 'agent-control-plane/agentdb';
 *
 * // New (recommended)
 * import { ReflexionMemory } from './controllers/ReflexionMemory';
 * ```
 */

// Import from individual controller paths (agentdb v1.3.9 exports pattern)
export { CausalMemoryGraph } from './controllers/CausalMemoryGraph';
export { CausalRecall } from './controllers/CausalRecall';
export { EmbeddingService } from './controllers/EmbeddingService';
export { ExplainableRecall } from './controllers/ExplainableRecall';
export { NightlyLearner } from './controllers/NightlyLearner';
export { ReflexionMemory } from './controllers/ReflexionMemory';
export { SkillLibrary } from './controllers/SkillLibrary';

// Note: These are custom types not exported from agentdb v1.3.9
// Users should import from agentdb directly if needed
// export type { LearningSystem } from 'agentdb/...';
// export type { ReasoningBank } from 'agentdb/...';

// Note: Optimizations not available in agentdb v1.3.9
// Users can implement custom optimizations or use AgentDB's built-in features
