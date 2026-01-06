# Structured Logging System Documentation

## Overview

The Agentic Flow platform uses Winston for production-ready structured logging. This system replaces the previous console.log statements with a robust, configurable logging infrastructure that supports multiple log levels, formats, and transports.

## Quick Start

### Basic Usage

```typescript
import { logger } from '@/utils/logger';

// Simple logging
logger.info('Application started');
logger.error('An error occurred');
logger.debug('Debug information');
logger.warn('Warning message');

// Structured logging with context
logger.info('User action performed', {
  userId: 'user-123',
  action: 'login',
  timestamp: Date.now(),
});

// Error logging with context
logger.error('Database connection failed', {
  error: err,
  database: 'main',
  retries: 3,
});
```

### Component-Specific Loggers

Create loggers with default context for specific components:

```typescript
import { createComponentLogger } from '@/utils/logger';

const dbLogger = createComponentLogger('database');
dbLogger.info('Connection established'); // Automatically includes component: 'database'

const apiLogger = createComponentLogger('api');
apiLogger.http('Request received', { method: 'GET', path: '/users' });
```

### Agent and Swarm Loggers

Special helpers for agent-based logging:

```typescript
import { createAgentLogger, createSwarmLogger, createTaskLogger } from '@/utils/logger';

// Agent logger
const agentLogger = createAgentLogger('agent-abc-123', 'swarm-xyz');
agentLogger.info('Task started', { taskId: 'task-001' });

// Swarm logger
const swarmLogger = createSwarmLogger('swarm-xyz');
swarmLogger.info('Swarm initialized', { agentCount: 5 });

// Task logger
const taskLogger = createTaskLogger('task-001');
taskLogger.debug('Task processing', { progress: 0.75 });
```

## Log Levels

The system supports six log levels (from highest to lowest priority):

1. **error** - Error events that might still allow the application to continue
2. **warn** - Warning messages for potentially harmful situations
3. **info** - Informational messages highlighting application progress
4. **http** - HTTP request/response logging
5. **debug** - Detailed debug information
6. **verbose** - Very detailed tracing information

### Environment-Based Defaults

- **Production**: `info` level (logs info, warn, error)
- **Development**: `debug` level (logs debug and above)
- **Test**: `error` level (logs errors only)

Override with `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug npm start
```

## Configuration

### Environment Variables

```bash
# Log level (error, warn, info, http, debug, verbose)
LOG_LEVEL=info

# Log format (json for structured logs)
LOG_FORMAT=json

# Log directory (default: ./logs)
LOG_DIR=/var/log/agent-control-plane

# Disable all logs
SILENT_LOGS=true
```

### Runtime Reconfiguration

```typescript
import { reconfigureLogger } from '@/utils/logger';

reconfigureLogger({
  level: LogLevel.DEBUG,
  enableFile: true,
  logDirectory: '/custom/log/path',
});
```

## Advanced Features

### Child Loggers

Create child loggers that inherit parent context:

```typescript
import { Logger } from '@/utils/logger';

const parentLogger = new Logger({ service: 'api' });
const childLogger = parentLogger.child({ userId: 'user-123' });

childLogger.info('User authenticated');
// Logs with both service: 'api' and userId: 'user-123'
```

### Performance Timing

Automatically log execution time:

```typescript
import { Logger } from '@/utils/logger';

const logger = new Logger({ component: 'processor' });

const result = await logger.time(
  'Data processing',
  async () => {
    // Your async operation
    return await processData();
  },
  { recordCount: 1000 }
);
// Automatically logs duration and status
```

### Log Context Interface

Standard context fields for consistency:

```typescript
interface LogContext {
  userId?: string; // User identifier
  agentId?: string; // Agent identifier
  swarmId?: string; // Swarm identifier
  taskId?: string; // Task identifier
  sessionId?: string; // Session identifier
  requestId?: string; // Request identifier
  component?: string; // Component name
  action?: string; // Action being performed
  duration?: number; // Operation duration (ms)
  error?: Error; // Error object
  metadata?: Record<string, unknown>; // Additional metadata
}
```

## File Logging (Production)

In production, logs are automatically written to files:

### Log Files

- **combined.log** - All logs (info and above)
- **error.log** - Error logs only
- **http.log** - HTTP request/response logs

### Rotation Settings

- **Max Size**: 20MB per file
- **Max Files**: 14 (keeps 2 weeks of logs)
- **Format**: JSON for easy parsing

### Example Production Setup

```typescript
// Production environment automatically enables file logging
NODE_ENV=production LOG_DIR=/var/log/agent-control-plane npm start
```

## Migration Guide

### Replacing console.log

Before:

```typescript
console.log('User logged in:', userId);
console.error('Database error:', error);
console.debug('Processing data:', data);
```

After:

```typescript
import { logger } from '@/utils/logger';

logger.info('User logged in', { userId });
logger.error('Database error', { error });
logger.debug('Processing data', { data });
```

### Replacing console.error

Before:

```typescript
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error);
}
```

After:

