# E2E Testing Guide for Agent Swarm Workflows

## Overview

This comprehensive E2E testing suite validates the end-to-end functionality of agent swarm workflows, multi-agent coordination, and cross-service integration in the agent-control-plane platform.

## Table of Contents

1. [Test Coverage](#test-coverage)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Test Scenarios](#test-scenarios)
5. [CI/CD Integration](#cicd-integration)
6. [Writing New Tests](#writing-new-tests)
7. [Troubleshooting](#troubleshooting)

## Test Coverage

The E2E test suite covers **20+ comprehensive scenarios** across three main categories:

### 1. Swarm Workflows (`swarm-workflows.test.ts`)

**Single Agent Execution:**

- ✅ Spawn, execute, and complete single agent task
- ✅ Handle agent execution timeout
- ✅ Handle agent execution failure and retry

**Multi-Agent Parallel Execution:**

- ✅ Execute 3 agents in parallel
- ✅ Execute 5 agents with load balancing
- ✅ Handle partial failures in parallel execution

**Sequential Agent Workflows:**

- ✅ Execute pipeline workflow (agent A → agent B → agent C)
- ✅ Handle dependencies between tasks
- ✅ Stop pipeline on failure

**Conditional Workflows:**

- ✅ Route based on if-then conditions
- ✅ Handle complex branching logic

**Error Handling:**

- ✅ Retry failed tasks with exponential backoff
- ✅ Handle agent crash and recovery
- ✅ Handle network failures gracefully
- ✅ Timeout gracefully for long-running tasks

### 2. Multi-Agent Coordination (`coordination.test.ts`)

**Hierarchical Coordination (Queen + Workers):**

- ✅ Coordinate queen agent with 4 worker agents
- ✅ Handle worker failure and reassignment
- ✅ Scale workers dynamically based on load

**Mesh Coordination (Peer-to-Peer):**

- ✅ Coordinate 6 peer agents in mesh topology
- ✅ Use gossip protocol for consensus
- ✅ Handle network partitions in mesh

**Memory Sharing:**

- ✅ Share memory across agents via AgentDB
- ✅ Use vector search for semantic memory retrieval
- ✅ Handle concurrent memory writes

**Task Distribution:**

- ✅ Distribute 20 tasks across 5 agents evenly
- ✅ Use priority queue for task scheduling
- ✅ Balance load based on agent capacity

**Agent Communication via MCP:**

- ✅ Communicate between agents via MCP protocol
- ✅ Handle MCP pub/sub for broadcast messages

### 3. Cross-Service Integration (`integration.test.ts`)

**AgentDB + Swarm Coordination:**

- ✅ Integrate AgentDB vector search with swarm memory
- ✅ Use AgentDB for distributed agent state
- ✅ Handle AgentDB failure gracefully

**MCP Server + Client Integration:**

- ✅ Connect MCP client to server and execute commands
- ✅ Handle MCP server restart
- ✅ Stream MCP events to multiple clients

**ReasoningBank + Learning System:**

- ✅ Train ReasoningBank from agent trajectories
- ✅ Use ReasoningBank for adaptive decision making
- ✅ Share learned patterns across agents

**QUIC Transport Integration:**

- ✅ Use QUIC for low-latency agent communication
- ✅ Handle QUIC connection multiplexing
- ✅ Sync AgentDB over QUIC transport

**File System Operations:**

- ✅ Coordinate file operations across agents
- ✅ Handle concurrent file access with locking
- ✅ Watch files for changes across agents

**End-to-End Scenarios:**

- ✅ Complete full-stack development workflow
- ✅ Complex multi-stage pipeline with all services

## Setup

### Prerequisites

- Node.js 18.x or 20.x
- npm or pnpm
- 8GB+ RAM recommended for running full test suite

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Create test directories
mkdir -p .tmp/test-agentdb test-reports test-results
```

### Environment Configuration

Create a `.env.test` file:

```env
# Test environment
NODE_ENV=test
LOG_LEVEL=info

# MCP Server
MCP_PORT=3000
BASE_URL=http://localhost:3000

# AgentDB
AGENTDB_PATH=./.tmp/test-agentdb

# Timeouts (in ms)
TEST_TIMEOUT=30000
AGENT_TIMEOUT=60000
SWARM_TIMEOUT=120000

# Performance
MAX_AGENTS=20
PARALLEL_WORKERS=4
```

## Running Tests

### Run All E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode (recommended for debugging)
npx playwright test --ui

# Run specific test file
npx playwright test swarm-workflows.test.ts

# Run specific test by name
npx playwright test -g "should execute 3 agents in parallel"
```

### Run Tests by Category

```bash
# Swarm workflows only
npx playwright test --project=swarm-workflows

# Coordination tests only
npx playwright test --project=coordination

# Integration tests only
npx playwright test --project=integration
```

### Debug Mode

```bash
# Run with headed browser (for visual debugging)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run specific test with trace
npx playwright test --trace on swarm-workflows.test.ts
```

### Parallel Execution

```bash
# Run with specific number of workers
npx playwright test --workers=4

# Run tests in parallel shards (for CI)
npx playwright test --shard=1/3
npx playwright test --shard=2/3
npx playwright test --shard=3/3
```

## Test Scenarios

### Scenario 1: Single Agent Workflow

**Objective:** Test basic agent spawning and task execution

**Steps:**

1. Initialize swarm with pipeline topology
2. Spawn single coder agent
3. Execute coding task
4. Verify task completion
5. Check swarm status

**Expected Result:** Agent completes task successfully within timeout

### Scenario 2: Parallel Multi-Agent Execution

**Objective:** Test parallel execution of multiple agents

**Steps:**

1. Initialize mesh swarm with 5 agents
2. Spawn agents with different roles
3. Execute tasks in parallel
4. Measure total execution time
5. Verify all tasks completed

**Expected Result:** Parallel execution is faster than sequential

### Scenario 3: Hierarchical Coordination

**Objective:** Test queen-worker coordination pattern

**Steps:**

1. Initialize hierarchical swarm
2. Spawn queen coordinator
3. Spawn 4 worker agents
4. Queen distributes tasks to workers
5. Verify all workers completed their subtasks

**Expected Result:** All workers complete assigned tasks, coordinated by queen

### Scenario 4: Memory Sharing via AgentDB

**Objective:** Test cross-agent memory coordination

**Steps:**

1. Agent 1 stores research findings in AgentDB
2. Wait for memory propagation
3. Agent 2 reads from shared memory
4. Agent 3 adds review feedback to memory
5. Verify all agents accessed shared memory

**Expected Result:** All agents successfully share and access memory

### Scenario 5: Full-Stack Development Workflow

**Objective:** End-to-end integration test

**Steps:**

1. Initialize hierarchical swarm with architect queen
2. Spawn specialized workers (backend, frontend, database, tester, reviewer)
3. Execute complete project workflow
4. Verify project structure created
5. Check for backend, frontend, and test files

**Expected Result:** Complete full-stack project generated with all components

## CI/CD Integration

### GitHub Actions

The E2E test suite automatically runs on:

- ✅ Push to `main` or `develop` branches
- ✅ Pull requests
- ✅ Daily scheduled runs (2 AM UTC)
- ✅ Manual workflow dispatch

### Test Sharding

Tests are split across 3 shards for faster CI execution:

- Shard 1/3: Swarm workflow tests
- Shard 2/3: Coordination tests
- Shard 3/3: Integration tests

### Matrix Testing

Tests run on multiple configurations:

- Node.js 18.x and 20.x
- Ubuntu latest
- Parallel execution with 2 workers

### Artifacts

The following artifacts are uploaded on test completion:

- **Test Reports**: HTML, JSON, and JUnit formats
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests
- **Traces**: Full execution traces for debugging

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from './setup';

test.describe('Feature Name', () => {
  test('should do something', async ({ swarmCoordinator, agentDb, testLogger }) => {
    testLogger.info('Test description');

    // Arrange
    const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);
    const agentId = await swarmCoordinator.spawnAgent('coder');

    // Act
    const result = await swarmCoordinator.executeTask(agentId, {
      type: 'coding',
      description: 'Task description',
    });

    // Assert
    expect(result.status).toBe('completed');
    testLogger.info('Test completed successfully');
  });
});
```

### Using Fixtures

The test setup provides the following fixtures:

**`config`**: Test environment configuration

```typescript
const { baseUrl, timeout, agentDbPath } = config;
```

**`testLogger`**: Structured logging

```typescript
testLogger.info('Starting test');
testLogger.error('Test failed');
```

**`mcpServer`**: MCP server instance

```typescript
await mcpServer.start();
await mcpServer.healthCheck();
await mcpServer.stop();
```

**`agentDb`**: AgentDB instance

```typescript
await agentDb.initialize();
await agentDb.storeVector(namespace, key, vector, metadata);
const results = await agentDb.searchSimilar(namespace, vector, limit);
```

**`swarmCoordinator`**: Swarm coordination

```typescript
const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);
const agentId = await swarmCoordinator.spawnAgent('coder');
const result = await swarmCoordinator.executeTask(agentId, task);
```

### Using Test Helpers

**Assertions:**

```typescript
import { assertSwarmState, assertTaskCompleted } from './helpers/assertions';

await assertSwarmState(getStatus, { agentCount: 5, completedTasks: 10 });
assertTaskCompleted(result);
```

**Utilities:**

```typescript
import { waitForCondition, retryWithBackoff, measureTime } from './helpers/test-utils';

await waitForCondition(async () => await isReady(), { timeout: 5000 });
const result = await retryWithBackoff(operation, { maxRetries: 3 });
const { result, duration } = await measureTime(async () => await operation());
```

**Test Data:**

```typescript
import { agentConfigs, taskTemplates, sampleVectors } from './fixtures/test-data';

const agent = await spawnAgent('coder', agentConfigs.coder);
const task = { ...taskTemplates.simpleCoding, description: 'Custom task' };
```

## Troubleshooting

### Common Issues

**1. Tests timeout**

```bash
# Increase timeout in playwright.config.ts
timeout: 120000  // 2 minutes

# Or set environment variable
TEST_TIMEOUT=120000 npx playwright test
```

**2. MCP server fails to start**

```bash
# Check if port is already in use
lsof -i :3000

# Use different port
MCP_PORT=3001 npx playwright test
```

**3. AgentDB initialization fails**

```bash
# Clean up old database
rm -rf .tmp/test-agentdb

# Recreate directory
mkdir -p .tmp/test-agentdb
```

**4. Out of memory errors**

```bash
# Reduce parallel workers
npx playwright test --workers=2

# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npx playwright test
```

**5. Flaky tests**

```bash
# Run with retries
npx playwright test --retries=2

# Run specific flaky test multiple times
npx playwright test --repeat-each=5 -g "flaky test name"
```

### Debug Tips

**View test logs:**

```bash
# Verbose logging
LOG_LEVEL=debug npx playwright test

# Save logs to file
npx playwright test 2>&1 | tee test.log
```

**Inspect test traces:**

```bash
# Generate trace on failure
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace test-results/trace.zip
```

**Interactive debugging:**

```bash
# Pause test execution
await page.pause();

# Use debug mode
npx playwright test --debug
```

## Performance Benchmarks

Expected performance metrics:

| Scenario         | Agents | Tasks | Expected Duration | Max Duration |
| ---------------- | ------ | ----- | ----------------- | ------------ |
| Single Agent     | 1      | 1     | 5s                | 10s          |
| Parallel (5)     | 5      | 5     | 8s                | 15s          |
| Pipeline (4)     | 4      | 4     | 20s               | 35s          |
| Hierarchical (6) | 6      | 10    | 25s               | 45s          |
| Load Test        | 20     | 100   | 60s               | 120s         |

## Test Coverage Goals

- **Statement Coverage**: >85%
- **Branch Coverage**: >80%
- **Function Coverage**: >85%
- **Line Coverage**: >85%
- **Integration Coverage**: >90%

## Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Use appropriate fixtures and helpers
3. Add comprehensive assertions
4. Include error scenarios
5. Document test scenarios
6. Update this guide

## Support

For issues or questions:

- GitHub Issues: https://github.com/tafyai/agent-control-plane/issues
- Documentation: https://docs.agent-control-plane.dev
- Community: https://discord.gg/agent-control-plane

---

**Last Updated**: 2025-12-08
**Test Suite Version**: 1.0.0
**Total Test Scenarios**: 26+
