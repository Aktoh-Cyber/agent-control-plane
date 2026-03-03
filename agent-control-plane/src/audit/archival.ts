/**
 * Audit Event Archival
 *
 * Handles archiving audit events to persistent storage.
 * Uses file-based storage in development and S3 in production.
 * Events are written in JSON Lines format for efficient streaming.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditEvent, AuditEventStore } from './audit-events.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArchivalConfig {
  enabled: boolean;
  s3Bucket?: string;
  s3Prefix?: string;
  localPath?: string;
  schedule: 'nightly' | 'hourly';
}

export interface ArchivalResult {
  path: string;
  count: number;
  archivedAt: Date;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Build archival configuration from environment variables.
 *
 * Environment variables:
 * - AUDIT_ARCHIVAL_ENABLED: 'true' to enable (default: 'false')
 * - AUDIT_ARCHIVAL_S3_BUCKET: S3 bucket name
 * - AUDIT_ARCHIVAL_S3_PREFIX: S3 key prefix (default: 'audit-logs/')
 * - AUDIT_ARCHIVAL_LOCAL_PATH: local directory for dev archival
 * - AUDIT_ARCHIVAL_SCHEDULE: 'nightly' or 'hourly' (default: 'nightly')
 */
export function getArchivalConfig(): ArchivalConfig {
  return {
    enabled: process.env.AUDIT_ARCHIVAL_ENABLED === 'true',
    s3Bucket: process.env.AUDIT_ARCHIVAL_S3_BUCKET,
    s3Prefix: process.env.AUDIT_ARCHIVAL_S3_PREFIX || 'audit-logs/',
    localPath: process.env.AUDIT_ARCHIVAL_LOCAL_PATH,
    schedule: (process.env.AUDIT_ARCHIVAL_SCHEDULE as 'nightly' | 'hourly') || 'nightly',
  };
}

// ---------------------------------------------------------------------------
// Archival functions
// ---------------------------------------------------------------------------

/**
 * Generate a timestamped file name for an archival batch.
 */
function generateArchivalFileName(): string {
  const now = new Date();
  const datePart = now.toISOString().replace(/[:.]/g, '-');
  return `audit-${datePart}.jsonl`;
}

/**
 * Convert audit events to JSON Lines format.
 * Each line is a self-contained JSON object.
 */
function toJsonLines(events: AuditEvent[]): string {
  return events
    .map((event) =>
      JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString(),
      })
    )
    .join('\n');
}

/**
 * Archive events to local filesystem.
 * Creates the target directory if it does not exist.
 */
function archiveToLocal(events: AuditEvent[], localPath: string): ArchivalResult {
  if (!existsSync(localPath)) {
    mkdirSync(localPath, { recursive: true });
  }

  const fileName = generateArchivalFileName();
  const filePath = join(localPath, fileName);
  const content = toJsonLines(events);

  writeFileSync(filePath, content, 'utf-8');

  return {
    path: filePath,
    count: events.length,
    archivedAt: new Date(),
  };
}

/**
 * Archive events to S3.
 * This is a placeholder that will use the AWS SDK in production.
 * For now, it writes to local filesystem as a fallback.
 */
async function archiveToS3(
  events: AuditEvent[],
  bucket: string,
  prefix: string
): Promise<ArchivalResult> {
  const fileName = generateArchivalFileName();
  const key = `${prefix}${fileName}`;
  const content = toJsonLines(events);

  // In production, this would use AWS SDK:
  // const s3 = new S3Client({});
  // await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content }));

  // For now, log intent and fall back to local
  console.log(`[audit-archival] Would upload to s3://${bucket}/${key} (${events.length} events)`);

  // Fallback: write to a local .s3-staging directory
  const stagingPath = join(process.cwd(), '.s3-staging', bucket, prefix);
  return archiveToLocal(events, stagingPath);
}

/**
 * Archive a batch of audit events to the configured storage backend.
 */
export async function archiveEvents(events: AuditEvent[]): Promise<ArchivalResult> {
  if (events.length === 0) {
    return { path: '', count: 0, archivedAt: new Date() };
  }

  const config = getArchivalConfig();

  if (config.s3Bucket) {
    return archiveToS3(events, config.s3Bucket, config.s3Prefix ?? 'audit-logs/');
  }

  const localPath = config.localPath || join(process.cwd(), 'data', 'audit-archive');
  return archiveToLocal(events, localPath);
}

/**
 * Run the archival process against the audit event store.
 *
 * Exports events older than the specified age (default 24 hours),
 * archives them, and removes them from the in-memory store.
 */
export async function runArchival(
  store: AuditEventStore,
  maxAgeMs: number = 24 * 60 * 60 * 1000
): Promise<ArchivalResult | null> {
  const config = getArchivalConfig();
  if (!config.enabled) {
    return null;
  }

  const cutoff = new Date(Date.now() - maxAgeMs);
  const allEvents = store.getAll();
  const eventsToArchive = allEvents.filter((e) => e.timestamp < cutoff);

  if (eventsToArchive.length === 0) {
    return null;
  }

  const result = await archiveEvents(eventsToArchive);

  // Remove archived events from the in-memory store
  store.removeWhere((e) => e.timestamp < cutoff);

  return result;
}
