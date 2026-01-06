/**
 * Help generator for Agentic Flow CLI
 * Provides help text for various commands and modes
 */

export class HelpGenerator {
  constructor(private version: string) {}

  printMainHelp(): void {
    console.log(`
🤖 Agentic Flow v${this.version} - AI Agent Orchestration with Multi-Provider Support

NEW IN v1.9.4: Enterprise provider fallback & dynamic switching for long-running agents
✅ Automatic failover  ✅ Circuit breaker  ✅ Cost optimization  ✅ Health monitoring

USAGE:
  npx agent-control-plane [COMMAND] [OPTIONS]

COMMANDS:
  config [subcommand]     Manage environment configuration (interactive wizard)
  mcp <command> [server]  Manage MCP servers (start, stop, status, list)
  agent <command>         Agent management (list, create, info, conflicts)
  federation <command>    Federation hub management (start, spawn, stats, test)
  proxy [options]         Run standalone proxy server for Claude Code/Cursor
  quic [options]          Run QUIC transport proxy for ultra-low latency (50-70% faster)
  claude-code [options]   Spawn Claude Code with auto-configured proxy
  --list, -l              List all available agents
  --agent, -a <name>      Run specific agent mode

CONFIG COMMANDS:
  npx agent-control-plane config              # Interactive wizard
  npx agent-control-plane config set KEY VAL  # Set configuration value
  npx agent-control-plane config get KEY      # Get configuration value
  npx agent-control-plane config list         # List all configuration
  npx agent-control-plane config delete KEY   # Delete configuration value
  npx agent-control-plane config reset        # Reset to defaults

MCP COMMANDS:
  npx agent-control-plane mcp start [server]    Start MCP server(s)
  npx agent-control-plane mcp stop [server]     Stop MCP server(s)
  npx agent-control-plane mcp status [server]   Check MCP server status
  npx agent-control-plane mcp list              List all available MCP tools

  Available servers: claude-flow, flow-nexus, agentic-payments, all (default)

AGENT COMMANDS:
  npx agent-control-plane agent list [format]   List all agents (summary/detailed/json)
  npx agent-control-plane agent create          Create new custom agent (interactive)
  npx agent-control-plane agent info <name>     Show detailed agent information
  npx agent-control-plane agent conflicts       Check for package/local conflicts

FEDERATION COMMANDS:
  npx agent-control-plane federation start      Start federation hub server
  npx agent-control-plane federation spawn      Spawn ephemeral agent
  npx agent-control-plane federation stats      Show hub statistics
  npx agent-control-plane federation status     Show federation system status
  npx agent-control-plane federation test       Run multi-agent collaboration test
  npx agent-control-plane federation help       Show federation help

  Federation enables ephemeral agents (5s-15min lifetime) with persistent memory.
  Hub stores memories permanently; agents access past learnings from dead agents.

OPTIONS:
  --task, -t <task>           Task description for agent mode
  --model, -m <model>         Model to use (triggers OpenRouter if contains "/")
  --provider, -p <name>       Provider to use (anthropic, openrouter, gemini, onnx)
  --stream, -s                Enable real-time streaming output
  --help, -h                  Show this help message

  API CONFIGURATION:
  --anthropic-key <key>       Override ANTHROPIC_API_KEY environment variable
  --openrouter-key <key>      Override OPENROUTER_API_KEY environment variable
  --gemini-key <key>          Override GOOGLE_GEMINI_API_KEY environment variable

  AGENT BEHAVIOR:
  --temperature <0.0-1.0>     Sampling temperature (creativity control)
  --max-tokens <number>       Maximum tokens in response

  DIRECTORY:
  --agents-dir <path>         Custom agents directory (default: .claude/agents)

  OUTPUT:
  --output <text|json|md>     Output format (text/json/markdown)
  --verbose                   Enable verbose logging for debugging

  EXECUTION:
  --timeout <ms>              Execution timeout in milliseconds
  --retry                     Auto-retry on transient errors

  MODEL OPTIMIZATION (NEW!):
  --optimize, -O              Auto-select best model for agent/task based on priorities
  --priority <type>           Optimization priority:
                              • quality   - Best results (Claude Sonnet 4.5, GPT-4o)
                              • balanced  - Mix quality/cost (DeepSeek R1, Gemini 2.5 Flash) [default]
                              • cost      - Cheapest (DeepSeek Chat V3, Llama 3.1 8B)
                              • speed     - Fastest responses (Gemini 2.5 Flash)
                              • privacy   - Local only (ONNX Phi-4, no cloud)
  --max-cost <dollars>        Maximum cost per task (e.g., 0.001 = $0.001/task budget cap)

  Optimization analyzes agent type + task complexity to recommend best model.
  Example savings: DeepSeek R1 costs 85% less than Claude Sonnet 4.5 with similar quality.
  See docs/agent-control-plane/benchmarks/MODEL_CAPABILITIES.md for full comparison.

PROVIDER FALLBACK (NEW v1.9.4):
  Enterprise-grade provider fallback for long-running agents with automatic failover,
  circuit breaker, health monitoring, cost tracking, and crash recovery.

  Features:
  • Automatic failover between providers (Gemini → Claude → ONNX)
  • Circuit breaker prevents cascading failures (auto-recovery after timeout)
  • Real-time health monitoring (success rate, latency, error tracking)
  • Cost optimization (70% savings using Gemini for simple tasks)
  • Checkpointing for crash recovery (save/restore agent state)
  • Budget controls (hard limits on spending and runtime)

  See: docs/PROVIDER-FALLBACK-GUIDE.md for complete documentation
  Example: src/examples/use-provider-fallback.ts

EXAMPLES:
  # MCP Server Management
  npx agent-control-plane mcp start              # Start all MCP servers
  npx agent-control-plane mcp start claude-flow  # Start specific server
  npx agent-control-plane mcp list               # List all 203+ MCP tools
  npx agent-control-plane mcp status             # Check server status

  # Federation Hub Management
  npx agent-control-plane federation start       # Start hub server (WebSocket)
  npx agent-control-plane federation start --port 9443 --db-path ./data/hub.db
  npx agent-control-plane federation spawn       # Spawn ephemeral agent
  npx agent-control-plane federation spawn --tenant acme-corp --lifetime 600
  npx agent-control-plane federation stats       # Show hub statistics
  npx agent-control-plane federation test        # Run multi-agent test

  # Proxy Server for Claude Code/Cursor
  npx agent-control-plane proxy --provider openrouter --port 3000
  npx agent-control-plane proxy --provider gemini --port 3001

  # QUIC Transport (Ultra-low latency, 50-70% faster than TCP)
  npx agent-control-plane quic --port 4433                    # Start QUIC server
  npx agent-control-plane quic --cert ./certs/cert.pem --key ./certs/key.pem
  npm run proxy:quic                                    # Development mode
  npm run test:quic:wasm                                # Test WASM bindings

  # Claude Code Integration (Auto-start proxy + spawn Claude Code)
  npx agent-control-plane claude-code --provider openrouter "Write a Python function"
  npx agent-control-plane claude-code --provider gemini "Create a REST API"
  npx agent-control-plane claude-code --provider anthropic "Help me debug this code"

  # Agent Execution
  npx agent-control-plane --list                 # List all 150+ agents
  npx agent-control-plane --agent coder --task "Create Python hello world"
  npx agent-control-plane --agent coder --task "Create REST API" --provider openrouter
  npx agent-control-plane --agent coder --task "Create REST API" --model "meta-llama/llama-3.1-8b-instruct"
  npx agent-control-plane --agent coder --task "Create code" --provider onnx

  # Model Optimization (Auto-select best model)
  npx agent-control-plane --agent coder --task "Build API" --optimize
  npx agent-control-plane --agent coder --task "Build API" --optimize --priority cost
  npx agent-control-plane --agent reviewer --task "Security audit" --optimize --priority quality
  npx agent-control-plane --agent coder --task "Simple function" --optimize --max-cost 0.001

ENVIRONMENT VARIABLES:
  ANTHROPIC_API_KEY       Anthropic API key (for Claude models)
  OPENROUTER_API_KEY      OpenRouter API key (for alternative models)
  GOOGLE_GEMINI_API_KEY   Google Gemini API key (for Gemini models)
  USE_OPENROUTER          Set to 'true' to force OpenRouter usage
  USE_GEMINI              Set to 'true' to force Gemini usage
  COMPLETION_MODEL        Default model for OpenRouter
  AGENTS_DIR              Path to agents directory
  PROXY_PORT              Proxy server port (default: 3000)
  QUIC_PORT               QUIC transport port (default: 4433)
  QUIC_CERT_PATH          Path to TLS certificate for QUIC
  QUIC_KEY_PATH           Path to TLS private key for QUIC

DOCUMENTATION:
  https://github.com/Aktoh-Cyber/agent-control-plane
  https://ruv.io
    `);
  }

