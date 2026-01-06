/**
 * SARSA Algorithm
 * On-policy TD control algorithm
 */

import type { ActionFeedback, Policy } from '../types.js';
import { ValueBasedAlgorithm } from './base.js';

/**
 * SARSA: Q(s,a) ← Q(s,a) + α[r + γ Q(s',a') - Q(s,a)]
 *
 * Features:
 * - On-policy learning
 * - Learns value of policy being followed
 * - Uses actual next action for bootstrapping
 */
export class SARSAAlgorithm extends ValueBasedAlgorithm {
  updateIncremental(policy: Policy, feedback: ActionFeedback): void {
    const key = this.getKey(feedback.state, feedback.action);
    this.initializeIfNeeded(policy, key);

    // For incremental update, approximate with current Q-value
    // In full SARSA, we'd need the next action chosen
    const nextQ = policy.qValues[key] || 0;

    // Calculate TD target: r + γ * Q(s',a')
    const target = this.calculateTDTarget(feedback.reward, nextQ);

    // Update Q-value with TD learning
    this.updateQValue(policy, key, target);

    // Update statistics
    this.updateVisitCount(policy, key);
  }

  /**
   * Batch update for SARSA with experience replay
   */
  batchUpdate(
    policy: Policy,
    experiences: Array<{
      state: string;
      action: string;
      reward: number;
      next_state?: string;
      next_action?: string;
    }>,
    learningRate: number
  ): number {
    let totalLoss = 0;

    for (const exp of experiences) {
      const key = this.getKey(exp.state, exp.action);
      this.initializeIfNeeded(policy, key);

      // Calculate target
      let target = exp.reward;
      if (exp.next_state && exp.next_action) {
        const nextKey = this.getKey(exp.next_state, exp.next_action);
        const nextQ = policy.qValues[nextKey] || 0;
        target += this.discountFactor * nextQ;
      }

      // Calculate loss (squared TD error)
      const current = policy.qValues[key];
      const tdError = this.calculateTDError(target, current);
      totalLoss += tdError * tdError;

      // Update Q-value
      policy.qValues[key] = current + learningRate * tdError;

      // Update statistics
      this.updateVisitCount(policy, key);
    }

    return totalLoss / experiences.length;
  }
}
