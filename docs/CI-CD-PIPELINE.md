# CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline implemented for the agent-control-plane project using GitHub Actions.

## Pipeline Architecture

The CI/CD system consists of four main workflows:

### 1. CI Pipeline (`ci.yml`)

Main continuous integration workflow that runs on every push and pull request.

**Jobs:**

- **Lint and Type Check** - Code quality validation
- **Test** - Multi-version and multi-platform testing
- **Build** - TypeScript and WASM compilation
- **Coverage** - Code coverage analysis
- **Integration** - Topology-specific integration tests
- **Benchmark** - Performance benchmarking (main branch only)
- **Security** - Dependency vulnerability scanning
- **Status Check** - Overall pipeline status validation

**Matrix Strategy:**

- Node versions: 18.x, 20.x, 22.x
- Operating systems: Ubuntu (all versions), macOS (20.x), Windows (20.x)

### 2. PR Validation (`pr-validation.yml`)

Pull request specific validation and quality checks.

**Jobs:**

- **PR Metadata Check** - Validates PR title format and description
- **Code Quality Analysis** - Code complexity and formatting
- **Dependency Check** - Dependency updates and lockfile validation
- **Bundle Size Check** - Build artifact size monitoring
- **PR Summary** - Consolidated validation report

**PR Title Requirements:**
Must start with one of: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `perf:`, `style:`

### 3. Release Pipeline (`release.yml`)

Automated release process for version tagging and NPM publishing.

**Triggers:**

- Git tags matching `v*.*.*` pattern
- Manual workflow dispatch with version input

**Jobs:**

- **Validate Release** - Version format validation
- **Build Release** - Create release artifacts
- **Create GitHub Release** - Generate changelog and GitHub release
- **Publish to NPM** - Publish package to NPM registry

### 4. Docker Build (`docker.yml`)

Container image building and publishing.

**Jobs:**

- **Docker Tests** - Build validation for multiple Dockerfiles
- **Docker Build** - Multi-platform image build and push to GitHub Container Registry

**Supported Platforms:**

- linux/amd64
- linux/arm64

## Workflow Optimization

### Dependency Caching

All workflows use pnpm caching via `actions/setup-node@v4` with `cache: 'pnpm'` parameter.

**Benefits:**

- Faster installation (30-60% reduction)
- Reduced network bandwidth
- Consistent dependency resolution

### Concurrency Control

Each workflow uses concurrency groups to cancel outdated runs:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Artifact Management

- Test results: 7 days retention
- Build artifacts: 7 days retention
- Coverage reports: 30 days retention
- Benchmark results: 30 days retention
- Security audits: 30 days retention
- Release packages: 90 days retention

### Timeout Configuration

- Lint/Type Check: 10 minutes
- Tests: 20 minutes
- Build: 15 minutes
- Coverage: 20 minutes
- Integration: 25 minutes
- Benchmarks: 30 minutes
- Docker: 30-45 minutes

## Status Badges

Add these badges to your README.md:

```markdown
[![CI Pipeline](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/ci.yml/badge.svg)](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/ci.yml)
[![PR Validation](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/pr-validation.yml)
[![Release](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/release.yml/badge.svg)](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/release.yml)
[![Docker](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/docker.yml/badge.svg)](https://github.com/Aktoh-Cyber/agent-control-plane/actions/workflows/docker.yml)
```

## Required Secrets

Configure these secrets in your GitHub repository settings:

| Secret         | Description            | Required For     |
| -------------- | ---------------------- | ---------------- |
| `GITHUB_TOKEN` | Automatically provided | All workflows    |
| `NPM_TOKEN`    | NPM publishing token   | Release workflow |

## Branch Protection Rules

Recommended branch protection settings for `main`:

1. **Require pull request reviews**
   - At least 1 approval required
   - Dismiss stale reviews on new commits

2. **Require status checks to pass**
   - Lint and Type Check
   - Test (Node 20.x)
   - Build
   - PR Metadata Check

3. **Require branches to be up to date**
   - Enabled

4. **Require linear history**
   - Enabled (optional)

5. **Include administrators**
   - Disabled (for flexibility)

## Environment Variables

### CI Environment

All test jobs run with:

```yaml
env:
  NODE_ENV: test
  CI: true
```

### Benchmark Environment

