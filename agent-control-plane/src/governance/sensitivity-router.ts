/**
 * Sensitivity-Based Routing
 *
 * Filters model providers based on data sensitivity classification:
 *   - 'public'       -> all providers allowed
 *   - 'internal'     -> exclude third-party cloud providers
 *   - 'confidential' -> only local providers (Ollama / Synapse-local)
 *   - 'restricted'   -> only local providers (same as confidential for routing)
 */

import type { SensitivityLevel } from './model-policies.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProviderLocality = 'local' | 'self-hosted' | 'cloud';

export interface Provider {
  name: string;
  /** Where the provider runs. */
  locality: ProviderLocality;
  /** Whether this is a third-party cloud service (e.g. OpenAI, Anthropic API). */
  isThirdParty: boolean;
}

export interface RoutingConstraints {
  /** Provider localities that are allowed. */
  allowedLocalities: ProviderLocality[];
  /** Whether third-party cloud providers are permitted. */
  allowThirdParty: boolean;
  /** Human-readable description of the constraint. */
  description: string;
}

export interface ISensitivityRouter {
  filterProviders(sensitivity: SensitivityLevel, availableProviders: Provider[]): Provider[];
  getRoutingConstraints(sensitivity: SensitivityLevel): RoutingConstraints;
}

// ---------------------------------------------------------------------------
// Constraint definitions
// ---------------------------------------------------------------------------

const CONSTRAINTS: Record<SensitivityLevel, RoutingConstraints> = {
  public: {
    allowedLocalities: ['local', 'self-hosted', 'cloud'],
    allowThirdParty: true,
    description: 'All providers allowed for public data.',
  },
  internal: {
    allowedLocalities: ['local', 'self-hosted', 'cloud'],
    allowThirdParty: false,
    description: 'Third-party cloud providers excluded. Self-hosted and local only.',
  },
  confidential: {
    allowedLocalities: ['local'],
    allowThirdParty: false,
    description: 'Only local providers (Ollama/Synapse-local) allowed for confidential data.',
  },
  restricted: {
    allowedLocalities: ['local'],
    allowThirdParty: false,
    description: 'Only local providers allowed for restricted data.',
  },
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class SensitivityRouter implements ISensitivityRouter {
  /**
   * Return only the providers that satisfy the routing constraints
   * for the given sensitivity level.
   */
  filterProviders(sensitivity: SensitivityLevel, availableProviders: Provider[]): Provider[] {
    const constraints = this.getRoutingConstraints(sensitivity);

    return availableProviders.filter((provider) => {
      // Locality check
      if (!constraints.allowedLocalities.includes(provider.locality)) {
        return false;
      }
      // Third-party check
      if (!constraints.allowThirdParty && provider.isThirdParty) {
        return false;
      }
      return true;
    });
  }

  /**
   * Return the routing constraints for a sensitivity level.
   */
  getRoutingConstraints(sensitivity: SensitivityLevel): RoutingConstraints {
    return CONSTRAINTS[sensitivity] ?? CONSTRAINTS.public;
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const sensitivityRouter = new SensitivityRouter();
