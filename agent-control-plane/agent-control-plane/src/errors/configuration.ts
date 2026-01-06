/**
 * Configuration Error Types
 *
 * Comprehensive error hierarchy for configuration operations including:
 * - Missing configuration
 * - Invalid configuration values
 * - Environment errors
 * - Initialization errors
 */

import { ErrorCategory, ErrorMetadata, ProgrammingError } from './base';

/**
 * Error code ranges: 6000-6999
 */
export enum ConfigErrorCode {
  // Missing configuration: 6000-6099
  CONFIGURATION_ERROR = 'CFG_6000',
  MISSING_CONFIGURATION = 'CFG_6001',
  MISSING_REQUIRED_FIELD = 'CFG_6002',
  CONFIG_FILE_NOT_FOUND = 'CFG_6003',
  CONFIG_FILE_UNREADABLE = 'CFG_6004',

  // Invalid configuration: 6100-6199
  INVALID_CONFIGURATION = 'CFG_6100',
  INVALID_CONFIG_VALUE = 'CFG_6101',
  INVALID_CONFIG_TYPE = 'CFG_6102',
  INVALID_CONFIG_FORMAT = 'CFG_6103',
  CONFIG_VALIDATION_FAILED = 'CFG_6104',

  // Environment errors: 6200-6299
  ENVIRONMENT_ERROR = 'CFG_6200',
  MISSING_ENV_VARIABLE = 'CFG_6201',
  INVALID_ENV_VALUE = 'CFG_6202',
  UNSUPPORTED_ENVIRONMENT = 'CFG_6203',

  // Initialization errors: 6300-6399
  INITIALIZATION_ERROR = 'CFG_6300',
  INITIALIZATION_FAILED = 'CFG_6301',
  ALREADY_INITIALIZED = 'CFG_6302',
  NOT_INITIALIZED = 'CFG_6303',
  DEPENDENCY_MISSING = 'CFG_6304',

  // General: 6900-6999
  CONFIG_CONFLICT = 'CFG_6900',
  CONFIG_DEPRECATION = 'CFG_6901',
}

/**
 * Base configuration error
 */
export class ConfigurationError extends ProgrammingError {
  constructor(
    message: string,
    code: ConfigErrorCode,
    options?: {
      configPath?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, ErrorCategory.CONFIGURATION, {
      ...options,
      metadata: {
        ...options?.metadata,
        configPath: options?.configPath,
      },
    });
  }
}

/**
 * Missing configuration error
 */
export class MissingConfigurationError extends ConfigurationError {
  constructor(
    configKey: string,
    options?: {
      configPath?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Missing required configuration: ${configKey}`, ConfigErrorCode.MISSING_CONFIGURATION, {
      ...options,
      metadata: {
        ...options?.metadata,
        configKey,
      },
    });
  }
}

/**
 * Missing required field error
 */
export class MissingRequiredConfigFieldError extends ConfigurationError {
  constructor(
    fields: string[],
    options?: {
      configPath?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Missing required configuration fields: ${fields.join(', ')}`,
      ConfigErrorCode.MISSING_REQUIRED_FIELD,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          missingFields: fields,
        },
      }
    );
  }
}

/**
 * Config file not found error
 */
export class ConfigFileNotFoundError extends ConfigurationError {
  constructor(
    filePath: string,
    options?: {
      searchPaths?: string[];
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Configuration file not found: ${filePath}`, ConfigErrorCode.CONFIG_FILE_NOT_FOUND, {
      ...options,
      configPath: filePath,
      metadata: {
        ...options?.metadata,
        searchPaths: options?.searchPaths,
      },
    });
  }
}

/**
 * Invalid configuration error
 */
export class InvalidConfigurationError extends ConfigurationError {
  constructor(
    configKey: string,
    reason: string,
    options?: {
      value?: unknown;
      configPath?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Invalid configuration for ${configKey}: ${reason}`,
      ConfigErrorCode.INVALID_CONFIGURATION,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          configKey,
          value: options?.value,
        },
      }
    );
  }
}

/**
 * Invalid config value error
 */
