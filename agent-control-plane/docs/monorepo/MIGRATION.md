# Monorepo Migration Strategy

## Overview

This document outlines the incremental migration strategy from monolithic structure to Nx-powered monorepo, ensuring zero downtime and maintaining backward compatibility.

## Migration Philosophy

**Incremental over Big Bang**: Migrate packages one-by-one rather than all at once
**Backward Compatible**: Maintain existing import paths during transition
**Testable**: Each migration step is independently verifiable
**Reversible**: Can rollback at any point

## Timeline

**Total Duration**: 2-3 weeks (production-ready)

- **Week 1**: Foundation (Nx setup, core packages)
- **Week 2**: Feature packages (agents, memory, routing)
- **Week 3**: Integration, testing, optimization

**Compressed Timeline**: 3-4 days (aggressive, for POC)

- See IMPLEMENTATION.md for fast-track approach

## Detailed Migration Phases

### Phase 1: Foundation Setup (Week 1, Days 1-2)

#### Day 1: Nx Installation and Configuration

**Morning (2 hours):**

```bash
# 1. Create feature branch
git checkout -b feature/nx-migration
git push -u origin feature/nx-migration

# 2. Install Nx
pnpm add -D -w nx @nx/workspace @nx/js @nx/node

# 3. Initialize Nx
npx nx@latest init --integrated

# 4. Create nx.json (already provided)
# Copy nx.json from docs/monorepo/nx.json

# 5. Commit checkpoint
git add .
git commit -m "chore: initialize Nx workspace"
```

**Afternoon (4 hours):**

```bash
# 1. Set up base TypeScript configuration
# Create tsconfig.base.json

# 2. Set up package workspace
mkdir -p packages

# 3. Configure pnpm workspaces
# Update package.json with "workspaces": ["packages/*"]

# 4. Test Nx installation
nx --version
nx graph  # Should show empty graph

# 5. Commit
git add .
git commit -m "chore: configure Nx workspace structure"
```

#### Day 2: Core Package Migration (Level 0)

**Morning (3 hours) - Types Package:**

```bash
# 1. Create package structure
nx g @nx/js:library types \
  --directory=packages/types \
  --importPath=@agent-control-plane/types \
  --publishable=true \
  --buildable=true

# 2. Move source files
cp -r src/types/* packages/types/src/

# 3. Create exports (packages/types/src/index.ts)
# Export all types

# 4. Build and test
nx build types
nx test types

# 5. Commit
git add packages/types
git commit -m "feat(types): migrate types package to monorepo"
```

**Afternoon (3 hours) - Config and Prompts:**

Repeat for `config` and `prompts` packages:

```bash
nx g @nx/js:library config --directory=packages/config --importPath=@agent-control-plane/config --publishable --buildable
nx g @nx/js:library prompts --directory=packages/prompts --importPath=@agent-control-plane/prompts --publishable --buildable

# Move files
cp -r src/config/* packages/config/src/
cp -r src/prompts/* packages/prompts/src/

# Build
nx run-many --target=build --projects=types,config,prompts

# Commit
git add packages/{config,prompts}
git commit -m "feat(config,prompts): migrate to monorepo"
```

**Verification:**

```bash
# Check dependency graph
nx graph

# Verify builds
nx run-many --target=build --all

# Check for errors
nx run-many --target=lint --all
```

### Phase 2: Core Utilities (Week 1, Days 3-4)

#### Day 3: Utils and Transport

**Utils Package (3 hours):**

```bash
nx g @nx/js:library utils \
  --directory=packages/utils \
  --importPath=@agent-control-plane/utils \
  --publishable --buildable

# Move files
cp -r src/utils/* packages/utils/src/

# Update package.json dependencies
# Add @agent-control-plane/types, @agent-control-plane/config

# Update imports in utils
find packages/utils/src -name "*.ts" -exec sed -i '' \
  -e "s|from '../types|from '@agent-control-plane/types|g" \
  -e "s|from '../config|from '@agent-control-plane/config|g" \
  {} +

# Build
nx build utils

# Commit
git add packages/utils
git commit -m "feat(utils): migrate utils package to monorepo"
```

**Transport Package (2 hours):**

```bash
nx g @nx/js:library transport \
  --directory=packages/transport \
  --importPath=@agent-control-plane/transport \
  --publishable --buildable

# Move files
cp -r src/transport/* packages/transport/src/

# Update imports
# Build and commit
nx build transport
git add packages/transport
git commit -m "feat(transport): migrate transport package"
```

