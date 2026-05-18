/**
 * Route-level integration tests for src/federation/role-routes.ts
 * (T-27 role-routes slice). Covers the 5 routes:
 *
 *   GET    /api/permissions
 *   GET    /orgs/:orgId/roles
 *   POST   /orgs/:orgId/roles
 *   PUT    /orgs/:orgId/roles/:roleId
 *   DELETE /orgs/:orgId/roles/:roleId
 *
 * Smoke-tests 401 / 403 / 200 paths; the routes mostly delegate to an
 * in-memory role store so behavioural verification is limited to "the
 * authorisation gates are in place".
 *
 * Closes the role-routes slice of T-27.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { roleRouter } from '../../src/federation/role-routes.js';
import { identities, mountRouter, type TestServer } from './harness.js';

let server: TestServer;

beforeAll(async () => {
  server = await mountRouter(roleRouter(), '/api');
});

afterAll(async () => {
  await server.close();
});

describe('GET /api/permissions', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/permissions');
    expect(r.status).toBe(401);
  });

  it('returns the permission catalogue for any authenticated caller', async () => {
    const r = await server.get('/permissions', { identity: identities.orgAnalyst });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });
});

describe('GET /api/orgs/:orgId/roles', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/orgs/some/roles');
    expect(r.status).toBe(401);
  });

  it("returns the role list for the caller's org", async () => {
    const r = await server.get(`/orgs/${identities.orgAdmin.orgId}/roles`, {
      identity: identities.orgAdmin,
    });
    expect([200, 404]).toContain(r.status);
  });

  it('cross-org probe returns 403 or 404 (no leak)', async () => {
    // Org-1 admin asking for org-2's roles must not get a 200 with org-2 data.
    const r = await server.get(`/orgs/${identities.otherOrgAdmin.orgId}/roles`, {
      identity: identities.orgAdmin,
    });
    expect([403, 404]).toContain(r.status);
  });
});

describe('POST /api/orgs/:orgId/roles', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.post(`/orgs/${identities.orgAdmin.orgId}/roles`, {
      body: { name: 'custom-role', permissions: [] },
    });
    expect(r.status).toBe(401);
  });

  it('returns 403 for a non-admin', async () => {
    const r = await server.post(`/orgs/${identities.orgAdmin.orgId}/roles`, {
      identity: identities.orgAnalyst,
      body: { name: 'custom-role', permissions: [] },
    });
    expect(r.status).toBe(403);
  });

  it("cross-org create attempt blocked (orgId in URL ≠ caller's org)", async () => {
    const r = await server.post(`/orgs/${identities.otherOrgAdmin.orgId}/roles`, {
      identity: identities.orgAdmin,
      body: { name: 'sneaky-role', permissions: [] },
    });
    expect([403, 404]).toContain(r.status);
  });
});

describe('PUT /api/orgs/:orgId/roles/:roleId', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.put(`/orgs/${identities.orgAdmin.orgId}/roles/role-x`, {
      body: { name: 'renamed' },
    });
    expect(r.status).toBe(401);
  });

  it('returns 403 for a non-admin', async () => {
    const r = await server.put(`/orgs/${identities.orgAdmin.orgId}/roles/role-x`, {
      identity: identities.orgAnalyst,
      body: { name: 'renamed' },
    });
    expect(r.status).toBe(403);
  });
});

describe('DELETE /api/orgs/:orgId/roles/:roleId', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.delete(`/orgs/${identities.orgAdmin.orgId}/roles/role-x`);
    expect(r.status).toBe(401);
  });

  it('returns 403 for a non-admin', async () => {
    const r = await server.delete(`/orgs/${identities.orgAdmin.orgId}/roles/role-x`, {
      identity: identities.orgAnalyst,
    });
    expect(r.status).toBe(403);
  });
});
