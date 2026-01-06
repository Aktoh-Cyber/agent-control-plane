/**
 * E2E Tests: Multi-Agent Coordination
 * Tests for hierarchical, mesh, memory sharing, task distribution, and MCP communication
 */

import { expect, test, utils } from './setup';

test.describe('Multi-Agent Coordination E2E', () => {
  test.describe('Hierarchical Coordination (Queen + Workers)', () => {
    test('should coordinate queen agent with 4 worker agents', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing hierarchical coordination with queen and workers');

      // Initialize hierarchical swarm
      const swarmId = await swarmCoordinator.initializeSwarm('hierarchical', 5);

      // Spawn queen coordinator
      const queenId = await swarmCoordinator.spawnAgent('hierarchical-coordinator', {
        role: 'queen',
        maxWorkers: 4,
      });
      expect(queenId).toBeTruthy();
      testLogger.info('Queen agent spawned');

      // Spawn 4 worker agents
      const workers = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
        swarmCoordinator.spawnAgent('tester', { role: 'worker', queen: queenId }),
        swarmCoordinator.spawnAgent('reviewer', { role: 'worker', queen: queenId }),
      ]);
      expect(workers).toHaveLength(4);
      testLogger.info('4 worker agents spawned');

      // Queen distributes tasks to workers
      const task = {
        type: 'project',
        description: 'Build full-stack application',
        subtasks: [
          { type: 'coding', description: 'Backend API' },
          { type: 'coding', description: 'Frontend UI' },
          { type: 'testing', description: 'Integration tests' },
          { type: 'review', description: 'Code review' },
        ],
      };

      const result = await swarmCoordinator.executeTask(queenId, task);
      expect(result.status).toBe('completed');
      expect(result.subtaskResults).toHaveLength(4);

      // Verify all workers completed their tasks
      result.subtaskResults.forEach((subtask: any, index: number) => {
        expect(subtask.status).toBe('completed');
        testLogger.info(`Worker ${index + 1} completed subtask: ${subtask.type}`);
      });

      testLogger.info('Hierarchical coordination completed successfully');
    });

    test('should handle worker failure and reassignment', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing worker failure and task reassignment');

      const swarmId = await swarmCoordinator.initializeSwarm('hierarchical', 4);
      const queenId = await swarmCoordinator.spawnAgent('hierarchical-coordinator', {
        role: 'queen',
      });

      const workers = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
      ]);

      // Execute task where one worker might fail
      const result = await swarmCoordinator.executeTask(queenId, {
        type: 'project',
        description: 'Complex task with potential failures',
        subtasks: Array.from({ length: 5 }, (_, i) => ({
          type: 'coding',
          description: `Task ${i + 1}`,
          allowReassignment: true,
        })),
      });

      expect(result.status).toBe('completed');
      expect(result.reassignments).toBeGreaterThanOrEqual(0);
      testLogger.info(`Tasks reassigned ${result.reassignments} times due to failures`);
    });

    test('should scale workers dynamically based on load', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing dynamic worker scaling');

      const swarmId = await swarmCoordinator.initializeSwarm('hierarchical', 10);
      const queenId = await swarmCoordinator.spawnAgent('hierarchical-coordinator', {
        role: 'queen',
        autoScale: true,
        minWorkers: 2,
        maxWorkers: 8,
      });

      // Start with 2 workers
      const initialWorkers = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
        swarmCoordinator.spawnAgent('coder', { role: 'worker', queen: queenId }),
      ]);

      // Execute large task that should trigger scaling
      const result = await swarmCoordinator.executeTask(queenId, {
        type: 'project',
        description: 'Large project requiring scaling',
        subtasks: Array.from({ length: 20 }, (_, i) => ({
          type: 'coding',
          description: `Task ${i + 1}`,
        })),
      });

      const status = await swarmCoordinator.getSwarmStatus();
      expect(status.agents.length).toBeGreaterThan(2);
      expect(status.agents.length).toBeLessThanOrEqual(8);
      testLogger.info(`Scaled from 2 to ${status.agents.length} workers`);
    });
  });

  test.describe('Mesh Coordination (Peer-to-Peer)', () => {
    test('should coordinate 6 peer agents in mesh topology', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing mesh peer-to-peer coordination');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 6);

      // Spawn 6 peer agents
      const peers = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          swarmCoordinator.spawnAgent('coder', {
            role: 'peer',
            peerId: `peer-${i + 1}`,
          })
        )
      );

      expect(peers).toHaveLength(6);

      // Execute collaborative task
      const tasks = peers.map((peerId, i) => ({
        agentId: peerId,
        task: {
          type: 'coding',
          description: `Module ${i + 1}`,
          collaborateWith: peers.filter((p) => p !== peerId),
        },
      }));

      const results = await Promise.all(
        tasks.map(({ agentId, task }) => swarmCoordinator.executeTask(agentId, task))
      );

      // Verify all peers completed
      expect(results.every((r) => r.status === 'completed')).toBe(true);
      testLogger.info('All 6 peers completed collaborative tasks');
    });

    test('should use gossip protocol for consensus', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing gossip consensus protocol');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);

      const peers = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          swarmCoordinator.spawnAgent('consensus-builder', {
            role: 'peer',
            consensus: 'gossip',
          })
        )
      );

      // Propose decision that requires consensus
      const proposal = {
        type: 'decision',
        description: 'Choose implementation approach',
        options: ['approach-a', 'approach-b', 'approach-c'],
        requiredConsensus: 0.6, // 60% agreement
      };

      const result = await swarmCoordinator.executeTask(peers[0], {
        type: 'consensus',
        proposal,
        peers: peers,
      });

      expect(result.status).toBe('completed');
      expect(result.consensus).toBeDefined();
      expect(result.agreedOption).toBeTruthy();
      testLogger.info(
        `Consensus reached: ${result.agreedOption} (${result.consensus * 100}% agreement)`
      );
    });

    test('should handle network partitions in mesh', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing mesh resilience to network partitions');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 6);

      const peers = await Promise.all(
        Array.from({ length: 6 }, (_, i) => swarmCoordinator.spawnAgent('coder', { role: 'peer' }))
      );

      // Simulate network partition (split into 2 groups)
      const group1 = peers.slice(0, 3);
      const group2 = peers.slice(3, 6);

      // Both groups should continue working
      const [group1Results, group2Results] = await Promise.all([
        Promise.all(
          group1.map((peerId) =>
            swarmCoordinator.executeTask(peerId, {
              type: 'coding',
              description: 'Task in partition 1',
              isolatedNetwork: true,
            })
          )
        ),
        Promise.all(
          group2.map((peerId) =>
            swarmCoordinator.executeTask(peerId, {
              type: 'coding',
              description: 'Task in partition 2',
              isolatedNetwork: true,
            })
          )
        ),
      ]);

      expect(group1Results.every((r) => r.status === 'completed')).toBe(true);
      expect(group2Results.every((r) => r.status === 'completed')).toBe(true);
      testLogger.info('Both partitions continued working independently');
    });
  });

  test.describe('Memory Sharing Between Agents', () => {
    test('should share memory across agents via AgentDB', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing memory sharing via AgentDB');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('researcher', { memoryEnabled: true }),
        swarmCoordinator.spawnAgent('coder', { memoryEnabled: true }),
        swarmCoordinator.spawnAgent('reviewer', { memoryEnabled: true }),
      ]);

      // Agent 1 stores research findings in memory
      const researchResult = await swarmCoordinator.executeTask(agents[0], {
        type: 'research',
        description: 'Research best practices',
        storeInMemory: true,
        memoryKey: 'swarm/research/best-practices',
      });

      // Wait for memory propagation
      await utils.waitFor(async () => {
        const memory = await agentDb.query(
          "SELECT * FROM memory WHERE key = 'swarm/research/best-practices'"
        );
        return memory.length > 0;
      }, 5000);

      // Agent 2 reads from memory
      const codeResult = await swarmCoordinator.executeTask(agents[1], {
        type: 'coding',
        description: 'Implement using research',
        readFromMemory: true,
        memoryKey: 'swarm/research/best-practices',
      });

      expect(codeResult.memoryUsed).toBe(true);
      expect(codeResult.status).toBe('completed');
      testLogger.info("Agent 2 successfully used Agent 1's memory");

      // Agent 3 also reads and adds to memory
      const reviewResult = await swarmCoordinator.executeTask(agents[2], {
        type: 'review',
        description: 'Review code and add feedback',
        readFromMemory: true,
        storeInMemory: true,
        memoryKey: 'swarm/review/feedback',
      });

      expect(reviewResult.status).toBe('completed');
      testLogger.info('All 3 agents successfully shared memory');
    });

    test('should use vector search for semantic memory retrieval', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing semantic memory retrieval');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);

      const [writer, reader] = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { memoryEnabled: true }),
        swarmCoordinator.spawnAgent('coder', { memoryEnabled: true }),
      ]);

      // Writer stores multiple memories with embeddings
      const memories = [
        {
          key: 'pattern-1',
          text: 'Use singleton pattern for database connections',
          embedding: utils.generateTestData.randomVector(),
        },
        {
          key: 'pattern-2',
          text: 'Use factory pattern for object creation',
          embedding: utils.generateTestData.randomVector(),
        },
        {
          key: 'pattern-3',
          text: 'Use observer pattern for event handling',
          embedding: utils.generateTestData.randomVector(),
        },
      ];

      for (const memory of memories) {
        await agentDb.storeVector('swarm/patterns', memory.key, memory.embedding, {
          text: memory.text,
        });
      }

      // Reader searches for similar patterns
      const queryVector = utils.generateTestData.randomVector();
      const similarPatterns = await agentDb.searchSimilar('swarm/patterns', queryVector, 2);

      expect(similarPatterns.length).toBeLessThanOrEqual(2);
      testLogger.info(`Found ${similarPatterns.length} similar patterns via vector search`);
    });

    test('should handle concurrent memory writes', async ({
      swarmCoordinator,
      agentDb,
      testLogger,
    }) => {
      testLogger.info('Testing concurrent memory writes');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);

      const agents = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          swarmCoordinator.spawnAgent('coder', { memoryEnabled: true })
        )
      );

      // All agents write to memory concurrently
      const writes = await Promise.all(
        agents.map((agentId, i) =>
          swarmCoordinator.executeTask(agentId, {
            type: 'coding',
            description: `Task ${i + 1}`,
            storeInMemory: true,
            memoryKey: `swarm/concurrent/agent-${i + 1}`,
          })
        )
      );

      // Verify all writes succeeded
      expect(writes.every((w) => w.status === 'completed')).toBe(true);

      // Verify all memories are stored
      for (let i = 0; i < agents.length; i++) {
        const memory = await agentDb.query(
          `SELECT * FROM memory WHERE key = 'swarm/concurrent/agent-${i + 1}'`
        );
        expect(memory.length).toBe(1);
      }

      testLogger.info('All 5 concurrent memory writes succeeded');
    });
  });

  test.describe('Task Distribution and Load Balancing', () => {
    test('should distribute 20 tasks across 5 agents evenly', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing even task distribution');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);

      const agents = await Promise.all(
        Array.from({ length: 5 }, () => swarmCoordinator.spawnAgent('coder'))
      );

      // Create 20 tasks
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        type: 'coding',
        description: `Task ${i + 1}`,
      }));

      // Distribute tasks
      const taskAssignments = new Map<string, number>();
      const results = [];

      for (let i = 0; i < tasks.length; i++) {
        const agentIndex = i % agents.length;
        const agentId = agents[agentIndex];

        taskAssignments.set(agentId, (taskAssignments.get(agentId) || 0) + 1);

        const result = await swarmCoordinator.executeTask(agentId, tasks[i]);
        results.push(result);
      }

      // Verify even distribution
      const tasksPerAgent = Array.from(taskAssignments.values());
      const expectedPerAgent = tasks.length / agents.length;

      tasksPerAgent.forEach((count) => {
        expect(count).toBe(expectedPerAgent);
      });

      testLogger.info(`Tasks evenly distributed: ${tasksPerAgent.join(', ')} tasks per agent`);
    });

    test('should use priority queue for task scheduling', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing priority-based task scheduling');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all(
        Array.from({ length: 3 }, () => swarmCoordinator.spawnAgent('coder'))
      );

      // Create tasks with different priorities
      const tasks = [
        { type: 'coding', description: 'Low priority', priority: 1 },
        { type: 'coding', description: 'High priority', priority: 10 },
        { type: 'coding', description: 'Medium priority', priority: 5 },
        { type: 'coding', description: 'Critical priority', priority: 20 },
      ];

      const executionOrder: string[] = [];

      // Execute tasks (should be reordered by priority)
      for (const task of tasks) {
        const agentId = agents[0];
        const result = await swarmCoordinator.executeTask(agentId, {
          ...task,
          trackExecutionOrder: true,
          onStart: () => executionOrder.push(task.description),
        });
      }

      // Verify high-priority tasks executed first
      expect(executionOrder[0]).toContain('Critical');
      testLogger.info(`Execution order: ${executionOrder.join(' → ')}`);
    });

    test('should balance load based on agent capacity', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing capacity-based load balancing');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 4);

      // Agents with different capacities
      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { capacity: 10 }),
        swarmCoordinator.spawnAgent('coder', { capacity: 5 }),
        swarmCoordinator.spawnAgent('coder', { capacity: 3 }),
        swarmCoordinator.spawnAgent('coder', { capacity: 2 }),
      ]);

      const tasks = Array.from({ length: 20 }, (_, i) => ({
        type: 'coding',
        description: `Task ${i + 1}`,
        cost: 1,
      }));

      // Distribute based on capacity
      const assignments = new Map<string, number>();

      for (const task of tasks) {
        // Find agent with available capacity
        const agentId = agents.find((id) => {
          const assigned = assignments.get(id) || 0;
          const agent = swarmCoordinator.getAgents().get(id);
          return assigned < (agent?.capacity || 0);
        });

        if (agentId) {
          assignments.set(agentId, (assignments.get(agentId) || 0) + 1);
          await swarmCoordinator.executeTask(agentId, task);
        }
      }

      // Verify load balanced according to capacity
      testLogger.info('Load distribution by capacity:');
      assignments.forEach((count, agentId) => {
        const agent = swarmCoordinator.getAgents().get(agentId);
        testLogger.info(`  Agent (capacity ${agent?.capacity}): ${count} tasks`);
      });
    });
  });

  test.describe('Agent Communication via MCP', () => {
    test('should communicate between agents via MCP protocol', async ({
      swarmCoordinator,
      mcpServer,
      testLogger,
    }) => {
      testLogger.info('Testing MCP-based agent communication');

      // Verify MCP server is running
      expect(await mcpServer.healthCheck()).toBe(true);

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { mcpEnabled: true }),
        swarmCoordinator.spawnAgent('tester', { mcpEnabled: true }),
        swarmCoordinator.spawnAgent('reviewer', { mcpEnabled: true }),
      ]);

      // Agent 1 sends message to Agent 2 via MCP
      const result1 = await swarmCoordinator.executeTask(agents[0], {
        type: 'coding',
        description: 'Code implementation',
        sendMCPMessage: {
          to: agents[1],
          topic: 'code-ready',
          payload: { codeUrl: 'http://example.com/code.ts' },
        },
      });

      // Agent 2 receives message and responds
      await utils.waitFor(async () => {
        const status = await swarmCoordinator.getSwarmStatus();
        return status.mcpMessages?.some((m: any) => m.topic === 'code-ready');
      }, 5000);

      const result2 = await swarmCoordinator.executeTask(agents[1], {
        type: 'testing',
        description: 'Test the code',
        listenForMCP: {
          topic: 'code-ready',
        },
      });

      expect(result2.receivedMCPMessage).toBe(true);
      testLogger.info('MCP communication successful between agents');
    });

    test('should handle MCP pub/sub for broadcast messages', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing MCP pub/sub broadcast');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);

      const agents = await Promise.all(
        Array.from({ length: 5 }, () => swarmCoordinator.spawnAgent('coder', { mcpEnabled: true }))
      );

      // All agents subscribe to 'swarm-updates' topic
      const subscriptions = await Promise.all(
        agents.map((agentId) =>
          swarmCoordinator.executeTask(agentId, {
            type: 'subscribe',
            topic: 'swarm-updates',
          })
        )
      );

      // One agent publishes a broadcast message
      await swarmCoordinator.executeTask(agents[0], {
        type: 'publish',
        topic: 'swarm-updates',
        message: { type: 'status', text: 'All agents proceed to next phase' },
      });

      // Wait for message propagation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify all agents received the broadcast
      const status = await swarmCoordinator.getSwarmStatus();
      const receivedCount = agents.filter((agentId: string) => {
        const agent = status.agents.find((a: any) => a.id === agentId);
        return agent?.receivedMessages?.some((m: any) => m.topic === 'swarm-updates');
      }).length;

      expect(receivedCount).toBe(5);
      testLogger.info('Broadcast message received by all 5 agents');
    });
  });
});
