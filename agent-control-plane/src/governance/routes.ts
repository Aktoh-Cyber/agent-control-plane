/**
 * Governance API Routes
 *
 * Express router for governance endpoints:
 *   GET  /api/governance/policies      -- list policies for the caller's org
 *   POST /api/governance/policies      -- create or update a policy (org-admin+)
 *   GET  /api/governance/usage         -- usage summary for the caller's org
 *   GET  /api/governance/budget        -- budget status for the caller's org
 *   POST /api/governance/budget        -- create or update a budget (org-admin+)
 *   GET  /api/governance/providers     -- list registered providers
 *   GET  /api/governance/routing       -- get routing priority for caller
 *   POST /api/governance/routing       -- update routing priority (org-admin+)
 *   GET  /api/governance/litellm/keys  -- list virtual keys (org-admin+)
 *   POST /api/governance/litellm/keys  -- create virtual key (org-admin+)
 */

import express, { type Request, type Response, type Router } from 'express';
import { budgetManager, type BudgetInput } from './budget-manager.js';
import type { HorsemenIdentity } from './governance-middleware.js';
import { litellmAdmin, type VirtualKeyConfig } from './litellm-admin.js';
import { policyStore, type PolicyInput } from './model-policies.js';
import { providerRegistry } from './provider-registry.js';
import { routingPriorityStore, type RoutingPriorityInput } from './routing-priority.js';
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
      res.status(401).json({
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
      res.status(401).json({
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
      res.status(401).json({
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

  // -----------------------------------------------------------------------
  // GET /providers -- list registered providers
  // -----------------------------------------------------------------------
  router.get('/providers', (_req: Request, res: Response) => {
    const providers = providerRegistry.listProviders().map((p) => ({
      name: p.name,
      type: p.type,
      locality: p.locality,
      isThirdParty: p.isThirdParty,
    }));

    res.json({
      success: true,
      data: providers,
      metadata: {
        timestamp: new Date().toISOString(),
        count: providers.length,
      },
    });
  });

  // -----------------------------------------------------------------------
  // GET /routing -- get routing priority for caller
  // -----------------------------------------------------------------------
  router.get('/routing', (req: Request, res: Response) => {
    const identity = getIdentity(req);
    if (!identity) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const priority = routingPriorityStore.getEffectivePriority(identity.orgId, identity.sub);

    res.json({
      success: true,
      data: priority,
      metadata: {
        timestamp: new Date().toISOString(),
        orgId: identity.orgId,
      },
    });
  });

  // -----------------------------------------------------------------------
  // POST /routing -- update routing priority (org-admin+)
  // -----------------------------------------------------------------------
  router.post('/routing', (req: Request, res: Response) => {
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

    const body = req.body as Partial<RoutingPriorityInput>;

    const input: RoutingPriorityInput = {
      orgId: identity.orgId,
      userId: body.userId ?? null,
      weights: {
        cost: Number(body.weights?.cost ?? 0.3),
        quality: Number(body.weights?.quality ?? 0.4),
        latency: Number(body.weights?.latency ?? 0.2),
        privacy: Number(body.weights?.privacy ?? 0.1),
      },
      preferredProviders: body.preferredProviders,
    };

    const priority = routingPriorityStore.set(input);
    res.status(201).json({ success: true, data: priority });
  });

  // -----------------------------------------------------------------------
  // GET /litellm/keys -- list virtual keys (org-admin+)
  // -----------------------------------------------------------------------
  router.get('/litellm/keys', async (req: Request, res: Response) => {
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

    try {
      const keys = await litellmAdmin.listVirtualKeys();
      // Filter to keys belonging to this org (by metadata.orgId)
      const orgKeys = keys.filter(
        (k) => (k.metadata as Record<string, unknown>)?.orgId === identity.orgId
      );

      res.json({
        success: true,
        data: orgKeys,
        metadata: {
          timestamp: new Date().toISOString(),
          count: orgKeys.length,
        },
      });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: {
          code: 'LITELLM_ERROR',
          message: (err as Error).message,
        },
      });
    }
  });

  // -----------------------------------------------------------------------
  // POST /litellm/keys -- create virtual key (org-admin+)
  // -----------------------------------------------------------------------
  router.post('/litellm/keys', async (req: Request, res: Response) => {
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

    const body = req.body as Partial<VirtualKeyConfig>;
    const config: VirtualKeyConfig = {
      alias: body.alias,
      allowedModels: body.allowedModels,
      maxBudget: body.maxBudget,
      budgetDuration: body.budgetDuration ?? 'monthly',
      metadata: body.metadata,
    };

    try {
      const result = await litellmAdmin.createVirtualKey(identity.orgId, config);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: {
          code: 'LITELLM_ERROR',
          message: (err as Error).message,
        },
      });
    }
  });

  return router;
}
