// API Endpoint Contract Tests
// Tests REST API endpoints for contract compliance
// Uses Pact for consumer-driven contract testing

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Pact } from '@pact-foundation/pact';
import axios from 'axios';
import { join } from 'path';

describe('API Endpoint Contracts', () => {
  let provider: Pact;
  const API_BASE = 'http://localhost:8080';

  beforeAll(async () => {
    provider = new Pact({
      consumer: 'agent-control-plane-api-consumer',
      provider: 'agent-control-plane-api-provider',
      port: 8080,
      log: join(__dirname, 'logs', 'api-pact.log'),
      dir: join(__dirname, 'pacts'),
      logLevel: 'info',
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      await provider.addInteraction({
        state: 'service is healthy',
        uponReceiving: 'a request for health status',
        withRequest: {
          method: 'GET',
          path: '/health',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            status: 'ok',
            timestamp: '2025-12-08T00:00:00.000Z',
            version: '1.10.3',
            uptime: 3600,
          },
        },
      });

      const response = await axios.get(`${API_BASE}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');

      await provider.verify();
    });

    it('should handle unhealthy state', async () => {
      await provider.addInteraction({
        state: 'service is unhealthy',
        uponReceiving: 'a request for health status when unhealthy',
        withRequest: {
          method: 'GET',
          path: '/health',
        },
        willRespondWith: {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            status: 'error',
            message: 'Service unavailable',
            timestamp: '2025-12-08T00:00:00.000Z',
          },
        },
      });

      await provider.verify();
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
      it('should register new user', async () => {
        await provider.addInteraction({
          state: 'no user exists',
          uponReceiving: 'a registration request',
          withRequest: {
            method: 'POST',
            path: '/auth/register',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              email: 'test@example.com',
              password: 'SecurePass123!',
              name: 'Test User',
            },
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              success: true,
              userId: '123e4567-e89b-12d3-a456-426614174000',
              email: 'test@example.com',
              name: 'Test User',
              timestamp: '2025-12-08T00:00:00.000Z',
            },
          },
        });

        await provider.verify();
      });

      it('should reject duplicate email', async () => {
        await provider.addInteraction({
          state: 'user already exists',
          uponReceiving: 'a registration request with existing email',
          withRequest: {
            method: 'POST',
            path: '/auth/register',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              email: 'existing@example.com',
              password: 'SecurePass123!',
            },
          },
          willRespondWith: {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              error: 'DuplicateError',
              message: 'Email already registered',
              code: 'EMAIL_EXISTS',
            },
          },
        });

        await provider.verify();
      });
    });

    describe('POST /auth/login', () => {
      it('should authenticate valid credentials', async () => {
        await provider.addInteraction({
          state: 'user exists with valid credentials',
          uponReceiving: 'a login request',
          withRequest: {
            method: 'POST',
            path: '/auth/login',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              email: 'test@example.com',
              password: 'SecurePass123!',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              success: true,
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              userId: '123e4567-e89b-12d3-a456-426614174000',
              expiresIn: 3600,
            },
          },
        });

        await provider.verify();
      });

      it('should reject invalid credentials', async () => {
        await provider.addInteraction({
          state: 'user exists',
          uponReceiving: 'a login request with invalid password',
          withRequest: {
            method: 'POST',
            path: '/auth/login',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              email: 'test@example.com',
              password: 'WrongPassword',
            },
          },
          willRespondWith: {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              error: 'AuthenticationError',
              message: 'Invalid credentials',
              code: 'INVALID_CREDENTIALS',
            },
          },
        });

        await provider.verify();
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      await provider.addInteraction({
        state: 'rate limit exceeded',
        uponReceiving: 'request exceeding rate limit',
        withRequest: {
          method: 'POST',
          path: '/api/swarm/init',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          },
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '1702080000',
          },
          body: {
            error: 'RateLimitError',
            message: 'Rate limit exceeded',
            retryAfter: 60,
          },
        },
      });

      await provider.verify();
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for 400', async () => {
      await provider.addInteraction({
        state: 'any state',
        uponReceiving: 'invalid request',
        withRequest: {
          method: 'POST',
          path: '/api/swarm/init',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            topology: 'invalid',
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'ValidationError',
            message: 'Invalid topology value',
            code: 'VALIDATION_ERROR',
            details: {
              field: 'topology',
              value: 'invalid',
              allowedValues: ['mesh', 'hierarchical', 'ring', 'star'],
            },
          },
        },
      });

      await provider.verify();
    });

    it('should return consistent error format for 500', async () => {
      await provider.addInteraction({
        state: 'service error occurs',
        uponReceiving: 'request causing server error',
        withRequest: {
          method: 'GET',
          path: '/api/swarm/status',
        },
        willRespondWith: {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'InternalServerError',
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
            requestId: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      });

      await provider.verify();
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      await provider.addInteraction({
        state: 'CORS enabled',
        uponReceiving: 'OPTIONS preflight request',
        withRequest: {
          method: 'OPTIONS',
          path: '/api/swarm/init',
          headers: {
            Origin: 'https://example.com',
            'Access-Control-Request-Method': 'POST',
          },
        },
        willRespondWith: {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': 'https://example.com',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600',
          },
        },
      });

      await provider.verify();
    });
  });
});

export {};
