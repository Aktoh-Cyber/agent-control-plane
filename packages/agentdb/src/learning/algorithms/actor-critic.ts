/**
 * Actor-Critic Algorithm
 * Policy gradient with value function baseline
 */

import type { ActionFeedback, Policy } from '../types.js';
import { PolicyBasedAlgorithm } from './base.js';

/**
 * Actor-Critic: Combines policy gradient (actor) with value function (critic)
 *
 * Features:
 * - Actor: learns policy directly
 * - Critic: learns value function for variance reduction
 * - Lower variance than pure policy gradient
 * - Faster learning than value-based methods
 */
export class ActorCriticAlgorithm extends PolicyBasedAlgorithm {
  private stateValues: Record<string, number> = {};
  private stateVisits: Record<string, number> = {};

  updateIncremental(policy: Policy, feedback: ActionFeedback): void {
    const key = this.getKey(feedback.state, feedback.action);
    this.initializeIfNeeded(policy, key);

    // Initialize state values
    if (!this.stateValues[feedback.state]) {
      this.stateValues[feedback.state] = 0;
      this.stateVisits[feedback.state] = 0;
    }

    // Calculate advantage: A(s,a) = r + γV(s') - V(s)
    const stateValue = this.stateValues[feedback.state];
    const nextStateValue = feedback.nextState ? this.stateValues[feedback.nextState] || 0 : 0;

    const advantage = feedback.reward + this.discountFactor * nextStateValue - stateValue;

    // Update actor (policy) using advantage
    const currentAvgReward = policy.avgRewards[key];
    policy.avgRewards[key] = currentAvgReward + this.learningRate * advantage;

    // Update critic (value function)
    const tdTarget = feedback.reward + this.discountFactor * nextStateValue;
    this.stateValues[feedback.state] += this.learningRate * (tdTarget - stateValue);

    // Update statistics
    this.updateVisitCount(policy, key);
    this.stateVisits[feedback.state]++;
  }

  /**
   * Get advantage for state-action pair
   */
  getAdvantage(state: string, action: string, reward: number, nextState?: string): number {
    const stateValue = this.stateValues[state] || 0;
    const nextStateValue = nextState ? this.stateValues[nextState] || 0 : 0;
    return reward + this.discountFactor * nextStateValue - stateValue;
  }

  /**
   * Batch update with advantage estimation
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

      // Initialize state value
      if (!this.stateValues[exp.state]) {
        this.stateValues[exp.state] = 0;
        this.stateVisits[exp.state] = 0;
      }

      // Calculate advantage
      const advantage = this.getAdvantage(exp.state, exp.action, exp.reward, exp.next_state);

      // Update policy
      const currentAvgReward = policy.avgRewards[key];
      policy.avgRewards[key] = currentAvgReward + learningRate * advantage;

      // Update value function
      const stateValue = this.stateValues[exp.state];
      const nextStateValue = exp.next_state ? this.stateValues[exp.next_state] || 0 : 0;
      const tdTarget = exp.reward + this.discountFactor * nextStateValue;
      const tdError = tdTarget - stateValue;

      this.stateValues[exp.state] += learningRate * tdError;

      // Accumulate loss
      totalLoss += tdError * tdError;

      // Update statistics
      this.updateVisitCount(policy, key);
      this.stateVisits[exp.state]++;
    }

    return totalLoss / experiences.length;
  }

  /**
   * Get state value estimates
   */
  getStateValues(): Record<string, number> {
    return { ...this.stateValues };
  }
}
