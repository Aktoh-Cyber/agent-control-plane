/**
 * Example Test Suite
 * Demonstrates usage of the test utilities framework
 */

import {
  anAgent,
  // Helpers
  assert,
  asyncUtils,
  aTask,
  // Builders
  aUser,
  aVector,
  createLinearWorkflow,
  // Mocks
  createMockDatabase,
  createMockMCPServer,
  createMockVectorStore,
  createSmallSwarm,
  sampleAgents,
  // Fixtures
  sampleUsers,
  setupUtils,
  timeUtils,
} from '../index';

describe('Example Test Suite', () => {
  // Example 1: Basic builder usage
  describe('Data Builders', () => {
    test('should create user with builder', () => {
      const user = aUser()
        .asAdmin()
        .withEmail('admin@test.com')
        .withUsername('admin')
        .withCredits(10000)
        .build();

      assert.defined(user.id);
      assert.deepEqual(user.role, 'admin');
      assert.deepEqual(user.email, 'admin@test.com');
      assert.inRange(user.credits, 10000, 10000);
    });

    test('should create agent with builder', () => {
      const agent = anAgent()
        .asResearcher()
        .withName('Research Agent')
        .withModel('claude-sonnet-4-5-20250929')
        .withCapability('analysis')
        .asRunning()
        .build();

      assert.deepEqual(agent.role, 'researcher');
      assert.deepEqual(agent.status, 'running');
      assert.contains(agent.capabilities, 'analysis');
    });

    test('should create task with dependencies', () => {
      const task1 = aTask().withId('task-1').build();
      const task2 = aTask().withId('task-2').dependsOn('task-1').asCritical().build();

      assert.contains(task2.dependencies, 'task-1');
      assert.deepEqual(task2.priority, 'critical');
    });
  });

  // Example 2: Mock database usage
  describe('Mock Database', () => {
    let db: ReturnType<typeof createMockDatabase>;

    beforeEach(() => {
      db = createMockDatabase();
    });

    afterEach(() => {
      db.clearAll();
    });

    test('should insert and retrieve records', () => {
      const user = aUser().build();

      db.insert('users', user);
      const found = db.findById('users', user.id);

      assert.deepEqual(found, user);
    });

    test('should update records', () => {
      const user = aUser().build();
      db.insert('users', user);

      const updated = db.update('users', user.id, {
        email: 'new@example.com',
      });

      assert.defined(updated);
      assert.deepEqual(updated!.email, 'new@example.com');
    });

    test('should track query history', () => {
      const user = aUser().build();
      db.insert('users', user);
      db.findById('users', user.id);
      db.findAll('users');

      const queries = db.getQueryHistory();
      assert.length(queries, 3);
    });
  });

  // Example 3: Mock MCP server
  describe('Mock MCP Server', () => {
    let server: ReturnType<typeof createMockMCPServer>;

    beforeEach(async () => {
      server = createMockMCPServer();
      await server.connect();
      await server.initialize({});
    });

    afterEach(() => {
      server.reset();
    });

    test('should register and call tools', async () => {
      server.registerTool(
        {
          name: 'test_tool',
          description: 'A test tool',
          inputSchema: { type: 'object' },
        },
        async (params) => {
          return { success: true, params };
        }
      );

      const result = await server.callTool('test_tool', {
        arg: 'value',
      });

      assert.deepEqual(result.success, true);
      assert.hasProperty(result, 'params');
    });

    test('should track message history', async () => {
      await server.request('tools/list');

      const messages = server.getMessages();
      assert.notEmpty(messages);
    });
  });

  // Example 4: Async utilities
  describe('Async Utilities', () => {
    test('should wait for condition', async () => {
      let ready = false;
      setTimeout(() => {
        ready = true;
      }, 500);

      await asyncUtils.waitFor(() => ready, { timeout: 1000, interval: 100 });

      assert.deepEqual(ready, true);
    });

    test('should retry failed operations', async () => {
      let attempts = 0;
      const unstable = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient error');
        }
        return { success: true };
      };

      const result = await asyncUtils.retry(unstable, {
        maxRetries: 3,
        delay: 50,
        backoff: 'linear',
      });

      assert.deepEqual(result.success, true);
      assert.deepEqual(attempts, 3);
    });

    test('should timeout slow operations', async () => {
      const slow = async () => {
        await asyncUtils.wait(2000);
        return 'result';
      };

      await assert.throws(async () => {
        await asyncUtils.withTimeout(slow, 500, 'Too slow');
      }, /Too slow/);
    });

    test('should measure execution time', async () => {
      const { result, duration } = await asyncUtils.measureTime(async () => {
        await asyncUtils.wait(100);
        return 'done';
      });

      assert.deepEqual(result, 'done');
      assert.inRange(duration, 90, 150);
    });
  });

  // Example 5: Assertions
  describe('Custom Assertions', () => {
    test('should assert defined values', () => {
      const value = 'test';
      assert.defined(value);

      // Type narrowing works
      const length = value.length;
      assert.deepEqual(length, 4);
    });

    test('should assert array contents', () => {
      const array = [1, 2, 3, 4, 5];

      assert.length(array, 5);
      assert.contains(array, 3);
      assert.notContains(array, 10);
      assert.all(array, (item) => item > 0);
      assert.some(array, (item) => item > 3);
    });

    test('should assert errors', async () => {
      await assert.throws(async () => {
        throw new Error('Test error');
      }, /Test error/);
    });

    test('should assert ranges', () => {
      assert.inRange(50, 0, 100);
      assert.inRange(0, 0, 100);
      assert.inRange(100, 0, 100);
    });
  });

  // Example 6: Fixtures
  describe('Test Fixtures', () => {
    test('should use pre-built fixtures', () => {
      const admin = sampleUsers.admin();
      const researcher = sampleAgents.researcher();

      assert.deepEqual(admin.role, 'admin');
      assert.deepEqual(researcher.role, 'researcher');
    });

    test('should create swarm fixture', () => {
      const { agents, tasks, job, config } = createSmallSwarm();

      assert.length(agents, 2);
      assert.length(tasks, 2);
      assert.defined(job);
      assert.deepEqual(config.topology, 'pipeline');
    });

    test('should create workflow fixture', () => {
      const { tasks, agents } = createLinearWorkflow();

      assert.length(tasks, 4);
      assert.length(agents, 4);

      // Verify dependencies
      assert.contains(tasks[1].dependencies, tasks[0].id);
      assert.contains(tasks[2].dependencies, tasks[1].id);
    });
  });

  // Example 7: Vector store
  describe('Mock Vector Store', () => {
    let store: ReturnType<typeof createMockVectorStore>;

    beforeEach(() => {
      store = createMockVectorStore();
    });

    test('should insert and search vectors', async () => {
      const vector = aVector().fromText('Test document').withMetadata('type', 'test').build();

      await store.insert(vector.id, vector.embedding, vector.metadata);

      const results = await store.search(vector.embedding, {
        limit: 10,
        minScore: 0.5,
      });

      assert.notEmpty(results);
      assert.deepEqual(results[0].id, vector.id);
    });

    test('should filter by metadata', async () => {
      await store.insertBatch([
        {
          id: 'vec-1',
          embedding: aVector().build().embedding,
          metadata: { type: 'code', language: 'typescript' },
        },
        {
          id: 'vec-2',
          embedding: aVector().build().embedding,
          metadata: { type: 'doc', language: 'markdown' },
        },
      ]);

      const query = aVector().build().embedding;
      const results = await store.search(query, {
        filter: { type: 'code' },
        limit: 10,
      });

      assert.length(results, 1);
      assert.deepEqual(results[0].id, 'vec-1');
    });
  });

  // Example 8: Time utilities
  describe('Time Utilities', () => {
    test('should mock clock', () => {
      const clock = new timeUtils.MockClock();
      let fired = false;

      clock.setTimeout(() => {
        fired = true;
      }, 1000);

      assert.deepEqual(fired, false);

      clock.tick(1000);

      assert.deepEqual(fired, true);
    });

    test('should freeze time', () => {
      const frozenDate = new Date('2024-01-01T00:00:00Z');
      const unfreeze = timeUtils.freezeTime(frozenDate);

      const now = Date.now();
      assert.deepEqual(now, frozenDate.getTime());

      unfreeze();
    });
  });

  // Example 9: Complete integration test
  describe('Integration Test', () => {
    let db: ReturnType<typeof createMockDatabase>;
    let vectors: ReturnType<typeof createMockVectorStore>;
    let env: ReturnType<typeof setupUtils.createTestEnvironment>;

    beforeEach(async () => {
      db = createMockDatabase();
      vectors = createMockVectorStore();
      env = setupUtils.createTestEnvironment();

      env.setEnv('TEST_MODE', 'true');
    });

    afterEach(async () => {
      db.clearAll();
      vectors.clear();
      await env.cleanup();
    });

    test('should execute complete workflow', async () => {
      // Create workflow
      const { tasks, agents } = createLinearWorkflow();

      // Store in database
      agents.forEach((agent) => db.insert('agents', agent));
      tasks.forEach((task) => db.insert('tasks', task));

      // Store agent embeddings
      for (const agent of agents) {
        const vector = aVector().fromText(agent.name).withMetadata('agentId', agent.id).build();

        await vectors.insert(agent.id, vector.embedding, vector.metadata);
      }

      // Execute tasks sequentially
      const results: any[] = [];
      for (const task of tasks) {
        const agent = db.findById('agents', task.assignedTo!);
        assert.defined(agent);

        const result = await asyncUtils.withTimeout(async () => {
          await asyncUtils.wait(10); // Simulate work
          return { taskId: task.id, success: true };
        }, 1000);

        results.push(result);
      }

      // Verify results
      assert.length(results, tasks.length);
      assert.all(results, (r) => r.success === true);

      // Verify database state
      const stats = db.getStats();
      assert.deepEqual(stats.tableCount, 2);

      // Verify vector store
      const vectorStats = vectors.getStats();
      assert.deepEqual(vectorStats.totalVectors, agents.length);
    });
  });
});
