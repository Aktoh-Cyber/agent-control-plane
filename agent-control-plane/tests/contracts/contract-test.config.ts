// Contract Testing Configuration
// Framework: Pact for consumer-driven contract testing
// Supports MCP tools, API endpoints, and inter-service contracts

import { join } from 'path';

export const contractTestConfig = {
  // Pact configuration
  pact: {
    pactfileWriteMode: 'update' as const,
    dir: join(__dirname, 'pacts'),
    log: join(__dirname, 'logs', 'pact.log'),
    logLevel: 'info' as const,
    spec: 2,
    consumer: 'agent-control-plane',
    provider: 'mcp-server',
    host: '127.0.0.1',
    port: 8080,
  },

  // Schema validation
  schemas: {
    dir: join(__dirname, 'schemas'),
    strictMode: true,
    validateInputs: true,
    validateOutputs: true,
  },

  // MCP tool categories
  mcpToolCategories: {
    swarm: ['swarm_init', 'agent_spawn', 'task_orchestrate'],
    monitoring: ['swarm_status', 'agent_list', 'agent_metrics', 'task_status'],
    memory: ['memory_usage', 'memory_store', 'memory_retrieve'],
    neural: ['neural_status', 'neural_train', 'neural_patterns'],
    github: ['github_swarm', 'repo_analyze', 'pr_enhance'],
    system: ['benchmark_run', 'features_detect', 'swarm_monitor'],
  },

  // Contract versioning
  versioning: {
    strategy: 'semantic',
    currentVersion: '1.10.3',
    breakingChangePolicy: 'provider-first',
    deprecationPeriod: 90, // days
  },

  // Test coverage targets
  coverage: {
    mcpTools: {
      target: 100, // All 213 tools
      minimum: 95,
    },
    apiEndpoints: {
      target: 100,
      minimum: 90,
    },
    interService: {
      target: 100,
      minimum: 85,
    },
  },
};

export default contractTestConfig;
