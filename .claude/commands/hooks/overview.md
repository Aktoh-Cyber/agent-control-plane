# Claude Code Hooks for gendev

## Purpose

Automatically coordinate, format, and learn from Claude Code operations using hooks with MCP tool integration.

## Available Hooks

### Pre-Operation Hooks

- **pre-edit**: Validate and assign agents before file modifications
- **pre-bash**: Check command safety and resource requirements
- **pre-task**: Auto-spawn agents for complex tasks

### Post-Operation Hooks

- **post-edit**: Auto-format code, train neural patterns, update memory
- **post-bash**: Log execution and update metrics
- **post-search**: Cache results and improve search patterns

### MCP Integration Hooks

- **mcp-initialized**: Persist swarm configuration
- **agent-spawned**: Update agent roster and memory
- **task-orchestrated**: Monitor task progress through memory
- **neural-trained**: Save pattern improvements

### Memory Coordination Hooks

- **memory-write**: Triggered when agents write to coordination memory
- **memory-read**: Triggered when agents read from coordination memory
- **memory-sync**: Synchronize memory across swarm agents

### Session Hooks

- **notify**: Custom notifications with swarm status
- **session-end**: Generate summary and save state
- **session-restore**: Load previous session state

## Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [
          {
            "type": "command",
            "command": "npx gendev hook pre-edit --file '${tool.params.file_path}' --memory-key 'swarm/editor/current'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "^(Write|Edit|MultiEdit)$",
        "hooks": [
          {
            "type": "command",
            "command": "npx gendev hook post-edit --file '${tool.params.file_path}' --memory-key 'swarm/editor/complete'"
          }
        ]
      }
    ]
  }
}
```

## MCP Tool Integration in Hooks

Hooks automatically trigger MCP tools for coordination:

```javascript
// Pre-task hook spawns agents
npx gendev hook pre-task --description "[task]"
// Internally calls:
mcp__gendev__agent_spawn { type: "appropriate-agent" }

// Post-edit hook updates memory
npx gendev hook post-edit --file "[file]"
// Internally calls:
mcp__gendev__memory_usage {
  action: "store",
  key: "swarm/editor/[file]",
  namespace: "coordination",
  value: JSON.stringify({ file, changes, timestamp })
}

// Session-end hook persists state
npx gendev hook session-end
// Internally calls:
mcp__gendev__memory_persist { sessionId: "[session-id]" }
```

## Memory Coordination Protocol

All hooks follow the mandatory memory write pattern:

```javascript
// 1. STATUS - Hook starts
mcp__gendev__memory_usage {
  action: "store",
  key: "swarm/hooks/[hook-name]/status",
  namespace: "coordination",
  value: JSON.stringify({ status: "running", hook: "[name]" })
}

// 2. PROGRESS - Hook processes
mcp__gendev__memory_usage {
  action: "store",
  key: "swarm/hooks/[hook-name]/progress",
  namespace: "coordination",
  value: JSON.stringify({ progress: 50, action: "processing" })
}

// 3. COMPLETE - Hook finishes
mcp__gendev__memory_usage {
  action: "store",
  key: "swarm/hooks/[hook-name]/complete",
  namespace: "coordination",
  value: JSON.stringify({ status: "complete", result: "success" })
}
```

## Benefits

- 🤖 Automatic agent assignment based on file type
- 🎨 Consistent code formatting
- 🧠 Continuous neural pattern improvement
- 💾 Cross-session memory persistence via MCP tools
- 📊 Performance metrics tracking through memory
- 🔄 Automatic memory coordination between agents
- 🎯 Smart agent spawning based on task analysis

## See Also

- [Pre-Edit Hook](./pre-edit.md)
- [Post-Edit Hook](./post-edit.md)
- [Session End Hook](./session-end.md)
- [Memory Usage](../memory/memory-usage.md)
- [Agent Spawning](../agents/agent-spawning.md)
