# cURL Examples

Complete collection of cURL commands for testing Agentic Flow API.

## Table of Contents

- [Authentication](#authentication)
- [Agents](#agents)
- [MCP Tools](#mcp-tools)
- [Billing](#billing)
- [Memory](#memory)
- [Swarm](#swarm)
- [GitHub](#github)

## Authentication

### Login

```bash
curl -X POST https://api.agent-control-plane.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'
```

### Refresh Token

```bash
curl -X POST https://api.agent-control-plane.io/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "ref_1234567890abcdef"
  }'
```

### Get Session

```bash
curl https://api.agent-control-plane.io/api/auth/session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Logout

```bash
curl -X POST https://api.agent-control-plane.io/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Agents

### List All Agents

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: YOUR_API_KEY"
```

### Get Agent Details

```bash
curl https://api.agent-control-plane.io/api/agents/coder \
  -H "X-API-Key: YOUR_API_KEY"
```

### Execute Agent

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API with authentication",
    "model": "claude-sonnet-4-5-20250929",
    "provider": "anthropic",
    "maxTokens": 4096
  }'
```

### Execute Agent with Cost Optimization

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a simple REST API",
    "provider": "openrouter",
    "model": "deepseek-r1",
    "temperature": 0.7
  }'
```

### Execute Agent with Streaming

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute/stream \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API",
    "stream": true
  }'
```

### Batch Execute Agents

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "tasks": [
      {
        "agent": "researcher",
        "task": "Research REST API best practices"
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
  }'
```

## MCP Tools

### List All MCP Tools

```bash
curl "https://api.agent-control-plane.io/api/mcp/tools?package=all" \
  -H "X-API-Key: YOUR_API_KEY"
```

### List Tools by Package

```bash
curl "https://api.agent-control-plane.io/api/mcp/tools?package=agent-control-plane" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Get MCP Tool Details

```bash
curl https://api.agent-control-plane.io/api/mcp/tools/agentic_flow_agent \
  -H "X-API-Key: YOUR_API_KEY"
```

### Execute MCP Tool

```bash
curl -X POST https://api.agent-control-plane.io/api/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "toolName": "agentic_flow_agent",
    "parameters": {
      "agent": "coder",
      "task": "Build a REST API",
      "provider": "anthropic"
    }
  }'
```

## Billing

### Create Subscription

```bash
curl -X POST https://api.agent-control-plane.io/api/billing/subscriptions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "userId": "user_123",
    "tier": "professional",
    "billingCycle": "monthly",
    "paymentMethodId": "pm_1234567890",
    "couponCode": "LAUNCH25"
  }'
```

### Get Subscription

```bash
curl https://api.agent-control-plane.io/api/billing/subscriptions/sub_1234567890 \
  -H "X-API-Key: YOUR_API_KEY"
```

### Cancel Subscription

```bash
curl -X DELETE "https://api.agent-control-plane.io/api/billing/subscriptions/sub_1234567890?immediate=false" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Record Usage

```bash
curl -X POST https://api.agent-control-plane.io/api/billing/usage \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "subscriptionId": "sub_1234567890",
    "userId": "user_123",
    "metric": "agent_hours",
    "amount": 2.5,
    "unit": "hours"
  }'
```

## Memory

### Store Memory

```bash
curl -X POST https://api.agent-control-plane.io/api/memory/store \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "key": "auth_implementation_pattern",
    "value": "JWT authentication with refresh tokens works best for stateless APIs",
    "metadata": {
      "category": "authentication",
      "confidence": 0.95,
      "source": "production_experience"
    }
  }'
```

### Retrieve Memory

```bash
curl -X POST https://api.agent-control-plane.io/api/memory/retrieve \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "query": "How to implement authentication in REST API?",
    "limit": 5,
    "threshold": 0.7
  }'
```

## Swarm

### Initialize Swarm

```bash
curl -X POST https://api.agent-control-plane.io/api/swarm/init \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "topology": "mesh",
    "maxAgents": 10,
    "consensusProtocol": "raft"
  }'
```

### Spawn Agent in Swarm

```bash
curl -X POST https://api.agent-control-plane.io/api/swarm/swarm_1234567890/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agentType": "coder",
    "role": "implementation",
    "capabilities": ["coding", "testing"]
  }'
```

## GitHub

### Analyze Repository

```bash
curl -X POST https://api.agent-control-plane.io/api/github/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "repository": "Aktoh-Cyber/agent-control-plane",
    "depth": "medium"
  }'
```

## Advanced Examples

### Save Response to File

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API"
  }' \
  -o response.json
```

### Show Response Headers

```bash
curl -i https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: YOUR_API_KEY"
```

### Verbose Output for Debugging

```bash
curl -v -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API"
  }'
```

### Using Environment Variables

```bash
# Set API key
export API_KEY="af_live_1234567890abcdef"

# Use in requests
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: $API_KEY"
```

### Formatted JSON Output with jq

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: YOUR_API_KEY" \
  | jq '.'
```

### Extract Specific Field

```bash
curl https://api.agent-control-plane.io/api/agents/coder \
  -H "X-API-Key: YOUR_API_KEY" \
  | jq '.agent.description'
```

### Handle Rate Limiting

```bash
curl -X POST https://api.agent-control-plane.io/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "agent": "coder",
    "task": "Build a REST API"
  }' \
  -w "\nHTTP Status: %{http_code}\nRate Limit Remaining: %{header_x-ratelimit-remaining}\n"
```

## Bash Scripts

### Simple Agent Execution Script

```bash
#!/bin/bash

API_KEY="af_live_1234567890abcdef"
BASE_URL="https://api.agent-control-plane.io"

execute_agent() {
  local agent=$1
  local task=$2

  curl -X POST "$BASE_URL/api/agents/execute" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "{
      \"agent\": \"$agent\",
      \"task\": \"$task\"
    }" \
    | jq '.output'
}

execute_agent "coder" "Build a REST API with authentication"
```

### Batch Processing Script

```bash
#!/bin/bash

API_KEY="af_live_1234567890abcdef"
BASE_URL="https://api.agent-control-plane.io"

batch_execute() {
  curl -X POST "$BASE_URL/api/agents/batch" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{
      "tasks": [
        {"agent": "researcher", "task": "Research task"},
        {"agent": "coder", "task": "Code task"},
        {"agent": "tester", "task": "Test task"}
      ],
      "maxConcurrency": 3
    }' \
    | jq '.results[] | {agent: .agent, success: .success}'
}

batch_execute
```

### Error Handling Script

```bash
#!/bin/bash

API_KEY="af_live_1234567890abcdef"
BASE_URL="https://api.agent-control-plane.io"

execute_with_retry() {
  local max_retries=3
  local retry_count=0
  local delay=1

  while [ $retry_count -lt $max_retries ]; do
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/agents/execute" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: $API_KEY" \
      -d '{
        "agent": "coder",
        "task": "Build a REST API"
      }')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ]; then
      echo "$body" | jq '.output'
      return 0
    elif [ "$http_code" -eq 429 ]; then
      echo "Rate limited. Retrying in ${delay}s..."
      sleep $delay
      delay=$((delay * 2))
      retry_count=$((retry_count + 1))
    else
      echo "Error: HTTP $http_code"
      echo "$body" | jq '.'
      return 1
    fi
  done

  echo "Max retries exceeded"
  return 1
}

execute_with_retry
```

---

**Last Updated**: 2025-12-08
**Version**: 1.10.3