#### Day 4: Core Package

**Core Package (4 hours):**

```bash
nx g @nx/js:library core \
  --directory=packages/core \
  --importPath=@agent-control-plane/core \
  --publishable --buildable

# Move files
cp -r src/core/* packages/core/src/

# Update dependencies in package.json
cd packages/core
pnpm add @agent-control-plane/types@workspace:*
pnpm add @agent-control-plane/config@workspace:*
pnpm add @agent-control-plane/utils@workspace:*
pnpm add @agent-control-plane/transport@workspace:*

# Update imports
find src -name "*.ts" -exec sed -i '' \
  -e "s|from '../../types|from '@agent-control-plane/types|g" \
  -e "s|from '../../config|from '@agent-control-plane/config|g" \
  -e "s|from '../../utils|from '@agent-control-plane/utils|g" \
  {} +

# Build
nx build core

# Verify dependency graph
nx graph

# Commit
git add packages/core
git commit -m "feat(core): migrate core orchestration to monorepo"
```

**End of Week 1 Checkpoint:**

```bash
# Verify all Level 0-1 packages
nx run-many --target=build --all
nx run-many --target=test --all

# Create milestone tag
git tag -a milestone-week1 -m "Completed core packages migration"
git push origin milestone-week1

# Merge to main (optional)
git checkout main
git merge feature/nx-migration
git push
```

### Phase 3: Foundation Packages (Week 2, Days 1-3)

#### Day 1: AgentDB

**AgentDB Package (4 hours):**

```bash
nx g @nx/js:library agentdb \
  --directory=packages/agentdb \
  --importPath=@agent-control-plane/agentdb \
  --publishable --buildable

# Move files (largest package - 408KB)
cp -r src/agentdb/* packages/agentdb/src/

# Update dependencies
cd packages/agentdb
pnpm add @agent-control-plane/core@workspace:*
pnpm add @agent-control-plane/types@workspace:*
pnpm add @agent-control-plane/utils@workspace:*
pnpm add agentdb@^1.4.3
pnpm add better-sqlite3@^12.5.0

# Update imports (critical - many cross-references)
find src -name "*.ts" -exec sed -i '' \
  -e "s|from '../../core|from '@agent-control-plane/core|g" \
  -e "s|from '../../types|from '@agent-control-plane/types|g" \
  -e "s|from '../../utils|from '@agent-control-plane/utils|g" \
  {} +

# Special handling for CLI
# Keep agentdb/cli as separate executable

# Build
nx build agentdb

# Test
nx test agentdb

# Commit
git add packages/agentdb
git commit -m "feat(agentdb): migrate vector database to monorepo"
```

#### Day 2: ReasoningBank

**ReasoningBank Package (4 hours):**

```bash
nx g @nx/js:library reasoningbank \
  --directory=packages/reasoningbank \
  --importPath=@agent-control-plane/reasoningbank \
  --publishable --buildable

# Move files (396KB)
cp -r src/reasoningbank/* packages/reasoningbank/src/

# Dependencies
cd packages/reasoningbank
pnpm add @agent-control-plane/core@workspace:*
pnpm add @agent-control-plane/router@workspace:*  # Circular dependency alert!
pnpm add @agent-control-plane/types@workspace:*

# Handle circular dependency:
# Option 1: Extract shared interfaces to types package
# Option 2: Use dependency injection

# Update imports
find src -name "*.ts" -exec sed -i '' \
  -e "s|from '../../router|from '@agent-control-plane/router|g" \
  {} +

# Build
nx build reasoningbank

# Commit
git add packages/reasoningbank
git commit -m "feat(reasoningbank): migrate adaptive learning to monorepo"
```

**ReasoningBank WASM Package (2 hours):**

```bash
nx g @nx/js:library reasoningbank-wasm \
  --directory=packages/reasoningbank-wasm \
  --importPath=@agent-control-plane/reasoningbank-wasm \
  --publishable --buildable

# Copy WASM files
cp -r wasm/reasoningbank/* packages/reasoningbank-wasm/

# Create custom executor for wasm-pack
# See tools/executors/wasm-pack/

# Update project.json with WASM build target
# Build
nx build reasoningbank-wasm

# Commit
git add packages/reasoningbank-wasm
git commit -m "feat(reasoningbank-wasm): add WASM package"
```

