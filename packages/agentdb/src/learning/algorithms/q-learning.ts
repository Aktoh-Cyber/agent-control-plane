/**
 * Q-Learning Algorithm
 * Off-policy TD control algorithm
 */

import type { ActionFeedback, Policy } from '../types.js';
import { ValueBasedAlgorithm } from './base.js';

/**
 * Q-Learning: Q(s,a) ← Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]
 *
 * Features:
 * - Off-policy learning
 * - Learns optimal policy regardless of behavior policy
 * - Uses max operator for bootstrapping
 */
export class QLearningAlgorithm extends ValueBasedAlgorithm {
  updateIncremental(policy: Policy, feedback: ActionFeedback): void {
    const key = this.getKey(feedback.state, feedback.action);
    this.initializeIfNeeded(policy, key);

    // Calculate max Q-value for next state
    let maxNextQ = 0;
    if (feedback.nextState) {
      maxNextQ = this.getMaxNextQ(policy, feedback.nextState);
    }

    // Calculate TD target: r + γ * max Q(s',a')
    const target = this.calculateTDTarget(feedback.reward, maxNextQ);

    // Update Q-value with TD learning
    this.updateQValue(policy, key, target);

    // Update statistics
    this.updateVisitCount(policy, key);
  }

  /**
   * Batch update for Q-Learning
   */
  batchUpdate(
    policy: Policy,
    experiences: Array<{
      state: string;
      action: string;
      reward: number;
      next_state?: string;
    }>,
    learningRate: number
  ): number {
    let totalLoss = 0;

    for (const exp of experiences) {
      const key = this.getKey(exp.state, exp.action);
      this.initializeIfNeeded(policy, key);

      // Calculate target
      let target = exp.reward;
      if (exp.next_state) {
        const maxNextQ = this.getMaxNextQ(policy, exp.next_state);
        target += this.discountFactor * maxNextQ;
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
