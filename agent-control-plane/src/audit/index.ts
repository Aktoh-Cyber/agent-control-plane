/**
 * Audit Module
 *
 * Exports all audit components for use by the ACP server.
 *
 * Usage:
 *   import { auditMiddleware, auditRouter, auditEventStore } from './audit/index.js';
 *   app.use(auditMiddleware());
 *   app.use('/api/audit', authMiddleware, auditRouter());
 */

// Audit event types and store
export {
  AuditEventStore,
  auditEventStore,
  emitAuditEvent,
  getAuditSummary,
  onAuditEvent,
  queryAuditEvents,
} from './audit-events.js';
export type {
  AuditEvent,
  AuditEventFilters,
  AuditEventType,
  AuditIdentity,
  AuditSummary,
  SensitivityLevel,
} from './audit-events.js';

// Instrumentation middleware and helpers
export {
  auditAdminAction,
  auditAgentConversation,
  auditAuthEvent,
  auditDeploymentAction,
  auditLLMCall,
  auditMiddleware,
  auditToolInvocation,
} from './instrumentation.js';

// Archival
export { archiveEvents, getArchivalConfig, runArchival } from './archival.js';
export type { ArchivalConfig, ArchivalResult } from './archival.js';

// SIEM webhook
export { SIEMWebhookManager, siemWebhookManager } from './siem-webhook.js';
export type { SIEMWebhookConfig, SIEMWebhookStatus } from './siem-webhook.js';

// Retention
export { DEFAULT_RETENTION, RetentionManager, retentionManager } from './retention.js';
export type { RetentionPolicy, RetentionResult } from './retention.js';

// API routes
export { auditRouter } from './routes.js';

// EventBridge publisher
export { initEventBridgePublisher } from './eventbridge-publisher.js';
