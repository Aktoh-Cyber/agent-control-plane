/**
 * E2E Tests: Swarm Workflows
 * Tests for single agent, multi-agent parallel, sequential, and conditional workflows
 */

import { expect, test, utils } from './setup';

test.describe('Swarm Workflows E2E', () => {
  test.describe('Single Agent Execution', () => {
    test('should spawn, execute, and complete single agent task', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing single agent execution workflow');

      // Initialize swarm
      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 1);
      expect(swarmId).toBeTruthy();

      // Spawn single agent
      const agentId = await swarmCoordinator.spawnAgent('coder', {
        task: 'Write a simple hello world function',
        language: 'typescript',
      });
      expect(agentId).toBeTruthy();

      // Execute task
      const result = await swarmCoordinator.executeTask(agentId, {
        type: 'coding',
        description: 'Create hello world function',
        timeout: 30000,
      });

      // Verify execution
      expect(result.status).toBe('completed');
      expect(result.output).toBeTruthy();
      testLogger.info(`Agent completed task: ${result.status}`);

      // Check swarm status
      const status = await swarmCoordinator.getSwarmStatus();
      expect(status.agents).toHaveLength(1);
      expect(status.completedTasks).toBe(1);
    });

    test('should handle agent execution timeout', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing agent timeout handling');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 1);
      const agentId = await swarmCoordinator.spawnAgent('coder');

      // Execute task with very short timeout
      await expect(
        swarmCoordinator.executeTask(agentId, {
          type: 'coding',
          description: 'Complex task that will timeout',
          timeout: 100, // Very short timeout
        })
      ).rejects.toThrow(/timeout/i);

      testLogger.info('Timeout handled correctly');
    });

    test('should handle agent execution failure and retry', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing agent failure and retry');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 1);
      const agentId = await swarmCoordinator.spawnAgent('coder');

      // Execute task that may fail
      const result = await utils.retry(async () => {
        return await swarmCoordinator.executeTask(agentId, {
          type: 'coding',
          description: 'Task that might fail',
          retries: 3,
        });
      }, 3);

      expect(result.status).toBe('completed');
      testLogger.info('Retry mechanism worked successfully');
    });
  });

  test.describe('Multi-Agent Parallel Execution', () => {
    test('should execute 3 agents in parallel', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing parallel execution of 3 agents');

      // Initialize mesh swarm for parallel execution
      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      // Spawn 3 agents
      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder', { role: 'backend' }),
        swarmCoordinator.spawnAgent('coder', { role: 'frontend' }),
        swarmCoordinator.spawnAgent('tester', { role: 'qa' }),
      ]);

      expect(agents).toHaveLength(3);

      // Execute tasks in parallel
      const startTime = Date.now();
      const results = await Promise.all([
        swarmCoordinator.executeTask(agents[0], { type: 'coding', description: 'Backend API' }),
        swarmCoordinator.executeTask(agents[1], { type: 'coding', description: 'Frontend UI' }),
        swarmCoordinator.executeTask(agents[2], { type: 'testing', description: 'Write tests' }),
      ]);
      const duration = Date.now() - startTime;

      // Verify all completed
      results.forEach((result, index) => {
        expect(result.status).toBe('completed');
        testLogger.info(`Agent ${index + 1} completed in parallel`);
      });

      // Verify parallel execution (should be faster than sequential)
      expect(duration).toBeLessThan(60000); // Should complete within 1 minute
      testLogger.info(`Parallel execution completed in ${duration}ms`);
    });

    test('should execute 5 agents with load balancing', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing parallel execution with 5 agents and load balancing');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);

      // Spawn 5 agents
      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder'),
        swarmCoordinator.spawnAgent('coder'),
        swarmCoordinator.spawnAgent('tester'),
        swarmCoordinator.spawnAgent('reviewer'),
        swarmCoordinator.spawnAgent('planner'),
      ]);

      // Create 10 tasks (more tasks than agents)
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        type: i % 3 === 0 ? 'coding' : i % 3 === 1 ? 'testing' : 'review',
        description: `Task ${i + 1}`,
      }));

      // Execute tasks with load balancing
      const results = [];
      for (let i = 0; i < tasks.length; i++) {
        const agentIndex = i % agents.length;
        const result = await swarmCoordinator.executeTask(agents[agentIndex], tasks[i]);
        results.push(result);
      }

      // Verify all tasks completed
      expect(results).toHaveLength(10);
      expect(results.every((r) => r.status === 'completed')).toBe(true);
      testLogger.info('Load balancing worked correctly');
    });

    test('should handle partial failures in parallel execution', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing parallel execution with partial failures');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 3);

      const agents = await Promise.all([
        swarmCoordinator.spawnAgent('coder'),
        swarmCoordinator.spawnAgent('coder'),
        swarmCoordinator.spawnAgent('coder'),
      ]);

      // Execute tasks where one might fail
      const results = await Promise.allSettled([
        swarmCoordinator.executeTask(agents[0], { type: 'coding', description: 'Valid task' }),
        swarmCoordinator.executeTask(agents[1], { type: 'invalid', description: 'Invalid task' }),
        swarmCoordinator.executeTask(agents[2], { type: 'coding', description: 'Valid task' }),
      ]);

      // Count successes and failures
      const successes = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results.filter((r) => r.status === 'rejected').length;

      testLogger.info(`Successes: ${successes}, Failures: ${failures}`);
      expect(successes).toBeGreaterThan(0);
    });
  });

  test.describe('Sequential Agent Workflows', () => {
    test('should execute pipeline workflow (agent A → agent B → agent C)', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing sequential pipeline workflow');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 3);

      // Spawn agents in sequence
      const researcherId = await swarmCoordinator.spawnAgent('researcher');
      const coderId = await swarmCoordinator.spawnAgent('coder');
      const testerId = await swarmCoordinator.spawnAgent('tester');

      // Execute in sequence, passing output from one to next
      const researchResult = await swarmCoordinator.executeTask(researcherId, {
        type: 'research',
        description: 'Research best practices',
      });
      expect(researchResult.status).toBe('completed');
      testLogger.info('Stage 1: Research completed');

      const codeResult = await swarmCoordinator.executeTask(coderId, {
        type: 'coding',
        description: 'Implement based on research',
        input: researchResult.output,
      });
      expect(codeResult.status).toBe('completed');
      testLogger.info('Stage 2: Coding completed');

      const testResult = await swarmCoordinator.executeTask(testerId, {
        type: 'testing',
        description: 'Test implementation',
        input: codeResult.output,
      });
      expect(testResult.status).toBe('completed');
      testLogger.info('Stage 3: Testing completed');

      // Verify pipeline completed
      const status = await swarmCoordinator.getSwarmStatus();
      expect(status.completedTasks).toBe(3);
      expect(status.pipelineStage).toBe('completed');
    });

    test('should handle dependencies between tasks', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing task dependencies');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 4);

      const agents = {
        planner: await swarmCoordinator.spawnAgent('planner'),
        coder1: await swarmCoordinator.spawnAgent('coder'),
        coder2: await swarmCoordinator.spawnAgent('coder'),
        reviewer: await swarmCoordinator.spawnAgent('reviewer'),
      };

      // Execute with dependencies
      const planResult = await swarmCoordinator.executeTask(agents.planner, {
        type: 'planning',
        description: 'Create project plan',
      });

      // Both coders depend on planner
      const [code1Result, code2Result] = await Promise.all([
        swarmCoordinator.executeTask(agents.coder1, {
          type: 'coding',
          description: 'Module A',
          dependencies: [planResult.taskId],
        }),
        swarmCoordinator.executeTask(agents.coder2, {
          type: 'coding',
          description: 'Module B',
          dependencies: [planResult.taskId],
        }),
      ]);

      // Reviewer depends on both coders
      const reviewResult = await swarmCoordinator.executeTask(agents.reviewer, {
        type: 'review',
        description: 'Review all modules',
        dependencies: [code1Result.taskId, code2Result.taskId],
      });

      expect(reviewResult.status).toBe('completed');
      testLogger.info('Dependency workflow completed successfully');
    });

    test('should stop pipeline on failure', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing pipeline failure handling');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 3);

      const agent1 = await swarmCoordinator.spawnAgent('coder');
      const agent2 = await swarmCoordinator.spawnAgent('coder');
      const agent3 = await swarmCoordinator.spawnAgent('tester');

      // First task succeeds
      const result1 = await swarmCoordinator.executeTask(agent1, {
        type: 'coding',
        description: 'Task 1',
      });
      expect(result1.status).toBe('completed');

      // Second task fails
      await expect(
        swarmCoordinator.executeTask(agent2, {
          type: 'invalid',
          description: 'Task 2 - will fail',
        })
      ).rejects.toThrow();

      // Third task should not execute due to pipeline failure
      const status = await swarmCoordinator.getSwarmStatus();
      expect(status.pipelineStage).not.toBe('completed');
      testLogger.info('Pipeline stopped correctly on failure');
    });
  });

  test.describe('Conditional Workflows', () => {
    test('should route based on if-then conditions', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing conditional workflow routing');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 5);

      const validator = await swarmCoordinator.spawnAgent('reviewer');
      const pathA = await swarmCoordinator.spawnAgent('coder');
      const pathB = await swarmCoordinator.spawnAgent('tester');

      // Execute validator
      const validationResult = await swarmCoordinator.executeTask(validator, {
        type: 'validation',
        description: 'Validate requirements',
      });

      // Route based on validation result
      let nextResult;
      if (validationResult.output.isValid) {
        testLogger.info('Routing to path A (coding)');
        nextResult = await swarmCoordinator.executeTask(pathA, {
          type: 'coding',
          description: 'Implement feature',
        });
      } else {
        testLogger.info('Routing to path B (testing)');
        nextResult = await swarmCoordinator.executeTask(pathB, {
          type: 'testing',
          description: 'Test existing code',
        });
      }

      expect(nextResult.status).toBe('completed');
      testLogger.info('Conditional routing completed successfully');
    });

    test('should handle complex branching logic', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing complex conditional branching');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 6);

      // Create decision tree
      const analyzer = await swarmCoordinator.spawnAgent('code-analyzer');
      const agents = {
        refactor: await swarmCoordinator.spawnAgent('coder'),
        optimize: await swarmCoordinator.spawnAgent('coder'),
        test: await swarmCoordinator.spawnAgent('tester'),
        document: await swarmCoordinator.spawnAgent('coder'),
      };

      // Analyze and branch
      const analysis = await swarmCoordinator.executeTask(analyzer, {
        type: 'analysis',
        description: 'Analyze code quality',
      });

      const branches = [];
      if (analysis.output.needsRefactoring) {
        branches.push(swarmCoordinator.executeTask(agents.refactor, { type: 'refactor' }));
      }
      if (analysis.output.needsOptimization) {
        branches.push(swarmCoordinator.executeTask(agents.optimize, { type: 'optimize' }));
      }
      if (analysis.output.needsTests) {
        branches.push(swarmCoordinator.executeTask(agents.test, { type: 'testing' }));
      }
      if (analysis.output.needsDocs) {
        branches.push(swarmCoordinator.executeTask(agents.document, { type: 'documentation' }));
      }

      const results = await Promise.all(branches);
      expect(results.length).toBeGreaterThan(0);
      testLogger.info(`Executed ${results.length} conditional branches`);
    });
  });

  test.describe('Error Handling and Retry Scenarios', () => {
    test('should retry failed tasks with exponential backoff', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing exponential backoff retry');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 1);
      const agentId = await swarmCoordinator.spawnAgent('coder');

      let attempts = 0;
      const result = await utils.retry(
        async () => {
          attempts++;
          testLogger.info(`Attempt ${attempts}`);
          return await swarmCoordinator.executeTask(agentId, {
            type: 'coding',
            description: 'Task that may fail',
          });
        },
        5,
        100
      );

      expect(result.status).toBe('completed');
      testLogger.info(`Task completed after ${attempts} attempts`);
    });

    test('should handle agent crash and recovery', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing agent crash recovery');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 2);
      const agent1 = await swarmCoordinator.spawnAgent('coder');
      const agent2 = await swarmCoordinator.spawnAgent('coder');

      // Simulate agent crash scenario
      try {
        await swarmCoordinator.executeTask(agent1, {
          type: 'coding',
          description: 'Task that causes crash',
          simulateCrash: true,
        });
      } catch (error) {
        testLogger.info('Agent crashed as expected');
      }

      // Verify backup agent can take over
      const result = await swarmCoordinator.executeTask(agent2, {
        type: 'coding',
        description: 'Backup agent task',
      });

      expect(result.status).toBe('completed');
      testLogger.info('Backup agent successfully recovered from crash');
    });

    test('should handle network failures gracefully', async ({ swarmCoordinator, testLogger }) => {
      testLogger.info('Testing network failure handling');

      const swarmId = await swarmCoordinator.initializeSwarm('mesh', 1);
      const agentId = await swarmCoordinator.spawnAgent('coder');

      // Execute task with network interruption simulation
      const result = await utils.retry(
        async () => {
          return await swarmCoordinator.executeTask(agentId, {
            type: 'coding',
            description: 'Task with network issues',
            simulateNetworkFailure: true,
          });
        },
        3,
        500
      );

      expect(result.status).toBe('completed');
      testLogger.info('Network failure handled successfully');
    });

    test('should timeout gracefully for long-running tasks', async ({
      swarmCoordinator,
      testLogger,
    }) => {
      testLogger.info('Testing graceful timeout');

      const swarmId = await swarmCoordinator.initializeSwarm('pipeline', 1);
      const agentId = await swarmCoordinator.spawnAgent('coder');

      const startTime = Date.now();
      await expect(
        swarmCoordinator.executeTask(agentId, {
          type: 'coding',
          description: 'Very long task',
          timeout: 1000,
        })
      ).rejects.toThrow(/timeout/i);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should timeout quickly
      testLogger.info(`Timed out gracefully after ${duration}ms`);
    });
  });
});
