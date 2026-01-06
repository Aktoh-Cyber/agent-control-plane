# Deployment Architecture

Infrastructure diagrams showing deployment patterns, scaling strategies, and high availability configurations.

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Container Architecture](#container-architecture)
3. [Scaling Patterns](#scaling-patterns)
4. [High Availability](#high-availability)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Disaster Recovery](#disaster-recovery)

---

## Infrastructure Overview

### Production Deployment

```mermaid
graph TB
    subgraph "Edge Layer"
        LB[Load Balancer]
        CDN[CDN]
        WAF[Web Application Firewall]
    end

    subgraph "Application Layer"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
        SWARM1[Swarm Coordinator 1]
        SWARM2[Swarm Coordinator 2]
    end

    subgraph "Agent Layer"
        AGENT_POOL1[Agent Pool 1<br/>10 agents]
        AGENT_POOL2[Agent Pool 2<br/>10 agents]
        AGENT_POOL3[Agent Pool 3<br/>10 agents]
    end

    subgraph "Data Layer"
        AGENTDB[(AgentDB Primary)]
        AGENTDB_REPLICA[(AgentDB Replica)]
        VECTOR_STORE[(Vector Store)]
        CACHE[Redis Cache]
    end

    subgraph "Storage Layer"
        S3[Object Storage]
        EBS[Block Storage]
        EFS[Shared File System]
    end

    subgraph "Infrastructure Services"
        MONITORING[Monitoring]
        LOGGING[Centralized Logging]
        BACKUP[Backup Service]
        SECRETS[Secrets Manager]
    end

    CDN --> LB
    WAF --> LB
    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> SWARM1
    API2 --> SWARM1
    API3 --> SWARM2

    SWARM1 --> AGENT_POOL1
    SWARM1 --> AGENT_POOL2
    SWARM2 --> AGENT_POOL3

    AGENT_POOL1 --> AGENTDB
    AGENT_POOL2 --> AGENTDB
    AGENT_POOL3 --> AGENTDB_REPLICA

    AGENTDB --> VECTOR_STORE
    AGENTDB_REPLICA --> VECTOR_STORE
    AGENT_POOL1 --> CACHE
    AGENT_POOL2 --> CACHE
    AGENT_POOL3 --> CACHE

    AGENTDB --> S3
    VECTOR_STORE --> EBS
    AGENT_POOL1 --> EFS

    API1 -.-> MONITORING
    SWARM1 -.-> LOGGING
    AGENTDB -.-> BACKUP
    API1 -.-> SECRETS

    style LB fill:#ff9800
    style API1 fill:#42a5f5
    style API2 fill:#42a5f5
    style API3 fill:#42a5f5
    style SWARM1 fill:#66bb6a
    style SWARM2 fill:#66bb6a
    style AGENTDB fill:#ba68c8
    style AGENTDB_REPLICA fill:#ce93d8
```

---

## Container Architecture

### Docker Deployment

```mermaid
graph TB
    subgraph "Docker Host 1"
        subgraph "API Container"
            API_APP[Node.js App]
            API_NGINX[Nginx]
        end

        subgraph "Swarm Container"
            SWARM_APP[Swarm Service]
            SWARM_MEM[Memory Manager]
        end

        subgraph "Agent Container 1"
            AGENT1[Agent Process]
            AGENT1_RUNTIME[Node Runtime]
        end

        subgraph "Agent Container 2"
            AGENT2[Agent Process]
            AGENT2_RUNTIME[Node Runtime]
        end
    end

    subgraph "Docker Host 2"
        subgraph "Database Container"
            SQLITE[SQLite DB]
            VECTOR_DB[Vector DB]
        end

        subgraph "Cache Container"
            REDIS[Redis]
        end

        subgraph "Monitor Container"
            PROMETHEUS[Prometheus]
            GRAFANA[Grafana]
        end
    end

    subgraph "Docker Network"
        NETWORK[Bridge Network]
    end

    subgraph "Volumes"
        VOL_DATA[Data Volume]
        VOL_LOGS[Logs Volume]
        VOL_CONFIG[Config Volume]
    end

    API_NGINX --> API_APP
    API_APP --> SWARM_APP
    SWARM_APP --> AGENT1
    SWARM_APP --> AGENT2

    AGENT1 --> NETWORK
    AGENT2 --> NETWORK
    SWARM_APP --> NETWORK
    SQLITE --> NETWORK
    REDIS --> NETWORK

    SQLITE --> VOL_DATA
    AGENT1_RUNTIME --> VOL_LOGS
    API_APP --> VOL_CONFIG

    PROMETHEUS -.-> NETWORK
    GRAFANA -.-> PROMETHEUS

    style API_APP fill:#42a5f5
    style SWARM_APP fill:#66bb6a
    style AGENT1 fill:#ffb74d
    style AGENT2 fill:#ffb74d
    style SQLITE fill:#ba68c8
    style REDIS fill:#ef5350
```

### Kubernetes Deployment

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Namespace: agent-control-plane"
            subgraph "API Deployment"
                API_POD1[API Pod 1]
                API_POD2[API Pod 2]
                API_SVC[API Service]
            end

            subgraph "Swarm Deployment"
                SWARM_POD1[Swarm Pod 1]
                SWARM_POD2[Swarm Pod 2]
                SWARM_SVC[Swarm Service]
            end

            subgraph "Agent StatefulSet"
                AGENT_POD1[Agent Pod 1]
                AGENT_POD2[Agent Pod 2]
                AGENT_POD3[Agent Pod 3]
            end

            subgraph "Data StatefulSet"
                DB_POD1[DB Pod Primary]
                DB_POD2[DB Pod Replica]
                DB_SVC[DB Service]
            end

            subgraph "Cache Deployment"
                CACHE_POD[Redis Pod]
                CACHE_SVC[Redis Service]
            end
        end

        subgraph "Ingress"
            INGRESS[Ingress Controller]
            TLS[TLS Termination]
        end

        subgraph "Storage"
            PV1[Persistent Volume 1]
            PV2[Persistent Volume 2]
            PV3[Persistent Volume 3]
        end

        subgraph "ConfigMaps & Secrets"
            CONFIG[ConfigMap]
            SECRETS[Secrets]
        end
    end

    INGRESS --> TLS
    TLS --> API_SVC
    API_SVC --> API_POD1
    API_SVC --> API_POD2

    API_POD1 --> SWARM_SVC
    API_POD2 --> SWARM_SVC
    SWARM_SVC --> SWARM_POD1
    SWARM_SVC --> SWARM_POD2

    SWARM_POD1 --> AGENT_POD1
    SWARM_POD1 --> AGENT_POD2
    SWARM_POD2 --> AGENT_POD3

    AGENT_POD1 --> DB_SVC
    AGENT_POD2 --> DB_SVC
    AGENT_POD3 --> DB_SVC
    DB_SVC --> DB_POD1
    DB_SVC --> DB_POD2

    AGENT_POD1 --> CACHE_SVC
    CACHE_SVC --> CACHE_POD

    DB_POD1 --> PV1
    DB_POD2 --> PV2
    AGENT_POD1 --> PV3

    API_POD1 -.-> CONFIG
    API_POD1 -.-> SECRETS
    SWARM_POD1 -.-> CONFIG
    DB_POD1 -.-> SECRETS

    style INGRESS fill:#ff9800
    style API_SVC fill:#42a5f5
    style SWARM_SVC fill:#66bb6a
    style DB_SVC fill:#ba68c8
    style CACHE_SVC fill:#ef5350
```

---

## Scaling Patterns

### Horizontal Scaling

```mermaid
flowchart TD
    METRICS[Metrics Collection] --> ANALYZE{Analyze<br/>Load}

    ANALYZE -->|CPU > 70%| SCALE_OUT_CPU[Scale Out Decision]
    ANALYZE -->|Memory > 80%| SCALE_OUT_MEM[Scale Out Decision]
    ANALYZE -->|Queue > 100| SCALE_OUT_QUEUE[Scale Out Decision]
    ANALYZE -->|Load < 30%| SCALE_IN[Scale In Decision]

    SCALE_OUT_CPU --> CHECK_MAX{At Max<br/>Capacity?}
    SCALE_OUT_MEM --> CHECK_MAX
    SCALE_OUT_QUEUE --> CHECK_MAX

    CHECK_MAX -->|No| ADD_INSTANCE[Add Instance]
    CHECK_MAX -->|Yes| ALERT[Alert: Max Capacity]

    ADD_INSTANCE --> PROVISION[Provision Resources]
    PROVISION --> HEALTH_CHECK{Health<br/>Check}

    HEALTH_CHECK -->|Pass| REGISTER[Register in Pool]
    HEALTH_CHECK -->|Fail| TERMINATE[Terminate Instance]

    REGISTER --> ROUTE_TRAFFIC[Route Traffic]
    ROUTE_TRAFFIC --> MONITOR[Monitor Performance]

    SCALE_IN --> CHECK_MIN{At Min<br/>Capacity?}
    CHECK_MIN -->|No| DRAIN[Drain Connections]
    CHECK_MIN -->|Yes| KEEP[Keep Running]

    DRAIN --> REMOVE[Remove Instance]
    REMOVE --> MONITOR

    MONITOR --> METRICS

    style METRICS fill:#42a5f5
    style SCALE_OUT_CPU fill:#ff9800
    style SCALE_IN fill:#66bb6a
    style REGISTER fill:#4caf50
    style ALERT fill:#ef5350
```

### Auto-Scaling Configuration

```mermaid
graph LR
    subgraph "Scaling Triggers"
        T1[CPU Usage > 70%]
        T2[Memory > 80%]
        T3[Queue Length > 100]
        T4[Response Time > 2s]
    end

    subgraph "Scaling Policies"
        P1[Scale Out: +2 instances]
        P2[Scale Out: +1 instance]
        P3[Scale In: -1 instance]
        P4[Cooldown: 5 minutes]
    end

    subgraph "Constraints"
        C1[Min Instances: 3]
        C2[Max Instances: 20]
        C3[Max Scale Rate: 4/min]
        C4[Instance Type: t3.large]
    end

    subgraph "Health Checks"
        H1[HTTP: /health]
        H2[Interval: 30s]
        H3[Timeout: 10s]
        H4[Threshold: 2 failures]
    end

    T1 --> P1
    T2 --> P1
    T3 --> P2
    T4 --> P2

    P1 --> C1
    P1 --> C2
    P2 --> C3
    P3 --> C4

    C1 --> H1
    C2 --> H2
    C3 --> H3
    C4 --> H4

    style T1 fill:#ffccbc
    style T2 fill:#ffccbc
    style T3 fill:#ffccbc
    style T4 fill:#ffccbc
    style P1 fill:#c8e6c9
    style P2 fill:#c8e6c9
    style P3 fill:#b3e5fc
    style C1 fill:#fff9c4
```

---

## High Availability

### Active-Active Configuration

```mermaid
graph TB
    subgraph "Region 1 (Primary)"
        R1_LB[Load Balancer]
        R1_API1[API Server 1]
        R1_API2[API Server 2]
        R1_SWARM[Swarm Coordinator]
        R1_AGENTS[Agent Pool]
        R1_DB[(Database Primary)]
        R1_CACHE[Cache]
    end

    subgraph "Region 2 (Secondary)"
        R2_LB[Load Balancer]
        R2_API1[API Server 1]
        R2_API2[API Server 2]
        R2_SWARM[Swarm Coordinator]
        R2_AGENTS[Agent Pool]
        R2_DB[(Database Replica)]
        R2_CACHE[Cache]
    end

    subgraph "Global Load Balancer"
        GLB[DNS-based Global LB]
        HEALTH[Health Checks]
    end

    subgraph "Shared Storage"
        S3[Object Storage S3]
        CROSS_REGION[Cross-Region Replication]
    end

    GLB --> R1_LB
    GLB --> R2_LB
    HEALTH -.-> R1_LB
    HEALTH -.-> R2_LB

    R1_LB --> R1_API1
    R1_LB --> R1_API2
    R1_API1 --> R1_SWARM
    R1_SWARM --> R1_AGENTS
    R1_AGENTS --> R1_DB
    R1_AGENTS --> R1_CACHE

    R2_LB --> R2_API1
    R2_LB --> R2_API2
    R2_API1 --> R2_SWARM
    R2_SWARM --> R2_AGENTS
    R2_AGENTS --> R2_DB
    R2_AGENTS --> R2_CACHE

    R1_DB <-.->|Replication| R2_DB
    R1_DB --> S3
    R2_DB --> S3
    S3 -.-> CROSS_REGION

    style GLB fill:#ff9800
    style R1_LB fill:#42a5f5
    style R2_LB fill:#42a5f5
    style R1_DB fill:#ba68c8
    style R2_DB fill:#ce93d8
    style S3 fill:#66bb6a
```

### Failover Strategy

```mermaid
stateDiagram-v2
    [*] --> HealthyPrimary: System Start

    HealthyPrimary --> DetectingFailure: Health Check Fails
    DetectingFailure --> VerifyingFailure: Confirm Failure
    VerifyingFailure --> HealthyPrimary: False Alarm
    VerifyingFailure --> InitiatingFailover: Confirmed Failure

    InitiatingFailover --> PromotingSecondary: Promote Replica
    PromotingSecondary --> UpdateDNS: Update Routing
    UpdateDNS --> ActiveSecondary: Failover Complete

    ActiveSecondary --> RecoveringPrimary: Primary Restored
    RecoveringPrimary --> SyncingData: Sync Data
    SyncingData --> ReadyToSwitch: Data Synced

    ReadyToSwitch --> HealthyPrimary: Switch Back

    note right of HealthyPrimary
        Normal operation
        - Primary handles all traffic
        - Secondary in sync
        - Health checks passing
    end note

    note right of InitiatingFailover
        Failover process
        - Stop accepting writes on primary
        - Promote secondary to primary
        - Update DNS/routing
        - Duration: < 60 seconds
    end note

    note right of ActiveSecondary
        Secondary is now primary
        - Handling all traffic
        - Old primary offline
        - Monitoring for recovery
    end note
```

---

## Monitoring and Observability

### Monitoring Stack

```mermaid
graph TB
    subgraph "Data Sources"
        APP[Applications]
        SYS[System Metrics]
        DB[Databases]
        LOGS[Application Logs]
    end

    subgraph "Collection Layer"
        PROM[Prometheus]
        FLUENT[Fluentd]
        JAEGER[Jaeger Tracing]
    end

    subgraph "Storage Layer"
        TSDB[Time Series DB]
        ES[Elasticsearch]
        TRACE_STORE[Trace Storage]
    end

    subgraph "Visualization"
        GRAFANA[Grafana Dashboards]
        KIBANA[Kibana]
        JAEGER_UI[Jaeger UI]
    end

    subgraph "Alerting"
        ALERT_MGR[Alert Manager]
        PAGERDUTY[PagerDuty]
        SLACK[Slack Notifications]
    end

    APP --> PROM
    SYS --> PROM
    DB --> PROM
    LOGS --> FLUENT
    APP -.-> JAEGER

    PROM --> TSDB
    FLUENT --> ES
    JAEGER --> TRACE_STORE

    TSDB --> GRAFANA
    ES --> KIBANA
    TRACE_STORE --> JAEGER_UI

    PROM --> ALERT_MGR
    ALERT_MGR --> PAGERDUTY
    ALERT_MGR --> SLACK

    style PROM fill:#ff6b6b
    style FLUENT fill:#4ecdc4
    style JAEGER fill:#95e1d3
    style GRAFANA fill:#f38181
    style ALERT_MGR fill:#ff9800
```

### Observability Dashboard

```mermaid
graph LR
    subgraph "Golden Signals"
        LATENCY[Latency<br/>P50: 120ms<br/>P99: 450ms]
        TRAFFIC[Traffic<br/>1000 req/s]
        ERRORS[Errors<br/>0.5%]
        SATURATION[Saturation<br/>CPU: 45%<br/>Memory: 60%]
    end

    subgraph "Application Metrics"
        AGENTS[Active Agents: 45]
        TASKS[Tasks/min: 350]
        MEMORY_OPS[Memory Ops/s: 120]
        VECTOR_SEARCH[Vector Searches/s: 80]
    end

    subgraph "Infrastructure Metrics"
        NODES[Healthy Nodes: 8/8]
        CONTAINERS[Running Containers: 56]
        DISK[Disk Usage: 45%]
        NETWORK[Network I/O: 100 Mbps]
    end

    subgraph "Business Metrics"
        SUCCESS_RATE[Task Success: 98.5%]
        AVG_DURATION[Avg Duration: 2.5s]
        SWARM_EFFICIENCY[Swarm Efficiency: 92%]
        USER_SAT[User Satisfaction: 4.7/5]
    end

    LATENCY --> DASHBOARD[Monitoring Dashboard]
    TRAFFIC --> DASHBOARD
    ERRORS --> DASHBOARD
    SATURATION --> DASHBOARD

    AGENTS --> DASHBOARD
    TASKS --> DASHBOARD
    MEMORY_OPS --> DASHBOARD
    VECTOR_SEARCH --> DASHBOARD

    NODES --> DASHBOARD
    CONTAINERS --> DASHBOARD
    DISK --> DASHBOARD
    NETWORK --> DASHBOARD

    SUCCESS_RATE --> DASHBOARD
    AVG_DURATION --> DASHBOARD
    SWARM_EFFICIENCY --> DASHBOARD
    USER_SAT --> DASHBOARD

    style LATENCY fill:#66bb6a
    style ERRORS fill:#ffb74d
    style SATURATION fill:#42a5f5
    style SUCCESS_RATE fill:#4caf50
    style DASHBOARD fill:#ba68c8
```

---

## Disaster Recovery

### Backup Strategy

```mermaid
flowchart TD
    START[Scheduled Backup] --> CHECK_TIME{Backup<br/>Type}

    CHECK_TIME -->|Hourly| INCREMENTAL[Incremental Backup]
    CHECK_TIME -->|Daily| DIFFERENTIAL[Differential Backup]
    CHECK_TIME -->|Weekly| FULL[Full Backup]

    INCREMENTAL --> BACKUP_DB[Backup Database]
    DIFFERENTIAL --> BACKUP_DB
    FULL --> BACKUP_DB

    BACKUP_DB --> BACKUP_VECTOR[Backup Vector Store]
    BACKUP_VECTOR --> BACKUP_FILES[Backup Files]

    BACKUP_FILES --> COMPRESS[Compress Data]
    COMPRESS --> ENCRYPT[Encrypt Backup]

    ENCRYPT --> UPLOAD_S3[Upload to S3]
    UPLOAD_S3 --> REPLICATE[Cross-Region Replication]

    REPLICATE --> VERIFY{Verify<br/>Backup}

    VERIFY -->|Success| RETENTION[Apply Retention Policy]
    VERIFY -->|Fail| RETRY{Retry<br/>Count}

    RETRY -->|< 3| BACKUP_DB
    RETRY -->|>= 3| ALERT[Alert Operations]

    RETENTION --> CLEANUP[Cleanup Old Backups]
    CLEANUP --> COMPLETE[Backup Complete]

    ALERT --> COMPLETE

    style START fill:#42a5f5
    style FULL fill:#ff9800
    style ENCRYPT fill:#ba68c8
    style REPLICATE fill:#66bb6a
    style COMPLETE fill:#4caf50
    style ALERT fill:#ef5350
```

### Recovery Process

```mermaid
sequenceDiagram
    participant Ops as Operations Team
    participant DR as DR System
    participant Backup as Backup Storage
    participant Primary as Primary Site
    participant Secondary as Secondary Site

    Note over Ops,Secondary: Disaster Detected
    Ops->>DR: Initiate Recovery
    DR->>DR: Assess Damage

    alt Primary Site Recoverable
        DR->>Primary: Attempt Recovery
        Primary-->>DR: Status Update
        DR->>Backup: Fetch Latest Backup
        Backup-->>DR: Backup Data
        DR->>Primary: Restore Data
        Primary-->>DR: Restoration Complete
        DR->>Ops: Recovery Successful
    else Primary Site Lost
        DR->>Secondary: Activate Secondary
        Secondary->>Secondary: Promote to Primary
        DR->>Backup: Fetch Latest Backup
        Backup-->>DR: Backup Data
        DR->>Secondary: Restore Missing Data
        Secondary-->>DR: Restoration Complete
        DR->>DR: Update DNS
        DR->>Ops: Failover Complete
    end

    Note over Ops,Secondary: Verify System
    Ops->>Secondary: Run Tests
    Secondary-->>Ops: All Tests Pass
    Ops->>Ops: Mark Recovery Complete
```

---

## Related Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [Swarm Coordination](./SWARM_COORDINATION.md) - Multi-agent coordination
- [Security](./SECURITY.md) - Security architecture
- [Sequences](./SEQUENCES.md) - Detailed workflows
- [Data Flow](./DATA_FLOW.md) - Data movement patterns

---

**Last Updated**: 2025-12-08
**Diagram Count**: 10 interactive Mermaid.js diagrams
