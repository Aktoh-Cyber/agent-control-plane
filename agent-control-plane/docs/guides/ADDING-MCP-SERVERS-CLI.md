# Adding MCP Servers via CLI (End User Guide)

**For end users who want to add custom MCP servers without editing code.**

---

## Quick Start

```bash
# Add an MCP server from NPM
npx agent-control-plane mcp add my-mcp-server --npm

# Add a local MCP server
npx agent-control-plane mcp add my-local-server --command "node /path/to/server.js"

# Add with environment variables
npx agent-control-plane mcp add weather-api --npm weather-mcp --env "WEATHER_API_KEY=xxx"

# List configured MCP servers
npx agent-control-plane mcp list

# Remove an MCP server
npx agent-control-plane mcp remove my-mcp-server

# Enable/disable MCP server
npx agent-control-plane mcp enable my-mcp-server
npx agent-control-plane mcp disable my-mcp-server
```

---

## Configuration File

MCP servers are stored in `~/.agent-control-plane/mcp-config.json`:

```json
{
  "servers": {
    "my-custom-server": {
      "enabled": true,
      "type": "npm",
      "package": "my-mcp-package@latest",
      "command": "my-mcp",
      "args": ["start"],
      "env": {
        "MY_API_KEY": "xxx"
      },
      "description": "My custom MCP server"
    },
    "local-tools": {
      "enabled": true,
      "type": "local",
      "command": "node",
      "args": ["/home/user/my-mcp/index.js"],
      "env": {},
      "description": "Local development MCP server"
    }
  }
}
```

---

## CLI Commands

### 1. Add MCP Server

#### From NPM Package

```bash
# Basic NPM package
npx agent-control-plane mcp add weather-api --npm weather-mcp

# With version
npx agent-control-plane mcp add weather-api --npm weather-mcp@1.2.3

# With custom command
npx agent-control-plane mcp add weather-api --npm weather-mcp --command mcp-server

# With environment variables
npx agent-control-plane mcp add weather-api \
  --npm weather-mcp \
  --env "WEATHER_API_KEY=your-key-here" \
  --env "WEATHER_REGION=us-west"

# With description
npx agent-control-plane mcp add weather-api \
  --npm weather-mcp \
  --desc "Weather data MCP server"
```

#### From Local Path

```bash
# Local executable
npx agent-control-plane mcp add my-tools --local /home/user/my-mcp/server.js

# With node
npx agent-control-plane mcp add my-tools \
  --command "node" \
  --args "/home/user/my-mcp/server.js"

# With Python
npx agent-control-plane mcp add python-tools \
  --command "python3" \
  --args "/home/user/mcp-server.py"

# With custom arguments
npx agent-control-plane mcp add advanced-tools \
  --command "node" \
  --args "/path/to/server.js --port 8080 --debug"
```

#### With Docker

```bash
# Docker container
npx agent-control-plane mcp add docker-mcp \
  --command "docker" \
  --args "run -i --rm my-mcp-image"
```

### 2. List MCP Servers

```bash
# List all configured servers
npx agent-control-plane mcp list

# Output:
# Configured MCP Servers:
#
# ✅ weather-api (enabled)
#    Type: npm
#    Package: weather-mcp@latest
#    Description: Weather data MCP server
#
# ✅ my-tools (enabled)
#    Type: local
#    Command: node /home/user/my-mcp/server.js
#
# ❌ old-server (disabled)
#    Type: npm
#    Package: old-mcp@1.0.0

# List only enabled
npx agent-control-plane mcp list --enabled

# Show full config
npx agent-control-plane mcp list --verbose
```

### 3. Enable/Disable MCP Server

```bash
# Enable server
npx agent-control-plane mcp enable weather-api

# Disable server
npx agent-control-plane mcp disable weather-api

# Enable all
npx agent-control-plane mcp enable --all

# Disable all
npx agent-control-plane mcp disable --all
```

### 4. Remove MCP Server

```bash
# Remove server
npx agent-control-plane mcp remove weather-api

# Remove with confirmation
npx agent-control-plane mcp remove weather-api --confirm

# Remove all disabled servers
npx agent-control-plane mcp remove --disabled
```

### 5. Update MCP Server