  printProxyHelp(): void {
    console.log(`
Agentic Flow - Standalone Anthropic Proxy Server

USAGE:
  npx agent-control-plane proxy [OPTIONS]

OPTIONS:
  --provider, -p <provider>   Provider (gemini, openrouter) [default: gemini]
  --port, -P <port>           Port number [default: 3000]
  --model, -m <model>         Model to use (provider-specific)
  --help, -h                  Show this help

ENVIRONMENT VARIABLES:
  GOOGLE_GEMINI_API_KEY       Required for Gemini
  OPENROUTER_API_KEY          Required for OpenRouter
  COMPLETION_MODEL            Default model (optional)

EXAMPLES:
  # Start Gemini proxy
  npx agent-control-plane proxy --provider gemini --port 3000

  # Start OpenRouter proxy with GPT-4o-mini
  npx agent-control-plane proxy --provider openrouter --model "openai/gpt-4o-mini"

  # Use with Claude Code
  export ANTHROPIC_BASE_URL=http://localhost:3000
  export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
  claude
`);
  }

  printQuicHelp(): void {
    console.log(`
Agentic Flow - QUIC Transport Proxy Server

USAGE:
  npx agent-control-plane quic [OPTIONS]

OPTIONS:
  --port, -P <port>           Port number [default: 4433]
  --cert, -c <path>           TLS certificate path
  --key, -k <path>            TLS private key path
  --help, -h                  Show this help

ENVIRONMENT VARIABLES:
  QUIC_PORT                   QUIC server port (default: 4433)
  QUIC_CERT_PATH              Path to TLS certificate
  QUIC_KEY_PATH               Path to TLS private key

EXAMPLES:
  # Start QUIC server (development mode)
  npx agent-control-plane quic

  # Start with custom port
  npx agent-control-plane quic --port 5443

  # Start with production certificates
  npx agent-control-plane quic --cert ./certs/cert.pem --key ./certs/key.pem

  # Use via npm scripts
  npm run proxy:quic         # Start QUIC proxy
  npm run test:quic:wasm     # Test WASM bindings

PROGRAMMATIC USAGE:
  import { QuicTransport } from 'agent-control-plane/transport/quic';

  const transport = new QuicTransport({
    host: 'localhost',
    port: 4433,
    maxConcurrentStreams: 100
  });

  await transport.connect();
  await transport.send({ type: 'task', data: { ... } });

PERFORMANCE:
  • 50-70% faster than TCP-based protocols
  • 0-RTT reconnection (instant resume)
  • 100+ concurrent streams per connection
  • Built-in TLS 1.3 encryption
  • Survives network changes (WiFi ↔ cellular)
`);
  }
}
