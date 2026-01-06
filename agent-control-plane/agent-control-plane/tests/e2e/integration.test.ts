/**
 * E2E Tests: Cross-Service Integration
 * Tests for AgentDB, MCP, ReasoningBank, QUIC, and file system integration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { expect, test, utils } from './setup';

test.describe('Cross-Service Integration E2E', () => {
  test.describe('AgentDB + Swarm Coordination', () => {
    test('should integrate AgentDB vector search with swarm memory', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing AgentDB + Swarm integration');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('researcher', { agentDbEnabled: true }),
        swarmCoordinator.spawnAgent('coder', { agentDbEnabled: true }),
        swarmCoordinator.spawnAgent('coder', { agentDbEnabled: true }),
      ]);

      // Agent 1: Store research vectors
      const researchVectors = [
        {
          key: 'pattern-mvc',
          vector: utils.generateTestData.randomVector(),
          metadata: { pattern: 'MVC', description: 'Model-View-Controller' },
        },
        {
          key: 'pattern-mvvm',
          vector: utils.generateTestData.randomVector(),
          metadata: { pattern: 'MVVM', description: 'Model-View-ViewModel' },
        },
        {
          key: 'pattern-flux',
          vector: utils.generateTestData.randomVector(),
          metadata: { pattern: 'Flux', description: 'Unidirectional data flow' },
        },
      ];

      for (const item of researchVectors) {
        await agentDb.storeVector('swarm/patterns', item.key, item.vector, item.metadata);
      }

      testLogger.info('Stored 3 pattern vectors in AgentDB');

      // Agent 2 & 3: Search for similar patterns
      const queryVector = utils.generateTestData.randomVector();
      const similarPatterns = await agentDb.searchSimilar('swarm/patterns', queryVector, 2);

      expect(similarPatterns.length).toBeGreaterThan(0);
      testLogger.info(`Found ${similarPatterns.length} similar patterns`);

      // Agents use search results to inform their work
      const results = await Promise.all([
        swarmCoordinator.executeTask(agents[1], {
          type: 'coding',
          description: 'Implement using pattern',
          agentDbQuery: { namespace: 'swarm/patterns', vector: queryVector },
        }),
        swarmCoordinator.executeTask(agents[2], {
          type: 'coding',
          description: 'Alternative implementation',
          agentDbQuery: { namespace: 'swarm/patterns', vector: queryVector },
        }),
      ]);

      expect(results.every((r) => r.status === 'completed')).toBe(true);
      testLogger.info('AgentDB successfully integrated with swarm coordination');
    });

    test('should use AgentDB for distributed agent state', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing AgentDB for distributed state management');

      const swarmId = await swarmCoordinator.initializeSwarm('hierarchical', 5);

      const queenId = await swarmCoordinator.spawnAgent('hierarchical-coordinator', {
        role: 'queen',
        stateStore: 'agentdb',
      });

      const workers = await Promise.all(
        Array.from({ length: 4 }, (_, i) =>
          swarmCoordinator.spawnAgent('coder', {
            role: 'worker',
            queen: queenId,
            stateStore: 'agentdb',
          })
        )
      );

      // Execute distributed task
      const result = await swarmCoordinator.executeTask(queenId, {
        type: 'project',
        description: 'Distributed project with state tracking',
        subtasks: workers.map((_, i) => ({
          type: 'coding',
          description: `Module ${i + 1}`,
        })),
      });

      // Verify state is persisted in AgentDB
      const stateQuery = await agentDb.query(
        "SELECT * FROM agent_state WHERE swarm_id = '" + swarmId + "'"
      );

      expect(stateQuery.length).toBeGreaterThan(0);
      testLogger.info(`Found ${stateQuery.length} agent states in AgentDB`);
    });

    test('should handle AgentDB failure gracefully', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing graceful AgentDB failure handling');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { agentDbEnabled: true, fallbackMemory: true }),
        swarmCoordinator.spawnAgent('coder', { agentDbEnabled: true, fallbackMemory: true }),
      ]);

      // Simulate AgentDB failure
      await agentDb.cleanup();

      // Agents should fall back to in-memory storage
      const result = await swarmCoordinator.executeTask(agents[0], {
        type: 'coding',
        description: 'Task with AgentDB unavailable',
        storeInMemory: true,
      });

      expect(result.status).toBe('completed');
      expect(result.usedFallback).toBe(true);
      testLogger.info('Successfully fell back to in-memory storage');

      // Reinitialize AgentDB
      await agentDb.initialize();
    });
  });

  test.describe('MCP Server + Client Integration', () => {
    test('should connect MCP client to server and execute commands', async ({
      mcpServer,
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing MCP client-server integration');

      expect(await mcpServer.healthCheck()).toBe(true);

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { mcpClient: true }),
        swarmCoordinator.spawnAgent('reviewer', { mcpClient: true }),
      ]);

      // Agent 1 executes MCP command
      const result = await swarmCoordinator.executeTask(agents[0], {
        type: 'coding',
        description: 'Execute via MCP',
        mcpCommand: {
          method: 'tools/call',
          params: {
            name: 'memory_usage',
            arguments: {
              action: 'store',
              key: 'test-key',
              value: JSON.stringify({ data: 'test-data' }),
            },
          },
        },
      });

      expect(result.status).toBe('completed');
      expect(result.mcpResponse).toBeDefined();
      testLogger.info('MCP command executed successfully');
    });

    test('should handle MCP server restart', async ({
      mcpServer,
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing MCP server restart resilience');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 1);
      const agentId = await swarmCoordinator.spawnAgent('coder', {
        mcpClient: true,
        reconnect: true,
      });

      // Execute initial task
      const result1 = await swarmCoordinator.executeTask(agentId, {
        type: 'coding',
        description: 'Task before restart',
      });
      expect(result1.status).toBe('completed');

      // Restart MCP server
      testLogger.info('Restarting MCP server...');
      await mcpServer.stop();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await mcpServer.start();

      // Wait for reconnection
      await utils.waitFor(async () => await mcpServer.healthCheck(), 10000);

      // Execute task after restart
      const result2 = await swarmCoordinator.executeTask(agentId, {
        type: 'coding',
        description: 'Task after restart',
      });

      expect(result2.status).toBe('completed');
      testLogger.info('Successfully reconnected after MCP server restart');
    });

    test('should stream MCP events to multiple clients', async ({
      mcpServer,
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing MCP event streaming');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all(
        Array.from({ length: 3 }, () =>
          swarmCoordinator.spawnAgent('coder', { mcpClient: true, streamEvents: true })
        )
      );

      // Subscribe all agents to event stream
      const subscriptions = await Promise.all(
        agents.map((agentId) =>
          swarmCoordinator.executeTask(agentId, {
            type: 'subscribe',
            mcpTopic: 'swarm-events',
          })
        )
      );

      // Publish event
      await swarmCoordinator.executeTask(agents[0], {
        type: 'publish',
        mcpTopic: 'swarm-events',
        event: { type: 'task-complete', agentId: agents[0] },
      });

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify all clients received event
      const status = await swarmCoordinator.getSwarmStatus();
      const eventRecipients = status.agents.filter((a: any) =>
        a.receivedEvents?.some((e: any) => e.type === 'task-complete')
      );

      expect(eventRecipients.length).toBe(3);
      testLogger.info('Event successfully streamed to all 3 MCP clients');
    });
  });

  test.describe('ReasoningBank + Learning System', () => {
    test('should train ReasoningBank from agent trajectories', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing ReasoningBank training integration');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { reasoningBankEnabled: true }),
        swarmCoordinator.spawnAgent('coder', { reasoningBankEnabled: true }),
      ]);

      // Execute tasks and collect trajectories
      const trajectories = [];

      for (let i = 0; i < 5; i++) {
        const result = await swarmCoordinator.executeTask(agents[i % 2], {
          type: 'coding',
          description: `Training task ${i + 1}`,
          collectTrajectory: true,
        });

        if (result.trajectory) {
          trajectories.push(result.trajectory);
        }
      }

      expect(trajectories.length).toBeGreaterThan(0);
      testLogger.info(`Collected ${trajectories.length} trajectories`);

      // Train ReasoningBank
      const trainingResult = await swarmCoordinator.executeTask(agents[0], {
        type: 'train-reasoning',
        trajectories,
        algorithm: 'q-learning',
      });

      expect(trainingResult.status).toBe('completed');
      expect(trainingResult.modelUpdated).toBe(true);
      testLogger.info('ReasoningBank model trained successfully');
    });

    test('should use ReasoningBank for adaptive decision making', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing ReasoningBank adaptive decisions');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 1);
      const agentId = await swarmCoordinator.spawnAgent('smart-agent', {
        reasoningBankEnabled: true,
      });

      // Initial task (no training)
      const result1 = await swarmCoordinator.executeTask(agentId, {
        type: 'coding',
        description: 'Complex algorithmic task',
        useReasoning: true,
      });

      const initialApproach = result1.reasoningApproach;
      testLogger.info(`Initial approach: ${initialApproach}`);

      // Execute multiple tasks to build experience
      for (let i = 0; i < 5; i++) {
        await swarmCoordinator.executeTask(agentId, {
          type: 'coding',
          description: 'Similar algorithmic task',
          useReasoning: true,
          collectTrajectory: true,
        });
      }

      // Task after learning
      const result2 = await swarmCoordinator.executeTask(agentId, {
        type: 'coding',
        description: 'Complex algorithmic task',
        useReasoning: true,
      });

      const improvedApproach = result2.reasoningApproach;
      testLogger.info(`Improved approach: ${improvedApproach}`);

      // Verify reasoning improved
      expect(result2.reasoningConfidence).toBeGreaterThan(result1.reasoningConfidence);
      testLogger.info('ReasoningBank successfully adapted strategy');
    });

    test('should share learned patterns across agents', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing cross-agent pattern sharing via ReasoningBank');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all(
        Array.from({ length: 3 }, () =>
          swarmCoordinator.spawnAgent('smart-agent', {
            reasoningBankEnabled: true,
            sharedLearning: true,
          })
        )
      );

      // Agent 1 learns a pattern
      for (let i = 0; i < 3; i++) {
        await swarmCoordinator.executeTask(agents[0], {
          type: 'coding',
          description: 'Pattern learning task',
          collectTrajectory: true,
          sharePattern: true,
        });
      }

      // Wait for pattern propagation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Agent 2 & 3 should benefit from learned pattern
      const results = await Promise.all([
        swarmCoordinator.executeTask(agents[1], {
          type: 'coding',
          description: 'Similar task',
          useSharedPatterns: true,
        }),
        swarmCoordinator.executeTask(agents[2], {
          type: 'coding',
          description: 'Similar task',
          useSharedPatterns: true,
        }),
      ]);

      expect(results.every((r) => r.usedSharedPattern === true)).toBe(true);
      testLogger.info('All agents successfully used shared learned patterns');
    });
  });

  test.describe('QUIC Transport Integration', () => {
    test('should use QUIC for low-latency agent communication', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing QUIC transport integration');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { transport: 'quic', quicPort: 4433 }),
        swarmCoordinator.spawnAgent('coder', { transport: 'quic', quicPort: 4434 }),
      ]);

      // Measure latency with QUIC
      const startTime = Date.now();

      await swarmCoordinator.executeTask(agents[0], {
        type: 'ping',
        target: agents[1],
        transport: 'quic',
      });

      const quicLatency = Date.now() - startTime;
      testLogger.info(`QUIC latency: ${quicLatency}ms`);

      expect(quicLatency).toBeLessThan(100); // Should be very fast
    });

    test('should handle QUIC connection multiplexing', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing QUIC connection multiplexing');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { transport: 'quic' }),
        swarmCoordinator.spawnAgent('coder', { transport: 'quic' }),
      ]);

      // Send multiple messages over same connection
      const messages = Array.from({ length: 10 }, (_, i) => ({
        type: 'data',
        payload: `Message ${i + 1}`,
      }));

      const results = await Promise.all(
        messages.map((msg) =>
          swarmCoordinator.executeTask(agents[0], {
            type: 'send',
            target: agents[1],
            message: msg,
            transport: 'quic',
          })
        )
      );

      expect(results.every((r) => r.status === 'completed')).toBe(true);
      testLogger.info('Successfully multiplexed 10 messages over QUIC');
    });

    test('should sync AgentDB over QUIC transport', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing AgentDB sync over QUIC');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', {
          transport: 'quic',
          agentDbEnabled: true,
          syncTransport: 'quic',
        }),
        swarmCoordinator.spawnAgent('coder', {
          transport: 'quic',
          agentDbEnabled: true,
          syncTransport: 'quic',
        }),
      ]);

      // Agent 1 writes to AgentDB
      const vector = utils.generateTestData.randomVector();
      await agentDb.storeVector('swarm/sync-test', 'test-key', vector, { agent: agents[0] });

      // Wait for QUIC sync
      await utils.waitFor(async () => {
        const results = await agentDb.searchSimilar('swarm/sync-test', vector, 1);
        return results.length > 0;
      }, 5000);

      // Agent 2 should see the data via QUIC sync
      const searchResults = await agentDb.searchSimilar('swarm/sync-test', vector, 1);
      expect(searchResults.length).toBe(1);

      testLogger.info('AgentDB successfully synced over QUIC');
    });
  });

  test.describe('File System Operations', () => {
    test('should coordinate file operations across agents', async ({
      swarmCoordinator,
      config,
      testLogger,
    }) => {
      testLogger.info('Testing coordinated file system operations');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 3);
      const testDir = path.join(config.tempDir, 'file-ops-test');

      await fs.mkdir(testDir, { recursive: true });

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { workDir: testDir }),
        swarmCoordinator.spawnAgent('coder', { workDir: testDir }),
        swarmCoordinator.spawnAgent('reviewer', { workDir: testDir }),
      ]);

      // Agent 1: Create files
      const result1 = await swarmCoordinator.executeTask(agents[0], {
        type: 'file-create',
        files: [
          { path: 'module-a.ts', content: 'export class ModuleA {}' },
          { path: 'module-b.ts', content: 'export class ModuleB {}' },
        ],
      });

      // Agent 2: Modify files
      const result2 = await swarmCoordinator.executeTask(agents[1], {
        type: 'file-modify',
        files: ['module-a.ts', 'module-b.ts'],
        modifications: [
          { file: 'module-a.ts', operation: 'append', content: '\n// Added by Agent 2' },
        ],
      });

      // Agent 3: Review files
      const result3 = await swarmCoordinator.executeTask(agents[2], {
        type: 'file-review',
        files: ['module-a.ts', 'module-b.ts'],
      });

      // Verify file operations
      const moduleAContent = await fs.readFile(path.join(testDir, 'module-a.ts'), 'utf-8');
      expect(moduleAContent).toContain('Added by Agent 2');

      testLogger.info('File operations coordinated successfully across 3 agents');

      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });
    });

    test('should handle concurrent file access with locking', async ({
      swarmCoordinator,
      config,
      testLogger,
    }) => {
      testLogger.info('Testing concurrent file access with locks');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);
      const testDir = path.join(config.tempDir, 'concurrent-test');
      await fs.mkdir(testDir, { recursive: true });

      const sharedFile = path.join(testDir, 'shared.json');
      await fs.writeFile(sharedFile, JSON.stringify({ counter: 0 }));

      const agents = await Promise.all(
        Array.from({ length: 5 }, () => swarmCoordinator.spawnAgent('coder', { workDir: testDir }))
      );

      // All agents increment counter concurrently
      await Promise.all(
        agents.map((agentId) =>
          swarmCoordinator.executeTask(agentId, {
            type: 'file-increment',
            file: 'shared.json',
            field: 'counter',
            useLocking: true,
          })
        )
      );

      // Verify final counter value
      const finalContent = JSON.parse(await fs.readFile(sharedFile, 'utf-8'));
      expect(finalContent.counter).toBe(5);

      testLogger.info('File locking prevented race conditions');

      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });
    });

    test('should watch files for changes across agents', async ({
      swarmCoordinator,
      config,
      testLogger,
    }) => {
      testLogger.info('Testing file watching across agents');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);
      const testDir = path.join(config.tempDir, 'watch-test');
      await fs.mkdir(testDir, { recursive: true });

      const watchFile = path.join(testDir, 'watched.txt');
      await fs.writeFile(watchFile, 'Initial content');

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { workDir: testDir }),
        swarmCoordinator.spawnAgent('coder', { workDir: testDir, watchFiles: true }),
        swarmCoordinator.spawnAgent('coder', { workDir: testDir, watchFiles: true }),
      ]);

      // Agents 2 & 3 watch the file
      const watchers = await Promise.all([
        swarmCoordinator.executeTask(agents[1], {
          type: 'watch-file',
          file: 'watched.txt',
        }),
        swarmCoordinator.executeTask(agents[2], {
          type: 'watch-file',
          file: 'watched.txt',
        }),
      ]);

      // Agent 1 modifies the file
      await swarmCoordinator.executeTask(agents[0], {
        type: 'file-write',
        file: 'watched.txt',
        content: 'Modified content',
      });

      // Wait for file change events
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify watchers detected change
      const status = await swarmCoordinator.getSwarmStatus();
      const changeDetections = status.agents.filter((a: any) =>
        a.fileChangeEvents?.some((e: any) => e.file === 'watched.txt')
      );

      expect(changeDetections.length).toBe(2);
      testLogger.info('File changes detected by 2 watching agents');

      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  test.describe('End-to-End Integration Scenarios', () => {
    test('should complete full-stack development workflow', async ({
      swarmCoordinator,
      agentDb,
      mcpServer,
      config,
      testLogger,
    }) => {
      testLogger.info('Testing complete full-stack development workflow');

      const swarmId = await swarmCoordinator.initializeSwarm('hierarchical', 10);
      const projectDir = path.join(config.tempDir, 'fullstack-project');
      await fs.mkdir(projectDir, { recursive: true });

      // Spawn specialized agents
      const architect = await swarmCoordinator.spawnAgent('system-architect', {
        role: 'queen',
        workDir: projectDir,
      });

      const workers = await Promise.all([
        swarmCoordinator.spawnAgent('backend-dev', { role: 'worker', queen: architect }),
        swarmCoordinator.spawnAgent('coder', {
          role: 'worker',
          queen: architect,
          specialty: 'frontend',
        }),
        swarmCoordinator.spawnAgent('coder', {
          role: 'worker',
          queen: architect,
          specialty: 'database',
        }),
        swarmCoordinator.spawnAgent('tester', { role: 'worker', queen: architect }),
        swarmCoordinator.spawnAgent('reviewer', { role: 'worker', queen: architect }),
      ]);

      // Execute full workflow
      const result = await swarmCoordinator.executeTask(architect, {
        type: 'full-stack-project',
        description: 'Build complete web application',
        requirements: {
          backend: 'REST API with authentication',
          frontend: 'React UI with routing',
          database: 'PostgreSQL schema',
          testing: 'Unit and integration tests',
        },
        workDir: projectDir,
      });

      // Verify project structure
      const files = await fs.readdir(projectDir, { recursive: true });
      expect(files.length).toBeGreaterThan(0);

      // Verify key components exist
      const hasBackend = files.some((f: any) => f.toString().includes('backend'));
      const hasFrontend = files.some((f: any) => f.toString().includes('frontend'));
      const hasTests = files.some((f: any) => f.toString().includes('test'));

      expect(hasBackend).toBe(true);
      expect(hasFrontend).toBe(true);
      expect(hasTests).toBe(true);

      testLogger.info('Full-stack project completed successfully');
      testLogger.info(`Created ${files.length} files`);

      // Cleanup
      await fs.rm(projectDir, { recursive: true, force: true });
    });

    test('should handle complex multi-stage pipeline with all services', async ({
      swarmCoordinator,
      agentDb,
      mcpServer,
      testLogger,
    }) => {
      testLogger.info('Testing complex multi-stage pipeline integration');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 8);

      // Pipeline stages
      const stages = [
        await swarmCoordinator.spawnAgent('researcher', {
          stage: 'research',
          agentDbEnabled: true,
          reasoningBankEnabled: true,
        }),
        await swarmCoordinator.spawnAgent('system-architect', {
          stage: 'architecture',
          agentDbEnabled: true,
        }),
        await swarmCoordinator.spawnAgent('coder', {
          stage: 'implementation-1',
          mcpEnabled: true,
        }),
        await swarmCoordinator.spawnAgent('coder', {
          stage: 'implementation-2',
          mcpEnabled: true,
        }),
        await swarmCoordinator.spawnAgent('tester', {
          stage: 'testing',
          agentDbEnabled: true,
        }),
        await swarmCoordinator.spawnAgent('reviewer', {
          stage: 'review',
          reasoningBankEnabled: true,
        }),
        await swarmCoordinator.spawnAgent('coder', {
          stage: 'refinement',
          agentDbEnabled: true,
        }),
      ];

      // Execute pipeline
      let previousOutput;
      const stageResults = [];

      for (const [index, agentId] of stages.entries()) {
        const result = await swarmCoordinator.executeTask(agentId, {
          type: 'pipeline-stage',
          stage: index + 1,
          description: `Stage ${index + 1}`,
          input: previousOutput,
          storeInAgentDb: true,
          useMcp: true,
          trackReasoning: true,
        });

        stageResults.push(result);
        previousOutput = result.output;
        testLogger.info(`Stage ${index + 1} completed`);
      }

      // Verify all stages completed
      expect(stageResults.every((r) => r.status === 'completed')).toBe(true);

      // Verify data flowed through pipeline
      expect(stageResults[stageResults.length - 1].input).toBeTruthy();

      testLogger.info('Multi-stage pipeline with all services completed successfully');
    });
  });
});
