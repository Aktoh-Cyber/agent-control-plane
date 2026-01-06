# Agentic Cloud Integration Guide

## Overview

Agentic Flow now integrates with **Agentic Cloud**, a cloud platform for AI development, adding **96 additional MCP tools** for cloud sandboxes, distributed swarms, neural training, and more.

## Total MCP Tools: 203

| Server            | Tools   | Description                                                |
| ----------------- | ------- | ---------------------------------------------------------- |
| **gendev**        | 101     | Core orchestration, memory, GitHub, neural networks        |
| **agentic-cloud** | 96      | Cloud sandboxes, distributed swarms, workflows, challenges |
| **gendev-sdk**    | 6       | In-process memory and coordination tools                   |
| **TOTAL**         | **203** | Complete AI orchestration toolkit                          |

---

## Agentic Cloud Features

### ☁️ Cloud Sandboxes (E2B)

Create isolated execution environments for code development and testing:

- `sandbox_create` - Create Node.js, Python, React, or Next.js sandboxes
- `sandbox_execute` - Run code in isolated environment
- `sandbox_upload` - Upload files to sandbox
- `sandbox_status` - Check sandbox health
- `sandbox_logs` - View execution logs
- `sandbox_delete` - Clean up resources

### 🤖 Distributed Swarms

Deploy multi-agent swarms in the cloud with auto-scaling:

- `swarm_init` - Initialize cloud swarm with topology
- `swarm_scale` - Scale agents up or down
- `agent_spawn` - Create specialized agents
- `task_orchestrate` - Distribute tasks across agents
- `swarm_status` - Monitor swarm health

### 🧠 Distributed Neural Training

Train neural networks across multiple cloud sandboxes:

- `neural_train` - Train models with distributed compute
- `neural_predict` - Run inference on trained models
- `neural_cluster_init` - Initialize training cluster
- `neural_node_deploy` - Deploy training nodes
- `neural_training_status` - Monitor training progress

### ⚡ Workflow Automation

Event-driven workflow orchestration with message queues:

- `workflow_create` - Define automated workflows
- `workflow_execute` - Run workflows asynchronously
- `workflow_status` - Check workflow progress
- `workflow_queue_status` - Monitor message queues

### 🎯 Challenges & Gamification

Coding challenges with leaderboards and achievements:

- `challenges_list` - Browse available challenges
- `challenge_submit` - Submit solution for validation
- `leaderboard_get` - View rankings
- `achievements_list` - Track user achievements

### 💰 Credit Management

Pay-as-you-go pricing with auto-refill:

- `check_balance` - View current credit balance
- `create_payment_link` - Generate payment link
- `configure_auto_refill` - Set up automatic refills
- `get_payment_history` - View transaction history

### 📦 Templates & App Store

Pre-built project templates and marketplace:

- `template_list` - Browse available templates
- `template_deploy` - Deploy template to sandbox
- `app_search` - Search marketplace apps
- `app_get` - Get application details

---

## Authentication

Agentic Cloud requires authentication to access cloud features.

### Register New Account

```bash
# Using CLI
npx agent-control-plane --agent agentic-cloud-auth \
  --task "Register account with email: user@example.com, password: secure123"

# Or via MCP tool directly
mcp__agentic-cloud__user_register({
  email: "user@example.com",
  password: "secure123",
  full_name: "Your Name"
})
```

### Login to Existing Account

```bash
# Using CLI
npx agent-control-plane --agent agentic-cloud-auth \
  --task "Login with email: user@example.com, password: secure123"

# Or via MCP tool directly
mcp__agentic-cloud__user_login({
  email: "user@example.com",
  password: "secure123"
})
```

### Check Authentication Status

```bash
npx agent-control-plane --agent agentic-cloud-user-tools \
  --task "Check my authentication status and profile"
```

---

## Usage Examples

### Create and Execute in Sandbox

```bash
npx agent-control-plane --agent agentic-cloud-sandbox \
  --task "Create a Node.js sandbox named 'api-dev', execute 'console.log(process.version)', and show the output"
```

### Deploy Distributed Swarm

```bash
npx agent-control-plane --agent agentic-cloud-swarm \
  --task "Initialize a mesh topology swarm with 5 agents, then orchestrate building a REST API with authentication"
```

### Train Neural Network

```bash
npx agent-control-plane --agent agentic-cloud-neural \
  --task "Train a classification neural network using distributed training across 3 nodes"
```

### Create Workflow

```bash
npx agent-control-plane --agent agentic-cloud-workflow \
  --task "Create an event-driven workflow that triggers on git push, runs tests, and deploys on success"
```

