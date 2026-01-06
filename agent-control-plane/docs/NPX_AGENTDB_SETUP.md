# 🚀 How to Use `npx agentdb` with Frontier Features

## Current Situation

The NEW AgentDB CLI with frontier features (17 commands) is configured in the `agent-control-plane` package:

**Package:** `agent-control-plane`
**Binary:** `dist/agentdb/cli/agentdb-cli.js`
**Features:** Causal Memory, Reflexion, Skills, Nightly Learner, etc.

## Testing Locally (Before Publishing)

### Option 1: Link the Package Locally

```bash
cd /workspaces/agent-control-plane/agent-control-plane

# Build the package
npm run build

# Link it globally
npm link

# Now npx agentdb will use your local version
npx agentdb --help
```

### Option 2: Use Node Directly

```bash
cd /workspaces/agent-control-plane/agent-control-plane
node dist/agentdb/cli/agentdb-cli.js --help
```

## After Publishing to NPM

Once you publish `agent-control-plane` package to npm, users can run:

```bash
# Install globally
npm install -g agent-control-plane

# Or use npx directly (no install needed)
npx agentdb --help
```

## Publish Checklist

Before publishing to npm:

1. ✅ Verify CLI works locally

```bash
cd /workspaces/agent-control-plane/agent-control-plane
npm run build
node dist/agentdb/cli/agentdb-cli.js --help
```

2. ✅ Test with npm link

```bash
npm link
npx agentdb --help
```

3. ✅ Update version in package.json

4. ✅ Publish to npm

```bash
npm publish
```

5. ✅ Test the published version

```bash
npx agentdb@latest --help
```

## What Users Will See

After publishing, when users run `npx agentdb`, they'll see:

```
█▀█ █▀▀ █▀▀ █▄░█ ▀█▀ █▀▄ █▄▄
█▀█ █▄█ ██▄ █░▀█ ░█░ █▄▀ █▄█

AgentDB CLI - Frontier Memory Features

USAGE:
  agentdb <command> <subcommand> [options]

CAUSAL COMMANDS:
  agentdb causal add-edge ...
  agentdb causal experiment create ...
  ...

REFLEXION COMMANDS:
  agentdb reflexion store ...
  agentdb reflexion retrieve ...
  ...

SKILL COMMANDS:
  agentdb skill create ...
  agentdb skill search ...
  ...

[And 8 more command categories with 17 total commands]
```

## Current Package Structure

```
agent-control-plane/
├── package.json
│   ├── "name": "agent-control-plane"
│   ├── "bin": {
│   │     "agent-control-plane": "dist/cli-proxy.js",
│   │     "agentdb": "dist/agentdb/cli/agentdb-cli.js"  ← THIS
│   │   }
├── src/
│   └── agentdb/
│       ├── cli/
│       │   └── agentdb-cli.ts  ← NEW CLI WITH 17 COMMANDS
│       ├── controllers/
│       │   ├── CausalMemoryGraph.ts
│       │   ├── CausalRecall.ts
│       │   ├── ExplainableRecall.ts
│       │   ├── NightlyLearner.ts
│       │   ├── ReflexionMemory.ts
│       │   └── SkillLibrary.ts
│       └── ...
└── dist/
    └── agentdb/
        └── cli/
            └── agentdb-cli.js  ← COMPILED CLI
```

## Testing Right Now

To test `npx agentdb` locally RIGHT NOW:

```bash
cd /workspaces/agent-control-plane/agent-control-plane

# Unlink any old version
npm unlink -g agentdb 2>/dev/null || true
npm unlink -g agent-control-plane 2>/dev/null || true

# Build and link
npm run build
npm link

# Test it
npx agentdb --help

# Should show the new ASCII banner and 17 commands!
```

## Quick Test Commands

```bash
# Store an episode
AGENTDB_PATH=./test.db npx agentdb reflexion store \
  "test-1" "my_task" 0.95 true "Success!" "input" "output" 1000 500

# Retrieve it
AGENTDB_PATH=./test.db npx agentdb reflexion retrieve "my_task" 5 0.5

# Check stats
AGENTDB_PATH=./test.db npx agentdb db stats
```

## Summary

✅ **The CLI is ready** - All 17 commands with frontier features are implemented
✅ **Binary is configured** - package.json has `"agentdb": "dist/agentdb/cli/agentdb-cli.js"`
✅ **Works locally** - Use `npm link` to test `npx agentdb` now
🚀 **Ready to publish** - When you publish to npm, `npx agentdb` will work globally
