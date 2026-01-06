# Mutation Testing Strategy

## Overview

Mutation testing is a powerful technique to validate the effectiveness of your test suite by introducing small changes (mutations) to the code and verifying that tests detect these changes. This guide covers the comprehensive mutation testing strategy for Agentic Flow.

## What is Mutation Testing?

Mutation testing works by:

1. **Creating Mutants**: Small changes to source code (e.g., changing `>` to `>=`, `&&` to `||`)
2. **Running Tests**: Execute your test suite against each mutant
3. **Evaluating Results**:
   - **Killed**: Test detected the mutation (GOOD)
   - **Survived**: Mutation went undetected (BAD - weak tests)
   - **Timeout**: Test took too long (neutral)
   - **No Coverage**: No tests covered the mutated code (BAD)

## Mutation Score

```
Mutation Score = (Killed Mutants) / (Total Mutants - Timeout - No Coverage) × 100%
```

**Target Thresholds**:

- **Critical Security Code**: 90%+
- **Core Business Logic**: 80%+
- **Utility Functions**: 75%+

## Configuration

### Stryker.js Setup

The project uses Stryker.js with the following configuration:

```json
{
  "mutate": [
    "agent-control-plane/src/security/**/*.ts",
    "agent-control-plane/src/config/**/*.ts",
    "agent-control-plane/src/errors/**/*.ts",
    "agent-control-plane/src/reasoningbank/**/*.ts"
  ],
  "thresholds": {
    "high": 90,
    "low": 80,
    "break": 75
  }
}
```

### Mutators Enabled

1. **ArithmeticOperator**: `+` ↔ `-`, `*` ↔ `/`
2. **EqualityOperator**: `==` ↔ `!=`, `===` ↔ `!==`
3. **LogicalOperator**: `&&` ↔ `||`
4. **ConditionalExpression**: `true` ↔ `false`
5. **BooleanLiteral**: `true` ↔ `false`
6. **UnaryOperator**: `+x` ↔ `-x`, `!x` ↔ `x`
7. **ArrayDeclaration**: `[]` ↔ `["""]`
8. **StringLiteral**: `"foo"` ↔ `""`
9. **ObjectLiteral**: `{x: 1}` ↔ `{}`
10. **MethodExpression**: `foo()` ↔ `() => undefined`
11. **OptionalChaining**: `obj?.prop` ↔ `obj.prop`
12. **RegexLiteral**: `/abc/` ↔ `/a[^a]/`

## Critical Files for Mutation Testing

### Priority 1: Security Code (Target: 90%+)

```
agent-control-plane/src/security/
├── hipaa-encryption.ts      # HIPAA-compliant encryption
├── key-manager.ts            # Cryptographic key management
└── migration.ts              # Secure data migration
```

**Why Critical**:

- Handles sensitive PHI/PII data
- Cryptographic operations must be correct
- Security vulnerabilities have severe consequences

### Priority 2: Configuration & Validation (Target: 80%+)

```
agent-control-plane/src/config/
├── validator.ts              # Configuration validation
└── types.ts                  # Type definitions
```

**Why Important**:

- Incorrect configuration can break system
- Type safety prevents runtime errors

### Priority 3: Error Handling (Target: 80%+)

```
agent-control-plane/src/errors/
├── base.ts                   # Base error classes
├── validation.ts             # Validation errors
├── auth.ts                   # Authentication errors
└── network.ts                # Network errors
```

**Why Important**:

- Proper error handling prevents cascading failures
- User-facing error messages must be correct

### Priority 4: ReasoningBank (Target: 75%+)

```
agent-control-plane/src/reasoningbank/
├── index.ts                  # Main ReasoningBank logic
├── utils/embeddings.ts       # Vector embeddings
└── utils/pii-scrubber.ts     # PII detection/removal
```

## Running Mutation Tests

### Quick Start

```bash
# Run mutation tests on all critical files
./scripts/run-mutation-tests.sh

# Run on specific module
npx stryker run --mutate "agent-control-plane/src/security/**/*.ts"

# Incremental mode (faster, only changed files)
npx stryker run --incremental
```

