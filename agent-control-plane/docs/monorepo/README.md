# Monorepo Architecture Documentation

## Overview

This directory contains comprehensive documentation for migrating agent-control-plane from a monolithic architecture to an Nx-powered monorepo with 27 packages.

## Quick Links

- **[EVALUATION.md](./EVALUATION.md)** - Nx vs Turborepo comparison and recommendation
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Step-by-step setup guide
- **[MIGRATION.md](./MIGRATION.md)** - Incremental migration strategy
- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Developer workflows and patterns

## Executive Summary

**Recommendation**: **Nx** is the optimal monorepo tool for agent-control-plane.

### Key Findings

**Current State:**

- 48,206 lines of TypeScript across 184 files
- Monolithic structure with implicit dependencies
- Build time: ~120 seconds (full), ~90 seconds (TypeScript)

**Proposed State:**

- 27 well-defined packages with explicit dependencies
- 5-level dependency hierarchy (Level 0: types, config → Level 5: main app)
- Expected build time: ~15 seconds (incremental), ~35 seconds (CI affected)

### Performance Gains

| Metric              | Current | With Nx | Improvement    |
| ------------------- | ------- | ------- | -------------- |
| Full build          | 120s    | 100s    | 17% faster     |
| Incremental build   | 120s    | 15s     | **87% faster** |
| CI build (affected) | 120s    | 35s     | **71% faster** |
| Tests (affected)    | 45s     | 10s     | **78% faster** |
| Cache hit (2nd run) | N/A     | <1s     | **99% faster** |

### 27 Package Architecture

#### Core Infrastructure (5)

1. `@agent-control-plane/core` - Core orchestration engine
2. `@agent-control-plane/types` - Shared TypeScript types
3. `@agent-control-plane/config` - Configuration management
4. `@agent-control-plane/utils` - Shared utilities
5. `@agent-control-plane/transport` - Transport layer (QUIC, WebSocket)

#### Agent System (4)

6. `@agent-control-plane/agents` - 66 specialized agents
7. `@agent-control-plane/swarm` - Swarm coordination
8. `@agent-control-plane/federation` - Distributed consensus
9. `@agent-control-plane/hooks` - Lifecycle hooks

#### Memory & Intelligence (3)

10. `@agent-control-plane/agentdb` - Vector database
11. `@agent-control-plane/reasoningbank` - Adaptive learning
12. `@agent-control-plane/reasoningbank-wasm` - WASM bindings

#### Routing & Integration (4)

13. `@agent-control-plane/router` - LLM routing (27+ models)
14. `@agent-control-plane/proxy` - API proxies
15. `@agent-control-plane/mcp` - MCP server (213 tools)
16. `@agent-control-plane/mcp-fastmcp` - FastMCP integration

#### Business Logic (3)

17. `@agent-control-plane/billing` - Payment & credits
18. `@agent-control-plane/billing-payments` - Payment processing
19. `@agent-control-plane/billing-subscriptions` - Subscriptions

#### CLI & Tooling (3)

20. `@agent-control-plane/cli` - CLI interface
21. `@agent-control-plane/cli-sparc` - SPARC methodology
22. `@agent-control-plane/cli-github` - GitHub automation

#### Examples & Documentation (3)

23. `@agent-control-plane/examples` - Usage examples
24. `@agent-control-plane/prompts` - Prompt templates
25. `@agent-control-plane/docs` - Documentation site

#### WASM Modules (2)

26. `@agent-control-plane/wasm-reasoningbank` - ReasoningBank WASM
27. `@agent-control-plane/wasm-quic` - QUIC transport WASM

## Why Nx?

### 1. Advanced Dependency Graph

- Visual dependency graph (`nx graph`)
- Circular dependency detection
- Impact analysis for changes
- Module boundary enforcement

### 2. Superior Caching

- Computation caching with cryptographic hashing
- Remote caching (Nx Cloud) - free for OSS
- Task output caching with automatic invalidation
- 60-80% cache hit rate for typical workflows

### 3. Affected Commands

- Smart rebuilds (only changed packages)
- Git-based change detection
- Parallel execution with constraints
- Reduces CI time by 60-80%

### 4. TypeScript Excellence

- Native TypeScript project references
- Automatic path mapping
- Type checking only affected projects
- Better IDE integration

### 5. Ecosystem & Tooling

- 50+ plugins
- Automated migration tools
- Extensive generators/scaffolding
- Large community (Nrwl)

## Migration Timeline

### Fast Track (3-4 days)

- **Day 1**: Nx setup + Level 0 packages (types, config, prompts)
- **Day 2**: Level 1-2 packages (utils, transport, core, agentdb, reasoningbank, router)
- **Day 3**: Level 3-4 packages (agents, swarm, federation, mcp, billing, cli)
- **Day 4**: Integration, testing, optimization

### Production Ready (2-3 weeks)

- **Week 1**: Foundation (Nx setup, core packages)
- **Week 2**: Feature packages (agents, memory, routing)
- **Week 3**: Integration, testing, optimization

## Quick Start

### Prerequisites

```bash
# Ensure you have:
node >= 18.0.0
pnpm >= 8.0.0
```

### Installation

```bash
# 1. Backup current state
git checkout -b backup/pre-nx-migration
git push origin backup/pre-nx-migration

# 2. Install Nx
pnpm add -D -w nx @nx/workspace @nx/js @nx/node

# 3. Initialize Nx
npx nx@latest init

# 4. Copy provided nx.json
cp docs/monorepo/nx.json .

# 5. Follow IMPLEMENTATION.md for detailed steps
```

### Verification

```bash
# Check Nx installation
nx --version

# View dependency graph (will be empty initially)
nx graph

# Test Nx commands
nx list
```

