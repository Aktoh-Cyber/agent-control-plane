/**
 * Workflow Test Fixtures
 * Pre-configured workflow scenarios for testing
 */

import { aJob, aTask, anAgent } from '../builders';

/**
 * Simple linear workflow
 */
export function createLinearWorkflow() {
  const tasks = [
    aTask().withTitle('Step 1: Planning').withId('task-1').build(),
    aTask().withTitle('Step 2: Development').withId('task-2').dependsOn('task-1').build(),
    aTask().withTitle('Step 3: Testing').withId('task-3').dependsOn('task-2').build(),
    aTask().withTitle('Step 4: Deployment').withId('task-4').dependsOn('task-3').build(),
  ];

  const agents = [
    anAgent().asArchitect().withId('agent-1').build(),
    anAgent().asCoder().withId('agent-2').build(),
    anAgent().asTester().withId('agent-3').build(),
    anAgent().withRole('coordinator').withId('agent-4').build(),
  ];

  return { tasks, agents };
}

/**
 * Parallel workflow with synchronization
 */
export function createParallelWorkflow() {
  const tasks = [
    aTask().withTitle('Initialize').withId('task-init').build(),
    aTask().withTitle('Frontend Dev').withId('task-frontend').dependsOn('task-init').build(),
    aTask().withTitle('Backend Dev').withId('task-backend').dependsOn('task-init').build(),
    aTask().withTitle('Database Setup').withId('task-db').dependsOn('task-init').build(),
    aTask()
      .withTitle('Integration')
      .withId('task-integration')
      .dependsOn('task-frontend')
      .dependsOn('task-backend')
      .dependsOn('task-db')
      .build(),
  ];

  const agents = [
    anAgent().asArchitect().withId('agent-init').build(),
    anAgent().asCoder().withId('agent-frontend').build(),
    anAgent().asCoder().withId('agent-backend').build(),
    anAgent().withType('database').withId('agent-db').build(),
    anAgent().asTester().withId('agent-integration').build(),
  ];

  return { tasks, agents };
}

/**
 * Conditional workflow (branching)
 */
export function createConditionalWorkflow() {
  const tasks = [
    aTask().withTitle('Check Requirements').withId('task-check').build(),
    aTask()
      .withTitle('Path A: Quick Fix')
      .withId('task-path-a')
      .dependsOn('task-check')
      .withTag('conditional-a')
      .build(),
    aTask()
      .withTitle('Path B: Full Refactor')
      .withId('task-path-b')
      .dependsOn('task-check')
      .withTag('conditional-b')
      .build(),
    aTask().withTitle('Finalize').withId('task-finalize').dependsOn('task-path-a').build(),
  ];

  const agents = [
    anAgent().asReviewer().withId('agent-checker').build(),
    anAgent().asCoder().withId('agent-quick').build(),
    anAgent().asArchitect().withId('agent-refactor').build(),
    anAgent().asTester().withId('agent-final').build(),
  ];

  return { tasks, agents };
}

/**
 * Iterative workflow (loop)
 */
export function createIterativeWorkflow() {
  const iterations = 3;
  const tasks = [];

  for (let i = 0; i < iterations; i++) {
    tasks.push(
      aTask()
        .withTitle(`Iteration ${i + 1}: Code`)
        .withId(`task-code-${i}`)
        .withTag(`iteration-${i}`)
        .build()
    );

    tasks.push(
      aTask()
        .withTitle(`Iteration ${i + 1}: Test`)
        .withId(`task-test-${i}`)
        .dependsOn(`task-code-${i}`)
        .withTag(`iteration-${i}`)
        .build()
    );

    tasks.push(
      aTask()
        .withTitle(`Iteration ${i + 1}: Review`)
        .withId(`task-review-${i}`)
        .dependsOn(`task-test-${i}`)
        .withTag(`iteration-${i}`)
        .build()
    );
  }

  const agents = [
    anAgent().asCoder().withId('agent-coder').build(),
    anAgent().asTester().withId('agent-tester').build(),
    anAgent().asReviewer().withId('agent-reviewer').build(),
  ];

  return { tasks, agents, iterations };
}

/**
 * Error handling workflow
 */
