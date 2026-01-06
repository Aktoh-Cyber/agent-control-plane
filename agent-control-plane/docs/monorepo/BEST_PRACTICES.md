# Monorepo Best Practices for Agentic-Flow

## Overview

This guide documents best practices for working with the Nx-powered monorepo, optimizing developer workflows, and maintaining code quality across 27 packages.

## Daily Workflows

### Starting Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (if package.json changed)
pnpm install

# 3. Build affected packages (faster than full build)
nx affected --target=build

# 4. Run affected tests
nx affected --target=test
```

### Working on a Feature

```bash
# 1. Create feature branch
git checkout -b feature/add-new-agent

# 2. Identify affected package
# Example: Adding new agent to packages/agents

# 3. Build only what you need
nx build agents

# 4. Watch mode for development
nx build agents --watch

# 5. Run tests in watch mode
nx test agents --watch

# 6. Lint your changes
nx affected --target=lint
```

### Before Committing

```bash
# 1. Build affected packages
nx affected --target=build

# 2. Run affected tests
nx affected --target=test

# 3. Lint affected packages
nx affected --target=lint

# 4. Type check
nx run-many --target=typecheck --all

# 5. Check dependency graph
nx graph

# 6. Commit
git add .
git commit -m "feat(agents): add new coordination agent"
```

## Package Development

### Creating a New Package

```bash
# Use Nx generator for consistency
nx g @nx/js:library my-package \
  --directory=packages/my-package \
  --importPath=@agent-control-plane/my-package \
  --publishable \
  --buildable

# This creates:
# - packages/my-package/
#   - src/index.ts
#   - package.json
#   - project.json
#   - tsconfig.json
#   - tsconfig.lib.json
#   - README.md
```

### Package Structure Best Practices

```
packages/my-package/
├── src/
│   ├── index.ts          # Public API (exports)
│   ├── lib/              # Internal implementation
│   │   ├── feature-a.ts
│   │   └── feature-b.ts
│   ├── types/            # Package-specific types
│   │   └── index.ts
│   └── __tests__/        # Tests
│       ├── feature-a.test.ts
│       └── feature-b.test.ts
├── package.json          # Package metadata
├── project.json          # Nx configuration
├── tsconfig.json         # Base TS config
├── tsconfig.lib.json     # Library-specific TS config
└── README.md             # Package documentation
```

### Exports Pattern

**packages/my-package/src/index.ts:**

```typescript
// ✅ Good: Explicit exports
export { FeatureA } from './lib/feature-a.js';
export { FeatureB } from './lib/feature-b.js';
export type { FeatureAOptions, FeatureBConfig } from './types/index.js';

// ❌ Bad: Re-exporting everything
export * from './lib/feature-a.js';
```

### Dependencies

**Add workspace dependencies:**

```bash
cd packages/my-package
pnpm add @agent-control-plane/core@workspace:*
pnpm add @agent-control-plane/types@workspace:*
```

**Add external dependencies:**

```bash
cd packages/my-package
pnpm add axios
pnpm add -D @types/node
```

**packages/my-package/package.json:**

```json
{
  "dependencies": {
    "@agent-control-plane/core": "workspace:*",
    "@agent-control-plane/types": "workspace:*",
    "axios": "^1.12.2"
  },
  "devDependencies": {
    "@types/node": "^20.19.26"
  }
}
```

## Dependency Management

### Module Boundaries

**Enforce clean architecture:**

```json
// .eslintrc.json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          {
            "sourceTag": "scope:core",
            "onlyDependOnLibsWithTags": ["scope:core", "scope:types"]
          },
          {
            "sourceTag": "scope:feature",
            "onlyDependOnLibsWithTags": ["scope:core", "scope:types", "scope:utils"]
          }
        ]
      }
    ]
  }
}
```

**Tag packages in project.json:**

```json
{
  "tags": ["scope:core", "type:library"]
}
```

### Avoiding Circular Dependencies

**❌ Bad: Circular dependency**

```
packages/reasoningbank → packages/router
packages/router → packages/reasoningbank
```

**✅ Good: Extract shared code**

```
packages/reasoningbank → packages/types
packages/router → packages/types
```

**Detection:**

```bash
# Visualize dependency graph
nx graph

# Look for circular arrows in the graph
```

**Resolution strategies:**

1. **Extract shared interfaces** to `types` package
2. **Use dependency injection** instead of direct imports
3. **Create adapter layer** between packages
4. **Split package** into smaller, focused packages

### Dependency Versioning

**Sync versions across workspace:**

```bash
# Update all workspace packages to use same external dep version
pnpm add -D -w typescript@5.6.3

# Update specific external dep in all packages
pnpm -r update axios@latest
```

## Build Optimization

### Incremental Builds

```bash
# ✅ Good: Build only what changed
nx affected --target=build

# ❌ Wasteful: Build everything
nx run-many --target=build --all
```

### Parallel Execution

```bash
# Build 3 packages in parallel (adjust based on CPU cores)
nx run-many --target=build --all --parallel=3

