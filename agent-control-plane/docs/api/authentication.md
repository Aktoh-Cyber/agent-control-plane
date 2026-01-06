# Authentication & Authorization Guide

Complete guide to authentication and authorization in Agentic Flow.

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [API Keys](#api-keys)
- [JWT Tokens](#jwt-tokens)
- [OAuth 2.0](#oauth-20)
- [Session Management](#session-management)
- [Authorization](#authorization)
- [Security Best Practices](#security-best-practices)
- [Error Handling](#error-handling)

## Overview

Agentic Flow supports multiple authentication methods:

1. **API Keys** - For programmatic access (recommended for production)
2. **JWT Tokens** - For session-based authentication
3. **OAuth 2.0** - For third-party integrations
4. **MCP Authentication** - For Model Context Protocol connections

## Authentication Methods

### API Keys (Recommended)

API keys provide the simplest and most secure method for programmatic access.

#### Creating an API Key

```bash
# Via CLI
npx agent-control-plane auth:api-key create --name "Production API Key"

# Via API
POST /api/auth/api-keys
{
  "name": "Production API Key",
  "expiresIn": "never"
}
```

#### Using an API Key

Include the API key in the `X-API-Key` header:

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "X-API-Key: af_live_1234567890abcdef"
```

```javascript
const response = await fetch('https://api.agent-control-plane.io/api/agents', {
  headers: {
    'X-API-Key': 'af_live_1234567890abcdef',
  },
});
```

```python
import requests

response = requests.get(
    'https://api.agent-control-plane.io/api/agents',
    headers={'X-API-Key': 'af_live_1234567890abcdef'}
)
```

#### API Key Format

```
af_[environment]_[random_string]

Examples:
- af_live_1234567890abcdef (Production)
- af_test_9876543210fedcba (Test)
- af_dev_abcdef0123456789 (Development)
```

#### Managing API Keys

```bash
# List all API keys
npx agent-control-plane auth:api-key list

# Revoke an API key
npx agent-control-plane auth:api-key revoke af_live_1234567890abcdef

# Rotate an API key
npx agent-control-plane auth:api-key rotate af_live_1234567890abcdef
```

### JWT Tokens

JSON Web Tokens (JWT) are used for session-based authentication.

#### Getting a JWT Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "ref_1234567890abcdef",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "professional"
  }
}
```

#### Using a JWT Token

Include the token in the `Authorization` header:

```bash
curl https://api.agent-control-plane.io/api/agents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
const response = await fetch('https://api.agent-control-plane.io/api/agents', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Refreshing Tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "ref_1234567890abcdef"
}
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### OAuth 2.0

OAuth 2.0 is supported for third-party integrations (GitHub, Google, etc.).

#### Supported Providers

- GitHub
- Google
- Microsoft
- GitLab

#### Authorization Flow

1. **Redirect to OAuth Provider**

```http
GET /api/auth/oauth/github
```

2. **Handle Callback**

```http
GET /api/auth/oauth/callback?code=abc123&state=xyz789
```

3. **Exchange Code for Token**

```http
POST /api/auth/oauth/token
Content-Type: application/json

{
  "code": "abc123",
  "provider": "github"
}
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "ref_1234567890abcdef",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "provider": "github"
  }
}
```

### MCP Authentication

For Model Context Protocol connections:

#### Server-to-Server

```bash
# Start MCP server with authentication
npx agent-control-plane mcp start --auth-key "mcp_secret_key_here"

# Connect with authentication
claude mcp add agent-control-plane \
  npx agent-control-plane mcp start \
  --auth-key "mcp_secret_key_here"
```

#### Client Authentication

```typescript
import { FastMCP } from 'fastmcp';

const server = new FastMCP({
  name: 'agent-control-plane',
  version: '1.10.3',
  auth: {
    type: 'bearer',
    token: 'mcp_secret_key_here',
  },
});
```

## API Keys

### Best Practices

1. **Never commit API keys to version control**

   ```bash
   # .env file
   AGENTIC_FLOW_API_KEY=af_live_1234567890abcdef

   # .gitignore
   .env
   .env.local
   ```

2. **Use environment variables**

   ```javascript
   const apiKey = process.env.AGENTIC_FLOW_API_KEY;
   ```

3. **Rotate keys regularly**

   ```bash
   npx agent-control-plane auth:api-key rotate af_live_old_key
   ```

4. **Use different keys for different environments**
   - Production: `af_live_*`
   - Staging: `af_test_*`
   - Development: `af_dev_*`

5. **Set expiration dates**
   ```bash
   npx agent-control-plane auth:api-key create \
     --name "Temporary Key" \
     --expires-in "30d"
   ```

### Key Permissions

API keys can have scoped permissions:

```bash
npx agent-control-plane auth:api-key create \
  --name "Read-Only Key" \
  --scopes "agents:read,memory:read"
```

Available scopes:

- `agents:read` - List and view agents
- `agents:execute` - Execute agents
- `memory:read` - Read memory
- `memory:write` - Write memory
- `billing:read` - View billing info
- `billing:write` - Manage subscriptions
- `swarm:manage` - Manage swarms
- `admin` - Full access

## JWT Tokens

### Token Structure

JWT tokens contain three parts: header, payload, and signature.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.     # Header
eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTY0MH0. # Payload
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  # Signature
```

Decoded payload:

```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "role": "professional",
  "iat": 1640995200,
  "exp": 1640998800,
  "iss": "agent-control-plane",
  "aud": "api.agent-control-plane.io"
}
```

### Token Expiration

| Token Type    | Expiration        | Renewable |
| ------------- | ----------------- | --------- |
| Access Token  | 1 hour            | No        |
| Refresh Token | 30 days           | Yes       |
| API Key       | Never (or custom) | No        |

### Token Validation

```javascript
import jwt from 'jsonwebtoken';

function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

## Session Management

### Creating a Session

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "remember": true
}
```

### Session Cookies

For web applications, sessions can be managed via HTTP-only cookies:

```http
Set-Cookie: session=sess_1234567890; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

### Session Validation

```http
GET /api/auth/session
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:

```json
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "professional"
  },
  "session": {
    "id": "sess_1234567890",
    "createdAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-01-02T00:00:00Z",
    "lastActive": "2025-01-01T12:00:00Z"
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Authorization

### Role-Based Access Control (RBAC)

Agentic Flow uses role-based access control:

| Role             | Permissions                           |
| ---------------- | ------------------------------------- |
| **Free**         | Limited agent execution, basic memory |
| **Hobby**        | Increased limits, all agents          |
| **Professional** | Advanced features, priority support   |
| **Business**     | Team management, custom models        |
| **Enterprise**   | Full control, SLA, dedicated support  |

### Permission Checks

```http
GET /api/agents/execute
Authorization: Bearer token_here
```

Response (403 Forbidden):

```json
{
  "success": false,
  "error": {
    "code": "AUTH_5201",
    "message": "Insufficient permissions to execute agents",
    "category": "AUTHORIZATION",
    "severity": "ERROR",
    "httpStatus": 403,
    "details": {
      "requiredRole": "hobby",
      "currentRole": "free",
      "upgradeUrl": "https://agent-control-plane.io/pricing"
    }
  }
}
```

### Resource-Based Authorization

Check if user can access specific resources:

```http
GET /api/swarm/swarm_123/agents
Authorization: Bearer token_here
```

Authorization flow:

1. Validate token
2. Extract user ID
3. Check swarm ownership
4. Verify permissions
5. Return resource or 403

## Security Best Practices

### 1. Use HTTPS

Always use HTTPS in production:

```javascript
// ❌ Never do this in production
const url = 'http://api.agent-control-plane.io';

// ✅ Always use HTTPS
const url = 'https://api.agent-control-plane.io';
```

### 2. Store Secrets Securely

```bash
# ✅ Environment variables
export AGENTIC_FLOW_API_KEY=af_live_1234567890abcdef

# ✅ Secret management services
aws secretsmanager get-secret-value --secret-id agent-control-plane-api-key
```

```javascript
// ❌ Never hardcode
const apiKey = 'af_live_1234567890abcdef';

// ✅ Use environment variables
const apiKey = process.env.AGENTIC_FLOW_API_KEY;
```

### 3. Implement Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later',
});

app.use('/api', limiter);
```

### 4. Validate Input

```javascript
import { z } from 'zod';

const executeSchema = z.object({
  agent: z.string().min(1).max(50),
  task: z.string().min(1).max(1000),
  provider: z.enum(['anthropic', 'openrouter', 'gemini', 'onnx']).optional(),
});

function validateRequest(req, res, next) {
  try {
    executeSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
}
```

### 5. Implement CORS Properly

```javascript
import cors from 'cors';

app.use(
  cors({
    origin: ['https://your-domain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);
```

### 6. Log Security Events

```javascript
function logSecurityEvent(event, details) {
  logger.warn('SECURITY', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

// Log failed login attempts
logSecurityEvent('LOGIN_FAILED', { email: req.body.email });

// Log API key usage
logSecurityEvent('API_KEY_USED', { keyId: apiKey.id });
```

### 7. Implement Two-Factor Authentication (2FA)

```http
POST /api/auth/2fa/enable
Authorization: Bearer token_here
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "totpCode": "123456"
}
```

## Error Handling

### Authentication Errors

| Error Code | Description         | HTTP Status |
| ---------- | ------------------- | ----------- |
| AUTH_5001  | Invalid credentials | 401         |
| AUTH_5002  | User not found      | 401         |
| AUTH_5003  | Account locked      | 403         |
| AUTH_5004  | Account disabled    | 403         |
| AUTH_5005  | MFA required        | 403         |
| AUTH_5006  | MFA failed          | 401         |

### Token Errors

| Error Code | Description           | HTTP Status |
| ---------- | --------------------- | ----------- |
| AUTH_5101  | Token invalid         | 401         |
| AUTH_5102  | Token expired         | 401         |
| AUTH_5103  | Token revoked         | 401         |
| AUTH_5104  | Token malformed       | 401         |
| AUTH_5105  | Refresh token invalid | 401         |

### Authorization Errors

| Error Code | Description              | HTTP Status |
| ---------- | ------------------------ | ----------- |
| AUTH_5201  | Insufficient permissions | 403         |
| AUTH_5202  | Access denied            | 403         |
| AUTH_5203  | Role required            | 403         |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_5102",
    "message": "JWT token has expired",
    "category": "AUTHENTICATION",
    "severity": "ERROR",
    "httpStatus": 401,
    "details": {
      "expiredAt": "2025-01-01T12:00:00Z",
      "refreshUrl": "/api/auth/refresh"
    }
  }
}
```

### Handling Auth Errors

```javascript
async function callAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      const newToken = await refreshToken();
      setToken(newToken);

      // Retry original request
      return callAPI(endpoint, options);
    }

    if (response.status === 403) {
      // Insufficient permissions
      throw new Error('You do not have permission to perform this action');
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Testing Authentication

### Unit Tests

```javascript
import { validateApiKey, validateJWT } from './auth';

describe('Authentication', () => {
  test('should validate valid API key', () => {
    const result = validateApiKey('af_live_1234567890abcdef');
    expect(result.valid).toBe(true);
  });

  test('should reject invalid API key format', () => {
    const result = validateApiKey('invalid_key');
    expect(result.valid).toBe(false);
  });

  test('should validate JWT token', () => {
    const token = generateTestToken({ userId: 'user_123' });
    const result = validateJWT(token);
    expect(result.valid).toBe(true);
    expect(result.user.userId).toBe('user_123');
  });
});
```

### Integration Tests

```javascript
describe('API Authentication', () => {
  test('should authenticate with valid API key', async () => {
    const response = await fetch('/api/agents', {
      headers: { 'X-API-Key': validApiKey },
    });
    expect(response.status).toBe(200);
  });

  test('should reject invalid API key', async () => {
    const response = await fetch('/api/agents', {
      headers: { 'X-API-Key': 'invalid_key' },
    });
    expect(response.status).toBe(401);
  });
});
```

## Support

For authentication issues:

- **Documentation**: https://github.com/Aktoh-Cyber/agent-control-plane/tree/main/docs
- **Security Issues**: security@agent-control-plane.io
- **Support**: support@agent-control-plane.io

---

**Last Updated**: 2025-12-08
**Version**: 1.10.3
