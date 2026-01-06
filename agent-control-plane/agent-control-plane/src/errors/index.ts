/**
 * Agentic Flow Error System
 *
 * Comprehensive typed error hierarchy with:
 * - Base error classes and utilities
 * - Domain-specific error types
 * - Error factories and helpers
 * - Type guards and converters
 *
 * Error Code Ranges:
 * - 2000-2999: Database errors
 * - 3000-3999: Validation errors
 * - 4000-4999: Network errors
 * - 5000-5999: Authentication/Authorization errors
 * - 6000-6999: Configuration errors
 * - 7000-7999: Agent errors
 */

// Base error exports
export {
  BaseError,
  ErrorCategory,
  ErrorSeverity,
  OperationalError,
  ProgrammingError,
  getErrorMessage,
  isBaseError,
  isOperationalError,
  isProgrammingError,
  toBaseError,
  type ErrorMetadata,
  type SerializedError,
} from './base';

// Database error exports
export {
  ConnectionError,
  ConnectionPoolExhaustedError,
  ConnectionTimeoutError,
  ConstraintViolationError,
  DataNotFoundError,
  DatabaseError,
  DatabaseErrorCode,
  DeadlockError,
  DuplicateEntryError,
  ForeignKeyViolationError,
  MigrationError,
  NotNullViolationError,
  QueryError,
  QuerySyntaxError,
  QueryTimeoutError,
  SchemaMismatchError,
  SerializationFailureError,
  TransactionError,
  UniqueViolationError,
} from './database';

// Validation error exports
export {
  BusinessRuleViolationError,
  FormatValidationError,
  InvalidEmailError,
  InvalidEnumError,
  InvalidJsonError,
  InvalidStateTransitionError,
  InvalidUrlError,
  InvalidUuidError,
  LengthValidationError,
  MissingRequiredFieldError,
  PatternValidationError,
  RangeValidationError,
  SchemaValidationError,
  TypeValidationError,
  UnknownFieldError,
  ValidationError,
  ValidationErrorCode,
  type ValidationErrorDetail,
} from './validation';

// Network error exports
export {
  ApiError,
  ApiKeyInvalidError,
  ApiQuotaExceededError,
  ApiRateLimitError,
  BadGatewayError,
  BadRequestError,
  CertificateError,
  ConflictError,
  ConnectionRefusedError,
  DnsLookupError,
  ForbiddenError,
  GatewayTimeoutError,
  HttpError,
  InternalServerError,
  MethodNotAllowedError,
  ConnectionError as NetworkConnectionError,
  NetworkError,
  NetworkErrorCode,
  ConnectionTimeoutError as NetworkTimeoutError,
  NotFoundError,
  PayloadTooLargeError,
  ProtocolError,
  RequestTimeoutError,
  ServiceUnavailableError,
  SslError,
  TimeoutError,
  TooManyRequestsError,
  createHttpError,
  type HttpMethod,
} from './network';

// Auth error exports
export {
  AccessDeniedError,
  AccountDisabledError,
  AccountLockedError,
  AuthErrorCode,
  AuthenticationError,
  AuthorizationError,
  ConcurrentSessionLimitError,
  InsufficientPermissionsError,
  InvalidClientError,
  InvalidCredentialsError,
  InvalidGrantError,
  InvalidScopeError,
  MfaFailedError,
  MfaRequiredError,
  OAuthError,
  RefreshTokenInvalidError,
  RoleRequiredError,
  SessionError,
  SessionExpiredError,
  SessionNotFoundError,
  TokenError,
  TokenExpiredError,
  TokenInvalidError,
  TokenMalformedError,
  TokenRevokedError,
  UserNotFoundError,
} from './auth';

// Configuration error exports
export {
  AlreadyInitializedError,
  ConfigConflictError,
  ConfigDeprecationError,
  ConfigErrorCode,
  ConfigFileNotFoundError,
  ConfigValidationFailedError,
  ConfigurationError,
  DependencyMissingError,
  EnvironmentError,
  InitializationError,
  InvalidConfigValueError,
  InvalidConfigurationError,
  InvalidEnvValueError,
  MissingConfigurationError,
  MissingEnvVariableError,
  MissingRequiredConfigFieldError,
  NotInitializedError,
  UnsupportedEnvironmentError,
} from './configuration';

// Agent error exports
export {
  AgentAlreadyExistsError,
  AgentCreationFailedError,
  AgentError,
  AgentErrorCode,
  AgentInitializationFailedError,
  AgentNotFoundError,
  AgentTimeoutError,
  CapabilityNotSupportedError,
  ChannelClosedError,
  CommunicationError,
  ConsensusFailedError,
  CoordinationError,
  InvalidStateError,
  LeaderElectionFailedError,
  MemoryExceededError,
  MessageDeliveryFailedError,
  QuorumNotReachedError,
  ResourceExhaustedError,
  StateError,
  SwarmCapacityExceededError,
  SwarmError,
  SwarmNotFoundError,
  SwarmPartitionError,
  TaskCancelledError,
  TaskDependencyFailedError,
  TaskError,
  TaskExecutionFailedError,
  TaskNotFoundError,
  TaskTimeoutError,
  TopologyInvalidError,
} from './agent';

/**
 * Error factory - creates appropriate error from unknown error
 */
