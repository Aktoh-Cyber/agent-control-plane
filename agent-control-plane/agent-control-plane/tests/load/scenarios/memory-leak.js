/**
 * Memory Leak Detection Tests
 * Long-running tests to detect memory leaks and resource cleanup issues
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Gauge, Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  generateAgentConfig,
  generateMemoryData,
  generateTaskData,
  getHeaders,
  soakOptions,
} from '../k6-config.js';

// Custom metrics for memory monitoring
const memoryUsage = new Gauge('memory_usage_mb');
const heapUsed = new Gauge('heap_used_mb');
const heapTotal = new Gauge('heap_total_mb');
const memoryLeakRate = new Rate('memory_leak_detected');
const resourceCleanupSuccess = new Rate('resource_cleanup_success');
const longRunningTaskDuration = new Trend('long_running_task_duration');
const memoryGrowthRate = new Trend('memory_growth_rate');

export const options = soakOptions;

// Track memory baseline
let memoryBaseline = null;
let iterationCount = 0;

// Scenario 1: Continuous memory operations
export function continuousMemoryOperations() {
  group('Continuous Memory Operations', () => {
    iterationCount++;

    // Get current memory metrics
    const metricsResponse = http.get(`${BASE_URL}/api/metrics/memory`, {
      headers: getHeaders(),
    });

    if (metricsResponse.status === 200) {
      const metrics = JSON.parse(metricsResponse.body);

      // Record current memory usage
      memoryUsage.add(metrics.rss / 1024 / 1024);
      heapUsed.add(metrics.heapUsed / 1024 / 1024);
      heapTotal.add(metrics.heapTotal / 1024 / 1024);

      // Set baseline on first iteration
      if (!memoryBaseline) {
        memoryBaseline = metrics.heapUsed;
      }

      // Calculate memory growth
      const growthRate = ((metrics.heapUsed - memoryBaseline) / memoryBaseline) * 100;
      memoryGrowthRate.add(growthRate);

      // Check for memory leak (>50% growth after 100 iterations)
      if (iterationCount > 100 && growthRate > 50) {
        memoryLeakRate.add(1);
        console.warn(`Potential memory leak detected: ${growthRate.toFixed(2)}% growth`);
      } else {
        memoryLeakRate.add(0);
      }

      check(metrics, {
        'memory growth < 50%': () => growthRate < 50,
        'heap usage stable': () => metrics.heapUsed < memoryBaseline * 1.5,
      });
    }

    // Perform memory-intensive operations
    const memoryData = generateMemoryData();

    // Store data
    const storeResponse = http.post(`${BASE_URL}/api/memory`, JSON.stringify(memoryData), {
      headers: getHeaders(),
    });

    check(storeResponse, {
      'memory store successful': (r) => r.status === 201,
    });

    sleep(0.5);

    // Retrieve data
    const retrieveResponse = http.get(`${BASE_URL}/api/memory/${memoryData.key}`, {
      headers: getHeaders(),
    });

    check(retrieveResponse, {
      'memory retrieve successful': (r) => r.status === 200,
    });

    sleep(0.5);

    // Delete data (test cleanup)
    const deleteResponse = http.del(`${BASE_URL}/api/memory/${memoryData.key}`, null, {
      headers: getHeaders(),
    });

    resourceCleanupSuccess.add(deleteResponse.status === 204 ? 1 : 0);

    check(deleteResponse, {
      'memory cleanup successful': (r) => r.status === 204,
    });
  });

  sleep(1);
}

// Scenario 2: Agent lifecycle memory test
export function agentLifecycleMemory() {
  group('Agent Lifecycle Memory Test', () => {
    // Create agents repeatedly
    const agents = [];

    for (let i = 0; i < 5; i++) {
      const agentConfig = generateAgentConfig();
      const createResponse = http.post(`${BASE_URL}/api/agents`, JSON.stringify(agentConfig), {
        headers: getHeaders(),
      });

      if (createResponse.status === 201) {
        agents.push(JSON.parse(createResponse.body).id);
      }
    }

    sleep(1);

    // Execute tasks on agents
    agents.forEach((agentId) => {
      const taskData = generateTaskData();
      http.post(`${BASE_URL}/api/agents/${agentId}/tasks`, JSON.stringify(taskData), {
        headers: getHeaders(),
      });
    });

    sleep(2);

    // Delete all agents (test resource cleanup)
    let cleanupCount = 0;
    agents.forEach((agentId) => {
      const deleteResponse = http.del(`${BASE_URL}/api/agents/${agentId}`, null, {
        headers: getHeaders(),
      });

      if (deleteResponse.status === 204) {
        cleanupCount++;
      }
    });

    const cleanupSuccess = cleanupCount === agents.length;
    resourceCleanupSuccess.add(cleanupSuccess ? 1 : 0);

    check(
      { cleanupCount, total: agents.length },
      {
        'all agents cleaned up': (data) => data.cleanupCount === data.total,
      }
    );
  });

  sleep(2);
}

// Scenario 3: Vector database memory stress
export function vectorDatabaseMemory() {
  group('Vector Database Memory Stress', () => {
    // Insert many vectors
    const vectorCount = 100;
    const vectors = [];

    for (let i = 0; i < vectorCount; i++) {
      const vectorData = {
        id: `vector-${Date.now()}-${i}`,
        vector: new Array(384).fill(0).map(() => Math.random()),
        metadata: {
          source: 'load-test',
          iteration: iterationCount,
        },
      };

      const insertResponse = http.post(`${BASE_URL}/api/vectors`, JSON.stringify(vectorData), {
        headers: getHeaders(),
      });

      if (insertResponse.status === 201) {
        vectors.push(vectorData.id);
      }

      // Batch inserts
      if (i % 20 === 0) {
        sleep(0.1);
      }
    }

    sleep(1);

    // Perform searches
    for (let i = 0; i < 10; i++) {
      const searchVector = new Array(384).fill(0).map(() => Math.random());

      http.post(
        `${BASE_URL}/api/vectors/search`,
        JSON.stringify({
          vector: searchVector,
          topK: 10,
        }),
        { headers: getHeaders() }
      );

      sleep(0.2);
    }

    sleep(1);

    // Cleanup vectors
    let cleanupCount = 0;
    vectors.forEach((vectorId) => {
      const deleteResponse = http.del(`${BASE_URL}/api/vectors/${vectorId}`, null, {
        headers: getHeaders(),
      });

      if (deleteResponse.status === 204) {
        cleanupCount++;
      }
    });

    resourceCleanupSuccess.add(cleanupCount === vectors.length ? 1 : 0);
  });

  sleep(2);
}

// Scenario 4: Long-running tasks
export function longRunningTasks() {
  group('Long-Running Tasks', () => {
    const agentConfig = generateAgentConfig();
    const createResponse = http.post(`${BASE_URL}/api/agents`, JSON.stringify(agentConfig), {
      headers: getHeaders(),
    });

    if (createResponse.status === 201) {
      const agentId = JSON.parse(createResponse.body).id;

      // Start long-running task
      const startTime = Date.now();

      const taskData = {
        type: 'coding',
        description: 'Long-running complex task',
        timeout: 30000,
        complexity: 'high',
      };

      const taskResponse = http.post(
        `${BASE_URL}/api/agents/${agentId}/tasks`,
        JSON.stringify(taskData),
        { headers: getHeaders() }
      );

      if (taskResponse.status === 201) {
        const taskId = JSON.parse(taskResponse.body).id;

        // Poll for completion
        let completed = false;
        let pollCount = 0;
        const maxPolls = 30;

        while (!completed && pollCount < maxPolls) {
          sleep(1);

          const statusResponse = http.get(`${BASE_URL}/api/tasks/${taskId}`, {
            headers: getHeaders(),
          });

          if (statusResponse.status === 200) {
            const status = JSON.parse(statusResponse.body).status;
            completed = status === 'completed' || status === 'failed';
          }

          pollCount++;
        }

        const duration = Date.now() - startTime;
        longRunningTaskDuration.add(duration);

        check(
          { completed, duration },
          {
            'task completed': (data) => data.completed,
            'task duration reasonable': (data) => data.duration < 35000,
          }
        );
      }

      // Cleanup
      http.del(`${BASE_URL}/api/agents/${agentId}`, null, { headers: getHeaders() });
    }
  });

  sleep(3);
}

// Main test function
export default function () {
  // Run all memory tests in rotation
  const iteration = iterationCount % 4;

  switch (iteration) {
    case 0:
      continuousMemoryOperations();
      break;
    case 1:
      agentLifecycleMemory();
      break;
    case 2:
      vectorDatabaseMemory();
      break;
    case 3:
      longRunningTasks();
      break;
  }

  // Check memory metrics every 10 iterations
  if (iterationCount % 10 === 0) {
    const metricsResponse = http.get(`${BASE_URL}/api/metrics/memory`, {
      headers: getHeaders(),
    });

    if (metricsResponse.status === 200) {
      const metrics = JSON.parse(metricsResponse.body);
      console.log(
        `Iteration ${iterationCount}: Memory Usage: ${(metrics.heapUsed / 1024 / 1024).toFixed(2)} MB`
      );
    }
  }
}

export function setup() {
  console.log('Starting memory leak detection test (1 hour soak test)...');
  console.log('This test will monitor memory growth and resource cleanup');

  // Get initial memory baseline
  const metricsResponse = http.get(`${BASE_URL}/api/metrics/memory`, {
    headers: getHeaders(),
  });

  if (metricsResponse.status === 200) {
    const metrics = JSON.parse(metricsResponse.body);
    console.log(`Initial memory: ${(metrics.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    return {
      startTime: Date.now(),
      initialMemory: metrics.heapUsed,
    };
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Memory leak test completed after ${duration.toFixed(2)} minutes`);

  // Get final memory state
  const metricsResponse = http.get(`${BASE_URL}/api/metrics/memory`, {
    headers: getHeaders(),
  });

  if (metricsResponse.status === 200 && data.initialMemory) {
    const metrics = JSON.parse(metricsResponse.body);
    const growth = ((metrics.heapUsed - data.initialMemory) / data.initialMemory) * 100;

    console.log(`Final memory: ${(metrics.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory growth: ${growth.toFixed(2)}%`);

    if (growth > 50) {
      console.warn('⚠️  WARNING: Potential memory leak detected!');
    } else {
      console.log('✓ Memory usage stable - no leaks detected');
    }
  }
}
