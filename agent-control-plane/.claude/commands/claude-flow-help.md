---
name: gendev-help
description: Show Claude-Flow commands and usage
---

# Claude-Flow Commands

## 🌊 Claude-Flow: Agent Orchestration Platform

Claude-Flow is the ultimate multi-terminal orchestration platform that revolutionizes how you work with Claude Code.

## Core Commands

### 🚀 System Management

- `./gendev start` - Start orchestration system
- `./gendev start --ui` - Start with interactive process management UI
- `./gendev status` - Check system status
- `./gendev monitor` - Real-time monitoring
- `./gendev stop` - Stop orchestration

### 🤖 Agent Management

- `./gendev agent spawn <type>` - Create new agent
- `./gendev agent list` - List active agents
- `./gendev agent info <id>` - Agent details
- `./gendev agent terminate <id>` - Stop agent

### 📋 Task Management

- `./gendev task create <type> "description"` - Create task
- `./gendev task list` - List all tasks
- `./gendev task status <id>` - Task status
- `./gendev task cancel <id>` - Cancel task
- `./gendev task workflow <file>` - Execute workflow

### 🧠 Memory Operations

- `./gendev memory store "key" "value"` - Store data
- `./gendev memory query "search"` - Search memory
- `./gendev memory stats` - Memory statistics
- `./gendev memory export <file>` - Export memory
- `./gendev memory import <file>` - Import memory

### ⚡ SPARC Development

- `./gendev sparc "task"` - Run SPARC orchestrator
- `./gendev sparc modes` - List all 17+ SPARC modes
- `./gendev sparc run <mode> "task"` - Run specific mode
- `./gendev sparc tdd "feature"` - TDD workflow
- `./gendev sparc info <mode>` - Mode details

### 🐝 Swarm Coordination

- `./gendev swarm "task" --strategy <type>` - Start swarm
- `./gendev swarm "task" --background` - Long-running swarm
- `./gendev swarm "task" --monitor` - With monitoring
- `./gendev swarm "task" --ui` - Interactive UI
- `./gendev swarm "task" --distributed` - Distributed coordination

### 🌍 MCP Integration

- `./gendev mcp status` - MCP server status
- `./gendev mcp tools` - List available tools
- `./gendev mcp config` - Show configuration
- `./gendev mcp logs` - View MCP logs

### 🤖 Claude Integration

- `./gendev claude spawn "task"` - Spawn Claude with enhanced guidance
- `./gendev claude batch <file>` - Execute workflow configuration

## 🌟 Quick Examples

### Initialize with SPARC:

```bash
npx -y gendev@latest init --sparc
```

### Start a development swarm:

```bash
./gendev swarm "Build REST API" --strategy development --monitor --review
```

### Run TDD workflow:

```bash
./gendev sparc tdd "user authentication"
```

### Store project context:

```bash
./gendev memory store "project_requirements" "e-commerce platform specs" --namespace project
```

### Spawn specialized agents:

```bash
./gendev agent spawn researcher --name "Senior Researcher" --priority 8
./gendev agent spawn developer --name "Lead Developer" --priority 9
```

## 🎯 Best Practices

- Use `./gendev` instead of `npx gendev` after initialization
- Store important context in memory for cross-session persistence
- Use swarm mode for complex tasks requiring multiple agents
- Enable monitoring for real-time progress tracking
- Use background mode for tasks > 30 minutes

## 📚 Resources

- Documentation: https://github.com/ruvnet/claude-code-flow/docs
- Examples: https://github.com/ruvnet/claude-code-flow/examples
- Issues: https://github.com/ruvnet/claude-code-flow/issues