## Common Commands

### Development

```bash
# Build affected packages
nx affected --target=build

# Test affected packages
nx affected --target=test

# Lint affected packages
nx affected --target=lint

# View dependency graph
nx graph
```

### CI/CD

```bash
# Build only what changed (for PR)
nx affected --target=build --base=origin/main

# Run all tests with coverage
nx run-many --target=test --all --coverage

# Parallel execution
nx affected --target=build --parallel=3
```

### Debugging

```bash
# Clear cache
nx reset

# Verbose logging
NX_VERBOSE_LOGGING=true nx build my-package

# Show task execution details
nx build my-package --profile
```

## Architecture Decisions

### ADR-001: Choose Nx over Turborepo

**Status**: Accepted
**Context**: Need monorepo tool for 27 packages with complex dependencies
**Decision**: Use Nx for superior TypeScript support and caching
**Consequences**: Steeper learning curve but better long-term value

### ADR-002: 27-Package Structure

**Status**: Accepted
**Context**: Break monolithic 48K lines into logical units
**Decision**: Create 27 packages organized by domain
**Consequences**: Clear boundaries, better reusability, easier testing

### ADR-003: Incremental Migration

**Status**: Accepted
**Context**: Minimize risk and maintain backward compatibility
**Decision**: Migrate packages incrementally, bottom-up by dependency level
**Consequences**: Longer migration time but safer, reversible

### ADR-004: pnpm Workspaces + Nx

**Status**: Accepted
**Context**: Already using pnpm, Nx supports it natively
**Decision**: Keep pnpm, add Nx on top
**Consequences**: Best of both worlds: pnpm speed + Nx features

## Success Metrics

Track these post-migration:

- [ ] **Build Time**: 60-80% reduction for incremental builds
- [ ] **CI Time**: 50-70% reduction with affected commands
- [ ] **Cache Hit Rate**: Target 70%+ for typical workflows
- [ ] **Developer Experience**: Faster feedback loops
- [ ] **Code Quality**: Better module boundaries
- [ ] **Test Coverage**: Maintained or improved
- [ ] **Bundle Size**: Optimized with tree-shaking

## Risks & Mitigation

### Technical Risks

1. **Circular Dependencies**
   - **Risk**: High (identified reasoningbank ↔ router)
   - **Mitigation**: Extract shared interfaces to types package
   - **Detection**: `nx graph` visual inspection

2. **Build Failures**
   - **Risk**: Medium
   - **Mitigation**: Incremental migration, test each package
   - **Recovery**: Git revert individual commits

3. **WASM Build Complexity**
   - **Risk**: Low
   - **Mitigation**: Custom executor, isolated build
   - **Recovery**: Keep WASM builds in original location

### Process Risks

1. **Team Disruption**
   - **Risk**: Low
   - **Mitigation**: Migrate on feature branch
   - **Recovery**: Continue on main branch

2. **CI/CD Breakage**
   - **Risk**: Medium
   - **Mitigation**: Update CI config alongside migration
   - **Recovery**: Revert CI config

## Resources

### Documentation

- [Nx Documentation](https://nx.dev)
- [TypeScript Monorepo](https://nx.dev/recipes/tips-n-tricks/typescript-monorepos)
- [Nx Cloud](https://nx.app)

### Internal Docs

- [EVALUATION.md](./EVALUATION.md) - Full comparison matrix
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Detailed setup guide
- [MIGRATION.md](./MIGRATION.md) - Week-by-week plan
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Developer workflows

### Support

- GitHub Issues: [agent-control-plane/issues](https://github.com/Aktoh-Cyber/agent-control-plane/issues)
- Nx Community: [Nx Slack](https://go.nx.dev/community)

## Next Steps

1. **Review**: Read [EVALUATION.md](./EVALUATION.md) for full analysis
2. **Plan**: Review [MIGRATION.md](./MIGRATION.md) timeline
3. **Execute**: Follow [IMPLEMENTATION.md](./IMPLEMENTATION.md) step-by-step
4. **Optimize**: Apply [BEST_PRACTICES.md](./BEST_PRACTICES.md) patterns

## Appendix

### Dependency Graph Visualization

```
Level 0 (Foundation):
  types ─┐
  config ─┤
  prompts─┘

Level 1 (Core):
  utils ────┐
  transport ─┤─> core
  │          │
  └──────────┘

Level 2 (Foundation):
  agentdb ────┐
  reasoningbank─┤
  router ──────┘

Level 3 (Features):
  agents ─────┐
  swarm ──────┤
  federation ─┤
  proxy ──────┤
  mcp ────────┘

Level 4 (Business):
  billing ─┐
  cli ─────┤
  examples─┘

Level 5 (App):
  main ────> (combines all packages)
```

### Package Size Distribution

```
Largest packages:
- agentdb (408KB)
- reasoningbank (396KB)
- proxy (180KB)
- utils (168KB)
- cli (152KB)

Medium packages (50-150KB):
- mcp (144KB)
- router (140KB)
- federation (132KB)
- billing (100KB)

Small packages (<50KB):
- agents, swarm, transport, core, hooks, config, types, prompts
```

### Technology Stack

- **Package Manager**: pnpm 8+
- **Build Tool**: Nx 19+
- **TypeScript**: 5.6.3
- **Runtime**: Node.js 18+
- **WASM**: wasm-pack
- **CI/CD**: GitHub Actions
- **Testing**: Jest (via Nx)
- **Linting**: ESLint + Nx plugin

---

**Last Updated**: December 8, 2025
**Status**: Implementation Ready
**Owner**: Monorepo Architecture Team
**Reviewers**: Infrastructure Team
