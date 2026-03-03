/**
 * Governance Module
 *
 * Exports all governance components for use by the ACP server.
 *
 * Usage:
 *   import { governanceMiddleware, governanceRouter, usageTracker } from './governance/index.js';
 *   app.use('/api/governance', authMiddleware, governanceRouter());
 *   app.use('/api/llm', authMiddleware, governanceMiddleware(), llmRouter);
 */

// Model policies
export {
  DEFAULT_POLICIES,
  PolicyStore,
  getPolicyForRequest,
  policyStore,
  resolveTier,
  sensitivityAllowed,
} from './model-policies.js';
export type {
  DefaultTierPolicies,
  ModelPolicy,
  PolicyInput,
  SensitivityLevel,
} from './model-policies.js';

// Governance middleware
export { estimateCost, governanceMiddleware } from './governance-middleware.js';
export type { GovernedRequest, HorsemenIdentity } from './governance-middleware.js';

// Usage tracking
export { EventStore, usageTracker } from './usage-tracker.js';
export type { UsageEvent, UsageEventInput, UsageSummary } from './usage-tracker.js';

// Budget enforcement
export { BudgetStore, DEFAULT_BUDGETS, budgetManager } from './budget-manager.js';
export type {
  Budget,
  BudgetAlertCallback,
  BudgetCheckResult,
  BudgetInput,
  BudgetPeriod,
} from './budget-manager.js';

// LiteLLM admin client
export { LiteLLMAdminClient, LiteLLMError, litellmAdmin } from './litellm-admin.js';
export type { ILiteLLMAdminClient, VirtualKey, VirtualKeyConfig } from './litellm-admin.js';
// Re-export UsageSummary from litellm-admin under a distinct alias to avoid
// colliding with the identically-named type from usage-tracker.
export type { UsageSummary as LiteLLMUsageSummary } from './litellm-admin.js';

// Sensitivity-based routing
export { SensitivityRouter, sensitivityRouter } from './sensitivity-router.js';
export type {
  ISensitivityRouter,
  Provider,
  ProviderLocality,
  RoutingConstraints,
} from './sensitivity-router.js';

// Routing priority
export { DEFAULT_WEIGHTS, RoutingPriorityStore, routingPriorityStore } from './routing-priority.js';
export type { RoutingPriority, RoutingPriorityInput, RoutingWeights } from './routing-priority.js';

// Provider registry
export {
  DirectAnthropicProvider,
  DirectGoogleProvider,
  DirectOpenAIProvider,
  LiteLLMProvider,
  LocalProvider,
  OpenRouterProvider,
  ProviderRegistry,
  providerRegistry,
} from './provider-registry.js';
export type {
  IModelProvider,
  LLMMessage,
  LLMRequest,
  LLMResponse,
  OrgProviderConfig,
  ProviderType,
} from './provider-registry.js';

// API routes
export { governanceRouter } from './routes.js';
