/**
 * Model Governance Policies
 *
 * Defines model access policies per org/role and enforces allowlists.
 * In-memory PolicyStore with CRUD operations; DB backing comes later.
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface ModelPolicy {
  id: string;
  orgId: string;
  /** When set, this policy applies only to identities holding this role. */
  role?: string;
  /** Models explicitly allowed. Use ['*'] to allow everything. */
  allowedModels: string[];
  /** Models explicitly denied (takes precedence over allowedModels). */
  deniedModels: string[];
  /** Maximum estimated cost (USD) for a single LLM request. */
  maxCostPerRequest: number;
  /** Data classification level this policy permits. */
  sensitivityLevel: SensitivityLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface DefaultTierPolicies {
  free: ModelPolicy;
  pro: ModelPolicy;
  enterprise: ModelPolicy;
}

/** Input accepted when creating or updating a policy. */
export type PolicyInput = Omit<ModelPolicy, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Default allowlists by subscription tier
// ---------------------------------------------------------------------------

export const DEFAULT_POLICIES: Record<string, Partial<ModelPolicy>> = {
  free: {
    allowedModels: ['@cf/meta/llama-3.1-8b-instruct', 'claude-3.5-haiku'],
    deniedModels: [],
    maxCostPerRequest: 0.01,
    sensitivityLevel: 'public',
  },
  pro: {
    allowedModels: ['claude-3.5-sonnet', 'claude-3.5-haiku', 'gpt-4o-mini', 'gpt-4o'],
    deniedModels: [],
    maxCostPerRequest: 0.1,
    sensitivityLevel: 'internal',
  },
  enterprise: {
    allowedModels: ['*'],
    deniedModels: [],
    maxCostPerRequest: 1.0,
    sensitivityLevel: 'restricted',
  },
};

// ---------------------------------------------------------------------------
// Sensitivity ordering (higher index = more restricted)
// ---------------------------------------------------------------------------

const SENSITIVITY_ORDER: SensitivityLevel[] = ['public', 'internal', 'confidential', 'restricted'];

export function sensitivityAllowed(
  policyLevel: SensitivityLevel,
  requestedLevel: SensitivityLevel
): boolean {
  return SENSITIVITY_ORDER.indexOf(requestedLevel) <= SENSITIVITY_ORDER.indexOf(policyLevel);
}

// ---------------------------------------------------------------------------
// In-memory Policy Store
// ---------------------------------------------------------------------------

export class PolicyStore {
  private policies: Map<string, ModelPolicy> = new Map();

  /** Create a new policy. Returns the created policy with generated id. */
  create(input: PolicyInput): ModelPolicy {
    const now = new Date();
    const policy: ModelPolicy = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.policies.set(policy.id, policy);
    return policy;
  }

  /** Retrieve a policy by id. */
  get(id: string): ModelPolicy | undefined {
    return this.policies.get(id);
  }

  /** Update an existing policy. Returns the updated policy or undefined. */
  update(id: string, changes: Partial<PolicyInput>): ModelPolicy | undefined {
    const existing = this.policies.get(id);
    if (!existing) return undefined;

    const updated: ModelPolicy = {
      ...existing,
      ...changes,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.policies.set(id, updated);
    return updated;
  }

  /** Delete a policy. Returns true if the policy existed. */
  delete(id: string): boolean {
    return this.policies.delete(id);
  }

  /** List all policies for a given orgId. */
  listByOrg(orgId: string): ModelPolicy[] {
    const result: ModelPolicy[] = [];
    for (const policy of this.policies.values()) {
      if (policy.orgId === orgId) {
        result.push(policy);
      }
    }
    return result;
  }

  /** List every policy in the store (admin use). */
  listAll(): ModelPolicy[] {
    return Array.from(this.policies.values());
  }
}

// ---------------------------------------------------------------------------
// Policy resolution
// ---------------------------------------------------------------------------

/**
 * Determine the effective tier for a set of roles.
 * Highest-privilege tier wins: enterprise > pro > free.
 */
export function resolveTier(roles: string[]): 'free' | 'pro' | 'enterprise' {
  if (roles.includes('enterprise') || roles.includes('super-admin')) return 'enterprise';
  if (roles.includes('pro') || roles.includes('admin') || roles.includes('org-admin')) return 'pro';
  return 'free';
}

/**
 * Merge an org-specific policy with role-specific overrides.
 * Role policies narrow the org policy -- intersection of allowed models,
 * union of denied models, and the stricter cost/sensitivity.
 */
function mergePolicies(orgPolicy: ModelPolicy, rolePolicy: ModelPolicy): ModelPolicy {
  const allowedModels = orgPolicy.allowedModels.includes('*')
    ? rolePolicy.allowedModels
    : rolePolicy.allowedModels.includes('*')
      ? orgPolicy.allowedModels
      : orgPolicy.allowedModels.filter((m) => rolePolicy.allowedModels.includes(m));

  const deniedModels = Array.from(new Set([...orgPolicy.deniedModels, ...rolePolicy.deniedModels]));

  const maxCostPerRequest = Math.min(orgPolicy.maxCostPerRequest, rolePolicy.maxCostPerRequest);

  const orgSensIdx = SENSITIVITY_ORDER.indexOf(orgPolicy.sensitivityLevel);
  const roleSensIdx = SENSITIVITY_ORDER.indexOf(rolePolicy.sensitivityLevel);
  const sensitivityLevel = SENSITIVITY_ORDER[Math.min(orgSensIdx, roleSensIdx)] ?? 'public';

  return {
    ...orgPolicy,
    allowedModels,
    deniedModels,
    maxCostPerRequest,
    sensitivityLevel,
    updatedAt: new Date(),
  };
}

/**
 * Resolve the effective ModelPolicy for a request.
 *
 * 1. Look for an org-level policy (role === undefined).
 * 2. Look for role-level policies and merge with org policy.
 * 3. Fall back to default tier policy based on roles.
 */
export function getPolicyForRequest(
  store: PolicyStore,
  orgId: string,
  roles: string[]
): ModelPolicy {
  const orgPolicies = store.listByOrg(orgId);

  // Org-wide policy (no role specified)
  const orgPolicy = orgPolicies.find((p) => !p.role);

  // Role-specific policies that match the caller's roles
  const rolePolicies = orgPolicies.filter((p) => p.role && roles.includes(p.role));

  // If we have an org policy, optionally merge with the most permissive role policy
  if (orgPolicy) {
    if (rolePolicies.length === 0) return orgPolicy;
    // Merge with each matching role policy and pick the most permissive result
    let best = mergePolicies(orgPolicy, rolePolicies[0]!);
    for (let i = 1; i < rolePolicies.length; i++) {
      const candidate = mergePolicies(orgPolicy, rolePolicies[i]!);
      if (candidate.maxCostPerRequest > best.maxCostPerRequest) {
        best = candidate;
      }
    }
    return best;
  }

  // No custom org policy -- fall back to tier defaults
  const tier = resolveTier(roles);
  const defaults = DEFAULT_POLICIES[tier]!;
  return {
    id: `default-${tier}`,
    orgId,
    allowedModels: defaults.allowedModels ?? ['*'],
    deniedModels: defaults.deniedModels ?? [],
    maxCostPerRequest: defaults.maxCostPerRequest ?? 0.01,
    sensitivityLevel: defaults.sensitivityLevel ?? 'public',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Singleton store instance
// ---------------------------------------------------------------------------

export const policyStore = new PolicyStore();