#### Day 3: Router

**Router Package (3 hours):**

```bash
nx g @nx/js:library router \
  --directory=packages/router \
  --importPath=@agent-control-plane/router \
  --publishable --buildable

# Move files (140KB)
cp -r src/router/* packages/router/src/

# Dependencies
cd packages/router
pnpm add @agent-control-plane/core@workspace:*
pnpm add @agent-control-plane/types@workspace:*
pnpm add @agent-control-plane/utils@workspace:*
pnpm add @anthropic-ai/sdk@^0.71.2
pnpm add @google/genai@^1.32.0

# Update imports
# Build
nx build router

# Commit
git add packages/router
git commit -m "feat(router): migrate LLM router to monorepo"
```

### Phase 4: Feature Packages (Week 2, Days 4-5)

#### Day 4: Agent System

**Agents Package:**

```bash
nx g @nx/js:library agents \
  --directory=packages/agents \
  --importPath=@agent-control-plane/agents \
  --publishable --buildable

cp -r src/agents/* packages/agents/src/
# Update imports and build
```

**Swarm Package:**

```bash
nx g @nx/js:library swarm \
  --directory=packages/swarm \
  --importPath=@agent-control-plane/swarm \
  --publishable --buildable

cp -r src/swarm/* packages/swarm/src/
# Update imports and build
```

**Federation Package:**

```bash
nx g @nx/js:library federation \
  --directory=packages/federation \
  --importPath=@agent-control-plane/federation \
  --publishable --buildable

cp -r src/federation/* packages/federation/src/
# Update imports and build
```

#### Day 5: Proxy and MCP

**Proxy Package:**

```bash
nx g @nx/js:library proxy \
  --directory=packages/proxy \
  --importPath=@agent-control-plane/proxy \
  --publishable --buildable

cp -r src/proxy/* packages/proxy/src/
```

**MCP Package:**

```bash
nx g @nx/js:library mcp \
  --directory=packages/mcp \
  --importPath=@agent-control-plane/mcp \
  --publishable --buildable

cp -r src/mcp/* packages/mcp/src/

# FastMCP sub-package
nx g @nx/js:library mcp-fastmcp \
  --directory=packages/mcp-fastmcp \
  --importPath=@agent-control-plane/mcp-fastmcp \
  --publishable --buildable

cp -r src/mcp/fastmcp/* packages/mcp-fastmcp/src/
```

### Phase 5: Business Logic (Week 3, Days 1-2)

#### Day 1: Billing

**Billing Core:**

```bash
nx g @nx/js:library billing \
  --directory=packages/billing \
  --importPath=@agent-control-plane/billing \
  --publishable --buildable

cp -r src/billing/* packages/billing/src/
```

**Billing Sub-packages:**

```bash
# Payments
nx g @nx/js:library billing-payments \
  --directory=packages/billing-payments \
  --importPath=@agent-control-plane/billing-payments \
  --publishable --buildable

# Subscriptions
nx g @nx/js:library billing-subscriptions \
  --directory=packages/billing-subscriptions \
  --importPath=@agent-control-plane/billing-subscriptions \
  --publishable --buildable
```

#### Day 2: CLI

**CLI Package:**

```bash
nx g @nx/js:library cli \
  --directory=packages/cli \
  --importPath=@agent-control-plane/cli \
  --publishable --buildable

cp -r src/cli/* packages/cli/src/

# CLI sub-packages
nx g @nx/js:library cli-sparc --directory=packages/cli-sparc --importPath=@agent-control-plane/cli-sparc --publishable --buildable
nx g @nx/js:library cli-github --directory=packages/cli-github --importPath=@agent-control-plane/cli-github --publishable --buildable
```

### Phase 6: Integration and Testing (Week 3, Days 3-5)

#### Day 3: Main Application

**Create Main App:**

```bash
nx g @nx/node:application agent-control-plane \
  --directory=apps/agent-control-plane \
  --framework=none

# Move main entry points
cp src/index.ts apps/agent-control-plane/src/main.ts
cp src/cli-proxy.ts apps/agent-control-plane/src/cli.ts

# Update imports to use workspace packages
# Build
nx build agent-control-plane
```

#### Day 4: Testing and Validation

**Comprehensive Testing:**

```bash
# Run all tests
nx run-many --target=test --all --parallel=3

# Run affected tests
nx affected --target=test

# Integration tests
nx test agent-control-plane

# Validate builds
nx run-many --target=build --all

# Lint all packages
nx run-many --target=lint --all
```

