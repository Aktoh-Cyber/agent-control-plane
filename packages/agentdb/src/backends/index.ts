/**
 * AgentDB Backends - Unified Vector Storage Interface
 *
 * Provides automatic backend selection between RuVector and HNSWLib
 * with graceful fallback and clear error messages.
 */

// Core interfaces
export type {
  SearchOptions,
  SearchResult,
  VectorBackend,
  VectorConfig,
  VectorStats,
} from './VectorBackend.js';

// Backend implementations
export { HNSWLibBackend } from './hnswlib/HNSWLibBackend.js';
export { RuVectorBackend } from './ruvector/RuVectorBackend.js';
export { RuVectorLearning } from './ruvector/RuVectorLearning.js';

// Factory and detection
export {
  createBackend,
  detectBackends,
  getInstallCommand,
  getRecommendedBackend,
  isBackendAvailable,
} from './factory.js';

export type { BackendDetection, BackendType } from './factory.js';
export type { EnhancementOptions, LearningConfig } from './ruvector/RuVectorLearning.js';
