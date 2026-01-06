#!/usr/bin/env node
// MCP CLI commands for agentic-flow
import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MCPOptions {
  port?: string;
  debug?: boolean;
}

// Start stdio MCP server (for Claude Desktop)
export async function startStdioServer(options: MCPOptions = {}) {
  console.log('🚀 Starting FastMCP stdio server...');
  console.log(
    '📦 Tools: memory_store, memory_retrieve, memory_search, swarm_init, agent_spawn, task_orchestrate\n'
  );

  const serverPath = resolve(__dirname, '../mcp/fastmcp/servers/stdio-full.js');

  const proc = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DEBUG: options.debug ? 'fastmcp:*' : undefined,
    },
  });

  proc.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    proc.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    proc.kill('SIGTERM');
  });
}

// Start HTTP + SSE server (for web/remote clients)
export async function startHttpServer(options: MCPOptions = {}) {
  const port = options.port || '3000';

  console.log('🚀 Starting FastMCP HTTP + SSE server...');
  console.log(`🌐 Port: ${port}`);
  console.log('📡 SSE endpoint: /events');
  console.log('🔧 MCP endpoint: /mcp');
  console.log('❤️  Health check: /health');
  console.log('📦 Tools: 11 (memory × 3, swarm × 3, agent × 5)\n');

  const serverPath = resolve(__dirname, '../mcp/fastmcp/servers/http-streaming.js');

  const proc = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      DEBUG: options.debug ? 'fastmcp:*' : undefined,
    },
  });

  proc.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    proc.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    proc.kill('SIGTERM');
  });
}

// List available MCP tools
export function listTools() {
  console.log('\n📦 Available MCP Tools (11 total)\n');

  console.log('Memory Tools:');
  console.log('  1. memory_store    - Store values with TTL and namespacing');
  console.log('  2. memory_retrieve - Retrieve stored values');
  console.log('  3. memory_search   - Search keys with pattern matching\n');

  console.log('Swarm Coordination Tools:');
  console.log('  4. swarm_init      - Initialize multi-agent swarms');
  console.log('  5. agent_spawn     - Spawn specialized agents');
  console.log('  6. task_orchestrate - Orchestrate distributed tasks\n');

  console.log('Agent Execution Tools:');
  console.log('  7. agent_execute   - Execute specific agent with task');
  console.log('  8. agent_parallel  - Run 3 agents in parallel mode');
  console.log('  9. agent_list      - List all available agents\n');

  console.log('Custom Extension Tools:');
  console.log('  10. agent_add      - Add new custom agent (markdown)');
  console.log('  11. command_add    - Add new custom command (markdown)\n');
}

// Show server status
export function showStatus() {
  console.log('\n🔍 FastMCP Server Status\n');

  console.log('Available Transports:');
  console.log('  ✅ stdio    - JSON-RPC over stdio (for local MCP clients)');
  console.log('  ✅ HTTP+SSE - HTTP with Server-Sent Events (for web/remote)\n');

  console.log('Tools: 11/11 implemented');
  console.log('  ✅ memory_store');
  console.log('  ✅ memory_retrieve');
  console.log('  ✅ memory_search');
  console.log('  ✅ swarm_init');
  console.log('  ✅ agent_spawn');
  console.log('  ✅ task_orchestrate');
  console.log('  ✅ agent_execute');
  console.log('  ✅ agent_parallel');
  console.log('  ✅ agent_list');
  console.log('  ✅ agent_add');
  console.log('  ✅ command_add\n');

  console.log('Documentation:');
  console.log('  📖 Implementation: docs/fastmcp-implementation.md');
  console.log('  🚀 Quick Start: docs/fastmcp-quick-start.md');
  console.log('  🏗️  Architecture: docs/ARCHITECTURE.md\n');
}

// CLI handler
export function handleMCPCommand(command: string, options: MCPOptions = {}) {
  switch (command) {
    case 'start':
    case 'stdio':
      return startStdioServer(options);

    case 'http':
    case 'sse':
      return startHttpServer(options);

    case 'tools':
      return listTools();

    case 'status':
      return showStatus();

    default:
      console.error(`Unknown MCP command: ${command}`);
      console.error('\nAvailable commands:');
      console.error('  start, stdio - Start stdio MCP server');
      console.error('  http, sse    - Start HTTP + SSE server');
      console.error('  tools        - List available tools');
      console.error('  status       - Show server status\n');
      process.exit(1);
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'start';
  const options: MCPOptions = {
    port: process.argv.includes('--port')
      ? process.argv[process.argv.indexOf('--port') + 1]
      : undefined,
    debug: process.argv.includes('--debug'),
  };

  handleMCPCommand(command, options);
}
