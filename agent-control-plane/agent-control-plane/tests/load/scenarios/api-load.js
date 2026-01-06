/**
 * API Load Test Scenarios
 * Tests for REST API endpoints under various load conditions
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  generateAgentConfig,
  generateTaskData,
  getHeaders,
  options,
} from '../k6-config.js';

// Custom metrics
const apiResponseTime = new Trend('api_response_time');
const apiSuccessRate = new Rate('api_success_rate');
const apiRequestCount = new Counter('api_request_count');

export { options };

// Test scenarios
export default function () {
  // Group 1: Health and status endpoints
  group('Health Checks', () => {
    const healthResponse = http.get(`${BASE_URL}/health`, {
      headers: getHeaders(),
    });

    check(healthResponse, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });

    apiResponseTime.add(healthResponse.timings.duration);
    apiSuccessRate.add(healthResponse.status === 200);
    apiRequestCount.add(1);
  });

  sleep(1);

  // Group 2: Agent operations
  group('Agent Operations', () => {
    // List agents
    const listResponse = http.get(`${BASE_URL}/api/agents`, {
      headers: getHeaders(),
    });

    check(listResponse, {
      'list agents status is 200': (r) => r.status === 200,
      'list agents returns array': (r) => Array.isArray(JSON.parse(r.body)),
      'list agents response time < 500ms': (r) => r.timings.duration < 500,
    });

    apiResponseTime.add(listResponse.timings.duration);
    apiSuccessRate.add(listResponse.status === 200);
    apiRequestCount.add(1);

    sleep(0.5);

    // Create agent
    const agentConfig = generateAgentConfig();
    const createResponse = http.post(`${BASE_URL}/api/agents`, JSON.stringify(agentConfig), {
      headers: getHeaders(),
    });

    check(createResponse, {
      'create agent status is 201': (r) => r.status === 201,
      'create agent returns id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch {
          return false;
        }
      },
      'create agent response time < 3000ms': (r) => r.timings.duration < 3000,
    });

    apiResponseTime.add(createResponse.timings.duration);
    apiSuccessRate.add(createResponse.status === 201);
    apiRequestCount.add(1);

    if (createResponse.status === 201) {
      const agentId = JSON.parse(createResponse.body).id;

      sleep(0.5);

      // Get agent details
      const getResponse = http.get(`${BASE_URL}/api/agents/${agentId}`, {
        headers: getHeaders(),
      });

      check(getResponse, {
        'get agent status is 200': (r) => r.status === 200,
        'get agent returns correct id': (r) => {
          try {
            return JSON.parse(r.body).id === agentId;
          } catch {
            return false;
          }
        },
      });

      apiResponseTime.add(getResponse.timings.duration);
      apiSuccessRate.add(getResponse.status === 200);
      apiRequestCount.add(1);

      sleep(0.5);

      // Delete agent
      const deleteResponse = http.del(`${BASE_URL}/api/agents/${agentId}`, null, {
        headers: getHeaders(),
      });

      check(deleteResponse, {
        'delete agent status is 204': (r) => r.status === 204,
      });

      apiResponseTime.add(deleteResponse.timings.duration);
      apiSuccessRate.add(deleteResponse.status === 204);
      apiRequestCount.add(1);
    }
  });

  sleep(1);

  // Group 3: Task operations
  group('Task Operations', () => {
    const taskData = generateTaskData();

    // Create task
    const createTaskResponse = http.post(`${BASE_URL}/api/tasks`, JSON.stringify(taskData), {
      headers: getHeaders(),
    });

    check(createTaskResponse, {
      'create task status is 201': (r) => r.status === 201,
      'create task response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    apiResponseTime.add(createTaskResponse.timings.duration);
    apiSuccessRate.add(createTaskResponse.status === 201);
    apiRequestCount.add(1);

    if (createTaskResponse.status === 201) {
      const taskId = JSON.parse(createTaskResponse.body).id;

      sleep(0.5);

      // Get task status
      const statusResponse = http.get(`${BASE_URL}/api/tasks/${taskId}`, {
        headers: getHeaders(),
      });

      check(statusResponse, {
        'get task status is 200': (r) => r.status === 200,
        'task has valid status': (r) => {
          try {
            const status = JSON.parse(r.body).status;
            return ['pending', 'running', 'completed', 'failed'].includes(status);
          } catch {
            return false;
          }
        },
      });

      apiResponseTime.add(statusResponse.timings.duration);
      apiSuccessRate.add(statusResponse.status === 200);
      apiRequestCount.add(1);
    }
  });

  sleep(1);

  // Group 4: Swarm operations
  group('Swarm Operations', () => {
    // List swarms
    const listSwarmsResponse = http.get(`${BASE_URL}/api/swarms`, {
      headers: getHeaders(),
    });

    check(listSwarmsResponse, {
      'list swarms status is 200': (r) => r.status === 200,
      'list swarms response time < 500ms': (r) => r.timings.duration < 500,
    });

    apiResponseTime.add(listSwarmsResponse.timings.duration);
    apiSuccessRate.add(listSwarmsResponse.status === 200);
    apiRequestCount.add(1);
  });

  sleep(1);

  // Group 5: Metrics endpoint
  group('Metrics', () => {
    const metricsResponse = http.get(`${BASE_URL}/api/metrics`, {
      headers: getHeaders(),
    });

    check(metricsResponse, {
      'metrics status is 200': (r) => r.status === 200,
      'metrics response time < 300ms': (r) => r.timings.duration < 300,
      'metrics contains expected fields': (r) => {
        try {
          const metrics = JSON.parse(r.body);
          return metrics.hasOwnProperty('cpu') && metrics.hasOwnProperty('memory');
        } catch {
          return false;
        }
      },
    });

    apiResponseTime.add(metricsResponse.timings.duration);
    apiSuccessRate.add(metricsResponse.status === 200);
    apiRequestCount.add(1);
  });

  sleep(1);
}

// Setup function - runs once per VU
export function setup() {
  console.log('Starting API load test...');
  console.log(`Base URL: ${BASE_URL}`);

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('API is not accessible');
  }

  return { startTime: Date.now() };
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`API load test completed in ${duration}s`);
}
