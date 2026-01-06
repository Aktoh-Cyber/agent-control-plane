# DevOps Workflow Setup Documentation

## Overview

This project is configured with a comprehensive development workflow including:

- **Husky v9.1.7**: Git hooks management
- **lint-staged v16.2.7**: Pre-commit file processing
- **Prettier v3.7.4**: Code formatting
- **ESLint v9.39.1**: Modern linting with flat config

## Configuration Files

All configuration files are located in the `/config` directory:

### 1. Prettier Configuration (`/config/prettier.config.js`)

Formatting rules for consistent code style:

- Print width: 100 characters
- Tab width: 2 spaces
- Single quotes for JavaScript/TypeScript
- ES5 trailing commas
- Includes `prettier-plugin-organize-imports` for automatic import sorting

### 2. ESLint Configuration (`/config/eslint.config.js`)

Modern ESLint v9 flat configuration with:

- TypeScript support via `typescript-eslint`
- Environment-aware console rules:
  - **Development**: `console.log()` warnings only
  - **Production**: `console.log()` errors
- Recommended ESLint and TypeScript rules
- Special rules for test files (relaxed linting)
- Support for config files with CommonJS

### 3. Lint-Staged Configuration (`/config/lint-staged.config.js`)

Pre-commit processing for staged files:

- **TypeScript/JavaScript files**: Format with Prettier, then lint with ESLint
- **JSON/YAML/Markdown files**: Format with Prettier only
- Automatic fixing where possible

## NPM Scripts

The following scripts are available in `package.json`:

```bash
# Linting
pnpm run lint          # Check code with ESLint
pnpm run lint:fix      # Auto-fix ESLint issues

# Formatting
pnpm run format        # Format all files with Prettier
pnpm run format:check  # Check formatting without changing files

# Type checking
pnpm run typecheck     # Run TypeScript compiler check
```

## Pre-commit Hooks

### How It Works

When you commit code, Husky triggers the pre-commit hook which:

1. Runs `lint-staged` on your staged files
2. Formats code with Prettier
3. Lints code with ESLint (auto-fixes when possible)
4. Only commits if all checks pass

### Example Workflow

```bash
# Make changes to code
vim src/my-file.ts

# Stage changes
git add src/my-file.ts

# Commit (triggers pre-commit hook automatically)
git commit -m "Add new feature"

# Hook automatically:
# - Formats your code
# - Fixes ESLint issues
# - Re-stages the formatted files
# - Completes the commit
```

## Console.log Rules

The ESLint configuration includes environment-aware `no-console` rules:

### Development Environment

```javascript
// Warnings only - won't block commits
console.log('Debug info'); // ⚠️ Warning
console.warn('Warning'); // ⚠️ Warning
console.error('Error'); // ⚠️ Warning
```

### Production Environment

```bash
# Set NODE_ENV=production for strict checking
NODE_ENV=production pnpm run lint
```

```javascript
// Errors - will block commits/builds
console.log('Debug info'); // ❌ Error
console.warn('Warning'); // ❌ Error
console.error('Error'); // ❌ Error
```

## ESLint v9 Migration

### What Changed

- Migrated from ESLint v8 to v9
- Switched from `.eslintrc.json` to flat config (`eslint.config.js`)
- Removed old `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` v6
- Added new `typescript-eslint` v8 package
- Added `@eslint/js` and `globals` packages

### Old Config Location

The old `.eslintrc.json` has been backed up to `.eslintrc.json.old`

## Testing the Setup

A sample test file was created to verify the workflow:

```bash
# File: test/sample-hook-test.js
# - Created with intentional formatting issues
# - Staged and processed by lint-staged
# - Automatically formatted and fixed
```

### Verification Results

✅ Pre-commit hook successfully:

- Formatted code with Prettier
- Applied ESLint fixes
- Re-staged corrected files

## File Ignores

### Prettier Ignores (`.prettierignore`)

The following are excluded from formatting:

- `node_modules`
- Build outputs (`dist`, `build`)
- Generated files (`*.d.ts`, `wasm`, `pkg`)
- Lock files
- Database files
- IDE files
- Swarm memory (`.swarm`)

### ESLint Ignores

Configured in `config/eslint.config.js`:

- `node_modules`
- `dist`, `build`
- `coverage`
- `*.min.js`
- `*.d.ts`
- `wasm`, `pkg`
- `.swarm`
- `test-reports`, `test-results`

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Ensure Husky is initialized
npx husky init

# Make pre-commit hook executable
chmod +x .husky/pre-commit
```

### ESLint Errors on TypeScript Files

```bash
# Ensure TypeScript project is configured
pnpm run typecheck

# Check tsconfig.json includes all relevant files
```

### Prettier Not Formatting

```bash
# Run manually to check
pnpm run format:check

# Format specific file
npx prettier --write --config config/prettier.config.js path/to/file.ts
```

## Coordination and Memory

### Hive Mind Integration

This setup integrates with the hive mind collective:

**Memory Key**: `hive/devops/config`

Stores:

- Configuration file locations
- Tool versions
- Setup status
- Testing results

### Coordination Protocol

The DevOps workflow agent coordinates with other agents by:

1. Storing configuration in shared memory
2. Documenting setup process
3. Running hooks for pre-task and post-task coordination
4. Reporting status via session management

## Summary

✅ **Installed**: Husky, lint-staged, Prettier, ESLint v9
✅ **Configured**: All tools with modern best practices
✅ **Tested**: Pre-commit hooks working correctly
✅ **Documented**: Complete setup and usage guide
✅ **Integrated**: Coordination with hive mind collective

## Next Steps

1. **For Developers**:
   - Start committing code - hooks will run automatically
   - Use `pnpm run lint:fix` for manual fixes
   - Use `pnpm run format` to format all files

2. **For CI/CD**:
   - Add `pnpm run lint` to CI pipeline
   - Add `pnpm run format:check` to verify formatting
   - Set `NODE_ENV=production` for strict console rules

3. **For Team**:
   - Review this documentation
   - Test the workflow with sample commits
   - Report any issues or improvements needed
