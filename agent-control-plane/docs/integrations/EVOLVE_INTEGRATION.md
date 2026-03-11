# Evolve Integration Guide

This document describes how the Evolve platform integrates with the Agent Control Plane (ACP). Evolve provides tool generation, inference routing, and cross-system orchestration capabilities that extend ACP's agent ecosystem.

## Overview

Evolve connects to ACP through four integration points:

1. **ReasoningBank Namespaces** -- Evolve subsystems store reasoning traces and learning data in dedicated namespaces within ACP's ReasoningBank.
2. **AgentDB Schema** -- Evolve entities (tools, nodes, routes, capabilities) are modeled as graph nodes and edges in AgentDB.
3. **Agent Types** -- Three Evolve agent types (bridge, orchestrator, tool-factory) can participate in ACP-orchestrated workflows.
4. **Service Configuration** -- Environment variables configure connectivity between ACP and Evolve services.

## Files Added

| File                                                     | Purpose                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/reasoningbank/migrations/005_evolve_namespaces.sql` | SQLite migration that creates Evolve namespace tables and seeds 5 namespaces       |
| `src/agentdb/schemas/evolve-schema.sql`                  | AgentDB schema extension with 5 node types, 5 edge types, and views                |
| `src/config/evolve.ts`                                   | TypeScript config module with typed `EvolveServiceConfig` and `loadEvolveConfig()` |
| `config/.env.example`                                    | Updated with Evolve environment variables                                          |

## Setup

### 1. Configure Environment Variables

Copy the Evolve section from `config/.env.example` to your `.env`:

```bash
EVOLVE_ENABLED=true
EVOLVE_ORCHESTRATION_URL=http://localhost:8090
EVOLVE_TOOL_FACTORY_URL=http://localhost:8091
EVOLVE_EDGE_BRIDGE_URL=http://localhost:8787
EVOLVE_LLM_ROUTER_URL=http://localhost:8788
EVOLVE_LEARNING_LOOP_URL=http://localhost:8092
EVOLVE_SERVICE_TOKEN=your-service-token-here
EVOLVE_DEFAULT_TIMEOUT_MS=30000
```

### 2. Run Migrations

Apply the ReasoningBank namespace migration:

```bash
sqlite3 .swarm/memory.db < src/reasoningbank/migrations/005_evolve_namespaces.sql
```

Apply the AgentDB schema extension:

```bash
sqlite3 .swarm/memory.db < src/agentdb/schemas/evolve-schema.sql
```

### 3. Load Configuration in Code

```typescript
import { loadEvolveConfig, EVOLVE_AGENT_TYPES } from './config/evolve.js';

const evolveConfig = loadEvolveConfig();

if (evolveConfig.enabled) {
  // Evolve services are available
  console.log('Orchestration:', evolveConfig.orchestrationUrl);
}
```

## ReasoningBank Namespaces

Five namespaces are registered for Evolve subsystems:

| Namespace                  | Retention | Max Entries/Key | Description                      |
| -------------------------- | --------- | --------------- | -------------------------------- |
| `evolve:tool-generation`   | 90 days   | 500             | Tool Factory reasoning traces    |
| `evolve:inference-routing` | 30 days   | 1000            | LLM Router decisions             |
| `evolve:workflows`         | 180 days  | 200             | Cross-system workflow plans      |
| `evolve:executions`        | 60 days   | 2000            | Individual tool execution traces |
| `evolve:bridge-metrics`    | 30 days   | 5000            | Edge Bridge performance metrics  |

These namespaces appear in both the `evolve_namespaces` table (with full metadata) and the core `memory_namespaces` table (for compatibility with existing namespace listing tools).

## AgentDB Schema

### Node Types

| Table                     | Primary Key     | Description                                                 |
| ------------------------- | --------------- | ----------------------------------------------------------- |
| `evolve_tool_manifests`   | `tool_id`       | Published tools with schema, runtime, and signing metadata  |
| `evolve_synapse_nodes`    | `node_id`       | Synapse network nodes hosting tools and models              |
| `evolve_tool_blueprints`  | `blueprint_id`  | Tool generation requests tracked through the build pipeline |
| `evolve_inference_routes` | `route_id`      | LLM Router rules mapping requests to providers              |
| `evolve_capabilities`     | `capability_id` | Registered capabilities in the Evolve ecosystem             |

### Edge Types

| Table                      | Source -> Target                | Description              |
| -------------------------- | ------------------------------- | ------------------------ |
| `evolve_edge_hosted_on`    | tool_manifest -> synapse_node   | Tool deployment tracking |
| `evolve_edge_generated_by` | tool_manifest -> tool_blueprint | Tool Factory provenance  |
| `evolve_edge_deployed_to`  | tool_blueprint -> synapse_node  | Distribution tracking    |
| `evolve_edge_routes_to`    | inference_route -> synapse_node | Traffic routing          |
| `evolve_edge_requires`     | capability -> capability        | Dependency graph         |

### Views

- `v_evolve_tool_topology` -- Tools with their hosting nodes and deployment status
- `v_evolve_active_routes` -- Active inference routes with target node latency data
- `v_evolve_namespace_stats` -- Namespace entry counts and last activity timestamps

## Agent Types

Three Evolve agent types are defined in `src/config/evolve.ts`:

| Agent                 | Capabilities                                                              | Description                            |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| `evolve-bridge`       | tool-routing, mcp-translation, cache-management, protocol-bridging        | Translates MCP to Synapse SGA protocol |
| `evolve-orchestrator` | workflow-execution, node-management, tool-dispatch, dependency-resolution | Cross-system workflow dispatch         |
| `tool-factory`        | code-generation, wasm-compilation, tool-signing, distribution             | AI-driven WASM tool generation         |

## MCP Tools (Evolve-side)

The Evolve integration package (`evolve/integrations/acp`) defines 5 MCP tools that ACP can expose to agents. These are implemented on the Evolve side and communicate with Evolve services via HTTP:

| Tool                       | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `evolve_dispatch`          | Route tool invocations to Synapse, Agentopia, or ACP |
| `evolve_generate_tool`     | Request AI-generated tools from the Tool Factory     |
| `evolve_infer`             | Route LLM inference through the 3-tier mesh          |
| `evolve_capabilities`      | Query the Evolve Capability Registry                 |
| `evolve_learning_insights` | Query the Learning Loop for performance insights     |

To expose these tools in ACP's MCP server, import them from the Evolve integration package and register them in `src/mcp/claudeFlowSdkServer.ts`.

## Architecture

```
 Evolve Services                    ACP
 +-----------------+     HTTP      +---------------------------+
 | Orchestration   |<------------>| config/evolve.ts          |
 | Tool Factory    |              | (loadEvolveConfig)        |
 | Edge Bridge     |              +---------------------------+
 | LLM Router      |              | reasoningbank/migrations/ |
 | Learning Loop   |              | 005_evolve_namespaces.sql |
 +-----------------+              +---------------------------+
                                  | agentdb/schemas/          |
                                  | evolve-schema.sql         |
                                  +---------------------------+
```

## Evolve-Side Code Reference

The Evolve integration source code lives at:

```
evolve/integrations/acp/src/
  config.ts                    -- EvolveACPConfig with Zod validation
  agent-types.ts               -- Agent type definitions and registration
  reasoning-bank-namespaces.ts -- Namespace definitions and SQL generation
  agentdb-schema.ts            -- Node/edge type definitions and registration
  mcp-tools.ts                 -- MCP tool definitions with HTTP handlers
  index.ts                     -- Barrel exports
```
