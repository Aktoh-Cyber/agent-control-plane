# SPARC Orchestrator Mode

## Purpose

Multi-agent task orchestration with TodoWrite/TodoRead/Task/Memory using MCP tools.

## Activation

### Option 1: Using MCP Tools (Preferred in Claude Code)

```javascript
mcp__gendev__sparc_mode {
  mode: "orchestrator",
  task_description: "coordinate feature development"
}
```

### Option 2: Using NPX CLI (Fallback when MCP not available)

```bash
# Use when running from terminal or MCP tools unavailable
npx gendev sparc run orchestrator "coordinate feature development"

# For alpha features
npx gendev@alpha sparc run orchestrator "coordinate feature development"
```

### Option 3: Local Installation

```bash
# If gendev is installed locally
./gendev sparc run orchestrator "coordinate feature development"
```

## Core Capabilities

- Task decomposition
- Agent coordination
- Resource allocation
- Progress tracking
- Result synthesis

## Integration Examples

### Using MCP Tools (Preferred)

```javascript
// Initialize orchestration swarm
mcp__gendev__swarm_init {
  topology: "hierarchical",
  strategy: "auto",
  maxAgents: 8
}

// Spawn coordinator agent
mcp__gendev__agent_spawn {
  type: "coordinator",
  capabilities: ["task-planning", "resource-management"]
}

// Orchestrate tasks
mcp__gendev__task_orchestrate {
  task: "feature development",
  strategy: "parallel",
  dependencies: ["auth", "ui", "api"]
}
```

### Using NPX CLI (Fallback)

```bash
# Initialize orchestration swarm
npx gendev swarm init --topology hierarchical --strategy auto --max-agents 8

# Spawn coordinator agent
npx gendev agent spawn --type coordinator --capabilities "task-planning,resource-management"

# Orchestrate tasks
npx gendev task orchestrate --task "feature development" --strategy parallel --deps "auth,ui,api"
```

## Orchestration Patterns

- Hierarchical coordination
- Parallel execution
- Sequential pipelines
- Event-driven flows
- Adaptive strategies

## Coordination Tools

- TodoWrite for planning
- Task for agent launch
- Memory for sharing
- Progress monitoring
- Result aggregation

## Workflow Example

### Using MCP Tools (Preferred)

```javascript
// 1. Initialize orchestration swarm
mcp__gendev__swarm_init {
  topology: "hierarchical",
  maxAgents: 10
}

// 2. Create workflow
mcp__gendev__workflow_create {
  name: "feature-development",
  steps: ["design", "implement", "test", "deploy"]
}

// 3. Execute orchestration
mcp__gendev__sparc_mode {
  mode: "orchestrator",
  options: {parallel: true, monitor: true},
  task_description: "develop user management system"
}

// 4. Monitor progress
mcp__gendev__swarm_monitor {
  swarmId: "current",
  interval: 5000
}
```

### Using NPX CLI (Fallback)

```bash
# 1. Initialize orchestration swarm
npx gendev swarm init --topology hierarchical --max-agents 10

# 2. Create workflow
npx gendev workflow create --name "feature-development" --steps "design,implement,test,deploy"

# 3. Execute orchestration
npx gendev sparc run orchestrator "develop user management system" --parallel --monitor

# 4. Monitor progress
npx gendev swarm monitor --interval 5000
```
