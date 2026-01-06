# NPM Publish Guide - agent-control-plane v1.2.0

**Release Date:** 2025-10-06
**Version:** 1.2.0 (from 1.1.14)
**Major Feature:** MCP CLI for user-friendly server configuration

---

## Pre-Publish Checklist

### ✅ Code & Build

- [x] TypeScript compilation successful
- [x] All tests passing
- [x] Build artifacts verified in `dist/`
- [x] `dist/cli/mcp-manager.js` present and working
- [x] CLI help displays correctly

### ✅ Version & Documentation

- [x] `package.json` version updated to 1.2.0
- [x] Package description updated with v1.2.0 feature
- [x] Root README.md updated
- [x] NPM README.md updated
- [x] User guide created (ADDING-MCP-SERVERS-CLI.md)
- [x] Developer guide created (ADDING-MCP-SERVERS.md)
- [x] Validation reports created

### ✅ Git & GitHub

- [x] All changes committed
- [x] Pushed to remote branch
- [x] Pull request created (#4)
- [x] PR description comprehensive

### ⏳ NPM Publish Preparation

- [ ] Merge PR to main (or publish from feature branch)
- [ ] NPM credentials configured
- [ ] Ready to publish

---

## What's New in v1.2.0

### 🚀 Major Feature: MCP CLI Manager

**End users can now add custom MCP servers without editing code!**

#### New Commands

```bash
# Add MCP server (Claude Desktop style)
npx agent-control-plane mcp add weather '{"command":"npx","args":["-y","weather-mcp"]}'

# Add MCP server (simple flags)
npx agent-control-plane mcp add github --npm @modelcontextprotocol/server-github

# List configured servers
npx agent-control-plane mcp list

# Enable/disable servers
npx agent-control-plane mcp enable weather
npx agent-control-plane mcp disable weather
```

#### Key Benefits

- ✅ No TypeScript knowledge required
- ✅ No code editing required
- ✅ No rebuilding required
- ✅ Compatible with Claude Desktop JSON config
- ✅ Configuration stored in `~/.agent-control-plane/mcp-config.json`
- ✅ Automatic loading in all agents

### 🔧 Technical Improvements

- New CLI tool: `src/cli/mcp-manager.ts` (617 lines)
- Auto-load config in agents: `src/agents/claudeAgent.ts`
- Comprehensive documentation (5 new docs)
- Live validation with strange-loops MCP server

### 📚 Documentation

- User guide: `docs/guides/ADDING-MCP-SERVERS-CLI.md`
- Developer guide: `docs/guides/ADDING-MCP-SERVERS.md`
- Validation reports in `docs/mcp-validation/`
- Updated README files

---

## NPM Publish Commands

### Option 1: Publish from Feature Branch (Current State)

**Current branch:** `feat/provider-optimization-and-mcp-integration`

```bash
# Make sure you're in the right directory
cd /workspaces/agent-control-plane/agent-control-plane

# Verify build artifacts
ls -l dist/cli/mcp-manager.js

# Verify version
cat package.json | grep version

# Check NPM login status
npm whoami

# Publish to NPM
npm publish

# Or publish as beta first
npm publish --tag beta
```

### Option 2: Publish from Main Branch (After PR Merge)

```bash
# Merge PR first
gh pr merge 4 --merge

# Switch to main
git checkout main
git pull origin main

# Verify everything
npm run build
npm test

# Publish
cd agent-control-plane
npm publish
```

### Option 3: Publish with Specific Tag

```bash
# Publish as beta
npm publish --tag beta

# Publish as latest (default)
npm publish --tag latest

# Publish as next
npm publish --tag next
```

---

## Post-Publish Steps

### 1. Verify NPM Package

```bash
# Check package is live
npm view agent-control-plane

# Check specific version
npm view agent-control-plane@1.2.0

# Test installation
npx agent-control-plane@1.2.0 --version
```

### 2. Test New Feature

```bash
# Test MCP CLI
npx agent-control-plane@1.2.0 mcp --help

# Add test server
npx agent-control-plane@1.2.0 mcp add test-server '{"command":"echo","args":["test"]}'

# List servers
npx agent-control-plane@1.2.0 mcp list
```

### 3. Create GitHub Release

**Via GitHub CLI:**

````bash
gh release create v1.2.0 \
  --title "v1.2.0 - MCP CLI for User-Friendly Configuration" \
  --notes "$(cat <<'EOF'
# agent-control-plane v1.2.0

## 🚀 Major Feature: MCP CLI Manager

End users can now add custom MCP servers without editing code!

### New Commands

```bash
# Add MCP server (Claude Desktop style JSON config)
npx agent-control-plane mcp add weather '{"command":"npx","args":["-y","weather-mcp"]}'

# Add MCP server (simple flags)
npx agent-control-plane mcp add github --npm @modelcontextprotocol/server-github

# List configured servers
npx agent-control-plane mcp list
````

### Key Features

✅ No code editing required
✅ Compatible with Claude Desktop config format
✅ Configuration stored in `~/.agent-control-plane/mcp-config.json`
✅ Automatic loading in all agents
✅ 100% backward compatible

### Documentation

- **User Guide:** [ADDING-MCP-SERVERS-CLI.md](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/agent-control-plane/docs/guides/ADDING-MCP-SERVERS-CLI.md)
- **Developer Guide:** [ADDING-MCP-SERVERS.md](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/agent-control-plane/docs/guides/ADDING-MCP-SERVERS.md)
- **Validation Report:** [MCP-CLI-VALIDATION-REPORT.md](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/agent-control-plane/docs/mcp-validation/MCP-CLI-VALIDATION-REPORT.md)

### What's Changed

- **New:** MCP CLI Manager (`src/cli/mcp-manager.ts`)
- **Enhanced:** Agent integration with auto-load config
- **Added:** Comprehensive documentation and validation
- **Updated:** README files with MCP CLI examples

### Breaking Changes

None. Purely additive feature.

### Installation

```bash
npm install -g agent-control-plane@1.2.0
```

Or use with npx:

```bash
npx agent-control-plane@1.2.0 mcp add my-server --npm my-mcp-package
```

### Full Changelog

See PR #4: https://github.com/Aktoh-Cyber/agent-control-plane/pull/4
EOF
)"

````

**Or via GitHub Web UI:**
1. Go to https://github.com/Aktoh-Cyber/agent-control-plane/releases/new
2. Tag: `v1.2.0`
3. Title: `v1.2.0 - MCP CLI for User-Friendly Configuration`
4. Copy release notes from above

### 4. Announce Release

**NPM Page:**
- https://www.npmjs.com/package/agent-control-plane

**GitHub:**
- https://github.com/Aktoh-Cyber/agent-control-plane

**Social/Community:**
- Tweet/post about new feature
- Update project README badges
- Notify users in Discord/Slack/forums

---

## Rollback Plan (If Issues Found)

### Unpublish (within 72 hours)
```bash
# Unpublish specific version
npm unpublish agent-control-plane@1.2.0

# Note: After 72 hours, can only deprecate
````

### Deprecate (after 72 hours)

```bash
# Mark version as deprecated
npm deprecate agent-control-plane@1.2.0 "Contains critical bug, use v1.2.1 instead"
```

### Quick Fix and Republish

```bash
# Fix issue
# Update version to 1.2.1
npm version patch  # Updates to 1.2.1

# Rebuild and publish
npm run build
npm publish
```

---

## Version History

| Version | Date       | Key Feature                               |
| ------- | ---------- | ----------------------------------------- |
| 1.2.0   | 2025-10-06 | MCP CLI for user-friendly configuration   |
| 1.1.14  | 2025-10-05 | Fixed OpenRouter proxy (80% success rate) |
| 1.1.13  | 2025-10-04 | Context-aware OpenRouter proxy            |
| ...     | ...        | ...                                       |

---

## Files Included in NPM Package

### Source Files (dist/)

- `dist/cli/mcp-manager.js` ✅ NEW
- `dist/cli/agent-manager.js`
- `dist/cli/claude-code-wrapper.js`
- `dist/cli/config-wizard.js`
- `dist/cli/mcp.js`
- `dist/cli-proxy.js` (main entry point)
- `dist/index.js`
- All agent files, MCP servers, etc.

### Documentation

- `README.md` ✅ UPDATED
- `docs/guides/ADDING-MCP-SERVERS-CLI.md` ✅ NEW
- `docs/guides/ADDING-MCP-SERVERS.md` ✅ NEW
- `docs/mcp-validation/` ✅ NEW
- Other existing documentation

### Configuration

- `package.json` (version 1.2.0)
- `tsconfig.json`
- `.npmignore`

---

## Testing After Publish

### Quick Smoke Test

```bash
# Install globally
npm install -g agent-control-plane@1.2.0

# Test version
agent-control-plane --version  # Should show 1.2.0

# Test MCP CLI
agent-control-plane mcp --help

# Add test server
agent-control-plane mcp add test '{"command":"echo","args":["hello"]}'

# List servers
agent-control-plane mcp list

# Test with agent
agent-control-plane --agent researcher --task "What is agent-control-plane?"
```

### Integration Test

```bash
# Test with real MCP server
agent-control-plane mcp add strange-loops '{"command":"npx","args":["-y","strange-loops","mcp","start"]}'

# Run agent that uses it
agent-control-plane --agent researcher --task "List all MCP tools from strange-loops"

# Should see: [agent-control-plane] Loaded MCP server: strange-loops
```

---

## Monitoring Post-Release

### NPM Stats

- Check download counts: https://npm-stat.com/charts.html?package=agent-control-plane
- Monitor version distribution

### GitHub

- Watch for new issues related to MCP CLI
- Monitor PR #4 comments
- Check GitHub Discussions

### User Feedback

- Monitor support channels
- Check for bug reports
- Collect feature requests

---

## Known Issues / Limitations

1. **Future Enhancements (v1.2.1+):**
   - `mcp test` command not yet implemented
   - `mcp info` command not yet implemented
   - `mcp export/import` commands not yet implemented

2. **Security Considerations:**
   - API keys stored in plaintext in config file
   - No signature verification for MCP servers
   - Users should only add trusted MCP servers

---

## Support Resources

**Documentation:**

- User Guide: `docs/guides/ADDING-MCP-SERVERS-CLI.md`
- Developer Guide: `docs/guides/ADDING-MCP-SERVERS.md`

**Code:**

- MCP Manager: `src/cli/mcp-manager.ts`
- Agent Integration: `src/agents/claudeAgent.ts` (lines 171-203)

**Validation:**

- Test Results: `docs/mcp-validation/MCP-CLI-VALIDATION-REPORT.md`
- Live Test: `docs/mcp-validation/strange-loops-test.md`

**GitHub:**

- Pull Request: https://github.com/Aktoh-Cyber/agent-control-plane/pull/4
- Issues: https://github.com/Aktoh-Cyber/agent-control-plane/issues

---

## Ready to Publish!

**Current Status:**

- ✅ Code complete and tested
- ✅ Build successful
- ✅ Documentation complete
- ✅ PR created
- ✅ Version updated to 1.2.0
- ⏳ Awaiting NPM publish command

**Next Action:**

```bash
cd /workspaces/agent-control-plane/agent-control-plane
npm publish
```

**Or publish as beta first:**

```bash
npm publish --tag beta
```

---

**Prepared by:** Claude Code
**Date:** 2025-10-06
**Ready for Release:** ✅ YES
