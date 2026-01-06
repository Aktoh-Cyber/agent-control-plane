# Architecture Overview

This document provides a comprehensive overview of the Agentic Flow architecture, system components, and design patterns.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Package Structure](#package-structure)
4. [Key Abstractions](#key-abstractions)
5. [Data Flow](#data-flow)
6. [Integration Points](#integration-points)
7. [Design Patterns](#design-patterns)
8. [Performance Architecture](#performance-architecture)

## System Architecture

Agentic Flow is built on a modular, layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI Interface Layer                      │
│  (agent-control-plane CLI, agentdb CLI, ajj-billing CLI)          │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                   Agent Orchestration Layer                  │
│  - Agent Router      - Task Orchestrator                    │
│  - Model Router      - Swarm Coordinator                    │
│  - Agent Booster     - QUIC Transport                       │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                     Memory & Learning Layer                  │
│  - ReasoningBank     - AgentDB                              │
│  - Vector Store      - Causal Memory                        │
│  - Skill Library     - Reflexion                            │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                    Core Services Layer                       │
│  - Configuration     - Error Handling                       │
│  - Security          - PII Scrubbing                        │
│  - Encryption        - Key Management                       │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  - Database (SQLite) - API Clients                          │
│  - File System       - Network Transport                    │
│  - ONNX Runtime      - WASM Runtime                         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Configuration System

**Location:** `src/config/`

Centralized configuration management with environment variable support.

```typescript
interface ConfigSchema {
  embedding: EmbeddingConfig; // Embedding configuration
  pii: PIIConfig; // PII scrubbing settings
  api: {
    // API configurations
    openai: APIConfig;
    anthropic: APIConfig;
  };
  models: ModelConfig; // Model selection
  onnx: ONNXConfig; // Local inference
  features: FeatureFlagsConfig; // Feature flags
  performance: PerformanceConfig; // Performance tuning
  database: DatabaseConfig; // Database settings
}
```

**Key Features:**

- Type-safe configuration access
- Automatic validation at startup
- Environment variable support
- Runtime configuration updates

**Design Pattern:** Singleton with lazy initialization

### 2. Error Handling System

**Location:** `src/errors/`

Typed error hierarchy with categorization and metadata.

```
BaseError (abstract)
├── OperationalError
│   ├── DatabaseError (2000-2999)
│   ├── ValidationError (3000-3999)
│   ├── NetworkError (4000-4999)
│   ├── AuthenticationError (5000-5999)
│   ├── AuthorizationError (5000-5999)
│   └── AgentError (7000-7999)
└── ProgrammingError
    └── ConfigurationError (6000-6999)
```

**Key Features:**

- Type-safe error handling
- Rich metadata and context
- Error chaining and causality
- Automatic HTTP status mapping
- Retry detection and delay calculation

**Design Pattern:** Error hierarchy with factory methods

### 3. ReasoningBank Memory System

**Location:** `src/reasoningbank/`

Self-learning memory system based on Google DeepMind research (arXiv:2509.25140).

**Architecture:**

```
ReasoningBank Engine
├── Memory Database (SQLite)
│   ├── Memories Table
│   ├── Patterns Table
│   ├── Embeddings Table
│   └── Trajectories Table
├── Embedding Provider
│   ├── Hash Embedding (default)
│   ├── OpenAI Embedding
│   └── Anthropic Embedding
├── PII Scrubber
│   ├── Pattern Detection
│   └── Secure Scrubbing
└── Query Engine
    ├── Semantic Search
    ├── Pattern Matching
    └── Relevance Scoring
```

**Key Features:**

- Semantic memory search
- Pattern learning and distillation
- HIPAA-compliant PII scrubbing
- Configurable embedding providers
- Namespace isolation

**Design Pattern:** Repository pattern with dependency injection

### 4. Security System

**Location:** `src/security/`

HIPAA-compliant encryption and key management.

**Components:**

- **HIPAA Encryption:** AES-256-GCM encryption
- **Key Manager:** Secure key generation and rotation
- **Migration:** Database encryption migration
- **PII Scrubber:** Pattern-based PII detection

**Key Features:**

- AES-256-GCM encryption at rest
- Automatic key rotation
- Secure key storage
- PII pattern detection
- Audit logging

**Design Pattern:** Strategy pattern for encryption algorithms

### 5. Agent Booster

**Location:** `agent-booster/` (parent directory)

Ultra-fast local code transformations via Rust/WASM.

**Architecture:**

```
Agent Booster
├── Detection Layer
│   └── Code Edit Detection
├── WASM Runtime
│   ├── Tree-sitter Parser
│   ├── AST Transformer
│   └── Code Generator
└── Optimization Layer
    ├── Batch Processing
    └── Incremental Updates
```

**Performance:**

- Single edit: 1ms (352x faster than API)
- 100 edits: 0.1s vs 35s
- 1000 files: 1s vs 5.87 minutes
- Cost: $0 (100% free)

**Design Pattern:** Adapter pattern for WASM integration

### 6. Multi-Model Router

**Location:** `src/router/` (parent directory)

Intelligent cost optimization across 100+ LLM models.

**Architecture:**

```
Model Router
├── Model Registry
│   ├── Tier 1: Flagship
│   ├── Tier 2: Cost-Effective
│   ├── Tier 3: Balanced
│   ├── Tier 4: Budget
│   └── Tier 5: Local/Privacy
├── Selection Engine
│   ├── Cost Optimizer
│   ├── Quality Scorer
│   └── Latency Predictor
└── Execution Layer
    ├── API Client Pool
    └── Response Handler
```

**Key Features:**

- 85-99% cost savings
- Quality-based selection
- Latency optimization
- Automatic failover

**Design Pattern:** Strategy pattern with factory

### 7. QUIC Transport

**Location:** `crates/agent-control-plane-quic/` (parent directory)

Ultra-low latency agent communication via QUIC protocol.

**Architecture:**

```
QUIC Transport
├── Connection Manager
│   ├── Connection Pool
│   └── Migration Support
├── Stream Multiplexer
│   ├── Concurrent Streams
│   └── Flow Control
├── Security Layer
│   └── TLS 1.3 Encryption
└── Performance Layer
    ├── 0-RTT Resumption
    └── Congestion Control
```

**Performance:**

- 50-70% faster than TCP
- 0-RTT connection setup
- 100+ concurrent streams
- Network migration support

**Design Pattern:** Protocol adapter with connection pooling

## Package Structure

### TypeScript Source (`src/`)

```
src/
├── config/              # Configuration system
│   ├── index.ts        # Config service singleton
│   ├── types.ts        # Type definitions
│   └── validator.ts    # Validation logic
├── errors/              # Error handling
│   ├── base.ts         # Base error class
│   ├── database.ts     # DB errors
│   ├── validation.ts   # Validation errors
│   ├── network.ts      # Network errors
│   ├── auth.ts         # Auth errors
│   ├── agent.ts        # Agent errors
│   ├── configuration.ts# Config errors
│   └── index.ts        # Exports
├── reasoningbank/       # Memory system
│   ├── index.ts        # Main exports
│   └── utils/          # Utilities
│       ├── embeddings.ts   # Text embeddings
│       └── pii-scrubber.ts # PII scrubbing
└── security/            # Security features
    ├── hipaa-encryption.ts # Encryption
    ├── key-manager.ts      # Key management
    ├── migration.ts        # Migrations
    └── index.ts            # Exports
```

### Test Suite (`tests/`)

```
tests/
├── e2e/                 # End-to-end tests
│   └── README.md       # E2E testing guide
└── utils/               # Test utilities
    ├── README.md       # Testing guide
    ├── builders/       # Data builders
    ├── mocks/          # Mock objects
    ├── helpers/        # Test helpers
    └── fixtures/       # Test fixtures
```

### Documentation (`docs/`)

```
docs/
├── CONFIGURATION.md         # Config guide
├── error-handling.md        # Error system
├── testing-utilities.md     # Testing guide
├── E2E-TESTING.md          # E2E testing
├── DEVELOPER_ONBOARDING.md # This guide
├── ARCHITECTURE_OVERVIEW.md# Architecture
├── COMMON_WORKFLOWS.md     # Workflows
├── CONTRIBUTING.md         # Contributing
├── DEBUGGING_GUIDE.md      # Debugging
└── tutorials/              # Interactive tutorials
    ├── 01-build-first-agent.md
    ├── 02-swarm-workflow.md
    ├── 03-mcp-tool.md
    ├── 04-performance-optimization.md
    └── 05-reasoningbank-tutorial.md
```

## Key Abstractions

### 1. ConfigService

Centralized configuration management:

```typescript
class ConfigService {
  private config: ConfigSchema;

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K];
  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void;
  getAll(): ConfigSchema;
  reload(): void;
}
```

**Responsibilities:**

- Load configuration from environment
- Validate configuration schema
- Provide type-safe access
- Support runtime updates

### 2. BaseError

Foundation for all errors:

```typescript
abstract class BaseError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly metadata: Record<string, any>;
  readonly httpStatus?: number;
  readonly isRetryable: boolean;

  toJSON(): ErrorJSON;
  static isBaseError(error: unknown): error is BaseError;
}
```

**Responsibilities:**

- Provide error context
- Support error chaining
- Enable serialization
- HTTP status mapping

### 3. ReasoningBankEngine

Memory and learning system:

```typescript
class ReasoningBankEngine {
  async storeMemory(key: string, value: string, options?: MemoryOptions): Promise<void>;
  async queryMemories(query: string, options?: QueryOptions): Promise<Memory[]>;
  async consolidateMemories(options?: ConsolidationOptions): Promise<ConsolidationStats>;
  async judgeTrajectory(trajectory: TaskTrajectory): Promise<JudgmentResult>;
}
```

**Responsibilities:**

- Store and retrieve memories
- Semantic search
- Pattern learning
- Quality judgment

### 4. EmbeddingProvider

Text embedding interface:

```typescript
interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  getDimensions(): number;
  batchGenerate(texts: string[]): Promise<number[][]>;
}
```

**Implementations:**

- HashEmbedding (fast, offline)
- OpenAIEmbedding (high quality)
- AnthropicEmbedding (Claude-powered)

### 5. PIIScrubber

PII detection and scrubbing:

```typescript
class PIIScrubber {
  scrub(text: string): string;
  detect(text: string): PIIMatch[];
  isEnabled(): boolean;
  configure(config: PIIConfig): void;
}
```

**Patterns Detected:**

- Email addresses
- Social Security Numbers
- API keys
- Credit card numbers
- Phone numbers
- IP addresses
- Bearer tokens
- Private keys

## Data Flow

### 1. Agent Execution Flow

```
User Input
    │
    ├─→ CLI Parser
    │       │
    │       ├─→ Agent Router
    │       │       │
    │       │       ├─→ Model Selection (Multi-Model Router)
    │       │       │       │
    │       │       │       └─→ Cost Optimization
    │       │       │
    │       │       ├─→ Agent Booster Detection
    │       │       │       │
    │       │       │       └─→ WASM Transform (if code edit)
    │       │       │
    │       │       └─→ Claude Agent SDK
    │       │               │
    │       │               └─→ API Call
    │       │
    │       └─→ Response Handling
    │               │
    │               ├─→ ReasoningBank Storage
    │               │
    │               └─→ Output Formatting
    │
    └─→ Result Display
```

### 2. Memory Storage Flow

```
Memory Data
    │
    ├─→ PII Scrubber
    │       │
    │       └─→ Pattern Detection & Scrubbing
    │
    ├─→ Embedding Generator
    │       │
    │       └─→ Vector Generation
    │
    ├─→ Encryption (if enabled)
    │       │
    │       └─→ AES-256-GCM
    │
    └─→ Database Storage
            │
            └─→ SQLite (ReasoningBank)
```

### 3. Memory Query Flow

```
Query String
    │
    ├─→ Embedding Generator
    │       │
    │       └─→ Query Vector
    │
    ├─→ Vector Search
    │       │
    │       ├─→ Cosine Similarity
    │       │
    │       └─→ Ranking
    │
    ├─→ Decryption (if enabled)
    │       │
    │       └─→ AES-256-GCM
    │
    └─→ Results Return
```

### 4. Configuration Flow

```
Environment Variables
    │
    ├─→ Config Loader
    │       │
    │       ├─→ Type Parsing
    │       │
    │       └─→ Default Values
    │
    ├─→ Validator
    │       │
    │       ├─→ Schema Validation
    │       │
    │       └─→ Constraint Checking
    │
    └─→ ConfigService
            │
            └─→ Application Access
```

## Integration Points

### 1. Claude Agent SDK

**Interface:** REST API / SDK

```typescript
import { AgentSDK } from '@anthropic-ai/claude-agent-sdk';

const agent = new AgentSDK({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5-20250929',
});

const response = await agent.run({
  agent: 'coder',
  task: 'Build a REST API',
});
```

### 2. OpenRouter

**Interface:** REST API

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'meta-llama/llama-3.1-8b-instruct',
    messages: [{ role: 'user', content: 'prompt' }],
  }),
});
```

### 3. AgentDB

**Interface:** CLI + Programmatic API

```bash
# CLI
npx agentdb reflexion store "session-1" "task" 0.95 true "Success"
npx agentdb skill search "authentication" 10
```

```typescript
// Programmatic
import { ReflexionMemory, SkillLibrary } from 'agentopia/agentdb';

const memory = new ReflexionMemory();
await memory.store('session-1', 'task', 0.95, true, 'Success');

const skills = new SkillLibrary();
const results = await skills.search('authentication', 10);
```

### 4. ONNX Runtime

**Interface:** WASM / Native

```typescript
import { InferenceSession } from 'onnxruntime-node';

const session = await InferenceSession.create('./models/phi-4.onnx');
const results = await session.run(inputs);
```

### 5. SQLite Database

**Interface:** SQL

```typescript
import Database from 'better-sqlite3';

const db = new Database('./data/reasoningbank.db');
const memories = db.prepare('SELECT * FROM memories WHERE namespace = ?').all('api');
```

## Design Patterns

### 1. Singleton Pattern

Used for configuration and global services:

```typescript
class ConfigService {
  private static instance: ConfigService;

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}
```

### 2. Repository Pattern

Used for data access:

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

class MemoryRepository implements Repository<Memory> {
  // Implementation
}
```

### 3. Strategy Pattern

Used for embedding providers:

```typescript
interface EmbeddingStrategy {
  generateEmbedding(text: string): Promise<number[]>;
}

class HashEmbedding implements EmbeddingStrategy {}
class OpenAIEmbedding implements EmbeddingStrategy {}
class AnthropicEmbedding implements EmbeddingStrategy {}
```

### 4. Factory Pattern

Used for error creation:

```typescript
function createHttpError(
  status: number,
  message: string,
  metadata?: Record<string, any>
): NetworkError {
  switch (status) {
    case 400:
      return new BadRequestError(message, metadata);
    case 404:
      return new NotFoundError(message, metadata);
    case 429:
      return new TooManyRequestsError(message, metadata);
    default:
      return new NetworkError(message, `NET_${status}`, metadata);
  }
}
```

### 5. Adapter Pattern

Used for WASM integration:

```typescript
class AgentBoosterAdapter {
  private wasmModule: WebAssembly.Module;

  async transform(code: string): Promise<string> {
    // Adapt JavaScript to WASM interface
    const result = await this.wasmModule.exports.transform(code);
    return result;
  }
}
```

### 6. Observer Pattern

Used for event-driven coordination:

```typescript
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }
}
```

## Performance Architecture

### 1. Caching Layer

```typescript
interface CacheConfig {
  size: number; // Maximum cache entries
  ttl: number; // Time-to-live in ms
  enabled: boolean; // Enable/disable cache
}

class LRUCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }>;
  private maxSize: number;

  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  clear(): void;
}
```

**Cache Locations:**

- Embedding cache (frequent queries)
- Configuration cache (startup data)
- API response cache (external calls)

### 2. Connection Pooling

```typescript
class ConnectionPool {
  private pool: Connection[];
  private maxConnections: number;

  async acquire(): Promise<Connection>;
  release(conn: Connection): void;
  drain(): Promise<void>;
}
```

**Pooled Resources:**

- Database connections
- HTTP clients
- QUIC connections

### 3. Batch Processing

```typescript
class BatchProcessor<T, R> {
  private batch: T[] = [];
  private batchSize: number;

  add(item: T): Promise<R>;
  flush(): Promise<R[]>;
  private processBatch(items: T[]): Promise<R[]>;
}
```

**Batched Operations:**

- Embedding generation
- Database inserts
- API requests

### 4. Lazy Loading

```typescript
class LazyLoader<T> {
  private value?: T;
  private loader: () => Promise<T>;

  async get(): Promise<T> {
    if (!this.value) {
      this.value = await this.loader();
    }
    return this.value;
  }
}
```

**Lazy Loaded:**

- WASM modules
- Heavy dependencies
- Large configuration

## Scalability Considerations

### Horizontal Scaling

- **Stateless agents:** Can run on multiple instances
- **Shared memory:** Via ReasoningBank database
- **Load balancing:** Distribute agent requests

### Vertical Scaling

- **Connection pooling:** Increase max connections
- **Batch processing:** Larger batch sizes
- **Caching:** Larger cache sizes

### Performance Metrics

- **Cold start:** < 2s (including MCP initialization)
- **Warm start:** < 500ms (cached MCP servers)
- **Agent spawn:** 150+ agents in < 2s
- **Tool discovery:** 213 tools in < 1s
- **Memory footprint:** 100-200MB per agent
- **Concurrent agents:** 10+ on t3.small, 100+ on c6a.xlarge

## Security Architecture

### Defense in Depth

1. **Input Validation:** All inputs validated before processing
2. **PII Scrubbing:** Automatic detection and removal
3. **Encryption at Rest:** AES-256-GCM for sensitive data
4. **Secure Communication:** TLS 1.3 for all network traffic
5. **Key Management:** Secure key generation and rotation
6. **Audit Logging:** All security events logged

### HIPAA Compliance

- **Encryption:** AES-256-GCM at rest
- **Access Control:** Role-based permissions
- **Audit Trail:** Complete operation logging
- **PII Detection:** Pattern-based scrubbing
- **Secure Storage:** Encrypted database

## Conclusion

Agentic Flow is designed for:

- **Performance:** 352x faster operations, 50-70% lower latency
- **Cost Efficiency:** 85-99% cost savings
- **Learning:** Self-improving with ReasoningBank
- **Security:** HIPAA-compliant encryption
- **Scalability:** 100+ concurrent agents
- **Modularity:** Clean separation of concerns
- **Extensibility:** Plugin architecture

For more details, see:

- [Configuration Guide](./CONFIGURATION.md)
- [Error Handling Guide](./error-handling.md)
- [Testing Guide](./testing-utilities.md)
- [Developer Onboarding](./DEVELOPER_ONBOARDING.md)
