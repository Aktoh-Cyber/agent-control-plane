/**
 * Stress Test Scenarios
 * Push the system to its limits to find breaking points and bottlenecks
 */

import { check, group, sleep } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  generateAgentConfig,
  generateTaskData,
  getHeaders,
  stressOptions,
} from '../k6-config.js';

// Custom metrics
const systemBreakPoint = new Gauge('system_break_point_vus');
const errorRate = new Rate('error_rate');
const throughput = new Trend('throughput_rps');
const responseTime = new Trend('response_time_ms');
const failedRequests = new Counter('failed_requests');
const successfulRequests = new Counter('successful_requests');
const maxConcurrentAgents = new Gauge('max_concurrent_agents');
const bottleneckDetected = new Rate('bottleneck_detected');

export const options = stressOptions;

let lastErrorRate = 0;
let breakPointReached = false;

// Stress Scenario 1: Increasing load until failure
export function increaseUntilFailure() {
  group('Increase Load Until Failure', () => {
    const currentVUs = exec.instance.vusActive;

    // Make multiple requests per VU
    const requestsPerVU = 5;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < requestsPerVU; i++) {
      const response = http.get(`${BASE_URL}/api/health`, {
        headers: getHeaders(),
        timeout: '10s',
      });

      if (response.status === 200) {
        successCount++;
        successfulRequests.add(1);
      } else {
        errorCount++;
        failedRequests.add(1);
      }

      responseTime.add(response.timings.duration);

      sleep(0.1);
    }

    const currentErrorRate = errorCount / requestsPerVU;
    errorRate.add(currentErrorRate);

    // Detect break point
    if (currentErrorRate > 0.05 && !breakPointReached) {
      systemBreakPoint.add(currentVUs);
      breakPointReached = true;
      console.log(
        `⚠️  Break point reached at ${currentVUs} VUs (${(currentErrorRate * 100).toFixed(2)}% error rate)`
      );
    }

    // Calculate throughput
    const rps = requestsPerVU / (responseTime.avg / 1000);
    throughput.add(rps);

    check(
      { currentErrorRate },
      {
        'error rate < 5%': (data) => data.currentErrorRate < 0.05,
      }
    );

    lastErrorRate = currentErrorRate;
  });

  sleep(1);
}

