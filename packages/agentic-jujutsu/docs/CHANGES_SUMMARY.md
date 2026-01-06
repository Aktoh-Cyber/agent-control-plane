# Changes Summary - Making agentic-jujutsu Real (Not Simulated)

**Date**: 2025-11-10
**Issue**: Package showed "simulation" messages instead of executing real jj operations
**Solution**: Fixed CLI to execute real jj binary + added automatic installation

---

## Problem

The `agentic-jujutsu` package was confusing users by showing:

```
Simulated jj status
This is a WASM simulation. Install jj for real operations:
  https://github.com/martinvonz/jj
```

Even though the package **could** execute real `jj` commands if the binary was installed.

### Root Cause

1. **CLI bypassed real execution**: `bin/cli.js` had hardcoded simulation messages that never called the actual jj binary
2. **No installation guidance**: Users didn't know they needed to install jj separately
3. **Architecture unclear**: Documentation didn't explain that this is a wrapper, not a standalone tool

---

## Changes Made

### 1. Fixed CLI to Execute Real jj Commands

**File**: `bin/cli.js`

**Before**:

```javascript
} else if (command === 'status' || command === 'log' || command === 'diff') {
  console.log(`Simulated jj ${command}`);
  console.log(`This is a WASM simulation...`);
}
```

**After**:

```javascript
} else if (command === 'status' || command === 'log' || command === 'diff' ...) {
  executeJJCommand(command, args.slice(1));
}

async function executeJJCommand(command, extraArgs = []) {
  // Try to execute real jj command
  const { stdout, stderr } = await execAsync(`jj ${fullArgs.join(' ')}`);

  // If jj not found, show installation instructions
  if (error.code === 'ENOENT') {
    // Show helpful installation guide
  }
}
```

**Result**: Now executes **real** jj operations when the binary is installed!

### 2. Added Automatic Installation Script

**File**: `scripts/install-jj.js` (NEW)

Features:

- Detects if jj is already installed
- Checks for Cargo availability
- Optionally auto-installs jj via Cargo
- Shows clear installation instructions
- Respects environment variables for control

**Integration**: Added as `postinstall` hook in `package.json`

```json
{
  "scripts": {
    "postinstall": "node scripts/install-jj.js"
  }
}
```

### 3. Updated WASM Module Documentation

**File**: `src/wasm.rs`

**Added**:

- Clear comments explaining this is for browser/WASM environments only
- Console warnings indicating simulation mode
- Documentation on when to use real vs simulated operations

**Before**:

```rust
//! WASM implementation with simulated command execution
```

**After**:

```rust
//! WASM implementation with simulated command execution
//!
//! ## Architecture Note
//!
//! This module provides **simulated** jj command execution for WASM/browser environments
//! where direct CLI execution is not possible. For real jj operations, use:
//!
//! - **Node.js/CLI**: The `bin/cli.js` executes the real `jj` binary if installed
//! - **Native Rust**: The `native.rs` module uses async-process for real command execution
//! - **Browser/WASM**: This module returns realistic mock data for demos and testing
```

### 4. Created Comprehensive Documentation

**File**: `docs/INSTALLATION.md` (NEW)

Sections:

- Quick Install (3 methods)
- Installation Methods for jj Binary
- npm Package Installation
- Environment Variables
- Verification Steps
- Architecture Explanation
- Troubleshooting Guide
- Platform-Specific Notes
- CI/CD Setup Examples

### 5. Updated Main README

**File**: `README.md`

Added sections:

- **Installation** (🔧) - Complete installation guide with 3 methods
- **Architecture** (🏗️) - Visual diagram explaining npm package vs jj binary
- **Updated Quick Start** - Now mentions jj binary requirement
- **Navigation** - Added links to new sections

**Key additions**:

```markdown
## 🔧 Installation

### Prerequisites

This package is a **wrapper** around jujutsu VCS. You need both:

1. **agentic-jujutsu** (npm package) - Provides CLI, WASM bindings, MCP integration
2. **jj** (binary) - The actual Jujutsu VCS
```

### 6. Updated package.json

**Changes**:

1. Added `postinstall` script
2. Included `scripts/install-jj.js` in files array

```json
{
  "files": [
    "pkg/",
    "bin/",
    "scripts/mcp-server.js",
    "scripts/agent-control-plane-integration.js",
    "scripts/install-jj.js",  // ← NEW
    ...
  ],
  "scripts": {
    "postinstall": "node scripts/install-jj.js",  // ← NEW
    ...
  }
}
```

---

## Environment Variables

Users can now control installation behavior:

### `AGENTIC_JUJUTSU_AUTO_INSTALL`

Enable automatic jj installation:

```bash
export AGENTIC_JUJUTSU_AUTO_INSTALL=true
npm install -g agentic-jujutsu
```

### `AGENTIC_JUJUTSU_SKIP_INSTALL`

Skip postinstall check entirely:

```bash
export AGENTIC_JUJUTSU_SKIP_INSTALL=true
npm install -g agentic-jujutsu
```

### `CI`

Automatically detected in CI environments, skips installation prompts.

---

## User Experience Flow

### Before (Confusing)

```bash
$ npx agentic-jujutsu status
Simulated jj status
This is a WASM simulation. Install jj for real operations:
  https://github.com/martinvonz/jj
```