# Maximum parallelization (use all cores)
nx run-many --target=build --all --parallel=$(nproc)
```

### Caching

**Maximize cache hits:**

1. **Stable inputs**: Don't include timestamps in source files
2. **Deterministic outputs**: Ensure builds produce same output for same input
3. **Fine-grained tasks**: Split large tasks into smaller cacheable units

**Check cache effectiveness:**

```bash
# First build (cache miss)
time nx build core

# Second build (cache hit) - should be instant
time nx build core

# Clear cache to test
rm -rf .nx/cache
```

**Configure cache in nx.json:**

```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["production", "^production"],
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

### Task Dependencies

**Automatic dependency order:**

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"] // Build dependencies first
    }
  }
}
```

**Example execution:**

```
nx build cli
→ Builds: types → config → utils → core → agents → cli
```

## Testing

### Test Organization

```
packages/my-package/
└── src/
    ├── lib/
    │   └── feature.ts
    └── __tests__/
        ├── feature.test.ts        # Unit tests
        ├── feature.integration.ts # Integration tests
        └── fixtures/              # Test data
            └── sample-data.json
```

### Running Tests

```bash
# Run tests for single package
nx test my-package

# Run affected tests (recommended for CI)
nx affected --target=test

# Run tests with coverage
nx test my-package --coverage

# Watch mode
nx test my-package --watch

# Run specific test file
nx test my-package --testFile=feature.test.ts
```

### Test Best Practices

**1. Mock workspace dependencies:**

```typescript
// ✅ Good: Mock @agent-control-plane packages
jest.mock('@agent-control-plane/core', () => ({
  orchestrate: jest.fn(),
}));

// Test in isolation
```

**2. Use test fixtures:**

```typescript
// ✅ Good: Shared test data
import { mockAgent } from './fixtures/mock-agent.js';

test('agent coordination', () => {
  const result = coordinate(mockAgent);
  expect(result).toBeDefined();
});
```

**3. Test exports:**

```typescript
// Ensure public API is stable
import * as MyPackage from '@agent-control-plane/my-package';

test('exports expected functions', () => {
  expect(MyPackage.featureA).toBeDefined();
  expect(MyPackage.featureB).toBeDefined();
});
```

## Code Quality

### Linting

```bash
# Lint affected packages
nx affected --target=lint

# Auto-fix issues
nx affected --target=lint --fix

