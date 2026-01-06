/**
 * Swarm Test Fixtures
 * Pre-configured swarm scenarios for testing
 */

import { aJob, anAgent, aSwarmConfig, aTask } from '../builders';

/**
 * Small development swarm (2-3 agents)
 */
export function createSmallSwarm() {
  const agents = [
    anAgent().asCoder().withName('Coder').withId('agent-coder').build(),
    anAgent().asTester().withName('Tester').withId('agent-tester').build(),
  ];

  const tasks = [
    aTask().asCodingTask().withId('task-1').assignedTo('agent-coder').build(),
    aTask().asTestingTask().withId('task-2').assignedTo('agent-tester').dependsOn('task-1').build(),
  ];

  const job = aJob()
    .withName('Small Development Job')
    .withAgents(agents.map((a) => a.id))
    .withTasks(tasks.map((t) => t.id))
    .build();

  const config = aSwarmConfig().withTopology('pipeline').withMaxAgents(3).build();

  return { agents, tasks, job, config };
}

/**
 * Medium swarm (4-6 agents)
 */
export function createMediumSwarm() {
  const agents = [
    anAgent().asResearcher().withName('Researcher').withId('agent-researcher').build(),
    anAgent().asCoder().withName('Coder 1').withId('agent-coder-1').build(),
    anAgent().asCoder().withName('Coder 2').withId('agent-coder-2').build(),
    anAgent().asTester().withName('Tester').withId('agent-tester').build(),
    anAgent().asReviewer().withName('Reviewer').withId('agent-reviewer').build(),
  ];

  const tasks = [
    aTask().withType('research').withId('task-research').assignedTo('agent-researcher').build(),
    aTask()
      .asCodingTask()
      .withId('task-code-1')
      .assignedTo('agent-coder-1')
      .dependsOn('task-research')
      .build(),
    aTask()
      .asCodingTask()
      .withId('task-code-2')
      .assignedTo('agent-coder-2')
      .dependsOn('task-research')
      .build(),
    aTask()
      .asTestingTask()
      .withId('task-test')
      .assignedTo('agent-tester')
      .dependsOn('task-code-1')
      .dependsOn('task-code-2')
      .build(),
    aTask()
      .asReviewTask()
      .withId('task-review')
      .assignedTo('agent-reviewer')
      .dependsOn('task-test')
      .build(),
  ];

  const job = aJob()
    .withName('Medium Development Job')
    .withAgents(agents.map((a) => a.id))
    .withTasks(tasks.map((t) => t.id))
    .withParallel(true)
    .build();

  const config = aSwarmConfig()
    .withTopology('mesh')
    .withMaxAgents(6)
    .withConsensus('gossip')
    .build();

  return { agents, tasks, job, config };
}

/**
 * Large swarm (10+ agents)
 */
export function createLargeSwarm() {
  const agents = [
    anAgent().asArchitect().withName('Architect').withId('agent-architect').build(),
    ...Array.from({ length: 4 }, (_, i) =>
      anAgent()
        .asCoder()
        .withName(`Coder ${i + 1}`)
        .withId(`agent-coder-${i + 1}`)
        .build()
    ),
    ...Array.from({ length: 3 }, (_, i) =>
      anAgent()
        .asTester()
        .withName(`Tester ${i + 1}`)
        .withId(`agent-tester-${i + 1}`)
        .build()
    ),
    ...Array.from({ length: 2 }, (_, i) =>
      anAgent()
        .asReviewer()
        .withName(`Reviewer ${i + 1}`)
        .withId(`agent-reviewer-${i + 1}`)
        .build()
    ),
  ];

  const tasks = [
    aTask().withType('architecture').withId('task-arch').assignedTo('agent-architect').build(),
    ...Array.from({ length: 8 }, (_, i) =>
      aTask()
        .asCodingTask()
        .withId(`task-code-${i + 1}`)
        .assignedTo(`agent-coder-${(i % 4) + 1}`)
        .dependsOn('task-arch')
        .build()
    ),
    ...Array.from({ length: 6 }, (_, i) =>
      aTask()
        .asTestingTask()
        .withId(`task-test-${i + 1}`)
        .assignedTo(`agent-tester-${(i % 3) + 1}`)
        .build()
    ),
  ];

  const job = aJob()
    .withName('Large Development Job')
    .withAgents(agents.map((a) => a.id))
    .withTasks(tasks.map((t) => t.id))
    .withParallel(true)
    .withAutoScale()
    .build();

  const config = aSwarmConfig()
    .asHierarchical()
    .withMaxAgents(15)
    .withAutoScale()
    .withConsensus('raft')
    .build();

  return { agents, tasks, job, config };
}

