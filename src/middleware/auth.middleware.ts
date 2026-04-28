/**
 * Authentication Middleware
 * Validates API requests and manages authentication.
 *
 * Supports three authentication strategies (checked in order):
 *   1. Propagated identity headers (X-Org-Id, X-User-Id, X-User-Roles)
 *   2. Bearer JWT token (verified with jsonwebtoken)
 *   3. API key (x-api-key header)
 *
 * Falls back to development-mode bypass when NODE_ENV === 'development'.
 */

import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types aligned with @horsemen/auth HorsemenIdentity
// ---------------------------------------------------------------------------

export interface HorsemenIdentity {
  sub: string;
  email: string;
  orgId: string;
  teamId?: string;
  roles: string[];
  iat: number;
  exp: number;
  rawToken: string;
}

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
  identity?: HorsemenIdentity;
}

// ---------------------------------------------------------------------------
// JWT helpers (optional dependency -- gracefully degrades if not installed)
// ---------------------------------------------------------------------------

let jwtVerify: ((token: string, secret: string) => Record<string, unknown>) | null = null;

try {
  // jsonwebtoken may or may not be installed in the ACP
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jwtModule = await import('jsonwebtoken');
  const jwt = jwtModule.default ?? jwtModule;
  jwtVerify = (token: string, secret: string) =>
    jwt.verify(token, secret) as Record<string, unknown>;
} catch {
  // jsonwebtoken not available -- Bearer tokens will be handled with basic decode
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Authentication middleware.
 * Checks propagated headers, then Bearer JWT, then API key, then dev bypass.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Skip auth for health check
    if (req.path === '/health') {
      return next();
    }

    // --- Strategy 1: Propagated identity headers (service-to-service) ---
    const propagatedIdentity = extractPropagatedIdentity(req);
    if (propagatedIdentity) {
      req.identity = propagatedIdentity;
      req.userId = propagatedIdentity.sub;
      req.sessionId = uuidv4();
      return next();
    }

    // --- Strategy 2: Bearer token (JWT verification) ---
    const authHeader = req.headers['authorization'] as string;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const identity = verifyBearerToken(token);
      if (identity) {
        req.identity = identity;
        req.userId = identity.sub;
        req.sessionId = uuidv4();
        return next();
      }
    }

    // --- Strategy 3: API key ---
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey && validateApiKey(apiKey)) {
      const userId = extractUserIdFromApiKey(apiKey);
      req.identity = {
        sub: userId,
        email: '',
        orgId: '',
        roles: ['api-consumer'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        rawToken: '',
      };
      req.userId = userId;
      req.sessionId = uuidv4();
      return next();
    }

    // --- Strategy 4: Development mode bypass ---
    if (process.env.NODE_ENV === 'development') {
      req.identity = {
        sub: 'dev-user',
        email: 'dev@localhost',
        orgId: 'dev-org',
        roles: ['super-admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        rawToken: '',
      };
      req.userId = 'dev-user';
      req.sessionId = uuidv4();
      return next();
    }

    // No valid authentication found
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date(),
      },
      metadata: {
        requestId: uuidv4(),
        timestamp: new Date(),
        processingTimeMs: 0,
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        timestamp: new Date(),
      },
      metadata: {
        requestId: uuidv4(),
        timestamp: new Date(),
        processingTimeMs: 0,
        version: '1.0.0',
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract identity from propagated service-to-service headers.
 * Returns null if the required headers are missing.
 */
function extractPropagatedIdentity(req: Request): HorsemenIdentity | null {
  const orgId = req.headers['x-org-id'] as string | undefined;
  const userId = req.headers['x-user-id'] as string | undefined;
  const rolesHeader = req.headers['x-user-roles'] as string | undefined;
  const teamId = req.headers['x-team-id'] as string | undefined;
  const authHeader = req.headers['authorization'] as string | undefined;

  if (!orgId || !userId) return null;

  const roles = rolesHeader ? rolesHeader.split(',') : ['viewer'];
  const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

  return {
    sub: userId,
    email: '',
    orgId,
    teamId: teamId || undefined,
    roles,
    iat: 0,
    exp: 0,
    rawToken,
  };
}

/**
 * Verify a Bearer JWT token. Uses jsonwebtoken if available, otherwise falls
 * back to basic base64 decode of the payload (no signature verification).
 */
function verifyBearerToken(token: string): HorsemenIdentity | null {
  const jwtSecret = process.env.JWT_SECRET;

  // Prefer real JWT verification when jsonwebtoken is installed and secret is set
  if (jwtVerify && jwtSecret) {
    try {
      const payload = jwtVerify(token, jwtSecret);
      return {
        sub: (payload.sub as string) || '',
        email: (payload.email as string) || '',
        orgId: (payload['custom:organization'] as string) || (payload.tenant as string) || '',
        teamId: (payload['custom:team'] as string) || undefined,
        roles: (payload['cognito:groups'] as string[]) || (payload.roles as string[]) || ['viewer'],
        iat: (payload.iat as number) || 0,
        exp: (payload.exp as number) || 0,
        rawToken: token,
      };
    } catch {
      return null;
    }
  }

  // Fallback: decode JWT payload without verification (dev/testing only)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8'));
    return {
      sub: (payload.sub as string) || '',
      email: (payload.email as string) || '',
      orgId: (payload['custom:organization'] as string) || (payload.tenant as string) || '',
      teamId: (payload['custom:team'] as string) || undefined,
      roles: (payload['cognito:groups'] as string[]) || (payload.roles as string[]) || ['viewer'],
      iat: payload.iat || 0,
      exp: payload.exp || 0,
      rawToken: token,
    };
  } catch {
    return null;
  }
}

/**
 * Validate API key format.
 */
function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('medai_') && apiKey.length >= 32;
}

/**
 * Extract user ID from API key.
 */
function extractUserIdFromApiKey(apiKey: string): string {
  return `user_${apiKey.substring(6, 14)}`;
}

/**
 * Middleware to require specific roles.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.identity) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date(),
        },
        metadata: {
          requestId: uuidv4(),
          timestamp: new Date(),
          processingTimeMs: 0,
          version: '1.0.0',
        },
      });
      return;
    }

    const hasRole = req.identity.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `One of the following roles is required: ${roles.join(', ')}`,
          timestamp: new Date(),
        },
        metadata: {
          requestId: uuidv4(),
          timestamp: new Date(),
          processingTimeMs: 0,
          version: '1.0.0',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Optional middleware to require provider role.
 * @deprecated Use requireRole('provider', 'admin') instead.
 */
export function requireProviderRole(req: AuthRequest, res: Response, next: NextFunction): void {
  const identity = req.identity;
  const roles = identity?.roles || [];

  if (!roles.includes('provider') && !roles.includes('admin') && !roles.includes('super-admin')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Provider role required',
        timestamp: new Date(),
      },
      metadata: {
        requestId: uuidv4(),
        timestamp: new Date(),
        processingTimeMs: 0,
        version: '1.0.0',
      },
    });
    return;
  }

  next();
}
