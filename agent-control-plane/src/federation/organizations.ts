/**
 * Organization Hierarchy
 *
 * In-memory store for multi-org management with tiered settings,
 * team structure, and member roles. A future phase will back this
 * with a persistent database.
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrgTier = 'free' | 'pro' | 'enterprise';

export interface OrgSettings {
  maxUsers: number;
  maxNodes: number;
  maxTokenBudget: number;
  maxToolGenerations: number;
  federationEnabled: boolean;
  auditRetentionDays: number;
}

export interface Organization {
  id: string;
  parentOrgId: string | null;
  name: string;
  slug: string;
  tier: OrgTier;
  settings: OrgSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  description: string;
  createdAt: Date;
}

export type OrgRole = 'viewer' | 'analyst' | 'admin' | 'org-admin' | 'super-admin';

export interface OrgMember {
  orgId: string;
  userId: string;
  role: OrgRole;
  teamId: string | null;
  joinedAt: Date;
}

export interface OrgHierarchyNode {
  org: Organization;
  children: OrgHierarchyNode[];
}

// ---------------------------------------------------------------------------
// Default tier settings
// ---------------------------------------------------------------------------

const TIER_DEFAULTS: Record<OrgTier, OrgSettings> = {
  free: {
    maxUsers: 5,
    maxNodes: 3,
    maxTokenBudget: 10,
    maxToolGenerations: 50,
    federationEnabled: false,
    auditRetentionDays: 30,
  },
  pro: {
    maxUsers: 50,
    maxNodes: 25,
    maxTokenBudget: 500,
    maxToolGenerations: 1000,
    federationEnabled: true,
    auditRetentionDays: 90,
  },
  enterprise: {
    maxUsers: Infinity,
    maxNodes: Infinity,
    maxTokenBudget: Infinity,
    maxToolGenerations: Infinity,
    federationEnabled: true,
    auditRetentionDays: 365,
  },
};

export function getDefaultSettings(tier: OrgTier): OrgSettings {
  return { ...TIER_DEFAULTS[tier] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export class OrganizationStore {
  private orgs: Map<string, Organization> = new Map();
  private teams: Map<string, Team> = new Map();
  private members: Map<string, OrgMember[]> = new Map();

  // -- Org CRUD -------------------------------------------------------------

  createOrg(name: string, tier: OrgTier, parentOrgId?: string): Organization {
    const id = randomUUID();
    const now = new Date();

    const org: Organization = {
      id,
      parentOrgId: parentOrgId ?? null,
      name,
      slug: toSlug(name),
      tier,
      settings: getDefaultSettings(tier),
      createdAt: now,
      updatedAt: now,
    };

    this.orgs.set(id, org);
    this.members.set(id, []);
    return org;
  }

  getOrg(id: string): Organization | undefined {
    return this.orgs.get(id);
  }

  listOrgs(): Organization[] {
    return Array.from(this.orgs.values());
  }

  updateOrg(
    id: string,
    updates: Partial<Pick<Organization, 'name' | 'tier' | 'settings'>>
  ): Organization | undefined {
    const org = this.orgs.get(id);
    if (!org) return undefined;

    if (updates.name !== undefined) {
      org.name = updates.name;
      org.slug = toSlug(updates.name);
    }
    if (updates.tier !== undefined) {
      org.tier = updates.tier;
      // Apply new tier defaults unless custom settings were provided
      if (!updates.settings) {
        org.settings = getDefaultSettings(updates.tier);
      }
    }
    if (updates.settings !== undefined) {
      org.settings = { ...org.settings, ...updates.settings };
    }
    org.updatedAt = new Date();

    return org;
  }

  deleteOrg(id: string): boolean {
    if (!this.orgs.has(id)) return false;

    // Remove child orgs
    for (const org of this.orgs.values()) {
      if (org.parentOrgId === id) {
        this.deleteOrg(org.id);
      }
    }

    // Remove teams for this org
    for (const team of this.teams.values()) {
      if (team.orgId === id) {
        this.teams.delete(team.id);
      }
    }

    this.members.delete(id);
    this.orgs.delete(id);
    return true;
  }

  // -- Teams ----------------------------------------------------------------

  createTeam(orgId: string, name: string, description: string): Team | undefined {
    if (!this.orgs.has(orgId)) return undefined;

    const team: Team = {
      id: randomUUID(),
      orgId,
      name,
      description,
      createdAt: new Date(),
    };

    this.teams.set(team.id, team);
    return team;
  }

  listTeams(orgId: string): Team[] {
    return Array.from(this.teams.values()).filter((t) => t.orgId === orgId);
  }

  deleteTeam(id: string): boolean {
    const team = this.teams.get(id);
    if (!team) return false;

    // Unassign members from this team
    const orgMembers = this.members.get(team.orgId) ?? [];
    for (const member of orgMembers) {
      if (member.teamId === id) {
        member.teamId = null;
      }
    }

    this.teams.delete(id);
    return true;
  }

  // -- Members --------------------------------------------------------------

  addMember(orgId: string, userId: string, role: OrgRole, teamId?: string): OrgMember | undefined {
    if (!this.orgs.has(orgId)) return undefined;

    const orgMembers = this.members.get(orgId) ?? [];

    // Prevent duplicate membership
    if (orgMembers.some((m) => m.userId === userId)) return undefined;

    const member: OrgMember = {
      orgId,
      userId,
      role,
      teamId: teamId ?? null,
      joinedAt: new Date(),
    };

    orgMembers.push(member);
    this.members.set(orgId, orgMembers);
    return member;
  }

  removeMember(orgId: string, userId: string): boolean {
    const orgMembers = this.members.get(orgId);
    if (!orgMembers) return false;

    const idx = orgMembers.findIndex((m) => m.userId === userId);
    if (idx < 0) return false;

    orgMembers.splice(idx, 1);
    return true;
  }

  listMembers(orgId: string): OrgMember[] {
    return this.members.get(orgId) ?? [];
  }

  getMember(orgId: string, userId: string): OrgMember | undefined {
    const orgMembers = this.members.get(orgId) ?? [];
    return orgMembers.find((m) => m.userId === userId);
  }

  updateMemberRole(orgId: string, userId: string, role: OrgRole): OrgMember | undefined {
    const member = this.getMember(orgId, userId);
    if (!member) return undefined;

    member.role = role;
    return member;
  }

  // -- Hierarchy ------------------------------------------------------------

  getOrgHierarchy(orgId: string): OrgHierarchyNode | undefined {
    const org = this.orgs.get(orgId);
    if (!org) return undefined;

    const children: OrgHierarchyNode[] = [];
    for (const child of this.orgs.values()) {
      if (child.parentOrgId === orgId) {
        const childNode = this.getOrgHierarchy(child.id);
        if (childNode) children.push(childNode);
      }
    }

    return { org, children };
  }
}

// ---------------------------------------------------------------------------
// Singleton store instance
// ---------------------------------------------------------------------------

export const organizationStore = new OrganizationStore();
