# Developer Onboarding Guide

Welcome to **Agentic Flow** - the first AI agent framework that gets smarter AND faster every time it runs! This comprehensive guide will help you get started with development, understand the architecture, and become productive quickly.

## Table of Contents

1. [Welcome](#welcome)
2. [Quick Start](#quick-start)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Core Concepts](#core-concepts)
6. [Your First Contribution](#your-first-contribution)
7. [Common Development Workflows](#common-development-workflows)
8. [Testing Guide](#testing-guide)
9. [Debugging Tips](#debugging-tips)
10. [Performance Optimization](#performance-optimization)
11. [Resources](#resources)

## Welcome

Agentic Flow is a production-ready AI agent orchestration platform featuring:

- **66 specialized agents** for different tasks (coding, testing, research, etc.)
- **213 MCP tools** for comprehensive functionality
- **ReasoningBank** - Self-learning memory system (46% faster execution)
- **Agent Booster** - 352x faster code operations ($0 cost)
- **Multi-Model Router** - 85-99% cost savings
- **QUIC Transport** - 50-70% faster than TCP

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/tafyai/agent-control-plane.git
cd agent-control-plane/agent-control-plane

# 2. Install dependencies
pnpm install
# or
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Build the project
pnpm build

# 5. Run your first agent
npx agentopia --agent researcher --task "Analyze TypeScript best practices"
```

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js**: >= 18.0.0 (LTS recommended)
- **pnpm**: >= 8.0.0 (preferred) or npm >= 9.0.0
- **TypeScript**: >= 5.6.3 (installed via dependencies)
- **Git**: Latest version
- **VS Code**: Recommended IDE (or your preferred editor)

**Optional but Recommended:**

- **Docker**: For containerized testing
- **Rust**: For building WASM components (Agent Booster, QUIC)
- **wasm-pack**: For WASM builds

### Installation Steps

#### 1. Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installation
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

#### 2. Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should be >= 8.0.0
```

#### 3. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/tafyai/agent-control-plane.git
cd agent-control-plane/agent-control-plane

# Install dependencies
pnpm install

# Build the project
pnpm build
```

#### 4. Environment Configuration

Create your `.env` file:

```bash
# Core API Keys
ANTHROPIC_API_KEY=sk-ant-...        # Required for Claude agents
OPENROUTER_API_KEY=sk-or-v1-...     # Optional: For 100+ models
OPENAI_API_KEY=sk-...               # Optional: For OpenAI features

# Model Configuration
DEFAULT_MODEL=hash                   # Default embedding model
EMBEDDING_PROVIDER=hash              # Options: openai, anthropic, hash
EMBEDDING_DIMENSIONS=384

# Database Configuration
DB_PATH=./data/reasoningbank.db
DB_MAX_CONNECTIONS=5
DB_TIMEOUT=5000

# Feature Flags
FEATURE_CACHING=true
FEATURE_METRICS=true
FEATURE_LOGGING=true
FEATURE_DEBUG=false

# Performance Configuration
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=60000
CACHE_SIZE=1000
CACHE_TTL=3600000

# PII Scrubbing (HIPAA Compliance)
PII_SCRUBBING_ENABLED=true
PII_SCRUB_EMAIL=true
PII_SCRUB_SSN=true
PII_SCRUB_API_KEY=true
PII_SCRUB_CREDIT_CARD=true

# ONNX (Local Inference)
ONNX_ENABLED=false
ONNX_MODEL_PATH=./models/phi-4.onnx
ONNX_EXECUTION_PROVIDERS=cpu

# QUIC Transport
QUIC_PORT=4433
QUIC_CERT_PATH=./certs/cert.pem
QUIC_KEY_PATH=./certs/key.pem
```

#### 5. Verify Installation

```bash
# Run build
pnpm build

# Run tests
pnpm test

# Check agent list
npx agentopia --list

# Test a simple agent
npx agentopia --agent coder --task "console.log('Hello World')"
```

### VS Code Setup

Install the recommended VS Code extensions:

```bash
# Open in VS Code
code .

# Install recommended extensions (automatic prompt)
# Or manually: Ctrl+Shift+P -> "Extensions: Show Recommended Extensions"
```

**Recommended Extensions:**

- **ESLint**: TypeScript/JavaScript linting
- **Prettier**: Code formatting
- **TypeScript and JavaScript Language Features**: Enhanced TS support
- **GitLens**: Git supercharged
- **Error Lens**: Inline error display
- **Thunder Client**: API testing
- **Docker**: Container management
- **TODO Highlight**: Track TODOs
- **Better Comments**: Enhanced comment styling

See [.vscode/extensions.json](../.vscode/extensions.json) for the complete list.

### Troubleshooting Installation

#### Issue: Node version too old

```bash
# Solution: Update Node.js
nvm install 20
nvm use 20
```

#### Issue: pnpm install fails

```bash
# Solution 1: Clear cache
pnpm store prune
pnpm install

# Solution 2: Use npm instead
rm pnpm-lock.yaml
npm install
```

#### Issue: Build fails with TypeScript errors

```bash
# Solution: Clean build
rm -rf dist
pnpm build:clean
pnpm build
```

#### Issue: Missing API keys

```bash
# Solution: Check .env file
cat .env | grep API_KEY

# Get free API keys:
# - Anthropic: https://console.anthropic.com/
# - OpenRouter: https://openrouter.ai/
```

## Project Structure

```
agent-control-plane/
├── src/                          # Source code
│   ├── config/                  # Configuration system
│   │   ├── index.ts            # Config service
│   │   ├── types.ts            # Config types
│   │   └── validator.ts        # Config validation
│   ├── errors/                  # Error handling system
│   │   ├── base.ts             # Base error class
│   │   ├── database.ts         # Database errors
│   │   ├── validation.ts       # Validation errors
│   │   ├── network.ts          # Network errors
│   │   ├── auth.ts             # Auth errors
│   │   ├── agent.ts            # Agent errors
│   │   └── configuration.ts    # Config errors
│   ├── reasoningbank/           # Learning memory system
│   │   ├── index.ts            # Main exports
│   │   └── utils/              # Utilities
│   │       ├── embeddings.ts   # Text embeddings
│   │       └── pii-scrubber.ts # PII scrubbing
│   └── security/                # Security features
│       ├── hipaa-encryption.ts # HIPAA encryption
│       ├── key-manager.ts      # Key management
│       └── migration.ts        # Security migrations
├── tests/                       # Test suite
│   ├── e2e/                    # End-to-end tests
│   └── utils/                  # Test utilities
│       ├── builders/           # Test data builders
│       ├── mocks/              # Mock objects
│       ├── helpers/            # Test helpers
│       └── fixtures/           # Test fixtures
├── docs/                        # Documentation
│   ├── CONFIGURATION.md        # Config guide
│   ├── error-handling.md       # Error system guide
│   ├── testing-utilities.md    # Testing guide
│   ├── E2E-TESTING.md          # E2E testing guide
│   └── tutorials/              # Interactive tutorials
├── .vscode/                     # VS Code settings
│   ├── settings.json           # Workspace settings
│   └── extensions.json         # Recommended extensions
└── package.json                 # Dependencies and scripts
```

### Key Directories

**`src/config/`** - Centralized configuration system with environment variable support

**`src/errors/`** - Typed error hierarchy with categorization and metadata

**`src/reasoningbank/`** - Self-learning memory system based on Google DeepMind research

**`src/security/`** - HIPAA-compliant encryption and security features

**`tests/utils/`** - Comprehensive testing framework with builders, mocks, and fixtures

## Core Concepts

### 1. Configuration System

Agentic Flow uses a centralized, type-safe configuration system:

```typescript
import { config } from './config/index.js';

// Get specific configuration
const embeddingConfig = config.get('embedding');
console.log(embeddingConfig.provider); // 'hash'

// Update configuration
config.set('embedding', {
  provider: 'openai',
  dimensions: 1536,
  model: 'text-embedding-3-large',
});

// Get all configuration
const allConfig = config.getAll();
```

**Key Features:**

- Environment variable support
- Automatic validation at startup
- Type-safe access
- Runtime updates

See [CONFIGURATION.md](./CONFIGURATION.md) for complete documentation.

### 2. Error Handling

Use typed errors for better error handling:

```typescript
import {
  ValidationError,
  DataNotFoundError,
  ApiRateLimitError,
  isBaseError,
} from './errors/index.js';

// Throw specific errors
throw new DataNotFoundError('User', userId);

// Type-safe error handling
try {
  await operation();
} catch (error) {
  if (isBaseError(error)) {
    console.error(`[${error.code}] ${error.message}`);
    console.error('Category:', error.category);
    console.error('Severity:', error.severity);
  }
}
```

**Error Categories:**

- Database (2000-2999)
- Validation (3000-3999)
- Network (4000-4999)
- Auth (5000-5999)
- Configuration (6000-6999)
- Agent (7000-7999)

See [error-handling.md](./error-handling.md) for complete error documentation.

### 3. ReasoningBank Memory System

ReasoningBank provides persistent learning memory:

```typescript
import * as reasoningbank from 'agentopia/reasoningbank';

// Initialize
await reasoningbank.initialize();

// Store memory
await reasoningbank.storeMemory('pattern_name', 'pattern_value', {
  namespace: 'api',
  metadata: { type: 'best-practice' },
});

// Query memories
const results = await reasoningbank.queryMemories('search query', {
  namespace: 'api',
  limit: 10,
  minScore: 0.8,
});
```

**Key Features:**

- Semantic search with embeddings
- Namespace isolation
- PII scrubbing (HIPAA compliant)
- Configurable embedding providers

### 4. Agent System

Agents are the core execution units:

```typescript
// CLI usage
npx agentopia --agent coder --task "Build a REST API"

// List all agents
npx agentopia --list

// Agent types:
// - coder: Implementation specialist
// - reviewer: Code review
// - tester: Testing specialist
// - planner: Task planning
// - researcher: Research and analysis
// + 61 more specialized agents
```

### 5. Multi-Model Router

Optimize costs across 100+ models:

```typescript
import { ModelRouter } from 'agentopia/router';

const router = new ModelRouter();

// Auto-select cheapest model
const response = await router.chat({
  model: 'auto',
  priority: 'cost',
  messages: [{ role: 'user', content: 'Your prompt' }],
});

console.log(`Cost: $${response.metadata.cost}`);
console.log(`Model: ${response.metadata.model}`);
```

**Cost Tiers:**

- Tier 1: Flagship ($3-15 per 1M tokens)
- Tier 2: Cost-Effective ($0.14-2.19 per 1M tokens)
- Tier 3: Balanced ($0.07-0.30 per 1M tokens)
- Tier 4: Budget ($0.055 per 1M tokens)
- Tier 5: Local/Privacy (FREE)

### 6. Agent Booster

Ultra-fast local code transformations (automatic):

```typescript
import { AgentBooster } from 'agentopia/agent-booster';

// Automatic detection on code editing tasks
// Achieves 352x speedup with $0 cost

// Performance:
// - Single edit: 352ms → 1ms (save 351ms)
// - 100 edits: 35s → 0.1s (save 34.9s)
// - 1000 files: 5.87min → 1s (save 5.85min)
```

## Your First Contribution

Let's walk through making your first contribution:

### Step 1: Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/agent-control-plane.git
cd agent-control-plane/agent-control-plane

# Add upstream remote
git remote add upstream https://github.com/tafyai/agent-control-plane.git
```

### Step 2: Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/my-awesome-feature
```

### Step 3: Make Changes

```bash
# Make your changes
# Follow the code style guide
# Add tests for new features
# Update documentation
```

### Step 4: Test Your Changes

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Build the project
pnpm build

# Test manually
npx agentopia --agent coder --task "Test my feature"
```

### Step 5: Commit and Push

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add awesome new feature

- Implement feature X
- Add tests for feature X
- Update documentation"

# Push to your fork
git push origin feature/my-awesome-feature
```

### Step 6: Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template
4. Submit for review

## Common Development Workflows

### Running Agents Locally

```bash
# Basic agent execution
npx agentopia --agent coder --task "Build a REST API"

# With streaming
npx agentopia --agent coder --task "Analyze code" --stream

# With specific model
npx agentopia --agent researcher --model "claude-sonnet-4-5-20250929" --task "Research AI trends"

# With optimization
npx agentopia --agent coder --task "Code cleanup" --optimize --priority cost
```

### Working with ReasoningBank

```bash
# Store pattern
npx agentdb memory store "best-practice" "Always validate input" --namespace "coding"

# Search patterns
npx agentdb memory search "validation" --namespace "coding" --limit 10

# View statistics
npx agentdb stats
```

### Testing Workflows

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/reasoningbank/embeddings.test.ts

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch
```

### Building and Publishing

```bash
# Clean build
rm -rf dist
pnpm build

# Build TypeScript only
pnpm build:ts

# Build WASM components (requires Rust)
pnpm build:wasm

# Validate before publishing
pnpm validate

# Publish to npm (maintainers only)
npm publish
```

## Testing Guide

### Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';
import { aUser, anAgent, createMockDatabase, assert, asyncUtils } from '../utils';

describe('Feature Name', () => {
  let db: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    db = createMockDatabase();
  });

  afterEach(() => {
    db.clearAll();
  });

  it('should do something', async () => {
    // Arrange
    const user = aUser().asAdmin().build();
    db.insert('users', user);

    // Act
    const result = await performAction(user);

    // Assert
    assert.defined(result);
    assert.hasProperty(result, 'success');
  });
});
```

### Test Data Builders

Use fluent builders for test data:

```typescript
import { aUser, anAgent, aTask, aMemory, aVector } from '../utils';

// Create users
const admin = aUser().asAdmin().build();
const guest = aUser().asGuest().build();

// Create agents
const coder = anAgent().asCoder().asRunning().build();
const tester = anAgent().asTester().build();

// Create tasks
const task = aTask().asCodingTask().assignedTo(coder.id).withPriority('high').build();
```

### Mock Utilities

```typescript
import {
  createMockDatabase,
  createMockMCPServer,
  createMockAPIClient,
  createMockVectorStore,
} from '../utils';

// Mock database
const db = createMockDatabase();
db.insert('users', user);
const found = db.findById('users', user.id);

// Mock MCP server
const mcpServer = createMockMCPServer();
await mcpServer.connect();
await mcpServer.callTool('custom_tool', params);

// Mock vector store
const vectorStore = createMockVectorStore();
await vectorStore.insert('vec-1', embedding, metadata);
const results = await vectorStore.search(queryVector, { limit: 10 });
```

See [testing-utilities.md](./testing-utilities.md) for comprehensive testing documentation.

## Debugging Tips

### Enable Debug Logging

```bash
# Set debug flag
export FEATURE_DEBUG=true

# Run with verbose logging
npx agentopia --agent coder --task "debug task" --verbose
```

### Debug in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Agent",
      "program": "${workspaceFolder}/dist/index.js",
      "args": ["--agent", "coder", "--task", "test task"],
      "env": {
        "FEATURE_DEBUG": "true",
        "ANTHROPIC_API_KEY": "${env:ANTHROPIC_API_KEY}"
      },
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Common Debugging Scenarios

**1. Configuration Issues:**

```typescript
import { config } from './config/index.js';

// Check current config
console.log('Config:', JSON.stringify(config.getAll(), null, 2));

// Verify specific setting
const embeddingConfig = config.get('embedding');
console.log('Embedding provider:', embeddingConfig.provider);
```

**2. Error Investigation:**

```typescript
import { isBaseError, formatErrorForLogging } from './errors/index.js';

try {
  await operation();
} catch (error) {
  if (isBaseError(error)) {
    console.error('Detailed error:', formatErrorForLogging(error));
    console.error('Error chain:', error.cause);
  }
}
```

**3. Memory System Debugging:**

```bash
# Check database
sqlite3 ./data/reasoningbank.db "SELECT * FROM memories LIMIT 10;"

# View statistics
npx agentdb stats

# Check memory by namespace
npx agentdb memory search "" --namespace "your-namespace"
```

**4. Performance Profiling:**

```typescript
import { asyncUtils } from '../tests/utils';

const { result, duration } = await asyncUtils.measureTime(async () => expensiveOperation());

console.log(`Operation took ${duration}ms`);
```

See [DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md) for comprehensive debugging documentation.

## Performance Optimization

### Benchmarking

```typescript
// Use built-in benchmarking
const benchmark = require('./benchmarks/runner');

await benchmark.run(
  'operation-name',
  async () => {
    await yourOperation();
  },
  {
    iterations: 100,
    warmup: 10,
  }
);
```

### Caching

```typescript
// Enable caching
config.set('features', {
  enableCaching: true,
  enableMetrics: true,
  enableLogging: true,
  enableDebug: false,
});

// Cache configuration
config.set('performance', {
  cacheSize: 1000,
  cacheTTL: 3600000, // 1 hour
});
```

### Concurrency

```bash
# Limit concurrent requests
export MAX_CONCURRENT_REQUESTS=10

# Adjust timeouts
export REQUEST_TIMEOUT=60000
```

### Database Optimization

```bash
# Increase connection pool
export DB_MAX_CONNECTIONS=10

# Adjust timeout
export DB_TIMEOUT=5000
```

### Agent Booster

Agent Booster automatically optimizes code editing tasks:

```bash
# Automatic optimization (no configuration needed)
npx agentopia --agent coder --task "Refactor codebase"

# Performance gains:
# - 352x faster than API calls
# - $0 cost (vs $0.01+ per edit)
# - 1ms latency (vs 352ms)
```

## Resources

### Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [Common Workflows](./COMMON_WORKFLOWS.md) - Step-by-step workflows
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines
- [Debugging Guide](./DEBUGGING_GUIDE.md) - Troubleshooting reference
- [Configuration Guide](./CONFIGURATION.md) - Config system
- [Error Handling Guide](./error-handling.md) - Error system
- [Testing Guide](./testing-utilities.md) - Testing framework

### Interactive Tutorials

- [Build Your First Agent](./tutorials/01-build-first-agent.md)
- [Create a Swarm Workflow](./tutorials/02-swarm-workflow.md)
- [Add a New MCP Tool](./tutorials/03-mcp-tool.md)
- [Optimize Performance](./tutorials/04-performance-optimization.md)
- [ReasoningBank Memory System](./tutorials/05-reasoningbank-tutorial.md)

### External Resources

- [Main README](../../README.md) - Project overview
- [GitHub Repository](https://github.com/tafyai/agent-control-plane)
- [NPM Package](https://www.npmjs.com/package/agentopia)
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)

### Community

- [GitHub Issues](https://github.com/tafyai/agent-control-plane/issues) - Bug reports
- [GitHub Discussions](https://github.com/tafyai/agent-control-plane/discussions) - Questions and ideas
- [Contributing](./CONTRIBUTING.md) - How to contribute

## Next Steps

Now that you're set up:

1. **Explore the codebase** - Read through the source code
2. **Run the tutorials** - Complete the interactive tutorials
3. **Try building something** - Create a custom agent or workflow
4. **Join the community** - Participate in discussions
5. **Contribute** - Make your first pull request

Welcome to the Agentic Flow community!
