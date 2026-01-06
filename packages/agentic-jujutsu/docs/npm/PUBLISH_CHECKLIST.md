# npm Publication Checklist for v0.1.1

## ✅ Pre-Publish Validation

### Build Verification

- [x] WASM builds successful for all 4 targets (web, node, bundler, deno)
- [x] All targets are 90KB (33KB gzipped)
- [x] TypeScript definitions generated
- [x] No build errors or warnings (cosmetic warnings OK)

### Testing

- [x] WASM tests passing (4/4)
- [x] Module loads in Node.js
- [x] TypeScript definitions valid
- [x] Examples work
- [x] Benchmarks run successfully

### Package Configuration

- [x] package.json version bumped to 0.1.1
- [x] Cargo.toml version bumped to 0.1.1
- [x] All exports configured correctly
- [x] Files array includes necessary files
- [x] Scripts configured (build, test, verify)
- [x] License file present
- [x] README.md comprehensive

### Documentation

- [x] README.md updated with features
- [x] Examples created (node, web)
- [x] API documentation present
- [x] Performance benchmarks documented
- [x] Installation instructions clear

### Integration

- [x] MCP server integration created
- [x] Agentic-flow AST integration added
- [x] Examples demonstrate usage
- [x] TypeScript support validated

## 📋 Publication Steps

### 1. Final Verification

```bash
# Clean build
npm run clean
npm run build

# Run all tests
npm test

# Verify package contents
npm pack --dry-run
```

### 2. Docker Testing

```bash
# Test in isolated environment
npm run test:docker
```

### 3. Local Package Testing

```bash
# Create tarball
npm pack

# Test installation in different directory
cd /tmp
npm install /path/to/agent-control-plane-jujutsu-0.1.1.tgz
node -e "console.log(require('@agent-control-plane/jujutsu'))"
```

### 4. Publish to npm

```bash
# Login to npm (if needed)
npm login

# Dry run
npm publish --dry-run

# Actual publish
npm publish --access public

# Verify published
npm view @agent-control-plane/jujutsu
```

### 5. Post-Publish Verification

```bash
# Install from registry
npm install @agent-control-plane/jujutsu@0.1.1

# Test npx usage (future)
npx @agent-control-plane/jujutsu --version
```

## 📊 Expected Results

### Package Size

- Unpacked: ~500KB
- Tarball: ~150KB

### Included Files

- pkg/ (all 4 targets)
- scripts/mcp-server.js
- scripts/agent-control-plane-integration.js
- examples/
- README.md
- CRATE_README.md
- LICENSE

### Exports Working

- ✅ `require('@agent-control-plane/jujutsu/node')`
- ✅ `import '@agent-control-plane/jujutsu/web'`
- ✅ `import '@agent-control-plane/jujutsu/bundler'`
- ✅ `import '@agent-control-plane/jujutsu/deno'`

## 🚨 Gotchas

1. **WASM files must be in package** - Ensure pkg/ is in files array
2. **Scripts need execute permissions** - chmod +x before publish
3. **Browser tests need HTTP server** - Can't test file:// protocol
4. **Deno needs .ts extension** - Different from other targets

## 📝 Post-Publish Tasks

- [ ] Update GitHub release notes
- [ ] Update RELEASE_SUMMARY.md
- [ ] Tag release: `git tag agentic-jujutsu-v0.1.1`
- [ ] Push tags: `git push --tags`
- [ ] Announce on Discord/Twitter
- [ ] Update main project README

## 🔗 Links

- npm: https://www.npmjs.com/package/@agent-control-plane/jujutsu
- crates.io: https://crates.io/crates/agentic-jujutsu
- GitHub: https://github.com/Aktoh-Cyber/agent-control-plane

---

**Status**: ✅ READY FOR PUBLICATION

All checks passed. Package is production-ready.
