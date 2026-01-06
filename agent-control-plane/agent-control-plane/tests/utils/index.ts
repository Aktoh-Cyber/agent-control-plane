/**
 * Test Utilities - Main Export
 * Comprehensive testing framework for Hive Mind collective
 *
 * @example
 * ```typescript
 * import { aUser, anAgent, createMockDatabase, assert } from './tests/utils';
 *
 * // Create test data
 * const user = aUser().asAdmin().build();
 * const agent = anAgent().asResearcher().build();
 *
 * // Use mocks
 * const db = createMockDatabase();
 * db.insert('users', user);
 *
 * // Make assertions
 * assert.defined(user.id);
 * assert.deepEqual(user.role, 'admin');
 * ```
 */

// Data Builders
export * from './builders';
export {
  aJob,
  aMemory,
  aSwarmConfig,
  aTask,
  aUser,
  aVector,
  agentBuilders,
  anAgent,
  anAgentConfig,
  configBuilders,
  jobBuilders,
  memoryBuilders,
  taskBuilders,
  userBuilders,
  vectorBuilders,
} from './builders';

// Mocks
export * from './mocks';
export {
  createMockAPIClient,
  createMockDatabase,
  createMockFilesystem,
  createMockMCPServer,
  createMockMCPServerWithTools,
  createMockRedis,
  createMockVectorStore,
} from './mocks';

// Helpers
export * from './helpers';
export { assert, asyncUtils, contextUtils, setupUtils, snapshotUtils, timeUtils } from './helpers';

// Fixtures
export * from './fixtures';
export {
  createLargeSwarm,
  createLinearWorkflow,
  createMediumSwarm,
  createParallelWorkflow,
  createSmallSwarm,
  sampleAgents,
  sampleJobs,
  sampleMemories,
  sampleTasks,
  sampleUsers,
  sampleVectors,
} from './fixtures';
