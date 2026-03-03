/**
 * Usage Event Tracking
 *
 * Append-only in-memory event store for LLM usage events.
 * Capped at MAX_EVENTS to prevent unbounded memory growth.
 * DB backing will be added in a later phase.
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsageEvent {
  id: string;
  timestamp: Date;
  orgId: string;
  userId: string;
  agentId?: string;
  toolId?: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  status: 'success' | 'error';
}

export type UsageEventInput = Omit<UsageEvent, 'id' | 'timestamp'>;

export interface UsageSummary {
  totalCost: number;
  totalTokens: number;
  eventCount: number;
  byModel: Record<string, { cost: number; tokens: number; count: number }>;
}

// ---------------------------------------------------------------------------
// In-memory Event Store
// ---------------------------------------------------------------------------

const MAX_EVENTS = 10_000;

export class EventStore {
  private events: UsageEvent[] = [];

  /** Append a usage event. Oldest events are evicted when MAX_EVENTS is reached. */
  trackUsage(input: UsageEventInput): UsageEvent {
    const event: UsageEvent = {
      ...input,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.events.push(event);

    // Evict oldest when exceeding capacity
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(this.events.length - MAX_EVENTS);
    }

    return event;
  }

  /** Retrieve all usage events for an organisation, optionally filtered by date. */
  getUsageByOrg(orgId: string, since?: Date): UsageEvent[] {
    return this.events.filter((e) => {
      if (e.orgId !== orgId) return false;
      if (since && e.timestamp < since) return false;
      return true;
    });
  }

  /** Retrieve all usage events for a specific user, optionally filtered by date. */
  getUsageByUser(userId: string, since?: Date): UsageEvent[] {
    return this.events.filter((e) => {
      if (e.userId !== userId) return false;
      if (since && e.timestamp < since) return false;
      return true;
    });
  }

  /** Build a summary of usage for an organisation. */
  getUsageSummary(orgId: string, since?: Date): UsageSummary {
    const orgEvents = this.getUsageByOrg(orgId, since);

    let totalCost = 0;
    let totalTokens = 0;
    const byModel: Record<string, { cost: number; tokens: number; count: number }> = {};

    for (const event of orgEvents) {
      totalCost += event.costUsd;
      const eventTokens = event.inputTokens + event.outputTokens;
      totalTokens += eventTokens;

      if (!byModel[event.model]) {
        byModel[event.model] = { cost: 0, tokens: 0, count: 0 };
      }
      const entry = byModel[event.model]!;
      entry.cost += event.costUsd;
      entry.tokens += eventTokens;
      entry.count += 1;
    }

    return {
      totalCost,
      totalTokens,
      eventCount: orgEvents.length,
      byModel,
    };
  }

  /** Return total number of stored events (for diagnostics). */
  get size(): number {
    return this.events.length;
  }

  /** Clear all events (useful for testing). */
  clear(): void {
    this.events = [];
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const usageTracker = new EventStore();
