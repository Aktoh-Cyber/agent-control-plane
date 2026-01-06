# Contract Testing Suite

Comprehensive contract tests for Agentic Flow's 213 MCP tools, 52 API endpoints, and 15 inter-service contracts.

## Quick Start

```bash
# Install dependencies
npm install

# Generate contract specifications
npm run contracts:generate

# Run all contract tests
npm test

# Validate all contracts
npm run contracts:validate

# Generate coverage report
npm run contracts:coverage
```

## What's Included

### Test Files

- **mcp-contracts.test.ts** - Tests for all 213 MCP tools
- **api-contracts.test.ts** - Tests for REST API endpoints
- **service-contracts.test.ts** - Tests for inter-service communication

### Schemas (7 categories)

1. **mcp-tool-base.schema.json** - Base schema for all tools
2. **swarm-tools.schema.json** - Swarm coordination (35 tools)
3. **memory-tools.schema.json** - Memory management (28 tools)
4. **neural-tools.schema.json** - Neural networks (22 tools)
5. **github-tools.schema.json** - GitHub integration (45 tools)
6. **monitoring-tools.schema.json** - Monitoring (33 tools)
7. **agentdb-tools.schema.json** - Vector operations (25 tools)

### Utilities

- **contract-generator.ts** - Auto-generates contracts from tool definitions
- **validate-contracts.js** - Validates all contract specifications
- **coverage-report.js** - Generates detailed coverage report

## Running Tests

### All Tests

```bash
npm test
```

### Specific Category

```bash
npm run test:mcp          # MCP tool contracts
npm run test:api          # API endpoint contracts
npm run test:service      # Inter-service contracts
```

### Watch Mode

```bash
npm run test:watch
```

### With Coverage

```bash
npm run test:coverage
```

## Contract Validation

### Validate All Contracts

```bash
npm run contracts:validate
```

Output:

```
Validating JSON Schemas...

✓ mcp-tool-base.schema.json
✓ swarm-tools.schema.json
✓ memory-tools.schema.json
✓ neural-tools.schema.json
✓ github-tools.schema.json
✓ monitoring-tools.schema.json
✓ agentdb-tools.schema.json

Validated 7 schemas

Validating Pact files...

✓ swarm_init.pact.json (1 interactions)
✓ agent_spawn.pact.json (1 interactions)
...

✓ All validations passed!
```

## Coverage Report

Generate detailed coverage report:

```bash
npm run contracts:coverage
```

Output:

```
============================================================
  Contract Testing Coverage Report
============================================================

Overall Coverage:
  ████████████████████████████████████████ 100.0%
  213/213 tools covered

Category Breakdown:

  ✓ Swarm Coordination        35/35 (100.0%)
     ██████████████████████████████

  ✓ Memory Management         28/28 (100.0%)
     ██████████████████████████████

  ✓ Neural Networks           22/22 (100.0%)
     ██████████████████████████████

  ✓ GitHub Integration        45/45 (100.0%)
     ██████████████████████████████

  ✓ Monitoring & Status       33/33 (100.0%)
     ██████████████████████████████

  ✓ AgentDB Vector Ops        25/25 (100.0%)
     ██████████████████████████████

  ✓ System & Utilities        25/25 (100.0%)
     ██████████████████████████████

MCP Tools:
  ████████████████████████████████████████ 100.0%
  213/213 tools

API Endpoints:
  ████████████████████████████████████████ 100.0%
  52/52 endpoints

Inter-Service Contracts:
  ████████████████████████████████████████ 100.0%
  15/15 contracts

============================================================
Recommendations:

  ✓ All categories meet coverage targets!

============================================================
```

## Contract Structure

### MCP Tool Contract

```typescript
{
  tool: 'swarm_init',
  version: '1.10.3',
  inputSchema: {
    type: 'object',
    required: ['topology'],
    properties: {
      topology: {
        type: 'string',
        enum: ['mesh', 'hierarchical', 'ring', 'star']
      },
      maxAgents: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 8
      }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['success', 'topology', 'timestamp'],
    properties: {
      success: { type: 'boolean' },
      topology: { type: 'string' },
      swarmId: { type: 'string', format: 'uuid' },
      timestamp: { type: 'string', format: 'date-time' }
    }
  },
  errorSchema: {
    type: 'object',
    required: ['error', 'message'],
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      code: { type: 'string' }
    }
  }
}
```

### Pact Contract

```json
{
  "consumer": {
    "name": "agentic-flow-consumer"
  },
  "provider": {
    "name": "mcp-server-provider"
  },
  "interactions": [
    {
      "description": "Execute swarm_init",
      "providerState": "swarm_init is available",
      "request": {
        "method": "POST",
        "path": "/mcp/swarm_init",
        "body": {
          "topology": "mesh",
          "maxAgents": 8
        }
      },
      "response": {
        "status": 200,
        "body": {
          "success": true,
          "topology": "mesh",
          "timestamp": "2025-12-08T00:00:00.000Z"
        }
      }
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Contract Tests
  run: npm run test:contracts

- name: Validate Contracts
  run: npm run contracts:validate

- name: Check Coverage
  run: npm run contracts:coverage
```

### Pre-commit Hook

```bash
npx husky add .husky/pre-commit "npm run contracts:validate"
```

## Versioning Strategy

### Semantic Versioning

- **MAJOR**: Breaking changes (1.x.x → 2.0.0)
- **MINOR**: New features (1.0.x → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

### Breaking Change Process

1. Bump MAJOR version
2. Implement new version alongside old
3. Deprecate old version (90 day period)
4. Remove old version after sunset

### Version Negotiation

```typescript
// Client requests version
headers: { 'Accept-Version': '1.10.x' }

// Server responds with actual version
headers: {
  'API-Version': '1.10.3',
  'Deprecation': 'false'
}
```

## Best Practices

### 1. Test Input Validation

```typescript
it('should validate required fields', () => {
  const invalid = {
    /* missing required field */
  };
  expect(validate(invalid)).toBe(false);
});
```

### 2. Test Output Format

```typescript
it('should include standard fields', () => {
  expect(output).toHaveProperty('success');
  expect(output).toHaveProperty('timestamp');
});
```

### 3. Test Error Handling

```typescript
it('should return standard error format', () => {
  expect(error).toHaveProperty('error');
  expect(error).toHaveProperty('message');
});
```

### 4. Test Edge Cases

```typescript
it('should handle boundary values', () => {
  expect(validate({ maxAgents: 1 })).toBe(true);
  expect(validate({ maxAgents: 100 })).toBe(true);
  expect(validate({ maxAgents: 0 })).toBe(false);
});
```

## Troubleshooting

### Tests Failing

```bash
# Check detailed logs
cat logs/pact.log

# Run with verbose output
npm test -- --verbose
```

### Schema Validation Errors

```bash
# Validate individual schema
ajv validate -s schemas/swarm-tools.schema.json

# Re-generate contracts
npm run contracts:generate
```

### Coverage Below Target

```bash
# Identify missing contracts
npm run contracts:coverage

# Generate missing contracts
npm run contracts:generate
```

## Documentation

- [Full Documentation](../../docs/CONTRACT-TESTING.md)
- [Pact Documentation](https://docs.pact.io/)
- [JSON Schema Guide](https://json-schema.org/learn/)

## Support

For issues or questions:

- GitHub Issues: https://github.com/ruvnet/agentic-flow/issues
- Documentation: https://github.com/ruvnet/agentic-flow/docs

---

**Last Updated**: 2025-12-08
**Contract Version**: 1.10.3
**Test Coverage**: 100%
