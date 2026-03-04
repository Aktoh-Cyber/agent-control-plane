/**
 * Federation Module
 *
 * Provides:
 * - Secure federated memory for ephemeral agents (QUIC, mTLS, AES-256)
 * - Multi-org hierarchy with tiered settings
 * - Quota enforcement and usage tracking
 *
 * Usage:
 *   import { federationRouter, organizationStore, quotaManager } from './federation/index.js';
 *   app.use('/api/federation', authMiddleware, federationRouter());
 */

// Federated AgentDB
export { EphemeralAgent, type AgentContext, type EphemeralAgentConfig } from './EphemeralAgent.js';
export { FederationHub, type FederationHubConfig, type SyncMessage } from './FederationHub.js';
export { SecurityManager, type AgentTokenPayload, type EncryptionKeys } from './SecurityManager.js';

// Organization hierarchy
export { OrganizationStore, getDefaultSettings, organizationStore } from './organizations.js';
export type {
  OrgHierarchyNode,
  OrgMember,
  OrgRole,
  OrgSettings,
  OrgTier,
  Organization,
  Team,
} from './organizations.js';

// Quota management
export { QuotaManager, quotaManager } from './quotas.js';
export type { QuotaCheckResult, QuotaLimits, QuotaResource, QuotaUsage } from './quotas.js';

// Custom roles
export { CustomRoleStore, PERMISSIONS, customRoleStore } from './custom-roles.js';
export type { CreateRoleInput, CustomRole, Permission, UpdateRoleInput } from './custom-roles.js';

// API routes
export { roleRouter } from './role-routes.js';
export { federationRouter } from './routes.js';
