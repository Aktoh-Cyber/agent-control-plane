# Monorepo Implementation Guide: Nx Setup

## Overview

This guide provides step-by-step instructions for migrating agent-control-plane from a monolithic structure to an Nx-powered monorepo with 27 packages.

**Timeline**: 3-4 days for complete migration
**Risk Level**: Low (incremental, reversible)
**Team Impact**: Minimal (preserves existing workflows)

## Phase 1: Preparation (Day 1, Morning)

### 1.1 Backup Current State

```bash
# Create a backup branch
git checkout -b backup/pre-nx-migration
git push origin backup/pre-nx-migration

# Tag current state
git tag -a pre-nx-v1.10.3 -m "State before Nx migration"
git push origin pre-nx-v1.10.3
```

### 1.2 Install Nx

```bash
# Install Nx globally (optional)
npm install -g nx

# Add Nx to existing workspace
pnpm add -D -w nx @nx/workspace @nx/js @nx/node @nx/vite

# Add TypeScript support
pnpm add -D -w @nx/eslint-plugin @nx/jest

# Add WASM build support
pnpm add -D -w @nx/webpack @nx/rollup
```

### 1.3 Initialize Nx Workspace

```bash
# Initialize Nx in existing pnpm workspace
npx nx@latest init

# This creates:
# - nx.json (Nx configuration)
# - .nxignore (files to ignore)
# - Updates .gitignore
```

## Phase 2: Workspace Configuration (Day 1, Afternoon)

### 2.1 Update package.json (Root)

Add workspace configuration:

```json
{
  "name": "agent-control-plane-workspace",
  "version": "1.10.3",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "nx run-many --target=build --all",
    "build:affected": "nx affected --target=build",
    "test": "nx run-many --target=test --all",
    "test:affected": "nx affected --target=test",
    "lint": "nx run-many --target=lint --all",
    "lint:affected": "nx affected --target=lint",
    "graph": "nx graph",
    "affected:graph": "nx affected:graph"
  },
  "devDependencies": {
    "nx": "^19.0.0",
    "@nx/workspace": "^19.0.0",
    "@nx/js": "^19.0.0",
    "@nx/node": "^19.0.0",
    "@nx/vite": "^19.0.0",
    "@nx/eslint-plugin": "^19.0.0",
    "typescript": "^5.6.3",
    "tsx": "^4.19.0"
  }
}
```

