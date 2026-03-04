/**
 * Custom Role Builder
 *
 * Granular permission system with default and custom roles per organization.
 * Default roles are immutable; custom roles are limited to 20 per org.
 * A future phase will back this with a persistent database.
 */

import { randomUUID } from 'node:crypto';
import { organizationStore } from './organizations.js';

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  'read:agents',
  'write:agents',
  'delete:agents',
  'read:tools',
  'write:tools',
  'delete:tools',
  'invoke:tools',
  'create:tools',
  'read:nodes',
  'write:nodes',
  'deploy:nodes',
  'manage:nodes',
  'read:audit',
  'export:audit',
  'read:models',
  'manage:models',
  'read:users',
  'manage:users',
  'read:org',
  'manage:org',
  'manage:billing',
  'read:workflows',
  'execute:workflows',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomRole {
  id: string;
  orgId: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

// ---------------------------------------------------------------------------
// Default roles (immutable)
// ---------------------------------------------------------------------------

const VIEWER_PERMISSIONS: Permission[] = [
  'read:agents',
  'read:tools',
  'read:nodes',
  'read:audit',
  'read:models',
  'read:org',
];

const ANALYST_PERMISSIONS: Permission[] = [
  ...VIEWER_PERMISSIONS,
  'invoke:tools',
  'read:workflows',
  'execute:workflows',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...ANALYST_PERMISSIONS,
  'write:agents',
  'write:tools',
  'write:nodes',
  'deploy:nodes',
  'manage:models',
  'manage:users',
];

const ORG_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  'manage:org',
  'export:audit',
  'delete:agents',
  'delete:tools',
  'manage:nodes',
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [...PERMISSIONS];

function buildDefaultRole(
  id: string,
  name: string,
  description: string,
  permissions: Permission[],
  orgId: string
): CustomRole {
  const now = new Date();
  return {
    id,
    orgId,
    name,
    description,
    permissions,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}

function getDefaultRoles(orgId: string): CustomRole[] {
  return [
    buildDefaultRole(
      'viewer',
      'Viewer',
      'Read-only access to resources',
      VIEWER_PERMISSIONS,
      orgId
    ),
    buildDefaultRole(
      'analyst',
      'Analyst',
      'Viewer access plus tool invocation and workflows',
      ANALYST_PERMISSIONS,
      orgId
    ),
    buildDefaultRole(
      'admin',
      'Admin',
      'Full resource management except org-level settings',
      ADMIN_PERMISSIONS,
      orgId
    ),
    buildDefaultRole(
      'org-admin',
      'Org Admin',
      'Full admin plus org management and audit export',
      ORG_ADMIN_PERMISSIONS,
      orgId
    ),
    buildDefaultRole(
      'super-admin',
      'Super Admin',
      'Unrestricted access to all permissions',
      SUPER_ADMIN_PERMISSIONS,
      orgId
    ),
  ];
}

const DEFAULT_ROLE_IDS = new Set(['viewer', 'analyst', 'admin', 'org-admin', 'super-admin']);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CUSTOM_ROLES_PER_ORG = 20;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export class CustomRoleStore {
  /** orgId -> roleId -> CustomRole */
  private roles: Map<string, Map<string, CustomRole>> = new Map();

  // -- Helpers --------------------------------------------------------------

  private getOrgRoles(orgId: string): Map<string, CustomRole> {
    let orgRoles = this.roles.get(orgId);
    if (!orgRoles) {
      orgRoles = new Map();
      this.roles.set(orgId, orgRoles);
    }
    return orgRoles;
  }

  private validatePermissions(permissions: Permission[]): string | null {
    const validSet = new Set<string>(PERMISSIONS);
    for (const p of permissions) {
      if (!validSet.has(p)) {
        return `Invalid permission: ${p}`;
      }
    }
    if (permissions.length === 0) {
      return 'At least one permission is required';
    }
    return null;
  }

  // -- CRUD -----------------------------------------------------------------

  createRole(orgId: string, input: CreateRoleInput): CustomRole | { error: string } {
    if (!organizationStore.getOrg(orgId)) {
      return { error: 'Organization not found' };
    }

    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      return { error: 'Role name is required' };
    }

    const permError = this.validatePermissions(input.permissions);
    if (permError) {
      return { error: permError };
    }

    const orgRoles = this.getOrgRoles(orgId);
    const customCount = Array.from(orgRoles.values()).filter((r) => !r.isDefault).length;
    if (customCount >= MAX_CUSTOM_ROLES_PER_ORG) {
      return { error: `Maximum of ${MAX_CUSTOM_ROLES_PER_ORG} custom roles per organization` };
    }

    // Prevent name collisions with defaults
    const nameLower = input.name.trim().toLowerCase();
    const allRoles = [...getDefaultRoles(orgId), ...orgRoles.values()];
    if (allRoles.some((r) => r.name.toLowerCase() === nameLower)) {
      return { error: `A role named "${input.name.trim()}" already exists` };
    }

    const now = new Date();
    const role: CustomRole = {
      id: randomUUID(),
      orgId,
      name: input.name.trim(),
      description: input.description ?? '',
      permissions: [...new Set(input.permissions)],
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    orgRoles.set(role.id, role);
    return role;
  }

  updateRole(
    orgId: string,
    roleId: string,
    updates: UpdateRoleInput
  ): CustomRole | { error: string } {
    if (DEFAULT_ROLE_IDS.has(roleId)) {
      return { error: 'Default roles cannot be modified' };
    }

    const orgRoles = this.getOrgRoles(orgId);
    const role = orgRoles.get(roleId);
    if (!role) {
      return { error: 'Role not found' };
    }

    if (updates.permissions) {
      const permError = this.validatePermissions(updates.permissions);
      if (permError) {
        return { error: permError };
      }
      role.permissions = [...new Set(updates.permissions)];
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        return { error: 'Role name cannot be empty' };
      }
      const nameLower = updates.name.trim().toLowerCase();
      const allRoles = [...getDefaultRoles(orgId), ...orgRoles.values()];
      const conflict = allRoles.find((r) => r.id !== roleId && r.name.toLowerCase() === nameLower);
      if (conflict) {
        return { error: `A role named "${updates.name.trim()}" already exists` };
      }
      role.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      role.description = updates.description;
    }

    role.updatedAt = new Date();
    return role;
  }

  deleteRole(orgId: string, roleId: string): true | { error: string } {
    if (DEFAULT_ROLE_IDS.has(roleId)) {
      return { error: 'Default roles cannot be deleted' };
    }

    const orgRoles = this.getOrgRoles(orgId);
    const role = orgRoles.get(roleId);
    if (!role) {
      return { error: 'Role not found' };
    }

    // Check no members are assigned this custom role
    const members = organizationStore.listMembers(orgId);
    const assigned = members.filter((m) => m.role === roleId);
    if (assigned.length > 0) {
      return {
        error: `Cannot delete role: ${assigned.length} member(s) are still assigned to it`,
      };
    }

    orgRoles.delete(roleId);
    return true;
  }

  getRole(orgId: string, roleId: string): CustomRole | undefined {
    // Check defaults first
    if (DEFAULT_ROLE_IDS.has(roleId)) {
      return getDefaultRoles(orgId).find((r) => r.id === roleId);
    }
    return this.getOrgRoles(orgId).get(roleId);
  }

  listRoles(orgId: string): CustomRole[] {
    const defaults = getDefaultRoles(orgId);
    const custom = Array.from(this.getOrgRoles(orgId).values());
    return [...defaults, ...custom];
  }

  getRolePermissions(orgId: string, roleId: string): Permission[] | undefined {
    const role = this.getRole(orgId, roleId);
    return role?.permissions;
  }

  checkPermission(orgId: string, roleId: string, permission: Permission): boolean {
    const perms = this.getRolePermissions(orgId, roleId);
    if (!perms) return false;
    return perms.includes(permission);
  }
}

// ---------------------------------------------------------------------------
// Singleton store instance
// ---------------------------------------------------------------------------

export const customRoleStore = new CustomRoleStore();
