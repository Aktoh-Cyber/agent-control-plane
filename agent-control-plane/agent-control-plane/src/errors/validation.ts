/**
 * Validation Error Types
 *
 * Comprehensive error hierarchy for validation operations including:
 * - Schema validation
 * - Type validation
 * - Business rule validation
 * - Input validation
 * - Format validation
 */

import { ErrorCategory, ErrorMetadata, ErrorSeverity, OperationalError } from './base';

/**
 * Error code ranges: 3000-3999
 */
export enum ValidationErrorCode {
  // Schema validation: 3000-3099
  SCHEMA_VALIDATION_FAILED = 'VAL_3000',
  INVALID_SCHEMA = 'VAL_3001',
  MISSING_REQUIRED_FIELD = 'VAL_3002',
  UNKNOWN_FIELD = 'VAL_3003',
  SCHEMA_MISMATCH = 'VAL_3004',

  // Type validation: 3100-3199
  TYPE_VALIDATION_FAILED = 'VAL_3100',
  INVALID_TYPE = 'VAL_3101',
  INVALID_FORMAT = 'VAL_3102',
  INVALID_LENGTH = 'VAL_3103',
  INVALID_RANGE = 'VAL_3104',
  INVALID_PATTERN = 'VAL_3105',

  // Business rules: 3200-3299
  BUSINESS_RULE_VIOLATION = 'VAL_3200',
  INVALID_STATE_TRANSITION = 'VAL_3201',
  PRECONDITION_FAILED = 'VAL_3202',
  POSTCONDITION_FAILED = 'VAL_3203',
  INVARIANT_VIOLATION = 'VAL_3204',

  // Input validation: 3300-3399
  INVALID_INPUT = 'VAL_3300',
  INVALID_EMAIL = 'VAL_3301',
  INVALID_URL = 'VAL_3302',
  INVALID_PHONE = 'VAL_3303',
  INVALID_DATE = 'VAL_3304',
  INVALID_UUID = 'VAL_3305',
  INVALID_JSON = 'VAL_3306',

  // Data validation: 3400-3499
  DATA_VALIDATION_FAILED = 'VAL_3400',
  EMPTY_VALUE = 'VAL_3401',
  TOO_SMALL = 'VAL_3402',
  TOO_LARGE = 'VAL_3403',
  INVALID_ENUM_VALUE = 'VAL_3404',
  INVALID_ARRAY_LENGTH = 'VAL_3405',

  // General: 3900-3999
  VALIDATION_ERROR = 'VAL_3900',
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  value?: unknown;
  constraint: string;
  message: string;
}

/**
 * Base validation error
 */
export class ValidationError extends OperationalError {
  public readonly errors: ValidationErrorDetail[];

  constructor(
    message: string,
    code: ValidationErrorCode,
    options?: {
      errors?: ValidationErrorDetail[];
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, ErrorCategory.VALIDATION, {
      ...options,
      severity: ErrorSeverity.LOW,
      httpStatus: 400,
      metadata: {
        ...options?.metadata,
        errorCount: options?.errors?.length || 0,
      },
    });

    this.errors = options?.errors || [];
  }

  /**
   * Add a validation error detail
   */
  addError(detail: ValidationErrorDetail): this {
    this.errors.push(detail);
    return this;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): ValidationErrorDetail[] {
    return this.errors.filter((e) => e.field === field);
  }

  /**
   * Check if field has errors
   */
  hasFieldError(field: string): boolean {
    return this.errors.some((e) => e.field === field);
  }

  /**
   * Override toJSON to include validation errors
   */
  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Schema validation errors
 */
export class SchemaValidationError extends ValidationError {
  constructor(
    message: string,
    errors?: ValidationErrorDetail[],
    options?: {
      schema?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, ValidationErrorCode.SCHEMA_VALIDATION_FAILED, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        schema: options?.schema,
      },
    });
  }
}

export class MissingRequiredFieldError extends SchemaValidationError {
  constructor(
    fields: string[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = fields.map((field) => ({
      field,
      constraint: 'required',
      message: `Field '${field}' is required`,
    }));

    super(`Missing required fields: ${fields.join(', ')}`, errors, {
      ...options,
      metadata: {
        ...options?.metadata,
        missingFields: fields,
      },
    });
  }
}

export class UnknownFieldError extends SchemaValidationError {
  constructor(
    fields: string[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = fields.map((field) => ({
      field,
      constraint: 'unknown',
      message: `Unknown field '${field}'`,
    }));

    super(`Unknown fields: ${fields.join(', ')}`, errors, {
      ...options,
      metadata: {
        ...options?.metadata,
        unknownFields: fields,
      },
    });
  }
}

/**
 * Type validation errors
 */
export class TypeValidationError extends ValidationError {
  constructor(
    field: string,
    expectedType: string,
    actualType: string,
    options?: {
      value?: unknown;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value: options?.value,
        constraint: 'type',
        message: `Expected type '${expectedType}', got '${actualType}'`,
      },
    ];

