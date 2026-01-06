# MCP Tools Reference

Complete reference for all 213+ Model Context Protocol (MCP) tools across the Agentic Flow ecosystem.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Tool Categories](#tool-categories)
- [Agentic-Flow Core Tools (7)](#agent-control-plane-core-tools)
- [Billing Tools (11)](#billing-tools)
- [AgentDB Commands (17)](#agentdb-commands)
- [Claude-Flow Tools (101)](#gendev-tools)
- [Flow-Nexus Tools (96)](#agentic-cloud-tools)
- [Agentic-Payments Tools (10)](#agentic-payments-tools)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

## Overview

**Total MCP Tools**: 242+

| Package                 | Tool Count | Description                           |
| ----------------------- | ---------- | ------------------------------------- |
| **agent-control-plane** | 7          | Core agent execution and management   |
| **billing**             | 11         | Subscription and usage management     |
| **agentdb**             | 17         | Memory operations and learning        |
| **gendev**              | 101        | Swarm coordination and orchestration  |
| **agentic-cloud**       | 96         | Cloud-based AI services and templates |
| **agentic-payments**    | 10         | Payment authorization and webhooks    |

## Quick Start

### Installation

```bash
# Install agent-control-plane with MCP support
npm install agent-control-plane

# Add MCP servers to Claude Desktop
claude mcp add agent-control-plane npx agent-control-plane mcp start
claude mcp add gendev npx gendev@alpha mcp start
claude mcp add agentic-cloud npx agentic-cloud@latest mcp start
```

### Basic Usage

```typescript
import { FastMCP } from 'fastmcp';

const server = new FastMCP({ name: 'agent-control-plane', version: '1.10.3' });

// List all available tools
const tools = await server.listTools();

// Execute a tool
const result = await server.callTool('agentic_flow_agent', {
  agent: 'coder',
  task: 'Build a REST API',
});
```

## Tool Categories

### By Functionality

- **Agent Operations**: Agent execution, listing, management
- **Memory & Learning**: ReasoningBank, AgentDB, skill learning
- **Swarm Coordination**: Initialization, spawning, consensus
- **GitHub Integration**: PR management, code review, issues
- **Billing & Payments**: Subscriptions, usage tracking, coupons
- **Cloud Services**: Sandboxes, templates, neural training
- **Monitoring**: Metrics, status, performance tracking

### By Access Level

- **Public**: Available to all users
- **Authenticated**: Requires API key
- **Premium**: Requires paid subscription
- **Enterprise**: Custom enterprise plans

---

## Agentic-Flow Core Tools

### 1. agentic_flow_agent

Execute an agent-control-plane agent with a specific task.

**Category**: Agent Operations
**Access**: Public
**Package**: agent-control-plane

#### Parameters

| Parameter          | Type    | Required | Description                                       |
| ------------------ | ------- | -------- | ------------------------------------------------- |
| `agent`            | string  | Yes      | Agent type (coder, researcher, analyst, etc.)     |
| `task`             | string  | Yes      | Task description for the agent to execute         |
| `model`            | string  | No       | Model to use (e.g., "claude-sonnet-4-5-20250929") |
| `provider`         | enum    | No       | LLM provider: anthropic, openrouter, onnx, gemini |
| `anthropicApiKey`  | string  | No       | Anthropic API key (overrides env var)             |
| `openrouterApiKey` | string  | No       | OpenRouter API key (overrides env var)            |
| `stream`           | boolean | No       | Enable streaming output (default: false)          |
| `temperature`      | number  | No       | Sampling temperature (0.0-1.0)                    |
| `maxTokens`        | number  | No       | Maximum tokens in response (default: 4096)        |
| `agentsDir`        | string  | No       | Custom agents directory path                      |
| `outputFormat`     | enum    | No       | Output format: text, json, markdown               |
| `verbose`          | boolean | No       | Enable verbose logging (default: false)           |
| `timeout`          | number  | No       | Execution timeout in ms (default: 300000)         |
| `retryOnError`     | boolean | No       | Auto-retry on transient errors (default: false)   |

#### Response

```json
{
  "success": true,
  "agent": "coder",
  "task": "Build a REST API",
  "model": "claude-sonnet-4-5-20250929",
  "provider": "anthropic",
  "output": "I've created a REST API with the following features..."
}
```

#### Example

```typescript
const result = await server.callTool('agentic_flow_agent', {
  agent: 'coder',
  task: 'Build a REST API with authentication',
  provider: 'anthropic',
  stream: false,
  maxTokens: 4096,
});
```

#### Error Codes

| Code       | Description            |
| ---------- | ---------------------- |
| `AGT_7001` | Agent not found        |
| `AGT_7302` | Agent execution failed |
| `AGT_7303` | Agent timeout          |
| `VAL_3001` | Invalid parameters     |

---

### 2. agentic_flow_list_agents

List all available agent-control-plane agents.

**Category**: Agent Operations
**Access**: Public
**Package**: agent-control-plane

#### Parameters

None

#### Response

```json
{
  "success": true,
  "agents": "Available Agents (66):\n\nCore Development:\n- coder\n- reviewer\n- tester..."
}
```

#### Example

```bash
# CLI
npx agent-control-plane --list

# MCP Tool
const result = await server.callTool('agentic_flow_list_agents', {});
```

---

### 3. agentic_flow_agent_info

Get detailed information about a specific agent.

**Category**: Agent Operations
**Access**: Public
**Package**: agent-control-plane

#### Parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `agentId` | string | Yes      | Agent identifier |

#### Response

```json
{
  "success": true,
  "agent": {
    "id": "coder",
    "name": "Coder",
    "type": "core-development",
    "description": "Implementation specialist for writing clean, efficient code",
    "capabilities": ["coding", "refactoring", "debugging"],
    "defaultModel": "claude-sonnet-4-5-20250929",
    "temperature": 0.7,
    "maxTokens": 4096
  }
}
```

---

### 4. agentic_flow_mcp_status

Check MCP server status and statistics.

**Category**: Monitoring
**Access**: Public
**Package**: agent-control-plane

#### Parameters

None

#### Response

```json
{
  "success": true,
  "status": "running",
  "uptime": 12345,
  "toolCount": 7,
  "requestsHandled": 156,
  "version": "1.10.3"
}
```

---

### 5. agentic_flow_optimize_model

Optimize model selection for a task based on cost/quality priorities.

**Category**: Model Optimization
**Access**: Public
**Package**: agent-control-plane

#### Parameters

| Parameter  | Type   | Required | Description                                           |
| ---------- | ------ | -------- | ----------------------------------------------------- |
| `agent`    | string | Yes      | Agent type                                            |
| `task`     | string | Yes      | Task description                                      |
| `priority` | enum   | No       | Optimization priority: cost, quality, speed, balanced |
| `maxCost`  | number | No       | Maximum cost per task in USD                          |

#### Response

```json
{
  "success": true,
  "recommendedModel": "deepseek-r1",
  "provider": "openrouter",
  "estimatedCost": 0.012,
  "qualityScore": 0.92,
  "speedScore": 0.88,
  "reasoning": "DeepSeek R1 provides 85% cost savings with flagship quality"
}
```

---

### 6. agentic_flow_stream_agent

Execute agent with real-time streaming output.

**Category**: Agent Operations
**Access**: Public
**Package**: agent-control-plane

#### Parameters

Similar to `agentic_flow_agent` but with `stream: true` enforced.

#### Response

Server-Sent Events (SSE) stream:

```
event: token
data: {"token": "I've"}

event: token
data: {"token": " created"}

event: complete
data: {"success": true, "tokensUsed": 1234}
```

---

### 7. agentic_flow_batch_execute

Execute multiple agents in parallel for complex workflows.

**Category**: Agent Operations
**Access**: Authenticated
**Package**: agent-control-plane

#### Parameters

| Parameter        | Type    | Required | Description                              |
| ---------------- | ------- | -------- | ---------------------------------------- |
| `tasks`          | array   | Yes      | Array of agent execution tasks           |
| `maxConcurrency` | number  | No       | Maximum parallel executions (default: 3) |
| `failFast`       | boolean | No       | Stop on first error (default: false)     |

#### Response

```json
{
  "success": true,
  "totalTasks": 5,
  "completed": 5,
  "failed": 0,
  "results": [
    {
      "taskId": 0,
      "success": true,
      "output": "..."
    }
  ]
}
```

---

## Billing Tools

### 1. billing_subscription_create

Create a new subscription for a user.

**Category**: Billing
**Access**: Authenticated
**Package**: agent-control-plane/billing

#### Parameters

| Parameter         | Type   | Required | Description                                                        |
| ----------------- | ------ | -------- | ------------------------------------------------------------------ |
| `userId`          | string | Yes      | User ID                                                            |
| `tier`            | enum   | Yes      | Subscription tier: free, hobby, professional, business, enterprise |
| `billingCycle`    | enum   | Yes      | Billing cycle: monthly, quarterly, yearly                          |
| `paymentMethodId` | string | Yes      | Payment method ID                                                  |
| `couponCode`      | string | No       | Optional coupon code                                               |

#### Response

```json
{
  "success": true,
  "subscription": {
    "id": "sub_1234567890",
    "userId": "user_123",
    "tier": "professional",
    "status": "active",
    "billingCycle": "monthly",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z",
    "price": 49.0,
    "currency": "USD"
  }
}
```

---

### 2. billing_subscription_upgrade

Upgrade a subscription to a higher tier.

#### Parameters

| Parameter        | Type   | Required | Description           |
| ---------------- | ------ | -------- | --------------------- |
| `subscriptionId` | string | Yes      | Subscription ID       |
| `newTier`        | enum   | Yes      | New subscription tier |

---

### 3. billing_subscription_cancel

Cancel a subscription.

#### Parameters

| Parameter        | Type    | Required | Description                                                |
| ---------------- | ------- | -------- | ---------------------------------------------------------- |
| `subscriptionId` | string  | Yes      | Subscription ID                                            |
| `immediate`      | boolean | No       | Cancel immediately (default: false, cancels at period end) |

---

### 4. billing_subscription_get

Get subscription details.

#### Parameters

| Parameter        | Type   | Required | Description     |
| ---------------- | ------ | -------- | --------------- |
| `subscriptionId` | string | Yes      | Subscription ID |

---

### 5. billing_usage_record

Record usage for metered billing.

#### Parameters

| Parameter        | Type   | Required | Description                                 |
| ---------------- | ------ | -------- | ------------------------------------------- |
| `subscriptionId` | string | Yes      | Subscription ID                             |
| `userId`         | string | Yes      | User ID                                     |
| `metric`         | enum   | Yes      | Usage metric (agent_hours, api_calls, etc.) |
| `amount`         | number | Yes      | Usage amount                                |
| `unit`           | string | Yes      | Unit of measurement                         |

---

### 6. billing_usage_summary

Get usage summary for a subscription.

#### Parameters

| Parameter        | Type   | Required | Description     |
| ---------------- | ------ | -------- | --------------- |
| `subscriptionId` | string | Yes      | Subscription ID |

---

### 7. billing_quota_check

Check if subscription is within quota limits.

#### Parameters

| Parameter        | Type   | Required | Description           |
| ---------------- | ------ | -------- | --------------------- |
| `subscriptionId` | string | Yes      | Subscription ID       |
| `metric`         | enum   | Yes      | Usage metric to check |

---

### 8. billing_pricing_tiers

List all available pricing tiers.

#### Parameters

None

#### Response

```json
{
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "priceMonthly": 0,
      "priceYearly": 0,
      "limits": {
        "agent_hours": 10,
        "api_calls": 1000,
        "storage_gb": 1
      }
    },
    {
      "id": "professional",
      "name": "Professional",
      "priceMonthly": 49,
      "priceYearly": 490,
      "limits": {
        "agent_hours": 100,
        "api_calls": 50000,
        "storage_gb": 50
      }
    }
  ]
}
```

---

### 9. billing_pricing_calculate

Calculate price for a specific tier and cycle.

#### Parameters

| Parameter | Type | Required | Description       |
| --------- | ---- | -------- | ----------------- |
| `tier`    | enum | Yes      | Subscription tier |
| `cycle`   | enum | Yes      | Billing cycle     |

---

### 10. billing_coupon_create

Create a new coupon code.

#### Parameters

| Parameter        | Type   | Required | Description                                       |
| ---------------- | ------ | -------- | ------------------------------------------------- |
| `code`           | string | Yes      | Coupon code                                       |
| `type`           | enum   | Yes      | Coupon type: percentage, fixed_amount, free_trial |
| `value`          | number | Yes      | Discount value                                    |
| `description`    | string | No       | Coupon description                                |
| `maxRedemptions` | number | No       | Maximum number of redemptions                     |
| `validUntil`     | string | No       | Expiration date (ISO 8601)                        |

---

### 11. billing_coupon_validate

Validate a coupon code.

#### Parameters

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `code`    | string | Yes      | Coupon code                |
| `tier`    | enum   | Yes      | Subscription tier          |
| `amount`  | number | Yes      | Amount to validate against |

---

## AgentDB Commands

AgentDB provides 17 CLI commands for memory operations. These can be accessed via MCP tools or CLI.

### Memory Commands

1. **agentdb_reflexion_store** - Store reflexion memory
2. **agentdb_reflexion_query** - Query reflexion memories
3. **agentdb_reflexion_stats** - Get reflexion statistics
4. **agentdb_skill_create** - Create a new skill
5. **agentdb_skill_search** - Search for skills
6. **agentdb_skill_update** - Update skill performance
7. **agentdb_causal_add_edge** - Add causal relationship
8. **agentdb_causal_query** - Query causal graph
9. **agentdb_causal_path** - Find causal path
10. **agentdb_recall_semantic** - Semantic memory recall
11. **agentdb_recall_explain** - Explainable recall
12. **agentdb_learner_run** - Run nightly learner
13. **agentdb_learner_status** - Get learner status
14. **agentdb_database_stats** - Database statistics
15. **agentdb_database_export** - Export database
16. **agentdb_database_import** - Import database
17. **agentdb_database_reset** - Reset database

### Example: Reflexion Memory

```bash
# CLI
npx agentdb reflexion store "session-1" "implement_auth" 0.95 true "Success!"

# MCP Tool
await server.callTool('agentdb_reflexion_store', {
  sessionId: 'session-1',
  taskName: 'implement_auth',
  score: 0.95,
  success: true,
  reflection: 'Authentication implemented successfully with JWT tokens'
});
```

---

## Claude-Flow Tools

Claude-Flow provides 101 MCP tools for swarm coordination and orchestration.

### Categories

- **Swarm Management** (20 tools): init, spawn, status, scale
- **Task Orchestration** (15 tools): orchestrate, assign, monitor
- **Memory Operations** (12 tools): store, retrieve, sync
- **Neural Features** (10 tools): train, patterns, predict
- **GitHub Integration** (15 tools): repo analyze, PR manage, code review
- **Consensus Protocols** (10 tools): raft, byzantine, gossip
- **Performance Monitoring** (10 tools): metrics, bottlenecks, optimization
- **Distributed Systems** (9 tools): CRDT, quorum, partition

### Key Tools

#### swarm_init

Initialize a multi-agent swarm with specific topology.

```typescript
await server.callTool('swarm_init', {
  topology: 'mesh',
  maxAgents: 10,
  consensusProtocol: 'raft',
});
```

#### agent_spawn

Spawn a new agent in an existing swarm.

```typescript
await server.callTool('agent_spawn', {
  swarmId: 'swarm-123',
  agentType: 'coder',
  role: 'implementation',
  capabilities: ['coding', 'testing'],
});
```

#### task_orchestrate

Orchestrate complex multi-agent tasks.

```typescript
await server.callTool('task_orchestrate', {
  swarmId: 'swarm-123',
  taskGraph: {
    tasks: [
      { id: '1', agent: 'researcher', depends: [] },
      { id: '2', agent: 'coder', depends: ['1'] },
      { id: '3', agent: 'tester', depends: ['2'] },
    ],
  },
});
```

---

## Flow-Nexus Tools

Flow-Nexus provides 96 cloud-based MCP tools (requires authentication).

### Categories

- **Cloud Sandboxes** (15 tools): E2B sandbox management
- **Templates** (12 tools): Pre-built project templates
- **Neural AI** (10 tools): Training, patterns, Seraphina AI
- **GitHub Advanced** (10 tools): Advanced repository management
- **Real-time Streaming** (8 tools): Live execution monitoring
- **Storage** (10 tools): Cloud file management
- **User Management** (8 tools): Authentication, profiles
- **Payment Integration** (8 tools): Stripe integration
- **Challenges** (8 tools): Coding challenges, leaderboards
- **App Store** (7 tools): Browse and deploy apps

### Authentication

```bash
# Register
npx agentic-cloud register

# Login
npx agentic-cloud login

# Get API key
export FLOW_NEXUS_API_KEY=your-api-key
```

### Key Tools

#### sandbox_create

Create a cloud sandbox for code execution.

```typescript
await server.callTool('sandbox_create', {
  template: 'node-typescript',
  timeout: 300000,
  resources: {
    cpu: 2,
    memory: 4096,
  },
});
```

#### neural_train

Train neural patterns from agent experiences.

```typescript
await server.callTool('neural_train', {
  sessionId: 'session-123',
  modelType: 'pattern_recognition',
  epochs: 100,
});
```

---

## Agentic-Payments Tools

Agentic-Payments provides 10 MCP tools for payment authorization.

### Tools

1. **payment_authorize** - Authorize payment for agent actions
2. **payment_capture** - Capture authorized payment
3. **payment_refund** - Refund payment
4. **payment_status** - Get payment status
5. **webhook_register** - Register payment webhook
6. **webhook_verify** - Verify webhook signature
7. **balance_get** - Get account balance
8. **transaction_list** - List transactions
9. **payment_method_add** - Add payment method
10. **payment_method_delete** - Delete payment method

---

## Error Handling

### Standard Error Response

All MCP tools return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "AGT_7001",
    "message": "Agent not found: invalid-agent",
    "category": "AGENT",
    "severity": "ERROR",
    "httpStatus": 404,
    "details": {
      "requestedAgent": "invalid-agent",
      "availableAgents": ["coder", "researcher", "..."]
    }
  }
}
```

### Error Code Ranges

| Range     | Category       | Description                                   |
| --------- | -------------- | --------------------------------------------- |
| 2000-2999 | Database       | Database connection, query, constraint errors |
| 3000-3999 | Validation     | Input validation, schema errors               |
| 4000-4999 | Network        | HTTP, API, connectivity errors                |
| 5000-5999 | Authentication | Auth, authorization, token errors             |
| 6000-6999 | Configuration  | Config, environment, initialization errors    |
| 7000-7999 | Agent          | Agent execution, coordination, task errors    |

### Retry Logic

Use exponential backoff for retryable errors:

```typescript
async function callToolWithRetry(toolName, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await server.callTool(toolName, params);
    } catch (error) {
      if (!isRetryableError(error) || i === maxRetries - 1) {
        throw error;
      }
      const delay = Math.min(1000 * Math.pow(2, i), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function isRetryableError(error) {
  const retryableCodes = ['NET_4008', 'NET_4012', 'DB_2401', 'AGT_7303'];
  return retryableCodes.includes(error.code);
}
```

---

## Rate Limits

### Default Limits

| Tier         | Requests/Minute | Burst  | Daily Limit |
| ------------ | --------------- | ------ | ----------- |
| Free         | 10              | 20     | 500         |
| Hobby        | 60              | 100    | 5,000       |
| Professional | 300             | 500    | 50,000      |
| Business     | 1,000           | 2,000  | 500,000     |
| Enterprise   | Custom          | Custom | Unlimited   |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

```typescript
async function callToolWithRateLimit(toolName, params) {
  try {
    return await server.callTool(toolName, params);
  } catch (error) {
    if (error.code === 'NET_4012') {
      const retryAfter = error.details?.retryAfter || 60;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return callToolWithRateLimit(toolName, params);
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Tool Selection

Choose the right tool for your task:

- **Simple agent execution**: Use `agentic_flow_agent`
- **Complex workflows**: Use `agentic_flow_batch_execute` or `task_orchestrate`
- **Cost optimization**: Use `agentic_flow_optimize_model`
- **Long-running tasks**: Use streaming with `agentic_flow_stream_agent`

### 2. Error Handling

Always implement proper error handling:

```typescript
try {
  const result = await server.callTool('agentic_flow_agent', params);
} catch (error) {
  if (error.category === 'VALIDATION') {
    // Fix input parameters
  } else if (error.category === 'NETWORK') {
    // Retry with backoff
  } else {
    // Log and alert
  }
}
```

### 3. Performance Optimization

- Use batch operations for multiple agents
- Enable streaming for real-time feedback
- Cache frequently used results
- Monitor rate limits

### 4. Security

- Never expose API keys in client code
- Use environment variables for credentials
- Implement webhook signature verification
- Rotate API keys regularly

---

## Support

- **Documentation**: https://github.com/Aktoh-Cyber/agent-control-plane/tree/main/docs
- **Issues**: https://github.com/Aktoh-Cyber/agent-control-plane/issues
- **Discord**: https://discord.gg/agent-control-plane

---

**Last Updated**: 2025-12-08
**Version**: 1.10.3
