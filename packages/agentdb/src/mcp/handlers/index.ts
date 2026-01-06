/**
 * Central export file for all MCP tool handlers
 */
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';

// Export types
export * from './types.js';
export * from './utils.js';

// Database handlers
import {
  databaseTools,
  handleAgentdbDelete,
  handleAgentdbInit,
  handleAgentdbInsert,
  handleAgentdbInsertBatch,
  handleAgentdbSearch,
} from './database.js';

// Memory handlers
import {
  handlePatternSearch,
  handlePatternStats,
  handlePatternStore,
  handlePatternStoreBatch,
  handleRecallWithCertificate,
  handleReflexionRetrieve,
  handleReflexionStore,
  handleReflexionStoreBatch,
  memoryTools,
} from './memory.js';

// Skill handlers
import {
  handleSkillCreate,
  handleSkillCreateBatch,
  handleSkillSearch,
  skillTools,
} from './skills.js';

// Causal handlers
import {
  causalTools,
  handleCausalAddEdge,
  handleCausalQuery,
  handleLearnerDiscover,
} from './causal.js';

// Learning handlers
import {
  handleExperienceRecord,
  handleLearningEndSession,
  handleLearningExplain,
  handleLearningFeedback,
  handleLearningMetrics,
  handleLearningPredict,
  handleLearningStartSession,
  handleLearningTrain,
  handleLearningTransfer,
  handleRewardSignal,
  learningTools,
} from './learning.js';

// Admin handlers
import { adminTools, handleAgentdbStats, handleClearCache, handleDbStats } from './admin.js';

/**
 * All tool definitions combined
 */
export const allTools: ToolDefinition[] = [
  ...databaseTools,
  ...memoryTools,
  ...skillTools,
  ...causalTools,
  ...learningTools,
  ...adminTools,
];

/**
 * Tool handler function type
 */
export type ToolHandler = (
  args: Record<string, any>,
  context: HandlerContext
) => Promise<MCPToolResponse>;

/**
 * Handler registry mapping tool names to their handler functions
 */
export const toolHandlers: Record<string, ToolHandler> = {
  // Database tools
  agentdb_init: handleAgentdbInit,
  agentdb_insert: handleAgentdbInsert,
  agentdb_insert_batch: handleAgentdbInsertBatch,
  agentdb_search: handleAgentdbSearch,
  agentdb_delete: handleAgentdbDelete,

  // Memory tools
  reflexion_store: handleReflexionStore,
  reflexion_retrieve: handleReflexionRetrieve,
  reflexion_store_batch: handleReflexionStoreBatch,
  recall_with_certificate: handleRecallWithCertificate,
  agentdb_pattern_store: handlePatternStore,
  agentdb_pattern_search: handlePatternSearch,
  agentdb_pattern_stats: handlePatternStats,
  agentdb_pattern_store_batch: handlePatternStoreBatch,

  // Skill tools
  skill_create: handleSkillCreate,
  skill_search: handleSkillSearch,
  skill_create_batch: handleSkillCreateBatch,

  // Causal tools
  causal_add_edge: handleCausalAddEdge,
  causal_query: handleCausalQuery,
  learner_discover: handleLearnerDiscover,

  // Learning tools
  learning_start_session: handleLearningStartSession,
  learning_end_session: handleLearningEndSession,
  learning_predict: handleLearningPredict,
  learning_feedback: handleLearningFeedback,
  learning_train: handleLearningTrain,
  learning_metrics: handleLearningMetrics,
  learning_transfer: handleLearningTransfer,
  learning_explain: handleLearningExplain,
  experience_record: handleExperienceRecord,
  reward_signal: handleRewardSignal,

  // Admin tools
  db_stats: handleDbStats,
  agentdb_stats: handleAgentdbStats,
  agentdb_clear_cache: handleClearCache,
};

/**
 * Execute a tool handler by name
 */
export async function executeToolHandler(
  name: string,
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const handler = toolHandlers[name];
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return handler(args, context);
}
