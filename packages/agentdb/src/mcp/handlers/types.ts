/**
 * Shared types for MCP tool handlers
 */
import type { CausalMemoryGraph } from '../../controllers/CausalMemoryGraph.js';
import type { CausalRecall } from '../../controllers/CausalRecall.js';
import type { EmbeddingService } from '../../controllers/EmbeddingService.js';
import type { LearningSystem } from '../../controllers/LearningSystem.js';
import type { NightlyLearner } from '../../controllers/NightlyLearner.js';
import type { ReasoningBank } from '../../controllers/ReasoningBank.js';
import type { ReflexionMemory } from '../../controllers/ReflexionMemory.js';
import type { SkillLibrary } from '../../controllers/SkillLibrary.js';
import type { BatchOperations } from '../../optimizations/BatchOperations.js';
import type { MCPToolCaches } from '../../optimizations/ToolCache.js';

/**
 * Handler context containing all controllers and services
 */
export interface HandlerContext {
  db: any;
  embeddingService: EmbeddingService;
  causalGraph: CausalMemoryGraph;
  reflexion: ReflexionMemory;
  skills: SkillLibrary;
  causalRecall: CausalRecall;
  learner: NightlyLearner;
  learningSystem: LearningSystem;
  batchOps: BatchOperations;
  reasoningBank: ReasoningBank;
  caches: MCPToolCaches;
  dbPath: string;
}

/**
 * MCP tool response structure
 */
export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * MCP tool request structure
 */
export interface MCPToolRequest {
  name: string;
  arguments?: Record<string, any>;
}

/**
 * Tool handler function type
 */
export type ToolHandler = (
  args: Record<string, any>,
  context: HandlerContext
) => Promise<MCPToolResponse>;

/**
 * Tool definition structure
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
