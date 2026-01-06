/**
 * Performance Baseline Test Suite
 * Establishes performance baselines and SLAs for various operations
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  generateAgentConfig,
  generateMemoryData,
  generateSwarmConfig,
  generateTaskData,
  getHeaders,
} from '../k6-config.js';

// Baseline metrics
const healthCheckTime = new Trend('baseline_health_check_time');
const agentSpawnTime = new Trend('baseline_agent_spawn_time');
const taskCreationTime = new Trend('baseline_task_creation_time');
const swarmInitTime = new Trend('baseline_swarm_init_time');
const memoryStoreTime = new Trend('baseline_memory_store_time');
const memoryRetrieveTime = new Trend('baseline_memory_retrieve_time');
const vectorSearchTime = new Trend('baseline_vector_search_time');
const vectorInsertTime = new Trend('baseline_vector_insert_time');
const apiListTime = new Trend('baseline_api_list_time');
const baselineSuccessRate = new Rate('baseline_success_rate');
const baselineErrors = new Counter('baseline_errors');

// Performance targets (p95)
const TARGETS = {
  healthCheck: 100, // <100ms
  agentSpawn: 3000, // <3s
  taskCreation: 2000, // <2s
  swarmInit: 1000, // <1s
  memoryStore: 100, // <100ms
  memoryRetrieve: 50, // <50ms
  vectorSearch: 500, // <500ms
  vectorInsert: 200, // <200ms
  apiList: 300, // <300ms
};

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Warm-up
    { duration: '5m', target: 10 }, // Baseline collection
    { duration: '1m', target: 0 }, // Cool-down
  ],
  thresholds: {
    baseline_health_check_time: [`p(95)<${TARGETS.healthCheck}`],
    baseline_agent_spawn_time: [`p(95)<${TARGETS.agentSpawn}`],
    baseline_task_creation_time: [`p(95)<${TARGETS.taskCreation}`],
    baseline_swarm_init_time: [`p(95)<${TARGETS.swarmInit}`],
    baseline_memory_store_time: [`p(95)<${TARGETS.memoryStore}`],
    baseline_memory_retrieve_time: [`p(95)<${TARGETS.memoryRetrieve}`],
    baseline_vector_search_time: [`p(95)<${TARGETS.vectorSearch}`],
    baseline_vector_insert_time: [`p(95)<${TARGETS.vectorInsert}`],
    baseline_api_list_time: [`p(95)<${TARGETS.apiList}`],
    baseline_success_rate: ['rate>0.99'],
  },
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  out: ['json=tests/load/reports/baseline-results.json'],
};

// Baseline 1: Health Check
export function baselineHealthCheck() {
  group('Baseline: Health Check', () => {
    const response = http.get(`${BASE_URL}/health`, {
      headers: getHeaders(),
    });

    healthCheckTime.add(response.timings.duration);

    const success = check(response, {
      'health check status 200': (r) => r.status === 200,
      'health check time < target': (r) => r.timings.duration < TARGETS.healthCheck,
    });

    baselineSuccessRate.add(success ? 1 : 0);
    if (!success) baselineErrors.add(1);
  });
}

// Baseline 2: Agent Operations
export function baselineAgentOperations() {
  group('Baseline: Agent Operations', () => {
    // Spawn agent
    const agentConfig = generateAgentConfig();
    const spawnResponse = http.post(`${BASE_URL}/api/agents`, JSON.stringify(agentConfig), {
      headers: getHeaders(),
    });

    agentSpawnTime.add(spawnResponse.timings.duration);

    const spawnSuccess = check(spawnResponse, {
      'agent spawn status 201': (r) => r.status === 201,
      'agent spawn time < target': (r) => r.timings.duration < TARGETS.agentSpawn,
    });

    baselineSuccessRate.add(spawnSuccess ? 1 : 0);
    if (!spawnSuccess) baselineErrors.add(1);

    if (spawnResponse.status === 201) {
      const agentId = JSON.parse(spawnResponse.body).id;

      sleep(0.5);

      // List agents
      const listResponse = http.get(`${BASE_URL}/api/agents`, {
        headers: getHeaders(),
      });

      apiListTime.add(listResponse.timings.duration);

      check(listResponse, {
        'list agents status 200': (r) => r.status === 200,
        'list agents time < target': (r) => r.timings.duration < TARGETS.apiList,
      });

      sleep(0.5);

      // Delete agent
      http.del(`${BASE_URL}/api/agents/${agentId}`, null, {
        headers: getHeaders(),
      });
    }
  });
}

// Baseline 3: Task Operations
export function baselineTaskOperations() {
  group('Baseline: Task Operations', () => {
    const taskData = generateTaskData();

    const taskResponse = http.post(`${BASE_URL}/api/tasks`, JSON.stringify(taskData), {
      headers: getHeaders(),
    });

    taskCreationTime.add(taskResponse.timings.duration);

    const success = check(taskResponse, {
      'task creation status 201': (r) => r.status === 201,
      'task creation time < target': (r) => r.timings.duration < TARGETS.taskCreation,
    });

    baselineSuccessRate.add(success ? 1 : 0);
    if (!success) baselineErrors.add(1);

    if (taskResponse.status === 201) {
      const taskId = JSON.parse(taskResponse.body).id;

      sleep(0.5);

      // Get task status
      http.get(`${BASE_URL}/api/tasks/${taskId}`, {
        headers: getHeaders(),
      });
    }
  });
}

// Baseline 4: Swarm Operations
export function baselineSwarmOperations() {
  group('Baseline: Swarm Operations', () => {
    const swarmConfig = generateSwarmConfig();

    const swarmResponse = http.post(`${BASE_URL}/api/swarms`, JSON.stringify(swarmConfig), {
      headers: getHeaders(),
    });

    swarmInitTime.add(swarmResponse.timings.duration);

    const success = check(swarmResponse, {
      'swarm init status 201': (r) => r.status === 201,
      'swarm init time < target': (r) => r.timings.duration < TARGETS.swarmInit,
    });

    baselineSuccessRate.add(success ? 1 : 0);
    if (!success) baselineErrors.add(1);

    if (swarmResponse.status === 201) {
      const swarmId = JSON.parse(swarmResponse.body).id;

      sleep(1);

      // Cleanup
      http.del(`${BASE_URL}/api/swarms/${swarmId}`, null, {
        headers: getHeaders(),
      });
    }
  });
}

// Baseline 5: Memory Operations
export function baselineMemoryOperations() {
  group('Baseline: Memory Operations', () => {
    const memoryData = generateMemoryData();

    // Store
    const storeResponse = http.post(`${BASE_URL}/api/memory`, JSON.stringify(memoryData), {
      headers: getHeaders(),
    });

    memoryStoreTime.add(storeResponse.timings.duration);

    const storeSuccess = check(storeResponse, {
      'memory store status 201': (r) => r.status === 201,
      'memory store time < target': (r) => r.timings.duration < TARGETS.memoryStore,
    });

    baselineSuccessRate.add(storeSuccess ? 1 : 0);
    if (!storeSuccess) baselineErrors.add(1);

    sleep(0.2);

    // Retrieve
    const retrieveResponse = http.get(`${BASE_URL}/api/memory/${memoryData.key}`, {
      headers: getHeaders(),
    });

    memoryRetrieveTime.add(retrieveResponse.timings.duration);

    const retrieveSuccess = check(retrieveResponse, {
      'memory retrieve status 200': (r) => r.status === 200,
      'memory retrieve time < target': (r) => r.timings.duration < TARGETS.memoryRetrieve,
    });

    baselineSuccessRate.add(retrieveSuccess ? 1 : 0);
    if (!retrieveSuccess) baselineErrors.add(1);

    // Cleanup
    http.del(`${BASE_URL}/api/memory/${memoryData.key}`, null, {
      headers: getHeaders(),
    });
  });
}

// Baseline 6: Vector Database Operations
export function baselineVectorOperations() {
  group('Baseline: Vector Database Operations', () => {
    // Insert vector
    const vectorData = {
      id: `baseline-vector-${Date.now()}`,
      vector: new Array(384).fill(0).map(() => Math.random()),
      metadata: { source: 'baseline-test' },
    };

    const insertResponse = http.post(`${BASE_URL}/api/vectors`, JSON.stringify(vectorData), {
      headers: getHeaders(),
    });

    vectorInsertTime.add(insertResponse.timings.duration);

    const insertSuccess = check(insertResponse, {
      'vector insert status 201': (r) => r.status === 201,
      'vector insert time < target': (r) => r.timings.duration < TARGETS.vectorInsert,
    });

    baselineSuccessRate.add(insertSuccess ? 1 : 0);
    if (!insertSuccess) baselineErrors.add(1);

    sleep(0.2);

    // Search
    const searchVector = new Array(384).fill(0).map(() => Math.random());
    const searchResponse = http.post(
      `${BASE_URL}/api/vectors/search`,
      JSON.stringify({ vector: searchVector, topK: 10 }),
      { headers: getHeaders() }
    );

    vectorSearchTime.add(searchResponse.timings.duration);

    const searchSuccess = check(searchResponse, {
      'vector search status 200': (r) => r.status === 200,
      'vector search time < target': (r) => r.timings.duration < TARGETS.vectorSearch,
    });

    baselineSuccessRate.add(searchSuccess ? 1 : 0);
    if (!searchSuccess) baselineErrors.add(1);

    // Cleanup
    http.del(`${BASE_URL}/api/vectors/${vectorData.id}`, null, {
      headers: getHeaders(),
    });
  });
}

// Main baseline test function
export default function () {
  baselineHealthCheck();
  sleep(0.5);

  baselineAgentOperations();
  sleep(1);

  baselineTaskOperations();
  sleep(1);

  baselineSwarmOperations();
  sleep(1);

  baselineMemoryOperations();
  sleep(1);

  baselineVectorOperations();
  sleep(1);
}

export function setup() {
  console.log('Starting baseline performance test...');
  console.log('Establishing performance baselines for all operations');
  console.log('\nPerformance Targets (p95):');
  Object.entries(TARGETS).forEach(([key, value]) => {
    console.log(`  ${key}: <${value}ms`);
  });

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('API is not accessible');
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\nBaseline test completed in ${duration.toFixed(2)}s`);
  console.log('\nResults will be saved to: tests/load/reports/baseline-results.json');
  console.log('Use these baselines to track performance regressions over time');
}
