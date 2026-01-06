# Sequence Diagrams

Detailed sequence diagrams showing key workflows and interactions in the agent-control-plane system.

## Table of Contents

1. [Agent Creation Flow](#agent-creation-flow)
2. [Task Execution Workflow](#task-execution-workflow)
3. [Swarm Coordination](#swarm-coordination)
4. [Memory Synchronization](#memory-synchronization)
5. [Error Handling and Recovery](#error-handling-and-recovery)
6. [Full-Stack Development Workflow](#full-stack-development-workflow)

---

## Agent Creation Flow

### Complete Agent Spawning Sequence

```mermaid
sequenceDiagram
    participant Client
    participant SwarmCoord as Swarm Coordinator
    participant AgentMgr as Agent Manager
    participant AgentFactory as Agent Factory
    participant Config
    participant AgentDB
    participant Agent

    Client->>SwarmCoord: spawnAgent(type, config)
    SwarmCoord->>SwarmCoord: Validate request

    SwarmCoord->>AgentMgr: createAgent(type, config)
    AgentMgr->>Config: loadAgentConfig(type)
    Config-->>AgentMgr: agentConfig

    AgentMgr->>AgentFactory: build(type, config)
    AgentFactory->>AgentFactory: Allocate resources
    AgentFactory->>Agent: new Agent(config)
    Agent-->>AgentFactory: Agent instance

    AgentFactory-->>AgentMgr: Agent created
    AgentMgr->>Agent: initialize()

    Agent->>Config: loadConfiguration()
    Config-->>Agent: configuration loaded

    Agent->>AgentDB: registerAgent(id, metadata)
    AgentDB-->>Agent: registered

    Agent->>Agent: startHealthMonitor()
    Agent-->>AgentMgr: Initialization complete

    AgentMgr-->>SwarmCoord: Agent ready (agentId)
    SwarmCoord->>SwarmCoord: Add to agent pool
    SwarmCoord-->>Client: Agent spawned successfully

    Note over Agent: Agent State: READY
    loop Health Checks
        Agent->>AgentMgr: heartbeat()
        AgentMgr-->>Agent: ACK
    end
```

---

## Task Execution Workflow

### End-to-End Task Processing

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant TaskQueue
    participant Scheduler
    participant Agent
    participant AgentDB
    participant Result

    Note over Client,Result: Task Submission
    Client->>API: POST /task (taskDefinition)
    API->>API: Validate task
    API->>TaskQueue: enqueue(task)
    TaskQueue-->>API: Task queued (taskId)
    API-->>Client: 202 Accepted (taskId)

    Note over Client,Result: Task Scheduling
    Scheduler->>TaskQueue: poll()
    TaskQueue-->>Scheduler: task

    Scheduler->>Scheduler: findBestAgent(task)
    Scheduler->>Agent: assignTask(task)
    Agent-->>Scheduler: Task accepted

    Note over Client,Result: Task Execution
    Agent->>Agent: executeTask(task)
    Agent->>AgentDB: Read context memory
    AgentDB-->>Agent: Context data

    loop Task Steps
        Agent->>Agent: Process step
        Agent->>AgentDB: Store intermediate result
    end

    Agent->>Agent: Generate result
    Agent->>Result: storeResult(taskId, result)
    Result-->>Agent: Result stored

    Note over Client,Result: Result Notification
    Agent->>Scheduler: taskComplete(taskId, result)
    Scheduler->>TaskQueue: markComplete(taskId)
    Scheduler->>API: notifyCompletion(taskId)

    Note over Client,Result: Client Retrieval
    Client->>API: GET /task/{taskId}
    API->>Result: getResult(taskId)
    Result-->>API: task result
    API-->>Client: 200 OK (result)
```

### Parallel Task Execution

```mermaid
sequenceDiagram
    participant Coordinator
    participant Scheduler
    participant Agent1
    participant Agent2
    participant Agent3
    participant Aggregator

    Coordinator->>Scheduler: executeTasks([task1, task2, task3])

    par Parallel Execution
        Scheduler->>Agent1: assignTask(task1)
        and
        Scheduler->>Agent2: assignTask(task2)
        and
        Scheduler->>Agent3: assignTask(task3)
    end

    par Task Processing
        Agent1->>Agent1: Execute task1
        and
        Agent2->>Agent2: Execute task2
        and
        Agent3->>Agent3: Execute task3
    end

    par Result Reporting
        Agent1-->>Aggregator: result1
        and
        Agent2-->>Aggregator: result2
        and
        Agent3-->>Aggregator: result3
    end

    Aggregator->>Aggregator: Combine results
    Aggregator-->>Coordinator: Combined result
```

---

## Swarm Coordination

### Hierarchical Swarm Workflow

```mermaid
sequenceDiagram
    participant Client
    participant Queen as Queen Agent
    participant Worker1
    participant Worker2
    participant Worker3
    participant Memory as Shared Memory

    Client->>Queen: Execute complex task
    Queen->>Queen: Decompose into subtasks

    Note over Queen,Memory: Task Distribution
    Queen->>Worker1: Subtask 1 (Backend)
    Queen->>Worker2: Subtask 2 (Frontend)
    Queen->>Worker3: Subtask 3 (Database)

    par Worker Execution
        Worker1->>Worker1: Build backend API
        Worker1->>Memory: Store API spec
        and
        Worker2->>Worker2: Build frontend UI
        Worker2->>Memory: Store component map
        and
        Worker3->>Worker3: Design database schema
        Worker3->>Memory: Store schema
    end

    par Progress Reporting
        Worker1-->>Queen: Progress update (30%)
        and
        Worker2-->>Queen: Progress update (25%)
        and
        Worker3-->>Queen: Progress update (50%)
    end

    Note over Queen,Memory: Coordination
    Queen->>Memory: Read shared context
    Memory-->>Queen: Context data
    Queen->>Queen: Adjust plan based on progress

    par Completion
        Worker1->>Memory: Store final backend code
        Worker1-->>Queen: Subtask 1 complete
        and
        Worker2->>Memory: Store final frontend code
        Worker2-->>Queen: Subtask 2 complete
        and
        Worker3->>Memory: Store final schema
        Worker3-->>Queen: Subtask 3 complete
    end

    Queen->>Queen: Aggregate results
    Queen->>Memory: Store integrated solution
    Queen-->>Client: Task complete (deliverables)
```

### Mesh Network Coordination

```mermaid
sequenceDiagram
    participant A1 as Agent 1
    participant A2 as Agent 2
    participant A3 as Agent 3
    participant A4 as Agent 4
    participant Consensus

    Note over A1,Consensus: Proposal Phase
    A1->>A1: Generate proposal
    A1->>A2: Broadcast proposal
    A1->>A3: Broadcast proposal
    A1->>A4: Broadcast proposal

    Note over A1,Consensus: Voting Phase
    par Agent Voting
        A2->>A2: Evaluate proposal
        A2->>Consensus: Vote YES
        and
        A3->>A3: Evaluate proposal
        A3->>Consensus: Vote YES
        and
        A4->>A4: Evaluate proposal
        A4->>Consensus: Vote NO
    end

    Consensus->>Consensus: Count votes (3/4)
    Consensus->>Consensus: Quorum reached

    Note over A1,Consensus: Commit Phase
    Consensus->>A1: Commit decision
    Consensus->>A2: Commit decision
    Consensus->>A3: Commit decision
    Consensus->>A4: Commit decision

    par Apply Decision
        A1->>A1: Apply decision
        and
        A2->>A2: Apply decision
        and
        A3->>A3: Apply decision
        and
        A4->>A4: Apply decision (override)
    end
```

---

## Memory Synchronization

### Cross-Agent Memory Sync

```mermaid
sequenceDiagram
    participant A1 as Agent 1
    participant A2 as Agent 2
    participant SyncSvc as Sync Service
    participant AgentDB
    participant VectorStore

    Note over A1,VectorStore: Agent 1 Writes
    A1->>AgentDB: Write(key, value, vector)
    AgentDB->>AgentDB: Store data
    AgentDB->>VectorStore: Index vector
    VectorStore-->>AgentDB: Indexed

    AgentDB->>SyncSvc: Trigger sync event
    SyncSvc->>SyncSvc: Identify subscribers

    Note over A1,VectorStore: Propagate to Agent 2
    SyncSvc->>A2: Notify update (key)
    A2->>AgentDB: Read(key)
    AgentDB-->>A2: value

    A2->>A2: Process updated data
    A2->>VectorStore: Search similar vectors
    VectorStore-->>A2: Related vectors

    Note over A1,VectorStore: Agent 2 Adds Context
    A2->>AgentDB: Write(key2, enriched_value)
    AgentDB->>SyncSvc: Trigger sync event
    SyncSvc->>A1: Notify update (key2)

    A1->>AgentDB: Read(key2)
    AgentDB-->>A1: enriched_value
    A1->>A1: Update local context
```

### Vector Search with Memory

```mermaid
sequenceDiagram
    participant Agent
    participant Cache
    participant AgentDB
    participant VectorStore
    participant Embedder

    Agent->>Agent: Prepare query text
    Agent->>Embedder: Generate embedding(query)
    Embedder-->>Agent: query_vector

    Agent->>Cache: Check cache(query_hash)
    Cache-->>Agent: Cache miss

    Agent->>VectorStore: Search(query_vector, k=10)
    VectorStore->>VectorStore: HNSW search
    VectorStore-->>Agent: candidate_vectors[1000]

    Agent->>AgentDB: Filter by metadata
    AgentDB-->>Agent: filtered_results[50]

    Agent->>Agent: Rerank results
    Agent->>Agent: Top-10 results

    Agent->>Cache: Store(query_hash, results)
    Cache-->>Agent: Cached

    Agent->>Agent: Return results to user
```

---

## Error Handling and Recovery

### Error Detection and Recovery Flow

```mermaid
sequenceDiagram
    participant Agent
    participant ErrorHandler
    participant Monitor
    participant Recovery
    participant Coordinator

    Note over Agent,Coordinator: Normal Operation
    Agent->>Agent: Execute task
    Agent->>Agent: Error occurs!

    Agent->>ErrorHandler: Handle error
    ErrorHandler->>ErrorHandler: Classify error

    alt Operational Error
        ErrorHandler->>Recovery: Attempt retry
        Recovery->>Agent: Retry operation

        alt Retry Success
            Agent-->>ErrorHandler: Success
            ErrorHandler->>Monitor: Log recovery
        else Retry Failed
            Recovery->>Recovery: Exponential backoff
            Recovery->>Agent: Retry operation (2)

            alt Second Retry Success
                Agent-->>ErrorHandler: Success
            else Final Failure
                ErrorHandler->>Coordinator: Escalate error
                Coordinator->>Coordinator: Reassign task
            end
        end
    else Critical Error
        ErrorHandler->>Monitor: Log critical error
        ErrorHandler->>Coordinator: Agent unavailable
        Coordinator->>Recovery: Restart agent

        Recovery->>Agent: Shutdown
        Recovery->>Recovery: Cleanup resources
        Recovery->>Agent: Initialize new instance
        Agent-->>Coordinator: Agent ready
    end
```

### Circuit Breaker Pattern

```mermaid
sequenceDiagram
    participant Client
    participant CircuitBreaker
    participant Service
    participant Monitor

    Note over Client,Monitor: Closed State (Normal)
    loop Successful Calls
        Client->>CircuitBreaker: Call service
        CircuitBreaker->>Service: Forward request
        Service-->>CircuitBreaker: Success
        CircuitBreaker-->>Client: Response
    end

    Note over Client,Monitor: Failures Detected
    loop Consecutive Failures
        Client->>CircuitBreaker: Call service
        CircuitBreaker->>Service: Forward request
        Service-->>CircuitBreaker: Error
        CircuitBreaker->>Monitor: Record failure
    end

    Note over Client,Monitor: Open State (Failing)
    CircuitBreaker->>CircuitBreaker: Open circuit (threshold reached)

    loop During Open State
        Client->>CircuitBreaker: Call service
        CircuitBreaker-->>Client: Fail fast (circuit open)
    end

    Note over Client,Monitor: Half-Open State (Testing)
    CircuitBreaker->>CircuitBreaker: Timeout elapsed
    CircuitBreaker->>CircuitBreaker: Transition to half-open

    Client->>CircuitBreaker: Call service
    CircuitBreaker->>Service: Test request
    Service-->>CircuitBreaker: Success
    CircuitBreaker->>CircuitBreaker: Close circuit

    Note over Client,Monitor: Back to Closed State
    Client->>CircuitBreaker: Call service
    CircuitBreaker->>Service: Forward request
    Service-->>CircuitBreaker: Success
    CircuitBreaker-->>Client: Response
```

---

## Full-Stack Development Workflow

### Complete Development Cycle

```mermaid
sequenceDiagram
    participant User
    participant Architect as Architect Queen
    participant Backend
    participant Frontend
    participant Database
    participant Tester
    participant AgentDB

    User->>Architect: Build full-stack app request

    Note over Architect,AgentDB: Phase 1: Planning
    Architect->>Architect: Analyze requirements
    Architect->>AgentDB: Store project plan
    Architect->>Backend: Design API endpoints
    Architect->>Frontend: Design UI components
    Architect->>Database: Design schema

    Note over Architect,AgentDB: Phase 2: Backend Development
    Backend->>Backend: Implement REST API
    Backend->>AgentDB: Store API specification
    Backend->>Database: Request schema creation
    Database->>Database: Create database schema
    Database->>AgentDB: Store schema DDL
    Database-->>Backend: Schema ready

    Note over Architect,AgentDB: Phase 3: Frontend Development
    Frontend->>AgentDB: Read API specification
    AgentDB-->>Frontend: API spec
    Frontend->>Frontend: Build React components
    Frontend->>Frontend: Integrate with API
    Frontend->>AgentDB: Store component structure

    Note over Architect,AgentDB: Phase 4: Integration
    par Integration Tasks
        Backend->>Backend: Connect to database
        and
        Frontend->>Frontend: Connect to backend
    end

    Backend->>AgentDB: Store integration status
    Frontend->>AgentDB: Store integration status

    Note over Architect,AgentDB: Phase 5: Testing
    Tester->>AgentDB: Read project artifacts
    AgentDB-->>Tester: All specifications

    par Testing
        Tester->>Backend: Run backend tests
        Backend-->>Tester: Test results (pass)
        and
        Tester->>Frontend: Run frontend tests
        Frontend-->>Tester: Test results (pass)
        and
        Tester->>Tester: Run integration tests
    end

    Tester->>AgentDB: Store test results
    Tester-->>Architect: All tests passed

    Note over Architect,AgentDB: Phase 6: Delivery
    Architect->>Architect: Aggregate deliverables
    Architect->>AgentDB: Store final package
    Architect-->>User: Project complete
```

---

## Related Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [Swarm Coordination](./SWARM_COORDINATION.md) - Coordination patterns
- [Agent Lifecycle](./AGENT_LIFECYCLE.md) - Agent states
- [Data Flow](./DATA_FLOW.md) - Data movement
- [Error Handling](./ERROR_HANDLING.md) - Error flows
- [Deployment](./DEPLOYMENT.md) - Infrastructure

---

**Last Updated**: 2025-12-08
**Diagram Count**: 10 interactive sequence diagrams
