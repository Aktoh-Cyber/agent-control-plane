/**
 * Base Error Classes for Agentic Flow
 *
 * Provides a comprehensive typed error hierarchy with:
 * - Error codes and categorization
 * - Structured metadata
 * - Serialization support
 * - Stack trace preservation
 * - HTTP status code mapping
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  DATABASE = 'database',
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  CONFIGURATION = 'configuration',
  AGENT = 'agent',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
}

/**
 * Error metadata interface
 */
export interface ErrorMetadata {
  [key: string]: unknown;
  timestamp?: number;
  requestId?: string;
  userId?: string;
  resource?: string;
  operation?: string;
  details?: Record<string, unknown>;
}

/**
 * Serialized error format
 */
export interface SerializedError {
  name: string;
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  metadata: ErrorMetadata;
  stack?: string;
  cause?: SerializedError;
  httpStatus?: number;
  timestamp: number;
}

/**
 * Base error class with enhanced functionality
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: number;
  public readonly httpStatus?: number;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    options: {
      severity?: ErrorSeverity;
      metadata?: ErrorMetadata;
      cause?: Error;
      httpStatus?: number;
    } = {}
  ) {
    super(message, { cause: options.cause });

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.metadata = {
      ...options.metadata,
      timestamp: Date.now(),
    };
    this.timestamp = Date.now();
    this.httpStatus = options.httpStatus;

    // Ensure prototype chain is correct (TypeScript issue)
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serialize error to JSON-safe format
   */
  toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      stack: this.stack,
      cause:
        this.cause instanceof BaseError
          ? this.cause.toJSON()
          : this.cause instanceof Error
            ? ({
                name: this.cause.name,
                message: this.cause.message,
                stack: this.cause.stack,
              } as SerializedError)
            : undefined,
      httpStatus: this.httpStatus,
      timestamp: this.timestamp,
    };
  }

  /**
   * Format error for logging
   */
  toLogFormat(): Record<string, unknown> {
    return {
      error: this.name,
      code: this.code,
      category: this.category,
      severity: this.severity,
      message: this.message,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Check if error is of a specific category
   */
  isCategory(category: ErrorCategory): boolean {
    return this.category === category;
  }

  /**
   * Check if error severity is at least the specified level
   */
  isSeverity(minSeverity: ErrorSeverity): boolean {
    const severityOrder = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3,
    };

    return severityOrder[this.severity] >= severityOrder[minSeverity];
  }

  /**
   * Create a new error with additional metadata
   */
  withMetadata(metadata: ErrorMetadata): this {
    // Use constructor type assertion with proper typing
    type ErrorConstructor = new (
      message: string,
      options: {
        severity?: ErrorSeverity;
        metadata?: ErrorMetadata;
        cause?: Error;
        httpStatus?: number;
      }
    ) => this;

    return new (this.constructor as ErrorConstructor)(this.message, {
      severity: this.severity,
      metadata: { ...this.metadata, ...metadata },
      cause: this.cause,
      httpStatus: this.httpStatus,
    });
  }
}

/**
 * Operational error - expected errors that can be handled
 */
export class OperationalError extends BaseError {
  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    options?: {
      severity?: ErrorSeverity;
      metadata?: ErrorMetadata;
      cause?: Error;
      httpStatus?: number;
    }
  ) {
    super(message, code, category, options);
  }
}

/**
 * Programming error - bugs that should not happen
 */
export class ProgrammingError extends BaseError {
  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, category, {
      ...options,
      severity: ErrorSeverity.CRITICAL,
      httpStatus: 500,
    });
  }
}

/**
 * Type guard to check if error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): error is OperationalError {
  return error instanceof OperationalError;
}

/**
 * Type guard to check if error is a programming error
 */
export function isProgrammingError(error: unknown): error is ProgrammingError {
  return error instanceof ProgrammingError;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Convert unknown error to BaseError
 */
export function toBaseError(error: unknown, defaultCode = 'UNKNOWN_ERROR'): BaseError {
  if (isBaseError(error)) {
    return error;
  }

  const message = getErrorMessage(error);
  const cause = error instanceof Error ? error : undefined;

  return new OperationalError(message, defaultCode, ErrorCategory.SYSTEM, {
    severity: ErrorSeverity.MEDIUM,
    cause,
    metadata: {
      originalError: typeof error === 'object' ? JSON.stringify(error) : String(error),
    },
  });
}
