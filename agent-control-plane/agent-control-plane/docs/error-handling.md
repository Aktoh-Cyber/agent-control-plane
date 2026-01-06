# Error Handling Guide

Comprehensive guide for using the Agentic Flow error system with typed errors, proper error handling patterns, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Error Hierarchy](#error-hierarchy)
3. [Error Code Ranges](#error-code-ranges)
4. [Basic Usage](#basic-usage)
5. [Error Categories](#error-categories)
6. [Best Practices](#best-practices)
7. [Advanced Patterns](#advanced-patterns)
8. [Error Recovery](#error-recovery)
9. [Logging and Monitoring](#logging-and-monitoring)

## Overview

The Agentic Flow error system provides a comprehensive typed error hierarchy that enables:

- **Type Safety**: Full TypeScript support with proper error types
- **Categorization**: Errors organized by domain (database, network, agent, etc.)
- **Metadata**: Rich error context for debugging and monitoring
- **Serialization**: JSON-safe error serialization for logging and APIs
- **Error Chaining**: Track error causes through the error chain
- **HTTP Mapping**: Automatic HTTP status code mapping
- **Retry Logic**: Built-in retry detection and delay calculation

## Error Hierarchy

```
BaseError (abstract)
├── OperationalError (expected, recoverable errors)
│   ├── DatabaseError
│   ├── ValidationError
│   ├── NetworkError
│   ├── AuthenticationError
│   ├── AuthorizationError
│   └── AgentError
└── ProgrammingError (bugs, critical errors)
    ├── ConfigurationError
    └── Other programming errors
```

### Operational vs Programming Errors

- **Operational Errors**: Expected errors that can happen during normal operation (network failures, validation errors, etc.)
- **Programming Errors**: Bugs and errors that should not happen (missing configuration, invalid state, etc.)

## Error Code Ranges

Each error category has a dedicated code range:

| Range     | Category      | Description                          |
| --------- | ------------- | ------------------------------------ |
| 2000-2999 | Database      | Connection, query, constraint errors |
| 3000-3999 | Validation    | Schema, type, business rule errors   |
| 4000-4999 | Network       | HTTP, timeout, protocol errors       |
| 5000-5999 | Auth          | Authentication, authorization errors |
| 6000-6999 | Configuration | Config, environment, init errors     |
| 7000-7999 | Agent         | Swarm, task, coordination errors     |

## Basic Usage

### Throwing Errors

```typescript
import {
  ValidationError,
  MissingRequiredFieldError,
  DatabaseError,
  DataNotFoundError,
  NetworkError,
  ApiRateLimitError,
} from '@/errors';

// Simple validation error
throw new ValidationError('Invalid input data', ValidationErrorCode.VALIDATION_ERROR, {
  errors: [{ field: 'email', constraint: 'email', message: 'Invalid email format' }],
});

// Specific validation error with helper
throw new MissingRequiredFieldError(['name', 'email']);

// Database error
throw new DataNotFoundError('User', userId);

// Network error with retry hint
throw new ApiRateLimitError(1000, 60, {
  apiName: 'OpenAI',
  endpoint: '/v1/chat/completions',
});
```

### Catching Errors

```typescript
import {
  isBaseError,
  ErrorCategory,
  DatabaseError,
  ValidationError,
  handleError,
  summarizeError,
} from '@/errors';

try {
  await someOperation();
} catch (error) {
  // Type-safe error handling
  if (isBaseError(error)) {
    console.error(`[${error.code}] ${error.message}`);
    console.error('Category:', error.category);
    console.error('Severity:', error.severity);
    console.error('Metadata:', error.metadata);
  }

  // Category-based handling
  if (isBaseError(error) && error.category === ErrorCategory.DATABASE) {
    // Handle database errors
    await handleDatabaseError(error as DatabaseError);
  }

  // Specific error type handling
  if (error instanceof ValidationError) {
    // Access validation-specific properties
    error.errors.forEach((err) => {
      console.error(`Field ${err.field}: ${err.message}`);
    });
  }

  // Safe error handling with fallback
  handleError(
    error,
    (err) => {
      logError(err);
      sendToMonitoring(err);
    },
    (fallbackError) => {
      console.error('Error handler failed:', fallbackError);
    }
  );
}
```

## Error Categories

### Database Errors

```typescript
import {
  ConnectionTimeoutError,
  QueryTimeoutError,
  UniqueViolationError,
  ForeignKeyViolationError,
  DataNotFoundError,
  DeadlockError,
} from '@/errors';

// Connection errors
throw new ConnectionTimeoutError('db.example.com', 5000, {
  metadata: { poolSize: 10, activeConnections: 10 },
});

// Query errors
throw new QueryTimeoutError('SELECT * FROM users WHERE ...', 30000);

// Constraint violations
throw new UniqueViolationError('email', 'user@example.com', {
  table: 'users',
});

// Data errors
throw new DataNotFoundError('User', userId);

// Transaction errors
throw new DeadlockError({
  transactionId: 'tx-123',
  metadata: { involvedTables: ['users', 'accounts'] },
});
```

### Validation Errors

```typescript
import {
  MissingRequiredFieldError,
  TypeValidationError,
  RangeValidationError,
  InvalidEmailError,
  BusinessRuleViolationError,
} from '@/errors';

// Schema validation
throw new MissingRequiredFieldError(['name', 'email', 'password']);

// Type validation
throw new TypeValidationError('age', 'number', 'string', {
  value: 'not-a-number',
});

// Range validation
throw new RangeValidationError('age', 150, 0, 120);

// Format validation
throw new InvalidEmailError('email', 'not-an-email');

// Business rules
throw new BusinessRuleViolationError('minimum-order-value', 'Order total must be at least $10', {
  metadata: { orderTotal: 5.99, minimumRequired: 10 },
});
```

### Network Errors

```typescript
import {
  ConnectionRefusedError,
  RequestTimeoutError,
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
  ServiceUnavailableError,
  ApiRateLimitError,
  createHttpError,
} from '@/errors';

// Connection errors
throw new ConnectionRefusedError('api.example.com', 443);

// Timeout errors
throw new RequestTimeoutError(30000, {
  url: 'https://api.example.com/data',
  metadata: { attempt: 3 },
});

// HTTP errors
throw new BadRequestError('Invalid request body', {
  method: 'POST',
  url: '/api/users',
});

throw new NotFoundError('User', {
  method: 'GET',
  url: '/api/users/123',
});

throw new TooManyRequestsError(60, {
  metadata: { requestCount: 1000, limit: 1000 },
});

// API errors
throw new ApiRateLimitError(1000, 60, {
  apiName: 'OpenAI',
  endpoint: '/v1/chat/completions',
});

// Create HTTP error from status code
throw createHttpError(418, "I'm a teapot", {
  method: 'GET',
  url: '/coffee',
});
```

### Authentication & Authorization Errors

```typescript
import {
  InvalidCredentialsError,
  AccountLockedError,
  MfaRequiredError,
  InsufficientPermissionsError,
  TokenExpiredError,
  SessionExpiredError,
} from '@/errors';

// Authentication
throw new InvalidCredentialsError({ username: 'user@example.com' });

throw new AccountLockedError('Too many failed login attempts', {
  unlockDate: new Date(Date.now() + 3600000),
});

throw new MfaRequiredError(['totp', 'sms']);

// Authorization
throw new InsufficientPermissionsError('users', 'delete', {
  requiredPermissions: ['users:delete'],
  userPermissions: ['users:read', 'users:write'],
});

// Token errors
throw new TokenExpiredError(new Date('2024-01-01'), {
  tokenType: 'access',
});

// Session errors
throw new SessionExpiredError({
  sessionId: 'sess-123',
  expiredAt: new Date(),
});
```

### Configuration Errors

```typescript
import {
  MissingConfigurationError,
  InvalidConfigValueError,
  MissingEnvVariableError,
  NotInitializedError,
  DependencyMissingError,
} from '@/errors';

// Missing configuration
throw new MissingConfigurationError('database.host');

// Invalid configuration
throw new InvalidConfigValueError('port', 'not-a-number', 'number');

// Environment errors
throw new MissingEnvVariableError(['DATABASE_URL', 'API_KEY']);

// Initialization errors
throw new NotInitializedError('DatabaseConnection');

throw new DependencyMissingError('EmailService', ['SMTP_HOST', 'SMTP_PORT']);
```

### Agent Errors

```typescript
import {
  AgentNotFoundError,
  TaskExecutionFailedError,
  SwarmCapacityExceededError,
  ConsensusFailedError,
  MessageDeliveryFailedError,
  MemoryExceededError,
} from '@/errors';

// Agent lifecycle
throw new AgentNotFoundError('agent-123');

// Task errors
throw new TaskExecutionFailedError('task-456', 'Timeout waiting for response', {
  agentId: 'agent-123',
});

// Swarm errors
throw new SwarmCapacityExceededError('swarm-789', 100);

// Coordination errors
throw new ConsensusFailedError('Quorum not reached', {
  swarmId: 'swarm-789',
  round: 3,
});

// Communication errors
throw new MessageDeliveryFailedError('agent-123', 'agent-456', 'Channel closed', {
  messageId: 'msg-789',
});

// State errors
throw new MemoryExceededError('agent-123', 1073741824, 536870912);
```

## Best Practices

### 1. Use Specific Error Types

```typescript
// Good - specific error type
throw new DataNotFoundError('User', userId);

// Bad - generic error
throw new Error('User not found');
```

### 2. Include Rich Metadata

```typescript
// Good - rich context
throw new TaskExecutionFailedError('task-123', 'Validation failed', {
  agentId: 'agent-456',
  metadata: {
    inputSize: 1024,
    validationErrors: ['field1', 'field2'],
    attemptNumber: 3,
  },
});

// Bad - minimal context
throw new TaskExecutionFailedError('task-123', 'Failed');
```

### 3. Preserve Error Chains

```typescript
// Good - preserve original error
try {
  await externalApiCall();
} catch (error) {
  throw new ApiRateLimitError(1000, 60, {
    apiName: 'ExternalAPI',
    cause: error instanceof Error ? error : undefined,
  });
}

// Bad - lose original error
try {
  await externalApiCall();
} catch (error) {
  throw new ApiRateLimitError(1000, 60, { apiName: 'ExternalAPI' });
}
```

### 4. Use Type Guards

```typescript
// Good - type-safe error handling
if (isBaseError(error) && error.category === ErrorCategory.DATABASE) {
  const dbError = error as DatabaseError;
  // Handle database-specific error
}

// Bad - unsafe type casting
const dbError = error as DatabaseError;
```

### 5. Avoid Swallowing Errors

```typescript
// Good - log and re-throw or handle appropriately
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', formatErrorForLogging(error));
  throw error; // or handle appropriately
}

// Bad - silent failure
try {
  await operation();
} catch (error) {
  // Nothing
}
```

## Advanced Patterns

### Error Wrapping

```typescript
import { wrapAsync, createErrorFromUnknown } from '@/errors';

// Wrap async function with error handling
const safeFetchUser = wrapAsync(
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw createHttpError(response.status, await response.text());
    }
    return response.json();
  },
  (error) =>
    new DataNotFoundError('User', userId, {
      cause: error instanceof Error ? error : undefined,
    })
);

// Usage
try {
  const user = await safeFetchUser('123');
} catch (error) {
  // Always a DataNotFoundError or BaseError
}
```

### Error Matching and Filtering

```typescript
import { matchesError, filterErrors, ErrorCategory, ErrorSeverity } from '@/errors';

// Match specific error criteria
if (
  matchesError(error, {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
  })
) {
  await notifyOncall(error);
}

// Filter error arrays
const criticalErrors = filterErrors(errors, {
  severity: ErrorSeverity.CRITICAL,
});

const authErrors = filterErrors(errors, {
  category: ErrorCategory.AUTHENTICATION,
});
```

### Error Chain Analysis

```typescript
import { getErrorChain, findRootCause } from '@/errors';

try {
  await operation();
} catch (error) {
  // Get full error chain
  const chain = getErrorChain(error);
  console.log('Error chain depth:', chain.length);
  chain.forEach((err, i) => {
    console.log(`[${i}] ${err.code}: ${err.message}`);
  });

  // Find root cause
  const rootCause = findRootCause(error);
  console.log('Root cause:', rootCause.code, rootCause.message);
}
```

### Retry Logic

```typescript
import { isRetryableError, getRetryDelay } from '@/errors';

async function retryableOperation<T>(fn: () => Promise<T>, maxAttempts: number = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw error; // Not retryable, fail immediately
      }

      if (attempt < maxAttempts) {
        const delay = getRetryDelay(error, attempt);
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage
const result = await retryableOperation(async () => {
  return await fetchDataFromApi();
});
```

## Error Recovery

### Graceful Degradation

```typescript
async function fetchUserWithFallback(userId: string) {
  try {
    return await fetchUserFromPrimaryDb(userId);
  } catch (error) {
    if (error instanceof ConnectionTimeoutError) {
      // Fallback to cache
      logger.warn('Primary DB timeout, using cache', { userId });
      return await fetchUserFromCache(userId);
    }
    throw error;
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private timeout = 60000;
  private nextAttempt = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (Date.now() < this.nextAttempt) {
      throw new ServiceUnavailableError(Math.floor((this.nextAttempt - Date.now()) / 1000), {
        service: 'CircuitBreaker',
      });
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.nextAttempt = Date.now() + this.timeout;
      }
      throw error;
    }
  }
}
```

## Logging and Monitoring

### Structured Logging

```typescript
import { formatErrorForLogging, formatErrorChainForLogging, summarizeError } from '@/errors';

// Log single error
logger.error('Operation failed', formatErrorForLogging(error));

// Log error chain
logger.error('Operation failed with chain', {
  chain: formatErrorChainForLogging(error),
});

// Log error summary
logger.error('Quick error summary', summarizeError(error));
```

### Error Monitoring

```typescript
function sendToMonitoring(error: unknown) {
  if (!isBaseError(error)) {
    error = createErrorFromUnknown(error);
  }

  const summary = summarizeError(error);

  // Send to monitoring service
  monitoring.recordError({
    message: summary.message,
    code: summary.code,
    category: summary.category,
    severity: summary.severity,
    retryable: summary.isRetryable,
    chain: formatErrorChainForLogging(error),
    timestamp: Date.now(),
  });

  // Alert on critical errors
  if (summary.severity === ErrorSeverity.CRITICAL) {
    alerting.notify({
      level: 'critical',
      message: summary.message,
      code: summary.code,
    });
  }
}
```

### HTTP Error Responses

```typescript
import { isBaseError } from '@/errors';

function errorToHttpResponse(error: unknown) {
  if (isBaseError(error)) {
    return {
      status: error.httpStatus || 500,
      body: {
        error: {
          code: error.code,
          message: error.message,
          category: error.category,
          ...(error instanceof ValidationError && {
            errors: error.errors,
          }),
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
  };
}
```

## Error Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { DataNotFoundError, isBaseError, ErrorCategory } from '@/errors';

describe('Error handling', () => {
  it('should throw typed error', () => {
    expect(() => {
      throw new DataNotFoundError('User', '123');
    }).toThrow(DataNotFoundError);
  });

  it('should have correct properties', () => {
    const error = new DataNotFoundError('User', '123');
    expect(error.code).toBe('DB_2300');
    expect(error.category).toBe(ErrorCategory.DATABASE);
    expect(error.metadata.resource).toBe('User');
    expect(error.metadata.identifier).toBe('123');
  });

  it('should serialize correctly', () => {
    const error = new DataNotFoundError('User', '123');
    const json = error.toJSON();
    expect(json.name).toBe('DataNotFoundError');
    expect(json.code).toBe('DB_2300');
    expect(json.category).toBe(ErrorCategory.DATABASE);
  });
});
```

## Summary

The Agentic Flow error system provides:

1. **Type Safety** - Full TypeScript support
2. **Rich Context** - Metadata and error chains
3. **Categorization** - Domain-specific error types
4. **Utilities** - Helpers for matching, filtering, and retry logic
5. **Monitoring** - Structured logging and serialization
6. **Best Practices** - Patterns for error handling and recovery

Always use specific error types, include rich metadata, preserve error chains, and handle errors appropriately based on their category and severity.