export class InvalidConfigValueError extends ConfigurationError {
  constructor(
    configKey: string,
    value: unknown,
    expectedType: string,
    options?: {
      configPath?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Invalid value for ${configKey}: expected ${expectedType}, got ${typeof value}`,
      ConfigErrorCode.INVALID_CONFIG_VALUE,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          configKey,
          value,
          expectedType,
        },
      }
    );
  }
}

/**
 * Config validation failed error
 */
export class ConfigValidationFailedError extends ConfigurationError {
  constructor(
    errors: Array<{ field: string; message: string }>,
    options?: {
      configPath?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    super(
      `Configuration validation failed: ${errorMessages}`,
      ConfigErrorCode.CONFIG_VALIDATION_FAILED,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          validationErrors: errors,
        },
      }
    );
  }
}

/**
 * Environment errors
 */
export class EnvironmentError extends ConfigurationError {
  constructor(
    message: string,
    code: ConfigErrorCode = ConfigErrorCode.ENVIRONMENT_ERROR,
    options?: {
      environment?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        environment: options?.environment || process.env.NODE_ENV,
      },
    });
  }
}

/**
 * Missing environment variable error
 */
export class MissingEnvVariableError extends EnvironmentError {
  constructor(
    variables: string[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Missing required environment variables: ${variables.join(', ')}`,
      ConfigErrorCode.MISSING_ENV_VARIABLE,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          missingVariables: variables,
        },
      }
    );
  }
}

/**
 * Invalid environment value error
 */
export class InvalidEnvValueError extends EnvironmentError {
  constructor(
    variable: string,
    value: string,
    expectedFormat: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Invalid value for environment variable ${variable}: expected ${expectedFormat}`,
      ConfigErrorCode.INVALID_ENV_VALUE,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          variable,
          value,
          expectedFormat,
        },
      }
    );
  }
}

/**
 * Unsupported environment error
 */
export class UnsupportedEnvironmentError extends EnvironmentError {
  constructor(
    currentEnv: string,
    supportedEnvs: string[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Unsupported environment: ${currentEnv}. Supported: ${supportedEnvs.join(', ')}`,
      ConfigErrorCode.UNSUPPORTED_ENVIRONMENT,
      {
        ...options,
        environment: currentEnv,
        metadata: {
          ...options?.metadata,
          supportedEnvironments: supportedEnvs,
        },
      }
    );
  }
}

/**
 * Initialization errors
 */
export class InitializationError extends ConfigurationError {
  constructor(
    component: string,
    message: string,
    code: ConfigErrorCode = ConfigErrorCode.INITIALIZATION_ERROR,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Initialization failed for ${component}: ${message}`, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        component,
      },
    });
  }
}

/**
 * Already initialized error
 */
export class AlreadyInitializedError extends InitializationError {
  constructor(
    component: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(component, 'Component already initialized', ConfigErrorCode.ALREADY_INITIALIZED, options);
  }
}

/**
 * Not initialized error
 */
export class NotInitializedError extends InitializationError {
  constructor(
    component: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(component, 'Component not initialized', ConfigErrorCode.NOT_INITIALIZED, options);
  }
}

/**
 * Dependency missing error
 */
export class DependencyMissingError extends InitializationError {
  constructor(
    component: string,
    dependencies: string[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      component,
      `Missing dependencies: ${dependencies.join(', ')}`,
      ConfigErrorCode.DEPENDENCY_MISSING,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          missingDependencies: dependencies,
        },
      }
    );
  }
}

/**
 * Config conflict error
 */
export class ConfigConflictError extends ConfigurationError {
  constructor(
    conflictingKeys: string[],
    reason: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Configuration conflict: ${reason}. Conflicting keys: ${conflictingKeys.join(', ')}`,
      ConfigErrorCode.CONFIG_CONFLICT,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          conflictingKeys,
        },
      }
    );
  }
}

/**
 * Config deprecation warning (as error)
 */
export class ConfigDeprecationError extends ConfigurationError {
  constructor(
    deprecatedKey: string,
    replacementKey?: string,
    options?: {
      removalVersion?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    const replacement = replacementKey ? `. Use '${replacementKey}' instead` : '';
    const removal = options?.removalVersion
      ? ` (will be removed in ${options.removalVersion})`
      : '';

    super(
      `Configuration key '${deprecatedKey}' is deprecated${replacement}${removal}`,
      ConfigErrorCode.CONFIG_DEPRECATION,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          deprecatedKey,
          replacementKey,
          removalVersion: options?.removalVersion,
        },
      }
    );
  }
}
