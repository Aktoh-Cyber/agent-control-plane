/**
 * Custom Role API Routes
 *
 * Express router for custom role management:
 *
 *   GET    /api/v1/orgs/:orgId/roles            -- list all roles (default + custom)
 *   POST   /api/v1/orgs/:orgId/roles            -- create custom role (org-admin)
 *   PUT    /api/v1/orgs/:orgId/roles/:roleId    -- update custom role (org-admin)
 *   DELETE /api/v1/orgs/:orgId/roles/:roleId    -- delete custom role (org-admin)
 *   GET    /api/v1/permissions                   -- list all available permissions
 */

import express, { type Request, type Response, type Router } from 'express';
import {
  customRoleStore,
  PERMISSIONS,
  type CreateRoleInput,
  type Permission,
  type UpdateRoleInput,
} from './custom-roles.js';

// ---------------------------------------------------------------------------
// Helpers (same auth pattern as routes.ts)
// ---------------------------------------------------------------------------

interface HorsemenIdentity {
  sub: string;
  orgId: string;
  roles: string[];
}
interface IdentityRequest extends Request {
  identity?: HorsemenIdentity;
}

const ADMIN_ROLES = ['org-admin', 'super-admin'];

function getIdentity(req: Request): HorsemenIdentity | undefined {
  return (req as IdentityRequest).identity;
}

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

function requireOrgAdmin(identity: HorsemenIdentity, res: Response): boolean {
  if (!identity.roles.some((r) => ADMIN_ROLES.includes(r))) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'org-admin role or higher required' },
    });
    return false;
  }
  return true;
}

function isSuperAdmin(roles: string[]): boolean {
  return roles.includes('super-admin');
}

function ts(): string {
  return new Date().toISOString();
}

function isError(result: unknown): result is { error: string } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

// ---------------------------------------------------------------------------
// Permission categories (for the permissions endpoint)
// ---------------------------------------------------------------------------

interface PermissionCategory {
  category: string;
  permissions: Permission[];
}

function categorizePermissions(): PermissionCategory[] {
  const categories: Record<string, Permission[]> = {};

  for (const perm of PERMISSIONS) {
    const [, resource] = perm.split(':');
    const category = resource ?? 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(perm);
  }

  return Object.entries(categories).map(([category, permissions]) => ({
    category,
    permissions,
  }));
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function roleRouter(): Router {
  const router = express.Router();

  // GET /orgs/:orgId/roles -- list all roles
  router.get('/orgs/:orgId/roles', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    // Non-super-admins can only see their own org's roles
    if (!isSuperAdmin(identity.roles) && req.params.orgId !== identity.orgId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    const roles = customRoleStore.listRoles(req.params.orgId);
    res.json({
      success: true,
      data: roles,
      metadata: { timestamp: ts(), count: roles.length, orgId: req.params.orgId },
    });
  });

  // POST /orgs/:orgId/roles -- create custom role
  router.post('/orgs/:orgId/roles', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireOrgAdmin(identity, res)) return;

    if (!isSuperAdmin(identity.roles) && req.params.orgId !== identity.orgId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    const body = req.body as Partial<CreateRoleInput>;
    if (!body.name || typeof body.name !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'name (string) is required' },
      });
      return;
    }
    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'permissions (non-empty array) is required' },
      });
      return;
    }

    const result = customRoleStore.createRole(req.params.orgId, {
      name: body.name,
      description: body.description ?? '',
      permissions: body.permissions as Permission[],
    });

    if (isError(result)) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: result.error },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result,
      metadata: { timestamp: ts(), orgId: req.params.orgId },
    });
  });

  // PUT /orgs/:orgId/roles/:roleId -- update custom role
  router.put('/orgs/:orgId/roles/:roleId', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireOrgAdmin(identity, res)) return;

    if (!isSuperAdmin(identity.roles) && req.params.orgId !== identity.orgId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    const body = req.body as Partial<UpdateRoleInput>;
    const result = customRoleStore.updateRole(req.params.orgId, req.params.roleId, {
      name: body.name,
      description: body.description,
      permissions: body.permissions as Permission[] | undefined,
    });

    if (isError(result)) {
      const status = result.error === 'Role not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: {
          code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
          message: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: result,
      metadata: { timestamp: ts(), orgId: req.params.orgId },
    });
  });

  // DELETE /orgs/:orgId/roles/:roleId -- delete custom role
  router.delete('/orgs/:orgId/roles/:roleId', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity || !requireOrgAdmin(identity, res)) return;

    if (!isSuperAdmin(identity.roles) && req.params.orgId !== identity.orgId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    const result = customRoleStore.deleteRole(req.params.orgId, req.params.roleId);

    if (isError(result)) {
      const status = result.error === 'Role not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: {
          code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
          message: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { orgId: req.params.orgId, roleId: req.params.roleId, deleted: true },
      metadata: { timestamp: ts() },
    });
  });

  // GET /permissions -- list all available permissions (categorized)
  router.get('/permissions', (req: Request, res: Response) => {
    const identity = requireAuth(req, res);
    if (!identity) return;

    const categories = categorizePermissions();
    res.json({
      success: true,
      data: {
        permissions: [...PERMISSIONS],
        categories,
      },
      metadata: { timestamp: ts(), count: PERMISSIONS.length },
    });
  });

  return router;
}
