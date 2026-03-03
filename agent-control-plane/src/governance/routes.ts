/**
 * Governance API Routes
 *
 * Express router for governance endpoints:
 *   GET  /api/governance/policies   -- list policies for the caller's org
 *   POST /api/governance/policies   -- create or update a policy (org-admin+)
 *   GET  /api/governance/usage      -- usage summary for the caller's org
 *   GET  /api/governance/budget     -- budget status for the caller's org
 *   POST /api/governance/budget     -- create or update a budget (org-admin+)
 */

import express, { type Request, type Response, type Router } from 'express';
import { budgetManager, type BudgetInput } from './budget-manager.js';
import type { HorsemenIdentity } from './governance-middleware.js';
import { policyStore, type PolicyInput } from './model-policies.js';
import { usageTracker } from './usage-tracker.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export function governanceRouter(): Router {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // GET /policies -- list policies for the caller's org
  // -----------------------------------------------------------------------
  router.get('/policies', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res
        .status(401)
        .json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      return;
    }

    const policies = policyStore.listByOrg(identity.orgId);
    res.json({
      success: true,
      data: policies,
      metadata: {
        timestamp: new Date().toISOString(),
        count: policies.length,
      },
    });
  });

  // -----------------------------------------------------------------------
  // POST /policies -- create or update a policy
  // -----------------------------------------------------------------------
  router.post('/policies', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res
        .status(401)
        .json({
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

    const body = req.body as Partial<PolicyInput> & { id?: string };

    // If an id is provided, update; otherwise create
    if (body.id) {
      const existing = policyStore.get(body.id);
      if (!existing || existing.orgId !== identity.orgId) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Policy not found' },
        });
        return;
      }
      const updated = policyStore.update(body.id, body);
      res.json({ success: true, data: updated });
      return;
    }

    // Create new
    const input: PolicyInput = {
      orgId: identity.orgId,
      role: body.role,
      allowedModels: body.allowedModels ?? ['*'],
      deniedModels: body.deniedModels ?? [],
      maxCostPerRequest: body.maxCostPerRequest ?? 0.1,
      sensitivityLevel: body.sensitivityLevel ?? 'internal',
    };

    const created = policyStore.create(input);
    res.status(201).json({ success: true, data: created });
  });

  // -----------------------------------------------------------------------
  // GET /usage -- usage summary for the caller's org
  // -----------------------------------------------------------------------
  router.get('/usage', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res
        .status(401)
        .json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      return;
    }

    const sinceParam = req.query.since as string | undefined;
    const since = sinceParam ? new Date(sinceParam) : undefined;
    const summary = usageTracker.getUsageSummary(identity.orgId, since);

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
  // GET /budget -- budget status for the caller's org
  // -----------------------------------------------------------------------
  router.get('/budget', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res
        .status(401)
        .json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      return;
    }

    const budgets = budgetManager.listByOrg(identity.orgId);
    const orgBudget = budgetManager.getBudgetStatus(identity.orgId);

    res.json({
      success: true,
      data: {
        orgBudget: orgBudget ?? null,
        budgets,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // POST /budget -- create or update a budget (org-admin+)
  // -----------------------------------------------------------------------
  router.post('/budget', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res
        .status(401)
        .json({
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

    const body = req.body as Partial<BudgetInput>;

    const input: BudgetInput = {
      orgId: identity.orgId,
      userId: body.userId ?? null,
      period: body.period ?? 'monthly',
      limitUsd: body.limitUsd ?? 100,
      limitTokens: body.limitTokens,
      alertThresholds: body.alertThresholds ?? [0.5, 0.8],
      hardCap: body.hardCap ?? true,
    };

    const budget = budgetManager.set(input);
    res.status(201).json({ success: true, data: budget });
  });

  return router;
}
