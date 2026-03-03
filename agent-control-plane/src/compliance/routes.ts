/**
 * Compliance API Routes
 *
 * Express router for compliance endpoints:
 *
 * Data Deletion (GDPR Right to Erasure):
 *   POST /api/compliance/deletion              -- request data deletion (org-admin+)
 *   GET  /api/compliance/deletion              -- list deletion requests for org
 *   GET  /api/compliance/deletion/preview      -- preview deletion counts (no mutation)
 *   GET  /api/compliance/deletion/:requestId   -- get deletion request status
 *   POST /api/compliance/deletion/:requestId/execute -- execute pending deletion (super-admin only)
 *
 * Data Residency:
 *   GET  /api/compliance/residency             -- get current org's residency config
 *   PUT  /api/compliance/residency             -- update residency config (org-admin+)
 *   GET  /api/compliance/residency/check       -- check if a region is allowed
 *   GET  /api/compliance/residency/all         -- list all configs (super-admin only)
 */

import express, { type Request, type Response, type Router } from 'express';
import { deletionService, type DeletionScope } from './data-deletion.js';
import { dataResidencyStore, type DataRegion, type DataResidencyInput } from './data-residency.js';

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

function isAdmin(roles: string[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

function isSuperAdmin(roles: string[]): boolean {
  return roles.includes('super-admin');
}

function getIdentity(req: Request): HorsemenIdentity | undefined {
  return (req as IdentityRequest).identity;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function complianceRouter(): Router {
  const router = express.Router();

  // =======================================================================
  // Data Deletion Endpoints
  // =======================================================================

  // -----------------------------------------------------------------------
  // POST /deletion -- request data deletion (org-admin+)
  // -----------------------------------------------------------------------
  router.post('/deletion', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!isAdmin(identity.roles)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'org-admin role or higher required' },
      });
      return;
    }

    const body = req.body as { scope?: DeletionScope; userId?: string };

    if (!body.scope || !['org', 'user'].includes(body.scope)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'scope is required and must be "org" or "user"',
        },
      });
      return;
    }

    if (body.scope === 'user' && !body.userId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'userId is required when scope is "user"',
        },
      });
      return;
    }

    try {
      const request = deletionService.requestDeletion(
        body.scope,
        identity.orgId,
        identity.sub,
        body.userId
      );

      res.status(201).json({
        success: true,
        data: request,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: (err as Error).message,
        },
      });
    }
  });

  // -----------------------------------------------------------------------
  // GET /deletion/preview -- preview what would be deleted (counts only)
  //   NOTE: This route MUST come before /deletion/:requestId to avoid
  //   "preview" being captured as a requestId parameter.
  // -----------------------------------------------------------------------
  router.get('/deletion/preview', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userId = req.query.userId as string | undefined;
    const summary = deletionService.getDeletionSummary(identity.orgId, userId);

    res.json({
      success: true,
      data: summary,
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
        userId: userId ?? null,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /deletion -- list deletion requests for the caller's org
  // -----------------------------------------------------------------------
  router.get('/deletion', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const requests = deletionService.listDeletionRequests(identity.orgId);

    res.json({
      success: true,
      data: requests,
      metadata: {
        timestamp: new Date().toISOString(),
        count: requests.length,
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /deletion/:requestId -- get a single deletion request
  // -----------------------------------------------------------------------
  router.get('/deletion/:requestId', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const request = deletionService.getDeletionRequest(req.params.requestId);

    if (!request || request.orgId !== identity.orgId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Deletion request not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: request,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  // -----------------------------------------------------------------------
  // POST /deletion/:requestId/execute -- execute a pending deletion
  //   (super-admin only)
  // -----------------------------------------------------------------------
  router.post('/deletion/:requestId/execute', async (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!isSuperAdmin(identity.roles)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'super-admin role required' },
      });
      return;
    }

    // Verify the request belongs to the caller's org
    const existing = deletionService.getDeletionRequest(req.params.requestId);
    if (!existing || existing.orgId !== identity.orgId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Deletion request not found' },
      });
      return;
    }

    try {
      const result = await deletionService.executeDeletion(req.params.requestId);

      const statusCode = result.status === 'completed' ? 200 : 500;

      res.status(statusCode).json({
        success: result.status === 'completed',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETION_ERROR',
          message: (err as Error).message,
        },
      });
    }
  });

  // =======================================================================
  // Data Residency Endpoints
  // =======================================================================

  // -----------------------------------------------------------------------
  // GET /residency -- get current org's residency config
  // -----------------------------------------------------------------------
  router.get('/residency', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const config = dataResidencyStore.getConfig(identity.orgId);

    res.json({
      success: true,
      data: config,
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // PUT /residency -- update residency config (org-admin+)
  // -----------------------------------------------------------------------
  router.put('/residency', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!isAdmin(identity.roles)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'org-admin role or higher required' },
      });
      return;
    }

    const body = req.body as Partial<DataResidencyInput>;

    const config = dataResidencyStore.setConfig(
      identity.orgId,
      {
        primaryRegion: body.primaryRegion,
        allowedRegions: body.allowedRegions,
        dataClassification: body.dataClassification,
        encryptionRequired: body.encryptionRequired,
        crossBorderTransferAllowed: body.crossBorderTransferAllowed,
        retentionOverrideDays: body.retentionOverrideDays,
      },
      identity.sub
    );

    res.json({
      success: true,
      data: config,
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /residency/check -- check if a region is allowed for current org
  // -----------------------------------------------------------------------
  router.get('/residency/check', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const region = req.query.region as string | undefined;

    if (!region) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'region query parameter is required' },
      });
      return;
    }

    const allowed = dataResidencyStore.isRegionAllowed(identity.orgId, region as DataRegion);

    const crossBorder = dataResidencyStore.validateCrossBorderTransfer(
      identity.orgId,
      region as DataRegion
    );

    res.json({
      success: true,
      data: {
        region,
        allowed,
        crossBorderTransfer: crossBorder,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /residency/all -- list all configs (super-admin only)
  // -----------------------------------------------------------------------
  router.get('/residency/all', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!isSuperAdmin(identity.roles)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'super-admin role required' },
      });
      return;
    }

    const configs = dataResidencyStore.listConfigs();

    res.json({
      success: true,
      data: configs,
      metadata: {
        timestamp: new Date().toISOString(),
        count: configs.length,
      },
    });
  });

  return router;
}
