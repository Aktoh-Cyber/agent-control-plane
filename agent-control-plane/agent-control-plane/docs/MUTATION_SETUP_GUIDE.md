# Mutation Testing - Quick Setup Guide

This guide walks you through setting up and running mutation tests for Agentic Flow in under 10 minutes.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Existing test suite (Jest)

## Installation

### Step 1: Install Stryker Dependencies

```bash
# From project root
npm run mutation:install

# Or manually
npm install --save-dev \
  @stryker-mutator/core \
  @stryker-mutator/typescript-checker \
  @stryker-mutator/jest-runner
```

### Step 2: Verify Configuration

Configuration is already set up at `/agent-control-plane/stryker.conf.json`. Verify it exists:

```bash
ls -l agent-control-plane/stryker.conf.json
```

## Running Mutation Tests

### Quick Start (Recommended)

Run the automated script that handles everything:

```bash
npm run mutation:test
```

This will:

- Run mutation tests on critical security modules
- Generate HTML and JSON reports
- Analyze weak spots
- Store results in Hive Mind memory
- Display summary with recommendations

### Manual Execution Options

#### 1. Full Mutation Test Suite

```bash
npm run mutation:full
```

Tests all configured modules. Takes 15-30 minutes.

#### 2. Incremental Mode (Fast)

```bash
npm run mutation:incremental
```

Only tests files changed since last run. Takes 2-5 minutes.

#### 3. Security Module Only

```bash
npm run mutation:security
```

Focuses on critical security code. Takes 5-10 minutes.

#### 4. Custom File Selection

```bash
cd agent-control-plane
npx stryker run --mutate "src/config/**/*.ts"
```

## Understanding Results

### Mutation Score

Your mutation score indicates test effectiveness:

```
Mutation Score = (Killed Mutants / Total Valid Mutants) × 100%
```

**Thresholds**:

- 90%+ = Excellent (Security code target)
- 80%+ = Good (General code target)
- 75%+ = Acceptable (Minimum threshold)
- <75% = Needs improvement

### Report Locations

After running tests, find reports at:

```bash
agent-control-plane/test-reports/mutation/
├── mutation-report.html          # Interactive report (open in browser)
├── mutation-report.json          # Machine-readable data
├── weak-spots-<timestamp>.md     # Files needing improvement
├── mutation-metrics-<timestamp>.json  # Numerical metrics
└── mutation-run-<timestamp>.log  # Execution log
```

### Viewing the HTML Report

```bash
# macOS
open agent-control-plane/test-reports/mutation/mutation-report.html

# Linux
xdg-open agent-control-plane/test-reports/mutation/mutation-report.html

# Windows
start agent-control-plane/test-reports/mutation/mutation-report.html
```

### Reading Mutation Results

#### Mutant Statuses

- **Killed** (Good): Test detected the mutation
- **Survived** (Bad): Mutation went undetected - weak test
- **No Coverage** (Bad): No test executed the mutated code
- **Timeout** (Neutral): Test ran too long
- **Compile Error** (Neutral): Mutation created invalid code

#### Example Output

```
🧬 Mutation Testing Summary
==================================================

📊 Metrics:
- Total Mutants: 245
- Killed: 196 (80%)
- Survived: 12 (4.9%)
- No Coverage: 34 (13.9%)
- Timeout: 3 (1.2%)

🎯 Mutation Score: 87.6%

✅ Meets threshold (80%)
```

## Improving Your Score

### 1. Review Survived Mutants

Open the HTML report and click on "Survived" to see which mutations weren't detected.

**Example**:

```typescript
// Original code
if (age >= 18) {
  // Mutant changed >= to >
}
```

**Fix**: Add boundary test

```typescript
it('should accept exactly 18', () => {
  expect(isAdult(18)).toBe(true);
});

it('should reject 17', () => {
  expect(isAdult(17)).toBe(false);
});
```

### 2. Add Coverage for Untested Code

If mutants show "No Coverage", add tests for those code paths.

```typescript
// Add test
it('should handle error case', () => {
  expect(() => dangerousOperation()).toThrow();
});
```

### 3. Strengthen Assertions

Replace weak assertions with specific ones:

```typescript
// Weak
expect(result).toBeTruthy();

// Strong
expect(result).toBe(true);
expect(result.value).toBe(42);
```

## CI/CD Integration

### GitHub Actions

The workflow is already configured at `.github/workflows/mutation-test.yml`.

**Automatic Triggers**:

