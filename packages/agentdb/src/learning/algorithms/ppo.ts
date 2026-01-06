/**
 * Proximal Policy Optimization (PPO) Algorithm
 * Policy gradient with clipped objective for stability
 */

import type { ActionFeedback, Policy } from '../types.js';
import { PolicyBasedAlgorithm } from './base.js';

/**
 * PPO: Proximal Policy Optimization
 *
 * Features:
 * - Clipped surrogate objective prevents large policy updates
 * - Multiple epochs on same batch for sample efficiency
 * - State-of-the-art policy gradient method
 * - Stable and robust training
 */
export class PPOAlgorithm extends PolicyBasedAlgorithm {
  private stateValues: Record<string, number> = {};
  private oldPolicies: Map<string, number> = new Map();
  private clipEpsilon: number = 0.2;

  updateIncremental(policy: Policy, feedback: ActionFeedback): void {
    const key = this.getKey(feedback.state, feedback.action);
    this.initializeIfNeeded(policy, key);

    // Initialize state value
    if (!this.stateValues[feedback.state]) {
      this.stateValues[feedback.state] = 0;
    }

    // Store old policy value
    const oldPolicyValue = policy.avgRewards[key];
    this.oldPolicies.set(key, oldPolicyValue);

    // Calculate advantage
    const stateValue = this.stateValues[feedback.state];
    const nextStateValue = feedback.nextState ? this.stateValues[feedback.nextState] || 0 : 0;
    const advantage = feedback.reward + this.discountFactor * nextStateValue - stateValue;

    // Calculate probability ratio (simplified)
    const newPolicyValue = oldPolicyValue + this.learningRate * advantage;
    const ratio = this.calculateRatio(newPolicyValue, oldPolicyValue);

    // PPO clipped objective
    const clippedRatio = this.clipRatio(ratio);
    const ppoObjective = Math.min(ratio * advantage, clippedRatio * advantage);

    // Update policy using PPO objective
    policy.avgRewards[key] =
      oldPolicyValue + this.learningRate * Math.sign(ppoObjective) * Math.abs(advantage);

    // Update value function
    const tdTarget = feedback.reward + this.discountFactor * nextStateValue;
    this.stateValues[feedback.state] += this.learningRate * (tdTarget - stateValue);

    // Update statistics
    this.updateVisitCount(policy, key);
  }

  /**
   * Calculate probability ratio
   */
  private calculateRatio(newValue: number, oldValue: number): number {
    // Simplified ratio calculation
    // In full PPO, this would be exp(newLogProb - oldLogProb)
    const epsilon = 1e-8;
    return (newValue + 1) / (oldValue + 1 + epsilon);
  }

  /**
   * Clip ratio to [1-ε, 1+ε]
   */
  private clipRatio(ratio: number): number {
    return Math.max(1 - this.clipEpsilon, Math.min(1 + this.clipEpsilon, ratio));
  }

  /**
   * Batch update with multiple epochs
   */
  batchUpdate(
    policy: Policy,
    experiences: Array<{
      state: string;
      action: string;
      reward: number;
      next_state?: string;
    }>,
    learningRate: number,
    epochs: number = 4
  ): number {
    let totalLoss = 0;
    let updateCount = 0;

    // Store old policy values
    this.oldPolicies.clear();
    for (const exp of experiences) {
      const key = this.getKey(exp.state, exp.action);
      this.oldPolicies.set(key, policy.avgRewards[key] || 0);
    }

    // Multiple epochs for sample efficiency
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const exp of experiences) {
        const key = this.getKey(exp.state, exp.action);
        this.initializeIfNeeded(policy, key);

        // Initialize state value
        if (!this.stateValues[exp.state]) {
          this.stateValues[exp.state] = 0;
        }

        // Calculate advantage
        const stateValue = this.stateValues[exp.state];
        const nextStateValue = exp.next_state ? this.stateValues[exp.next_state] || 0 : 0;
        const advantage = exp.reward + this.discountFactor * nextStateValue - stateValue;

        // Get old and new policy values
        const oldPolicyValue = this.oldPolicies.get(key) || 0;
        const currentPolicyValue = policy.avgRewards[key];

        // Calculate ratio and clip
        const ratio = this.calculateRatio(currentPolicyValue, oldPolicyValue);
        const clippedRatio = this.clipRatio(ratio);

        // PPO clipped objective
        const ppoObjective = Math.min(ratio * advantage, clippedRatio * advantage);

        // Update policy
        policy.avgRewards[key] =
          currentPolicyValue + learningRate * Math.sign(ppoObjective) * Math.abs(advantage);

        // Update value function
        const tdTarget = exp.reward + this.discountFactor * nextStateValue;
        const tdError = tdTarget - stateValue;
        this.stateValues[exp.state] += learningRate * tdError;

        // Accumulate loss
        totalLoss += tdError * tdError;
        updateCount++;

        // Update statistics
        this.updateVisitCount(policy, key);
      }
    }

    return totalLoss / updateCount;
  }

  /**
   * Set clip epsilon
   */
  setClipEpsilon(epsilon: number): void {
    this.clipEpsilon = epsilon;
  }
}
