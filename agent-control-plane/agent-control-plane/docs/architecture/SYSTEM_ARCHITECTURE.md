# System Architecture

Interactive Mermaid.js diagrams visualizing the agent-control-plane system architecture.

## Table of Contents

1. [High-Level System Overview](#high-level-system-overview)
2. [Core Components](#core-components)
3. [Layer Architecture](#layer-architecture)
4. [Integration Points](#integration-points)
5. [Component Dependencies](#component-dependencies)

---

## High-Level System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI Interface]
        MCP_CLIENT[MCP Client]
        API_CLIENT[API Client]
    end

    subgraph "Application Layer"
        SWARM[Swarm Coordinator]
        AGENT_MGR[Agent Manager]
        TASK_ORCH[Task Orchestrator]
        MEMORY_MGR[Memory Manager]
    end

    subgraph "Core Services"
        AGENTDB[(AgentDB<br/>Vector Store)]
        REASONINGBANK[ReasoningBank<br/>Learning System]
        CONFIG[Configuration<br/>Service]
        ERROR_SYS[Error System]
    end

    subgraph "Security Layer"
        HIPAA_ENC[HIPAA Encryption]
        KEY_MGR[Key Manager]
        PII_SCRUB[PII Scrubber]
    end

    subgraph "Storage Layer"
        SQLITE[(SQLite DB)]
        VECTOR_STORE[(Vector Storage)]
        FILE_SYS[File System]
    end

    CLI --> SWARM
    MCP_CLIENT --> AGENT_MGR
    API_CLIENT --> TASK_ORCH

    SWARM --> AGENT_MGR
    SWARM --> MEMORY_MGR
    AGENT_MGR --> TASK_ORCH
    TASK_ORCH --> MEMORY_MGR

    MEMORY_MGR --> AGENTDB
    AGENT_MGR --> REASONINGBANK
    SWARM --> CONFIG
    AGENT_MGR --> ERROR_SYS

    AGENTDB --> HIPAA_ENC
    REASONINGBANK --> PII_SCRUB
    CONFIG --> KEY_MGR

    AGENTDB --> SQLITE
    AGENTDB --> VECTOR_STORE
    REASONINGBANK --> FILE_SYS

    style CLI fill:#e1f5ff
    style MCP_CLIENT fill:#e1f5ff
    style API_CLIENT fill:#e1f5ff
    style SWARM fill:#fff4e6
    style AGENT_MGR fill:#fff4e6
    style TASK_ORCH fill:#fff4e6
    style MEMORY_MGR fill:#fff4e6
    style HIPAA_ENC fill:#f3e5f5
    style KEY_MGR fill:#f3e5f5
    style PII_SCRUB fill:#f3e5f5
```

---

## Core Components

### Component Breakdown

```mermaid
graph LR
    subgraph "Swarm Management"
        A1[Swarm Initializer]
        A2[Topology Manager]
        A3[Consensus Engine]
        A4[Load Balancer]
    end

    subgraph "Agent Management"
        B1[Agent Factory]
        B2[Lifecycle Manager]
        B3[State Manager]
        B4[Health Monitor]
    end

    subgraph "Task Orchestration"
        C1[Task Queue]
        C2[Task Scheduler]
        C3[Executor Pool]
        C4[Result Aggregator]
    end

    subgraph "Memory & Learning"
        D1[Vector Search]
        D2[Memory Sync]
        D3[Pattern Learning]
        D4[Knowledge Graph]
    end

    A1 --> A2
    A2 --> A3
    A3 --> A4

    B1 --> B2
    B2 --> B3
    B3 --> B4

    C1 --> C2
    C2 --> C3
    C3 --> C4

    D1 --> D2
    D2 --> D3
    D3 --> D4

    style A1 fill:#ffe0b2
    style A2 fill:#ffe0b2
    style A3 fill:#ffe0b2
    style A4 fill:#ffe0b2
    style B1 fill:#c8e6c9
    style B2 fill:#c8e6c9
    style B3 fill:#c8e6c9
    style B4 fill:#c8e6c9
    style C1 fill:#b3e5fc
    style C2 fill:#b3e5fc
    style C3 fill:#b3e5fc
    style C4 fill:#b3e5fc
    style D1 fill:#f8bbd0
    style D2 fill:#f8bbd0
    style D3 fill:#f8bbd0
    style D4 fill:#f8bbd0
```

---

## Layer Architecture

### Architectural Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        L1_1[CLI Commands]
        L1_2[MCP Protocol]
        L1_3[REST API]
    end

    subgraph "Application Layer"
        L2_1[Swarm Coordination]
        L2_2[Agent Orchestration]
        L2_3[Task Management]
        L2_4[Memory Coordination]
    end

    subgraph "Domain Layer"
        L3_1[Agent Models]
        L3_2[Task Models]
        L3_3[Memory Models]
        L3_4[Error Models]
    end

    subgraph "Infrastructure Layer"
        L4_1[Database Access]
        L4_2[Vector Storage]
        L4_3[File System]
        L4_4[Configuration]
    end

    subgraph "Cross-Cutting Concerns"
        CC1[Security]
        CC2[Logging]
        CC3[Monitoring]
        CC4[Error Handling]
    end

    L1_1 --> L2_1
    L1_2 --> L2_2
    L1_3 --> L2_3

    L2_1 --> L3_1
    L2_2 --> L3_2
    L2_3 --> L3_3
    L2_4 --> L3_4

    L3_1 --> L4_1
    L3_2 --> L4_2
    L3_3 --> L4_3
    L3_4 --> L4_4

    CC1 -.-> L2_1
    CC1 -.-> L2_2
    CC1 -.-> L2_3
    CC2 -.-> L3_1
    CC2 -.-> L3_2
    CC3 -.-> L4_1
    CC3 -.-> L4_2
    CC4 -.-> L4_3

    style L1_1 fill:#e3f2fd
    style L1_2 fill:#e3f2fd
    style L1_3 fill:#e3f2fd
    style L2_1 fill:#fff9c4
    style L2_2 fill:#fff9c4
    style L2_3 fill:#fff9c4
    style L2_4 fill:#fff9c4
    style L3_1 fill:#f1f8e9
    style L3_2 fill:#f1f8e9
    style L3_3 fill:#f1f8e9
    style L3_4 fill:#f1f8e9
    style CC1 fill:#ffebee
    style CC2 fill:#ffebee
    style CC3 fill:#ffebee
    style CC4 fill:#ffebee
```

---

## Integration Points

### External Integrations

```mermaid
graph TB
    subgraph "Agentic Flow System"
        CORE[Core System]
    end

    subgraph "MCP Ecosystem"
        MCP_SERVER[MCP Server]
        MCP_TOOLS[MCP Tools]
        MCP_HOOKS[Hooks System]
    end

    subgraph "AI Providers"
        OPENAI[OpenAI API]
        ANTHROPIC[Anthropic API]
        LOCAL_LLM[Local LLM]
    end

    subgraph "Storage Systems"
        SQLITE_DB[(SQLite)]
        VECTOR_DB[(Vector DB)]
        FILE_STORE[File Storage]
    end

    subgraph "Monitoring & Analytics"
        METRICS[Metrics System]
        LOGS[Log Aggregator]
        TRACES[Trace Collector]
    end

    subgraph "Security Services"
        KEY_VAULT[Key Vault]
        AUDIT_LOG[Audit Logger]
        ENCRYPTION[Encryption Service]
    end

    CORE <--> MCP_SERVER
    CORE <--> MCP_TOOLS
    CORE <--> MCP_HOOKS

    CORE --> OPENAI
    CORE --> ANTHROPIC
    CORE --> LOCAL_LLM

    CORE <--> SQLITE_DB
    CORE <--> VECTOR_DB
    CORE <--> FILE_STORE

    CORE --> METRICS
    CORE --> LOGS
    CORE --> TRACES

    CORE <--> KEY_VAULT
    CORE --> AUDIT_LOG
    CORE <--> ENCRYPTION

    style CORE fill:#ffd54f
    style MCP_SERVER fill:#81c784
    style MCP_TOOLS fill:#81c784
    style MCP_HOOKS fill:#81c784
    style OPENAI fill:#64b5f6
    style ANTHROPIC fill:#64b5f6
    style LOCAL_LLM fill:#64b5f6
    style ENCRYPTION fill:#ef5350
    style KEY_VAULT fill:#ef5350
    style AUDIT_LOG fill:#ef5350
```

---

## Component Dependencies

### Dependency Graph

```mermaid
graph TD
    SWARM[Swarm Coordinator]
    AGENT[Agent Manager]
    TASK[Task Orchestrator]
    MEMORY[Memory Manager]
    AGENTDB[AgentDB]
    REASONING[ReasoningBank]
    CONFIG[Config Service]
    ERROR[Error System]
    SECURITY[Security Layer]

    SWARM --> AGENT
    SWARM --> MEMORY
    SWARM --> CONFIG

    AGENT --> TASK
    AGENT --> REASONING
    AGENT --> ERROR

    TASK --> MEMORY
    TASK --> ERROR

    MEMORY --> AGENTDB
    MEMORY --> SECURITY

    REASONING --> AGENTDB
    REASONING --> SECURITY

    AGENTDB --> CONFIG
    AGENTDB --> SECURITY

    style SWARM fill:#ff9800
    style AGENT fill:#4caf50
    style TASK fill:#2196f3
    style MEMORY fill:#9c27b0
    style AGENTDB fill:#f44336
    style REASONING fill:#3f51b5
    style CONFIG fill:#00bcd4
    style ERROR fill:#ff5722
    style SECURITY fill:#e91e63
```

---

## Module Organization

```mermaid
graph LR
    subgraph "src/"
        subgraph "Core Modules"
            CONFIG_MOD[config/]
            ERRORS_MOD[errors/]
            SECURITY_MOD[security/]
            REASONING_MOD[reasoningbank/]
        end

        subgraph "Utilities"
            EMBED[embeddings.ts]
            PII[pii-scrubber.ts]
            VALIDATOR[validator.ts]
        end
    end

    subgraph "tests/"
        subgraph "Test Suites"
            E2E[e2e/]
            UTILS[utils/]
            SECURITY_TESTS[security/]
        end

        subgraph "Test Infrastructure"
            FIXTURES[fixtures/]
            MOCKS[mocks/]
            BUILDERS[builders/]
        end
    end

    subgraph "docs/"
        CONFIG_DOC[CONFIGURATION.md]
        ERROR_DOC[error-handling.md]
        E2E_DOC[E2E-TESTING.md]
        SECURITY_DOC[security/]
    end

    CONFIG_MOD --> EMBED
    CONFIG_MOD --> VALIDATOR
    ERRORS_MOD --> SECURITY_MOD
    SECURITY_MOD --> REASONING_MOD
    REASONING_MOD --> EMBED
    REASONING_MOD --> PII

    E2E --> FIXTURES
    E2E --> MOCKS
    UTILS --> BUILDERS
    SECURITY_TESTS --> FIXTURES

    CONFIG_MOD -.-> CONFIG_DOC
    ERRORS_MOD -.-> ERROR_DOC
    E2E -.-> E2E_DOC
    SECURITY_MOD -.-> SECURITY_DOC

    style CONFIG_MOD fill:#bbdefb
    style ERRORS_MOD fill:#c8e6c9
    style SECURITY_MOD fill:#f8bbd0
    style REASONING_MOD fill:#fff9c4
```

---

## Technology Stack

```mermaid
graph TB
    subgraph "Runtime"
        NODEJS[Node.js 18/20/22]
        TS[TypeScript 5.x]
    end

    subgraph "Core Libraries"
        SQLITE[better-sqlite3]
        CRYPTO[Node Crypto]
        ONNX[ONNX Runtime]
    end

    subgraph "Testing"
        JEST[Jest]
        PLAYWRIGHT[Playwright]
        MOCK[Mock Servers]
    end

    subgraph "Tools"
        ESLINT[ESLint]
        PRETTIER[Prettier]
        DOCKER[Docker]
    end

    subgraph "Protocols"
        MCP[MCP Protocol]
        QUIC[QUIC Transport]
        HTTP[HTTP/REST]
    end

    NODEJS --> TS
    TS --> SQLITE
    TS --> CRYPTO
    TS --> ONNX

    JEST --> MOCK
    PLAYWRIGHT --> MOCK

    ESLINT --> TS
    PRETTIER --> TS

    MCP --> NODEJS
    QUIC --> NODEJS
    HTTP --> NODEJS

    style NODEJS fill:#68a063
    style TS fill:#3178c6
    style SQLITE fill:#003b57
    style CRYPTO fill:#ff6b6b
    style MCP fill:#ffd93d
    style JEST fill:#c21325
    style PLAYWRIGHT fill:#2ead33
```

---

## Related Documentation

- [Swarm Coordination](./SWARM_COORDINATION.md) - Topology and coordination patterns
- [Agent Lifecycle](./AGENT_LIFECYCLE.md) - Agent states and transitions
- [Data Flow](./DATA_FLOW.md) - Request/response flows
- [Deployment](./DEPLOYMENT.md) - Infrastructure architecture
- [Sequences](./SEQUENCES.md) - Sequence diagrams
- [Error Handling](./ERROR_HANDLING.md) - Error flow diagrams
- [Security](./SECURITY.md) - Security architecture

---

**Last Updated**: 2025-12-08
**Diagram Count**: 8 interactive Mermaid.js diagrams
