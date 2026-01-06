# Tutorial: Add a New MCP Tool

Learn how to create custom MCP tools for agent capabilities.

## Prerequisites

- Understanding of MCP (Model Context Protocol)
- TypeScript knowledge

## Step 1: Create Tool Definition

```typescript
// src/mcp/tools/custom-tool.ts
export const customTool = {
  name: 'custom_calculator',
  description: 'Perform mathematical calculations',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'Mathematical operation to perform',
      },
      a: {
        type: 'number',
        description: 'First operand',
      },
      b: {
        type: 'number',
        description: 'Second operand',
      },
    },
    required: ['operation', 'a', 'b'],
  },
};
```

## Step 2: Implement Tool Handler

```typescript
// src/mcp/handlers/custom-tool.ts
export async function handleCustomCalculator(params: {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}): Promise<{ result: number }> {
  const { operation, a, b } = params;

  switch (operation) {
    case 'add':
      return { result: a + b };
    case 'subtract':
      return { result: a - b };
    case 'multiply':
      return { result: a * b };
    case 'divide':
      if (b === 0) {
        throw new ValidationError('Cannot divide by zero');
      }
      return { result: a / b };
    default:
      throw new ValidationError(`Unknown operation: ${operation}`);
  }
}
```

## Step 3: Register Tool

```typescript
// src/mcp/registry.ts
import { customTool } from './tools/custom-tool.js';
import { handleCustomCalculator } from './handlers/custom-tool.js';

export class MCPToolRegistry {
  private tools = new Map();
  private handlers = new Map();

  register() {
    this.tools.set(customTool.name, customTool);
    this.handlers.set(customTool.name, handleCustomCalculator);
  }

  async execute(toolName: string, params: any): Promise<any> {
    const handler = this.handlers.get(toolName);
    if (!handler) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return await handler(params);
  }
}
```

## Step 4: Use Tool in Agent

```typescript
// src/examples/use-custom-tool.ts
import { AgentSDK } from '@anthropic-ai/claude-agent-sdk';
import { MCPToolRegistry } from '../mcp/registry.js';

async function useCustomTool() {
  // Initialize registry
  const registry = new MCPToolRegistry();
  registry.register();

  // Create agent with tool
  const agent = new AgentSDK({
    apiKey: process.env.ANTHROPIC_API_KEY,
    tools: [registry.tools.get('custom_calculator')],
  });

  // Use agent with tool
  const response = await agent.run({
    agent: 'coder',
    task: 'Calculate 15 + 27 using the custom calculator tool',
  });

  console.log('Result:', response.output);
}
```

## Step 5: Test Tool

```typescript
// tests/mcp/custom-tool.test.ts
import { describe, it, expect } from '@jest/globals';
import { handleCustomCalculator } from '../../src/mcp/handlers/custom-tool.js';
import { ValidationError } from '../../src/errors/index.js';

describe('Custom Calculator Tool', () => {
  it('should add numbers', async () => {
    const result = await handleCustomCalculator({
      operation: 'add',
      a: 5,
      b: 3,
    });
    expect(result.result).toBe(8);
  });

  it('should throw on divide by zero', async () => {
    await expect(
      handleCustomCalculator({
        operation: 'divide',
        a: 10,
        b: 0,
      })
    ).rejects.toThrow(ValidationError);
  });
});
```

## Advanced: Async Tool

```typescript
// src/mcp/tools/async-tool.ts
export const asyncDataFetcher = {
  name: 'fetch_user_data',
  description: 'Fetch user data from API',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID to fetch',
      },
    },
    required: ['userId'],
  },
};

// Handler
export async function handleFetchUserData(params: {
  userId: string;
}): Promise<{ user: User | null }> {
  try {
    const response = await fetch(`https://api.example.com/users/${params.userId}`);
    const user = await response.json();
    return { user };
  } catch (error) {
    throw new NetworkError(`Failed to fetch user: ${params.userId}`);
  }
}
```

## Next Steps

- [Optimize Performance](./04-performance-optimization.md)
- [ReasoningBank Tutorial](./05-reasoningbank-tutorial.md)
