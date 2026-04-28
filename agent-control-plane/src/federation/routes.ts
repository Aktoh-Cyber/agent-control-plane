/**
 * Federation API Routes
 *
 * Express router for organization and quota endpoints:
 *
 * Organizations:
 *   POST   /api/federation/orgs                -- create org (super-admin)
 *   GET    /api/federation/orgs                -- list orgs (super-admin) or own org
 *   GET    /api/federation/orgs/:id            -- get org details
 *   PUT    /api/federation/orgs/:id            -- update org (org-admin)
 *   DELETE /api/federation/orgs/:id            -- delete org (super-admin)
 * Teams:
 *   POST   /api/federation/orgs/:id/teams      -- create team (org-admin)
 *   GET    /api/federation/orgs/:id/teams      -- list teams
 * Members:
 *   POST   /api/federation/orgs/:id/members            -- add member (org-admin)
 *   GET    /api/federation/orgs/:id/members            -- list members
 *   PUT    /api/federation/orgs/:id/members/:userId    -- update member role (org-admin)
 *   DELETE /api/federation/orgs/:id/members/:userId    -- remove member (org-admin)
 * Quotas:
 *   GET    /api/federation/quotas              -- get quota usage for org
 *   GET    /api/federation/quotas/limits       -- get quota limits for org tier
 *   PUT    /api/federation/quotas/limits       -- set custom limits (super-admin, enterprise)
 */

import express, { type Request, type Response, type Router } from 'express';
import {
  organizationStore,
  type OrgRole,
  type OrgSettings,
  type OrgTier,
} from './organizations.js';
import { quotaManager, type QuotaLimits } from './quotas.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface HorsemenIdentity {
  sub: string;
  orgId: string;
  roles: string[];
}
interface IdentityRequest extends Request {
  identity?: HorsemenIdentity;
}

const ADMIN_ROLES = ['admin', 'org-admin', 'super-admin'];
const VALID_TIERS: OrgTier[] = ['free', 'pro', 'enterprise'];
const VALID_ROLES: OrgRole[] = ['viewer', 'analyst', 'admin', 'org-admin', 'super-admin'];

function getIdentity(req: Request): HorsemenIdentity | undefined {
  return (req as IdentityRequest).identity;
}
function isAdmin(roles: string[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}
function isSuperAdmin(roles: string[]): boolean {
  return roles.includes('super-admin');
}

/** Send 401 and return true if no identity present. */
function requireAuth(req: Request, res: Response): HorsemenIdentity | null {
  const identity = getIdentity(req);
  if (!identity) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return null;
  }
  return identity;
}

/** Send 403 and return false if identity lacks admin role. */
function requireAdmin(identity: HorsemenIdentity, res: Response): boolean {
  if (!isAdmin(identity.roles)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'org-admin role or higher required' },
    });
    return false;
  }
  return true;
}

/** Send 403 and return false if identity is not super-admin. */
function requireSuperAdmin(identity: HorsemenIdentity, res: Response): boolean {
  if (!isSuperAdmin(identity.roles)) {
    res
      .status(403)
      .json({ success: false, error: { code: 'FORBIDDEN', message: 'super-admin role required' } });
    return false;
  }
  return true;
}

