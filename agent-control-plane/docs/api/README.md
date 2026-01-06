# Agentic Flow API Documentation

Complete API reference for the Agentic Flow platform - production-ready AI agent orchestration with 66 specialized agents, 213+ MCP tools, and autonomous multi-agent swarms.

## Quick Navigation

| Resource                                                 | Description                                     |
| -------------------------------------------------------- | ----------------------------------------------- |
| [OpenAPI Specification](./openapi.yaml)                  | OpenAPI 3.0 spec with all endpoints and schemas |
| [MCP Tools Reference](./mcp-tools.md)                    | Complete documentation for 213+ MCP tools       |
| [REST API Guide](./rest-api.md)                          | REST API endpoints with examples                |
| [Authentication Guide](./authentication.md)              | Authentication and authorization                |
| [Postman Collection](./postman-collection.json)          | Import-ready Postman collection                 |
| [JavaScript Examples](./examples/javascript-examples.md) | JavaScript/TypeScript code examples             |
| [Python Examples](./examples/python-examples.md)         | Python code examples                            |
| [cURL Examples](./examples/curl-examples.md)             | cURL command examples                           |

## Overview

The Agentic Flow API provides:

- **66+ Specialized Agents**: From core development to GitHub integration
- **213+ MCP Tools**: Model Context Protocol tools across 5 packages
- **Multi-Model Router**: Optimize across 100+ LLM models
- **ReasoningBank**: Persistent learning memory system
- **Swarm Coordination**: Multi-agent coordination with consensus protocols
- **GitHub Integration**: Code review, PR management, repository analysis

## Getting Started

### 1. Get an API Key

```bash
# Register and get API key
npx agent-control-plane auth:register
npx agent-control-plane auth:api-key create
```

### 2. Install SDK

```bash
# JavaScript/TypeScript
npm install agent-control-plane

# Python
pip install agent-control-plane
```

### 3. Execute Your First Agent

```javascript
import { AgenticFlow } from 'agent-control-plane';

const client = new AgenticFlow({
  apiKey: process.env.AGENTIC_FLOW_API_KEY,
});

const result = await client.agents.execute({
  agent: 'coder',
  task: 'Build a REST API with authentication',
});

console.log(result.output);
```

```python
from agentic_flow import AgenticFlow

client = AgenticFlow(
    api_key=os.environ.get('AGENTIC_FLOW_API_KEY')
)

result = client.agents.execute(
    agent='coder',
    task='Build a REST API with authentication'
)

print(result.output)
```

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API with authentication"
  }'
```

## API Resources

### Agents

Execute specialized AI agents for development, research, and coordination.

**Key Endpoints:**

- `GET /api/agents` - List all agents
- `POST /api/agents/execute` - Execute an agent
- `POST /api/agents/batch` - Execute multiple agents in parallel

**Documentation:**

- [Agent API Reference](./rest-api.md#agents)
- [Agent Examples](./examples/javascript-examples.md#agent-execution)

### MCP Tools

Access 213+ Model Context Protocol tools for enhanced AI capabilities.

**Tool Packages:**

- **agent-control-plane** (7 tools): Core agent execution
- **gendev** (101 tools): Swarm coordination
- **agentic-cloud** (96 tools): Cloud services
- **agentic-payments** (10 tools): Payment processing
- **agentdb** (17 commands): Memory operations

**Documentation:**

- [MCP Tools Reference](./mcp-tools.md)
- [MCP API Reference](./rest-api.md#mcp-tools)

### Memory

Store and retrieve information using ReasoningBank learning memory.

**Key Endpoints:**

- `POST /api/memory/store` - Store memory
- `POST /api/memory/retrieve` - Semantic search

**Documentation:**

- [Memory API Reference](./rest-api.md#memory)
- [Memory Examples](./examples/javascript-examples.md#memory-operations)

### Swarm

Initialize and manage multi-agent swarms with consensus protocols.

**Key Endpoints:**

- `POST /api/swarm/init` - Initialize swarm
- `POST /api/swarm/{swarmId}/agents` - Spawn agent

**Documentation:**

- [Swarm API Reference](./rest-api.md#swarm)
- [Swarm Examples](./examples/javascript-examples.md#swarm-coordination)

### Billing

Manage subscriptions and usage tracking.

**Key Endpoints:**

- `POST /api/billing/subscriptions` - Create subscription
- `POST /api/billing/usage` - Record usage

**Documentation:**

- [Billing API Reference](./rest-api.md#billing)
- [Billing Tools Reference](./mcp-tools.md#billing-tools)

## Authentication

All API requests require authentication using API keys or JWT tokens.

### API Key Authentication

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: af_live_1234567890abcdef"
```

