/**
 * Quota Management
 *
 * Per-org quota enforcement based on tier limits.
 * Tracks current usage and validates requests against configured limits.
 * A future phase will back this with a persistent database.
 */

import {
  type OrgSettings,
  type OrgTier,
  getDefaultSettings,
  organizationStore,
} from './organizations.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuotaLimits {
  maxUsers: number;
  maxNodes: number;
  maxTokenBudget: number;
  maxToolGenerations: number;
  maxFederationPeers: number;
  auditRetentionDays: number;
}

export interface QuotaUsage {
  orgId: string;
  users: number;
  nodes: number;
  tokenBudgetUsed: number;
  toolGenerations: number;
  federationPeers: number;
  checkedAt: Date;
}

export type QuotaResource =
  | 'users'
  | 'nodes'
  | 'tokenBudget'
  | 'toolGenerations'
  | 'federationPeers';

export interface QuotaCheckResult {
  allowed: boolean;
  reason: string;
  currentUsage: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Default peer limits per tier
// ---------------------------------------------------------------------------

const FEDERATION_PEER_LIMITS: Record<OrgTier, number> = {
  free: 0,
  pro: 5,
  enterprise: Infinity,
};

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

export class QuotaManager {
  private usageStore: Map<string, QuotaUsage> = new Map();
  private customLimits: Map<string, Partial<QuotaLimits>> = new Map();

  /** Return the effective quota limits for a tier, with optional custom overrides. */
  getQuotaLimits(tier: OrgTier, orgId?: string): QuotaLimits {
    const defaults = getDefaultSettings(tier);

    const baseLimits: QuotaLimits = {
      maxUsers: defaults.maxUsers,
      maxNodes: defaults.maxNodes,
      maxTokenBudget: defaults.maxTokenBudget,
      maxToolGenerations: defaults.maxToolGenerations,
      maxFederationPeers: FEDERATION_PEER_LIMITS[tier],
      auditRetentionDays: defaults.auditRetentionDays,
    };

    if (orgId) {
      const custom = this.customLimits.get(orgId);
      if (custom) {
        return { ...baseLimits, ...custom };
      }
    }

    return baseLimits;
  }

  /** Return current usage for an org, computing live counts where possible. */
  getUsage(orgId: string): QuotaUsage {
    const stored = this.usageStore.get(orgId);

    // Compute live member count from the organization store
    const members = organizationStore.listMembers(orgId);

    const usage: QuotaUsage = {
      orgId,
      users: members.length,
      nodes: stored?.nodes ?? 0,
      tokenBudgetUsed: stored?.tokenBudgetUsed ?? 0,
      toolGenerations: stored?.toolGenerations ?? 0,
      federationPeers: stored?.federationPeers ?? 0,
      checkedAt: new Date(),
    };

    this.usageStore.set(orgId, usage);
    return usage;
  }

  /** Check whether a requested amount of a resource is within quota. */
  checkQuota(
    orgId: string,
    resource: QuotaResource,
    requestedAmount: number = 1
  ): QuotaCheckResult {
    const org = organizationStore.getOrg(orgId);
    if (!org) {
      return {
        allowed: false,
        reason: 'Organization not found',
        currentUsage: 0,
        limit: 0,
      };
    }

    const limits = this.getQuotaLimits(org.tier, orgId);
    const usage = this.getUsage(orgId);

    const resourceMap: Record<QuotaResource, { current: number; limit: number }> = {
      users: { current: usage.users, limit: limits.maxUsers },
      nodes: { current: usage.nodes, limit: limits.maxNodes },
      tokenBudget: { current: usage.tokenBudgetUsed, limit: limits.maxTokenBudget },
      toolGenerations: { current: usage.toolGenerations, limit: limits.maxToolGenerations },
      federationPeers: { current: usage.federationPeers, limit: limits.maxFederationPeers },
    };

    const { current, limit } = resourceMap[resource];
    const newTotal = current + requestedAmount;

    if (newTotal > limit) {
      return {
        allowed: false,
        reason: `Quota exceeded for ${resource}: ${current} + ${requestedAmount} > ${limit}`,
        currentUsage: current,
        limit,
      };
    }

    return {
      allowed: true,
      reason: 'Within quota',
      currentUsage: current,
      limit,
    };
  }

  /** Enforce quota -- throws if the resource is over limit. */
  enforceQuota(orgId: string, resource: QuotaResource, requestedAmount: number = 1): void {
    const result = this.checkQuota(orgId, resource, requestedAmount);
    if (!result.allowed) {
      throw new Error(result.reason);
    }
  }

  /** Set custom limits for an enterprise org (overrides tier defaults). */
  setCustomLimits(orgId: string, limits: Partial<QuotaLimits>): QuotaLimits {
    const org = organizationStore.getOrg(orgId);
    if (!org) {
      throw new Error('Organization not found');
    }
    if (org.tier !== 'enterprise') {
      throw new Error('Custom limits are only available for enterprise tier');
    }

    this.customLimits.set(orgId, limits);

    // Also update the org settings to reflect custom limits
    const settings: Partial<OrgSettings> = {};
    if (limits.maxUsers !== undefined) settings.maxUsers = limits.maxUsers;
    if (limits.maxNodes !== undefined) settings.maxNodes = limits.maxNodes;
    if (limits.maxTokenBudget !== undefined) settings.maxTokenBudget = limits.maxTokenBudget;
    if (limits.maxToolGenerations !== undefined)
      settings.maxToolGenerations = limits.maxToolGenerations;
    if (limits.auditRetentionDays !== undefined)
      settings.auditRetentionDays = limits.auditRetentionDays;

    organizationStore.updateOrg(orgId, { settings: { ...org.settings, ...settings } });

    return this.getQuotaLimits(org.tier, orgId);
  }

  /** Update usage counters for a specific resource. */
  recordUsage(orgId: string, resource: QuotaResource, amount: number): void {
    const usage = this.getUsage(orgId);

    switch (resource) {
      case 'nodes':
        usage.nodes += amount;
        break;
      case 'tokenBudget':
        usage.tokenBudgetUsed += amount;
        break;
      case 'toolGenerations':
        usage.toolGenerations += amount;
        break;
      case 'federationPeers':
        usage.federationPeers += amount;
        break;
      // 'users' is computed live from member store
    }

    usage.checkedAt = new Date();
    this.usageStore.set(orgId, usage);
  }

  /** Clear usage data for an org (useful for testing or period resets). */
  resetUsage(orgId: string): void {
    this.usageStore.delete(orgId);
  }
}

// ---------------------------------------------------------------------------
// Singleton manager instance
// ---------------------------------------------------------------------------

export const quotaManager = new QuotaManager();
