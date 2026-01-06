# Contributing to Agentic Flow

Thank you for your interest in contributing to Agentic Flow! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Standards](#documentation-standards)
7. [Pull Request Process](#pull-request-process)
8. [Review Checklist](#review-checklist)
9. [Community](#community)

## Code of Conduct

Be respectful, inclusive, and professional in all interactions. We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).

**Expected Behavior:**

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

**Unacceptable Behavior:**

- Harassment, trolling, or discriminatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (or npm >= 9.0.0)
- Git
- TypeScript knowledge
- Familiarity with AI/ML concepts (helpful)

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**

```bash
git clone https://github.com/YOUR_USERNAME/agent-control-plane.git
cd agent-control-plane/agent-control-plane
```

3. **Add upstream remote:**

```bash
git remote add upstream https://github.com/tafyai/agent-control-plane.git
```

4. **Install dependencies:**

```bash
pnpm install
```

5. **Build the project:**

```bash
pnpm build
```

6. **Run tests:**

```bash
pnpm test
```

## Development Workflow

### 1. Sync with Upstream

Always sync before creating a new branch:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 2. Create a Branch

Use descriptive branch names:

```bash
# Feature branches
git checkout -b feature/add-new-agent
git checkout -b feature/improve-caching

# Bug fix branches
git checkout -b fix/memory-leak
git checkout -b fix/config-validation

# Documentation branches
git checkout -b docs/update-api-guide
```

### 3. Make Changes

- Write clean, readable code
- Follow existing code patterns
- Add tests for new features
- Update documentation
- Keep commits focused and atomic

### 4. Test Locally

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test path/to/test.ts

# Run with coverage
pnpm test --coverage

# Build project
pnpm build

# Test manually
npx agentopia --agent coder --task "test my changes"
```

### 5. Commit Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add new feature

- Detailed description
- Implementation details
- Breaking changes (if any)

Closes #123"
```

**Commit Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `style:` Code style changes (formatting, etc.)
- `chore:` Maintenance tasks
- `ci:` CI/CD changes
- `build:` Build system changes

### 6. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript Style

**Use strict TypeScript:**

```typescript
// Good
function processUser(user: User): Result {
  const result: Result = {
    success: true,
    data: user,
  };
  return result;
}

// Avoid
function processUser(user: any) {
  return {
    success: true,
    data: user,
  };
}
```

**Prefer interfaces over types for object shapes:**

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Acceptable for unions/intersections
type Status = 'active' | 'inactive' | 'pending';
```

**Use readonly for immutable data:**

```typescript
interface Config {
  readonly apiKey: string;
  readonly baseUrl: string;
}
```

### Naming Conventions

**Files:**

- Use kebab-case for file names: `user-service.ts`
- Test files: `user-service.test.ts`
- Types: `user-types.ts`

**Classes:**

- Use PascalCase: `UserService`, `DatabaseConnection`

**Functions and variables:**

- Use camelCase: `getUserById`, `isValid`

**Constants:**

- Use UPPER_SNAKE_CASE: `MAX_RETRIES`, `DEFAULT_TIMEOUT`

**Interfaces:**

- Start with capital letter: `User`, `Config`
- Avoid `I` prefix: Use `User` not `IUser`

### Code Organization

**Keep functions small:**

```typescript
// Good - single responsibility
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUser(user: User): ValidationResult {
  if (!user.name) {
    return { valid: false, error: 'Name required' };
  }
  if (!validateEmail(user.email)) {
    return { valid: false, error: 'Invalid email' };
  }
  return { valid: true };
}

// Avoid - too many responsibilities
function validateUser(user: User): boolean {
  if (!user.name) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return false;
  if (user.age < 0 || user.age > 120) return false;
  // ... more validation
  return true;
}
```

**Use early returns:**

```typescript
// Good
function processUser(user: User | null): Result {
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.isActive) {
    return { success: false, error: 'User inactive' };
  }

  return { success: true, data: user };
}

// Avoid
function processUser(user: User | null): Result {
  if (user) {
    if (user.isActive) {
      return { success: true, data: user };
    } else {
      return { success: false, error: 'User inactive' };
    }
  } else {
    return { success: false, error: 'User not found' };
  }
}
```

### Error Handling

**Use typed errors:**

```typescript
import { DataNotFoundError, ValidationError } from './errors';

// Good
if (!user) {
  throw new DataNotFoundError('User', userId);
}

if (!isValidEmail(user.email)) {
  throw new ValidationError('Invalid email', 'INVALID_EMAIL', {
    errors: [{ field: 'email', message: 'Invalid format' }],
  });
}

// Avoid
if (!user) {
  throw new Error('User not found');
}
```

**Handle errors appropriately:**

```typescript
// Good
try {
  await operation();
} catch (error) {
  if (isBaseError(error)) {
    logger.error('Operation failed', formatErrorForLogging(error));
    throw error;
  }
  throw new UnexpectedError('Unexpected error', { cause: error });
}

// Avoid
try {
  await operation();
} catch (error) {
  console.log(error); // Don't swallow errors
}
```

### Comments and Documentation

**Use JSDoc for public APIs:**

````typescript
/**
 * Retrieve a user by ID
 *
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to the user or null if not found
 * @throws {DatabaseError} If database connection fails
 * @throws {ValidationError} If userId is invalid
 *
 * @example
 * ```typescript
 * const user = await getUserById('user-123');
 * if (user) {
 *   console.log(user.name);
 * }
 * ```
 */
async function getUserById(userId: string): Promise<User | null> {
  // Implementation
}
````

**Comment complex logic:**

```typescript
// Good - explain why, not what
// Use binary search for O(log n) performance on sorted arrays
const index = binarySearch(sortedArray, target);

// Avoid - obvious comments
// Increment counter by 1
counter++;
```

## Testing Requirements

### Test Coverage

- Aim for **80%+ code coverage**
- Test all public APIs
- Test edge cases and error conditions
- Test integration points

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { aUser, createMockDatabase, assert } from '../utils';

describe('UserService', () => {
  let db: ReturnType<typeof createMockDatabase>;
  let service: UserService;

  beforeEach(() => {
    db = createMockDatabase();
    service = new UserService(db);
  });

  afterEach(() => {
    db.clearAll();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = aUser().build();

      // Act
      const user = await service.createUser(userData);

      // Assert
      assert.defined(user);
      assert.hasProperty(user, 'id');
      expect(user.email).toBe(userData.email);
    });

    it('should throw on duplicate email', async () => {
      // Arrange
      const userData = aUser().build();
      await service.createUser(userData);

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow(UniqueViolationError);
    });
  });
});
```

### Test Best Practices

1. **Use descriptive test names:**

```typescript
// Good
it('should return null when user not found', async () => {});
it('should throw ValidationError for invalid email', async () => {});

// Avoid
it('test getUserById', async () => {});
```

2. **Use test builders:**

```typescript
// Good
const user = aUser().asAdmin().withEmail('admin@test.com').build();

// Avoid
const user = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@test.com',
  role: 'admin',
  // ... many fields
};
```

3. **Mock external dependencies:**

```typescript
// Good
const apiClient = createMockAPIClient();
apiClient.mockResponse('GET', '/users', { data: [] });

// Avoid
// Making real API calls in tests
```

4. **Test one thing at a time:**

```typescript
// Good - focused test
it('should validate email format', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});

// Avoid - testing multiple things
it('should validate user', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateName('John')).toBe(true);
  expect(validateAge(25)).toBe(true);
  // ... too much
});
```

## Documentation Standards

### Code Documentation

- Document all public APIs with JSDoc
- Include parameter descriptions
- Provide usage examples
- Document errors that can be thrown
- Explain complex algorithms

### Markdown Documentation

- Use clear headings (H1-H4)
- Include table of contents for long docs
- Provide code examples
- Link to related documentation
- Keep examples up-to-date

### Example Documentation:

````markdown
# Feature Name

Brief description of the feature.

## Usage

```typescript
import { FeatureName } from 'agentopia';

const feature = new FeatureName({
  option1: 'value1',
  option2: 'value2',
});

const result = await feature.execute();
```

## API Reference

### `execute(options: ExecuteOptions): Promise<Result>`

Executes the feature with given options.

**Parameters:**

- `options` - Configuration options
  - `timeout: number` - Execution timeout in ms
  - `retries: number` - Number of retry attempts

**Returns:**

- Promise resolving to execution result

**Throws:**

- `TimeoutError` - If execution exceeds timeout
- `ValidationError` - If options are invalid

**Example:**

```typescript
const result = await feature.execute({
  timeout: 5000,
  retries: 3,
});
```
````

## Pull Request Process

### Before Submitting

1. **Ensure tests pass:**

```bash
pnpm test
```

2. **Check code style:**

```bash
pnpm lint
```

3. **Build successfully:**

```bash
pnpm build
```

4. **Update documentation:**

- Update relevant MD files
- Add/update code comments
- Update CHANGELOG.md

### PR Template

Use this template for your PR description:

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] Tests pass locally
- [ ] No new warnings
- [ ] Updated CHANGELOG.md

## Related Issues

Closes #123
Fixes #456
```

### Review Process

1. **Automated checks:** CI/CD must pass
2. **Code review:** At least one approval required
3. **Discussion:** Address review feedback
4. **Final approval:** Maintainer approval
5. **Merge:** Squash and merge

## Review Checklist

### For Reviewers

**Code Quality:**

- [ ] Code is clean and readable
- [ ] Follows TypeScript best practices
- [ ] No unnecessary complexity
- [ ] Proper error handling
- [ ] No code duplication

**Testing:**

- [ ] Tests cover new code
- [ ] Tests are meaningful
- [ ] Edge cases tested
- [ ] No flaky tests

**Documentation:**

- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] Examples provided

**Architecture:**

- [ ] Follows existing patterns
- [ ] No architectural violations
- [ ] Appropriate abstractions
- [ ] Good separation of concerns

**Performance:**

- [ ] No performance regressions
- [ ] Efficient algorithms
- [ ] Appropriate caching
- [ ] Resource cleanup

**Security:**

- [ ] No security vulnerabilities
- [ ] Input validation
- [ ] Proper error messages (no sensitive info)
- [ ] Authentication/authorization correct

## Community

### Getting Help

- **Documentation:** Check [docs/](.)
- **GitHub Issues:** [Report bugs](https://github.com/tafyai/agent-control-plane/issues)
- **Discussions:** [Ask questions](https://github.com/tafyai/agent-control-plane/discussions)

### Communication Channels

- **GitHub:** Primary communication channel
- **Issues:** Bug reports and feature requests
- **Discussions:** Questions and ideas
- **Pull Requests:** Code contributions

### Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Thank you for contributing to Agentic Flow! Your contributions help make AI agent development faster, smarter, and more accessible.

---

**Questions?** Open a [GitHub Discussion](https://github.com/tafyai/agent-control-plane/discussions)
