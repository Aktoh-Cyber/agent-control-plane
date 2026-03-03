/**
 * Action Queue for Human-in-the-Loop Approvals
 *
 * In-memory queue that holds pending agent actions awaiting human approval.
 * Each action has a configurable TTL (default 5 minutes) after which it is
 * automatically rejected with a timeout error.
 */

import { EventEmitter } from 'events';
import { createComponentLogger } from '../utils/logger.js';

const logger = createComponentLogger('action-queue');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingAction {
  actionId: string;
  description: string;
  tool: string;
  input: Record<string, unknown>;
  createdAt: number;
  ttlMs: number;
}

export type ActionResolution = { approved: true } | { approved: false; reason: string };

interface QueueEntry {
  action: PendingAction;
  resolve: (resolution: ActionResolution) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// ActionQueue
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class ActionQueue extends EventEmitter {
  private pending: Map<string, QueueEntry> = new Map();

  /**
   * Propose a new action that requires human approval.
   *
   * Returns a Promise that resolves when the action is approved or rejected,
   * or rejects if the TTL expires.
   */
  proposeAction(
    actionId: string,
    description: string,
    tool: string,
    input: Record<string, unknown>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<ActionResolution> {
    if (this.pending.has(actionId)) {
      return Promise.reject(new Error(`Action ${actionId} already pending`));
    }

    const action: PendingAction = {
      actionId,
      description,
      tool,
      input,
      createdAt: Date.now(),
      ttlMs,
    };

    return new Promise<ActionResolution>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(actionId);
        logger.warn('Action timed out', { actionId, ttlMs });
        resolve({ approved: false, reason: 'Action timed out' });
      }, ttlMs);

      this.pending.set(actionId, { action, resolve, timer });
      this.emit('action_proposed', action);

      logger.info('Action proposed', { actionId, tool, description });
    });
  }

  /**
   * Approve a pending action.
   * Returns true if the action was found and approved.
   */
  approveAction(actionId: string): boolean {
    const entry = this.pending.get(actionId);
    if (!entry) {
      logger.warn('Attempted to approve unknown action', { actionId });
      return false;
    }

    clearTimeout(entry.timer);
    this.pending.delete(actionId);
    entry.resolve({ approved: true });

    logger.info('Action approved', { actionId });
    this.emit('action_approved', actionId);
    return true;
  }

  /**
   * Reject a pending action with an optional reason.
   * Returns true if the action was found and rejected.
   */
  rejectAction(actionId: string, reason?: string): boolean {
    const entry = this.pending.get(actionId);
    if (!entry) {
      logger.warn('Attempted to reject unknown action', { actionId });
      return false;
    }

    clearTimeout(entry.timer);
    this.pending.delete(actionId);
    entry.resolve({ approved: false, reason: reason ?? 'Rejected by user' });

    logger.info('Action rejected', { actionId, reason });
    this.emit('action_rejected', actionId, reason);
    return true;
  }

  /**
   * Get a specific pending action by ID.
   */
  getAction(actionId: string): PendingAction | undefined {
    return this.pending.get(actionId)?.action;
  }

  /**
   * List all currently pending actions.
   */
  listPending(): PendingAction[] {
    return Array.from(this.pending.values()).map((e) => e.action);
  }

  /**
   * Number of actions currently pending.
   */
  get size(): number {
    return this.pending.size;
  }

  /**
   * Clear all pending actions (reject them).
   */
  clear(): void {
    for (const [actionId, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.resolve({ approved: false, reason: 'Queue cleared' });
      logger.debug('Cleared pending action', { actionId });
    }
    this.pending.clear();
  }
}
