/**
 * Audit Event Retention Policies
 *
 * Per-org retention policies that control how long audit events are kept
 * in the in-memory store. Default retention periods are based on
 * subscription tier.
 */

import type { AuditEventStore } from './audit-events.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetentionPolicy {
  orgId: string;
  retentionDays: number;
}

export interface RetentionResult {
  orgId: string;
  removedCount: number;
  retentionDays: number;
  enforcedAt: Date;
}

// ---------------------------------------------------------------------------
// Default retention by tier
// ---------------------------------------------------------------------------

export const DEFAULT_RETENTION: Record<string, number> = {
  free: 7,
  pro: 90,
  enterprise: 365,
};

// ---------------------------------------------------------------------------
// Retention Manager
// ---------------------------------------------------------------------------

export class RetentionManager {
  private policies: Map<string, RetentionPolicy> = new Map();
  /** Maps orgId to tier for default retention lookup. */
  private orgTiers: Map<string, string> = new Map();

  /**
   * Get the retention policy for an organisation.
   * Falls back to default based on tier, or 'free' if no tier is set.
   */
  getRetentionPolicy(orgId: string): RetentionPolicy {
    const custom = this.policies.get(orgId);
    if (custom) return custom;

    const tier = this.orgTiers.get(orgId) || 'free';
    const days = DEFAULT_RETENTION[tier] ?? DEFAULT_RETENTION['free']!;
    return { orgId, retentionDays: days };
  }

  /**
   * Set a custom retention policy for an organisation.
   * Minimum retention is 1 day.
   */
  setRetentionPolicy(orgId: string, retentionDays: number): RetentionPolicy {
    const days = Math.max(1, Math.floor(retentionDays));
    const policy: RetentionPolicy = { orgId, retentionDays: days };
    this.policies.set(orgId, policy);
    return policy;
  }

  /** Remove a custom retention policy, reverting to tier default. */
  removeRetentionPolicy(orgId: string): boolean {
    return this.policies.delete(orgId);
  }

  /**
   * Set the tier for an organisation. Used to determine default retention
   * when no custom policy is configured.
   */
  setOrgTier(orgId: string, tier: string): void {
    this.orgTiers.set(orgId, tier);
  }

  /**
   * Enforce retention for a specific organisation.
   * Removes events older than the retention period from the store.
   */
  enforceRetention(store: AuditEventStore, orgId: string): RetentionResult {
    const policy = this.getRetentionPolicy(orgId);
    const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);

    const removedCount = store.removeWhere((e) => e.orgId === orgId && e.timestamp < cutoff);

    return {
      orgId,
      removedCount,
      retentionDays: policy.retentionDays,
      enforcedAt: new Date(),
    };
  }

  /**
   * Enforce retention for all organisations that have stored events.
   * Scans the store to find distinct orgIds and applies each org's policy.
   */
  enforceAllRetention(store: AuditEventStore): RetentionResult[] {
    // Collect distinct orgIds from the store
    const orgIds = new Set<string>();
    for (const event of store.getAll()) {
      orgIds.add(event.orgId);
    }

    const results: RetentionResult[] = [];
    for (const orgId of orgIds) {
      results.push(this.enforceRetention(store, orgId));
    }

    return results;
  }

  /** List all custom retention policies. */
  listPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const retentionManager = new RetentionManager();