### 2.2 Create nx.json

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "affected": {
    "defaultBase": "main"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["production", "^production"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production", "{workspaceRoot}/jest.config.js"],
      "outputs": ["{projectRoot}/coverage"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    },
    "build:wasm": {
      "dependsOn": [],
      "cache": true,
      "inputs": ["{projectRoot}/crates/**/*"],
      "outputs": ["{projectRoot}/pkg/**"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/src/test-setup.[jt]s",
      "!{projectRoot}/test-setup.[jt]s"
    ],
    "sharedGlobals": ["{workspaceRoot}/pnpm-lock.yaml"]
  },
  "generators": {
    "@nx/js:library": {
      "buildable": true,
      "publishable": true
    }
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "build:wasm"],
        "parallel": 3,
        "cacheDirectory": ".nx/cache"
      }
    }
  },
  "pluginsConfig": {
    "@nx/js": {
      "analyzeSourceFiles": true
    }
  },
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "packages"
  },
  "cli": {
    "packageManager": "pnpm"
  },
  "defaultProject": "agent-control-plane"
}
```

### 2.3 Create .nxignore

```
node_modules
dist
.nx
coverage
*.log
.env*
wasm/*/pkg
```

## Phase 3: Package Migration (Day 2)

### 3.1 Create Package Structure

```bash
mkdir -p packages/{core,types,config,utils,transport}
mkdir -p packages/{agents,swarm,federation,hooks}
mkdir -p packages/{agentdb,reasoningbank,reasoningbank-wasm}
mkdir -p packages/{router,proxy,mcp,mcp-fastmcp}
mkdir -p packages/{billing,billing-payments,billing-subscriptions}
mkdir -p packages/{cli,cli-sparc,cli-github}
mkdir -p packages/{examples,prompts,docs}
mkdir -p packages/{wasm-reasoningbank,wasm-quic}
```

### 3.2 Migration Order (Bottom-up)

Follow dependency levels to avoid circular issues:

**Level 0 - No dependencies:**

1. types
2. config
3. prompts

**Level 1 - Core utilities:** 4. utils 5. transport 6. core

**Level 2 - Foundation:** 7. agentdb 8. reasoningbank 9. router

**Level 3 - Features:** 10. agents 11. swarm 12. federation 13. proxy 14. mcp

**Level 4 - Business logic:** 15. billing 16. cli 17. examples

### 3.3 Package Template

For each package, create this structure:

```bash
packages/core/
├── package.json
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
├── src/
│   └── index.ts
└── README.md
```

#### packages/core/package.json

```json
{
  "name": "@agent-control-plane/core",
  "version": "1.10.3",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.lib.json",
    "test": "tsx src/**/*.test.ts",
    "lint": "eslint src"
  },
  "dependencies": {
    "@agent-control-plane/types": "workspace:*",
    "@agent-control-plane/config": "workspace:*",
    "@agent-control-plane/utils": "workspace:*"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

#### packages/core/project.json

```json
{
  "name": "@agent-control-plane/core",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/core/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "packages/core/dist",
        "main": "packages/core/src/index.ts",
        "tsConfig": "packages/core/tsconfig.lib.json",
        "assets": []
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "packages/core/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["packages/core/**/*.ts"]
      }
    }
  },
  "tags": ["scope:core", "type:library"]
}
```

#### packages/core/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "es2022",
    "moduleResolution": "bundler",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts", "jest.config.ts", "dist"]
}
```

#### packages/core/tsconfig.lib.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}
```

