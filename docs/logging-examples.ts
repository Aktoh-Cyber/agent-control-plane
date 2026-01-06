/**
 * Logging System Usage Examples
 *
 * This file contains practical examples of using the structured logging system.
 * Copy and adapt these patterns for your components.
 */

import {
  createAgentLogger,
  createComponentLogger,
  createSwarmLogger,
  createTaskLogger,
  logger,
  Logger,
  type LogContext,
} from '../src/utils/logger';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Simple logging
 */
export function basicLoggingExample() {
  logger.info('Application initialized');
  logger.debug('Configuration loaded', { config: { port: 3000 } });
  logger.warn('API rate limit approaching', { usage: 95, limit: 100 });
  logger.error('Database connection failed', { error: new Error('Connection timeout') });
}

/**
 * Example 2: Structured logging with context
 */
export function structuredLoggingExample() {
  const context: LogContext = {
    userId: 'user-123',
    sessionId: 'session-abc',
    component: 'authentication',
    action: 'login',
  };

  logger.info('User login attempt', context);

  // Add more context
  logger.info('User authenticated successfully', {
    ...context,
    authMethod: 'oauth',
    provider: 'google',
    duration: 234,
  });
}

// ============================================================================
// COMPONENT-SPECIFIC LOGGERS
// ============================================================================

/**
 * Example 3: Database component logger
 */
export class DatabaseService {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('database');
  }

  async connect() {
    this.logger.info('Connecting to database');
    try {
      // Connection logic
      this.logger.info('Database connected successfully', {
        host: 'localhost',
        port: 5432,
        database: 'agentic_flow',
      });
    } catch (error) {
      this.logger.error('Database connection failed', {
        error,
        host: 'localhost',
        retries: 3,
      });
      throw error;
    }
  }

  async query(sql: string, params: unknown[]) {
    return this.logger.time(
      'Database query',
      async () => {
        // Query execution
        const result = { rows: [], count: 0 };
        return result;
      },
      { sql: sql.substring(0, 100), paramCount: params.length }
    );
  }
}

/**
 * Example 4: API service logger
 */
export class ApiService {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('api');
  }

  async handleRequest(req: { method: string; path: string; userId?: string }) {
    const requestId = crypto.randomUUID();
    const requestLogger = this.logger.child({ requestId });

    requestLogger.http('Request received', {
      method: req.method,
      path: req.path,
      userId: req.userId,
    });

    try {
      // Process request
      const result = await this.processRequest(req, requestLogger);

      requestLogger.http('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: 200,
        duration: 123,
      });

      return result;
    } catch (error) {
      requestLogger.error('Request failed', {
        method: req.method,
        path: req.path,
        error,
        statusCode: 500,
      });
      throw error;
    }
  }

  private async processRequest(req: unknown, logger: Logger) {
    logger.debug('Processing request', { stage: 'validation' });
    // Processing logic
    logger.debug('Request processed', { stage: 'completed' });
    return {};
  }
}

// ============================================================================
// AGENT AND SWARM LOGGING
// ============================================================================

/**
 * Example 5: Agent logger
 */
export class Agent {
  private logger: Logger;

  constructor(
    private agentId: string,
    private swarmId: string
  ) {
    this.logger = createAgentLogger(agentId, swarmId);
  }

  async executeTask(taskId: string) {
    this.logger.info('Task started', { taskId, status: 'started' });

    try {
      const result = await this.logger.time(
        'Task execution',
        async () => {
          // Task logic
          this.logger.debug('Processing task', { taskId, progress: 0.5 });
          return { success: true, data: {} };
        },
        { taskId }
      );

      this.logger.info('Task completed', {
        taskId,
        status: 'completed',
        result: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error('Task failed', {
        taskId,
        status: 'failed',
        error,
      });
      throw error;
    }
  }

  async communicate(targetAgentId: string, message: string) {
    this.logger.debug('Sending message to agent', {
      targetAgentId,
      messageLength: message.length,
    });
  }
}

/**
 * Example 6: Swarm coordinator logger
 */
export class SwarmCoordinator {
  private logger: Logger;

  constructor(private swarmId: string) {
    this.logger = createSwarmLogger(swarmId);
  }

  async initializeSwarm(agentCount: number) {
    this.logger.info('Initializing swarm', {
      agentCount,
      topology: 'mesh',
      status: 'initializing',
    });

    const agents = await this.spawnAgents(agentCount);

    this.logger.info('Swarm initialized', {
      agentCount: agents.length,
      status: 'ready',
    });

    return agents;
  }

  private async spawnAgents(count: number) {
    this.logger.debug('Spawning agents', { count });
    // Spawn logic
    const agents: Agent[] = [];
    this.logger.debug('Agents spawned', { actualCount: agents.length });
    return agents;
  }

  async orchestrateTask(taskId: string) {
    this.logger.info('Orchestrating task across swarm', {
      taskId,
      status: 'started',
    });

    try {
      await this.distributeTask(taskId);
      this.logger.info('Task orchestration completed', {
        taskId,
        status: 'completed',
      });
    } catch (error) {
      this.logger.error('Task orchestration failed', {
        taskId,
        error,
        status: 'failed',
      });
      throw error;
    }
  }

  private async distributeTask(taskId: string) {
    this.logger.debug('Distributing task to agents', { taskId });
    // Distribution logic
  }
}

/**
 * Example 7: Task logger
 */
export class Task {
  private logger: Logger;

  constructor(private taskId: string) {
    this.logger = createTaskLogger(taskId);
  }

  async execute() {
    this.logger.info('Task execution started', { status: 'started' });

    const steps = ['validate', 'process', 'finalize'];

    for (const step of steps) {
      await this.executeStep(step);
    }

    this.logger.info('Task execution completed', {
      status: 'completed',
      stepsCompleted: steps.length,
    });
  }

  private async executeStep(step: string) {
    this.logger.debug('Executing step', { step, status: 'in_progress' });
    // Step logic
    this.logger.debug('Step completed', { step, status: 'completed' });
  }
}

// ============================================================================
// ADVANCED PATTERNS
// ============================================================================

/**
 * Example 8: Child loggers for request tracking
 */
export class RequestHandler {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('request-handler');
  }

  async handleRequest(requestId: string, userId: string) {
    // Create a child logger with request context
    const requestLogger = this.logger.child({ requestId, userId });

    requestLogger.info('Processing request');

    // Pass child logger to downstream services
    await this.validateRequest(requestLogger);
    await this.processRequest(requestLogger);
    await this.sendResponse(requestLogger);

    requestLogger.info('Request handled successfully');
  }

  private async validateRequest(logger: Logger) {
    logger.debug('Validating request');
    // Validation logic
  }

  private async processRequest(logger: Logger) {
    logger.debug('Processing request');
    // Processing logic
  }

  private async sendResponse(logger: Logger) {
    logger.debug('Sending response');
    // Response logic
  }
}

/**
 * Example 9: Performance monitoring with timing
 */
export class DataProcessor {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('data-processor');
  }

