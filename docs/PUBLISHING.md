# NPM Publishing Guide for Agentic Flow

## 📦 Package Structure

This is a monorepo containing three npm packages:

- **agent-control-plane** (main): Core orchestration platform
- **agent-booster**: Ultra-fast local code transformations
- **reasoningbank**: Learning memory system

## 🚀 Pre-Publishing Checklist

### 1. Version Management

```bash
# Update version in all package.json files
# Root: /package.json
# Main: /agent-control-plane/package.json
# Booster: /agent-booster/package.json
# ReasoningBank: /reasoningbank/package.json

# Follow semantic versioning
npm version patch  # 1.10.0 -> 1.10.1
npm version minor  # 1.10.0 -> 1.11.0
npm version major  # 1.10.0 -> 2.0.0
```

### 2. Build All Packages

```bash
# Build main package
cd agent-control-plane
npm run build

# Build agent-booster
cd ../agent-booster
npm run build

# Build reasoningbank
cd ../reasoningbank
npm run build

# Or build all from root
cd ..
npm run build
```

### 3. Run Tests

```bash
# Test main package
cd agent-control-plane
npm test

# Test from root (runs all tests)
cd ..
npm test
```

### 4. Verify Package Contents

```bash
# Dry run to see what will be published
npm pack --dry-run

# Create tarball for inspection
npm pack
tar -tzf agent-control-plane-1.10.0.tgz
```

### 5. Update Documentation

- [ ] Update CHANGELOG.md with new features/fixes
- [ ] Update README.md if API changed
- [ ] Update version badges in README.md
- [ ] Verify all documentation links work

## 📤 Publishing Steps

### Option 1: Standard Publishing

```bash
# Login to npm (one-time)
npm login

# Publish from root (publishes main package)
npm publish

# Publish sub-packages if needed
cd agent-booster && npm publish
cd ../reasoningbank && npm publish
```

### Option 2: Beta/Alpha Publishing

```bash
# Publish as beta
npm version prerelease --preid=beta
npm publish --tag beta

# Publish as alpha
npm version prerelease --preid=alpha
npm publish --tag alpha

# Users install with:
npm install agent-control-plane@beta
npm install agent-control-plane@alpha
```

### Option 3: Automated Publishing (CI/CD)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## ✅ Post-Publishing Verification

### 1. Install and Test

```bash
# Create test directory
mkdir /tmp/agent-control-plane-test
cd /tmp/agent-control-plane-test

# Install published package
npm init -y
npm install agent-control-plane

# Test CLI
npx agent-control-plane --version
npx agentdb --version

# Test imports
node -e "const af = require('agent-control-plane'); console.log('✓ Main package loads');"
node -e "const rb = require('agent-control-plane/reasoningbank'); console.log('✓ ReasoningBank loads');"
node -e "const router = require('agent-control-plane/router'); console.log('✓ Router loads');"
```

### 2. Verify on npmjs.com

- [ ] Package page shows correct version
- [ ] README renders properly
- [ ] All keywords are visible
- [ ] License is correct (MIT)
- [ ] Repository link works

### 3. Update GitHub Release

```bash
# Create GitHub release matching npm version
git tag v1.10.0
git push origin v1.10.0

# Or use GitHub CLI
gh release create v1.10.0 \
  --title "v1.10.0 - Agent Booster & ReasoningBank" \
  --notes "See CHANGELOG.md for details"
```

## 🔧 Package Configuration

### Files Included in Package

As defined in `/package.json` `files` array:

```json
{
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

### Files Excluded via .npmignore

- Source code (`src/`)
- Tests (`tests/`, `*.test.ts`)
- Build artifacts (`*.tsbuildinfo`)
- Docker files
- CI/CD configs
- Development tools

## 🐛 Common Issues

### Issue: "Package size too large"

**Solution**: Check .npmignore and remove unnecessary files

```bash
# Check package size
npm pack --dry-run | grep "package size"

# Should be < 10MB for fast installs
```

### Issue: "Missing bin files"

**Solution**: Ensure CLI files have shebang and are executable

```bash
# Check bin files
cat agent-control-plane/dist/cli-proxy.js | head -1
# Should show: #!/usr/bin/env node

# Make executable
chmod +x agent-control-plane/dist/cli-proxy.js
chmod +x agent-control-plane/dist/agentdb/cli/agentdb-cli.js
```

### Issue: "Import errors after publishing"

**Solution**: Verify exports in package.json match built files

```bash
# Check exports exist
ls agent-control-plane/dist/index.js
ls agent-control-plane/dist/reasoningbank/index.js
ls agent-control-plane/dist/router/index.js
```

### Issue: "TypeScript types not working"

**Solution**: Ensure declarations are built and paths are correct

```bash
# Check .d.ts files exist
find agent-control-plane/dist -name "*.d.ts" | head -5

# Verify types field in package.json
grep '"types"' package.json
```

## 📊 Package Metrics

After publishing, monitor:

- **Downloads**: npm.stat.com
- **Bundle size**: bundlephobia.com
- **Dependencies**: snyk.io/test/npm/agent-control-plane
- **TypeScript support**: arethetypeswrong.github.io

## 🔐 Security

### Before Publishing

```bash
# Audit dependencies
npm audit

# Check for secrets
grep -r "sk-ant-" . --exclude-dir=node_modules
grep -r "API_KEY" . --exclude-dir=node_modules

# Scan with snyk
npx snyk test
```

### NPM Token Security

```bash
# Use granular access tokens
# Settings → Access Tokens → Generate New Token
# Type: Automation (for CI/CD) or Publish (for manual)

# Add to CI/CD secrets
# Never commit tokens to git
```

## 📈 Release Checklist

- [ ] Version bumped in all package.json files
- [ ] CHANGELOG.md updated
- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Package size verified (`npm pack --dry-run`)
- [ ] No secrets in code (`grep -r "sk-ant"`)
- [ ] Dependencies audited (`npm audit`)
- [ ] Dry run reviewed (`npm publish --dry-run`)
- [ ] Published to npm (`npm publish`)
- [ ] GitHub release created
- [ ] Installation tested in clean environment
- [ ] Documentation updated on GitHub

## 🎯 Quick Publish

```bash
#!/bin/bash
# publish.sh - Quick publish script

set -e

echo "🔍 Pre-flight checks..."
npm run lint
npm run typecheck
npm test

echo "🏗️  Building packages..."
npm run build

echo "📦 Creating package preview..."
npm pack --dry-run

echo "🚀 Publishing to npm..."
npm publish

echo "✅ Published successfully!"
echo "📝 Don't forget to create GitHub release:"
echo "   gh release create v$(node -p \"require('./package.json').version\")"
```

Make executable:

```bash
chmod +x publish.sh
```

## 📚 Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm Package Best Practices](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [TypeScript Package Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)

---

**Author**: ruv (@ruvnet)
**Package**: [agent-control-plane](https://www.npmjs.com/package/agent-control-plane)
**Repository**: [github.com/Aktoh-Cyber/agent-control-plane](https://github.com/Aktoh-Cyber/agent-control-plane)