### 3.4 Root tsconfig.base.json

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "module": "esnext",
    "target": "es2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@agent-control-plane/core": ["packages/core/src/index.ts"],
      "@agent-control-plane/types": ["packages/types/src/index.ts"],
      "@agent-control-plane/config": ["packages/config/src/index.ts"],
      "@agent-control-plane/utils": ["packages/utils/src/index.ts"],
      "@agent-control-plane/transport": ["packages/transport/src/index.ts"],
      "@agent-control-plane/agents": ["packages/agents/src/index.ts"],
      "@agent-control-plane/swarm": ["packages/swarm/src/index.ts"],
      "@agent-control-plane/federation": ["packages/federation/src/index.ts"],
      "@agent-control-plane/hooks": ["packages/hooks/src/index.ts"],
      "@agent-control-plane/agentdb": ["packages/agentdb/src/index.ts"],
      "@agent-control-plane/reasoningbank": ["packages/reasoningbank/src/index.ts"],
      "@agent-control-plane/router": ["packages/router/src/index.ts"],
      "@agent-control-plane/proxy": ["packages/proxy/src/index.ts"],
      "@agent-control-plane/mcp": ["packages/mcp/src/index.ts"],
      "@agent-control-plane/billing": ["packages/billing/src/index.ts"],
      "@agent-control-plane/cli": ["packages/cli/src/index.ts"],
      "@agent-control-plane/examples": ["packages/examples/src/index.ts"],
      "@agent-control-plane/prompts": ["packages/prompts/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## Phase 4: Dependency Graph Configuration (Day 3, Morning)

### 4.1 Module Boundaries

Add to `.eslintrc.json`:

```json
{
  "extends": ["plugin:@nx/typescript"],
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "enforceBuildableLibDependency": true,
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "scope:core",
            "onlyDependOnLibsWithTags": ["scope:core", "scope:types"]
          },
          {
            "sourceTag": "scope:agents",
            "onlyDependOnLibsWithTags": ["scope:core", "scope:types", "scope:utils"]
          },
          {
            "sourceTag": "scope:mcp",
            "onlyDependOnLibsWithTags": ["*"]
          },
          {
            "sourceTag": "type:library",
            "onlyDependOnLibsWithTags": ["type:library"]
          }
        ]
      }
    ]
  }
}
```

### 4.2 Circular Dependency Detection

```bash
# Check for circular dependencies
nx graph --file=graph.html

# Analyze circular dependencies
nx affected:graph --file=affected.html
```

### 4.3 Build Order Optimization

Nx automatically determines optimal build order. Verify with:

```bash
# Show task execution plan
nx build core --graph

# Show all dependencies
nx show project core --web
```

## Phase 5: WASM Build Integration (Day 3, Afternoon)

### 5.1 ReasoningBank WASM Package

```json
{
  "name": "@agent-control-plane/reasoningbank-wasm",
  "version": "1.10.3",
  "type": "module",
  "main": "./pkg/bundler/reasoningbank_wasm.js",
  "types": "./pkg/bundler/reasoningbank_wasm.d.ts",
  "scripts": {
    "build": "wasm-pack build --target bundler --out-dir pkg/bundler crates/reasoningbank-wasm && wasm-pack build --target web --out-dir pkg/web crates/reasoningbank-wasm"
  }
}
```

Add to `project.json`:

```json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "wasm-pack build --target bundler --out-dir pkg/bundler {projectRoot}/crates/reasoningbank-wasm",
          "wasm-pack build --target web --out-dir pkg/web {projectRoot}/crates/reasoningbank-wasm"
        ],
        "parallel": false
      }
    }
  }
}
```

## Phase 6: CI/CD Optimization (Day 4, Morning)

### 6.1 GitHub Actions with Nx

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      # Set SHAs for Nx affected commands
      - uses: nrwl/nx-set-shas@v4

      # Run affected commands
      - run: npx nx affected --target=lint --parallel=3
      - run: npx nx affected --target=test --parallel=3 --ci --code-coverage
      - run: npx nx affected --target=build --parallel=3

      # Upload coverage
      - uses: codecov/codecov-action@v3
        if: always()
```

### 6.2 Nx Cloud Setup (Optional)

```bash
# Connect to Nx Cloud (free for OSS)
npx nx connect-to-nx-cloud

# This adds to nx.json:
# "nxCloudAccessToken": "YOUR_TOKEN"
```

Benefits:

- Remote caching across CI runs
- Distributed task execution
- Build analytics dashboard
- Automatic GitHub PR comments

## Phase 7: Migration Script (Day 4, Afternoon)

### 7.1 Automated Migration Script

Create `scripts/migrate-to-nx.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Nx migration..."

# Step 1: Create package directories
echo "📁 Creating package structure..."
for pkg in core types config utils transport agents swarm federation hooks \
           agentdb reasoningbank router proxy mcp billing cli examples prompts; do
  mkdir -p "packages/$pkg/src"
  echo "Created packages/$pkg"
done

# Step 2: Move source files
echo "📦 Moving source files..."
move_package() {
  local src=$1
  local dest=$2

  if [ -d "src/$src" ]; then
    cp -r "src/$src/"* "packages/$dest/src/"
    echo "Moved src/$src -> packages/$dest/src"
  fi
}

move_package "core" "core"
move_package "types" "types"
move_package "config" "config"
move_package "utils" "utils"
move_package "transport" "transport"
move_package "agents" "agents"
move_package "swarm" "swarm"
move_package "federation" "federation"
move_package "hooks" "hooks"
move_package "agentdb" "agentdb"
move_package "reasoningbank" "reasoningbank"
move_package "router" "router"
move_package "proxy" "proxy"
move_package "mcp" "mcp"
move_package "billing" "billing"
move_package "cli" "cli"
move_package "examples" "examples"
move_package "prompts" "prompts"

# Step 3: Update imports
echo "🔧 Updating imports..."
find packages -name "*.ts" -type f -exec sed -i '' \
  -e "s|from '../../core|from '@agent-control-plane/core|g" \
  -e "s|from '../../types|from '@agent-control-plane/types|g" \
  -e "s|from '../../utils|from '@agent-control-plane/utils|g" \
  {} +

# Step 4: Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Step 5: Build all packages
echo "🔨 Building packages..."
nx run-many --target=build --all

echo "✅ Migration complete!"
echo "Next steps:"
echo "1. Review generated packages/"
echo "2. Run: nx graph"
echo "3. Run: nx affected --target=test"
echo "4. Commit changes"
```

Make executable:

```bash
chmod +x scripts/migrate-to-nx.sh
```

## Phase 8: Verification (Day 4, End)

### 8.1 Verification Checklist

```bash
# 1. Verify package structure
ls -la packages/

# 2. Check dependency graph
nx graph

# 3. Test builds
nx run-many --target=build --all

# 4. Test affected detection
git checkout -b test/nx-affected
# Make a small change
echo "// test" >> packages/core/src/index.ts
nx affected:build
nx affected:test

# 5. Verify caching
nx build core
nx build core  # Should be instant (cached)

# 6. Check for circular dependencies
nx graph --file=graph.html
# Open graph.html and look for circular arrows
```

### 8.2 Performance Comparison

```bash
# Before Nx (monolithic)
time pnpm run build

# After Nx (full build)
time nx run-many --target=build --all

# After Nx (incremental)
# Change one file
echo "// test" >> packages/core/src/index.ts
time nx affected --target=build
```

Expected results:

- Full build: Similar or 10-20% faster
- Incremental: 70-90% faster
- Second run (cached): 95%+ faster

## Phase 9: Rollback Plan

If migration issues arise:

```bash
# Option 1: Revert to backup
git checkout backup/pre-nx-migration
git branch -D main
git checkout -b main
git push origin main --force

# Option 2: Remove Nx but keep packages
rm -rf nx.json .nx/
pnpm remove nx @nx/workspace @nx/js
# Packages still work with pnpm workspaces

# Option 3: Tag and continue
git tag -a nx-migration-v1 -m "Nx migration checkpoint"
# Continue debugging
```

## Phase 10: Post-Migration Optimization

### 10.1 Enable Remote Caching

```bash
# Set up Nx Cloud
npx nx connect-to-nx-cloud

# Add to nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "accessToken": "YOUR_TOKEN"
      }
    }
  }
}
```

### 10.2 Optimize Task Configuration

Fine-tune caching in `nx.json`:

```json
{
  "targetDefaults": {
    "build": {
      "inputs": [
        "production",
        "^production",
        {
          "externalDependencies": ["typescript", "tsx"]
        }
      ],
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

### 10.3 Add Custom Executors

Create custom executor for WASM builds in `tools/executors/wasm-pack/executor.ts`.

## Troubleshooting

### Common Issues

**Issue: Circular dependencies**

```bash
# Solution: Use nx graph to identify and break cycles
nx graph --file=graph.html
# Refactor shared code into new package
```

**Issue: Build failures**

```bash
# Solution: Check TypeScript path mappings
# Ensure tsconfig.base.json paths match package structure
```

**Issue: Slow builds**

```bash
# Solution: Enable caching and parallelization
nx.json: "parallel": 3
nx.json: "cache": true
```

**Issue: Import errors**

```bash
# Solution: Update import paths
# Old: from '../../core'
# New: from '@agent-control-plane/core'
```

## Success Metrics

Track these metrics post-migration:

1. **Build Time**: 60-80% reduction for incremental builds
2. **CI Time**: 50-70% reduction with affected commands
3. **Cache Hit Rate**: Target 70%+ for typical workflows
4. **Developer Experience**: Faster feedback loops
5. **Code Quality**: Better module boundaries

## Next Steps

After successful migration:

1. Enable Nx Cloud for team
2. Add more granular packages (split large packages)
3. Implement generators for common tasks
4. Set up dependency constraints
5. Enable distributed caching
6. Configure automated releases

## References

- [Nx Documentation](https://nx.dev)
- [Adding Nx to Existing Monorepo](https://nx.dev/recipes/adopting-nx/adding-to-monorepo)
- [TypeScript Monorepo](https://nx.dev/recipes/tips-n-tricks/typescript-monorepos)
- [PNPM Workspaces](https://pnpm.io/workspaces)
