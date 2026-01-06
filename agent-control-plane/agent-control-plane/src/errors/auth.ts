/**
 * Authentication and Authorization Error Types
 *
 * Comprehensive error hierarchy for auth operations including:
 * - Authentication errors (identity verification)
 * - Authorization errors (permission checks)
 * - Token errors
 * - Session errors
 * - OAuth errors
 */

import { ErrorCategory, ErrorMetadata, ErrorSeverity, OperationalError } from './base';

/**
 * Error code ranges: 5000-5999
 */
export enum AuthErrorCode {
  // Authentication errors: 5000-5099
  AUTHENTICATION_FAILED = 'AUTH_5000',
  INVALID_CREDENTIALS = 'AUTH_5001',
  USER_NOT_FOUND = 'AUTH_5002',
  ACCOUNT_LOCKED = 'AUTH_5003',
  ACCOUNT_DISABLED = 'AUTH_5004',
  ACCOUNT_SUSPENDED = 'AUTH_5005',
  PASSWORD_EXPIRED = 'AUTH_5006',
  MFA_REQUIRED = 'AUTH_5007',
  MFA_FAILED = 'AUTH_5008',

  // Authorization errors: 5100-5199
  AUTHORIZATION_FAILED = 'AUTH_5100',
  INSUFFICIENT_PERMISSIONS = 'AUTH_5101',
  ACCESS_DENIED = 'AUTH_5102',
  FORBIDDEN_RESOURCE = 'AUTH_5103',
  ROLE_REQUIRED = 'AUTH_5104',
  SCOPE_INSUFFICIENT = 'AUTH_5105',

  // Token errors: 5200-5299
  TOKEN_ERROR = 'AUTH_5200',
  TOKEN_INVALID = 'AUTH_5201',
  TOKEN_EXPIRED = 'AUTH_5202',
  TOKEN_REVOKED = 'AUTH_5203',
  TOKEN_MALFORMED = 'AUTH_5204',
  TOKEN_NOT_FOUND = 'AUTH_5205',
  REFRESH_TOKEN_INVALID = 'AUTH_5206',
  REFRESH_TOKEN_EXPIRED = 'AUTH_5207',

  // Session errors: 5300-5399
  SESSION_ERROR = 'AUTH_5300',
  SESSION_EXPIRED = 'AUTH_5301',
  SESSION_INVALID = 'AUTH_5302',
  SESSION_NOT_FOUND = 'AUTH_5303',
  CONCURRENT_SESSION_LIMIT = 'AUTH_5304',

  // OAuth errors: 5400-5499
  OAUTH_ERROR = 'AUTH_5400',
  INVALID_GRANT = 'AUTH_5401',
  INVALID_CLIENT = 'AUTH_5402',
  INVALID_SCOPE = 'AUTH_5403',
  UNAUTHORIZED_CLIENT = 'AUTH_5404',
  UNSUPPORTED_GRANT_TYPE = 'AUTH_5405',
  REDIRECT_URI_MISMATCH = 'AUTH_5406',

  // General: 5900-5999
  UNAUTHENTICATED = 'AUTH_5900',
  UNAUTHORIZED = 'AUTH_5901',
}

/**
 * Base authentication error
 */
export class AuthenticationError extends OperationalError {
  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.AUTHENTICATION_FAILED,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, ErrorCategory.AUTHENTICATION, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 401,
    });
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(options?: { username?: string; metadata?: ErrorMetadata; cause?: Error }) {
    super('Invalid username or password', AuthErrorCode.INVALID_CREDENTIALS, {
      ...options,
      metadata: {
        ...options?.metadata,
        username: options?.username,
      },
    });
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends AuthenticationError {
  constructor(
    identifier: string,
    options?: {
      identifierType?: 'username' | 'email' | 'id';
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`User not found: ${identifier}`, AuthErrorCode.USER_NOT_FOUND, {
      ...options,
      metadata: {
        ...options?.metadata,
        identifier,
        identifierType: options?.identifierType || 'username',
      },
    });
  }
}

/**
 * Account locked error
 */
export class AccountLockedError extends AuthenticationError {
  constructor(
    reason?: string,
    options?: {
      unlockDate?: Date;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Account locked${reason ? `: ${reason}` : ''}`, AuthErrorCode.ACCOUNT_LOCKED, {
      ...options,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        reason,
        unlockDate: options?.unlockDate?.toISOString(),
      },
    });
  }
}

/**
 * Account disabled error
 */
export class AccountDisabledError extends AuthenticationError {
  constructor(
    reason?: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Account disabled${reason ? `: ${reason}` : ''}`, AuthErrorCode.ACCOUNT_DISABLED, {
      ...options,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        reason,
      },
    });
  }
}

/**
 * MFA required error
 */
export class MfaRequiredError extends AuthenticationError {
  constructor(
    methods: string[],
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super('Multi-factor authentication required', AuthErrorCode.MFA_REQUIRED, {
      ...options,
      metadata: {
        ...options?.metadata,
        mfaMethods: methods,
      },
    });
  }
}

/**
 * MFA failed error
 */
