/**
 * EventBridge Publisher for Audit Events
 *
 * Registers as an audit event listener and publishes events to AWS EventBridge.
 * This bridges the existing in-memory audit system to the event streaming pipeline.
 */

import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { AuditEvent } from './audit-events.js';
import { onAuditEvent } from './audit-events.js';

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'horsemen-events';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const PUBLISH_ENABLED = process.env.EVENTBRIDGE_ENABLED === 'true';

let ebClient: EventBridgeClient | null = null;

function getClient(): EventBridgeClient {
  if (!ebClient) {
    ebClient = new EventBridgeClient({ region: AWS_REGION });
  }
  return ebClient;
}

/**
 * Convert an AuditEvent to the EventBridge event envelope format.
 */
function toEventEnvelope(event: AuditEvent) {
  return {
    id: event.id,
    version: '1.0' as const,
    source: 'acp',
    type: 'audit.event.created',
    timestamp: event.timestamp.toISOString(),
    orgId: event.orgId,
    correlationId: event.traceId,
    data: {
      eventType: event.eventType,
      userId: event.userId,
      agentId: event.agentId,
      action: event.action,
      resource: event.resource,
      detailsJson: event.detailsJson,
      ipAddress: event.ipAddress,
      traceId: event.traceId,
      sensitivityLevel: event.sensitivityLevel,
    },
  };
}

/**
 * Publish an audit event to EventBridge.
 * Non-blocking -- errors are logged but don't propagate.
 */
async function publishAuditEvent(event: AuditEvent): Promise<void> {
  if (!PUBLISH_ENABLED) return;

  const envelope = toEventEnvelope(event);

  try {
    const client = getClient();
    await client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: EVENT_BUS_NAME,
            Source: `horsemen.${envelope.source}`,
            DetailType: envelope.type,
            Time: new Date(envelope.timestamp),
            Detail: JSON.stringify(envelope),
          },
        ],
      })
    );
  } catch (err) {
    // Log but don't throw -- audit event was already stored in-memory
    console.error('[EventBridge] Failed to publish audit event:', event.id, err);
  }
}

/**
 * Initialize the EventBridge publisher.
 * Call this once at application startup.
 * Returns an unsubscribe function.
 */
export function initEventBridgePublisher(): () => void {
  if (!PUBLISH_ENABLED) {
    console.log('[EventBridge] Publisher disabled (EVENTBRIDGE_ENABLED != true)');
    return () => {};
  }

  console.log('[EventBridge] Publisher initialized, bus:', EVENT_BUS_NAME);
  return onAuditEvent((event) => {
    // Fire and forget -- don't await in the listener
    publishAuditEvent(event).catch(() => {});
  });
}
