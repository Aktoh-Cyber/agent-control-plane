/**
 * Federated AgentDB - Main exports
 *
 * Provides secure federated memory for ephemeral agents with:
 * - QUIC-based synchronization
 * - Zero-trust security (mTLS + JWT + AES-256)
 * - Tenant isolation
 * - Vector clock conflict resolution
 */

export { EphemeralAgent, type AgentContext, type EphemeralAgentConfig } from './EphemeralAgent.js';
export { FederationHub, type FederationHubConfig, type SyncMessage } from './FederationHub.js';
export { SecurityManager, type AgentTokenPayload, type EncryptionKeys } from './SecurityManager.js';