function ts() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function federationRouter(): Router {
  const router = express.Router();

  // POST /orgs -- create org (super-admin)
  router.post('/orgs', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireSuperAdmin(identity, res)) return;

    const body = req.body as { name?: string; tier?: OrgTier; parentOrgId?: string };
    if (!body.name || typeof body.name !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'name (string) is required' },
      });
      return;
    }
    const tier = body.tier ?? 'free';
    if (!VALID_TIERS.includes(tier)) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `tier must be one of: ${VALID_TIERS.join(', ')}` },
      });
      return;
    }

    const org = organizationStore.createOrg(body.name, tier, body.parentOrgId);
    res.status(201).json({ success: true, data: org, metadata: { timestamp: ts() } });
  });

  // GET /orgs -- list orgs (super-admin sees all, others see own org)
  router.get('/orgs', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    if (isSuperAdmin(identity.roles)) {
      const orgs = organizationStore.listOrgs();
      res.json({ success: true, data: orgs, metadata: { timestamp: ts(), count: orgs.length } });
      return;
    }
    const org = organizationStore.getOrg(identity.orgId);
    res.json({
      success: true,
      data: org ? [org] : [],
      metadata: { timestamp: ts(), count: org ? 1 : 0, orgId: identity.orgId },
    });
  });

  // GET /orgs/:id -- get org details
  router.get('/orgs/:id', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    const org = organizationStore.getOrg(req.params.id);
    if (!org) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }
    if (!isSuperAdmin(identity.roles) && org.id !== identity.orgId) {
      res
        .status(403)
        .json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }
    const hierarchy = organizationStore.getOrgHierarchy(org.id);
    res.json({
      success: true,
      data: { ...org, hierarchy },
      metadata: { timestamp: ts(), orgId: org.id },
    });
  });

  // PUT /orgs/:id -- update org (org-admin)
  router.put('/orgs/:id', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireAdmin(identity, res)) return;
    if (!isSuperAdmin(identity.roles) && req.params.id !== identity.orgId) {
      res
        .status(403)
        .json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const body = req.body as { name?: string; tier?: OrgTier; settings?: OrgSettings };
    if (body.tier && !VALID_TIERS.includes(body.tier)) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `tier must be one of: ${VALID_TIERS.join(', ')}` },
      });
      return;
    }
    const org = organizationStore.updateOrg(req.params.id, body);
    if (!org) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }
    res.json({ success: true, data: org, metadata: { timestamp: ts(), orgId: org.id } });
  });

  // DELETE /orgs/:id -- delete org (super-admin)
  router.delete('/orgs/:id', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireSuperAdmin(identity, res)) return;

    const deleted = organizationStore.deleteOrg(req.params.id);
    if (!deleted) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }
    res.json({
      success: true,
      data: { id: req.params.id, deleted: true },
      metadata: { timestamp: ts() },
    });
  });

  // POST /orgs/:id/teams -- create team (org-admin)
  router.post('/orgs/:id/teams', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireAdmin(identity, res)) return;

    const body = req.body as { name?: string; description?: string };
    if (!body.name || typeof body.name !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'name (string) is required' },
      });
      return;
    }
    const team = organizationStore.createTeam(req.params.id, body.name, body.description ?? '');
    if (!team) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }
    res
      .status(201)
      .json({ success: true, data: team, metadata: { timestamp: ts(), orgId: req.params.id } });
  });

  // GET /orgs/:id/teams -- list teams
  router.get('/orgs/:id/teams', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    const teams = organizationStore.listTeams(req.params.id);
    res.json({
      success: true,
      data: teams,
      metadata: { timestamp: ts(), count: teams.length, orgId: req.params.id },
    });
  });

  // POST /orgs/:id/members -- add member (org-admin)
  router.post('/orgs/:id/members', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireAdmin(identity, res)) return;

    const body = req.body as { userId?: string; role?: OrgRole; teamId?: string };
    if (!body.userId || typeof body.userId !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'userId (string) is required' },
      });
      return;
    }
    const role = body.role ?? 'viewer';
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `role must be one of: ${VALID_ROLES.join(', ')}` },
      });
      return;
    }
    try {
      quotaManager.enforceQuota(req.params.id, 'users');
    } catch (err) {
      res.status(429).json({
        success: false,
        error: { code: 'QUOTA_EXCEEDED', message: (err as Error).message },
      });
      return;
    }
    const member = organizationStore.addMember(req.params.id, body.userId, role, body.teamId);
    if (!member) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Organization not found or member already exists',
        },
      });
      return;
    }
    res
      .status(201)
      .json({ success: true, data: member, metadata: { timestamp: ts(), orgId: req.params.id } });
  });

  // GET /orgs/:id/members -- list members
  router.get('/orgs/:id/members', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    const members = organizationStore.listMembers(req.params.id);
    res.json({
      success: true,
      data: members,
      metadata: { timestamp: ts(), count: members.length, orgId: req.params.id },
    });
  });

  // PUT /orgs/:id/members/:userId -- update member role (org-admin)
  router.put('/orgs/:id/members/:userId', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireAdmin(identity, res)) return;

    const body = req.body as { role?: OrgRole };
    if (!body.role || !VALID_ROLES.includes(body.role)) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `role must be one of: ${VALID_ROLES.join(', ')}` },
      });
      return;
    }
    const member = organizationStore.updateMemberRole(req.params.id, req.params.userId, body.role);
    if (!member) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
      return;
    }
    res.json({ success: true, data: member, metadata: { timestamp: ts(), orgId: req.params.id } });
  });

  // DELETE /orgs/:id/members/:userId -- remove member (org-admin)
  router.delete('/orgs/:id/members/:userId', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireAdmin(identity, res)) return;

    const removed = organizationStore.removeMember(req.params.id, req.params.userId);
    if (!removed) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
      return;
    }
    res.json({
      success: true,
      data: { orgId: req.params.id, userId: req.params.userId, removed: true },
      metadata: { timestamp: ts() },
    });
  });

  // GET /quotas -- get quota usage for org
  router.get('/quotas', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    const usage = quotaManager.getUsage(identity.orgId);
    res.json({ success: true, data: usage, metadata: { timestamp: ts(), orgId: identity.orgId } });
  });

  // GET /quotas/limits -- get quota limits for org tier
  router.get('/quotas/limits', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    const org = organizationStore.getOrg(identity.orgId);
    if (!org) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }
    const limits = quotaManager.getQuotaLimits(org.tier, org.id);
    res.json({
      success: true,
      data: { tier: org.tier, limits },
      metadata: { timestamp: ts(), orgId: identity.orgId },
    });
  });

  // PUT /quotas/limits -- set custom limits (super-admin, enterprise only)
  router.put('/quotas/limits', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireSuperAdmin(identity, res)) return;

    const body = req.body as Partial<QuotaLimits> & { orgId?: string };
    const targetOrgId = body.orgId ?? identity.orgId;
    try {
      const { orgId: _, ...limitUpdates } = body;
      const limits = quotaManager.setCustomLimits(targetOrgId, limitUpdates);
      res.json({ success: true, data: limits, metadata: { timestamp: ts(), orgId: targetOrgId } });
    } catch (err) {
      res
        .status(400)
        .json({ success: false, error: { code: 'BAD_REQUEST', message: (err as Error).message } });
    }
  });

  return router;
}
