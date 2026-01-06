/**
 * E2E Test Environment Setup
 * Configures test environment with necessary services and utilities
 */

import { test as base, expect } from '@playwright/test';
import { ChildProcess, exec, spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Test environment configuration
 */
export interface E2ETestConfig {
  baseUrl: string;
  timeout: number;
  mcpServerPort: number;
  agentDbPath: string;
  tempDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Test fixtures for E2E testing
 */
export interface E2EFixtures {
  config: E2ETestConfig;
  mcpServer: MCPServerFixture;
  agentDb: AgentDbFixture;
  swarmCoordinator: SwarmCoordinatorFixture;
  testLogger: TestLogger;
}

/**
 * MCP Server fixture
 */
export class MCPServerFixture {
  private process?: ChildProcess;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn('npx', ['gendev', 'mcp', 'start', '--port', String(this.port)], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let started = false;

      this.process.stdout?.on('data', (data) => {
        if (data.toString().includes('MCP server listening') && !started) {
          started = true;
          resolve();
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`MCP Server Error: ${data}`);
      });

      this.process.on('error', reject);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!started) {
          reject(new Error('MCP server failed to start within timeout'));
        }
      }, 10000);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      return new Promise((resolve) => {
        this.process!.on('exit', () => resolve());
        setTimeout(() => {
          this.process!.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${this.port}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * AgentDB fixture
 */
export class AgentDbFixture {
  private dbPath: string;
  private initialized = false;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create temp database directory
    const dir = path.dirname(this.dbPath);
    await fs.mkdir(dir, { recursive: true });

    // Initialize AgentDB
    await execAsync(`npx agentdb init --path ${this.dbPath}`);
    this.initialized = true;
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.dbPath, { recursive: true, force: true });
      this.initialized = false;
    } catch (error) {
      console.warn('Failed to cleanup AgentDB:', error);
    }
  }

  async query(sql: string): Promise<any> {
    const { stdout } = await execAsync(`npx agentdb query --path ${this.dbPath} --sql "${sql}"`);
    return JSON.parse(stdout);
  }

  async storeVector(
    namespace: string,
    key: string,
    vector: number[],
    metadata?: any
  ): Promise<void> {
    const data = JSON.stringify({ namespace, key, vector, metadata });
    await execAsync(`npx agentdb store --path ${this.dbPath} --data '${data}'`);
  }

  async searchSimilar(namespace: string, vector: number[], limit: number = 5): Promise<any[]> {
    const { stdout } = await execAsync(
      `npx agentdb search --path ${this.dbPath} --namespace ${namespace} --vector '${JSON.stringify(vector)}' --limit ${limit}`
    );
    return JSON.parse(stdout);
  }
}

/**
 * Swarm Coordinator fixture
 */
export class SwarmCoordinatorFixture {
  private swarmId?: string;
  private agents: Map<string, any> = new Map();

  async initializeSwarm(
    topology: 'hierarchical' | 'mesh' | 'pipeline',
    maxAgents: number = 10
  ): Promise<string> {
    const { stdout } = await execAsync(
      `npx gendev swarm init --topology ${topology} --max-agents ${maxAgents}`
    );
    this.swarmId = JSON.parse(stdout).swarmId;
    return this.swarmId;
  }

  async spawnAgent(type: string, config?: any): Promise<string> {
    if (!this.swarmId) {
      throw new Error('Swarm not initialized. Call initializeSwarm first.');
    }

    const configStr = config ? `--config '${JSON.stringify(config)}'` : '';
    const { stdout } = await execAsync(
      `npx gendev agent spawn --swarm ${this.swarmId} --type ${type} ${configStr}`
    );

    const { agentId } = JSON.parse(stdout);
    this.agents.set(agentId, { type, config });
    return agentId;
  }

  async executeTask(agentId: string, task: any): Promise<any> {
    const { stdout } = await execAsync(
      `npx gendev task execute --agent ${agentId} --task '${JSON.stringify(task)}'`
    );
    return JSON.parse(stdout);
  }

  async getSwarmStatus(): Promise<any> {
    if (!this.swarmId) {
      throw new Error('Swarm not initialized');
    }

    const { stdout } = await execAsync(`npx gendev swarm status --swarm ${this.swarmId}`);
    return JSON.parse(stdout);
  }

  async cleanup(): Promise<void> {
    if (this.swarmId) {
      try {
        await execAsync(`npx gendev swarm shutdown --swarm ${this.swarmId}`);
      } catch (error) {
        console.warn('Failed to shutdown swarm:', error);
      }
      this.swarmId = undefined;
      this.agents.clear();
    }
  }

  getAgents(): Map<string, any> {
    return this.agents;
  }
}

/**
 * Test logger fixture
 */
export class TestLogger {
  private logs: Array<{ level: string; message: string; timestamp: Date }> = [];
  private logLevel: E2ETestConfig['logLevel'];

  constructor(logLevel: E2ETestConfig['logLevel'] = 'info') {
    this.logLevel = logLevel;
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  info(message: string): void {
    this.log('info', message);
  }

  warn(message: string): void {
    this.log('warn', message);
  }

  error(message: string): void {
    this.log('error', message);
  }

  private log(level: string, message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level as keyof typeof levels] >= levels[this.logLevel]) {
      const entry = { level, message, timestamp: new Date() };
      this.logs.push(entry);
      console.log(`[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`);
    }
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Extended test with E2E fixtures
 */
export const test = base.extend<E2EFixtures>({
  config: async ({}, use) => {
    const config: E2ETestConfig = {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      timeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
      mcpServerPort: parseInt(process.env.MCP_PORT || '3000', 10),
      agentDbPath: path.join(__dirname, '../../.tmp/test-agentdb'),
      tempDir: path.join(__dirname, '../../.tmp'),
      logLevel: (process.env.LOG_LEVEL || 'info') as any,
    };

    // Ensure temp directory exists
    await fs.mkdir(config.tempDir, { recursive: true });

    await use(config);

    // Cleanup temp directory after all tests
    try {
      await fs.rm(config.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  },

  testLogger: async ({ config }, use) => {
    const logger = new TestLogger(config.logLevel);
    await use(logger);
    logger.clear();
  },

  mcpServer: async ({ config, testLogger }, use) => {
    const server = new MCPServerFixture(config.mcpServerPort);
    testLogger.info('Starting MCP server...');

    try {
      await server.start();
      testLogger.info('MCP server started successfully');

      await use(server);
    } finally {
      testLogger.info('Stopping MCP server...');
      await server.stop();
      testLogger.info('MCP server stopped');
    }
  },

  agentDb: async ({ config, testLogger }, use) => {
    const db = new AgentDbFixture(config.agentDbPath);
    testLogger.info('Initializing AgentDB...');

    try {
      await db.initialize();
      testLogger.info('AgentDB initialized successfully');

      await use(db);
    } finally {
      testLogger.info('Cleaning up AgentDB...');
      await db.cleanup();
      testLogger.info('AgentDB cleaned up');
    }
  },

  swarmCoordinator: async ({ testLogger }, use) => {
    const coordinator = new SwarmCoordinatorFixture();
    testLogger.info('Swarm coordinator ready');

    try {
      await use(coordinator);
    } finally {
      testLogger.info('Cleaning up swarm...');
      await coordinator.cleanup();
      testLogger.info('Swarm cleaned up');
    }
  },
});

export { expect };

/**
 * Utility functions for E2E tests
 */
export const utils = {
  /**
   * Wait for condition with timeout
   */
  async waitFor(
    condition: () => Promise<boolean>,
    timeoutMs: number = 10000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
  },

  /**
   * Retry operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = initialDelayMs * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError || new Error('Operation failed after retries');
  },

  /**
   * Generate random test data
   */
  generateTestData: {
    randomString: (length: number = 10): string => {
      return Math.random()
        .toString(36)
        .substring(2, length + 2);
    },
    randomVector: (dimensions: number = 128): number[] => {
      return Array.from({ length: dimensions }, () => Math.random());
    },
    randomAgentConfig: () => ({
      maxTokens: Math.floor(Math.random() * 1000) + 500,
      temperature: Math.random(),
      timeout: Math.floor(Math.random() * 30000) + 10000,
    }),
  },
};
