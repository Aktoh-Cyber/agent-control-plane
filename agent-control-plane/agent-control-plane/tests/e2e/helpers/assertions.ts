/**
 * E2E Test Assertion Helpers
 * Custom assertions for common E2E test scenarios
 */

import { expect } from '@playwright/test';

/**
 * Assert that a swarm is in expected state
 */
export async function assertSwarmState(
  getStatus: () => Promise<any>,
  expectedState: {
    agentCount?: number;
    activeAgents?: number;
    completedTasks?: number;
    failedTasks?: number;
    topology?: string;
  }
): Promise<void> {
  const status = await getStatus();

  if (expectedState.agentCount !== undefined) {
    expect(status.agents.length).toBe(expectedState.agentCount);
  }

  if (expectedState.activeAgents !== undefined) {
    const active = status.agents.filter((a: any) => a.status === 'active').length;
    expect(active).toBe(expectedState.activeAgents);
  }

  if (expectedState.completedTasks !== undefined) {
    expect(status.completedTasks).toBe(expectedState.completedTasks);
  }

  if (expectedState.failedTasks !== undefined) {
    expect(status.failedTasks).toBe(expectedState.failedTasks);
  }

  if (expectedState.topology !== undefined) {
    expect(status.topology).toBe(expectedState.topology);
  }
}

/**
 * Assert that an agent completed a task successfully
 */
export function assertTaskCompleted(result: any): void {
  expect(result).toBeDefined();
  expect(result.status).toBe('completed');
  expect(result.output).toBeDefined();
}

/**
 * Assert that a task failed with expected error
 */
export function assertTaskFailed(result: any, expectedError?: string | RegExp): void {
  expect(result).toBeDefined();
  expect(result.status).toBe('failed');

  if (expectedError) {
    if (typeof expectedError === 'string') {
      expect(result.error).toContain(expectedError);
    } else {
      expect(result.error).toMatch(expectedError);
    }
  }
}

/**
 * Assert that execution time is within expected range
 */
export function assertExecutionTime(duration: number, min: number, max: number): void {
  expect(duration).toBeGreaterThanOrEqual(min);
  expect(duration).toBeLessThan(max);
}

/**
 * Assert that parallel execution is faster than sequential
 */
export function assertParallelFasterThanSequential(
  parallelDuration: number,
  sequentialDuration: number,
  minSpeedupFactor: number = 1.5
): void {
  const speedup = sequentialDuration / parallelDuration;
  expect(speedup).toBeGreaterThanOrEqual(minSpeedupFactor);
}

/**
 * Assert that memory was shared correctly
 */
export async function assertMemoryShared(
  queryMemory: (key: string) => Promise<any>,
  key: string,
  expectedValue?: any
): Promise<void> {
  const memory = await queryMemory(key);
  expect(memory).toBeDefined();

  if (expectedValue !== undefined) {
    if (typeof expectedValue === 'object') {
      expect(memory).toMatchObject(expectedValue);
    } else {
      expect(memory).toBe(expectedValue);
    }
  }
}

/**
 * Assert that consensus was reached
 */
export function assertConsensusReached(result: any, minAgreement: number = 0.5): void {
  expect(result.consensus).toBeDefined();
  expect(result.consensus).toBeGreaterThanOrEqual(minAgreement);
  expect(result.agreedOption).toBeDefined();
}

/**
 * Assert that agent communication occurred
 */
export function assertAgentCommunication(
  agent1Result: any,
  agent2Result: any,
  messageKey: string
): void {
  expect(agent1Result.sentMessages).toBeDefined();
  expect(agent2Result.receivedMessages).toBeDefined();

  const sent = agent1Result.sentMessages.find((m: any) => m.key === messageKey);
  const received = agent2Result.receivedMessages.find((m: any) => m.key === messageKey);

  expect(sent).toBeDefined();
  expect(received).toBeDefined();
  expect(sent.payload).toEqual(received.payload);
}

/**
 * Assert that load balancing is working
 */
export function assertLoadBalanced(
  assignments: Map<string, number>,
  tolerance: number = 0.2
): void {
  const counts = Array.from(assignments.values());
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const maxDeviation = avg * tolerance;

  counts.forEach((count) => {
    expect(Math.abs(count - avg)).toBeLessThanOrEqual(maxDeviation);
  });
}