### Execution Modes

#### 1. Full Mutation Testing

```bash
npm run mutation:full
```

Runs mutation tests on all configured files. Use for:

- Pre-release validation
- Weekly regression checks
- Major refactoring

**Time**: 15-30 minutes

#### 2. Incremental Mutation Testing

```bash
npm run mutation:incremental
```

Only mutates files changed since last run. Use for:

- Pull request checks
- Daily development
- Quick validation

**Time**: 2-5 minutes

#### 3. Security-Only Mutation Testing

```bash
npm run mutation:security
```

Focuses on critical security modules. Use for:

- Security audits
- Compliance validation
- Post-security-patch verification

**Time**: 5-10 minutes

## Interpreting Results

### HTML Report

Open `test-reports/mutation/mutation-report.html` in your browser for an interactive report showing:

- Overall mutation score
- File-by-file breakdown
- Survived mutants (with code context)
- Coverage gaps

### JSON Report

```json
{
  "totalMutants": 245,
  "killed": 196,
  "survived": 12,
  "timeout": 3,
  "noCoverage": 34,
  "mutationScore": 94.23
}
```

### Weak Spots Report

`weak-spots-<timestamp>.md` identifies files with:

- High survived mutant count
- No coverage mutants
- Specific mutator types that slip through

## Improving Mutation Score

### 1. Add Missing Tests

If mutants show **No Coverage**:

```typescript
// Mutant survived: No coverage for edge case
function validateAge(age: number): boolean {
  return age >= 18; // Boundary not tested
}

// ADD TEST:
it('should reject age exactly 17', () => {
  expect(validateAge(17)).toBe(false);
});

it('should accept age exactly 18', () => {
  expect(validateAge(18)).toBe(true);
});
```

### 2. Test Boundary Conditions

If **EqualityOperator** mutants survive:

```typescript
// Mutant: >= changed to >
if (count >= threshold) {
  // ...
}

// ADD TEST:
it('should trigger exactly at threshold', () => {
  const count = 10;
  const threshold = 10;
  expect(shouldTrigger(count, threshold)).toBe(true);
});
```

### 3. Test Logical Branches

If **LogicalOperator** mutants survive:

```typescript
// Mutant: && changed to ||
if (isValid && isActive) {
  // ...
}

// ADD TESTS:
it('should fail when valid but inactive', () => {
  expect(check(true, false)).toBe(false);
});

it('should fail when active but invalid', () => {
  expect(check(false, true)).toBe(false);
});
```

### 4. Test Error Cases

If **ConditionalExpression** mutants survive:

```typescript
// Mutant: true/false flipped
function encrypt(data: string): EncryptedData {
  if (!masterKey) {
    throw new Error('Key not set');
  }
  // ...
}

// ADD TEST:
it('should throw when key not set', () => {
  const enc = new Encryption();
  expect(() => enc.encrypt('data')).toThrow('Key not set');
});
```

### 5. Strengthen Assertions

If mutants survive with weak assertions:

```typescript
// WEAK: Only checks truthy
expect(result).toBeTruthy();

// STRONG: Checks exact value
expect(result).toBe(true);

// WEAK: Only checks array exists
expect(items).toBeDefined();

// STRONG: Checks exact length and contents
expect(items).toHaveLength(3);
expect(items[0]).toEqual({ id: 1, name: 'Test' });
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Mutation Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run incremental mutation tests
        if: github.event_name == 'pull_request'
        run: npm run mutation:incremental

      - name: Run full mutation tests
        if: github.event_name == 'schedule'
        run: npm run mutation:full

      - name: Upload mutation report
        uses: actions/upload-artifact@v3
        with:
          name: mutation-report
          path: test-reports/mutation/

      - name: Check mutation threshold
        run: |
          SCORE=$(node -e "console.log(require('./test-reports/mutation/mutation-report.json').mutationScore)")
          if (( $(echo "$SCORE < 80" | bc -l) )); then
            echo "Mutation score $SCORE% below threshold 80%"
            exit 1
          fi
```

### Pull Request Checks

Mutation testing runs on PRs targeting:

