# REST API Documentation

Complete REST API reference for Agentic Flow platform.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Agents](#agents)
  - [MCP Tools](#mcp-tools)
  - [Billing](#billing)
  - [Memory](#memory)
  - [Swarm](#swarm)
  - [GitHub](#github)
- [Error Responses](#error-responses)
- [Webhooks](#webhooks)
- [SDKs](#sdks)

## Base URL

```
Production: https://api.agent-control-plane.io
Development: http://localhost:3000
QUIC: http://localhost:4433
```

## Authentication

All API requests require authentication using API keys or JWT tokens.

### API Key Authentication

Include your API key in the `X-API-Key` header:

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: your-api-key-here"
```

### JWT Bearer Token

For session-based authentication:

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "Authorization: Bearer your-jwt-token"
```

### Getting API Keys

```bash
# Via CLI
npx agent-control-plane auth:login
npx agent-control-plane auth:api-key

# Via API
POST /api/auth/login
POST /api/auth/api-keys
```

## Rate Limiting

Rate limits apply per API key:

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
Retry-After: 30
```

---

## Endpoints

## Agents

### List All Agents

Get a list of all available agents.

```http
GET /api/agents
```

#### Response

```json
{
  "success": true,
  "count": 66,
  "agents": [
    {
      "id": "coder",
      "name": "Coder",
      "type": "core-development",
      "description": "Implementation specialist for writing clean, efficient code",
      "capabilities": ["coding", "refactoring", "debugging"]
    }
  ]
}
```

#### cURL Example

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: your-api-key"
```

---

### Get Agent Details

Get detailed information about a specific agent.

```http
GET /api/agents/{agentId}
```

#### Path Parameters

| Parameter | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| `agentId` | string | Agent identifier (e.g., 'coder') |

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
    "models": ["claude-sonnet-4-5-20250929", "gpt-4o", "deepseek-r1"],
    "defaultModel": "claude-sonnet-4-5-20250929",
    "temperature": 0.7,
    "maxTokens": 4096,
    "systemPrompt": "You are an expert software engineer..."
  }
}
```

#### cURL Example

```bash
curl https://api.agent-control-plane.io/api/agents/coder \
  -H "X-API-Key: your-api-key"
```

---

### Execute Agent

Run an agent with a specific task.

```http
POST /api/agents/execute
```

#### Request Body

```json
{
  "agent": "coder",
  "task": "Build a REST API with authentication",
  "model": "claude-sonnet-4-5-20250929",
  "provider": "anthropic",
  "stream": false,
  "temperature": 0.7,
  "maxTokens": 4096,
  "timeout": 300000
}
```

#### Parameters

| Parameter     | Type    | Required | Description                                   |
| ------------- | ------- | -------- | --------------------------------------------- |
| `agent`       | string  | Yes      | Agent identifier                              |
| `task`        | string  | Yes      | Task description                              |
| `model`       | string  | No       | LLM model to use                              |
| `provider`    | enum    | No       | Provider: anthropic, openrouter, gemini, onnx |
| `stream`      | boolean | No       | Enable streaming (default: false)             |
| `temperature` | number  | No       | Sampling temperature (0.0-1.0)                |
| `maxTokens`   | number  | No       | Maximum response tokens                       |
| `timeout`     | number  | No       | Timeout in milliseconds                       |

#### Response

```json
{
  "success": true,
  "agent": "coder",
  "task": "Build a REST API with authentication",
  "model": "claude-sonnet-4-5-20250929",
  "provider": "anthropic",
  "executionTime": 12450,
  "tokensUsed": 3456,
  "cost": 0.024,
  "output": "I've created a REST API with the following features:\n\n1. Express.js server\n2. JWT authentication\n3. User registration and login\n4. Protected routes\n5. Error handling\n\nHere's the implementation..."
}
```

#### cURL Example

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API with authentication",
    "provider": "anthropic"
  }'
```

#### JavaScript Example

```javascript
const response = await fetch('https://api.agent-control-plane.io/api/agents/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  body: JSON.stringify({
    agent: 'coder',
    task: 'Build a REST API with authentication',
    provider: 'anthropic',
  }),
});

const result = await response.json();
console.log(result.output);
```

#### Python Example

```python
import requests

response = requests.post(
    'https://api.agent-control-plane.io/api/agents/execute',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key'
    },
    json={
        'agent': 'coder',
        'task': 'Build a REST API with authentication',
        'provider': 'anthropic'
    }
)

result = response.json()
print(result['output'])
```

---

### Execute Agent (Streaming)

Execute agent with real-time streaming output.

```http
POST /api/agents/execute/stream
```

#### Request Body

Same as non-streaming execution, but `stream: true` is enforced.

#### Response

Server-Sent Events (SSE) stream:

```
event: start
data: {"agent":"coder","task":"Build a REST API"}

event: token
data: {"token":"I've"}

event: token
data: {"token":" created"}

event: token
data: {"token":" a"}

event: complete
data: {"success":true,"tokensUsed":1234,"cost":0.012}
```

#### JavaScript Example

```javascript
const eventSource = new EventSource(
  'https://api.agent-control-plane.io/api/agents/execute/stream',
  {
    headers: {
      'X-API-Key': 'your-api-key',
    },
  }
);

eventSource.addEventListener('token', (event) => {
  const data = JSON.parse(event.data);
  process.stdout.write(data.token);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log(`\n\nCompleted! Tokens: ${data.tokensUsed}`);
  eventSource.close();
});
```

---

### Batch Execute Agents

Execute multiple agents in parallel.

```http
POST /api/agents/batch
```

#### Request Body

```json
{
  "tasks": [
    {
      "agent": "researcher",
      "task": "Research best practices for REST APIs"
    },
    {
      "agent": "coder",
      "task": "Implement the API endpoints"
    },
    {
      "agent": "tester",
      "task": "Write comprehensive tests"
    }
  ],
  "maxConcurrency": 3,
  "failFast": false
}
```

#### Response

```json
{
  "success": true,
  "totalTasks": 3,
  "completed": 3,
  "failed": 0,
  "totalExecutionTime": 15234,
  "results": [
    {
      "taskId": 0,
      "agent": "researcher",
      "success": true,
      "executionTime": 8456,
      "output": "..."
    },
    {
      "taskId": 1,
      "agent": "coder",
      "success": true,
      "executionTime": 12450,
      "output": "..."
    },
    {
      "taskId": 2,
      "agent": "tester",
      "success": true,
      "executionTime": 9876,
      "output": "..."
    }
  ]
}
```

---

## MCP Tools

### List All MCP Tools

Get a list of all available MCP tools.

```http
GET /api/mcp/tools?package=all
```

#### Query Parameters

| Parameter  | Type   | Description                                                        |
| ---------- | ------ | ------------------------------------------------------------------ |
| `package`  | enum   | Filter by package: agent-control-plane, gendev, agentic-cloud, all |
| `category` | string | Filter by category                                                 |

#### Response

```json
{
  "success": true,
  "totalCount": 213,
  "packages": {
    "agent-control-plane": 7,
    "gendev": 101,
    "agentic-cloud": 96,
    "agentic-payments": 10
  },
  "tools": [
    {
      "name": "agentic_flow_agent",
      "description": "Execute an agent-control-plane agent",
      "package": "agent-control-plane",
      "category": "agent-execution"
    }
  ]
}
```

---

### Get MCP Tool Details

Get detailed schema for a specific tool.

```http
GET /api/mcp/tools/{toolName}
```

#### Response

```json
{
  "success": true,
  "tool": {
    "name": "agentic_flow_agent",
    "description": "Execute an agent-control-plane agent with a specific task",
    "package": "agent-control-plane",
    "category": "agent-execution",
    "inputSchema": {
      "type": "object",
      "properties": {
        "agent": {
          "type": "string",
          "description": "Agent type"
        },
        "task": {
          "type": "string",
          "description": "Task description"
        }
      },
      "required": ["agent", "task"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "success": { "type": "boolean" },
        "output": { "type": "string" }
      }
    },
    "examples": [
      {
        "name": "Execute coder agent",
        "input": {
          "agent": "coder",
          "task": "Build a REST API"
        },
        "output": {
          "success": true,
          "output": "..."
        }
      }
    ]
  }
}
```

---

### Execute MCP Tool

Execute a Model Context Protocol tool.

```http
POST /api/mcp/tools/execute
```

#### Request Body

```json
{
  "toolName": "agentic_flow_agent",
  "parameters": {
    "agent": "coder",
    "task": "Build a REST API"
  }
}
```

#### Response

```json
{
  "success": true,
  "result": {
    "agent": "coder",
    "output": "..."
  }
}
```

---

## Billing

### Create Subscription

Create a new subscription for a user.

```http
POST /api/billing/subscriptions
```

#### Request Body

```json
{
  "userId": "user_123",
  "tier": "professional",
  "billingCycle": "monthly",
  "paymentMethodId": "pm_1234567890",
  "couponCode": "LAUNCH25"
}
```

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
    "price": 36.75,
    "originalPrice": 49.0,
    "discount": 12.25,
    "currency": "USD"
  }
}
```

---

### Get Subscription

Get subscription details.

```http
GET /api/billing/subscriptions/{subscriptionId}
```

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
    "usage": {
      "agent_hours": {
        "used": 45.5,
        "limit": 100,
        "percentage": 45.5
      },
      "api_calls": {
        "used": 12345,
        "limit": 50000,
        "percentage": 24.69
      }
    }
  }
}
```

---

### Cancel Subscription

Cancel an active subscription.

```http
DELETE /api/billing/subscriptions/{subscriptionId}?immediate=false
```

#### Query Parameters

| Parameter   | Type    | Description                                                |
| ----------- | ------- | ---------------------------------------------------------- |
| `immediate` | boolean | Cancel immediately (default: false, cancels at period end) |

#### Response

```json
{
  "success": true,
  "subscription": {
    "id": "sub_1234567890",
    "status": "cancelled",
    "cancelledAt": "2025-01-15T12:00:00Z",
    "endsAt": "2025-02-01T00:00:00Z"
  }
}
```

---

### Record Usage

Record usage for metered billing.

```http
POST /api/billing/usage
```

#### Request Body

```json
{
  "subscriptionId": "sub_1234567890",
  "userId": "user_123",
  "metric": "agent_hours",
  "amount": 2.5,
  "unit": "hours"
}
```

#### Response

```json
{
  "success": true,
  "usageId": "usage_9876543210",
  "recorded": true
}
```

---

## Memory

### Store Memory

Store information in ReasoningBank learning memory.

```http
POST /api/memory/store
```

#### Request Body

```json
{
  "key": "auth_implementation_pattern",
  "value": "JWT authentication with refresh tokens works best for stateless APIs",
  "metadata": {
    "category": "authentication",
    "confidence": 0.95,
    "source": "production_experience"
  }
}
```

#### Response

```json
{
  "success": true,
  "memoryId": "mem_1234567890",
  "stored": true
}
```

---

### Retrieve Memory

Semantic search and retrieval from ReasoningBank.

```http
POST /api/memory/retrieve
```

#### Request Body

```json
{
  "query": "How to implement authentication in REST API?",
  "limit": 5,
  "threshold": 0.7
}
```

#### Response

```json
{
  "success": true,
  "count": 3,
  "results": [
    {
      "key": "auth_implementation_pattern",
      "value": "JWT authentication with refresh tokens works best for stateless APIs",
      "similarity": 0.94,
      "metadata": {
        "category": "authentication",
        "confidence": 0.95
      }
    }
  ]
}
```

---

## Swarm

### Initialize Swarm

Initialize a multi-agent swarm.

```http
POST /api/swarm/init
```

#### Request Body

```json
{
  "topology": "mesh",
  "maxAgents": 10,
  "consensusProtocol": "raft"
}
```

#### Response

```json
{
  "success": true,
  "swarmId": "swarm_1234567890",
  "topology": "mesh",
  "maxAgents": 10,
  "status": "initialized"
}
```

---

### Spawn Agent in Swarm

Add an agent to an existing swarm.

```http
POST /api/swarm/{swarmId}/agents
```

#### Request Body

```json
{
  "agentType": "coder",
  "role": "implementation",
  "capabilities": ["coding", "testing"]
}
```

#### Response

```json
{
  "success": true,
  "agentId": "agent_9876543210",
  "swarmId": "swarm_1234567890",
  "status": "active"
}
```

---

## GitHub

### Analyze Repository

Analyze a GitHub repository using AI swarm.

```http
POST /api/github/analyze
```

#### Request Body

```json
{
  "repository": "Aktoh-Cyber/agent-control-plane",
  "depth": "medium"
}
```

#### Response

```json
{
  "success": true,
  "repository": "Aktoh-Cyber/agent-control-plane",
  "analysis": {
    "language": "TypeScript",
    "stars": 1234,
    "issues": 23,
    "pullRequests": 5,
    "complexity": "medium",
    "recommendations": ["Add more unit tests", "Improve documentation"]
  }
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VAL_3001",
    "message": "Invalid agent identifier",
    "category": "VALIDATION",
    "severity": "ERROR",
    "httpStatus": 400,
    "details": {
      "field": "agent",
      "value": "invalid-agent",
      "constraint": "Must be a valid agent identifier"
    }
  }
}
```

### HTTP Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 503  | Service Unavailable   |

### Error Code Categories

| Range     | Category              |
| --------- | --------------------- |
| 2000-2999 | Database Errors       |
| 3000-3999 | Validation Errors     |
| 4000-4999 | Network Errors        |
| 5000-5999 | Authentication Errors |
| 6000-6999 | Configuration Errors  |
| 7000-7999 | Agent Errors          |

---

## Webhooks

Subscribe to real-time events via webhooks.

### Register Webhook

```http
POST /api/webhooks
```

#### Request Body

```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["agent.execution.complete", "subscription.created", "usage.threshold.exceeded"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `agent.execution.complete` - Agent execution finished
- `agent.execution.failed` - Agent execution failed
- `subscription.created` - New subscription created
- `subscription.cancelled` - Subscription cancelled
- `usage.threshold.exceeded` - Usage exceeded threshold
- `payment.succeeded` - Payment processed
- `payment.failed` - Payment failed

### Webhook Payload

```json
{
  "id": "evt_1234567890",
  "type": "agent.execution.complete",
  "timestamp": "2025-01-15T12:00:00Z",
  "data": {
    "agent": "coder",
    "task": "Build REST API",
    "success": true,
    "executionTime": 12450
  }
}
```

---

## SDKs

Official SDKs for popular languages:

### JavaScript/TypeScript

```bash
npm install agent-control-plane
```

```typescript
import { AgenticFlow } from 'agent-control-plane';

const client = new AgenticFlow({
  apiKey: 'your-api-key',
});

const result = await client.agents.execute({
  agent: 'coder',
  task: 'Build a REST API',
});
```

### Python

```bash
pip install agent-control-plane
```

```python
from agentic_flow import AgenticFlow

client = AgenticFlow(api_key='your-api-key')

result = client.agents.execute(
    agent='coder',
    task='Build a REST API'
)
```

### Go

```bash
go get github.com/Aktoh-Cyber/agent-control-plane-go
```

```go
import "github.com/Aktoh-Cyber/agent-control-plane-go"

client := agenticflow.NewClient("your-api-key")

result, err := client.Agents.Execute(&agenticflow.ExecuteRequest{
    Agent: "coder",
    Task:  "Build a REST API",
})
```

---

## Support

- **Documentation**: https://github.com/Aktoh-Cyber/agent-control-plane/tree/main/docs
- **API Reference**: https://api.agent-control-plane.io/docs
- **Issues**: https://github.com/Aktoh-Cyber/agent-control-plane/issues

---

**Last Updated**: 2025-12-08
**API Version**: v1
