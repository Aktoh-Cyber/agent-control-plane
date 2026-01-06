/**
 * Deep Q-Network (DQN) Algorithm
 * Value-based deep RL with experience replay and target networks
 */

import type { ActionFeedback, Policy } from '../types.js';
import { ValueBasedAlgorithm } from './base.js';

/**
 * DQN: Deep Q-Network with target network and experience replay
 *
 * Features:
 * - Deep neural network approximation (simplified here)
 * - Target network for stability
 * - Experience replay buffer
 * - Double Q-learning variant support
 */
export class DQNAlgorithm extends ValueBasedAlgorithm {
  private targetPolicy: Policy | null = null;
  private updateCounter: number = 0;

  updateIncremental(policy: Policy, feedback: ActionFeedback): void {
    const key = this.getKey(feedback.state, feedback.action);
    this.initializeIfNeeded(policy, key);

    // Use target network for next Q-value if available
    const targetPolicyToUse = this.targetPolicy || policy;

    let maxNextQ = 0;
    if (feedback.nextState) {
      maxNextQ = this.getMaxNextQ(targetPolicyToUse, feedback.nextState);
    }

    // Calculate TD target using target network
    const target = this.calculateTDTarget(feedback.reward, maxNextQ);

    // Update Q-value
    this.updateQValue(policy, key, target);

    // Update statistics
    this.updateVisitCount(policy, key);

    // Update target network periodically
    this.updateCounter++;
    const updateFreq = this.session.config.targetUpdateFrequency || 100;
    if (this.updateCounter % updateFreq === 0) {
      this.updateTargetNetwork(policy);
    }
  }

  /**
   * Update target network (copy from main network)
   */
  private updateTargetNetwork(policy: Policy): void {
    this.targetPolicy = {
      stateActionPairs: { ...policy.stateActionPairs },
      qValues: { ...policy.qValues },
      visitCounts: { ...policy.visitCounts },
      avgRewards: { ...policy.avgRewards },
    };
  }

  /**
   * Batch update with experience replay
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
    const targetPolicyToUse = this.targetPolicy || policy;

    for (const exp of experiences) {
      const key = this.getKey(exp.state, exp.action);
      this.initializeIfNeeded(policy, key);

      // Calculate target using target network
      let target = exp.reward;
      if (exp.next_state) {
        const maxNextQ = this.getMaxNextQ(targetPolicyToUse, exp.next_state);
        target += this.discountFactor * maxNextQ;
      }

      // Calculate loss
      const current = policy.qValues[key];
      const tdError = this.calculateTDError(target, current);
      totalLoss += tdError * tdError;

      // Update Q-value
      policy.qValues[key] = current + learningRate * tdError;

      // Update statistics
      this.updateVisitCount(policy, key);
    }

    // Update target network after batch
    this.updateTargetNetwork(policy);

    return totalLoss / experiences.length;
  }

  /**
   * Double DQN variant: uses main network to select action, target network to evaluate
   */
  doubleQLearning(policy: Policy, state: string, nextState: string): number {
    if (!this.targetPolicy) return 0;

    // Select best action using main network
    const nextActions = Object.keys(policy.qValues).filter((k) => k.startsWith(nextState + '|'));
    if (nextActions.length === 0) return 0;

    const bestAction = nextActions.reduce((best, key) =>
      policy.qValues[key] > policy.qValues[best] ? key : best
    );

    // Evaluate using target network
    return this.targetPolicy.qValues[bestAction] || 0;
  }
}