### Check Credits

```bash
npx agent-control-plane --agent agentic-cloud-payments \
  --task "Check my current credit balance and payment history"
```

---

## Validation Results

### Local Validation ✅

```bash
node validation/test-agentic-cloud.js user@example.com password123
```

**Results:**

- ✅ **203 total MCP tools discovered**
  - 101 from gendev
  - 96 from agentic-cloud
  - 6 from gendev-sdk
- ✅ **Authentication successful**
  - Login working
  - Session persistence
  - User profile accessible
- ✅ **System health verified**
  - Database: Healthy
  - Version: 2.0.0
  - All services operational
- ⚠️ **Sandbox creation** (requires 10 credits minimum)

### Docker Validation ✅

```bash
docker build -t agent-control-plane:agentic-cloud .
docker run --rm -e ANTHROPIC_API_KEY=sk-ant-... agent-control-plane:agentic-cloud --help
```

**Results:**

- ✅ Docker image builds successfully (~5 minutes)
- ✅ All three MCP servers initialized in container
- ✅ CLI functional with Agentic Cloud integration
- ✅ 75 agents loaded including agentic-cloud specialists

---

## Pricing

Agentic Cloud uses a credit-based system:

| Resource              | Cost (Credits) |
| --------------------- | -------------- |
| Sandbox (hourly)      | 10 credits     |
| Swarm agent (hourly)  | 5 credits      |
| Neural training (job) | 20-100 credits |
| Workflow execution    | 1-5 credits    |

**Credit Packages:**

- Starter: $10 = 100 credits
- Developer: $50 = 550 credits (10% bonus)
- Professional: $200 = 2400 credits (20% bonus)

**Auto-refill Available:**

- Set threshold (e.g., 20 credits)
- Automatic recharge when balance drops
- Configurable refill amount

---

## Architecture

### Triple MCP Server Setup

```typescript
// src/agents/claudeAgent.ts
mcpServers: {
  // 1. In-SDK Server (6 tools, in-process)
  'gendev-sdk': claudeFlowSdkServer,

  // 2. GenDev (101 tools, subprocess)
  'gendev': {
    command: 'npx',
    args: ['gendev@alpha', 'mcp', 'start']
  },

  // 3. Agentic Cloud (96 tools, subprocess)
  'agentic-cloud': {
    command: 'npx',
    args: ['agentic-cloud@latest', 'mcp', 'start']
  }
}
```

### Agent Coordination

Agentic Cloud agents automatically coordinate with gendev for:

- **Memory sharing** - Store sandbox IDs and workflow results
- **Swarm coordination** - Combine local and cloud agents
- **Task orchestration** - Distribute work across environments
- **Performance monitoring** - Track resource usage

---

## Troubleshooting

### Authentication Issues

**Problem:** Login fails with "Invalid credentials"

**Solution:**

1. Verify email/password are correct
2. Check if account is registered: `mcp__agentic-cloud__user_register`
3. Reset password if needed: `mcp__agentic-cloud__user_reset_password`

### Insufficient Credits

**Problem:** "Insufficient credits to create sandbox"

**Solution:**

1. Check balance: `mcp__agentic-cloud__check_balance`
2. Create payment link: `mcp__agentic-cloud__create_payment_link({ amount: 10 })`
3. Enable auto-refill: `mcp__agentic-cloud__configure_auto_refill({ enabled: true, threshold: 20, amount: 100 })`

### MCP Server Connection

**Problem:** Agentic Cloud tools not appearing

**Solution:**

1. Verify installation: `npm ls agentic-cloud`
2. Check MCP server status in logs
3. Restart with: `npx agentic-cloud@latest mcp start`

### Docker Environment

**Problem:** Agentic Cloud not working in Docker

**Solution:**

1. Ensure `ANTHROPIC_API_KEY` is set
2. Verify network connectivity for MCP subprocesses
3. Check logs: `docker logs <container_id>`

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never hardcode credentials** in source code or Docker images
2. **Use environment variables** for sensitive data
3. **Rotate API keys regularly** for production deployments
4. **Enable 2FA** on Agentic Cloud account for production use
5. **Use separate accounts** for development vs production

---

## Support

- **Agentic Cloud Docs**: https://github.com/tafyai/agentic-cloud
- **Agentic Flow Issues**: https://github.com/Aktoh-Cyber/agent-control-plane/issues
- **MCP Protocol**: https://modelcontextprotocol.io
- **Claude Agent SDK**: https://docs.claude.com/en/api/agent-sdk

---

**Ready to build with cloud-powered AI agents? 🚀**
