/**
 * Usage Event Tracking
 *
 * SQLite-backed event store for LLM usage events.
 * Persists events to disk so data survives restarts.
 * Falls back to in-memory SQLite if no path is provided.
 */

import Database from 'better-sqlite3';
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
// SQLite-backed Event Store
// ---------------------------------------------------------------------------

export class EventStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    this.db = new Database(dbPath || ':memory:');
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        org_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        agent_id TEXT,
        tool_id TEXT,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost_usd REAL NOT NULL,
        latency_ms INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('success', 'error'))
      );

      CREATE INDEX IF NOT EXISTS idx_usage_org ON usage_events(org_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_events(user_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_events(org_id, model);
    `);
  }

  /** Append a usage event. Persisted to SQLite immediately. */
  trackUsage(input: UsageEventInput): UsageEvent {
    const event: UsageEvent = {
      ...input,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.db
      .prepare(
        `
      INSERT INTO usage_events (id, timestamp, org_id, user_id, agent_id, tool_id, model, provider, input_tokens, output_tokens, cost_usd, latency_ms, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        event.id,
        event.timestamp.getTime(),
        event.orgId,
        event.userId,
        event.agentId || null,
        event.toolId || null,
        event.model,
        event.provider,
        event.inputTokens,
        event.outputTokens,
        event.costUsd,
        event.latencyMs,
        event.status
      );

    return event;
  }

  /** Retrieve all usage events for an organisation, optionally filtered by date. */
  getUsageByOrg(orgId: string, since?: Date): UsageEvent[] {
    const sinceTs = since ? since.getTime() : 0;
    const rows = this.db
      .prepare(
        `
      SELECT * FROM usage_events
      WHERE org_id = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `
      )
      .all(orgId, sinceTs) as any[];

    return rows.map(this.rowToEvent);
  }

  /** Retrieve all usage events for a specific user, optionally filtered by date. */
  getUsageByUser(userId: string, since?: Date): UsageEvent[] {
    const sinceTs = since ? since.getTime() : 0;
    const rows = this.db
      .prepare(
        `
      SELECT * FROM usage_events
      WHERE user_id = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `
      )
      .all(userId, sinceTs) as any[];

    return rows.map(this.rowToEvent);
  }

  /** Build a summary of usage for an organisation. */
  getUsageSummary(orgId: string, since?: Date): UsageSummary {
    const sinceTs = since ? since.getTime() : 0;

    // Aggregate query for totals
    const totals = this.db
      .prepare(
        `
      SELECT
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
        COUNT(*) as event_count
      FROM usage_events
      WHERE org_id = ? AND timestamp >= ?
    `
      )
      .get(orgId, sinceTs) as any;

    // Per-model breakdown
    const modelRows = this.db
      .prepare(
        `
      SELECT
        model,
        SUM(cost_usd) as cost,
        SUM(input_tokens + output_tokens) as tokens,
        COUNT(*) as count
      FROM usage_events
      WHERE org_id = ? AND timestamp >= ?
      GROUP BY model
    `
      )
      .all(orgId, sinceTs) as any[];

    const byModel: Record<string, { cost: number; tokens: number; count: number }> = {};
    for (const row of modelRows) {
      byModel[row.model] = {
        cost: row.cost,
        tokens: row.tokens,
        count: row.count,
      };
    }

    return {
      totalCost: totals.total_cost,
      totalTokens: totals.total_tokens,
      eventCount: totals.event_count,
      byModel,
    };
  }

  /** Return total number of stored events (for diagnostics). */
  get size(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM usage_events').get() as any;
    return row.count;
  }

  /** Clear all events (useful for testing). */
  clear(): void {
    this.db.exec('DELETE FROM usage_events');
  }

  /** Close the database connection. */
  close(): void {
    this.db.close();
  }

  /** Convert a database row to a UsageEvent. */
  private rowToEvent(row: any): UsageEvent {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      orgId: row.org_id,
      userId: row.user_id,
      agentId: row.agent_id || undefined,
      toolId: row.tool_id || undefined,
      model: row.model,
      provider: row.provider,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      costUsd: row.cost_usd,
      latencyMs: row.latency_ms,
      status: row.status,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton instance — uses file-backed DB in production, in-memory for tests
// ---------------------------------------------------------------------------

const DB_PATH = process.env.USAGE_TRACKER_DB_PATH || undefined;
export const usageTracker = new EventStore(DB_PATH);
