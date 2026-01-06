/**
 * Swarm Operations Load Test
 * Tests for concurrent agent spawning, swarm execution, and coordination under load
 */

import { check, group, sleep } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  generateAgentConfig,
  generateSwarmConfig,
  generateTaskData,
  getHeaders,
  options,
} from '../k6-config.js';

// Custom metrics
const swarmInitDuration = new Trend('swarm_init_duration');
const agentSpawnDuration = new Trend('agent_spawn_duration');
const taskExecutionDuration = new Trend('task_execution_duration');
const swarmSuccessRate = new Rate('swarm_success_rate');
const activeSwarms = new Gauge('active_swarms');
const activeAgents = new Gauge('active_agents');
const concurrentOperations = new Counter('concurrent_operations');

export { options };

// Scenario 1: Concurrent agent spawning
export function concurrentAgentSpawning() {
  group('Concurrent Agent Spawning - 10 Agents', () => {
    const swarmConfig = generateSwarmConfig();

    // Initialize swarm
    const swarmResponse = http.post(`${BASE_URL}/api/swarms`, JSON.stringify(swarmConfig), {
      headers: getHeaders(),
    });

    const swarmInitTime = swarmResponse.timings.duration;
    swarmInitDuration.add(swarmInitTime);

    check(swarmResponse, {
      'swarm initialized': (r) => r.status === 201,
      'swarm init time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (swarmResponse.status === 201) {
      const swarmId = JSON.parse(swarmResponse.body).id;
      activeSwarms.add(1);

      // Spawn 10 agents concurrently
      const agentPromises = [];
      for (let i = 0; i < 10; i++) {
        const agentConfig = generateAgentConfig();
        const agentResponse = http.post(
          `${BASE_URL}/api/swarms/${swarmId}/agents`,
          JSON.stringify(agentConfig),
          { headers: getHeaders() }
        );

        agentSpawnDuration.add(agentResponse.timings.duration);
        concurrentOperations.add(1);

        check(agentResponse, {
          [`agent ${i + 1} spawned`]: (r) => r.status === 201,
          [`agent ${i + 1} spawn time < 3000ms`]: (r) => r.timings.duration < 3000,
        });

        if (agentResponse.status === 201) {
          activeAgents.add(1);
        }
      }

      swarmSuccessRate.add(1);

      // Cleanup
      sleep(2);
      http.del(`${BASE_URL}/api/swarms/${swarmId}`, null, { headers: getHeaders() });
      activeSwarms.add(-1);
    } else {
      swarmSuccessRate.add(0);
    }
  });

  sleep(2);
}

// Scenario 2: Parallel swarm execution
export function parallelSwarmExecution() {
  group('Parallel Swarm Execution - 5 Swarms', () => {
    const swarmIds = [];

    // Create 5 swarms
    for (let i = 0; i < 5; i++) {
      const swarmConfig = generateSwarmConfig();
      const swarmResponse = http.post(`${BASE_URL}/api/swarms`, JSON.stringify(swarmConfig), {
        headers: getHeaders(),
      });

      swarmInitDuration.add(swarmResponse.timings.duration);

      if (swarmResponse.status === 201) {
        swarmIds.push(JSON.parse(swarmResponse.body).id);
        activeSwarms.add(1);
      }
    }

    check(swarmIds, {
      'all swarms created': (ids) => ids.length === 5,
    });

    // Execute tasks in each swarm
    swarmIds.forEach((swarmId, index) => {
      group(`Swarm ${index + 1} Execution`, () => {
        // Spawn agents
        const agentIds = [];
        for (let i = 0; i < 3; i++) {
          const agentConfig = generateAgentConfig();
          const agentResponse = http.post(
            `${BASE_URL}/api/swarms/${swarmId}/agents`,
            JSON.stringify(agentConfig),
            { headers: getHeaders() }
          );

          if (agentResponse.status === 201) {
            agentIds.push(JSON.parse(agentResponse.body).id);
            activeAgents.add(1);
          }
        }

        // Execute tasks on agents
        agentIds.forEach((agentId) => {
          const taskData = generateTaskData();
          const taskResponse = http.post(
            `${BASE_URL}/api/agents/${agentId}/tasks`,
            JSON.stringify(taskData),
            { headers: getHeaders() }
          );

          taskExecutionDuration.add(taskResponse.timings.duration);
          concurrentOperations.add(1);

          check(taskResponse, {
            'task created': (r) => r.status === 201,
            'task execution initiated < 5000ms': (r) => r.timings.duration < 5000,
          });
        });
      });
    });

    swarmSuccessRate.add(1);

    // Cleanup all swarms
    sleep(3);
    swarmIds.forEach((swarmId) => {
      http.del(`${BASE_URL}/api/swarms/${swarmId}`, null, { headers: getHeaders() });
      activeSwarms.add(-1);
    });
  });

  sleep(3);
}

// Scenario 3: High-density agent swarm (50+ agents)
export function highDensitySwarm() {
  group('High-Density Swarm - 50 Agents', () => {
    const swarmConfig = {
      topology: 'mesh',
      maxAgents: 100,
      coordinationStrategy: 'distributed',
    };

    const swarmResponse = http.post(`${BASE_URL}/api/swarms`, JSON.stringify(swarmConfig), {
      headers: getHeaders(),
    });

    swarmInitDuration.add(swarmResponse.timings.duration);

    if (swarmResponse.status === 201) {
      const swarmId = JSON.parse(swarmResponse.body).id;
      activeSwarms.add(1);

      const startTime = Date.now();

      // Spawn 50 agents
      for (let i = 0; i < 50; i++) {
        const agentConfig = generateAgentConfig();
        const agentResponse = http.post(
          `${BASE_URL}/api/swarms/${swarmId}/agents`,
          JSON.stringify(agentConfig),
          { headers: getHeaders() }
        );

        agentSpawnDuration.add(agentResponse.timings.duration);
        concurrentOperations.add(1);

        if (agentResponse.status === 201) {
          activeAgents.add(1);
        }

        // Small delay to avoid overwhelming the system
        if (i % 10 === 0) {
          sleep(0.5);
        }
      }

      const totalTime = Date.now() - startTime;

      check(
        { totalTime },
        {
          'spawned 50 agents in < 30s': (data) => data.totalTime < 30000,
        }
      );

      swarmSuccessRate.add(1);

      // Cleanup
      sleep(5);
      http.del(`${BASE_URL}/api/swarms/${swarmId}`, null, { headers: getHeaders() });
      activeSwarms.add(-1);
    } else {
      swarmSuccessRate.add(0);
    }
  });

  sleep(5);
}

// Scenario 4: Hierarchical swarm coordination
export function hierarchicalSwarmCoordination() {
  group('Hierarchical Swarm - 100 Worker Agents', () => {
    const swarmConfig = {
      topology: 'hierarchical',
      maxAgents: 150,
      coordinationStrategy: 'leader-based',
      hierarchyLevels: 3,
    };

    const swarmResponse = http.post(`${BASE_URL}/api/swarms`, JSON.stringify(swarmConfig), {
      headers: getHeaders(),
    });

    swarmInitDuration.add(swarmResponse.timings.duration);

    if (swarmResponse.status === 201) {
      const swarmId = JSON.parse(swarmResponse.body).id;
      activeSwarms.add(1);

      // Spawn coordinator agent
      const coordinatorConfig = {
        type: 'hierarchical-coordinator',
        role: 'leader',
      };

      const coordinatorResponse = http.post(
        `${BASE_URL}/api/swarms/${swarmId}/agents`,
        JSON.stringify(coordinatorConfig),
        { headers: getHeaders() }
      );

      if (coordinatorResponse.status === 201) {
        const coordinatorId = JSON.parse(coordinatorResponse.body).id;
        activeAgents.add(1);

        // Spawn 10 manager agents
        const managerIds = [];
        for (let i = 0; i < 10; i++) {
          const managerConfig = {
            type: 'planner',
            role: 'manager',
            parentId: coordinatorId,
          };

          const managerResponse = http.post(
            `${BASE_URL}/api/swarms/${swarmId}/agents`,
            JSON.stringify(managerConfig),
            { headers: getHeaders() }
          );

          if (managerResponse.status === 201) {
            managerIds.push(JSON.parse(managerResponse.body).id);
            activeAgents.add(1);
          }
        }

        // Spawn 100 worker agents under managers
        let workerCount = 0;
        managerIds.forEach((managerId, index) => {
          for (let i = 0; i < 10; i++) {
            const workerConfig = {
              type: 'coder',
              role: 'worker',
              parentId: managerId,
            };

            const workerResponse = http.post(
              `${BASE_URL}/api/swarms/${swarmId}/agents`,
              JSON.stringify(workerConfig),
              { headers: getHeaders() }
            );

            concurrentOperations.add(1);

            if (workerResponse.status === 201) {
              workerCount++;
              activeAgents.add(1);
            }
          }

          if (index % 3 === 0) {
            sleep(0.5);
          }
        });

        check(
          { workerCount },
          {
            'spawned 100 workers': (data) => data.workerCount === 100,
          }
        );

        swarmSuccessRate.add(1);
      }

      // Cleanup
      sleep(5);
      http.del(`${BASE_URL}/api/swarms/${swarmId}`, null, { headers: getHeaders() });
      activeSwarms.add(-1);
    } else {
      swarmSuccessRate.add(0);
    }
  });

  sleep(5);
}

// Main test function
export default function () {
  const scenario = exec.scenario.name || 'default';

  switch (scenario) {
    case 'concurrent-spawning':
      concurrentAgentSpawning();
      break;
    case 'parallel-execution':
      parallelSwarmExecution();
      break;
    case 'high-density':
      highDensitySwarm();
      break;
    case 'hierarchical':
      hierarchicalSwarmCoordination();
      break;
    default:
      // Run all scenarios in sequence
      concurrentAgentSpawning();
      parallelSwarmExecution();
      highDensitySwarm();
      hierarchicalSwarmCoordination();
  }
}

export function setup() {
  console.log('Starting swarm load test...');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Swarm load test completed in ${duration}s`);
}
