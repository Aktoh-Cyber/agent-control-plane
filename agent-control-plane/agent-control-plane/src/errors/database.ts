/**
 * Database Error Types
 *
 * Comprehensive error hierarchy for database operations including:
 * - Connection errors
 * - Query errors
 * - Constraint violations
 * - Transaction errors
 * - Migration errors
 */

import { ErrorCategory, ErrorMetadata, ErrorSeverity, OperationalError } from './base';

/**
 * Error code ranges: 2000-2999
 */
export enum DatabaseErrorCode {
  // Connection errors: 2000-2099
  CONNECTION_FAILED = 'DB_2000',
  CONNECTION_TIMEOUT = 'DB_2001',
  CONNECTION_REFUSED = 'DB_2002',
  CONNECTION_LOST = 'DB_2003',
  CONNECTION_POOL_EXHAUSTED = 'DB_2004',
  AUTHENTICATION_FAILED = 'DB_2005',

  // Query errors: 2100-2199
  QUERY_FAILED = 'DB_2100',
  QUERY_TIMEOUT = 'DB_2101',
  SYNTAX_ERROR = 'DB_2102',
  INVALID_QUERY = 'DB_2103',
  QUERY_CANCELLED = 'DB_2104',

  // Constraint violations: 2200-2299
  CONSTRAINT_VIOLATION = 'DB_2200',
  UNIQUE_VIOLATION = 'DB_2201',
  FOREIGN_KEY_VIOLATION = 'DB_2202',
  NOT_NULL_VIOLATION = 'DB_2203',
  CHECK_VIOLATION = 'DB_2204',
  EXCLUSION_VIOLATION = 'DB_2205',

  // Data errors: 2300-2399
  DATA_NOT_FOUND = 'DB_2300',
  DUPLICATE_ENTRY = 'DB_2301',
  INVALID_DATA_TYPE = 'DB_2302',
  DATA_TRUNCATED = 'DB_2303',
  OUT_OF_RANGE = 'DB_2304',

  // Transaction errors: 2400-2499
  TRANSACTION_FAILED = 'DB_2400',
  DEADLOCK_DETECTED = 'DB_2401',
  SERIALIZATION_FAILURE = 'DB_2402',
  TRANSACTION_TIMEOUT = 'DB_2403',
  ROLLBACK_FAILED = 'DB_2404',

  // Migration errors: 2500-2599
  MIGRATION_FAILED = 'DB_2500',
  MIGRATION_CONFLICT = 'DB_2501',
  SCHEMA_MISMATCH = 'DB_2502',
  VERSION_CONFLICT = 'DB_2503',

  // General errors: 2900-2999
  UNKNOWN_DATABASE_ERROR = 'DB_2900',
  DATABASE_UNAVAILABLE = 'DB_2901',
  OPERATION_NOT_SUPPORTED = 'DB_2902',
}

/**
 * Base database error
 */
export class DatabaseError extends OperationalError {
  constructor(
    message: string,
    code: DatabaseErrorCode,
    options?: {
      severity?: ErrorSeverity;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, ErrorCategory.DATABASE, {
      ...options,
      httpStatus: 500,
    });
  }
}

/**
 * Database connection errors
 */
export class ConnectionError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.CONNECTION_FAILED,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.HIGH,
    });
  }
}

export class ConnectionTimeoutError extends ConnectionError {
  constructor(
    timeout: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Database connection timeout after ${timeout}ms`, DatabaseErrorCode.CONNECTION_TIMEOUT, {
      ...options,
      metadata: {
        ...options?.metadata,
        timeout,
      },
    });
  }
}

export class ConnectionPoolExhaustedError extends ConnectionError {
  constructor(
    poolSize: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Connection pool exhausted: all ${poolSize} connections are in use`,
      DatabaseErrorCode.CONNECTION_POOL_EXHAUSTED,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          poolSize,
        },
      }
    );
  }
}

/**
 * Query errors
 */
export class QueryError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.QUERY_FAILED,
    options?: {
      query?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        query: options?.query,
      },
    });
  }
}

