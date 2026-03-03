/**
 * Routing Priority Configuration
 *
 * Per-org and per-user routing preferences with weighted scoring.
 * Supports CRUD operations and effective-priority resolution
 * (user prefs override org defaults via merge).
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoutingWeights {
  /** Weight for cost optimization (0-1). */
  cost: number;
  /** Weight for quality/accuracy (0-1). */
  quality: number;
  /** Weight for low latency (0-1). */
  latency: number;
  /** Weight for privacy/data locality (0-1). */
  privacy: number;
}

export interface RoutingPriority {
  id: string;
  orgId: string;
  /** When null, this is the org-wide default. */
  userId: string | null;
  weights: RoutingWeights;
  preferredProviders?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RoutingPriorityInput = Omit<RoutingPriority, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Default weights
// ---------------------------------------------------------------------------

export const DEFAULT_WEIGHTS: RoutingWeights = {
  cost: 0.3,
  quality: 0.4,
  latency: 0.2,
  privacy: 0.1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityKey(orgId: string, userId: string | null): string {
  return userId ? `${orgId}::${userId}` : orgId;
}

function clampWeight(value: unknown): number {
  const n = Number(value);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normaliseWeights(w: Partial<RoutingWeights>): RoutingWeights {
  return {
    cost: clampWeight(w.cost ?? DEFAULT_WEIGHTS.cost),
    quality: clampWeight(w.quality ?? DEFAULT_WEIGHTS.quality),
    latency: clampWeight(w.latency ?? DEFAULT_WEIGHTS.latency),
    privacy: clampWeight(w.privacy ?? DEFAULT_WEIGHTS.privacy),
  };
}

// ---------------------------------------------------------------------------
// In-memory Store
// ---------------------------------------------------------------------------

export class RoutingPriorityStore {
  private priorities: Map<string, RoutingPriority> = new Map();

  /** Create or replace a routing priority entry. */
  set(input: RoutingPriorityInput): RoutingPriority {
    const key = priorityKey(input.orgId, input.userId);
    const existing = this.priorities.get(key);
    const now = new Date();

    const entry: RoutingPriority = {
      id: existing?.id ?? uuidv4(),
      orgId: input.orgId,
      userId: input.userId,
      weights: normaliseWeights(input.weights),
      preferredProviders: input.preferredProviders,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.priorities.set(key, entry);
    return entry;
  }

  /** Get a specific priority entry. */
  get(orgId: string, userId?: string | null): RoutingPriority | undefined {
    if (userId) {
      const userEntry = this.priorities.get(priorityKey(orgId, userId));
      if (userEntry) return userEntry;
    }
    return this.priorities.get(priorityKey(orgId, null));
  }

  /** Delete a priority entry. */
  delete(orgId: string, userId?: string | null): boolean {
    return this.priorities.delete(priorityKey(orgId, userId ?? null));
  }

  /** List all priority entries for an org. */
  listByOrg(orgId: string): RoutingPriority[] {
    const result: RoutingPriority[] = [];
    for (const entry of this.priorities.values()) {
      if (entry.orgId === orgId) {
        result.push(entry);
      }
    }
    return result;
  }

  /**
   * Resolve the effective routing priority for a user within an org.
   *
   * Strategy: if a user-specific entry exists, its weights override the
   * org-wide defaults. Preferred providers are merged (user first, then org).
   */
  getEffectivePriority(orgId: string, userId?: string | null): RoutingPriority {
    const orgEntry = this.priorities.get(priorityKey(orgId, null));
    const userEntry = userId ? this.priorities.get(priorityKey(orgId, userId)) : undefined;

    // Neither exists -- return sensible defaults
    if (!orgEntry && !userEntry) {
      return {
        id: 'default',
        orgId,
        userId: userId ?? null,
        weights: { ...DEFAULT_WEIGHTS },
        preferredProviders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Only one exists
    if (!userEntry) return orgEntry!;
    if (!orgEntry) return userEntry;

    // Merge: user weights override; preferred providers are merged
    const mergedProviders = Array.from(
      new Set([...(userEntry.preferredProviders ?? []), ...(orgEntry.preferredProviders ?? [])])
    );

    return {
      id: userEntry.id,
      orgId,
      userId: userId ?? null,
      weights: { ...userEntry.weights },
      preferredProviders: mergedProviders.length > 0 ? mergedProviders : undefined,
      createdAt: userEntry.createdAt,
      updatedAt: userEntry.updatedAt,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const routingPriorityStore = new RoutingPriorityStore();
