# MCP Tools with Proxy - Validation Results

## Summary

**MCP tools work with Anthropic (direct API), but have limitations with proxy providers (Gemini, OpenRouter).**

## Test Results

### ✅ Anthropic Provider (Direct) + MCP

```bash
export ENABLE_CLAUDE_FLOW_SDK=true
node dist/cli-proxy.js --agent coder --task "Use mcp__gendev-sdk__memory_store to save key='direct-test' value='MCP confirmed working'" --provider anthropic
```

**Result**: ✅ **WORKING**

- MCP tools listed: 7 tools available
- Memory store successful: `direct-test=MCP confirmed working` (21 bytes)
- All MCP tools accessible

**Available MCP Tools with Anthropic**:

1. `mcp__gendev-sdk__memory_store` - Store persistent memory
2. `mcp__gendev-sdk__memory_retrieve` - Retrieve from memory
3. `mcp__gendev-sdk__memory_search` - Search memory patterns
4. `mcp__gendev-sdk__swarm_init` - Initialize swarm
5. `mcp__gendev-sdk__agent_spawn` - Spawn agents
6. `mcp__gendev-sdk__task_orchestrate` - Orchestrate tasks
7. `mcp__gendev-sdk__swarm_status` - Get swarm status

### ⚠️ Gemini Provider (Proxy) + MCP

```bash
export ENABLE_CLAUDE_FLOW_SDK=true
export GOOGLE_GEMINI_API_KEY="..."
node dist/cli-proxy.js --agent coder --task "Use MCP to store data" --provider gemini
```

**Result**: ⚠️ **MCP TOOLS NOT RECOGNIZED**

- Proxy starts correctly on port 3000
- Gemini API calls work
- But MCP tools are NOT exposed to Gemini models
- Model response: "I lack the capability to execute code that interacts with external tools"

**Issue**: Claude Agent SDK may not pass MCP servers to proxy-based providers

### ⏱️ OpenRouter Provider (Proxy) + MCP

```bash
export ENABLE_CLAUDE_FLOW_SDK=true
export OPENROUTER_API_KEY="..."
node dist/cli-proxy.js --agent coder --task "Use MCP tools" --provider openrouter
```

**Result**: ⏱️ **TIMEOUT (60+ seconds)**

- Proxy starts correctly
- But test hangs when trying to use MCP tools
- Likely same issue as Gemini

## Root Cause Analysis

### Why MCP Works with Anthropic But Not Proxies

**Code Location**: `src/agents/claudeAgent.ts:193-202`

```typescript
const queryOptions: any = {
  systemPrompt: agent.systemPrompt,
  model: finalModel,
  permissionMode: 'bypassPermissions',
  allowedTools: [
    'Read',
    'Write',
    'Edit',
    'Bash',
    'Glob',
    'Grep',
    'WebFetch',
    'WebSearch',
    'NotebookEdit',
    'TodoWrite',
  ],
  mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined, // ✅ MCP configured
};

// Add environment overrides for proxy
if (Object.keys(envOverrides).length > 0) {
  queryOptions.env = {
    ...process.env,
    ...envOverrides, // Contains ANTHROPIC_BASE_URL for proxy
  };
}
```

**The Issue**:

1. Claude Agent SDK's `query()` function receives `mcpServers` configuration
2. When `env.ANTHROPIC_BASE_URL` is set (for proxy), SDK might:
   - Route API calls through proxy ✅
   - But NOT pass MCP tool definitions to the proxied model ❌
3. Gemini/OpenRouter see the request but without MCP tool schemas

### Why This Happens

The Claude Agent SDK likely:

1. Connects to MCP servers locally (✅ works)
2. Sends tool schemas to Anthropic API directly (✅ works)
3. When proxy is used, tool schemas may not be forwarded (❌ issue)

**Proxy Translation Flow**:

```
[Claude Agent SDK]
  ↓ (with MCP tools)
[ANTHROPIC_BASE_URL=proxy]
  ↓ (MCP tools lost?)
[Gemini/OpenRouter Proxy]
  ↓ (no MCP schemas)
[Gemini/OpenRouter API]
  ↓
Model: "I don't have access to MCP tools"
```

## Workarounds

### Option 1: Use Anthropic for MCP Tasks

```bash
# For tasks requiring MCP tools, use Anthropic provider
export ENABLE_CLAUDE_FLOW_SDK=true
npx agent-control-plane --agent coder --task "Store data in MCP" --provider anthropic
```

### Option 2: Use Proxy for Simple Tasks

```bash
# For tasks NOT needing MCP, use Gemini/OpenRouter
npx agent-control-plane --agent coder --task "Write code" --provider gemini
# MCP not available, but basic tools (Read/Write/Bash) work
```

### Option 3: Separate MCP from Proxy Workflows

```bash
# Step 1: Generate code with cheap provider
npx agent-control-plane --agent coder --task "Create function" --provider openrouter

# Step 2: Store results with Anthropic + MCP
export ENABLE_CLAUDE_FLOW_SDK=true
npx agent-control-plane --agent coder --task "Store results in MCP" --provider anthropic
```

## Current Capabilities Matrix

| Provider   | Proxy     | Basic Tools          | MCP Tools              | Cost Savings |
| ---------- | --------- | -------------------- | ---------------------- | ------------ |
| Anthropic  | ❌ Direct | ✅ Read, Write, Bash | ✅ All 7 MCP tools     | Baseline     |
| Gemini     | ✅ Yes    | ✅ Read, Write, Bash | ❌ Not available       | 85% cheaper  |
| OpenRouter | ✅ Yes    | ✅ Read, Write, Bash | ⏱️ Timeout/Not working | 90% cheaper  |
| ONNX       | ❌ Local  | ✅ Read, Write, Bash | ❓ Untested            | 100% free    |

## Recommendations

### For Production Use

1. **MCP-Required Tasks**: Use Anthropic provider
   - Memory persistence, swarm coordination, complex workflows
   - Accept higher cost for MCP capabilities

2. **Code Generation**: Use Gemini/OpenRouter
   - Simple file creation, code writing, refactoring
   - 85-90% cost savings, MCP not needed

3. **Hybrid Approach**: Route intelligently
   ```typescript
   const needsMCP = task.includes('memory') || task.includes('swarm');
   const provider = needsMCP ? 'anthropic' : 'gemini';
   ```

### Future Improvements

To make MCP work with proxies, we would need to:

1. **Modify Proxy Translation**:
   - Extract MCP tool schemas from SDK
   - Include them in Anthropic→Gemini/OpenRouter translation
   - Map tool_use responses back

2. **Alternative Architecture**:
   - MCP proxy layer separate from model proxy
   - SDK connects to MCP directly, uses model proxy only for inference
   - Keep MCP tool execution local

3. **SDK Enhancement Request**:
   - File issue with Claude Agent SDK team
   - Request: Support MCP with custom ANTHROPIC_BASE_URL
   - Or: Provide hooks to inject MCP tools into proxied requests

## Conclusion

✅ **What Works**: Anthropic + MCP (full functionality)
⚠️ **What's Limited**: Gemini/OpenRouter + MCP (tools not exposed)
🔧 **Workaround**: Use Anthropic for MCP tasks, proxies for simple code generation

**v1.1.10 Status**: Proxy functionality ✅ complete, MCP via proxy ⚠️ limited (architecture constraint)