# Lint specific package
nx lint my-package --fix
```

**ESLint configuration (.eslintrc.json):**

```json
{
  "extends": ["plugin:@nx/typescript", "plugin:@nx/javascript"],
  "rules": {
    "@nx/enforce-module-boundaries": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Type Checking

```bash
# Type check all packages
nx run-many --target=typecheck --all

# Type check affected
nx affected --target=typecheck

# Watch mode for development
cd packages/my-package
pnpm run typecheck:watch
```

### Code Reviews

**Review checklist:**

- [ ] Nx graph shows no circular dependencies
- [ ] All affected tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Public API documented
- [ ] README updated
- [ ] No new `any` types
- [ ] Import paths use workspace aliases

## Performance Optimization

### Monitoring Build Performance

```bash
# Generate build statistics
nx build my-package --stats-json

# View task execution details
NX_VERBOSE_LOGGING=true nx build my-package

# Profile task execution
nx build my-package --profile
```

### Optimizing Dependencies

**1. Analyze bundle size:**

```bash
# After building
du -sh packages/*/dist
```

**2. Tree shaking:**

```typescript
// ✅ Good: Named imports (tree-shakeable)
import { specific } from '@agent-control-plane/utils';

// ❌ Bad: Namespace import (entire module)
import * as Utils from '@agent-control-plane/utils';
```

**3. Lazy loading:**

```typescript
// ✅ Good: Lazy import heavy dependencies
async function heavyOperation() {
  const { processLargeData } = await import('@agent-control-plane/heavy-package');
  return processLargeData();
}
```

### Cache Optimization

**Identify cache misses:**

```bash
# Enable detailed logging
NX_VERBOSE_LOGGING=true nx build my-package

# Look for:
# - "cache miss" messages
# - Input hash changes
```

**Common cache miss causes:**

1. Timestamp in files
2. Absolute paths in outputs
3. Random IDs
4. External environment variables

**Fix: Stable outputs**

```typescript
// ❌ Bad: Timestamp breaks caching
const generated = `// Generated at ${new Date()}`;

// ✅ Good: Deterministic output
const generated = `// Generated by build script`;
```

## CI/CD Best Practices

### GitHub Actions Workflow

**.github/workflows/ci.yml:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Important for affected detection

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - uses: nrwl/nx-set-shas@v4 # Sets NX_BASE and NX_HEAD

      # Run only affected tasks (faster CI)
      - run: nx affected --target=lint --parallel=3
      - run: nx affected --target=test --parallel=3 --coverage
      - run: nx affected --target=build --parallel=3

      # Upload coverage
      - uses: codecov/codecov-action@v3
```

### Deployment

**Build for production:**

```bash
# Build affected packages
nx affected --target=build --configuration=production

# Or build all
nx run-many --target=build --all --configuration=production
```

**Optimize bundle:**

```json
// packages/my-package/project.json
{
  "targets": {
    "build": {
      "configurations": {
        "production": {
          "optimization": true,
          "sourceMap": false,
          "extractLicenses": true
        }
      }
    }
  }
}
```

## Documentation

### Package README Template

```markdown
# @agent-control-plane/my-package

Description of package purpose.

## Installation

\`\`\`bash
pnpm add @agent-control-plane/my-package
\`\`\`

## Usage

\`\`\`typescript
import { featureA } from '@agent-control-plane/my-package';

const result = featureA({ option: 'value' });
\`\`\`

## API

### `featureA(options)`

Description of function.

**Parameters:**

- `options.option` (string): Description

**Returns:** Description

## Examples

See [examples](../../examples)

## Dependencies

- `@agent-control-plane/core` - Core orchestration
- `@agent-control-plane/types` - Type definitions

## Development

\`\`\`bash

# Build

nx build my-package

# Test

nx test my-package

# Lint

nx lint my-package
\`\`\`
```

### Code Comments

````typescript
/**
 * Coordinates multiple agents in a swarm.
 *
 * @param agents - Array of agent configurations
 * @param topology - Network topology ('mesh' | 'hierarchical')
 * @returns Coordination result with agent assignments
 *
 * @example
 * ```typescript
 * const result = coordinate(agents, 'mesh');
 * console.log(result.assignments);
 * ```
 */
export function coordinate(agents: Agent[], topology: Topology): CoordinationResult {
  // Implementation
}
````

## Troubleshooting

### Common Issues

**1. Build fails with "Cannot find module"**

```bash
# Solution: Rebuild dependencies
nx run-many --target=build --all
pnpm install
```

**2. Cache issues**

```bash
# Solution: Clear Nx cache
rm -rf .nx/cache
nx reset
```

**3. Circular dependency error**

```bash
# Solution: Visualize and fix
nx graph
# Refactor to break cycle
```

**4. Slow builds**

```bash
# Solution: Enable remote caching
npx nx connect-to-nx-cloud

# Or increase parallelism
nx build --parallel=6
```

**5. Type errors in workspace imports**

```bash
# Solution: Rebuild types
nx run-many --target=build --all
# Check tsconfig.base.json paths
```

## Advanced Patterns

### Composite Packages

**Create package that combines others:**

```typescript
// packages/agents-bundle/src/index.ts
export * from '@agent-control-plane/agents';
export * from '@agent-control-plane/swarm';
export * from '@agent-control-plane/federation';

// Convenience re-exports
```

### Conditional Exports

**Different exports for Node.js vs Browser:**

```json
{
  "exports": {
    ".": {
      "node": "./dist/node/index.js",
      "browser": "./dist/browser/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

### Custom Executors

**Create reusable build tasks:**

```typescript
// tools/executors/wasm-pack/executor.ts
export default async function wasmPackExecutor(
  options: WasmPackOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  // Custom build logic
  return { success: true };
}
```

**Use in project.json:**

```json
{
  "targets": {
    "build:wasm": {
      "executor": "./tools/executors/wasm-pack:build",
      "options": {
        "target": "bundler"
      }
    }
  }
}
```

## Workspace Commands Cheat Sheet

```bash
# Build
nx build <package>                  # Build single package
nx affected --target=build          # Build affected
nx run-many --target=build --all    # Build all

# Test
nx test <package>                   # Test single package
nx affected --target=test           # Test affected
nx test <package> --watch           # Watch mode

# Lint
nx lint <package>                   # Lint single package
nx affected --target=lint --fix     # Lint and fix affected

# Graph
nx graph                            # Visual dependency graph
nx affected:graph                   # Affected packages graph

# Cache
nx reset                            # Clear cache
rm -rf .nx/cache                    # Manual cache clear

# Info
nx show project <package>           # Show package info
nx list                             # List installed plugins

# Generate
nx g @nx/js:library <name>          # Generate library
nx g @nx/node:application <name>    # Generate application
```

## Resources

- [Nx Documentation](https://nx.dev)
- [TypeScript Monorepo Guide](https://nx.dev/recipes/tips-n-tricks/typescript-monorepos)
- [Nx Cloud Setup](https://nx.app)
- [PNPM Workspaces](https://pnpm.io/workspaces)

## Conclusion

Following these best practices ensures:

- Fast, efficient builds with caching
- Clean architecture with enforced boundaries
- High code quality and maintainability
- Smooth developer experience
- Optimized CI/CD pipelines

For questions or issues, refer to the main [IMPLEMENTATION.md](./IMPLEMENTATION.md) guide.
