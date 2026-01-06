# E2E Test Suite

Comprehensive end-to-end testing for agent swarm workflows, multi-agent coordination, and cross-service integration.

## Quick Start

```bash
# Install dependencies
npm install
npx playwright install --with-deps

# Run all E2E tests
npm run test:e2e

# Run specific test category
npx playwright test --project=swarm-workflows
npx playwright test --project=coordination
npx playwright test --project=integration

# Run with UI (for debugging)
npx playwright test --ui
```

## Directory Structure

```
tests/e2e/
├── setup.ts                    # Test environment setup and fixtures
├── swarm-workflows.test.ts     # Swarm workflow tests (10 scenarios)
├── coordination.test.ts        # Multi-agent coordination tests (10 scenarios)
├── integration.test.ts         # Cross-service integration tests (6 scenarios)
├── playwright.config.ts        # Playwright configuration
├── global-setup.ts            # Global test setup
├── global-teardown.ts         # Global test cleanup
├── fixtures/
│   ├── index.ts              # Fixture exports
│   └── test-data.ts          # Reusable test data
└── helpers/
    ├── index.ts              # Helper exports
    ├── assertions.ts         # Custom assertions
    └── test-utils.ts         # Utility functions
```

## Test Coverage

**26+ comprehensive test scenarios:**

### Swarm Workflows (10)

- Single agent execution
- Multi-agent parallel (3-5 agents)
- Sequential pipeline workflows
- Conditional routing (if-then)
- Error handling and retry
- Network failure recovery
- Agent crash handling
- Timeout management

### Multi-Agent Coordination (10)

- Hierarchical (queen + workers)
- Mesh (peer-to-peer)
- Dynamic scaling
- Memory sharing via AgentDB
- Task distribution
- Load balancing
- MCP communication
- Consensus protocols

### Cross-Service Integration (6)

- AgentDB + Swarm coordination
- MCP server + client
- ReasoningBank learning
- QUIC transport
- File system operations
- Full-stack development workflow

## Documentation

See [E2E-TESTING.md](../../docs/E2E-TESTING.md) for comprehensive documentation including:

- Detailed test scenarios
- Setup instructions
- Running tests
- Writing new tests
- Troubleshooting
- CI/CD integration

## Scripts

```bash
# Run E2E tests and store results in memory
./scripts/run-e2e-tests.sh

# Run specific test file
npx playwright test swarm-workflows.test.ts

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## CI/CD

E2E tests run automatically on:

- Push to main/develop branches
- Pull requests
- Daily scheduled runs
- Manual workflow dispatch

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use provided fixtures and helpers
3. Add comprehensive assertions
4. Update documentation
5. Test locally before committing

## Support

- GitHub Issues: https://github.com/tafyai/agent-control-plane/issues
- Documentation: [E2E-TESTING.md](../../docs/E2E-TESTING.md)
