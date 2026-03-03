/**
 * SIEM Webhook Integration
 *
 * Per-org configurable webhook for forwarding audit events to external
 * SIEM systems (Splunk, Datadog, Elastic, etc.).
 *
 * Events are buffered and batch-sent to reduce HTTP overhead.
 * Auto-flushes every 60 seconds or when the batch buffer is full.
 */

import type { AuditEvent, AuditEventType } from './audit-events.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SIEMWebhookConfig {
  orgId: string;
  url: string;
  authHeader?: string;
  eventTypes?: AuditEventType[];
  batchSize: number;
  enabled: boolean;
}

export interface SIEMWebhookStatus {
  orgId: string;
  bufferedCount: number;
  totalSent: number;
  totalErrors: number;
  lastSentAt: Date | null;
  lastError: string | null;
}

// ---------------------------------------------------------------------------
// Webhook Manager
// ---------------------------------------------------------------------------

const DEFAULT_BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 60_000;

export class SIEMWebhookManager {
  private configs: Map<string, SIEMWebhookConfig> = new Map();
  private buffers: Map<string, AuditEvent[]> = new Map();
  private stats: Map<
    string,
    { totalSent: number; totalErrors: number; lastSentAt: Date | null; lastError: string | null }
  > = new Map();
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startAutoFlush();
  }

  // -----------------------------------------------------------------------
  // Configuration
  // -----------------------------------------------------------------------

  /** Configure a SIEM webhook for an organisation. */
  setConfig(config: SIEMWebhookConfig): void {
    this.configs.set(config.orgId, {
      ...config,
      batchSize: config.batchSize || DEFAULT_BATCH_SIZE,
    });
    if (!this.buffers.has(config.orgId)) {
      this.buffers.set(config.orgId, []);
    }
    if (!this.stats.has(config.orgId)) {
      this.stats.set(config.orgId, {
        totalSent: 0,
        totalErrors: 0,
        lastSentAt: null,
        lastError: null,
      });
    }
  }

  /** Get the webhook configuration for an organisation. */
  getConfig(orgId: string): SIEMWebhookConfig | undefined {
    return this.configs.get(orgId);
  }

  /** Remove the webhook configuration for an organisation. */
  removeConfig(orgId: string): boolean {
    this.buffers.delete(orgId);
    this.stats.delete(orgId);
    return this.configs.delete(orgId);
  }

  // -----------------------------------------------------------------------
  // Event forwarding
  // -----------------------------------------------------------------------

  /**
   * Forward an audit event to the relevant org's SIEM webhook.
   * The event is buffered and sent when the batch is full or on auto-flush.
   */
  forward(event: AuditEvent): void {
    const config = this.configs.get(event.orgId);
    if (!config || !config.enabled) return;

    // Apply event type filter if configured
    if (config.eventTypes && config.eventTypes.length > 0) {
      if (!config.eventTypes.includes(event.eventType)) return;
    }

    const buffer = this.buffers.get(event.orgId) ?? [];
    buffer.push(event);
    this.buffers.set(event.orgId, buffer);

    // Auto-flush when buffer reaches batch size
    if (buffer.length >= config.batchSize) {
      void this.flush(event.orgId);
    }
  }

  /**
   * Force-send all buffered events for an organisation.
   */
  async flush(orgId: string): Promise<void> {
    const config = this.configs.get(orgId);
    const buffer = this.buffers.get(orgId);

    if (!config || !buffer || buffer.length === 0) return;

    // Take the current buffer and clear it
    const events = [...buffer];
    this.buffers.set(orgId, []);

    const stat = this.stats.get(orgId) ?? {
      totalSent: 0,
      totalErrors: 0,
      lastSentAt: null,
      lastError: null,
    };

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authHeader ? { Authorization: config.authHeader } : {}),
        },
        body: JSON.stringify({
          source: 'horsemen-acp',
          orgId,
          events: events.map((e) => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
          })),
          sentAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown');
        stat.totalErrors += 1;
        stat.lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
        // Put events back in the buffer for retry
        const currentBuffer = this.buffers.get(orgId) ?? [];
        this.buffers.set(orgId, [...events, ...currentBuffer]);
      } else {
        stat.totalSent += events.length;
        stat.lastSentAt = new Date();
        stat.lastError = null;
      }
    } catch (error) {
      stat.totalErrors += 1;
      stat.lastError = error instanceof Error ? error.message : String(error);
      // Put events back in the buffer for retry
      const currentBuffer = this.buffers.get(orgId) ?? [];
      this.buffers.set(orgId, [...events, ...currentBuffer]);
    }

    this.stats.set(orgId, stat);
  }

  /**
   * Flush all organisations' buffers.
   */
  async flushAll(): Promise<void> {
    const orgIds = Array.from(this.buffers.keys());
    await Promise.all(orgIds.map((orgId) => this.flush(orgId)));
  }

  // -----------------------------------------------------------------------
  // Status
  // -----------------------------------------------------------------------

  /** Get the status of the webhook for an organisation. */
  getStatus(orgId: string): SIEMWebhookStatus | undefined {
    const stat = this.stats.get(orgId);
    const buffer = this.buffers.get(orgId);
    if (!stat) return undefined;

    return {
      orgId,
      bufferedCount: buffer?.length ?? 0,
      ...stat,
    };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Start the auto-flush timer. */
  private startAutoFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      void this.flushAll();
    }, FLUSH_INTERVAL_MS);

    // Allow the process to exit even if the timer is running
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  /** Stop the auto-flush timer and flush remaining events. */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushAll();
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const siemWebhookManager = new SIEMWebhookManager();
