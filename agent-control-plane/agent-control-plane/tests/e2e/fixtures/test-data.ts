/**
 * E2E Test Data Fixtures
 * Reusable test data for E2E scenarios
 */

/**
 * Sample agent configurations
 */
export const agentConfigs = {
  coder: {
    type: 'coder',
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 30000,
  },
  tester: {
    type: 'tester',
    maxTokens: 1500,
    temperature: 0.5,
    timeout: 25000,
  },
  reviewer: {
    type: 'reviewer',
    maxTokens: 1800,
    temperature: 0.6,
    timeout: 28000,
  },
  researcher: {
    type: 'researcher',
    maxTokens: 2500,
    temperature: 0.8,
    timeout: 35000,
  },
  architect: {
    type: 'system-architect',
    maxTokens: 3000,
    temperature: 0.6,
    timeout: 40000,
  },
};

/**
 * Sample task templates
 */
export const taskTemplates = {
  simpleCoding: {
    type: 'coding',
    description: 'Simple coding task',
    priority: 5,
    estimatedDuration: 10000,
  },
  complexCoding: {
    type: 'coding',
    description: 'Complex coding task requiring research',
    priority: 8,
    estimatedDuration: 30000,
    dependencies: [],
  },
  unitTesting: {
    type: 'testing',
    description: 'Write unit tests',
    priority: 6,
    estimatedDuration: 15000,
  },
  integrationTesting: {
    type: 'testing',
    description: 'Write integration tests',
    priority: 7,
    estimatedDuration: 20000,
  },
  codeReview: {
    type: 'review',
    description: 'Review code for quality and security',
    priority: 7,
    estimatedDuration: 12000,
  },
  research: {
    type: 'research',
    description: 'Research best practices and patterns',
    priority: 4,
    estimatedDuration: 18000,
  },
};

/**
 * Sample swarm configurations
 */
export const swarmConfigs = {
  smallMesh: {
    topology: 'mesh',
    maxAgents: 3,
    consensus: 'gossip',
    timeout: 60000,
  },
  mediumHierarchical: {
    topology: 'hierarchical',
    maxAgents: 7,
    consensus: 'raft',
    timeout: 120000,
    coordinatorConfig: {
      maxWorkers: 6,
      taskDistribution: 'round-robin',
    },
  },
  largeMesh: {
    topology: 'mesh',
    maxAgents: 15,
    consensus: 'gossip',
    timeout: 180000,
    autoScale: true,
  },
  pipeline: {
    topology: 'pipeline',
    maxAgents: 5,
    timeout: 90000,
    sequential: true,
  },
};

/**
 * Sample project structures
 */
export const projectStructures = {
  simpleBackend: {
    name: 'Simple Backend API',
    files: [
      { path: 'src/server.ts', type: 'code' },
      { path: 'src/routes/api.ts', type: 'code' },
      { path: 'src/models/user.ts', type: 'code' },
      { path: 'tests/api.test.ts', type: 'test' },
    ],
  },
  fullStack: {
    name: 'Full Stack Application',
    files: [
      { path: 'backend/server.ts', type: 'code' },
      { path: 'backend/routes/api.ts', type: 'code' },
      { path: 'backend/models/user.ts', type: 'code' },
      { path: 'frontend/src/App.tsx', type: 'code' },
      { path: 'frontend/src/components/UserList.tsx', type: 'code' },
      { path: 'database/schema.sql', type: 'schema' },
      { path: 'tests/backend/api.test.ts', type: 'test' },
      { path: 'tests/frontend/App.test.tsx', type: 'test' },
    ],
  },
  microservices: {
    name: 'Microservices Architecture',
    files: [
      { path: 'services/auth/src/index.ts', type: 'code' },
      { path: 'services/users/src/index.ts', type: 'code' },
      { path: 'services/orders/src/index.ts', type: 'code' },
      { path: 'gateway/src/index.ts', type: 'code' },
      { path: 'shared/types/index.ts', type: 'code' },
      { path: 'tests/integration/auth.test.ts', type: 'test' },
    ],
  },
};

/**
 * Sample vector embeddings for testing
 */