- Pull requests affecting critical files
- Weekly on Sundays at 2 AM UTC
- Manual dispatch

**PR Checks**:
PRs automatically run incremental mutation tests and post results as comments.

### Local Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Run incremental mutation tests
npm run mutation:incremental

if [ $? -ne 0 ]; then
  echo "Mutation tests failed. Fix tests before committing."
  exit 1
fi
```

## Troubleshooting

### "Command not found: stryker"

**Solution**: Install dependencies

```bash
npm run mutation:install
```

### "Cannot find module '@stryker-mutator/core'"

**Solution**: Run from project root

```bash
cd /path/to/agent-control-plane
npm run mutation:test
```

### Tests take too long

**Solution**: Use incremental mode

```bash
npm run mutation:incremental
```

Or reduce concurrency in `stryker.conf.json`:

```json
{
  "concurrency": 2 // Reduced from 4
}
```

### Out of memory errors

**Solution**: Increase Node.js memory

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run mutation:test
```

### Mutation score unexpectedly low

**Common causes**:

1. Tests only check happy path
2. Missing boundary condition tests
3. Weak assertions (toBeTruthy instead of specific values)
4. No error case testing

**Solution**: Review HTML report and add targeted tests

## Best Practices

### 1. Start Small

Begin with your most critical module:

```bash
npx stryker run --mutate "agent-control-plane/src/security/hipaa-encryption.ts"
```

### 2. Iterate Regularly

Run mutation tests:

- Before major releases
- After refactoring
- Weekly for critical code
- For every PR affecting security

### 3. Don't Aim for 100%

Some survived mutants are acceptable:

- Logging statements
- Defensive programming
- Performance optimizations

**Target**:

- Security code: 90%+
- Business logic: 80%+
- Utilities: 75%+

### 4. Combine with Code Coverage

```bash
# First, ensure good coverage
npm run test:coverage

# Then validate test effectiveness
npm run mutation:test
```

### 5. Review Regularly

Check trends over time:

```bash
# View historical scores
cat agent-control-plane/test-reports/mutation/archives/*.json | \
  jq '.mutationScore'
```

## Quick Reference

### Commands

```bash
# Install
npm run mutation:install

# Run all tests
npm run mutation:test

# Run incremental (fast)
npm run mutation:incremental

# Run security only
npm run mutation:security

# View report
open agent-control-plane/test-reports/mutation/mutation-report.html
```

### File Locations

```
agent-control-plane/
├── stryker.conf.json                    # Configuration
├── scripts/run-mutation-tests.sh        # Execution script
├── .github/workflows/mutation-test.yml  # CI/CD workflow
├── test-reports/mutation/               # Reports directory
└── docs/
    ├── MUTATION_TESTING.md              # Full strategy guide
    ├── MUTATION_REPORT.md               # Initial assessment
    └── MUTATION_SETUP_GUIDE.md          # This file
```

### Key Metrics

| Metric        | Target | Status Indicator |
| ------------- | ------ | ---------------- |
| Security Code | 90%+   | Critical         |
| Core Logic    | 80%+   | Important        |
| Utilities     | 75%+   | Acceptable       |
| Overall       | 80%+   | Goal             |

## Next Steps

1. **Install dependencies** (if not already done)

   ```bash
   npm run mutation:install
   ```

2. **Run baseline tests**

   ```bash
   npm run mutation:security
   ```

3. **Review the HTML report**

   ```bash
   open agent-control-plane/test-reports/mutation/mutation-report.html
   ```

4. **Improve weak spots**
   - Check `weak-spots-<timestamp>.md`
   - Add tests for survived mutants
   - Strengthen assertions

5. **Integrate into workflow**
   - Run on PRs
   - Monitor trends
   - Maintain high scores

## Resources

- **Full Strategy Guide**: `/docs/MUTATION_TESTING.md`
- **Initial Assessment**: `/docs/MUTATION_REPORT.md`
- **Stryker Documentation**: https://stryker-mutator.io
- **Test Examples**: `/tests/security/hipaa-encryption.test.ts`

## Getting Help

If you encounter issues:

1. Check troubleshooting section above
2. Review Stryker logs in `test-reports/mutation/`
3. Consult full documentation in `MUTATION_TESTING.md`
4. Open GitHub issue with mutation report attached

---

**Estimated Setup Time**: 5-10 minutes
**First Run Time**: 5-30 minutes (depending on mode)
**Incremental Runs**: 2-5 minutes

Start with `npm run mutation:security` to test the most critical code first!
