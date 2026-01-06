# Data Flow Architecture

Comprehensive diagrams showing request/response flows, memory operations, vector search, and learning cycles.

## Table of Contents

1. [Request/Response Flows](#requestresponse-flows)
2. [Memory Operations](#memory-operations)
3. [Vector Search Pipeline](#vector-search-pipeline)
4. [Learning Cycle](#learning-cycle)
5. [Data Synchronization](#data-synchronization)
6. [Caching Strategy](#caching-strategy)

---

## Request/Response Flows

### HTTP Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Validator
    participant Swarm
    participant Agent
    participant DB

    Client->>API: HTTP Request
    API->>Validator: Validate Request
    Validator-->>API: Validation Result

    alt Valid Request
        API->>Swarm: Route to Swarm
        Swarm->>Agent: Assign Task
        Agent->>DB: Query Data
        DB-->>Agent: Data Result
        Agent-->>Swarm: Task Result
        Swarm-->>API: Response Data
        API-->>Client: HTTP 200 OK
    else Invalid Request
        API-->>Client: HTTP 400 Bad Request
    end

    alt Database Error
        Agent->>DB: Query Data
        DB-->>Agent: Error
        Agent-->>Swarm: Error Result
        Swarm-->>API: Error Response
        API-->>Client: HTTP 500 Error
    end
```

### Task Execution Flow

```mermaid
flowchart TD
    REQUEST[Task Request] --> VALIDATE{Validate<br/>Request}

    VALIDATE -->|Invalid| ERROR_400[Return 400 Error]
    VALIDATE -->|Valid| QUEUE[Add to Task Queue]

    QUEUE --> SCHEDULER[Task Scheduler]
    SCHEDULER --> SELECT{Select<br/>Agent}

    SELECT -->|By Capability| MATCH_CAP[Match Capabilities]
    SELECT -->|By Load| MATCH_LOAD[Check Load]
    SELECT -->|By Priority| MATCH_PRIOR[Check Priority]

    MATCH_CAP --> ASSIGN[Assign to Agent]
    MATCH_LOAD --> ASSIGN
    MATCH_PRIOR --> ASSIGN

    ASSIGN --> EXECUTE[Execute Task]

    EXECUTE --> PROCESS{Processing}

    PROCESS -->|Success| RESULT[Generate Result]
    PROCESS -->|Error| ERROR_HANDLE[Handle Error]

    ERROR_HANDLE --> RETRY{Retry<br/>Possible?}
    RETRY -->|Yes| QUEUE
    RETRY -->|No| ERROR_500[Return 500 Error]

    RESULT --> AGGREGATE[Aggregate Results]
    AGGREGATE --> CACHE[Cache Result]
    CACHE --> RESPONSE[Return Response]

    style REQUEST fill:#4caf50
    style VALIDATE fill:#42a5f5
    style EXECUTE fill:#ff9800
    style RESULT fill:#66bb6a
    style ERROR_400 fill:#ef5350
    style ERROR_500 fill:#f44336
    style RESPONSE fill:#4caf50
```

---

## Memory Operations

### Memory Write Flow

```mermaid
sequenceDiagram
    participant Agent
    participant MemMgr as Memory Manager
    participant Cache
    participant AgentDB
    participant VectorStore

    Note over Agent,VectorStore: Write Operation
    Agent->>MemMgr: Write(key, value, metadata)
    MemMgr->>MemMgr: Validate Data

    alt Data Valid
        MemMgr->>Cache: Update Cache
        Cache-->>MemMgr: Cache Updated

        MemMgr->>AgentDB: Store Data
        AgentDB-->>MemMgr: Stored

        alt Has Vector Data
            MemMgr->>VectorStore: Index Vector
            VectorStore-->>MemMgr: Indexed
        end

        MemMgr-->>Agent: Write Success
    else Data Invalid
        MemMgr-->>Agent: Validation Error
    end

    Note over Agent,VectorStore: Synchronization
    MemMgr->>MemMgr: Trigger Sync Event
    MemMgr->>Agent: Notify Update
```

### Memory Read Flow

```mermaid
flowchart TD
    READ_REQ[Read Request] --> CHECK_CACHE{Check<br/>Cache}

    CHECK_CACHE -->|Hit| CACHE_HIT[Return from Cache]
    CHECK_CACHE -->|Miss| CACHE_MISS[Cache Miss]

    CACHE_MISS --> CHECK_DB{Query<br/>Database}

    CHECK_DB -->|Found| DB_HIT[Return from DB]
    CHECK_DB -->|Not Found| DB_MISS[Not Found Error]

    DB_HIT --> UPDATE_CACHE[Update Cache]
    UPDATE_CACHE --> RETURN_DATA[Return Data]

    CACHE_HIT --> RETURN_DATA

    RETURN_DATA --> METRICS[Update Metrics]
    METRICS --> END([Complete])

    DB_MISS --> ERROR[Return Error]
    ERROR --> END

    style READ_REQ fill:#42a5f5
    style CACHE_HIT fill:#66bb6a
    style DB_HIT fill:#66bb6a
    style RETURN_DATA fill:#4caf50
    style DB_MISS fill:#ef5350
    style ERROR fill:#f44336
```

---

## Vector Search Pipeline

### Vector Embedding and Search

```mermaid
graph TB
    subgraph "Input Processing"
        INPUT[Input Text]
        PREPROCESS[Preprocess]
        TOKENIZE[Tokenize]
    end

    subgraph "Embedding Generation"
        EMBED_CHOICE{Embedding<br/>Provider}
        OPENAI_EMBED[OpenAI Embedding]
        ANTHROPIC_EMBED[Anthropic Embedding]
        HASH_EMBED[Hash Embedding]
    end

    subgraph "Vector Storage"
        VECTOR_STORE[(Vector Store)]
        INDEX[HNSW Index]
        METADATA[Metadata Store]
    end

    subgraph "Search Operation"
        QUERY[Query Vector]
        SIMILARITY[Similarity Search]
        RANKING[Rank Results]
        FILTER[Apply Filters]
    end

    subgraph "Output"
        RESULTS[Search Results]
        RERANK[Rerank]
        RETURN[Return Top-K]
    end

    INPUT --> PREPROCESS
    PREPROCESS --> TOKENIZE
    TOKENIZE --> EMBED_CHOICE

    EMBED_CHOICE -->|OpenAI| OPENAI_EMBED
    EMBED_CHOICE -->|Anthropic| ANTHROPIC_EMBED
    EMBED_CHOICE -->|Hash| HASH_EMBED

    OPENAI_EMBED --> VECTOR_STORE
    ANTHROPIC_EMBED --> VECTOR_STORE
    HASH_EMBED --> VECTOR_STORE

    VECTOR_STORE --> INDEX
    VECTOR_STORE --> METADATA

    QUERY --> SIMILARITY
    INDEX --> SIMILARITY
    SIMILARITY --> RANKING
    METADATA --> FILTER
    RANKING --> FILTER

    FILTER --> RESULTS
    RESULTS --> RERANK
    RERANK --> RETURN

    style INPUT fill:#e3f2fd
    style VECTOR_STORE fill:#ba68c8
    style SIMILARITY fill:#42a5f5
    style RETURN fill:#4caf50
```

### Search Performance Flow

```mermaid
sequenceDiagram
    participant Client
    participant Cache
    participant VectorDB
    participant Index as HNSW Index
    participant Filter

    Note over Client,Filter: Vector Search Request
    Client->>Cache: Check Cache(query_hash)
    Cache-->>Client: Cache Miss

    Client->>VectorDB: Search(query_vector, k=10)
    VectorDB->>Index: HNSW Search
    Index-->>VectorDB: Top-1000 candidates

    VectorDB->>Filter: Apply Filters
    Filter->>Filter: Filter by metadata
    Filter->>Filter: Filter by distance
    Filter-->>VectorDB: Filtered results

    VectorDB->>VectorDB: Rerank top-K
    VectorDB-->>Client: Top-10 results

    Client->>Cache: Store(query_hash, results)
    Cache-->>Client: Cached

    Note over Client,Filter: Cached Request
    Client->>Cache: Check Cache(query_hash)
    Cache-->>Client: Cache Hit (results)
```

---

## Learning Cycle

### ReasoningBank Learning Flow

```mermaid
flowchart TD
    START[Agent Action] --> OBSERVE[Observe Outcome]

    OBSERVE --> RECORD[Record Trajectory]
    RECORD --> EMBED[Generate Embedding]
    EMBED --> STORE[Store in AgentDB]

    STORE --> ANALYZE{Analyze<br/>Performance}

    ANALYZE -->|Success| PATTERN_GOOD[Extract Success Pattern]
    ANALYZE -->|Failure| PATTERN_BAD[Extract Failure Pattern]

    PATTERN_GOOD --> REINFORCE[Reinforce Pattern]
    PATTERN_BAD --> AVOID[Mark as Avoidance]

    REINFORCE --> UPDATE_MODEL[Update Decision Model]
    AVOID --> UPDATE_MODEL

    UPDATE_MODEL --> TRAIN[Train Neural Network]
    TRAIN --> VALIDATE[Validate Improvement]

    VALIDATE -->|Improved| DEPLOY[Deploy Updated Model]
    VALIDATE -->|No Improvement| ROLLBACK[Rollback]

    DEPLOY --> DISTILL[Memory Distillation]
    DISTILL --> NEXT[Ready for Next Action]

    ROLLBACK --> NEXT

    style START fill:#42a5f5
    style PATTERN_GOOD fill:#66bb6a
    style PATTERN_BAD fill:#ff7043
    style DEPLOY fill:#4caf50
    style ROLLBACK fill:#ef5350
    style NEXT fill:#9c27b0
```

### Verdict Judgment Process

```mermaid
graph TB
    subgraph "Trajectory Collection"
        T1[Trajectory 1]
        T2[Trajectory 2]
        T3[Trajectory 3]
        TN[Trajectory N]
    end

    subgraph "Evaluation Criteria"
        C1[Task Success]
        C2[Efficiency Score]
        C3[Resource Usage]
        C4[Error Rate]
        C5[User Satisfaction]
    end

    subgraph "Verdict System"
        JUDGE[Verdict Judge]
        SCORE[Calculate Score]
        THRESHOLD{Threshold<br/>Check}
    end

    subgraph "Actions"
        ACCEPT[Accept Pattern]
        REJECT[Reject Pattern]
        LEARN[Learn from Pattern]
    end

    T1 --> JUDGE
    T2 --> JUDGE
    T3 --> JUDGE
    TN --> JUDGE

    JUDGE --> C1
    JUDGE --> C2
    JUDGE --> C3
    JUDGE --> C4
    JUDGE --> C5

    C1 --> SCORE
    C2 --> SCORE
    C3 --> SCORE
    C4 --> SCORE
    C5 --> SCORE

    SCORE --> THRESHOLD

    THRESHOLD -->|> 0.8| ACCEPT
    THRESHOLD -->|0.5-0.8| LEARN
    THRESHOLD -->|< 0.5| REJECT

    ACCEPT --> MEMORY[(Memory Store)]
    LEARN --> MEMORY
    REJECT --> DISCARD[Discard]

    style JUDGE fill:#ff9800
    style ACCEPT fill:#66bb6a
    style LEARN fill:#42a5f5
    style REJECT fill:#ef5350
    style MEMORY fill:#ba68c8
```

---

## Data Synchronization

### Multi-Agent Memory Sync

```mermaid
sequenceDiagram
    participant A1 as Agent 1
    participant A2 as Agent 2
    participant A3 as Agent 3
    participant Sync as Sync Service
    participant Memory as AgentDB

    Note over A1,Memory: Agent 1 Updates Memory
    A1->>Memory: Write(key, value_v1)
    Memory->>Sync: Trigger Sync Event
    Sync->>A2: Notify Update(key)
    Sync->>A3: Notify Update(key)

    Note over A1,Memory: Agents Pull Latest
    A2->>Memory: Read(key)
    Memory-->>A2: value_v1
    A3->>Memory: Read(key)
    Memory-->>A3: value_v1

    Note over A1,Memory: Concurrent Write Conflict
    A1->>Memory: Write(key, value_v2, timestamp: T1)
    A2->>Memory: Write(key, value_v3, timestamp: T2)

    Memory->>Memory: Detect Conflict
    Memory->>Sync: Resolve Conflict

    alt T2 > T1 (Last-Write-Wins)
        Sync->>Memory: Keep value_v3
        Memory->>A1: Notify Conflict
        Memory-->>A2: Write Success
    end

    Note over A1,Memory: Sync Complete
    Sync->>A1: Sync Complete
    Sync->>A2: Sync Complete
    Sync->>A3: Sync Complete
```

### QUIC Transport Sync

```mermaid
flowchart TD
    START[Sync Trigger] --> ESTABLISH{QUIC<br/>Connection}

    ESTABLISH -->|New| HANDSHAKE[Perform Handshake]
    ESTABLISH -->|Existing| REUSE[Reuse Connection]

    HANDSHAKE --> MULTIPLEX[Multiplex Streams]
    REUSE --> MULTIPLEX

    MULTIPLEX --> STREAM1[Stream 1: Metadata]
    MULTIPLEX --> STREAM2[Stream 2: Vector Data]
    MULTIPLEX --> STREAM3[Stream 3: State]

    STREAM1 --> SEND_META[Send Metadata]
    STREAM2 --> SEND_VEC[Send Vectors]
    STREAM3 --> SEND_STATE[Send State]

    SEND_META --> RECEIVE1[Receive ACK]
    SEND_VEC --> RECEIVE2[Receive ACK]
    SEND_STATE --> RECEIVE3[Receive ACK]

    RECEIVE1 --> CHECK{All ACKs<br/>Received?}
    RECEIVE2 --> CHECK
    RECEIVE3 --> CHECK

    CHECK -->|Yes| COMMIT[Commit Changes]
    CHECK -->|No| RETRY[Retry Failed Streams]

    RETRY --> MULTIPLEX

    COMMIT --> COMPLETE[Sync Complete]

    style START fill:#42a5f5
    style MULTIPLEX fill:#ff9800
    style COMMIT fill:#66bb6a
    style COMPLETE fill:#4caf50
```

---

## Caching Strategy

### Multi-Level Cache

```mermaid
graph TB
    REQUEST[Data Request]

    subgraph "L1 Cache - In-Memory"
        L1[Agent Local Cache]
        L1_TTL[TTL: 5 minutes]
        L1_SIZE[Size: 100 MB]
    end

    subgraph "L2 Cache - Shared Memory"
        L2[Shared Cache]
        L2_TTL[TTL: 30 minutes]
        L2_SIZE[Size: 1 GB]
    end

    subgraph "L3 Cache - Redis"
        L3[Redis Cache]
        L3_TTL[TTL: 24 hours]
        L3_SIZE[Size: 10 GB]
    end

    subgraph "Data Source"
        DB[(Database)]
        API[External API]
    end

    REQUEST --> L1
    L1 -->|Hit| RETURN_L1[Return from L1]
    L1 -->|Miss| L2

    L2 -->|Hit| UPDATE_L1[Update L1]
    UPDATE_L1 --> RETURN_L2[Return from L2]
    L2 -->|Miss| L3

    L3 -->|Hit| UPDATE_L2[Update L2]
    UPDATE_L2 --> UPDATE_L1
    L3 -->|Miss| SOURCE{Data<br/>Source}

    SOURCE -->|Database| DB
    SOURCE -->|API| API

    DB --> UPDATE_L3[Update All Caches]
    API --> UPDATE_L3

    UPDATE_L3 --> L3
    UPDATE_L3 --> L2
    UPDATE_L3 --> L1

    UPDATE_L3 --> RETURN_SOURCE[Return from Source]

    style L1 fill:#4caf50
    style L2 fill:#66bb6a
    style L3 fill:#81c784
    style DB fill:#ba68c8
    style API fill:#42a5f5
    style RETURN_L1 fill:#1b5e20
    style RETURN_L2 fill:#2e7d32
    style RETURN_SOURCE fill:#43a047
```

### Cache Invalidation

```mermaid
sequenceDiagram
    participant Writer
    participant Cache
    participant DB
    participant Subscribers

    Note over Writer,Subscribers: Write Operation
    Writer->>DB: Update Data
    DB-->>Writer: Update Success

    Writer->>Cache: Invalidate(key)
    Cache->>Cache: Remove from L1
    Cache->>Cache: Remove from L2
    Cache->>Cache: Remove from L3

    Cache->>Subscribers: Notify Invalidation
    Subscribers->>Subscribers: Clear Local Cache

    Note over Writer,Subscribers: Next Read
    Subscribers->>Cache: Read(key)
    Cache->>DB: Fetch Latest
    DB-->>Cache: Latest Data
    Cache->>Cache: Update All Levels
    Cache-->>Subscribers: Return Fresh Data
```

---

## Related Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [Swarm Coordination](./SWARM_COORDINATION.md) - Multi-agent coordination
- [Agent Lifecycle](./AGENT_LIFECYCLE.md) - Agent state management
- [Sequences](./SEQUENCES.md) - Detailed sequence diagrams
- [Security](./SECURITY.md) - Data encryption and security

---

**Last Updated**: 2025-12-08
**Diagram Count**: 11 interactive Mermaid.js diagrams