**Performance Testing:**

```bash
# Measure build times
time nx run-many --target=build --all

# Test caching
nx build core
time nx build core  # Should be instant

# Test affected detection
echo "// test" >> packages/core/src/index.ts
time nx affected --target=build
```

#### Day 5: Documentation and Cleanup

**Update Documentation:**

```bash
# Update README.md with new structure
# Update CONTRIBUTING.md with Nx workflows
# Create package-specific READMEs
```

**Cleanup:**

```bash
# Remove old src/ directory
git rm -r src/

# Update .gitignore
echo ".nx" >> .gitignore
echo "dist" >> .gitignore

# Final commit
git add .
git commit -m "chore: complete Nx migration"
```

## Rollback Procedures

### Immediate Rollback (During Migration)

```bash
# Discard all changes
git reset --hard HEAD
git clean -fd

# Or revert to specific checkpoint
git reset --hard milestone-week1
```

### Post-Migration Rollback

```bash
# Option 1: Revert commits
git revert HEAD~10..HEAD  # Revert last 10 commits

# Option 2: Hard reset to tag
git reset --hard pre-nx-v1.10.3
git push origin main --force

# Option 3: Keep packages, remove Nx
rm nx.json
pnpm remove nx @nx/workspace @nx/js
# Packages still work with pnpm workspaces
```

## Risk Mitigation

### Technical Risks

1. **Circular Dependencies**
   - **Risk**: High (identified in reasoningbank ↔ router)
   - **Mitigation**: Extract shared interfaces to `types` package
   - **Detection**: `nx graph` visual inspection

2. **Import Path Breakage**
   - **Risk**: Medium
   - **Mitigation**: Automated sed scripts, thorough testing
   - **Recovery**: Git revert individual commits

3. **Build Failures**
   - **Risk**: Medium
   - **Mitigation**: Incremental migration, test each package
   - **Recovery**: Fix or skip package temporarily

4. **WASM Build Complexity**
   - **Risk**: Low (isolated to 2 packages)
   - **Mitigation**: Custom executor, separate build step
   - **Recovery**: Keep WASM builds in original location

### Process Risks

1. **Team Disruption**
   - **Risk**: Low
   - **Mitigation**: Migrate on feature branch, merge when stable
   - **Recovery**: Parallel development on main

2. **CI/CD Breakage**
   - **Risk**: Medium
   - **Mitigation**: Update CI config alongside migration
   - **Recovery**: Revert CI config, continue on branch

3. **Deployment Issues**
   - **Risk**: Low
   - **Mitigation**: Keep build artifacts in same location (`dist/`)
   - **Recovery**: No changes to deployment process needed

## Success Criteria

Migration is complete when:

✅ All 27 packages build successfully
✅ All tests pass
✅ Dependency graph has no circular dependencies
✅ Build time improved by 60%+ for incremental builds
✅ CI time reduced by 50%+ with affected commands
✅ Cache hit rate >70% for typical workflows
✅ No import path errors in production
✅ Documentation updated

## Post-Migration Checklist

- [ ] All packages building
- [ ] All tests passing
- [ ] Dependency graph validated
- [ ] CI/CD updated and working
- [ ] Documentation updated
- [ ] Team trained on Nx workflows
- [ ] Performance metrics collected
- [ ] Nx Cloud connected (optional)
- [ ] Old `src/` directory removed
- [ ] Git history cleaned up
- [ ] Release notes published

## Communication Plan

**Week 1:**

- Day 1: Announce migration, share timeline
- Day 5: Weekly update, demo dependency graph

**Week 2:**

- Day 3: Mid-migration checkpoint, address concerns
- Day 5: Weekly update, performance metrics

**Week 3:**

- Day 3: Migration complete, training session
- Day 5: Retrospective, gather feedback

## Training Materials

Create:

1. "Nx Quick Start" guide
2. "Common Nx Commands" cheat sheet
3. "Troubleshooting" FAQ
4. Video walkthrough of new workflows

## Conclusion

This migration strategy prioritizes:

- **Safety**: Incremental, testable, reversible
- **Speed**: 2-3 weeks for production, 3-4 days for POC
- **Quality**: No regressions, improved performance
- **Team**: Minimal disruption, comprehensive training

Follow this plan for a smooth transition to Nx-powered monorepo.
