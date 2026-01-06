/**
 * Common Test Fixtures
 * Reusable test data for common scenarios
 */

import { aJob, anAgent, aTask, aUser } from '../builders';

/**
 * Sample users for testing
 */
export const sampleUsers = {
  admin: () => aUser().asAdmin().withEmail('admin@test.com').build(),
  regularUser: () => aUser().withEmail('user@test.com').build(),
  guestUser: () => aUser().asGuest().withEmail('guest@test.com').build(),
  inactiveUser: () => aUser().asInactive().withEmail('inactive@test.com').build(),
  noCreditsUser: () => aUser().withNoCredits().withEmail('broke@test.com').build(),
};

/**
 * Sample agents for testing
 */
export const sampleAgents = {
  researcher: () => anAgent().asResearcher().withName('Research Agent').build(),
  coder: () => anAgent().asCoder().withName('Coding Agent').build(),
  tester: () => anAgent().asTester().withName('Testing Agent').build(),
  reviewer: () => anAgent().asReviewer().withName('Review Agent').build(),
  architect: () => anAgent().asArchitect().withName('Architecture Agent').build(),
  runningAgent: () => anAgent().asRunning().withName('Active Agent').build(),
  failedAgent: () => anAgent().asFailed().withName('Failed Agent').build(),
};

/**
 * Sample tasks for testing
 */
export const sampleTasks = {
  codingTask: () =>
    aTask()
      .asCodingTask()
      .withTitle('Implement feature X')
      .withDescription('Build new feature')
      .build(),

  testingTask: () =>
    aTask()
      .asTestingTask()
      .withTitle('Test feature X')
      .withDescription('Write comprehensive tests')
      .build(),

  reviewTask: () =>
    aTask()
      .asReviewTask()
      .withTitle('Review PR #123')
      .withDescription('Code review for pull request')
      .build(),

  completedTask: () =>
    aTask().asCompleted().withTitle('Completed task').withResult({ success: true }).build(),

  failedTask: () =>
    aTask().asFailed().withTitle('Failed task').withError('Task execution failed').build(),

  criticalTask: () =>
    aTask()
      .asCritical()
      .withTitle('URGENT: Fix production bug')
      .withDescription('Critical production issue')
      .build(),
};

/**
 * Sample jobs for testing
 */
export const sampleJobs = {
  swarmJob: () =>
    aJob()
      .asSwarmJob()
      .withName('Development Swarm')
      .withTasks(['task-1', 'task-2', 'task-3'])
      .withAgents(['agent-1', 'agent-2'])
      .build(),

  pipelineJob: () =>
    aJob()
      .asPipelineJob()
      .withName('CI/CD Pipeline')
      .withTasks(['build', 'test', 'deploy'])
      .build(),

  runningJob: () => aJob().asRunning().withName('Active Job').withProgress(10, 5, 0).build(),

  completedJob: () =>
    aJob()
      .asCompleted()
      .withName('Finished Job')
      .withResult({ success: true, output: 'Job completed successfully' })
      .build(),

  failedJob: () =>
    aJob().asFailed().withName('Failed Job').withError('Job execution failed').build(),
};

/**
 * Sample API responses
 */
export const sampleAPIResponses = {
  success: {
    status: 200,
    data: {
      success: true,
      message: 'Operation successful',
    },
  },

  created: {
    status: 201,
    data: {
      id: 'new-resource-123',
      created: true,
    },
  },

  notFound: {
    status: 404,
    data: {
      error: 'Resource not found',
    },
  },

  unauthorized: {
    status: 401,
    data: {
      error: 'Unauthorized',
    },
  },

  validationError: {
    status: 400,
    data: {
      error: 'Validation failed',
      errors: [{ field: 'email', message: 'Invalid email format' }],
    },
  },

  serverError: {
    status: 500,
    data: {
      error: 'Internal server error',
    },
  },
};

/**
 * Sample error scenarios
 */
export const sampleErrors = {
  networkError: new Error('Network request failed'),
  timeoutError: new Error('Request timeout'),
  validationError: new Error('Validation failed'),
  authenticationError: new Error('Authentication required'),
  authorizationError: new Error('Permission denied'),
  notFoundError: new Error('Resource not found'),
  conflictError: new Error('Resource already exists'),
};

/**
 * Common test data
 */
export const commonTestData = {
  emails: ['test1@example.com', 'test2@example.com', 'admin@test.com', 'user@test.com'],

  names: ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown'],

  ids: ['id-123', 'id-456', 'id-789', 'id-abc'],

  timestamps: [
    new Date('2024-01-01T00:00:00Z'),
    new Date('2024-06-01T00:00:00Z'),
    new Date('2024-12-01T00:00:00Z'),
  ],

  tags: ['development', 'testing', 'production', 'staging'],
};