export function createErrorHandlingWorkflow() {
  const tasks = [
    aTask().withTitle('Main Task').withId('task-main').build(),
    aTask().withTitle('Fallback Task').withId('task-fallback').withTag('fallback').build(),
    aTask().withTitle('Retry Task').withId('task-retry').withTag('retry').build(),
    aTask().withTitle('Recovery Task').withId('task-recovery').dependsOn('task-fallback').build(),
  ];

  const agents = [
    anAgent().asCoder().withId('agent-main').build(),
    anAgent().asCoder().withId('agent-fallback').build(),
    anAgent().asReviewer().withId('agent-recovery').build(),
  ];

  const failedTask = aTask().asFailed().withTitle('Failed Task').withId('task-failed').build();

  return { tasks, agents, failedTask };
}

/**
 * Multi-stage pipeline workflow
 */
export function createMultiStagePipeline() {
  const stages = [
    {
      name: 'Build',
      tasks: [
        aTask().withTitle('Compile').withId('task-compile').build(),
        aTask().withTitle('Bundle').withId('task-bundle').dependsOn('task-compile').build(),
      ],
    },
    {
      name: 'Test',
      tasks: [
        aTask().withTitle('Unit Tests').withId('task-unit').dependsOn('task-bundle').build(),
        aTask()
          .withTitle('Integration Tests')
          .withId('task-integration')
          .dependsOn('task-bundle')
          .build(),
        aTask().withTitle('E2E Tests').withId('task-e2e').dependsOn('task-bundle').build(),
      ],
    },
    {
      name: 'Deploy',
      tasks: [
        aTask()
          .withTitle('Stage Deploy')
          .withId('task-stage')
          .dependsOn('task-unit')
          .dependsOn('task-integration')
          .dependsOn('task-e2e')
          .build(),
        aTask().withTitle('Prod Deploy').withId('task-prod').dependsOn('task-stage').build(),
      ],
    },
  ];

  const allTasks = stages.flatMap((stage) => stage.tasks);

  const job = aJob()
    .asPipelineJob()
    .withName('CI/CD Pipeline')
    .withTasks(allTasks.map((t) => t.id))
    .build();

  return { stages, tasks: allTasks, job };
}

/**
 * Dynamic workflow (runtime task creation)
 */
export function createDynamicWorkflow() {
  const initialTasks = [
    aTask().withTitle('Analyze Requirements').withId('task-analyze').build(),
    aTask().withTitle('Generate Tasks').withId('task-generate').dependsOn('task-analyze').build(),
  ];

  const dynamicTasks = Array.from({ length: 5 }, (_, i) =>
    aTask()
      .withTitle(`Dynamic Task ${i + 1}`)
      .withId(`task-dynamic-${i}`)
      .dependsOn('task-generate')
      .withMetadata('dynamic', true)
      .build()
  );

  const finalizationTask = aTask().withTitle('Finalize').withId('task-finalize').build();

  // Add dependencies on all dynamic tasks
  dynamicTasks.forEach((task) => {
    finalizationTask.dependencies.push(task.id);
  });

  return {
    initial: initialTasks,
    dynamic: dynamicTasks,
    finalization: finalizationTask,
    all: [...initialTasks, ...dynamicTasks, finalizationTask],
  };
}

/**
 * Resource-constrained workflow
 */
export function createResourceConstrainedWorkflow() {
  const highPriorityTasks = [
    aTask().asCritical().withTitle('Critical Bug Fix').withId('task-critical-1').build(),
    aTask().asCritical().withTitle('Security Patch').withId('task-critical-2').build(),
  ];

  const normalPriorityTasks = [
    aTask().withPriority('medium').withTitle('Feature A').withId('task-feature-a').build(),
    aTask().withPriority('medium').withTitle('Feature B').withId('task-feature-b').build(),
  ];

  const lowPriorityTasks = [
    aTask().withPriority('low').withTitle('Documentation').withId('task-docs').build(),
    aTask().withPriority('low').withTitle('Code Cleanup').withId('task-cleanup').build(),
  ];

  const limitedAgents = [
    anAgent().asCoder().withId('agent-1').build(),
    anAgent().asCoder().withId('agent-2').build(),
  ];

  return {
    highPriority: highPriorityTasks,
    normalPriority: normalPriorityTasks,
    lowPriority: lowPriorityTasks,
    agents: limitedAgents,
    all: [...highPriorityTasks, ...normalPriorityTasks, ...lowPriorityTasks],
  };
}
