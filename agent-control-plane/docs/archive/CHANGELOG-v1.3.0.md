# Changelog - v1.3.0

## Release Date: October 7, 2025

## 🎉 Major Features

### Tool Emulation Architecture (Phase 2)

Complete implementation of tool emulation system for models without native function calling support.

**Key Features:**

- ✅ Automatic model capability detection
- ✅ ReAct and Prompt-based emulation strategies
- ✅ User-facing emulation messages at 3 levels
- ✅ Zero breaking changes - 100% backward compatible
- ✅ 15/15 regression tests passing

**Supported Models:**

- Native tool support: DeepSeek Chat, Claude 3.5, GPT-4, Llama 3.3, Qwen 2.5 Coder, Mistral Small
- Emulation required: Mistral 7B, Llama 2, Gemma 7B

### Default Model Update

Changed default OpenRouter model from Llama 3.1 8B to **DeepSeek Chat**:

- ✅ Native tool support (no emulation needed)
- ✅ 128K context window (vs 32K)
- ✅ Cost-effective at $0.14/M tokens
- ✅ Eliminates context overflow errors in Claude Code interactive mode

## 🐛 Bug Fixes

### Critical: Claude SDK Model Override

Fixed issue where Claude Agent SDK was sending Claude model IDs to OpenRouter, causing "model not found" errors.

**Solution:**

- Automatically override SDK Claude requests to use CLI-specified model
- Prevents errors when using OpenRouter with non-Claude models
- Maintains compatibility with all providers

## 📝 Changes

### Tool Emulation Messages

Added user-facing messages at 3 levels:

1. **Proxy Initialization**: Shows when model lacks native tool support
2. **Proxy Startup**: Displays emulation strategy and expected reliability
3. **Agent Execution**: Informs about tool handling method

Example output for Mistral 7B:

```
⚙️  Detected: Model lacks native tool support
🔧 Using REACT emulation pattern
📊 Expected reliability: 70-85%

⚙️  Tool Emulation: REACT pattern
📊 Note: This model uses prompt-based tool emulation
   Tools are handled by Claude Agent SDK (limited to SDK tools)
```

### Files Modified

- `src/cli-proxy.ts` - Added emulation messages, updated default model
- `src/proxy/anthropic-to-openrouter.ts` - Added model override logic, emulation routing
- `src/cli/claude-code-wrapper.ts` - Updated default model
- `src/agents/claudeAgent.ts` - Updated default model
- `src/utils/modelCapabilities.ts` - Created (Phase 1)
- `src/proxy/tool-emulation.ts` - Created (Phase 1)

## 🧪 Testing

### Regression Tests: 15/15 PASS

- Tool emulation files exist
- Integration verified in cli-proxy and anthropic-to-openrouter
- Gemini proxy remains isolated
- TypeScript compilation succeeds
- Model capability detection working
- No tool name rewriting
- Tool schemas unchanged
- Backward compatibility verified

### Manual Testing Results

- ✅ DeepSeek (native tools): Works perfectly, no emulation messages
- ✅ Mistral 7B (emulation): Works correctly, emulation messages appear
- ✅ Claude Code interactive mode: No context errors
- ✅ Claude Code non-interactive mode: Executes correctly
- ✅ Agent execution: Both model types work

## 📦 Migration Guide

### For Users

No migration needed! This release is 100% backward compatible.

**To use new default model (DeepSeek Chat):**

```bash
npx agent-control-plane claude-code --provider openrouter
```

**To use emulation with non-tool models:**

```bash
npx agent-control-plane --agent coder --task "Your task" \
  --provider openrouter \
  --model "mistralai/mistral-7b-instruct"
```

### For Developers

If you've set `COMPLETION_MODEL` in `.env`, it will override the new default.

To explicitly use DeepSeek Chat:

```bash
export COMPLETION_MODEL="deepseek/deepseek-chat"
```

## 🔗 Related Issues

- Closes #8 - Tool Emulation Phase 2 Integration

## 🙏 Credits

- Tool emulation architecture design
- Phase 2 integration implementation
- Model capability detection system
- Comprehensive testing and validation

---

**Full Changelog**: https://github.com/Aktoh-Cyber/agent-control-plane/compare/v1.2.7...v1.3.0