  async processLargeDataset(records: unknown[]) {
    this.logger.info('Starting batch processing', {
      recordCount: records.length,
    });

    const batches = this.createBatches(records, 100);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      await this.logger.time(
        `Batch ${i + 1}/${batches.length}`,
        async () => {
          return this.processBatch(batch);
        },
        {
          batchNumber: i + 1,
          batchSize: batch.length,
          totalBatches: batches.length,
        }
      );
    }

    this.logger.info('Batch processing completed', {
      totalRecords: records.length,
      batchCount: batches.length,
    });
  }

  private createBatches(records: unknown[], size: number) {
    const batches: unknown[][] = [];
    for (let i = 0; i < records.length; i += size) {
      batches.push(records.slice(i, i + size));
    }
    return batches;
  }

  private async processBatch(batch: unknown[]) {
    // Processing logic
    return batch;
  }
}

/**
 * Example 10: Error handling with context
 */
export class ServiceWithErrorHandling {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('error-handling-service');
  }

  async executeWithRetry(operation: string, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug('Attempting operation', {
          operation,
          attempt,
          maxRetries,
        });

        // Operation logic
        const result = await this.performOperation(operation);

        this.logger.info('Operation succeeded', {
          operation,
          attempt,
          success: true,
        });

        return result;
      } catch (error) {
        this.logger.warn('Operation failed', {
          operation,
          attempt,
          maxRetries,
          error,
          willRetry: attempt < maxRetries,
        });

        if (attempt === maxRetries) {
          this.logger.error('Operation failed after all retries', {
            operation,
            totalAttempts: maxRetries,
            error,
          });
          throw error;
        }

        // Wait before retry
        await this.sleep(1000 * attempt);
      }
    }
  }

  private async performOperation(operation: string) {
    // Operation logic
    return { success: true };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Example 11: Multi-level logging in a complex workflow
 */
export class WorkflowEngine {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('workflow-engine');
  }

  async executeWorkflow(workflowId: string, steps: string[]) {
    const workflowLogger = this.logger.child({ workflowId });

    workflowLogger.info('Workflow execution started', {
      totalSteps: steps.length,
      status: 'started',
    });

    const results = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepLogger = workflowLogger.child({
        step,
        stepNumber: i + 1,
      });

      try {
        const result = await stepLogger.time(
          `Step execution: ${step}`,
          async () => {
            return this.executeStep(step, stepLogger);
          },
          { stepNumber: i + 1, totalSteps: steps.length }
        );

        results.push(result);

        stepLogger.info('Step completed', {
          status: 'completed',
          progress: ((i + 1) / steps.length) * 100,
        });
      } catch (error) {
        stepLogger.error('Step failed', {
          error,
          status: 'failed',
          failedAt: i + 1,
        });
        throw error;
      }
    }

    workflowLogger.info('Workflow execution completed', {
      totalSteps: steps.length,
      status: 'completed',
      results: results.length,
    });

    return results;
  }

  private async executeStep(step: string, logger: Logger) {
    logger.debug('Preparing step execution', { step });
    // Step execution logic
    logger.verbose('Step execution details', { step, data: {} });
    return { success: true, step };
  }
}

// ============================================================================
// MIGRATION EXAMPLES
// ============================================================================

/**
 * Example 12: Migrating from console.log
 */
export class LegacyService {
  private logger: Logger;

  constructor() {
    this.logger = createComponentLogger('legacy-service');
  }

  // BEFORE: Using console.log
  async oldMethod() {
    // console.log('Starting operation');
    // console.error('Error occurred:', new Error('Something went wrong'));
    // console.debug('Debug info:', { data: 'value' });
  }

  // AFTER: Using structured logging
  async newMethod() {
    this.logger.info('Starting operation');
    this.logger.error('Error occurred', {
      error: new Error('Something went wrong'),
    });
    this.logger.debug('Debug info', { data: 'value' });
  }
}

/**
 * Example 13: Testing with logger
 */
export class TestableService {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || createComponentLogger('testable-service');
  }

  async doWork() {
    this.logger.info('Work started');
    // Work logic
    this.logger.info('Work completed');
    return { success: true };
  }
}

// In tests:
// const mockLogger = new Logger();
// jest.spyOn(mockLogger, 'info');
// const service = new TestableService(mockLogger);
// await service.doWork();
// expect(mockLogger.info).toHaveBeenCalledWith('Work started');