    super(`Type validation failed for field '${field}'`, ValidationErrorCode.INVALID_TYPE, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        expectedType,
        actualType,
      },
    });
  }
}

export class FormatValidationError extends ValidationError {
  constructor(
    field: string,
    format: string,
    value: unknown,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'format',
        message: `Value does not match format '${format}'`,
      },
    ];

    super(`Format validation failed for field '${field}'`, ValidationErrorCode.INVALID_FORMAT, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        format,
      },
    });
  }
}

export class LengthValidationError extends ValidationError {
  constructor(
    field: string,
    value: unknown,
    min?: number,
    max?: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const constraint =
      min && max
        ? `length between ${min} and ${max}`
        : min
          ? `minimum length ${min}`
          : `maximum length ${max}`;

    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'length',
        message: `Value must have ${constraint}`,
      },
    ];

    super(`Length validation failed for field '${field}'`, ValidationErrorCode.INVALID_LENGTH, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        min,
        max,
      },
    });
  }
}

export class RangeValidationError extends ValidationError {
  constructor(
    field: string,
    value: unknown,
    min?: number,
    max?: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const constraint =
      min !== undefined && max !== undefined
        ? `between ${min} and ${max}`
        : min !== undefined
          ? `at least ${min}`
          : `at most ${max}`;

    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'range',
        message: `Value must be ${constraint}`,
      },
    ];

    super(`Range validation failed for field '${field}'`, ValidationErrorCode.INVALID_RANGE, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        min,
        max,
      },
    });
  }
}

export class PatternValidationError extends ValidationError {
  constructor(
    field: string,
    pattern: string | RegExp,
    value: unknown,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'pattern',
        message: `Value does not match pattern ${pattern}`,
      },
    ];

    super(`Pattern validation failed for field '${field}'`, ValidationErrorCode.INVALID_PATTERN, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        pattern: pattern.toString(),
      },
    });
  }
}

/**
 * Business rule validation errors
 */
export class BusinessRuleViolationError extends ValidationError {
  constructor(
    rule: string,
    message: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Business rule violation: ${message}`, ValidationErrorCode.BUSINESS_RULE_VIOLATION, {
      ...options,
      metadata: {
        ...options?.metadata,
        rule,
      },
    });
  }
}

export class InvalidStateTransitionError extends ValidationError {
  constructor(
    fromState: string,
    toState: string,
    options?: {
      resource?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Invalid state transition from '${fromState}' to '${toState}'`,
      ValidationErrorCode.INVALID_STATE_TRANSITION,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          fromState,
          toState,
          resource: options?.resource,
        },
      }
    );
  }
}

/**
 * Input validation errors
 */
export class InvalidEmailError extends ValidationError {
  constructor(
    field: string,
    value: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'email',
        message: 'Invalid email address format',
      },
    ];

    super(`Invalid email: ${value}`, ValidationErrorCode.INVALID_EMAIL, { ...options, errors });
  }
}

export class InvalidUrlError extends ValidationError {
  constructor(
    field: string,
    value: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'url',
        message: 'Invalid URL format',
      },
    ];

    super(`Invalid URL: ${value}`, ValidationErrorCode.INVALID_URL, { ...options, errors });
  }
}

export class InvalidUuidError extends ValidationError {
  constructor(
    field: string,
    value: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'uuid',
        message: 'Invalid UUID format',
      },
    ];

    super(`Invalid UUID: ${value}`, ValidationErrorCode.INVALID_UUID, { ...options, errors });
  }
}

export class InvalidJsonError extends ValidationError {
  constructor(
    field: string,
    value: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'json',
        message: 'Invalid JSON format',
      },
    ];

    super(`Invalid JSON in field '${field}'`, ValidationErrorCode.INVALID_JSON, {
      ...options,
      errors,
    });
  }
}

/**
 * Enum validation error
 */
export class InvalidEnumError extends ValidationError {
  constructor(
    field: string,
    value: unknown,
    allowedValues: unknown[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errors: ValidationErrorDetail[] = [
      {
        field,
        value,
        constraint: 'enum',
        message: `Value must be one of: ${allowedValues.join(', ')}`,
      },
    ];

    super(`Invalid enum value for field '${field}'`, ValidationErrorCode.INVALID_ENUM_VALUE, {
      ...options,
      errors,
      metadata: {
        ...options?.metadata,
        allowedValues,
      },
    });
  }
}