```bash
# Update NPM package version
npx agent-control-plane mcp update weather-api --version 2.0.0

# Update environment variables
npx agent-control-plane mcp update weather-api \
  --env "WEATHER_API_KEY=new-key"

# Update command
npx agent-control-plane mcp update my-tools \
  --command "node" \
  --args "/new/path/server.js"
```

### 6. Test MCP Server

```bash
# Test if server responds
npx agent-control-plane mcp test weather-api

# Output:
# Testing MCP server: weather-api
# ✅ Server started successfully
# ✅ Responds to tools/list
# ✅ Found 5 tools:
#    - get_weather
#    - get_forecast
#    - get_alerts
#    - get_historical
#    - search_location
# ✅ Server is working correctly

# Test with verbose output
npx agent-control-plane mcp test weather-api --verbose
```

### 7. Info/Docs

```bash
# Show server info
npx agent-control-plane mcp info weather-api

# Output:
# MCP Server: weather-api
# Status: ✅ Enabled
# Type: npm
# Package: weather-mcp@1.2.3
# Command: npx -y weather-mcp start
# Environment:
#   WEATHER_API_KEY: ***key***
#   WEATHER_REGION: us-west
# Tools: 5 tools available
# Description: Weather data MCP server

# Show all tools from server
npx agent-control-plane mcp tools weather-api

# Output:
# Tools from weather-api:
# 1. get_weather - Get current weather for location
# 2. get_forecast - Get weather forecast
# 3. get_alerts - Get weather alerts
# 4. get_historical - Get historical weather data
# 5. search_location - Search for location by name
```

---

## Usage in Agents

Once configured, MCP servers are automatically available to all agents:

```bash
# MCP servers load automatically
npx agent-control-plane --agent researcher \
  --task "Get weather for San Francisco using get_weather tool"

# All configured and enabled servers are available
# No need to specify which MCP server to use
```

---

## Configuration via Environment Variables

You can also configure MCP servers via environment variables (temporary):

```bash
# Add MCP server for this session only
export AGENTIC_FLOW_MCP_WEATHER='{"type":"npm","package":"weather-mcp","env":{"API_KEY":"xxx"}}'

# Use it
npx agent-control-plane --agent researcher --task "Get weather data"
```

---

## Popular MCP Servers

Here are some popular MCP servers you can add:

### Official Anthropic Servers

```bash
# Filesystem MCP
npx agent-control-plane mcp add filesystem \
  --npm @modelcontextprotocol/server-filesystem \
  --args "/path/to/allowed/directory"

# GitHub MCP
npx agent-control-plane mcp add github \
  --npm @modelcontextprotocol/server-github \
  --env "GITHUB_TOKEN=your-token"

# Google Drive MCP
npx agent-control-plane mcp add gdrive \
  --npm @modelcontextprotocol/server-gdrive \
  --env "GDRIVE_CREDENTIALS=/path/to/creds.json"

# Brave Search MCP
npx agent-control-plane mcp add brave-search \
  --npm @modelcontextprotocol/server-brave-search \
  --env "BRAVE_API_KEY=your-key"
```

### Community Servers

```bash
# Database MCP (PostgreSQL, MySQL)
npx agent-control-plane mcp add database \
  --npm mcp-database \
  --env "DATABASE_URL=postgresql://localhost/mydb"

# Slack MCP
npx agent-control-plane mcp add slack \
  --npm mcp-slack \
  --env "SLACK_TOKEN=xoxb-your-token"

# Email MCP (IMAP/SMTP)
npx agent-control-plane mcp add email \
  --npm mcp-email \
  --env "EMAIL_HOST=imap.gmail.com" \
  --env "EMAIL_USER=user@gmail.com" \
  --env "EMAIL_PASS=app-password"

# Notion MCP
npx agent-control-plane mcp add notion \
  --npm @notionhq/mcp-server \
  --env "NOTION_TOKEN=secret_xxx"
```

---

## Advanced Usage

### Custom Configuration File Path

```bash
# Use custom config file
export AGENTIC_FLOW_MCP_CONFIG=/path/to/custom-mcp-config.json

npx agent-control-plane mcp list
```

### Multiple Profiles

