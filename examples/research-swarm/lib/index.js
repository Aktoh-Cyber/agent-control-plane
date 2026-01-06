// Database utilities
export {
  createJob,
  getDatabase,
  getJobStatus,
  getJobs,
  initDatabase,
  markComplete,
  updateProgress,
} from './db-utils.js';

// ReasoningBank integration
export {
  getLearningStats,
  searchSimilarPatterns,
  storeResearchPattern,
} from './reasoningbank-integration.js';

// HNSW vector search
export {
  addVectorToHNSW,
  buildHNSWGraph,
  getHNSWStats,
  initializeHNSWIndex,
  searchHNSW,
  searchSimilarVectors,
  searchSimilarVectorsFallback,
} from './agentdb-hnsw.js';

// Swarm decomposition and execution
export { decomposeTask, getSwarmRoles, validateSwarmConfig } from './swarm-decomposition.js';

export { executeSwarm } from './swarm-executor.js';

// GOALIE integration (NEW in v1.2.0)
export {
  decomposeGoal,
  executeGoalBasedResearch,
  explainGoalPlan,
  planResearch,
} from './goalie-integration.js';

// Permit Platform adapter (NEW in v1.2.0)
export {
  PermitPlatformAdapter,
  getPermitAdapter,
  resetPermitAdapter,
} from './permit-platform-adapter.js';

// MCP server (exported via subpath: import { ... } from 'research-swarm/mcp')

// Convenience functions
export async function createResearchJob(config) {
  const {
    agent,
    task,
    depth = 5,
    timeMinutes = 120,
    focus = 'balanced',
    enableED2551 = true,
    enableCitations = true,
    antiHallucination = 'medium',
    enableReasoningBank = true,
  } = config;

  const db = getDatabase();
  const jobId = await createJob({
    agent,
    task,
    config: JSON.stringify({
      depth,
      timeMinutes,
      focus,
      enableED2551,
      enableCitations,
      antiHallucination,
      enableReasoningBank,
    }),
  });
  return jobId;
}

export async function listJobs(options = {}) {
  const { limit = 100, status, agent } = options;
  const db = getDatabase();
  let query = 'SELECT * FROM research_jobs WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (agent) {
    query += ' AND agent_type = ?';
    params.push(agent);
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return db.prepare(query).all(...params);
}

// Metadata
export const VERSION = '1.2.2';
export const PACKAGE_NAME = 'research-swarm';

// Default export
import * as hnsw from './agentdb-hnsw.js';
import * as dbUtils from './db-utils.js';
import * as goalieIntegration from './goalie-integration.js';
import * as permitAdapter from './permit-platform-adapter.js';
import * as reasoningbank from './reasoningbank-integration.js';
import * as swarmDecomposition from './swarm-decomposition.js';
import * as swarmExecutor from './swarm-executor.js';

export default {
  ...dbUtils,
  createResearchJob,
  listJobs,
  ...reasoningbank,
  ...hnsw,
  ...swarmDecomposition,
  ...swarmExecutor,
  ...goalieIntegration,
  ...permitAdapter,
  VERSION,
  PACKAGE_NAME,
};
