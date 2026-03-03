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

// API routes
export { governanceRouter } from './routes.js';
