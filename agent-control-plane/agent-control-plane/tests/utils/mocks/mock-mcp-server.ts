/**
 * Mock MCP Server
 * Mock Model Context Protocol server for testing
 */

import type { JsonObject, JsonValue, ToolInputSchema } from '../../../src/types/test-helpers.js';

export interface MCPMessage {
  id: string;
  method: string;
  params?: JsonObject;
  result?: JsonValue;
  error?: {
    code: number;
    message: string;
    data?: JsonValue;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

export class MockMCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private handlers: Map<string, (params: JsonObject) => Promise<JsonValue>> = new Map();
  private messages: MCPMessage[] = [];
  private connected: boolean = false;
  private initialized: boolean = false;

  /**
   * Connect to server
   */
  async connect(): Promise<void> {
    this.connected = true;
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.initialized = false;
  }

  /**
   * Initialize server
   */
  async initialize(params: JsonObject): Promise<JsonValue> {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    this.initialized = true;

    return {
      protocolVersion: '1.0',
      capabilities: {
        tools: true,
        prompts: true,
        resources: true,
      },
      serverInfo: {
        name: 'mock-mcp-server',
        version: '1.0.0',
      },
    };
  }

  /**
   * Register a tool
   */
  registerTool(tool: MCPTool, handler: (params: JsonObject) => Promise<JsonValue>): void {
    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, handler);
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error('Not initialized');
    }

    return Array.from(this.tools.values());
  }

  /**
   * Call a tool
   */
  async callTool(name: string, params: JsonObject): Promise<JsonValue> {
    if (!this.initialized) {
      throw new Error('Not initialized');
    }

    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }

    const message: MCPMessage = {
      id: `msg-${this.messages.length + 1}`,
      method: 'tools/call',
      params: { name, arguments: params },
    };

    try {
      const result = await handler(params);
      message.result = result;
      this.messages.push(message);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error = {
        code: -32000,
        message: errorMessage,
      };
      this.messages.push(message);
      throw error;
    }
  }

  /**
   * Send request
   */
  async request(method: string, params?: JsonObject): Promise<JsonValue> {
    const message: MCPMessage = {
      id: `msg-${this.messages.length + 1}`,
      method,
      params,
    };

    this.messages.push(message);

    // Handle specific methods
    switch (method) {
      case 'initialize':
        return this.initialize(params || {});
      case 'tools/list':
        return this.listTools();
      case 'tools/call':
        if (!params || typeof params.name !== 'string') {
          throw new Error('Invalid params for tools/call');
        }
        return this.callTool(params.name, (params.arguments as JsonObject) || {});
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Get message history
   */
  getMessages(): MCPMessage[] {
    return [...this.messages];
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connected: this.connected,
      initialized: this.initialized,
      toolCount: this.tools.size,
      messageCount: this.messages.length,
    };
  }

  /**
   * Reset server state
   */
  reset(): void {
    this.tools.clear();
    this.handlers.clear();
    this.messages = [];
    this.connected = false;
    this.initialized = false;
  }
}

/**
 * Factory function for creating a mock MCP server
 */
export function createMockMCPServer(): MockMCPServer {
  return new MockMCPServer();
}

/**
 * Create mock MCP server with common tools
 */
export function createMockMCPServerWithTools(): MockMCPServer {
  const server = new MockMCPServer();

  // Memory tool
  server.registerTool(
    {
      name: 'memory_usage',
      description: 'Store or retrieve memory',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['store', 'retrieve'] },
          key: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
    async (params) => {
      if (params.action === 'store') {
        return { success: true, key: params.key };
      } else {
        return { value: 'mock-value' };
      }
    }
  );

  // Swarm init tool
  server.registerTool(
    {
      name: 'swarm_init',
      description: 'Initialize a swarm',
      inputSchema: {
        type: 'object',
        properties: {
          topology: { type: 'string' },
          maxAgents: { type: 'number' },
        },
      },
    },
    async (params) => {
      return {
        swarmId: 'swarm-123',
        topology: params.topology,
        status: 'initialized',
      };
    }
  );

  return server;
}
