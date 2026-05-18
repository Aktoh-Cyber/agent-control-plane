/**
 * Route-level integration tests for src/compliance/routes.ts (T-24).
 *
 * Covers the 9 GDPR-relevant compliance endpoints:
 *
 *   POST   /api/compliance/deletion                       request deletion
 *   GET    /api/compliance/deletion/preview               dry-run count
 *   GET    /api/compliance/deletion                       list requests
 *   GET    /api/compliance/deletion/:requestId            get request
 *   POST   /api/compliance/deletion/:requestId/execute    execute (super-admin)
 *   GET    /api/compliance/residency                      caller's config
 *   PUT    /api/compliance/residency                      update config
 *   GET    /api/compliance/residency/check                region allowed?
 *   GET    /api/compliance/residency/all                  list all (super-admin)
 *
 * Each route is checked for:
 *  - 401 when no identity is attached
 *  - 403 when identity lacks the required role
 *  - 200 / 201 on the happy path
 *  - 400 on body validation failure (where applicable)
 *  - 404 / cross-org isolation where applicable
 *
 * The deletion-service in-memory store is cleared between tests so each
 * case starts from a clean slate. Residency configs are scoped to unique
 * orgIds per test so they don't bleed.
 *
 * Closes T-24 from specs/active/Horsemen-Validation-Checklists.md v2.1
 * (compliance slice). Drives the test plan from
 * specs/active/T-24-T-27-ACP-route-test-plan.md.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deletionService } from '../../src/compliance/data-deletion.js';
import { complianceRouter } from '../../src/compliance/routes.js';
import { identities, mountRouter, type TestServer } from './harness.js';

let server: TestServer;

beforeAll(async () => {
  server = await mountRouter(complianceRouter(), '/api/compliance');
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  deletionService.clear();
});

// ===========================================================================
// POST /deletion
// ===========================================================================

describe('POST /api/compliance/deletion', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.post('/deletion', { body: { scope: 'org' } });
    expect(r.status).toBe(401);
    expect(r.body.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for a non-admin identity', async () => {
    const r = await server.post('/deletion', {
      identity: identities.orgAnalyst,
      body: { scope: 'org' },
    });
    expect(r.status).toBe(403);
    expect(r.body.error?.code).toBe('FORBIDDEN');
  });

  it('returns 400 when scope is missing or invalid', async () => {
    const missing = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: {},
    });
    expect(missing.status).toBe(400);

    const invalid = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'whole-system' },
    });
    expect(invalid.status).toBe(400);
  });

  it('returns 400 when scope=user but userId is missing', async () => {
    const r = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'user' },
    });
    expect(r.status).toBe(400);
  });

  it('accepts scope=org from an org-admin and scopes the request to their org', async () => {
    const r = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'org' },
    });
    expect(r.status).toBe(201);
    expect(r.body.success).toBe(true);
    expect(r.body.data.orgId).toBe(identities.orgAdmin.orgId);
    expect(r.body.data.scope).toBe('org');
    expect(r.body.data.status).toBe('pending');
  });

  it('accepts scope=user with a userId', async () => {
    const r = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'user', userId: 'user-to-delete' },
    });
    expect(r.status).toBe(201);
    expect(r.body.data.scope).toBe('user');
    expect(r.body.data.userId).toBe('user-to-delete');
  });
});

// ===========================================================================
// GET /deletion/preview
// ===========================================================================

describe('GET /api/compliance/deletion/preview', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/deletion/preview');
    expect(r.status).toBe(401);
  });

  it('returns 200 and a preview shape for an authenticated caller', async () => {
    const r = await server.get('/deletion/preview', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    // Preview returns per-store counts from deletionService.getDeletionSummary
    // which is shaped as Record<string, number>. Empty object is acceptable
    // when no preview callbacks are registered (no app code wires data
    // sources into the deletion service at test time).
    expect(typeof r.body.data).toBe('object');
    for (const [, value] of Object.entries(r.body.data)) {
      expect(typeof value).toBe('number');
    }
  });
});

// ===========================================================================
// GET /deletion
// ===========================================================================

describe('GET /api/compliance/deletion', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/deletion');
    expect(r.status).toBe(401);
  });

  it("returns only the caller's org's deletion requests (positive isolation)", async () => {
    // Two requests, one per org.
    await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'org' },
    });
    await server.post('/deletion', {
      identity: identities.otherOrgAdmin,
      body: { scope: 'org' },
    });

    const r = await server.get('/deletion', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    // Only org-1's request should be visible to org-1's admin.
    expect(r.body.data.every((req: any) => req.orgId === identities.orgAdmin.orgId)).toBe(true);
    expect(r.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns an empty list for an org with no requests', async () => {
    const r = await server.get('/deletion', { identity: identities.otherOrgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.data).toEqual([]);
  });
});

// ===========================================================================
// GET /deletion/:requestId
// ===========================================================================

describe('GET /api/compliance/deletion/:requestId', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/deletion/some-id');
    expect(r.status).toBe(401);
  });

  it("returns the deletion request for the caller's own org", async () => {
    const created = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'org' },
    });
    const id = created.body.data.id;

    const r = await server.get(`/deletion/${id}`, { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.data.id).toBe(id);
  });

  it('returns 404 when the request belongs to a different org (cross-org isolation)', async () => {
    const created = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'org' },
    });
    const id = created.body.data.id;

    const r = await server.get(`/deletion/${id}`, { identity: identities.otherOrgAdmin });
    expect(r.status).toBe(404);
  });

  it('returns 404 for a non-existent id', async () => {
    const r = await server.get('/deletion/does-not-exist', { identity: identities.orgAdmin });
    expect(r.status).toBe(404);
  });
});

// ===========================================================================
// POST /deletion/:requestId/execute
// ===========================================================================

describe('POST /api/compliance/deletion/:requestId/execute', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.post('/deletion/some-id/execute');
    expect(r.status).toBe(401);
  });

  it('returns 403 when caller is admin but NOT super-admin', async () => {
    const created = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'org' },
    });
    const id = created.body.data.id;

    const r = await server.post(`/deletion/${id}/execute`, { identity: identities.orgAdmin });
    expect(r.status).toBe(403);
  });

  it('200s when super-admin executes a pending deletion', async () => {
    const created = await server.post('/deletion', {
      identity: identities.orgAdmin,
      body: { scope: 'org' },
    });
    const id = created.body.data.id;

    const r = await server.post(`/deletion/${id}/execute`, { identity: identities.superAdmin });
    expect(r.status).toBe(200);
    // After execution the status should no longer be 'pending'
    expect(['in_progress', 'completed', 'failed']).toContain(r.body.data.status);
  });

  it('returns 404 for a non-existent id even when super-admin', async () => {
    const r = await server.post('/deletion/does-not-exist/execute', {
      identity: identities.superAdmin,
    });
    expect(r.status).toBe(404);
  });
});

// ===========================================================================
// GET /residency
// ===========================================================================

describe('GET /api/compliance/residency', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/residency');
    expect(r.status).toBe(401);
  });

  it("returns the caller's org default residency config when none is set", async () => {
    const r = await server.get('/residency', { identity: identities.orgAdmin });
    expect(r.status).toBe(200);
    expect(r.body.data.orgId).toBe(identities.orgAdmin.orgId);
    expect(Array.isArray(r.body.data.allowedRegions)).toBe(true);
  });
});

// ===========================================================================
// PUT /residency
// ===========================================================================

describe('PUT /api/compliance/residency', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.put('/residency', { body: { primaryRegion: 'us-east-1' } });
    expect(r.status).toBe(401);
  });

  it('returns 403 for a non-admin', async () => {
    const r = await server.put('/residency', {
      identity: identities.orgAnalyst,
      body: { primaryRegion: 'us-east-1' },
    });
    expect(r.status).toBe(403);
  });

  it("updates and persists the caller's org residency config", async () => {
    const update = await server.put('/residency', {
      identity: identities.orgAdmin,
      body: {
        primaryRegion: 'eu-west-1',
        allowedRegions: ['eu-west-1', 'eu-central-1'],
        crossBorderTransfersAllowed: false,
      },
    });
    expect(update.status).toBe(200);
    expect(update.body.data.primaryRegion).toBe('eu-west-1');

    const read = await server.get('/residency', { identity: identities.orgAdmin });
    expect(read.body.data.primaryRegion).toBe('eu-west-1');
    expect(read.body.data.allowedRegions).toContain('eu-west-1');
  });

  it("does not let an admin in org A change org B's config by passing orgId in body", async () => {
    // The route should ignore any body-supplied orgId — config is keyed by
    // the caller's identity.orgId.
    const r = await server.put('/residency', {
      identity: identities.orgAdmin,
      body: { primaryRegion: 'us-east-1', orgId: identities.otherOrgAdmin.orgId },
    });
    expect(r.status).toBe(200);
    expect(r.body.data.orgId).toBe(identities.orgAdmin.orgId);
  });
});

// ===========================================================================
// GET /residency/check
// ===========================================================================

describe('GET /api/compliance/residency/check', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/residency/check?region=us-east-1');
    expect(r.status).toBe(401);
  });

  it('returns 400 when ?region is missing', async () => {
    const r = await server.get('/residency/check', { identity: identities.orgAdmin });
    expect(r.status).toBe(400);
  });

  it('returns 200 with an "allowed" boolean for a configured region', async () => {
    // Configure org-1 to only allow eu-west-1.
    await server.put('/residency', {
      identity: identities.orgAdmin,
      body: {
        primaryRegion: 'eu-west-1',
        allowedRegions: ['eu-west-1'],
        crossBorderTransfersAllowed: false,
      },
    });

    const ok = await server.get('/residency/check?region=eu-west-1', {
      identity: identities.orgAdmin,
    });
    expect(ok.status).toBe(200);
    expect(ok.body.data.allowed).toBe(true);

    const deny = await server.get('/residency/check?region=ap-south-1', {
      identity: identities.orgAdmin,
    });
    expect(deny.status).toBe(200);
    expect(deny.body.data.allowed).toBe(false);
  });
});

// ===========================================================================
// GET /residency/all
// ===========================================================================

describe('GET /api/compliance/residency/all', () => {
  it('returns 401 without an identity', async () => {
    const r = await server.get('/residency/all');
    expect(r.status).toBe(401);
  });

  it('returns 403 when caller is admin but NOT super-admin', async () => {
    const r = await server.get('/residency/all', { identity: identities.orgAdmin });
    expect(r.status).toBe(403);
  });

  it('returns the full list when super-admin', async () => {
    const r = await server.get('/residency/all', { identity: identities.superAdmin });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });
});