export class MfaFailedError extends AuthenticationError {
  constructor(
    method: string,
    options?: {
      attemptsRemaining?: number;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Multi-factor authentication failed: ${method}`, AuthErrorCode.MFA_FAILED, {
      ...options,
      metadata: {
        ...options?.metadata,
        mfaMethod: method,
        attemptsRemaining: options?.attemptsRemaining,
      },
    });
  }
}

/**
 * Base authorization error
 */
export class AuthorizationError extends OperationalError {
  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.AUTHORIZATION_FAILED,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, ErrorCategory.AUTHORIZATION, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 403,
    });
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthorizationError {
  constructor(
    resource: string,
    action: string,
    options?: {
      requiredPermissions?: string[];
      userPermissions?: string[];
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Insufficient permissions to ${action} ${resource}`,
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          resource,
          action,
          requiredPermissions: options?.requiredPermissions,
          userPermissions: options?.userPermissions,
        },
      }
    );
  }
}

/**
 * Access denied error
 */
export class AccessDeniedError extends AuthorizationError {
  constructor(
    resource: string,
    options?: {
      reason?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Access denied to ${resource}${options?.reason ? `: ${options.reason}` : ''}`,
      AuthErrorCode.ACCESS_DENIED,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          resource,
        },
      }
    );
  }
}

/**
 * Role required error
 */
export class RoleRequiredError extends AuthorizationError {
  constructor(
    requiredRoles: string[],
    options?: {
      userRoles?: string[];
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Required role(s): ${requiredRoles.join(', ')}`, AuthErrorCode.ROLE_REQUIRED, {
      ...options,
      metadata: {
        ...options?.metadata,
        requiredRoles,
        userRoles: options?.userRoles,
      },
    });
  }
}

/**
 * Token errors
 */
export class TokenError extends AuthenticationError {
  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.TOKEN_ERROR,
    options?: {
      tokenType?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        tokenType: options?.tokenType,
      },
    });
  }
}

export class TokenInvalidError extends TokenError {
  constructor(
    reason?: string,
    options?: {
      tokenType?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Invalid token${reason ? `: ${reason}` : ''}`, AuthErrorCode.TOKEN_INVALID, options);
  }
}

export class TokenExpiredError extends TokenError {
  constructor(
    expiredAt: Date,
    options?: {
      tokenType?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Token expired at ${expiredAt.toISOString()}`, AuthErrorCode.TOKEN_EXPIRED, {
      ...options,
      metadata: {
        ...options?.metadata,
        expiredAt: expiredAt.toISOString(),
      },
    });
  }
}

export class TokenRevokedError extends TokenError {
  constructor(
    reason?: string,
    options?: {
      tokenType?: string;
      revokedAt?: Date;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Token revoked${reason ? `: ${reason}` : ''}`, AuthErrorCode.TOKEN_REVOKED, {
      ...options,
      metadata: {
        ...options?.metadata,
        reason,
        revokedAt: options?.revokedAt?.toISOString(),
      },
    });
  }
}

export class TokenMalformedError extends TokenError {
  constructor(options?: { tokenType?: string; metadata?: ErrorMetadata; cause?: Error }) {
    super('Malformed token', AuthErrorCode.TOKEN_MALFORMED, options);
  }
}

export class RefreshTokenInvalidError extends TokenError {
  constructor(options?: { metadata?: ErrorMetadata; cause?: Error }) {
    super('Invalid refresh token', AuthErrorCode.REFRESH_TOKEN_INVALID, {
      ...options,
      tokenType: 'refresh',
    });
  }
}

/**
 * Session errors
 */
export class SessionError extends AuthenticationError {
  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.SESSION_ERROR,
    options?: {
      sessionId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        sessionId: options?.sessionId,
      },
    });
  }
}

export class SessionExpiredError extends SessionError {
  constructor(options?: {
    sessionId?: string;
    expiredAt?: Date;
    metadata?: ErrorMetadata;
    cause?: Error;
  }) {
    super('Session expired', AuthErrorCode.SESSION_EXPIRED, {
      ...options,
      metadata: {
        ...options?.metadata,
        expiredAt: options?.expiredAt?.toISOString(),
      },
    });
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(
    sessionId: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super('Session not found', AuthErrorCode.SESSION_NOT_FOUND, {
      ...options,
      sessionId,
    });
  }
}

export class ConcurrentSessionLimitError extends SessionError {
  constructor(
    limit: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Concurrent session limit exceeded: ${limit}`, AuthErrorCode.CONCURRENT_SESSION_LIMIT, {
      ...options,
      metadata: {
        ...options?.metadata,
        limit,
      },
    });
  }
}

/**
 * OAuth errors
 */
export class OAuthError extends AuthenticationError {
  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.OAUTH_ERROR,
    options?: {
      provider?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        provider: options?.provider,
      },
    });
  }
}

export class InvalidGrantError extends OAuthError {
  constructor(
    grantType: string,
    options?: {
      provider?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Invalid grant: ${grantType}`, AuthErrorCode.INVALID_GRANT, {
      ...options,
      metadata: {
        ...options?.metadata,
        grantType,
      },
    });
  }
}

export class InvalidClientError extends OAuthError {
  constructor(
    clientId: string,
    options?: {
      provider?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super('Invalid OAuth client', AuthErrorCode.INVALID_CLIENT, {
      ...options,
      metadata: {
        ...options?.metadata,
        clientId,
      },
    });
  }
}

export class InvalidScopeError extends OAuthError {
  constructor(
    requestedScopes: string[],
    options?: {
      allowedScopes?: string[];
      provider?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Invalid OAuth scope: ${requestedScopes.join(', ')}`, AuthErrorCode.INVALID_SCOPE, {
      ...options,
      metadata: {
        ...options?.metadata,
        requestedScopes,
        allowedScopes: options?.allowedScopes,
      },
    });
  }
}
