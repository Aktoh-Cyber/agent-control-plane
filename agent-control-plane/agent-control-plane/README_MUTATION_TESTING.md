# Mutation Testing - Quick Start

## What is This?

Mutation testing validates your test suite by introducing bugs and checking if tests catch them.

## Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm run mutation:install
```

### 2. Run Tests

```bash
# Quick test (security module only)
npm run mutation:security

# Full test (all modules)
npm run mutation:test
```

### 3. View Results

```bash
open agent-control-plane/test-reports/mutation/mutation-report.html
```

## What's Included?

- **Stryker Configuration**: `/agent-control-plane/stryker.conf.json`
- **Execution Script**: `/agent-control-plane/scripts/run-mutation-tests.sh`
- **CI/CD Workflow**: `/agent-control-plane/.github/workflows/mutation-test.yml`
- **Documentation**:
  - `docs/MUTATION_TESTING.md` - Full strategy guide
  - `docs/MUTATION_SETUP_GUIDE.md` - Setup instructions
  - `docs/MUTATION_REPORT.md` - Initial assessment
  - `docs/MUTATION_RECOMMENDATIONS.md` - Improvement tips

## Understanding Your Score

| Score | Meaning                          |
| ----- | -------------------------------- |
| 90%+  | Excellent - Security code target |
| 80%+  | Good - General code target       |
| 75%+  | Acceptable - Minimum threshold   |
| <75%  | Needs improvement                |

## Commands

```bash
npm run mutation:test           # Full automated run
npm run mutation:security       # Security module only (fast)
npm run mutation:incremental    # Only changed files
npm run mutation:full           # Complete test suite
```

## Reports Location

```
agent-control-plane/test-reports/mutation/
├── mutation-report.html          # Visual report (open in browser)
├── mutation-report.json          # Raw data
├── weak-spots-<timestamp>.md     # Files needing improvement
└── mutation-metrics-<timestamp>.json
```

## CI/CD

Mutation tests automatically run on:

- Pull requests (incremental mode)
- Weekly on Sundays (full mode)
- Manual trigger via GitHub Actions

## Need Help?

See `/agent-control-plane/docs/MUTATION_SETUP_GUIDE.md` for detailed instructions.

## Target Scores

- **Security Module**: 90%+
- **Config Module**: 80%+
- **Error Handling**: 80%+
- **Overall**: 80%+

Start with: `npm run mutation:security`
