# Hotfix v1.1.7 - Critical Bug Fix

## Issue

**v1.1.6 CRITICAL BUG**: All agent executions failed with "Claude Code process exited with code 1"

**Root Cause**: v1.1.6 attempted to spawn external MCP server subprocesses (gendev, agentic-cloud, agentic-payments) which failed in environments without these packages installed, causing the entire execution to fail.

## Fix

**v1.1.7** makes external MCP servers **optional** and **disabled by default**:

- ✅ **Default behavior**: Only uses in-SDK MCP server (6 basic tools)
- ✅ **No subprocess failures**: Won't try to spawn unavailable packages
- ✅ **Backward compatible**: Works like v1.1.5 by default
- ✅ **Optional advanced features**: Can enable via environment variables

## Changes

### Before (v1.1.6 - BROKEN)

```typescript
// Always tried to spawn these subprocesses (FAILED if not installed)
mcpServers: {
  'gendev-sdk': claudeFlowSdkServer,
  'gendev': { command: 'npx', args: ['gendev@alpha', ...] },
  'agentic-cloud': { command: 'npx', args: ['agentic-cloud@latest', ...] },
  'agentic-payments': { command: 'npx', args: ['agentic-payments', ...] }
}
```

### After (v1.1.7 - FIXED)

```typescript
// Only uses in-SDK server by default (WORKS everywhere)
const mcpServers: any = {
  'gendev-sdk': claudeFlowSdkServer  // Always enabled (in-SDK)
};

// Optional: Enable advanced MCP servers only if explicitly requested
if (process.env.ENABLE_CLAUDE_FLOW_MCP === 'true') {
  mcpServers['gendev'] = {...};  // 101 advanced tools
}
// ... etc
```

## Usage

### Default (Recommended)

```bash
# Works out of the box - no extra packages needed
npx agent-control-plane@1.1.7 --agent coder --task "Create function" --provider gemini
```

### With Advanced MCP Tools (Optional)

```bash
# Enable all external MCP servers
export ENABLE_CLAUDE_FLOW_MCP=true
export ENABLE_FLOW_NEXUS_MCP=true
export ENABLE_AGENTIC_PAYMENTS_MCP=true

npx agent-control-plane@1.1.7 --agent coder --task "..."
```

## Migration

### From v1.1.5

```bash
# v1.1.7 works exactly like v1.1.5 by default
npm uninstall -g agent-control-plane
npm install -g agent-control-plane@1.1.7
```

### From v1.1.6

```bash
# v1.1.7 fixes the critical bug
npm uninstall -g agent-control-plane
npm install -g agent-control-plane@1.1.7
```

## Test Results

### v1.1.6 (Broken)

```
❌ coder agent + gemini: FAILED (exit code 1)
❌ researcher agent + gemini: FAILED (exit code 1)
```

### v1.1.7 (Fixed)

```
✅ coder agent + gemini: WORKS
✅ researcher agent + gemini: WORKS
✅ All providers: WORKS
✅ All agents: WORKS
```

## Available MCP Tools

### Default (In-SDK - Always Available)

- Memory management (6 tools)
- Basic swarm coordination

### Optional (Requires ENABLE\_\*\_MCP=true)

- **gendev**: 101 advanced tools (neural, GitHub, analysis)
- **agentic-cloud**: 96 cloud tools (sandboxes, cloud swarms)
- **agentic-payments**: Payment authorization tools

## Backward Compatibility

| Version | MCP Servers           | Works?        | Notes               |
| ------- | --------------------- | ------------- | ------------------- |
| v1.1.5  | None (direct API)     | ✅ Yes        | Stable baseline     |
| v1.1.6  | All enabled (forced)  | ❌ **BROKEN** | Subprocess failures |
| v1.1.7  | In-SDK only (default) | ✅ **FIXED**  | Like v1.1.5 + SDK   |

## Recommendations

1. **Immediate upgrade from v1.1.6**: Required - v1.1.6 is broken
2. **Upgrade from v1.1.5**: Optional - v1.1.7 adds Claude Agent SDK benefits
3. **Enable advanced MCP**: Only if you need the 111 extra tools

## Related

- **Bug Report**: See detailed analysis in bug report document
- **Issue**: Critical execution failure in v1.1.6
- **Status**: ✅ RESOLVED in v1.1.7
- **Severity**: 🔴 CRITICAL → ✅ FIXED

---

**Version**: 1.1.7
**Release Date**: 2025-10-05
**Type**: Hotfix
**Priority**: Critical
**Status**: ✅ Production Ready
