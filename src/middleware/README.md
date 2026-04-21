# Middleware Module

Express middleware for authentication, authorization, request logging, and AgentDB integration.

## Files

| File                     | Description                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `auth.middleware.ts`     | Authentication middleware with four strategies: propagated identity headers, Bearer JWT, API key, and development bypass |
| `logging.middleware.ts`  | Request/response logging with duration tracking, color-coded status output, and slow-request warnings                    |
| `agentdb-integration.ts` | AgentDB middleware for learning pattern storage and retrieval during request processing                                  |

## Authentication

The `authMiddleware` function checks authentication in order:

1. **Propagated identity headers** (`X-Org-Id`, `X-User-Id`, `X-User-Roles`) -- used for service-to-service calls within the Horsemen platform
2. **Bearer JWT** -- verified with `jsonwebtoken` if installed and `JWT_SECRET` is set; falls back to unverified base64 decode for development
3. **API key** (`x-api-key` header) -- keys must start with `medai_` and be at least 32 characters
4. **Development bypass** -- when `NODE_ENV=development`, requests are auto-authenticated as `super-admin`

The `/health` endpoint always bypasses authentication.

### Identity Model

All strategies produce a `HorsemenIdentity` attached to `req.identity`:

```typescript
interface HorsemenIdentity {
  sub: string; // User ID
  email: string;
  orgId: string; // Organization ID
  teamId?: string;
  roles: string[]; // e.g., ['super-admin', 'provider', 'viewer']
  iat: number; // Issued at (epoch seconds)
  exp: number; // Expiration (epoch seconds)
  rawToken: string;
}
```

### Authorization Guards

- `requireRole(...roles)` -- Middleware that returns 403 if the user lacks any of the specified roles
- `requireProviderRole` -- (Deprecated) Use `requireRole('provider', 'admin')` instead

## Logging

The `loggingMiddleware` attaches a unique request ID, logs request/response pairs with duration, and flags:

- Requests returning 4xx/5xx status codes
- Requests exceeding 5 second duration

Utilities:

- `logError(context, error, metadata)` -- Structured error logging
- `logPerformance(operation, duration, metadata)` -- Performance tracking with 1 second slow-operation threshold