### JWT Bearer Token

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Full Documentation:** [Authentication Guide](./authentication.md)

## Rate Limits

| Tier         | Requests/Minute | Daily Limit |
| ------------ | --------------- | ----------- |
| Free         | 10              | 500         |
| Hobby        | 60              | 5,000       |
| Professional | 300             | 50,000      |
| Business     | 1,000           | 500,000     |
| Enterprise   | Custom          | Unlimited   |

## Error Handling

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
      "constraint": "Must be a valid agent identifier"
    }
  }
}
```

### Error Code Ranges

| Range     | Category              |
| --------- | --------------------- |
| 2000-2999 | Database Errors       |
| 3000-3999 | Validation Errors     |
| 4000-4999 | Network Errors        |
| 5000-5999 | Authentication Errors |
| 6000-6999 | Configuration Errors  |
| 7000-7999 | Agent Errors          |

## SDKs

### JavaScript/TypeScript

```bash
npm install agent-control-plane
```

```typescript
import { AgenticFlow } from 'agent-control-plane';

const client = new AgenticFlow({
  apiKey: 'your-api-key',
});
```

**Documentation:** [JavaScript Examples](./examples/javascript-examples.md)

### Python

```bash
pip install agent-control-plane
```

```python
from agentic_flow import AgenticFlow

client = AgenticFlow(api_key='your-api-key')
```

**Documentation:** [Python Examples](./examples/python-examples.md)

### cURL

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: your-api-key"
```

**Documentation:** [cURL Examples](./examples/curl-examples.md)

## OpenAPI Specification

Import our OpenAPI 3.0 specification into your favorite tools:

- **Swagger UI**: View interactive documentation
- **Postman**: Import for API testing
- **OpenAPI Generator**: Generate SDKs in 40+ languages

**Download:** [openapi.yaml](./openapi.yaml)

## Postman Collection

Import our complete Postman collection for easy API testing:

1. Download [postman-collection.json](./postman-collection.json)
2. Import into Postman
3. Set environment variables:
   - `base_url`: https://api.agent-control-plane.io
   - `api_key`: your-api-key-here
4. Start making requests!

## Base URLs

```
Production: https://api.agent-control-plane.io
Development: http://localhost:3000
QUIC: http://localhost:4433
```

## API Versioning

Current version: **v1**

- All endpoints are prefixed with `/api/`
- Breaking changes will result in new API versions
- Deprecated endpoints are supported for 6 months after deprecation

## Webhooks

Subscribe to real-time events:

```bash
curl -X POST https://api.agent-control-plane.io/api/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "url": "https://your-domain.com/webhook",
    "events": [
      "agent.execution.complete",
      "subscription.created",
      "usage.threshold.exceeded"
    ]
  }'
```

**Available Events:**

- `agent.execution.complete` - Agent finished
- `agent.execution.failed` - Agent failed
- `subscription.created` - New subscription
- `subscription.cancelled` - Subscription cancelled
- `usage.threshold.exceeded` - Usage limit exceeded
- `payment.succeeded` - Payment processed
- `payment.failed` - Payment failed

## Best Practices

### 1. Use Environment Variables

Never hardcode API keys:

```javascript
// ✅ Good
const apiKey = process.env.AGENTIC_FLOW_API_KEY;

// ❌ Bad
const apiKey = 'af_live_1234567890abcdef';
```

### 2. Implement Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await client.agents.execute({...});
} catch (error) {
  if (error.code === 'AUTH_5102') {
    // Refresh token
  } else if (error.code === 'NET_4012') {
    // Retry after delay
  }
}
```

### 3. Use Batch Operations

Optimize by batching multiple requests:

```javascript
const results = await client.agents.batch({
  tasks: [
    { agent: 'researcher', task: 'Research' },
    { agent: 'coder', task: 'Implement' },
    { agent: 'tester', task: 'Test' },
  ],
});
```

### 4. Monitor Rate Limits

Check rate limit headers:

```bash
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### 5. Enable Streaming for Long Tasks

Use streaming for real-time feedback:

```javascript
const stream = await client.agents.executeStream({
  agent: 'coder',
  task: 'Build a complex application',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.token);
}
```

## Support

- **Documentation**: https://github.com/Aktoh-Cyber/agent-control-plane/tree/main/docs
- **API Status**: https://status.agent-control-plane.io
- **Issues**: https://github.com/Aktoh-Cyber/agent-control-plane/issues
- **Discord**: https://discord.gg/agent-control-plane
- **Email**: support@agent-control-plane.io

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for version history and updates.

## License

MIT License - See [LICENSE](../../LICENSE) for details.

---

**Last Updated**: 2025-12-08
**Version**: 1.10.3
**API Version**: v1