- Modified security files
- Core business logic
- Error handling modules

**Threshold**: 75% (prevents regression)

### Scheduled Testing

Full mutation suite runs weekly to:

- Catch degrading test quality
- Identify new weak spots
- Validate overall coverage

**Threshold**: 80% (maintains quality)

## Best Practices

### 1. Start Small

Begin with critical modules:

```bash
# Focus on high-value areas first
npx stryker run --mutate "src/security/hipaa-encryption.ts"
```

### 2. Use Incremental Mode

Save time during development:

```json
{
  "incremental": true,
  "incrementalFile": ".stryker-tmp/incremental.json"
}
```

### 3. Monitor Performance

Keep mutation tests fast:

- Set appropriate timeouts
- Use `coverageAnalysis: "perTest"`
- Parallelize with `concurrency: 4`

### 4. Review Survived Mutants

Not all survived mutants indicate weak tests:

**Acceptable Survived Mutants**:

- Logging statements (mutation doesn't affect behavior)
- Defensive programming (redundant checks)
- Performance optimizations

**Unacceptable Survived Mutants**:

- Business logic conditions
- Security checks
- Error handling

### 5. Combine with Code Coverage

Mutation testing complements code coverage:

```bash
# Ensure high coverage first
npm run test:coverage

# Then validate test effectiveness
npm run mutation:test
```

**Ideal Metrics**:

- Code Coverage: 90%+
- Mutation Score: 80%+

## Hive Mind Integration

Mutation test results are stored in Hive Mind memory for coordination:

```typescript
// Results stored at:
hive / testing / mutation / latest;
hive / testing / mutation / history / { timestamp };

// Accessible by other agents
const mutationScore = await memory.get('hive/testing/mutation/latest');
```

### Coordination Protocol

1. **Pre-Test**: Notify Hive of mutation testing start
2. **During Test**: Update progress metrics
3. **Post-Test**: Store results, weak spots, recommendations
4. **Sharing**: Other agents access scores for quality decisions

## Troubleshooting

### High Timeout Count

**Problem**: Many mutants timeout

**Solutions**:

- Increase `timeoutMS` in config
- Optimize slow tests
- Use `timeoutFactor: 2` for slow suites

### Low Mutation Score

**Problem**: Many mutants survive

**Solutions**:

1. Review HTML report for survived mutants
2. Add tests for uncovered branches
3. Strengthen assertions
4. Test edge cases and boundaries

### Stryker Crashes

**Problem**: Out of memory or crashes

**Solutions**:

- Reduce `concurrency`
- Use `tempDirName` on faster disk
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`

### Slow Execution

**Problem**: Mutation tests take too long

**Solutions**:

- Enable incremental mode
- Reduce mutated files scope
- Use `coverageAnalysis: "perTest"`
- Increase concurrency

## Metrics Dashboard

Track mutation testing trends:

```bash
# View historical scores
cat test-reports/mutation/archives/*.json | \
  jq '{date: .timestamp, score: .mutationScore}'

# Average score
cat test-reports/mutation/archives/*.json | \
  jq '.mutationScore' | \
  awk '{sum+=$1; count++} END {print sum/count}'
```

## Resources

- **Stryker Documentation**: https://stryker-mutator.io
- **Mutation Testing Theory**: https://en.wikipedia.org/wiki/Mutation_testing
- **Test Effectiveness**: https://martinfowler.com/bliki/TestCoverage.html

## Quick Reference

```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/jest-runner

# Run mutation tests
npm run mutation:test

# View report
open test-reports/mutation/mutation-report.html

# Check score
cat test-reports/mutation/mutation-report.json | jq '.mutationScore'

# Incremental mode
npm run mutation:incremental

# Security only
npm run mutation:security
```

## Summary

Mutation testing is essential for:

- ✅ Validating test effectiveness
- ✅ Finding weak test coverage
- ✅ Preventing regressions
- ✅ Improving code quality
- ✅ Meeting compliance requirements

**Target**: 80%+ mutation score on critical paths, 90%+ on security code.

Start with high-value modules, iterate, and continuously improve your test suite's effectiveness!