export const sampleVectors = {
  // Design patterns
  patterns: [
    {
      key: 'singleton',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        pattern: 'Singleton',
        category: 'Creational',
        description: 'Ensures a class has only one instance',
      },
    },
    {
      key: 'factory',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        pattern: 'Factory',
        category: 'Creational',
        description: 'Creates objects without specifying exact class',
      },
    },
    {
      key: 'observer',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        pattern: 'Observer',
        category: 'Behavioral',
        description: 'Defines one-to-many dependency between objects',
      },
    },
  ],

  // Code snippets
  snippets: [
    {
      key: 'async-handler',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        language: 'typescript',
        type: 'async',
        description: 'Async error handler middleware',
      },
    },
    {
      key: 'db-connection',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        language: 'typescript',
        type: 'database',
        description: 'Database connection pool setup',
      },
    },
  ],

  // Learning trajectories
  trajectories: [
    {
      key: 'trajectory-1',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        task: 'API implementation',
        outcome: 'success',
        duration: 15000,
        quality: 0.85,
      },
    },
    {
      key: 'trajectory-2',
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: {
        task: 'Test writing',
        outcome: 'success',
        duration: 12000,
        quality: 0.9,
      },
    },
  ],
};

/**
 * Sample MCP messages
 */
export const mcpMessages = {
  taskComplete: {
    method: 'notification/task-complete',
    params: {
      taskId: 'task-123',
      agentId: 'agent-456',
      status: 'completed',
      output: { result: 'success' },
    },
  },
  memoryStore: {
    method: 'tools/call',
    params: {
      name: 'memory_usage',
      arguments: {
        action: 'store',
        key: 'test-key',
        namespace: 'swarm',
        value: JSON.stringify({ data: 'test-data' }),
      },
    },
  },
  swarmStatus: {
    method: 'tools/call',
    params: {
      name: 'swarm_status',
      arguments: {
        swarmId: 'swarm-123',
      },
    },
  },
};

/**
 * Sample failure scenarios
 */
export const failureScenarios = {
  timeout: {
    type: 'timeout',
    description: 'Task exceeds timeout',
    config: { timeout: 100 },
  },
  agentCrash: {
    type: 'crash',
    description: 'Agent crashes during execution',
    config: { simulateCrash: true },
  },
  networkFailure: {
    type: 'network',
    description: 'Network connection fails',
    config: { simulateNetworkFailure: true },
  },
  invalidInput: {
    type: 'validation',
    description: 'Invalid input data',
    config: { invalidData: true },
  },
  resourceExhaustion: {
    type: 'resource',
    description: 'System runs out of resources',
    config: { simulateResourceExhaustion: true },
  },
};

/**
 * Sample consensus scenarios
 */
export const consensusScenarios = {
  simpleVote: {
    type: 'vote',
    proposal: {
      question: 'Which approach should we use?',
      options: ['approach-a', 'approach-b', 'approach-c'],
      requiredConsensus: 0.6,
    },
  },
  byzantineFailure: {
    type: 'byzantine',
    proposal: {
      question: 'Should we proceed with deployment?',
      options: ['yes', 'no'],
      requiredConsensus: 0.67,
      byzantineAgents: 1, // One agent will send conflicting votes
    },
  },
  partitionedNetwork: {
    type: 'partition',
    proposal: {
      question: 'Choose implementation strategy',
      options: ['strategy-1', 'strategy-2'],
      networkPartitions: 2,
    },
  },
};

/**
 * Sample performance benchmarks
 */
export const performanceBenchmarks = {
  singleAgent: {
    name: 'Single Agent Execution',
    agents: 1,
    tasks: 1,
    expectedDuration: 5000,
    maxDuration: 10000,
  },
  parallelAgents: {
    name: 'Parallel Agent Execution',
    agents: 5,
    tasks: 5,
    expectedDuration: 8000,
    maxDuration: 15000,
  },
  pipelineExecution: {
    name: 'Pipeline Execution',
    agents: 4,
    tasks: 4,
    expectedDuration: 20000,
    maxDuration: 35000,
  },
  loadTest: {
    name: 'Load Test',
    agents: 20,
    tasks: 100,
    expectedDuration: 60000,
    maxDuration: 120000,
  },
};

/**
 * Helper function to generate test data
 */
export function generateTestData(type: string, count: number = 1): any[] {
  const generators: Record<string, () => any> = {
    agent: () => ({
      id: `agent-${Math.random().toString(36).substring(7)}`,
      type: ['coder', 'tester', 'reviewer'][Math.floor(Math.random() * 3)],
      status: 'idle',
      capabilities: ['coding', 'testing', 'review'],
    }),
    task: () => ({
      id: `task-${Math.random().toString(36).substring(7)}`,
      type: ['coding', 'testing', 'review'][Math.floor(Math.random() * 3)],
      status: 'pending',
      priority: Math.floor(Math.random() * 10) + 1,
    }),
    vector: () => ({
      key: `vector-${Math.random().toString(36).substring(7)}`,
      vector: Array.from({ length: 128 }, () => Math.random()),
      metadata: { timestamp: Date.now() },
    }),
  };

  const generator = generators[type];
  if (!generator) {
    throw new Error(`Unknown test data type: ${type}`);
  }

  return Array.from({ length: count }, generator);
}