export class QueryTimeoutError extends QueryError {
  constructor(
    query: string,
    timeout: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Query timeout after ${timeout}ms`, DatabaseErrorCode.QUERY_TIMEOUT, {
      ...options,
      query,
      metadata: {
        ...options?.metadata,
        timeout,
      },
    });
  }
}

export class QuerySyntaxError extends QueryError {
  constructor(
    message: string,
    query: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`SQL syntax error: ${message}`, DatabaseErrorCode.SYNTAX_ERROR, {
      ...options,
      query,
    });
  }
}

/**
 * Constraint violation errors
 */
export class ConstraintViolationError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.CONSTRAINT_VIOLATION,
    options?: {
      constraint?: string;
      table?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        ...options?.metadata,
        constraint: options?.constraint,
        table: options?.table,
      },
    });
  }
}

export class UniqueViolationError extends ConstraintViolationError {
  constructor(
    field: string,
    value: unknown,
    options?: {
      table?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Unique constraint violation on field '${field}'`, DatabaseErrorCode.UNIQUE_VIOLATION, {
      ...options,
      constraint: field,
      metadata: {
        ...options?.metadata,
        field,
        value,
      },
    });
  }
}

export class ForeignKeyViolationError extends ConstraintViolationError {
  constructor(
    foreignKey: string,
    options?: {
      table?: string;
      referencedTable?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Foreign key constraint violation: '${foreignKey}'`,
      DatabaseErrorCode.FOREIGN_KEY_VIOLATION,
      {
        ...options,
        constraint: foreignKey,
        metadata: {
          ...options?.metadata,
          foreignKey,
          referencedTable: options?.referencedTable,
        },
      }
    );
  }
}

export class NotNullViolationError extends ConstraintViolationError {
  constructor(
    field: string,
    options?: {
      table?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Not null constraint violation on field '${field}'`,
      DatabaseErrorCode.NOT_NULL_VIOLATION,
      {
        ...options,
        constraint: field,
        metadata: {
          ...options?.metadata,
          field,
        },
      }
    );
  }
}

/**
 * Data errors
 */
export class DataNotFoundError extends DatabaseError {
  constructor(
    resource: string,
    identifier: string | number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `${resource} not found with identifier: ${identifier}`,
      DatabaseErrorCode.DATA_NOT_FOUND,
      {
        ...options,
        severity: ErrorSeverity.LOW,
        metadata: {
          ...options?.metadata,
          resource,
          identifier,
        },
      }
    );
  }
}

export class DuplicateEntryError extends DatabaseError {
  constructor(
    resource: string,
    field: string,
    value: unknown,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Duplicate entry for ${resource}.${field}: ${value}`, DatabaseErrorCode.DUPLICATE_ENTRY, {
      ...options,
      metadata: {
        ...options?.metadata,
        resource,
        field,
        value,
      },
    });
  }
}

/**
 * Transaction errors
 */
export class TransactionError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.TRANSACTION_FAILED,
    options?: {
      transactionId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        transactionId: options?.transactionId,
      },
    });
  }
}

export class DeadlockError extends TransactionError {
  constructor(options?: { transactionId?: string; metadata?: ErrorMetadata; cause?: Error }) {
    super('Transaction deadlock detected', DatabaseErrorCode.DEADLOCK_DETECTED, options);
  }
}

export class SerializationFailureError extends TransactionError {
  constructor(options?: { transactionId?: string; metadata?: ErrorMetadata; cause?: Error }) {
    super('Transaction serialization failure', DatabaseErrorCode.SERIALIZATION_FAILURE, options);
  }
}

/**
 * Migration errors
 */
export class MigrationError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.MIGRATION_FAILED,
    options?: {
      version?: string | number;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.CRITICAL,
      metadata: {
        ...options?.metadata,
        version: options?.version,
      },
    });
  }
}

export class SchemaMismatchError extends MigrationError {
  constructor(
    expected: string,
    actual: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Schema mismatch: expected ${expected}, got ${actual}`,
      DatabaseErrorCode.SCHEMA_MISMATCH,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          expected,
          actual,
        },
      }
    );
  }
}
