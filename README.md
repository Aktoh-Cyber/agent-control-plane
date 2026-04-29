# Agent Control Plane (ACP)

Production agent orchestration platform for the Horsemen cybersecurity platform. Routes LLM requests across multiple providers, enforces governance policies, and manages multi-agent coordination.

## Architecture

Built on the [Agentopia](https://github.com/tafyai/agentopia) framework with Horsemen-specific extensions.

### Core Modules

| Module     | Path              | Description                                                                  |
| ---------- | ----------------- | ---------------------------------------------------------------------------- |
| Governance | `src/governance/` | Budget management, model policies, usage tracking, sensitivity-based routing |
| Federation | `src/federation/` | Multi-org federation hub, custom roles, quotas, security management          |
| MCP Server | `src/mcp/`        | Claude Flow SDK integration, FastMCP tools, standalone STDIO transport       |
| Router     | `src/router/`     | Multi-model LLM routing with provider registry                               |
| Agents     | `src/agents/`     | Agent definitions and lifecycle management                                   |
| Billing    | `src/billing/`    | Usage metering and cost tracking                                             |
| Compliance | `src/compliance/` | Audit trail and compliance reporting                                         |
| AgentDB    | `src/agentdb/`    | Agent state persistence (SQLite)                                             |
| Transport  | `src/transport/`  | QUIC and WebSocket transports for agent communication                        |

### Key Features

- **Multi-model routing**: Routes requests to Claude, GPT-4, Gemini, etc. based on sensitivity level and model policies
- **Budget enforcement**: Per-org budget caps with real-time usage tracking
- **Governance middleware**: Policy enforcement on all agent operations
- **Federation**: Cross-organization agent coordination with role-based access
- **MCP tools**: 213 MCP tools exposed via Claude Flow SDK

## Development

```bash
npm install
npm run build
npm run test
npm run typecheck
```

## Integration

The ACP sits between the Horsemen UI (via CopilotKit) and the edge agents (Agentopia workers):

```
UI → CopilotKit → ACP → Agentopia Workers (scout, judge, shield, lancer, infosec)
                    ↓
              Governance (budget, policies, routing)
                    ↓
              LLM Providers (Claude, GPT-4, etc.)
```

## Related

- [Horsemen UI](https://github.com/Aktoh-Cyber/Horsemen-InfoSec-Assistant-Platform) — SOC dashboard
- [Agentopia](https://github.com/Aktoh-Cyber/agentopia) — Edge AI agents
- [Synapse](https://github.com/Aktoh-Cyber/synapse) — Node infrastructure
