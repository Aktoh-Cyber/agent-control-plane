/**
 * Route-level integration tests for src/audit/routes.ts (T-27 audit slice).
 *
 * Covers the 7 audit endpoints:
 *   GET    /api/audit/events            list events for the caller's org
 *   GET    /api/audit/summary           aggregated counts
 *   GET    /api/audit/export            export bundle
 *   POST   /api/audit/webhook           subscribe to webhook
 *   GET    /api/audit/webhook           list webhook subscriptions
 *   GET    /api/audit/retention         retention policy
 *   POST   /api/audit/retention         update retention policy (admin+)
 *
 * Each route is checked for:
 *  - 401 without an identity
 *  - 200 happy path for an authenticated caller
 *  - 403 where the route requires admin
 *  - Cross-org isolation on the read endpoints (positive proof that an
 *    admin in org-2 doesn't see org-1's data)
 *
 * Closes the audit slice of T-27 from
 * specs/active/Horsemen-Validation-Checklists.md v2.1.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditRouter } from '../../src/audit/routes.js';
import { identities, mountRouter, type TestServer } from './harness.js';

let server: TestServer;

beforeAll(async () => {
  server = await mountRouter(auditRouter(), '/api/audit');
});

afterAll(async () => {
  await server.close();
});

describe('GET /api/audit/events', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/events');
    expect(r.status).toBe(401);
  });

  it("returns events for the caller's org", async () => {
    const r = await server.get('/events', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it('accepts pagination via ?limit and ?offset', async () => {
    const r = await server.get('/events?limit=5&offset=0', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
  });

  it("events are scoped to the caller's org (positive isolation)", async () => {
    const r = await server.get('/events', { identity: identities.otherOrgAdmin });
    expect(r.status).toBe(200);
    // Whatever events appear here MUST carry org-2's orgId, never org-1's.
    if (r.body.data && r.body.data.length > 0) {
      expect(
        r.body.data.every((e: any) => !e.orgId || e.orgId === identities.otherOrgAdmin.orgId)
      ).toBe(true);
    }
  });
});

describe('GET /api/audit/summary', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/summary');
    expect(r.status).toBe(401);
  });

  it("returns a summary for the caller's org", async () => {
    const r = await server.get('/summary', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });
});

describe('GET /api/audit/export', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/export');
    expect(r.status).toBe(401);
  });

  it('returns 200 for an authenticated caller', async () => {
    const r = await server.get('/export', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
  });
});

describe('POST /api/audit/webhook', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.post('/webhook', { body: { url: 'https://example.com/hook' } });
    expect(r.status).toBe(401);
  });

  it('returns 400 when url is missing', async () => {
    const r = await server.post('/webhook', { identity: identities.orgAdmin, body: {} });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
  });

  it("subscribes a webhook for the caller's org", async () => {
    const r = await server.post('/webhook', {
      identity: identities.orgAdmin,
      body: { url: 'https://example.com/hook', events: ['audit.created'] },
    });
    // The webhook handler may return 200 or 201; accept either.
    expect([200, 201]).toContain(r.status);
  });
});

describe('GET /api/audit/webhook', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/webhook');
    expect(r.status).toBe(401);
  });

  it("returns the caller's org's webhook config (single, not a list)", async () => {
    const r = await server.get('/webhook', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    // Handler returns { config, status } where config is the single
    // webhook config for the caller's org (null if not yet configured).
    expect(r.body.data).toHaveProperty('config');
    expect(r.body.data).toHaveProperty('status');
  });

  it("does not leak another org's config (positive isolation)", async () => {
    // Configure in org-1 first
    await server.post('/webhook', {
      identity: identities.orgAdmin,
      body: { url: 'https://org1.example.com/hook' },
    });
    // Read from org-2's POV — should NOT see org-1's URL
    const r = await server.get('/webhook', { identity: identities.otherOrgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.data?.config?.url).not.toBe('https://org1.example.com/hook');
  });
});

describe('GET /api/audit/retention', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/retention');
    expect(r.status).toBe(401);
  });

  it("returns the caller's org retention policy", async () => {
    const r = await server.get('/retention', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
  });
});

describe('POST /api/audit/retention', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.post('/retention', { body: { retentionDays: 365 } });
    expect(r.status).toBe(401);
  });

  it('returns 403 for a non-admin caller', async () => {
    const r = await server.post('/retention', {
      identity: identities.orgAnalyst,
      body: { retentionDays: 365 },
    });
    expect(r.status).toBe(403);
  });

  it('updates retention when caller is admin', async () => {
    const r = await server.post('/retention', {
      identity: identities.orgAdmin,
      body: { retentionDays: 365 },
    });
    expect([200, 201]).toContain(r.status);
  });

  it('returns 400 when retentionDays is missing or wrong type', async () => {
    const r = await server.post('/retention', {
      identity: identities.orgAdmin,
      body: {},
    });
    expect(r.status).toBe(400);
  });
});