❌ User thinks it doesn't work
❌ Unclear what to do next
❌ Doesn't know about jj binary requirement

### After (Clear)

#### Scenario 1: jj Already Installed

```bash
$ npx agentic-jujutsu status
Executing: jj status

The working copy is clean
Working copy : qpvuntsm 12345678 (empty) (no description set)
Parent commit: zzzzzzzz 00000000 (empty) (no description set)
```

✅ Real jj execution
✅ Actual repository status
✅ Works as expected

#### Scenario 2: jj Not Installed

```bash
$ npx agentic-jujutsu status
Executing: jj status

✗ jj not found on your system

Installation Options:

1️⃣  Cargo (Recommended):
   cargo install --git https://github.com/martinvonz/jj jj-cli

2️⃣  Homebrew (macOS):
   brew install jj

3️⃣  From source:
   git clone https://github.com/martinvonz/jj
   cd jj && cargo build --release

Learn more: https://github.com/martinvonz/jj#installation

Note: This package provides a wrapper around jj with AI agent features.
      The jj binary must be installed separately.
```

✅ Clear error message
✅ Multiple installation options
✅ Explains the architecture
✅ Helpful guidance

#### Scenario 3: npm Install with Auto-Install

```bash
$ export AGENTIC_JUJUTSU_AUTO_INSTALL=true
$ npm install -g agentic-jujutsu

> agentic-jujutsu@1.0.0 postinstall
> node scripts/install-jj.js

🔍 Checking for jj installation...
❌ jj not found on system

💡 agentic-jujutsu can attempt to install jj automatically.
✅ Cargo detected - can install via Cargo

📦 Installing jj via Cargo...
This may take 5-10 minutes on first install.

[... cargo output ...]

✅ jj installed successfully via Cargo!
✅ agentic-jujutsu is ready to use!
```

✅ Automatic installation
✅ Clear progress
✅ Works immediately after install

---

## Architecture Clarification

### What This Package Is

```
agentic-jujutsu = Wrapper + Features
                  │
                  ├─ Wraps the jj binary
                  ├─ Adds MCP protocol support
                  ├─ Provides WASM bindings
                  ├─ AST transformation for AI
                  └─ CLI with enhanced features
```

### What This Package Is NOT

- ❌ Not a standalone VCS
- ❌ Not a jj reimplementation
- ❌ Not a simulation (in Node.js/CLI mode)
- ❌ Not independent of jj binary

### How It Works

1. User runs: `npx agentic-jujutsu status`
2. npm executes: `bin/cli.js`
3. CLI checks: Is `jj` binary available?
4. If yes: Executes real `jj status` command
5. If no: Shows installation instructions
6. Returns: Real jj output + AI agent metadata

---

## Testing

### Commands Tested

```bash
# ✅ Help system
npx agentic-jujutsu help

# ✅ Version check
npx agentic-jujutsu version

# ✅ Installation script
node scripts/install-jj.js

# ✅ Real operations (with jj installed)
npx agentic-jujutsu status
npx agentic-jujutsu log --limit 5
npx agentic-jujutsu diff

# ✅ Installation instructions (without jj)
npx agentic-jujutsu status
# Shows clear installation guide
```

---

## Files Modified

### New Files

- `scripts/install-jj.js` - Automatic installation script
- `docs/INSTALLATION.md` - Comprehensive installation guide
- `docs/CHANGES_SUMMARY.md` - This file

### Modified Files

- `bin/cli.js` - Execute real jj commands instead of simulations
- `src/wasm.rs` - Better documentation and warnings
- `package.json` - Added postinstall hook
- `README.md` - Added Installation and Architecture sections

---

## Benefits

### For Users

1. **Clear expectations**: Know exactly what needs to be installed
2. **Easy setup**: Multiple installation methods with automatic option
3. **Real operations**: Execute actual jj commands, not simulations
4. **Better errors**: Helpful messages when something is missing

### For AI Agents

1. **Real VCS operations**: Agents can use actual version control
2. **Reliable behavior**: Consistent with jj documentation
3. **Better integration**: MCP protocol works with real operations

### For Developers

1. **Maintainable**: Clear separation between wrapper and VCS
2. **Extensible**: Easy to add more features to wrapper
3. **Documented**: Architecture is well-explained
4. **Testable**: Can test with and without jj binary

---

## Next Steps

### Future Improvements

1. **Prebuilt binaries**: Download precompiled jj binaries instead of compiling
2. **Version management**: Support multiple jj versions
3. **Integration tests**: Automated tests with real jj repository
4. **Performance monitoring**: Track operation times

### Recommended for Next Release

1. Implement prebuilt binary downloads (currently shows TODO)
2. Add CI workflow to test with real jj operations
3. Create video tutorial showing installation process
4. Add troubleshooting FAQ based on user feedback

---

## Summary

### Problem Fixed ✅

- ❌ Was showing "simulation" messages
- ✅ Now executes real jj operations

### User Experience ✅

- ❌ Was confusing and unclear
- ✅ Now clear, helpful, and actionable

### Architecture ✅

- ❌ Was undocumented
- ✅ Now well-explained with diagrams

### Installation ✅

- ❌ Was manual and unclear
- ✅ Now automatic with multiple options

**Result**: `agentic-jujutsu` is now a professional, production-ready wrapper around jujutsu VCS with excellent documentation and user experience.