```typescript
import { logger } from '@/utils/logger';

try {
  await operation();
} catch (error) {
  logger.error('Operation failed', {
    error,
    operation: 'operation_name',
    component: 'component_name',
  });
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logger.error('Critical system failure', { error, component: 'auth' });
logger.warn('API rate limit approaching', { usage: 95 });
logger.info('User registration completed', { userId });
logger.debug('Cache hit for key', { key, ttl: 300 });

// ❌ Bad
logger.info('System crashed'); // Should be error
logger.error('User clicked button'); // Should be debug
```

### 2. Include Contextual Information

```typescript
// ✅ Good - Rich context
logger.info('Payment processed', {
  userId: 'user-123',
  amount: 99.99,
  currency: 'USD',
  paymentId: 'pay-abc',
  duration: 1234,
});

// ❌ Bad - No context
logger.info('Payment successful');
```

### 3. Use Component Loggers

```typescript
// ✅ Good - Component-specific logger
const authLogger = createComponentLogger('authentication');
authLogger.info('Login attempt', { userId, method: 'oauth' });

// ❌ Bad - Generic logger without context
logger.info('Login attempt');
```

### 4. Log Errors Properly

```typescript
// ✅ Good - Error object included
logger.error('Database query failed', {
  error: err,
  query: 'SELECT * FROM users',
  component: 'database',
});

// ❌ Bad - Error message only
logger.error('Database query failed');
```

### 5. Use Timing for Performance Monitoring

```typescript
// ✅ Good - Automatic timing
await logger.time(
  'API call',
  async () => {
    return await fetch(url);
  },
  { endpoint: url }
);

// ❌ Bad - Manual timing
const start = Date.now();
await fetch(url);
logger.info('API call took', { duration: Date.now() - start });
```

## Log Analysis

### JSON Format for Production

Production logs use JSON format for easy parsing and analysis:

```json
{
  "level": "info",
  "message": "User action performed",
  "timestamp": "2025-12-07T23:00:00.000Z",
  "userId": "user-123",
  "action": "login",
  "component": "authentication"
}
```

### Query Examples

Using `jq` to analyze logs:

```bash
# Find all errors
cat logs/error.log | jq 'select(.level == "error")'

# Find logs for specific user
cat logs/combined.log | jq 'select(.userId == "user-123")'

# Calculate average duration for component
cat logs/combined.log | jq -s 'map(select(.component == "api")) | map(.duration) | add/length'

# Count errors by component
cat logs/error.log | jq -s 'group_by(.component) | map({component: .[0].component, count: length})'
```

## Testing

### Suppress Logs in Tests

```typescript
// Set environment variable
process.env.SILENT_LOGS = 'true';

// Or configure logger
import { reconfigureLogger, LogLevel } from '@/utils/logger';

beforeAll(() => {
  reconfigureLogger({ level: LogLevel.ERROR });
});
```

### Mock Logger for Unit Tests

```typescript
import { Logger } from '@/utils/logger';

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
```

## Troubleshooting

### Logs Not Appearing

1. Check log level: Ensure `LOG_LEVEL` allows your messages
2. Check silent mode: Verify `SILENT_LOGS` is not set to 'true'
3. Check file permissions: Ensure write access to log directory

### File Logs Not Created

1. Set `NODE_ENV=production` to enable file logging
2. Verify log directory exists and is writable
3. Check `LOG_DIR` environment variable

### Performance Impact

The logging system is designed for production use with minimal overhead:

- Async file writes (non-blocking)
- Efficient JSON serialization
- Configurable log rotation
- Level-based filtering

## API Reference

### Main Logger Instance

```typescript
import { logger } from '@/utils/logger';

logger.error(message: string, context?: LogContext): void
logger.warn(message: string, context?: LogContext): void
logger.info(message: string, context?: LogContext): void
logger.http(message: string, context?: LogContext): void
logger.debug(message: string, context?: LogContext): void
logger.verbose(message: string, context?: LogContext): void
```

### Logger Class

```typescript
import { Logger } from '@/utils/logger';

const logger = new Logger(defaultContext?: LogContext);

logger.log(level: LogLevel, message: string, context?: LogContext): void
logger.child(context: LogContext): Logger
logger.time<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T>
logger.getLogger(): winston.Logger
```

### Factory Functions

```typescript
import {
  createChildLogger,
  createComponentLogger,
  createAgentLogger,
  createSwarmLogger,
  createTaskLogger,
  createSessionLogger
} from '@/utils/logger';

createChildLogger(context: LogContext): Logger
createComponentLogger(component: string): Logger
createAgentLogger(agentId: string, swarmId?: string): Logger
createSwarmLogger(swarmId: string): Logger
createTaskLogger(taskId: string): Logger
createSessionLogger(sessionId: string): Logger
```

### Utility Functions

```typescript
import { reconfigureLogger, closeLogger } from '@/utils/logger';

reconfigureLogger(config: Partial<LoggerConfig>): void
closeLogger(): Promise<void>
```

## Support

For issues or questions about the logging system:

1. Check this documentation
2. Review the source code: `/src/utils/logger.ts`
3. Create an issue in the repository
4. Contact the development team

## Changelog

### Version 1.0.0 (2025-12-07)

- Initial implementation with Winston
- Environment-based configuration
- Multiple log levels and transports
- Component-specific loggers
- Agent/Swarm/Task logger helpers
- Performance timing utilities
- Production-ready file logging
- Comprehensive documentation
