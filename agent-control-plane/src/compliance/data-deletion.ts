/**
 * Data Deletion Service -- GDPR Right to Erasure
 *
 * Provides complete purge of all org data across all stores.
 * Logs the deletion request itself before purging (required for audit).
 *
 * Uses a callback registration pattern so audit/governance modules can
 * register their own purge logic without introducing circular imports.
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeletionScope = 'org' | 'user';
export type DeletionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface DeletionRequest {
  id: string;
  scope: DeletionScope;
  orgId: string;
  /** Only populated when scope is 'user'. */
  userId?: string;
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  status: DeletionStatus;
  /** Counts of records deleted per store, e.g. { auditEvents: 42 }. */
  deletedCounts: Record<string, number>;
  error?: string;
}

/**
 * A callback that purges data for a given org (and optionally a specific
 * user) from a single data store. Returns the store name and count of
 * records removed.
 */
export type PurgeCallback = (
  orgId: string,
  userId?: string
) => Promise<{ count: number; store: string }>;

/**
 * A synchronous callback that counts records that would be affected by a
 * deletion without actually removing anything.
 */
export type PreviewCallback = (orgId: string, userId?: string) => { count: number; store: string };

/**
 * An optional hook invoked just before purge execution starts, used to
 * emit an audit event for the deletion request itself.
 */
export type PrePurgeHook = (request: DeletionRequest) => void;

// ---------------------------------------------------------------------------
// Deletion Service
// ---------------------------------------------------------------------------

export class DeletionService {
  /** Deletion request log -- preserved across purges. */
  private requests: DeletionRequest[] = [];

  /** Registered purge callbacks executed during deletion. */
  private purgeCallbacks: PurgeCallback[] = [];

  /** Registered preview callbacks for dry-run counts. */
  private previewCallbacks: PreviewCallback[] = [];

  /** Optional hook called before purge execution to log the request. */
  private prePurgeHook: PrePurgeHook | null = null;

  // -----------------------------------------------------------------------
  // Callback registration
  // -----------------------------------------------------------------------

  /** Register a callback that will be invoked during deletion execution. */
  registerPurgeCallback(cb: PurgeCallback): void {
    this.purgeCallbacks.push(cb);
  }

  /** Register a callback used to preview deletion counts (no mutation). */
  registerPreviewCallback(cb: PreviewCallback): void {
    this.previewCallbacks.push(cb);
  }

  /**
   * Set a hook that fires before purge execution begins. This is the
   * intended place to emit an audit event recording the deletion request
   * itself, ensuring that the audit trail contains the request even after
   * audit data is purged.
   */
  setPrePurgeHook(hook: PrePurgeHook): void {
    this.prePurgeHook = hook;
  }

  // -----------------------------------------------------------------------
  // Request lifecycle
  // -----------------------------------------------------------------------

  /**
   * Create a new deletion request. Does not execute the deletion -- that
   * must be triggered separately via `executeDeletion`.
   */
  requestDeletion(
    scope: DeletionScope,
    orgId: string,
    requestedBy: string,
    userId?: string
  ): DeletionRequest {
    if (scope === 'user' && !userId) {
      throw new Error('userId is required when scope is "user"');
    }

    const request: DeletionRequest = {
      id: randomUUID(),
      scope,
      orgId,
      userId: scope === 'user' ? userId : undefined,
      requestedBy,
      requestedAt: new Date(),
      status: 'pending',
      deletedCounts: {},
    };

    this.requests.push(request);
    return request;
  }

  /**
   * Execute a pending deletion request. Runs all registered purge
   * callbacks in sequence, recording per-store counts.
   *
   * Steps:
   *  1. Fire the pre-purge hook (e.g. emit audit event).
   *  2. Invoke each purge callback for the target org/user.
   *  3. Record deleted counts.
   *  4. Mark the request as completed or failed.
   */
  async executeDeletion(requestId: string): Promise<DeletionRequest> {
    const request = this.requests.find((r) => r.id === requestId);

    if (!request) {
      throw new Error(`Deletion request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(
        `Deletion request ${requestId} is not pending (current status: ${request.status})`
      );
    }

    request.status = 'in_progress';

    try {
      // Step 1: Fire pre-purge hook so the deletion itself is audited
      if (this.prePurgeHook) {
        this.prePurgeHook(request);
      }

      // Steps 2-3: Execute each registered purge callback
      for (const callback of this.purgeCallbacks) {
        const result = await callback(request.orgId, request.userId);
        request.deletedCounts[result.store] = result.count;
      }

      // Step 4: Mark completed
      request.status = 'completed';
      request.completedAt = new Date();
    } catch (err) {
      request.status = 'failed';
      request.error = err instanceof Error ? err.message : String(err);
    }

    return request;
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  /** Retrieve a single deletion request by id. */
  getDeletionRequest(requestId: string): DeletionRequest | undefined {
    return this.requests.find((r) => r.id === requestId);
  }

  /** List deletion requests, optionally filtered by orgId. */
  listDeletionRequests(orgId?: string): DeletionRequest[] {
    if (!orgId) {
      return [...this.requests];
    }
    return this.requests.filter((r) => r.orgId === orgId);
  }

  /**
   * Preview what would be deleted for an org (and optionally a user)
   * without performing any actual mutation. Returns per-store counts.
   */
  getDeletionSummary(orgId: string, userId?: string): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const callback of this.previewCallbacks) {
      const result = callback(orgId, userId);
      counts[result.store] = result.count;
    }

    return counts;
  }

  /** Clear all requests (useful for testing). */
  clear(): void {
    this.requests = [];
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const deletionService = new DeletionService();
