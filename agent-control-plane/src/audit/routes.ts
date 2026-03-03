/**
 * Audit API Routes
 *
 * Express router for audit endpoints:
 *   GET  /api/audit/events     -- query audit events
 *   GET  /api/audit/summary    -- event counts by type
 *   GET  /api/audit/export     -- download events as JSON Lines (GDPR)
 *   POST /api/audit/webhook    -- configure SIEM webhook (org-admin+)
 *   GET  /api/audit/webhook    -- get current webhook config
 *   GET  /api/audit/retention  -- get retention policy
 *   POST /api/audit/retention  -- set retention policy (org-admin+)
 */

import express, { type Request, type Response, type Router } from 'express';
import {
  auditEventStore,
  getAuditSummary,
  queryAuditEvents,
  type AuditEventFilters,
  type AuditEventType,
} from './audit-events.js';
import { retentionManager } from './retention.js';
import { siemWebhookManager, type SIEMWebhookConfig } from './siem-webhook.js';

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

function getIdentity(req: Request): HorsemenIdentity | undefined {
  return (req as IdentityRequest).identity;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function auditRouter(): Router {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // GET /events -- query audit events
  // -----------------------------------------------------------------------
  router.get('/events', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const filters: AuditEventFilters = {
      orgId: identity.orgId,
    };

    if (req.query.type) {
      filters.eventType = req.query.type as AuditEventType;
    }
    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }
    if (req.query.since) {
      filters.since = new Date(req.query.since as string);
    }
    if (req.query.until) {
      filters.until = new Date(req.query.until as string);
    }
    if (req.query.resource) {
      filters.resource = req.query.resource as string;
    }
    if (req.query.agentId) {
      filters.agentId = req.query.agentId as string;
    }
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string, 10);
    }

    const events = queryAuditEvents(filters);

    res.json({
      success: true,
      data: events,
      metadata: {
        timestamp: new Date().toISOString(),
        count: events.length,
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /summary -- event counts by type
  // -----------------------------------------------------------------------
  router.get('/summary', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const sinceParam = req.query.since as string | undefined;
    const since = sinceParam ? new Date(sinceParam) : undefined;
    const summary = getAuditSummary(identity.orgId, since);

    res.json({
      success: true,
      data: summary,
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /export -- download events as JSON Lines (GDPR data access)
  // -----------------------------------------------------------------------
  router.get('/export', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const filters: AuditEventFilters = {
      orgId: identity.orgId,
    };

    if (req.query.since) {
      filters.since = new Date(req.query.since as string);
    }
    if (req.query.until) {
      filters.until = new Date(req.query.until as string);
    }

    const events = queryAuditEvents(filters);

    // Stream as JSON Lines
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-export-${identity.orgId}-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl"`
    );

    const lines = events
      .map((e) =>
        JSON.stringify({
          ...e,
          timestamp: e.timestamp.toISOString(),
        })
      )
      .join('\n');

    res.send(lines);
  });

  // -----------------------------------------------------------------------
  // POST /webhook -- configure SIEM webhook (org-admin+)
  // -----------------------------------------------------------------------
  router.post('/webhook', (req: Request, res: Response) => {
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

    const body = req.body as Partial<SIEMWebhookConfig>;

    if (!body.url) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'url is required' },
      });
      return;
    }

    const config: SIEMWebhookConfig = {
      orgId: identity.orgId,
      url: body.url,
      authHeader: body.authHeader,
      eventTypes: body.eventTypes,
      batchSize: body.batchSize || 100,
      enabled: body.enabled !== false,
    };

    siemWebhookManager.setConfig(config);

    res.status(201).json({
      success: true,
      data: config,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /webhook -- get current webhook config
  // -----------------------------------------------------------------------
  router.get('/webhook', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const config = siemWebhookManager.getConfig(identity.orgId);
    const status = siemWebhookManager.getStatus(identity.orgId);

    res.json({
      success: true,
      data: {
        config: config ?? null,
        status: status ?? null,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /retention -- get retention policy
  // -----------------------------------------------------------------------
  router.get('/retention', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const policy = retentionManager.getRetentionPolicy(identity.orgId);

    res.json({
      success: true,
      data: policy,
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
        storeSize: auditEventStore.size,
      },
    });
  });

  // -----------------------------------------------------------------------
  // POST /retention -- set retention policy (org-admin+)
  // -----------------------------------------------------------------------
  router.post('/retention', (req: Request, res: Response) => {
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

    const body = req.body as { retentionDays?: number };

    if (body.retentionDays === undefined || typeof body.retentionDays !== 'number') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'retentionDays (number) is required' },
      });
      return;
    }

    const policy = retentionManager.setRetentionPolicy(identity.orgId, body.retentionDays);

    res.status(201).json({
      success: true,
      data: policy,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  return router;
}