```yaml
env:
  BENCHMARK_MODE: true
  ITERATIONS: 10
```

## Integration with Project Scripts

The pipeline uses these package.json scripts:

```json
{
  "lint": "eslint . --ext .ts,.js",
  "typecheck": "tsc --noEmit",
  "test": "pnpm run test:main && pnpm run test:parallel",
  "test:main": "cd agent-control-plane && pnpm test",
  "test:parallel": "node tests/parallel/benchmark-suite.js",
  "test:mesh": "node tests/parallel/mesh-swarm-test.js",
  "test:hierarchical": "node tests/parallel/hierarchical-swarm-test.js",
  "test:ring": "node tests/parallel/ring-swarm-test.js",
  "build": "pnpm run build:main",
  "build:main": "cd agent-control-plane && pnpm run build:ts",
  "build:wasm": "cd agent-control-plane && pnpm run build:wasm",
  "bench:quic": "node benchmarks/quic-transport.bench.js",
  "bench:parallel": "BENCHMARK_MODE=true ITERATIONS=10 node tests/parallel/benchmark-suite.js",
  "bench:report": "node scripts/generate-benchmark-report.js"
}
```

## Monitoring and Troubleshooting

### Viewing Workflow Results

1. Navigate to Actions tab in GitHub repository
2. Select specific workflow from the left sidebar
3. Click on a workflow run to see job details
4. Download artifacts from the workflow run page

### Common Issues

**Issue: Tests timeout**

- Solution: Increase timeout in workflow or optimize tests
- Current timeout: 20 minutes

**Issue: Build fails on specific Node version**

- Solution: Check matrix configuration and Node compatibility
- Supported versions: 18.x, 20.x, 22.x

**Issue: Dependency installation fails**

- Solution: Clear pnpm cache or update lockfile
- Use `pnpm install --frozen-lockfile` flag

**Issue: Docker build runs out of memory**

- Solution: Use Docker layer caching and multi-stage builds
- Current setup includes GitHub Actions cache

## Performance Metrics

Expected execution times (approximate):

| Job                   | Duration      |
| --------------------- | ------------- |
| Lint and Type Check   | 2-3 minutes   |
| Test (single version) | 5-10 minutes  |
| Build                 | 3-5 minutes   |
| Coverage              | 8-12 minutes  |
| Integration           | 10-15 minutes |
| Benchmarks            | 15-20 minutes |
| Docker Build          | 20-30 minutes |

**Total CI Pipeline:** ~15-25 minutes (parallel execution)

## Best Practices

1. **Keep workflows fast**
   - Use caching extensively
   - Run expensive jobs conditionally
   - Parallelize independent jobs

2. **Fail fast**
   - Set `fail-fast: false` only when needed
   - Use `continue-on-error` sparingly

3. **Security**
   - Never hardcode secrets
   - Use minimal token permissions
   - Audit dependencies regularly

4. **Maintainability**
   - Document workflow changes
   - Use reusable workflows for common patterns
   - Keep job names descriptive

5. **Resource optimization**
   - Set appropriate timeouts
   - Use artifact retention wisely
   - Cancel redundant runs

## Future Enhancements

Potential improvements to consider:

1. **Code Quality**
   - Add SonarCloud integration
   - Implement code complexity thresholds
   - Add automated code formatting checks

2. **Testing**
   - Add E2E testing workflow
   - Implement visual regression testing
   - Add mutation testing

3. **Deployment**
   - Add staging deployment workflow
   - Implement canary deployments
   - Add blue-green deployment strategy

4. **Monitoring**
   - Add performance regression detection
   - Implement automated rollback on failures
   - Add Slack/Discord notifications

5. **Documentation**
   - Auto-generate API documentation
   - Add changelog automation
   - Implement automated release notes

## Support

For issues or questions about the CI/CD pipeline:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Open an issue in the repository
4. Contact the DevOps team

## Changelog

### Version 1.0.0 (2025-12-07)

- Initial CI/CD pipeline implementation
- Multi-version Node.js testing (18.x, 20.x, 22.x)
- Multi-platform testing (Ubuntu, macOS, Windows)
- Comprehensive job structure (lint, test, build, coverage, integration)
- PR validation workflow
- Release automation
- Docker build pipeline
- Dependency caching with pnpm
- Security audit integration
- Performance benchmarking
