/**
 * Audit Event System
 *
 * Core audit event types, emitter, and in-memory append-only store.
 * Capped at MAX_EVENTS to prevent unbounded memory growth.
 * DB backing will be added in a later phase.
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditEventType =
  | 'tool_invocation'
  | 'tool_result'
  | 'llm_request'
  | 'llm_response'
  | 'agent_conversation'
  | 'agent_action'
  | 'deployment_action'
  | 'admin_action'
  | 'role_change'
  | 'config_change'
  | 'auth_login'
  | 'auth_logout'
  | 'auth_failed';

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  orgId: string;
  userId: string;
  agentId?: string;
  action: string;
  resource: string;
  detailsJson: Record<string, unknown>;
  ipAddress?: string;
  traceId?: string;
  sensitivityLevel?: SensitivityLevel;
}

/** Partial identity information used when emitting audit events. */
export interface AuditIdentity {
  sub: string;
  orgId: string;
  roles?: string[];
  ipAddress?: string;
}

export interface AuditEventFilters {
  orgId?: string;
  eventType?: AuditEventType;
  userId?: string;
  since?: Date;
  until?: Date;
  resource?: string;
  agentId?: string;
  limit?: number;
}

export interface AuditSummary {
  orgId: string;
  totalEvents: number;
  byEventType: Record<string, number>;
  since?: Date;
}

// ---------------------------------------------------------------------------
// In-memory Audit Event Store
// ---------------------------------------------------------------------------

const MAX_EVENTS = 50_000;

export class AuditEventStore {
  private events: AuditEvent[] = [];

  /** Append an audit event. Oldest events are evicted when MAX_EVENTS is reached. */
  append(event: AuditEvent): void {
    this.events.push(event);

    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(this.events.length - MAX_EVENTS);
    }
  }

  /** Query events with optional filters. */
  query(filters: AuditEventFilters): AuditEvent[] {
    let results = this.events;

    if (filters.orgId) {
      results = results.filter((e) => e.orgId === filters.orgId);
    }
    if (filters.eventType) {
      results = results.filter((e) => e.eventType === filters.eventType);
    }
    if (filters.userId) {
      results = results.filter((e) => e.userId === filters.userId);
    }
    if (filters.since) {
      const since = filters.since;
      results = results.filter((e) => e.timestamp >= since);
    }
    if (filters.until) {
      const until = filters.until;
      results = results.filter((e) => e.timestamp <= until);
    }
    if (filters.resource) {
      const resource = filters.resource;
      results = results.filter((e) => e.resource === resource);
    }
    if (filters.agentId) {
      const agentId = filters.agentId;
      results = results.filter((e) => e.agentId === agentId);
    }
    if (filters.limit && filters.limit > 0) {
      results = results.slice(-filters.limit);
    }

    return results;
  }

  /** Build a summary of audit events grouped by event type. */
  getSummary(orgId: string, since?: Date): AuditSummary {
    const orgEvents = this.events.filter((e) => {
      if (e.orgId !== orgId) return false;
      if (since && e.timestamp < since) return false;
      return true;
    });

    const byEventType: Record<string, number> = {};
    for (const event of orgEvents) {
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
    }

    return {
      orgId,
      totalEvents: orgEvents.length,
      byEventType,
      since,
    };
  }

  /** Return all events (used by archival and retention). */
  getAll(): AuditEvent[] {
    return [...this.events];
  }

  /** Remove events by predicate. Returns count of removed events. */
  removeWhere(predicate: (event: AuditEvent) => boolean): number {
    const before = this.events.length;
    this.events = this.events.filter((e) => !predicate(e));
    return before - this.events.length;
  }

  /** Return total number of stored events. */
  get size(): number {
    return this.events.length;
  }

  /** Clear all events (useful for testing). */
  clear(): void {
    this.events = [];
  }
}

// ---------------------------------------------------------------------------
// Core emitter
// ---------------------------------------------------------------------------

/** Listeners registered for audit event emission. */
type AuditListener = (event: AuditEvent) => void;

const listeners: AuditListener[] = [];

/**
 * Register a listener that will be called for every emitted audit event.
 * Returns an unsubscribe function.
 */
export function onAuditEvent(listener: AuditListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Emit an audit event.
 *
 * Creates a fully-formed AuditEvent, appends it to the store, and notifies
 * all registered listeners (e.g. SIEM webhook forwarder).
 */
export function emitAuditEvent(
  type: AuditEventType,
  details: {
    action: string;
    resource: string;
    agentId?: string;
    detailsJson?: Record<string, unknown>;
    sensitivityLevel?: SensitivityLevel;
    traceId?: string;
  },
  identity?: AuditIdentity
): AuditEvent {
  const event: AuditEvent = {
    id: randomUUID(),
    timestamp: new Date(),
    eventType: type,
    orgId: identity?.orgId ?? 'system',
    userId: identity?.sub ?? 'system',
    agentId: details.agentId,
    action: details.action,
    resource: details.resource,
    detailsJson: details.detailsJson ?? {},
    ipAddress: identity?.ipAddress,
    traceId: details.traceId,
    sensitivityLevel: details.sensitivityLevel,
  };

  auditEventStore.append(event);

  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Swallow listener errors to avoid disrupting the emitter
    }
  }

  return event;
}

// ---------------------------------------------------------------------------
// Convenience query functions
// ---------------------------------------------------------------------------

/** Query audit events from the singleton store. */
export function queryAuditEvents(filters: AuditEventFilters): AuditEvent[] {
  return auditEventStore.query(filters);
}

/** Get an audit summary for an organisation. */
export function getAuditSummary(orgId: string, since?: Date): AuditSummary {
  return auditEventStore.getSummary(orgId, since);
}

// ---------------------------------------------------------------------------
// Singleton store instance
// ---------------------------------------------------------------------------

export const auditEventStore = new AuditEventStore();
