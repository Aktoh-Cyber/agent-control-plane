/**
 * Compliance Module
 *
 * Exports all compliance components for use by the ACP server.
 *
 * Usage:
 *   import { complianceRouter, deletionService, dataResidencyStore } from './compliance/index.js';
 *   app.use('/api/compliance', authMiddleware, complianceRouter());
 */

// Data deletion (GDPR right to erasure)
export { DeletionService, deletionService } from './data-deletion.js';
export type {
  DeletionRequest,
  DeletionScope,
  DeletionStatus,
  PrePurgeHook,
  PreviewCallback,
  PurgeCallback,
} from './data-deletion.js';

// Data residency configuration and store
export { DataResidencyStore, dataResidencyStore } from './data-residency.js';
export type {
  DataClassification,
  DataRegion,
  DataResidencyConfig,
  DataResidencyInput,
} from './data-residency.js';

// API routes
export { complianceRouter } from './routes.js';
