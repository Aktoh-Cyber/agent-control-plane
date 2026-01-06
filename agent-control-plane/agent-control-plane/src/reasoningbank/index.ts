/**
 * ReasoningBank - Closed-loop memory system for AI agents
 * Based on arXiv:2509.25140 (Google DeepMind)
 */

export { ReasoningBankDB } from './core/database.js';
export { ReasoningBankEngine } from './core/memory-engine.js';
export { cosineSimilarity, createEmbeddingProvider } from './utils/embeddings.js';
export { PIIScrubber, piiScrubber } from './utils/pii-scrubber.js';

export type {
  ConsolidationOptions,
  ConsolidationStats,
  JudgmentResult,
  MattsRun,
  Memory,
  MemoryCandidate,
  PatternData,
  PatternEmbedding,
  ReasoningBankConfig,
  RetrievalOptions,
  ScoringWeights,
  TaskExecutionOptions,
  TaskResult,
  TaskTrajectory,
} from './types/index.js';
