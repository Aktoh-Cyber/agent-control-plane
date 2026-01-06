# NPM Package Structure - Agentic Flow

## 📦 Package Overview

**Package Name**: `agent-control-plane`
**Version**: 1.10.0
**Author**: ruv (@ruvnet)
**License**: MIT
**Repository**: https://github.com/Aktoh-Cyber/agent-control-plane

## 🏗️ Package Structure

```
agent-control-plane/
├── package.json                      # Root package configuration
├── tsconfig.json                     # Root TypeScript config
├── .npmrc                            # NPM configuration
├── .npmignore                        # NPM publish exclusions
├── LICENSE                           # MIT license
├── README.md                         # Main documentation
├── CHANGELOG.md                      # Version history
│
├── agent-control-plane/                     # Main package directory
│   ├── package.json                  # Main package metadata
│   ├── config/
│   │   └── tsconfig.json            # Build TypeScript config
│   ├── src/                         # Source code (excluded from npm)
│   │   ├── index.ts
│   │   ├── agentdb/
│   │   ├── reasoningbank/
│   │   ├── router/
│   │   ├── agent-booster/
│   │   ├── transport/quic.ts
│   │   └── cli-proxy.ts
│   ├── dist/                        # Built output (published)
│   │   ├── index.js
│   │   ├── index.d.ts
│   │   ├── cli-proxy.js
│   │   └── ...
│   ├── docs/                        # Documentation (published)
│   ├── .claude/                     # Claude Code config (published)
│   ├── wasm/                        # WASM binaries (published)
│   ├── certs/                       # TLS certificates (published)
│   └── scripts/
│       └── postinstall.js           # Post-install hook (published)
│
├── agent-booster/                    # Sub-package (published dist only)
│   ├── package.json
│   └── dist/
│
├── reasoningbank/                    # Sub-package (published dist only)
│   ├── package.json
│   └── dist/
│
├── scripts/                          # Build/publish scripts (not published)
│   ├── build-all.sh
│   ├── verify-package.sh
│   └── quick-publish.sh
│
└── docs/                             # Documentation (not published)
    ├── PUBLISHING.md
    └── NPM-PACKAGE-STRUCTURE.md
```

## 📋 Package Configuration

### Root package.json

```json
{
  "name": "agent-control-plane",
  "version": "1.10.0",
  "description": "Production-ready AI agent orchestration platform...",
  "type": "module",
  "main": "agent-control-plane/dist/index.js",
  "types": "agent-control-plane/dist/index.d.ts",
  "bin": {
    "agent-control-plane": "agent-control-plane/dist/cli-proxy.js",
    "agentdb": "agent-control-plane/dist/agentdb/cli/agentdb-cli.js"
  },
  "exports": {
    ".": "./agent-control-plane/dist/index.js",
    "./reasoningbank": "./agent-control-plane/dist/reasoningbank/index.js",
    "./router": "./agent-control-plane/dist/router/index.js",
    "./agent-booster": "./agent-control-plane/dist/agent-booster/index.js",
    "./transport/quic": "./agent-control-plane/dist/transport/quic.js",
    "./agentdb": "./agent-control-plane/dist/agentdb/index.js"
  },
  "files": [
    "agent-control-plane/dist",
    "agent-control-plane/docs",
    "agent-control-plane/.claude",
    "agent-control-plane/wasm",
    "agent-control-plane/certs",
    "agent-control-plane/scripts",
    "agent-booster/dist",
    "reasoningbank/dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ]
}
```

### Entry Points

#### CLI Commands

```bash
# Main CLI
agent-control-plane --agent coder --task "Build API"

# AgentDB CLI
agentdb reflexion store "session-1" "task-1" 0.95 true "Success"
```

#### Programmatic Imports

```javascript
// Main package
import AgenticFlow from 'agent-control-plane';

// ReasoningBank
import * as reasoningbank from 'agent-control-plane/reasoningbank';

// Model Router
import { ModelRouter } from 'agent-control-plane/router';

// Agent Booster
import { AgentBooster } from 'agent-control-plane/agent-booster';

// QUIC Transport
import { QuicTransport } from 'agent-control-plane/transport/quic';

// AgentDB
import { ReflexionMemory, SkillLibrary } from 'agent-control-plane/agentdb';
```

## 🔧 Build System

### TypeScript Configuration

**Root tsconfig.json** (for development)

- Strict type checking
- Full source maps
- Declaration files

**agent-control-plane/config/tsconfig.json** (for production build)

- Relaxed strict mode for compatibility
- Optimized output
- Bundler module resolution

### Build Scripts

```bash
# Build all packages
npm run build
# Internally runs:
#   - npm run build:main      (builds agent-control-plane)
#   - npm run build:packages  (builds agent-booster, reasoningbank)

# Build main package only
npm run build:main

# Build with verification
bash scripts/build-all.sh
```

## 📦 Publishing Workflow

### 1. Automated Verification

```bash
# Verify package is ready
bash scripts/verify-package.sh

# Checks:
# ✓ package.json validity
# ✓ Version format (semver)
# ✓ Required fields (name, author, license)
# ✓ Built files exist
# ✓ CLI executables have shebangs
# ✓ No secrets in code
# ✓ Documentation present
# ✓ Package size < 10MB
```

### 2. Quick Publish

