# Tool Instruction Enhancement for Multi-Provider Support

## Overview

Enhanced both Gemini and OpenRouter proxies to enable file system operations and tool calling for models that don't natively support Anthropic-style tool use.

## Problem Statement

The Claude Agent SDK expects Anthropic's tool use format, but:

- **Gemini API** doesn't support native tool calling like Anthropic
- **OpenRouter models** (Llama, Mistral, Qwen, etc.) have varying/no tool calling support
- Models would only return code as text, not execute file operations

## Solution

### 1. Structured Command Instructions

Added XML-like structured command format to system prompts:

```xml
<file_write path="filename.ext">
content here
</file_write>

<file_read path="filename.ext"/>

<bash_command>
command here
</bash_command>
```

### 2. Response Parsing

Implemented `parseStructuredCommands()` method in both proxies to:

- Extract structured commands from model text responses
- Convert them to Anthropic `tool_use` format
- Allow Claude Agent SDK to execute the operations

### 3. Bidirectional Translation

**Request Flow:**

```
User Request
  → Claude Agent SDK
    → Proxy (adds tool instructions)
      → Model API
```

**Response Flow:**

```
Model Response (with <file_write> tags)
  → Proxy Parser (extracts commands)
    → Anthropic tool_use format
      → Claude Agent SDK (executes Write tool)
        → File Created ✅
```

## Implementation Details

### Files Modified

1. **src/proxy/anthropic-to-gemini.ts**
   - Added tool instructions to system prompt
   - Implemented `parseStructuredCommands()` method
   - Enhanced `convertGeminiToAnthropic()` to parse and convert commands

2. **src/proxy/anthropic-to-openrouter.ts**
   - Added tool instructions to system prompt
   - Implemented `parseStructuredCommands()` method
   - Enhanced `convertOpenAIToAnthropic()` to parse and convert commands

### Supported Tools

- **Write**: Create/edit files with `<file_write path="...">content</file_write>`
- **Read**: Read files with `<file_read path="..."/>`
- **Bash**: Execute commands with `<bash_command>command</bash_command>`

## Validation Results

### Gemini Proxy

✅ **Successfully validated**:

- Created hello.js file with Gemini 2.0 Flash
- File executes correctly: outputs "Hello from Gemini!"
- Tool use detected and executed by Claude Agent SDK

### OpenRouter Proxy

✅ **4 out of 5 models successful**:

- ✅ meta-llama/llama-3.1-8b-instruct (1 tool use)
- ✅ mistralai/mistral-7b-instruct (1 tool use)
- ✅ meta-llama/llama-3.1-70b-instruct (1 tool use)
- ✅ qwen/qwen-2.5-7b-instruct (1 tool use)
- ❌ google/gemini-flash-1.5 (404 - wrong model ID)

### Free Models Testing

🔄 **In Progress** (running in background):

- Testing 7 free OpenRouter models
- Results will be in: `openrouter-free-test.log`
- JSON results: `openrouter-free-models-test-results.json`

## Benefits

1. **Universal Tool Support**: Any model can now perform file operations
2. **Cost Savings**: Use cheaper/free models with full agent capabilities
3. **Provider Flexibility**: Same tool interface across all providers
4. **Zero Model Changes**: Works with existing models via prompt engineering
5. **Seamless Integration**: Claude Agent SDK executes tools transparently

## Example Usage

### With Gemini:

```bash
export GOOGLE_GEMINI_API_KEY="your-key"
npx agentic-flow --agent coder --task "Create a hello.js file" --provider gemini
```

### With OpenRouter (Llama):

```bash
export OPENROUTER_API_KEY="your-key"
export COMPLETION_MODEL="meta-llama/llama-3.1-8b-instruct"
npx agentic-flow --agent coder --task "Create a hello.js file" --provider openrouter
```

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User: "Create hello.js file"                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Agent SDK (expects Anthropic tool format)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Proxy (Gemini/OpenRouter)                                    │
│ - Injects structured command instructions                    │
│ - Sends to model API                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Model Response:                                              │
│ <file_write path="hello.js">                                 │
│ function hello() { console.log("Hello!"); }                  │
│ </file_write>                                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Proxy Parser                                                 │
│ - Extracts: <file_write path="hello.js">                     │
│ - Converts to: {type: "tool_use", name: "Write", ...}       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Agent SDK                                             │
│ - Receives tool_use in Anthropic format                      │
│ - Executes Write tool                                        │
│ - Creates hello.js ✅                                         │
└─────────────────────────────────────────────────────────────┘
```

## Future Enhancements

1. **Add More Tools**: Edit, Glob, Grep, WebFetch support
2. **Streaming Support**: Parse commands in streaming responses
3. **Error Handling**: Better error messages for malformed commands
4. **Model-Specific Tuning**: Optimize instructions per model family
5. **Tool Confirmation**: Optional user approval for file operations

## Testing

### Run Tests:

```bash
# Test Gemini proxy
npx tsx test-gemini-raw.ts

# Test OpenRouter popular models
npx tsx test-openrouter-models.ts

# Test OpenRouter free models (background)
npx tsx test-openrouter-free-models.ts > openrouter-free-test.log 2>&1 &
```

### Check Results:

```bash
# View test results
cat openrouter-model-test-results.json
cat openrouter-free-models-test-results.json

# Check background test progress
tail -f openrouter-free-test.log
```

## Conclusion

This enhancement enables **any LLM provider** to work with the Claude Agent SDK's tool system, dramatically expanding model options while maintaining consistent agent capabilities. Models that previously could only return code as text can now perform actual file operations, making them viable alternatives to Anthropic's models for agent workflows.