```bash
# Development profile
export AGENTIC_FLOW_MCP_CONFIG=~/.agent-control-plane/mcp-dev.json
npx agent-control-plane mcp add local-tools --local /dev/tools/server.js

# Production profile
export AGENTIC_FLOW_MCP_CONFIG=~/.agent-control-plane/mcp-prod.json
npx agent-control-plane mcp add prod-tools --npm production-mcp
```

### Import/Export Configuration

```bash
# Export configuration
npx agent-control-plane mcp export > my-mcp-config.json

# Import configuration
npx agent-control-plane mcp import < my-mcp-config.json

# Share with team
cat my-mcp-config.json | pbcopy  # macOS
```

---

## Troubleshooting

### Server Not Working

```bash
# 1. Test server
npx agent-control-plane mcp test my-server

# 2. Check if enabled
npx agent-control-plane mcp list

# 3. Check logs
npx agent-control-plane --agent coder --task "test" --verbose
# Look for: "Loading MCP server: my-server"

# 4. Test manually
npx my-mcp-package start
```

### Environment Variables Not Set

```bash
# Check current config
npx agent-control-plane mcp info my-server

# Update env vars
npx agent-control-plane mcp update my-server \
  --env "API_KEY=correct-key"
```

### NPM Package Not Found

```bash
# Test NPM package
npx my-mcp-package --help

# Update package name
npx agent-control-plane mcp update my-server \
  --npm correct-package-name
```

---

## Security Best Practices

1. **Don't Commit API Keys**

   ```bash
   # Use environment variables
   npx agent-control-plane mcp add weather \
     --npm weather-mcp \
     --env "API_KEY=$WEATHER_API_KEY"
   ```

2. **Validate Sources**

   ```bash
   # Check NPM package first
   npm view weather-mcp

   # Review package code
   npm view weather-mcp repository
   ```

3. **Use Version Pinning**

   ```bash
   # Pin to specific version
   npx agent-control-plane mcp add weather \
     --npm weather-mcp@1.2.3  # Not @latest
   ```

4. **Review Permissions**

   ```bash
   # Check what tools are available
   npx agent-control-plane mcp tools my-server

   # Disable if not needed
   npx agent-control-plane mcp disable my-server
   ```

---

## Example Workflow

```bash
# 1. Install agent-control-plane
npm install -g agent-control-plane

# 2. Add weather MCP server
npx agent-control-plane mcp add weather \
  --npm weather-mcp \
  --env "WEATHER_API_KEY=your-key" \
  --desc "Real-time weather data"

# 3. Test it
npx agent-control-plane mcp test weather

# 4. Use it
npx agent-control-plane --agent researcher \
  --task "Get current weather and 7-day forecast for Tokyo"

# 5. Check what it can do
npx agent-control-plane mcp tools weather

# 6. Update if needed
npx agent-control-plane mcp update weather --version 2.0.0

# 7. Share config with team
npx agent-control-plane mcp export > team-mcp-config.json
```

---

## Summary

**Quick Reference Card:**

| Task             | Command                                                   |
| ---------------- | --------------------------------------------------------- |
| Add NPM server   | `npx agent-control-plane mcp add NAME --npm PACKAGE`      |
| Add local server | `npx agent-control-plane mcp add NAME --local PATH`       |
| List servers     | `npx agent-control-plane mcp list`                        |
| Test server      | `npx agent-control-plane mcp test NAME`                   |
| Enable/disable   | `npx agent-control-plane mcp enable/disable NAME`         |
| Update config    | `npx agent-control-plane mcp update NAME --env "KEY=val"` |
| Remove server    | `npx agent-control-plane mcp remove NAME`                 |
| Show tools       | `npx agent-control-plane mcp tools NAME`                  |

**Config File:** `~/.agent-control-plane/mcp-config.json`

**All enabled MCP servers automatically available to agents!**

---

## Implementation Status

**🚧 COMING SOON - This feature is not yet implemented.**

The CLI commands documented above will be available in **agent-control-plane v1.2.0**.

**Current Workaround:** Use environment variables as documented in the [main guide](./ADDING-MCP-SERVERS.md).

**Track Progress:** https://github.com/Aktoh-Cyber/agent-control-plane/issues

---

**Want this feature sooner?** Contribute! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
