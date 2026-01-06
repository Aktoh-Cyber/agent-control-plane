/**
 * Policy Utilities
 * Policy management, storage, and retrieval
 */

import type { Database } from '../../types/database.js';
import type { Policy } from '../types.js';

/**
 * Get latest policy for a session
 */
export function getLatestPolicy(db: Database, sessionId: string): Policy {
  const policy = db
    .prepare(
      `
    SELECT * FROM learning_policies
    WHERE session_id = ?
    ORDER BY version DESC
    LIMIT 1
  `
    )
    .get(sessionId) as any;

  if (!policy) {
    return {
      stateActionPairs: {},
      qValues: {},
      visitCounts: {},
      avgRewards: {},
    };
  }

  return {
    stateActionPairs: JSON.parse(policy.state_action_pairs),
    qValues: JSON.parse(policy.q_values),
    visitCounts: JSON.parse(policy.visit_counts),
    avgRewards: JSON.parse(policy.avg_rewards),
  };
}

/**
 * Save policy to database
 */
export function savePolicy(db: Database, sessionId: string, policy: Policy): void {
  const currentVersion = db
    .prepare(
      `
    SELECT MAX(version) as max_version FROM learning_policies
    WHERE session_id = ?
  `
    )
    .get(sessionId) as any;

  const version = (currentVersion?.max_version || 0) + 1;

  db.prepare(
    `
    INSERT INTO learning_policies (
      session_id, state_action_pairs, q_values, visit_counts, avg_rewards, version
    ) VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(
    sessionId,
    JSON.stringify(policy.stateActionPairs || {}),
    JSON.stringify(policy.qValues || {}),
    JSON.stringify(policy.visitCounts || {}),
    JSON.stringify(policy.avgRewards || {}),
    version
  );
}

/**
 * Get state-action key
 */
export function getStateActionKey(state: string, action: string): string {
  return `${state}|${action}`;
}

/**
 * Parse state-action key
 */
export function parseStateActionKey(key: string): { state: string; action: string } {
  const [state, action] = key.split('|');
  return { state, action };
}

/**
 * Get maximum Q-value for a state
 */
export function getMaxQValue(policy: Policy, state: string): number {
  const stateActions = Object.keys(policy.qValues).filter((k) => k.startsWith(state + '|'));
  if (stateActions.length === 0) return 0;
  return Math.max(...stateActions.map((k) => policy.qValues[k]));
}

/**
 * Get best action for a state
 */
export function getBestAction(policy: Policy, state: string): string | null {
  const stateActions = Object.keys(policy.qValues).filter((k) => k.startsWith(state + '|'));
  if (stateActions.length === 0) return null;

  let bestAction: string | null = null;
  let bestValue = -Infinity;

  for (const key of stateActions) {
    if (policy.qValues[key] > bestValue) {
      bestValue = policy.qValues[key];
      bestAction = parseStateActionKey(key).action;
    }
  }

  return bestAction;
}

/**
 * Initialize policy entry if not exists
 */
export function initializePolicyEntry(policy: Policy, key: string): void {
  if (!policy.qValues[key]) {
    policy.qValues[key] = 0;
    policy.visitCounts[key] = 0;
    policy.avgRewards[key] = 0;
  }
}

/**
 * Merge policies (for transfer learning)
 */
export function mergePolicies(target: Policy, source: Policy, weight: number = 0.5): Policy {
  const merged: Policy = {
    stateActionPairs: { ...target.stateActionPairs },
    qValues: { ...target.qValues },
    visitCounts: { ...target.visitCounts },
    avgRewards: { ...target.avgRewards },
  };

  // Merge Q-values with weighting
  for (const [key, value] of Object.entries(source.qValues)) {
    if (merged.qValues[key] !== undefined) {
      merged.qValues[key] = (1 - weight) * merged.qValues[key] + weight * value;
    } else {
      merged.qValues[key] = value;
    }
  }

  // Merge visit counts
  for (const [key, value] of Object.entries(source.visitCounts)) {
    merged.visitCounts[key] = (merged.visitCounts[key] || 0) + value;
  }

  // Merge average rewards
  for (const [key, value] of Object.entries(source.avgRewards)) {
    if (merged.avgRewards[key] !== undefined) {
      const targetCount = target.visitCounts[key] || 1;
      const sourceCount = source.visitCounts[key] || 1;
      const totalCount = targetCount + sourceCount;
      merged.avgRewards[key] =
        (merged.avgRewards[key] * targetCount + value * sourceCount) / totalCount;
    } else {
      merged.avgRewards[key] = value;
    }
  }

  return merged;
}