/**
 * Assert that vector search returned relevant results
 */
export function assertVectorSearchRelevant(results: any[], minSimilarity: number = 0.7): void {
  expect(results).toBeDefined();
  expect(results.length).toBeGreaterThan(0);

  results.forEach((result) => {
    expect(result.similarity).toBeDefined();
    expect(result.similarity).toBeGreaterThanOrEqual(minSimilarity);
  });
}

/**
 * Assert that file operations succeeded
 */
export async function assertFileExists(
  readFile: (path: string) => Promise<string>,
  filePath: string,
  expectedContent?: string | RegExp
): Promise<void> {
  const content = await readFile(filePath);
  expect(content).toBeDefined();

  if (expectedContent) {
    if (typeof expectedContent === 'string') {
      expect(content).toContain(expectedContent);
    } else {
      expect(content).toMatch(expectedContent);
    }
  }
}

/**
 * Assert that MCP communication succeeded
 */
export function assertMCPCommunication(result: any, expectedMethod: string): void {
  expect(result.mcpResponse).toBeDefined();
  expect(result.mcpResponse.method).toBe(expectedMethod);
}

/**
 * Assert that error recovery worked
 */
export async function assertErrorRecovery(
  executeWithRetry: () => Promise<any>,
  maxAttempts: number = 3
): Promise<void> {
  let attempts = 0;
  let lastError: Error | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    attempts++;
    try {
      const result = await executeWithRetry();
      expect(result.status).toBe('completed');
      expect(attempts).toBeLessThanOrEqual(maxAttempts);
      return;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(`Recovery failed after ${attempts} attempts: ${lastError?.message}`);
}

/**
 * Assert that throughput meets expectations
 */
export function assertThroughput(
  tasksCompleted: number,
  duration: number,
  minTasksPerSecond: number
): void {
  const throughput = (tasksCompleted / duration) * 1000;
  expect(throughput).toBeGreaterThanOrEqual(minTasksPerSecond);
}

/**
 * Assert that resource usage is within limits
 */
export function assertResourceUsage(
  usage: {
    memory?: number;
    cpu?: number;
    network?: number;
  },
  limits: {
    memory?: number;
    cpu?: number;
    network?: number;
  }
): void {
  if (usage.memory !== undefined && limits.memory !== undefined) {
    expect(usage.memory).toBeLessThanOrEqual(limits.memory);
  }

  if (usage.cpu !== undefined && limits.cpu !== undefined) {
    expect(usage.cpu).toBeLessThanOrEqual(limits.cpu);
  }

  if (usage.network !== undefined && limits.network !== undefined) {
    expect(usage.network).toBeLessThanOrEqual(limits.network);
  }
}

/**
 * Assert that pipeline stages executed in order
 */
export function assertPipelineOrder(results: any[], expectedOrder: string[]): void {
  expect(results.length).toBe(expectedOrder.length);

  results.forEach((result, index) => {
    expect(result.stage).toBe(expectedOrder[index]);
  });

  // Verify sequential timestamps
  for (let i = 1; i < results.length; i++) {
    expect(results[i].startTime).toBeGreaterThan(results[i - 1].endTime);
  }
}

/**
 * Assert that hierarchical coordination worked
 */
export function assertHierarchicalCoordination(queenResult: any, workerResults: any[]): void {
  expect(queenResult.status).toBe('completed');
  expect(queenResult.subtasks).toBeDefined();
  expect(queenResult.subtasks.length).toBe(workerResults.length);

  workerResults.forEach((workerResult, index) => {
    expect(workerResult.status).toBe('completed');
    expect(workerResult.assignedBy).toBe(queenResult.agentId);
  });
}

/**
 * Assert that mesh coordination worked
 */
export function assertMeshCoordination(peerResults: any[]): void {
  expect(peerResults.length).toBeGreaterThan(1);

  peerResults.forEach((result) => {
    expect(result.status).toBe('completed');
    expect(result.peerCommunications).toBeDefined();
    expect(result.peerCommunications.length).toBeGreaterThan(0);
  });

  // Verify all peers communicated with each other
  const peerIds = peerResults.map((r) => r.agentId);
  peerResults.forEach((result) => {
    const communicatedWith = result.peerCommunications.map((c: any) => c.peerId);
    expect(communicatedWith.some((id: string) => peerIds.includes(id))).toBe(true);
  });
}