// Stress Scenario 2: Agent spawning stress
export function agentSpawningStress() {
  group('Agent Spawning Stress Test', () => {
    const targetAgents = 100 + Math.floor(exec.instance.vusActive / 10);

    const swarmConfig = {
      topology: 'mesh',
      maxAgents: targetAgents * 2,
    };

    const swarmResponse = http.post(`${BASE_URL}/api/swarms`, JSON.stringify(swarmConfig), {
      headers: getHeaders(),
      timeout: '15s',
    });

    if (swarmResponse.status === 201) {
      const swarmId = JSON.parse(swarmResponse.body).id;
      let spawnedCount = 0;
      let failedCount = 0;

      // Try to spawn target number of agents
      for (let i = 0; i < targetAgents; i++) {
        const agentConfig = generateAgentConfig();
        const agentResponse = http.post(
          `${BASE_URL}/api/swarms/${swarmId}/agents`,
          JSON.stringify(agentConfig),
          { headers: getHeaders(), timeout: '10s' }
        );

        if (agentResponse.status === 201) {
          spawnedCount++;
          successfulRequests.add(1);
        } else {
          failedCount++;
          failedRequests.add(1);
        }

        // Small delay every 10 agents
        if (i % 10 === 0) {
          sleep(0.2);
        }
      }

      maxConcurrentAgents.add(spawnedCount);

      const spawnErrorRate = failedCount / targetAgents;
      errorRate.add(spawnErrorRate);

      check(
        { spawnedCount, targetAgents, spawnErrorRate },
        {
          'spawned > 50% of target agents': (data) => data.spawnedCount > data.targetAgents * 0.5,
          'spawn error rate < 10%': (data) => data.spawnErrorRate < 0.1,
        }
      );

      // Cleanup
      sleep(2);
      http.del(`${BASE_URL}/api/swarms/${swarmId}`, null, {
        headers: getHeaders(),
        timeout: '10s',
      });
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  sleep(2);
}

// Stress Scenario 3: Concurrent task execution stress
export function taskExecutionStress() {
  group('Task Execution Stress Test', () => {
    const concurrentTasks = 50;

    // Create agent
    const agentConfig = generateAgentConfig();
    const agentResponse = http.post(`${BASE_URL}/api/agents`, JSON.stringify(agentConfig), {
      headers: getHeaders(),
      timeout: '10s',
    });

    if (agentResponse.status === 201) {
      const agentId = JSON.parse(agentResponse.body).id;

      let successCount = 0;
      let failedCount = 0;

      // Submit concurrent tasks
      for (let i = 0; i < concurrentTasks; i++) {
        const taskData = generateTaskData();
        const taskResponse = http.post(
          `${BASE_URL}/api/agents/${agentId}/tasks`,
          JSON.stringify(taskData),
          { headers: getHeaders(), timeout: '10s' }
        );

        if (taskResponse.status === 201) {
          successCount++;
          successfulRequests.add(1);
        } else {
          failedCount++;
          failedRequests.add(1);
        }

        responseTime.add(taskResponse.timings.duration);
      }

      const taskErrorRate = failedCount / concurrentTasks;
      errorRate.add(taskErrorRate);

      check(
        { successCount, failedCount, taskErrorRate },
        {
          'most tasks accepted': (data) => data.successCount > concurrentTasks * 0.7,
          'task submission error rate < 15%': (data) => data.taskErrorRate < 0.15,
        }
      );

      // Cleanup
      http.del(`${BASE_URL}/api/agents/${agentId}`, null, {
        headers: getHeaders(),
        timeout: '10s',
      });
    } else {
      failedRequests.add(1);
    }
  });

  sleep(1);
}

// Stress Scenario 4: Memory stress test
export function memoryStress() {
  group('Memory Stress Test', () => {
    const vectorCount = 500;
    let successCount = 0;
    let failedCount = 0;

    // Insert large number of vectors
    for (let i = 0; i < vectorCount; i++) {
      const vectorData = {
        id: `stress-vector-${Date.now()}-${i}`,
        vector: new Array(384).fill(0).map(() => Math.random()),
        metadata: {
          source: 'stress-test',
          vu: exec.instance.vusActive,
        },
      };

      const insertResponse = http.post(`${BASE_URL}/api/vectors`, JSON.stringify(vectorData), {
        headers: getHeaders(),
        timeout: '5s',
      });

      if (insertResponse.status === 201) {
        successCount++;
        successfulRequests.add(1);
      } else {
        failedCount++;
        failedRequests.add(1);
      }

      // Batch operations
      if (i % 50 === 0) {
        sleep(0.1);
      }
    }

    const insertErrorRate = failedCount / vectorCount;
    errorRate.add(insertErrorRate);

    check(
      { successCount, insertErrorRate },
      {
        'most vectors inserted': (data) => data.successCount > vectorCount * 0.8,
        'insert error rate < 20%': (data) => data.insertErrorRate < 0.2,
      }
    );

    // Perform stress searches
    for (let i = 0; i < 20; i++) {
      const searchVector = new Array(384).fill(0).map(() => Math.random());

      http.post(
        `${BASE_URL}/api/vectors/search`,
        JSON.stringify({ vector: searchVector, topK: 10 }),
        { headers: getHeaders(), timeout: '5s' }
      );
    }
  });

  sleep(1);
}

// Stress Scenario 5: Bottleneck detection
export function bottleneckDetection() {
  group('Bottleneck Detection', () => {
    const startTime = Date.now();
    let requestCount = 0;
    let slowRequests = 0;

    // Make rapid requests
    for (let i = 0; i < 20; i++) {
      const response = http.get(`${BASE_URL}/api/metrics`, {
        headers: getHeaders(),
        timeout: '5s',
      });

      requestCount++;
      responseTime.add(response.timings.duration);

      if (response.timings.duration > 1000) {
        slowRequests++;
      }

      if (response.status === 200) {
        successfulRequests.add(1);
      } else {
        failedRequests.add(1);
      }
    }

    const totalTime = Date.now() - startTime;
    const actualRPS = (requestCount / totalTime) * 1000;
    throughput.add(actualRPS);

    // Detect bottleneck if most requests are slow
    const slowRequestRate = slowRequests / requestCount;
    const isBottleneck = slowRequestRate > 0.5;
    bottleneckDetected.add(isBottleneck ? 1 : 0);

    if (isBottleneck) {
      console.log(
        `⚠️  Bottleneck detected: ${(slowRequestRate * 100).toFixed(2)}% slow requests at ${exec.instance.vusActive} VUs`
      );
    }

    check(
      { slowRequestRate, actualRPS },
      {
        'slow request rate < 50%': (data) => data.slowRequestRate < 0.5,
        'throughput > 50 rps': (data) => data.actualRPS > 50,
      }
    );
  });

  sleep(0.5);
}

// Stress Scenario 6: Network saturation
export function networkSaturation() {
  group('Network Saturation Test', () => {
    const largePayloadSize = 1024 * 100; // 100KB payload
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < 10; i++) {
      const largePayload = {
        data: new Array(largePayloadSize).fill('x').join(''),
        timestamp: Date.now(),
        iteration: i,
      };

      const response = http.post(`${BASE_URL}/api/data/bulk`, JSON.stringify(largePayload), {
        headers: getHeaders(),
        timeout: '15s',
      });

      if (response.status === 201 || response.status === 200) {
        successCount++;
        successfulRequests.add(1);
      } else {
        failedCount++;
        failedRequests.add(1);
      }

      responseTime.add(response.timings.duration);
      sleep(0.2);
    }

    const networkErrorRate = failedCount / 10;
    errorRate.add(networkErrorRate);

    check(
      { successCount, networkErrorRate },
      {
        'large payloads handled': (data) => data.successCount > 5,
        'network error rate < 30%': (data) => data.networkErrorRate < 0.3,
      }
    );
  });

  sleep(1);
}

// Main stress test function
export default function () {
  const currentStage = exec.scenario.iterationInTest % 6;

  switch (currentStage) {
    case 0:
      increaseUntilFailure();
      break;
    case 1:
      agentSpawningStress();
      break;
    case 2:
      taskExecutionStress();
      break;
    case 3:
      memoryStress();
      break;
    case 4:
      bottleneckDetection();
      break;
    case 5:
      networkSaturation();
      break;
  }

  // Log progress every 50 iterations
  if (exec.scenario.iterationInTest % 50 === 0) {
    console.log(
      `Iteration ${exec.scenario.iterationInTest}, VUs: ${exec.instance.vusActive}, Error Rate: ${(lastErrorRate * 100).toFixed(2)}%`
    );
  }
}

export function setup() {
  console.log('Starting stress test - pushing system to limits...');
  console.log('⚠️  This test will intentionally overload the system');

  // Verify system is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('System not accessible before stress test');
  }

  return {
    startTime: Date.now(),
    initialHealth: healthCheck.status === 200,
  };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Stress test completed after ${duration.toFixed(2)} minutes`);

  // Report findings
  console.log('\n=== Stress Test Results ===');
  console.log(`Break Point: ${breakPointReached ? 'Detected' : 'Not reached within test limits'}`);
  console.log(`Final Error Rate: ${(lastErrorRate * 100).toFixed(2)}%`);

  // Check system health after stress
  const finalHealthCheck = http.get(`${BASE_URL}/health`);
  const systemRecovered = finalHealthCheck.status === 200;

  console.log(`System Recovery: ${systemRecovered ? '✓ Recovered' : '✗ Still degraded'}`);

  if (!systemRecovered) {
    console.warn('⚠️  WARNING: System did not fully recover after stress test');
  }
}