```bash
# Full publish workflow (lint, build, test, publish)
bash scripts/quick-publish.sh

# Dry run (preview without publishing)
bash scripts/quick-publish.sh --dry-run

# Skip tests (faster)
bash scripts/quick-publish.sh --skip-tests
```

### 3. Manual Publishing

```bash
# 1. Build
npm run build

# 2. Test
npm test

# 3. Preview what will be published
npm pack --dry-run

# 4. Publish
npm publish
```

## 🔍 Quality Assurance

### Pre-Publish Checks

- ✅ TypeScript compilation succeeds
- ✅ All tests pass
- ✅ No linting errors
- ✅ No secrets in code
- ✅ Package size optimized
- ✅ Dependencies audited
- ✅ Documentation updated

### Files Excluded from Package

Via `.npmignore`:

- Source code (`src/`, `*.ts`)
- Tests (`tests/`, `*.test.*`)
- Build artifacts (`*.tsbuildinfo`, `target/`)
- Docker files (`Dockerfile*`, `docker-compose*.yml`)
- CI/CD configs (`.github/`)
- Development tools (`benchmarks/`, `examples/`)
- Rust artifacts (`*.rs`, `Cargo.toml`, `*.rlib`)
- Database files (`*.db`, `*.sqlite`)
- Environment files (`.env*`)
- Large directories (`node_modules/`, `crates/`)

### Files Included in Package

Via `files` field in package.json:

- ✅ `agent-control-plane/dist/` - Main compiled code
- ✅ `agent-control-plane/docs/` - API documentation
- ✅ `agent-control-plane/.claude/` - Claude Code configuration
- ✅ `agent-control-plane/wasm/` - WebAssembly binaries
- ✅ `agent-control-plane/certs/` - TLS certificates
- ✅ `agent-control-plane/scripts/postinstall.js` - Post-install hook
- ✅ `agent-booster/dist/` - Agent Booster compiled code
- ✅ `reasoningbank/dist/` - ReasoningBank compiled code
- ✅ `README.md` - Main documentation
- ✅ `LICENSE` - MIT license
- ✅ `CHANGELOG.md` - Version history

## 🚀 Installation & Usage

### Installation

```bash
# Global installation
npm install -g agent-control-plane

# Local installation
npm install agent-control-plane

# With optional MCP servers
npm install agent-control-plane gendev agentic-cloud
```

### Verification

```bash
# Check installation
agent-control-plane --version
agentdb --version

# Test CLI
agent-control-plane --list
agentdb --help

# Test programmatic import
node -e "const af = require('agent-control-plane'); console.log('✓ Loaded successfully');"
```

## 📊 Package Metrics

### Size Optimization

| Component     | Size        |
| ------------- | ----------- |
| Main package  | ~2-3 MB     |
| Agent Booster | ~500 KB     |
| ReasoningBank | ~1-2 MB     |
| **Total**     | **~4-6 MB** |

### Dependencies

**Production Dependencies**: 24

- Core: @anthropic-ai/claude-agent-sdk, @anthropic-ai/sdk
- Memory: agentdb, better-sqlite3
- LLM: @google/genai, @xenova/transformers
- Web: express, axios, ws
- Utils: dotenv, tiktoken, zod, yaml

**Peer Dependencies** (optional): 2

- gendev (^2.7.0)
- agentic-cloud (^1.0.0)

## 🔐 Security

### Secret Detection

The package includes automated secret scanning:

```bash
# Scan for API keys
grep -r "sk-ant-" . --exclude-dir=node_modules
grep -r "ANTHROPIC_API_KEY.*sk-ant" . --exclude-dir=node_modules
```

### Environment Variables

Never hardcoded in package:

- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_API_KEY`
- Database credentials
- API endpoints with secrets

## 📚 Documentation

- **README.md**: Overview, quick start, features
- **CHANGELOG.md**: Version history and changes
- **LICENSE**: MIT license
- **docs/PUBLISHING.md**: Complete publishing guide
- **docs/NPM-PACKAGE-STRUCTURE.md**: This document
- **agent-control-plane/docs/**: API documentation and examples

## 🔗 Links

- **NPM**: https://www.npmjs.com/package/agent-control-plane
- **GitHub**: https://github.com/Aktoh-Cyber/agent-control-plane
- **Issues**: https://github.com/Aktoh-Cyber/agent-control-plane/issues
- **Author**: [@ruvnet](https://github.com/ruvnet)

## 🛠️ Maintenance

### Version Bumping

```bash
# Patch version (1.10.0 -> 1.10.1)
npm version patch

# Minor version (1.10.0 -> 1.11.0)
npm version minor

# Major version (1.10.0 -> 2.0.0)
npm version major
```

### Publishing Checklist

- [ ] Version bumped in all package.json files
- [ ] CHANGELOG.md updated
- [ ] All tests passing
- [ ] Build successful
- [ ] No secrets in code
- [ ] Dependencies audited
- [ ] Documentation updated
- [ ] Package verified (`bash scripts/verify-package.sh`)
- [ ] Dry run successful (`npm publish --dry-run`)
- [ ] Published (`npm publish`)
- [ ] GitHub release created
- [ ] Installation tested

---

**Maintained by**: ruv (@ruvnet)
**Last Updated**: 2025-01-08
