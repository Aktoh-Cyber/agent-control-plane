# Release Notes - agent-control-plane v1.0.6

**Published:** October 4, 2025
**Package:** https://www.npmjs.com/package/agent-control-plane

---

## 🎉 Major Features

### 1. Interactive Configuration Wizard

A comprehensive CLI wizard for managing environment configuration with both interactive and direct command modes.

```bash
# Interactive wizard
npx agent-control-plane config

# Direct commands
npx agent-control-plane config set ANTHROPIC_API_KEY sk-ant-xxxxx
npx agent-control-plane config set PROVIDER openrouter
npx agent-control-plane config list
npx agent-control-plane config get PROVIDER
npx agent-control-plane config delete OPENROUTER_API_KEY
npx agent-control-plane config reset
```

**Features:**

- ✅ Interactive step-by-step configuration
- ✅ API key validation (format checking)
- ✅ Auto-generated `.env` with comments
- ✅ Support for all configuration keys
- ✅ Help system with examples
- ✅ Safe key masking in output

**Configuration Keys:**

- `ANTHROPIC_API_KEY` - Validated: must start with `sk-ant-`
- `OPENROUTER_API_KEY` - Validated: must start with `sk-or-`
- `COMPLETION_MODEL` - Default model name
- `PROVIDER` - Default provider (anthropic, openrouter, onnx)
- `AGENTS_DIR` - Custom agents directory
- `PROXY_PORT` - Proxy port (default: 3000)
- `USE_OPENROUTER` - Force OpenRouter (true/false)
- `USE_ONNX` - Use ONNX local inference (true/false)

---

### 2. Enhanced Error Messages

Improved 401 authentication error handling with actionable guidance:

**Before:**

```
AuthenticationError: 401 {"type":"error","error":{"type":"authentication_error"...
```

**After:**

```
❌ Anthropic API authentication failed (401)

Your API key is invalid, expired, or lacks permissions.
Current key: sk-ant-api03-A...

Please:
  1. Check your key at: https://console.anthropic.com/settings/keys
  2. Verify it's not expired
  3. Ensure it has proper permissions
  4. Update your .env file with: ANTHROPIC_API_KEY=sk-ant-...

Alternative: Use OpenRouter instead (--model "meta-llama/llama-3.1-8b-instruct")
Or use local ONNX (--provider onnx)
```

---

### 3. Fixed MCP Server Execution

MCP server now uses `npx` for reliable tool execution when installed via npm.

**What Changed:**

- MCP tools now execute via `npx --yes agent-control-plane`
- Works correctly in all environments (local, Docker, Claude Desktop)
- Proper timeout handling (5 minutes for agents, 30 seconds for list)
- Better error messages

**Tools Available:**

1. `agentic_flow_agent` - Execute any agent with a task
2. `agentic_flow_list_agents` - List all 66+ available agents

**Validated In:**

- ✅ Local development
- ✅ Docker containers
- ✅ npm global install
- ✅ npx execution
- ✅ Claude Desktop (MCP client)

---

## 🔧 Improvements

### API Key Validation

- Format validation before API calls
- Helpful error messages with console links
- Clear guidance on alternatives

### MCP Server Reliability

- Fixed path resolution issues
- Uses npm registry instead of local paths
- Proper subprocess handling
- Timeout protection

### Developer Experience

- Interactive configuration wizard
- Better error messages throughout
- Validated in Docker before release
- Complete test suite

---

## 📦 What's Included

### Configuration Management

```bash
npx agent-control-plane config              # Interactive wizard
npx agent-control-plane config set KEY VAL  # Direct set
npx agent-control-plane config list         # View all config
```

### Agent Execution

```bash
npx agent-control-plane --agent coder --task "Your task"
npx agent-control-plane --list
```

### MCP Integration

```bash
# Add to Claude Desktop config
{
  "mcpServers": {
    "agent-control-plane": {
      "command": "npx",
      "args": ["-y", "agent-control-plane", "mcp", "start"]
    }
  }
}
```

---

## 🧪 Testing

All features validated in Docker before release:

### Config Wizard Tests

```bash
✅ Help command
✅ List configuration
✅ Set values
✅ Get values
✅ Delete values
✅ Reset to defaults
✅ .env file generation
```

### MCP Server Tests

```bash
✅ agentic_flow_list_agents tool
✅ agentic_flow_agent tool
✅ npx execution path
✅ Package structure
✅ Tool simulations
```

### Provider Tests

```bash
✅ Anthropic (default)
✅ OpenRouter (cost-effective)
✅ ONNX (local/optional)
```

---

## 🚀 Upgrade Guide

### From v1.0.5 or earlier:

```bash
# Update globally
npm install -g agent-control-plane@latest

# Or use with npx (always latest)
npx agent-control-plane@latest config

# Configure with new wizard
npx agent-control-plane config
```

### Breaking Changes

**None** - Fully backward compatible

### New Features Available

1. Config wizard (optional, but recommended)
2. Better error messages (automatic)
3. Fixed MCP tools (automatic)

---

## 📊 Package Stats

- **Version:** 1.0.6
- **Size:** 595.1 kB (tarball)
- **Unpacked:** 2.2 MB
- **Files:** 385
- **Agents:** 66+
- **MCP Tools:** 2 (agent-control-plane server) + 203 (gendev + agentic-cloud + agentic-payments)

---

## 🐛 Bug Fixes

1. **MCP Server Path Resolution** - Fixed module not found errors when running MCP tools
2. **API Key Format Validation** - Added validation before making API calls
3. **Error Message Quality** - Improved 401 errors with actionable guidance
4. **Dockerfile Organization** - Moved to `docker/` directory

---

## 📚 Documentation Updates

- Added config wizard documentation to README
- Updated Quick Start with configuration wizard
- Added configuration management section
- Improved error troubleshooting

---

## 🙏 Credits

- **Config Wizard:** Interactive CLI configuration management
- **MCP Fix:** Reliable tool execution via npx
- **Error Enhancement:** Better developer experience
- **Testing:** Comprehensive Docker validation

---

## 🔗 Links

- **npm Package:** https://www.npmjs.com/package/agent-control-plane
- **GitHub:** https://github.com/Aktoh-Cyber/agent-control-plane
- **Documentation:** See `docs/` directory
- **Issues:** https://github.com/Aktoh-Cyber/agent-control-plane/issues

---

## 📝 Full Changelog

### Added

- Interactive configuration wizard (`npx agent-control-plane config`)
- Direct config commands (set, get, delete, list, reset)
- API key format validation
- Enhanced 401 error messages
- Config wizard help system

### Fixed

- MCP server module resolution (now uses npx)
- MCP tool execution in all environments
- Path resolution for npm installations
- Error message clarity and helpfulness

### Changed

- MCP server version updated to 1.0.6
- Dockerfiles moved to `docker/` directory
- README updated with config documentation

### Validated

- All features tested in Docker
- MCP tools validated in containers
- Config wizard tested comprehensively
- Provider switching verified

---

**Upgrade today for better developer experience!**

```bash
npm install -g agent-control-plane@latest
npx agent-control-plane config
```
