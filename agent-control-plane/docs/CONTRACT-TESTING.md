# Contract Testing Documentation

## Overview

This document describes the contract testing strategy for Agentic Flow's 213 MCP tools, API endpoints, and inter-service communication. Contract testing ensures that all interfaces remain compatible as the system evolves.

## Table of Contents

1. [Contract Testing Strategy](#contract-testing-strategy)
2. [Tool Categories](#tool-categories)
3. [Schema Structure](#schema-structure)
4. [Testing Framework](#testing-framework)
5. [Contract Versioning](#contract-versioning)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

## Contract Testing Strategy

### Consumer-Driven Contracts

We use **Pact** for consumer-driven contract testing, which means:

- **Consumers** define the contract expectations
- **Providers** verify they meet those expectations
- Contracts are version-controlled and validated in CI/CD
- Breaking changes are detected before deployment

### Coverage Targets

| Category      | Total | Target | Minimum |
| ------------- | ----- | ------ | ------- |
| MCP Tools     | 213   | 100%   | 95%     |
| API Endpoints | 50+   | 100%   | 90%     |
| Inter-Service | 15+   | 100%   | 85%     |

## Tool Categories

### 1. Swarm Coordination (35 tools)

- `swarm_init` - Initialize swarm topology
- `agent_spawn` - Spawn specialized agents
- `task_orchestrate` - Orchestrate parallel tasks
- `swarm_status` - Monitor swarm health
- And 31 more...

### 2. Memory Management (28 tools)

- `memory_store` - Store key-value pairs
- `memory_retrieve` - Retrieve stored values
- `memory_usage` - Get memory statistics
- And 25 more...

### 3. Neural Networks (22 tools)

- `neural_train` - Train neural models
- `neural_patterns` - Extract learned patterns
- `neural_status` - Monitor neural models
- And 19 more...

### 4. GitHub Integration (45 tools)

- `repo_analyze` - Analyze repository structure
- `pr_enhance` - Enhance pull requests
- `issue_triage` - Triage issues automatically
- And 42 more...

### 5. Monitoring (33 tools)

- `agent_list` - List active agents
- `agent_metrics` - Get agent performance metrics
- `task_status` - Check task progress
- And 30 more...

### 6. AgentDB Vector Operations (25 tools)

- `vector_store` - Store embeddings
- `vector_search` - Semantic similarity search
- `collection_create` - Create vector collections
- And 22 more...

### 7. System & Utilities (25 tools)

- `benchmark_run` - Run performance benchmarks
- `features_detect` - Detect available features
- `health_check` - System health verification
- And 22 more...

## Schema Structure

### Base Tool Schema

All MCP tools inherit from the base schema:

```json
{
  "name": "tool_name",
  "description": "Tool description (10-500 chars)",
  "inputSchema": {
    "type": "object",
    "properties": { ... },
    "required": [ ... ]
  },
  "outputSchema": {
    "type": "object",
    "properties": { ... }
  },
  "errorSchema": {
    "type": "object",
    "required": ["error", "message"],
    "properties": { ... }
  },
  "version": "1.10.3"
}
```

### Naming Conventions

- **Tool names**: `snake_case` (enforced by regex `^[a-z_][a-z0-9_]*$`)
- **Versions**: Semantic versioning `MAJOR.MINOR.PATCH`
- **Collections**: Alphanumeric with hyphens/underscores

### Standard Output Fields

Every tool output includes:

```typescript
{
  success: boolean; // Operation success status
  timestamp: string; // ISO 8601 timestamp
  // ... tool-specific fields
}
```

### Standard Error Format

All errors follow this structure:

```typescript
{
  error: string;         // Error type
  message: string;       // Human-readable message
  code?: string;         // Machine-readable code
  details?: object;      // Additional context
  timestamp: string;     // ISO 8601 timestamp
}
```

## Testing Framework

### Setup

```bash
npm install --save-dev \
  @pact-foundation/pact \
  ajv ajv-formats \
  @jest/globals
```

### Running Tests

```bash
# Run all contract tests
npm run test:contracts

# Run specific category
npm run test:contracts -- mcp-contracts
npm run test:contracts -- api-contracts
npm run test:contracts -- service-contracts

# Generate contract specifications
npm run contracts:generate

# Validate all contracts
npm run contracts:validate
```

### Test Structure

```
tests/contracts/
├── contract-test.config.ts      # Configuration
├── contract-generator.ts        # Auto-generation
├── mcp-contracts.test.ts        # MCP tool tests
├── api-contracts.test.ts        # API endpoint tests
├── service-contracts.test.ts    # Inter-service tests
├── schemas/                     # JSON schemas
│   ├── mcp-tool-base.schema.json
│   ├── swarm-tools.schema.json
│   ├── memory-tools.schema.json
│   ├── neural-tools.schema.json
│   ├── github-tools.schema.json
│   ├── monitoring-tools.schema.json
│   └── agentdb-tools.schema.json
└── pacts/                       # Generated Pact files
    ├── swarm_init.pact.json
    ├── agent_spawn.pact.json
    └── ... (213 total)
```

## Contract Versioning

### Semantic Versioning

We follow semantic versioning for all contracts:

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible additions)
- **PATCH**: Bug fixes (backward-compatible fixes)

### Version Compatibility

```typescript
// Request with version negotiation
headers: {
  'Accept-Version': '1.10.x'  // Accept any 1.10.* version
}

// Response with actual version
headers: {
  'API-Version': '1.10.3',
  'Deprecation': 'false'
}
```

### Breaking Change Policy

**Provider-First Strategy**:

1. Provider implements new version
2. Provider supports both old and new versions (deprecation period)
3. Consumers migrate at their own pace
4. Old version sunset after 90 days

### Deprecation Process

```typescript
// Deprecated endpoint response
{
  version: '1.0.0',
  supported: true,
  deprecated: true,
  sunsetDate: '2025-03-01',
  upgradeUrl: 'https://docs.agent-control-plane.io/upgrade',
  migrationGuide: 'See upgrade URL for details'
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Contract Testing

on: [pull_request, push]

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Generate contracts
        run: npm run contracts:generate

      - name: Run contract tests
        run: npm run test:contracts

      - name: Validate contracts
        run: npm run contracts:validate

      - name: Upload Pact files
        run: npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

      - name: Verify provider contracts
        run: npm run pact:verify
```

### Pre-commit Hooks

```bash
# Install pre-commit hook
npx husky add .husky/pre-commit "npm run contracts:validate"
```

### Contract Validation Gates

Pull requests MUST:

- ✅ Pass all contract tests
- ✅ Maintain schema compatibility
- ✅ Update contract versions appropriately
- ✅ Include migration guide for breaking changes

## Best Practices

### 1. Schema Design

**DO:**

- Use strict typing with JSON Schema
- Include examples in schemas
- Document all fields with descriptions
- Validate both input and output

**DON'T:**

- Use loose typing (`type: 'object'` without properties)
- Skip required field validation
- Change contracts without versioning
- Remove fields without deprecation

### 2. Contract Evolution

**Adding Fields (Non-breaking)**:

```typescript
// Old schema
{ name: string }

// New schema (backward compatible)
{
  name: string,
  email?: string  // Optional field
}
```

**Changing Fields (Breaking)**:

```typescript
// Old schema (v1.0.0)
{
  status: string;
}

// New schema (v2.0.0) - REQUIRES VERSION BUMP
{
  status: 'active' | 'inactive' | 'pending';
}
```

### 3. Testing Strategies

**Unit Tests**: Test individual tool contracts

```typescript
it('should validate swarm_init input', () => {
  const validate = ajv.compile(schema);
  expect(validate(validInput)).toBe(true);
});
```

**Integration Tests**: Test tool interactions

```typescript
it('should initialize swarm and spawn agents', async () => {
  const swarm = await swarmInit({ topology: 'mesh' });
  const agent = await agentSpawn({ type: 'coder' });
  expect(agent.swarmId).toBe(swarm.swarmId);
});
```

**Contract Tests**: Test provider compliance

```typescript
it('should establish Pact contract', async () => {
  await provider.addInteraction({
    state: 'swarm ready',
    uponReceiving: 'init request',
    withRequest: { ... },
    willRespondWith: { ... }
  });
  await provider.verify();
});
```

### 4. Error Handling

Always test error scenarios:

```typescript
describe('Error Handling', () => {
  it('should handle invalid input', async () => {
    const result = await tool({ invalid: 'input' });
    expect(result.error).toBeDefined();
    expect(result.message).toContain('Validation');
  });

  it('should handle timeout', async () => {
    const result = await tool({ timeout: 1 });
    expect(result.error).toBe('TimeoutError');
  });

  it('should handle service unavailable', async () => {
    const result = await tool({ endpoint: 'down' });
    expect(result.error).toBe('ServiceUnavailable');
  });
});
```

### 5. Performance Testing

Include performance contracts:

```typescript
it('should complete within SLA', async () => {
  const start = Date.now();
  await tool({ query: 'test' });
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100); // 100ms SLA
});
```

## Contract Coverage Report

Generate coverage reports:

```bash
npm run contracts:coverage
```

Output:

```
Contract Testing Coverage Report
================================

MCP Tools:        213/213 (100%)
API Endpoints:     52/52  (100%)
Inter-Service:     15/15  (100%)

Total Coverage:   280/280 (100%)

Category Breakdown:
  Swarm:           35/35  (100%)
  Memory:          28/28  (100%)
  Neural:          22/22  (100%)
  GitHub:          45/45  (100%)
  Monitoring:      33/33  (100%)
  AgentDB:         25/25  (100%)
  System:          25/25  (100%)
```

## Troubleshooting

### Common Issues

**Schema Validation Failures**:

```bash
# Check schema syntax
npm run schemas:validate

# Generate fresh schemas
npm run contracts:generate
```

**Pact Verification Failures**:

```bash
# View detailed logs
cat tests/contracts/logs/pact.log

# Re-run with verbose output
npm run test:contracts -- --verbose
```

**Version Conflicts**:

```bash
# Check version compatibility
npm run contracts:check-versions

# Update consumer contracts
npm run contracts:update-consumer
```

## Resources

- [Pact Documentation](https://docs.pact.io/)
- [JSON Schema Guide](https://json-schema.org/learn/)
- [Semantic Versioning](https://semver.org/)
- [API Contract Testing Best Practices](https://martinfowler.com/articles/contract-testing.html)

## Support

For contract testing issues:

1. Check logs in `tests/contracts/logs/`
2. Validate schemas with `npm run schemas:validate`
3. Review contract diffs with `npm run contracts:diff`
4. Contact maintainers at https://github.com/Aktoh-Cyber/agent-control-plane/issues

---

**Last Updated**: 2025-12-08
**Contract Version**: 1.10.3
**Coverage Target**: 100%
