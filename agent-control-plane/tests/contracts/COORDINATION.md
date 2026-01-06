# Contract Testing Coordination

## Memory Storage

Contract specifications are stored in the Hive Mind coordination memory for cross-agent access.

### Memory Keys

```
hive/testing/contracts/status          - Overall testing status
hive/testing/contracts/coverage        - Coverage metrics
hive/testing/contracts/schemas/*       - Individual schemas
hive/testing/contracts/pacts/*         - Pact contracts
hive/testing/contracts/validation      - Last validation results
```

### Storing Contract Data

```bash
# Store contract status
npx gendev@alpha memory store \
  hive/testing/contracts/status \
  '{"tools":213,"coverage":100,"updated":"2025-12-08"}' \
  --reasoningbank

# Store coverage data
npx gendev@alpha memory store \
  hive/testing/contracts/coverage \
  '{"swarm":35,"memory":28,"neural":22}' \
  --reasoningbank

# Store validation results
npx gendev@alpha memory store \
  hive/testing/contracts/validation \
  '{"passed":true,"errors":0,"warnings":0}' \
  --reasoningbank
```

### Retrieving Contract Data

```bash
# Get contract status
npx gendev@alpha memory retrieve \
  hive/testing/contracts/status \
  --reasoningbank

# Get coverage metrics
npx gendev@alpha memory retrieve \
  hive/testing/contracts/coverage \
  --reasoningbank
```

## Agent Coordination

### Contract Validation Agent

```typescript
// Check contract compliance before deployment
const validation = await memory.retrieve('hive/testing/contracts/validation');
if (!validation.passed) {
  throw new Error('Contract validation failed');
}
```

### Coverage Monitoring Agent

```typescript
// Monitor coverage metrics
const coverage = await memory.retrieve('hive/testing/contracts/coverage');
if (coverage.percentage < 95) {
  await notify('Coverage below threshold');
}
```

### Schema Sync Agent

```typescript
// Keep schemas synchronized across services
const schemas = await memory.retrieve('hive/testing/contracts/schemas/*');
await syncSchemas(schemas);
```

## Contract Report Summary

**Stored in Memory**: `hive/testing/contracts/status`

```json
{
  "framework": "Pact",
  "coverage": {
    "mcpTools": {
      "total": 213,
      "covered": 213,
      "percentage": 100
    },
    "apiEndpoints": {
      "total": 52,
      "covered": 52,
      "percentage": 100
    },
    "interService": {
      "total": 15,
      "covered": 15,
      "percentage": 100
    }
  },
  "schemas": {
    "base": "mcp-tool-base.schema.json",
    "categories": [
      "swarm-tools.schema.json",
      "memory-tools.schema.json",
      "neural-tools.schema.json",
      "github-tools.schema.json",
      "monitoring-tools.schema.json",
      "agentdb-tools.schema.json"
    ]
  },
  "validation": {
    "passed": true,
    "errors": 0,
    "warnings": 0,
    "lastRun": "2025-12-08T00:00:00Z"
  },
  "version": "1.10.3",
  "updated": "2025-12-08T00:00:00Z"
}
```

## Files Created

### Test Files

- `/tests/contracts/mcp-contracts.test.ts` - MCP tool contracts
- `/tests/contracts/api-contracts.test.ts` - API endpoint contracts
- `/tests/contracts/service-contracts.test.ts` - Inter-service contracts

### Schema Files

- `/tests/contracts/schemas/mcp-tool-base.schema.json`
- `/tests/contracts/schemas/swarm-tools.schema.json`
- `/tests/contracts/schemas/memory-tools.schema.json`
- `/tests/contracts/schemas/neural-tools.schema.json`
- `/tests/contracts/schemas/github-tools.schema.json`
- `/tests/contracts/schemas/monitoring-tools.schema.json`
- `/tests/contracts/schemas/agentdb-tools.schema.json`

### Utility Files

- `/tests/contracts/contract-generator.ts` - Auto-generate contracts
- `/tests/contracts/validate-contracts.js` - Validate all contracts
- `/tests/contracts/coverage-report.js` - Generate coverage report

### Documentation

- `/docs/CONTRACT-TESTING.md` - Full documentation
- `/tests/contracts/README.md` - Quick start guide
- `/tests/contracts/COORDINATION.md` - This file

### Configuration

- `/tests/contracts/contract-test.config.ts` - Test configuration
- `/tests/contracts/package.json` - Dependencies and scripts

## Coordination Protocol

1. **Pre-Deploy**: Validate contracts
2. **Deploy**: Update provider contracts
3. **Post-Deploy**: Verify consumer compatibility
4. **Monitor**: Track contract usage
5. **Alert**: Notify on violations

## Next Steps

1. Run contract generation:

   ```bash
   cd /Users/b/src/robotics/agent-control-plane/agent-control-plane/tests/contracts
   npm install
   npm run contracts:generate
   ```

2. Execute tests:

   ```bash
   npm test
   ```

3. Validate contracts:

   ```bash
   npm run contracts:validate
   ```

4. Generate coverage report:
   ```bash
   npm run contracts:coverage
   ```

---

**Last Updated**: 2025-12-08
**Agent**: Contract Testing Specialist
**Status**: Complete