/**
 * Hierarchical swarm topology
 */
export function createHierarchicalSwarm() {
  const coordinator = anAgent()
    .withRole('coordinator')
    .withName('Coordinator')
    .withId('agent-coordinator')
    .build();

  const workers = Array.from({ length: 4 }, (_, i) =>
    anAgent()
      .asCoder()
      .withName(`Worker ${i + 1}`)
      .withId(`agent-worker-${i + 1}`)
      .inSwarm('swarm-hierarchical')
      .build()
  );

  const config = aSwarmConfig()
    .asHierarchical()
    .withMaxAgents(5)
    .withCoordinator('hierarchical', 3, 300000)
    .build();

  return { coordinator, workers, agents: [coordinator, ...workers], config };
}

/**
 * Mesh swarm topology
 */
export function createMeshSwarm() {
  const agents = Array.from({ length: 6 }, (_, i) =>
    anAgent()
      .asCoder()
      .withName(`Peer ${i + 1}`)
      .withId(`agent-peer-${i + 1}`)
      .inSwarm('swarm-mesh')
      .build()
  );

  const config = aSwarmConfig().asMesh().withMaxAgents(6).withConsensus('gossip').build();

  return { agents, config };
}

/**
 * Pipeline swarm topology
 */
export function createPipelineSwarm() {
  const stages = [
    anAgent().asResearcher().withName('Research Stage').withId('stage-research').build(),
    anAgent().asCoder().withName('Development Stage').withId('stage-dev').build(),
    anAgent().asTester().withName('Testing Stage').withId('stage-test').build(),
    anAgent().asReviewer().withName('Review Stage').withId('stage-review').build(),
  ];

  const tasks = stages.map((agent, i) =>
    aTask()
      .withId(`task-stage-${i + 1}`)
      .assignedTo(agent.id)
      .withTitle(`Stage ${i + 1}`)
      .build()
  );

  const config = aSwarmConfig().asPipeline().withMaxAgents(4).withParallel(false).build();

  return { stages, tasks, agents: stages, config };
}

/**
 * Swarm with failures
 */
export function createSwarmWithFailures() {
  const agents = [
    anAgent().asCoder().withName('Healthy Agent').withId('agent-healthy').build(),
    anAgent().asCoder().asFailed().withName('Failed Agent').withId('agent-failed').build(),
    anAgent()
      .asCoder()
      .withStatus('paused')
      .withName('Paused Agent')
      .withId('agent-paused')
      .build(),
  ];

  const tasks = [
    aTask().asCompleted().withId('task-success').assignedTo('agent-healthy').build(),
    aTask().asFailed().withId('task-failure').assignedTo('agent-failed').build(),
    aTask().withStatus('pending').withId('task-pending').assignedTo('agent-paused').build(),
  ];

  const job = aJob()
    .asFailed()
    .withName('Job with Failures')
    .withAgents(agents.map((a) => a.id))
    .withTasks(tasks.map((t) => t.id))
    .withProgress(3, 1, 1)
    .build();

  return { agents, tasks, job };
}

/**
 * Load test swarm (stress testing)
 */
export function createLoadTestSwarm(agentCount: number = 100) {
  const agents = Array.from({ length: agentCount }, (_, i) =>
    anAgent()
      .asCoder()
      .withName(`Agent ${i + 1}`)
      .withId(`agent-${i + 1}`)
      .build()
  );

  const tasks = Array.from({ length: agentCount * 2 }, (_, i) =>
    aTask()
      .asCodingTask()
      .withId(`task-${i + 1}`)
      .assignedTo(`agent-${(i % agentCount) + 1}`)
      .build()
  );

  const job = aJob()
    .withName('Load Test Job')
    .withAgents(agents.map((a) => a.id))
    .withTasks(tasks.map((t) => t.id))
    .withParallel(true)
    .withAutoScale()
    .build();

  const config = aSwarmConfig().asMesh().withMaxAgents(agentCount).withAutoScale().build();

  return { agents, tasks, job, config };
}