export function createErrorFromUnknown(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): BaseError {
  if (isBaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new OperationalError(
      error.message || defaultMessage,
      'UNKNOWN_ERROR',
      ErrorCategory.SYSTEM,
      {
        cause: error,
        metadata: {
          originalName: error.name,
          originalStack: error.stack,
        },
      }
    );
  }

  return new OperationalError(defaultMessage, 'UNKNOWN_ERROR', ErrorCategory.SYSTEM, {
    metadata: {
      originalError: String(error),
    },
  });
}

/**
 * Error handler - safely handles errors with fallback
 */
export function handleError(
  error: unknown,
  handler: (err: BaseError) => void,
  fallback?: (err: unknown) => void
): void {
  try {
    const baseError = isBaseError(error) ? error : createErrorFromUnknown(error);
    handler(baseError);
  } catch (handlerError) {
    if (fallback) {
      fallback(handlerError);
    } else {
      console.error('Error handler failed:', handlerError);
    }
  }
}

/**
 * Async error wrapper - wraps async functions with error handling
 */
export function wrapAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorFactory?: (error: unknown) => BaseError
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorFactory) {
        throw errorFactory(error);
      }
      throw isBaseError(error) ? error : createErrorFromUnknown(error);
    }
  };
}

/**
 * Error matcher - checks if error matches criteria
 */
export interface ErrorMatcher {
  category?: ErrorCategory;
  code?: string;
  severity?: ErrorSeverity;
  httpStatus?: number;
}

export function matchesError(error: unknown, matcher: ErrorMatcher): boolean {
  if (!isBaseError(error)) {
    return false;
  }

  if (matcher.category && error.category !== matcher.category) {
    return false;
  }

  if (matcher.code && error.code !== matcher.code) {
    return false;
  }

  if (matcher.severity && error.severity !== matcher.severity) {
    return false;
  }

  if (matcher.httpStatus && error.httpStatus !== matcher.httpStatus) {
    return false;
  }

  return true;
}

/**
 * Error filter - filters errors by criteria
 */
export function filterErrors(errors: unknown[], matcher: ErrorMatcher): BaseError[] {
  return errors.filter(isBaseError).filter((err) => matchesError(err, matcher));
}

/**
 * Get error chain - returns array of errors from cause chain
 */
export function getErrorChain(error: unknown): BaseError[] {
  const chain: BaseError[] = [];
  let current = error;

  while (current) {
    if (isBaseError(current)) {
      chain.push(current);
      current = current.cause;
    } else if (current instanceof Error) {
      // Convert to BaseError and add to chain
      const baseError = createErrorFromUnknown(current);
      chain.push(baseError);
      break;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Find root cause - returns the deepest error in the cause chain
 */
export function findRootCause(error: unknown): BaseError {
  const chain = getErrorChain(error);
  return chain[chain.length - 1] || createErrorFromUnknown(error);
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (isBaseError(error)) {
    return error.toLogFormat();
  }

  if (error instanceof Error) {
    return {
      error: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    error: 'Unknown',
    message: String(error),
  };
}

/**
 * Format error chain for logging
 */
export function formatErrorChainForLogging(error: unknown): Record<string, unknown>[] {
  const chain = getErrorChain(error);
  return chain.map((err) => err.toLogFormat());
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!isBaseError(error)) {
    return false;
  }

  // Network timeouts and temporary failures are retryable
  if (error.category === ErrorCategory.NETWORK) {
    const retryableStatuses = [408, 429, 502, 503, 504];
    if (error.httpStatus && retryableStatuses.includes(error.httpStatus)) {
      return true;
    }
  }

  // Database deadlocks and serialization failures are retryable
  if (error.category === ErrorCategory.DATABASE) {
    const code = error.code;
    if (code === 'DB_2401' || code === 'DB_2402') {
      // Deadlock or serialization failure
      return true;
    }
  }

  // Task timeouts and temporary agent unavailability are retryable
  if (error.category === ErrorCategory.AGENT) {
    const code = error.code;
    if (code === 'AGT_7303' || code === 'AGT_7900') {
      // Task timeout or agent unavailable
      return true;
    }
  }

  return false;
}

/**
 * Get retry delay based on error
 */
export function getRetryDelay(error: unknown, attempt: number = 1): number {
  if (!isBaseError(error)) {
    return 1000 * Math.pow(2, attempt - 1); // Exponential backoff
  }

  // Check for Retry-After hint in metadata
  const retryAfter = error.metadata?.retryAfter;
  if (typeof retryAfter === 'number') {
    return retryAfter * 1000;
  }

  // Exponential backoff with jitter
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.1 * delay;

  return delay + jitter;
}

/**
 * Error summary for quick diagnostics
 */
export interface ErrorSummary {
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  chainDepth: number;
  rootCause?: string;
}

export function summarizeError(error: unknown): ErrorSummary {
  const baseError = isBaseError(error) ? error : createErrorFromUnknown(error);
  const chain = getErrorChain(error);
  const rootCause = chain[chain.length - 1];

  return {
    message: baseError.message,
    code: baseError.code,
    category: baseError.category,
    severity: baseError.severity,
    isRetryable: isRetryableError(baseError),
    chainDepth: chain.length,
    rootCause:
      rootCause && rootCause !== baseError ? `${rootCause.code}: ${rootCause.message}` : undefined,
  };
}
