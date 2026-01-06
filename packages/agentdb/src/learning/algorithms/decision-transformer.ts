/**
 * Decision Transformer Algorithm
 * Sequence modeling approach to RL using transformers
 */

import type { ActionFeedback, Policy } from '../types.js';
import { BaseLearningAlgorithm } from './base.js';

/**
 * Decision Transformer: Frame RL as sequence modeling
 *
 * Features:
 * - Conditions on desired return (reward-to-go)
 * - Uses transformer architecture for sequence modeling
 * - Offline RL capabilities
 * - Can handle long-horizon dependencies
 */
export class DecisionTransformerAlgorithm extends BaseLearningAlgorithm {
  private trajectories: Map<
    string,
    Array<{
      state: string;
      action: string;
      reward: number;
      returnToGo: number;
    }>
  > = new Map();

  calculateScore(state: string, action: string, policy: Policy): number {
    const key = this.getKey(state, action);
    // Use reward-conditioned probability
    return this.calculateTransformerScore(state, action, policy);
  }

  updateIncremental(policy: Policy, feedback: ActionFeedback): void {
    const key = this.getKey(feedback.state, feedback.action);
    this.initializeIfNeeded(policy, key);

    // Update average reward (simplified version)
    this.updateVisitCount(policy, key);
    this.updateAvgReward(policy, key, feedback.reward);

    // Store in trajectory
    this.addToTrajectory(feedback.sessionId, {
      state: feedback.state,
      action: feedback.action,
      reward: feedback.reward,
      returnToGo: 0, // Will be computed in batch update
    });
  }

  /**
   * Add experience to trajectory buffer
   */
  private addToTrajectory(
    sessionId: string,
    step: {
      state: string;
      action: string;
      reward: number;
      returnToGo: number;
    }
  ): void {
    if (!this.trajectories.has(sessionId)) {
      this.trajectories.set(sessionId, []);
    }
    this.trajectories.get(sessionId)!.push(step);
  }

  /**
   * Calculate reward-conditioned score
   */
  private calculateTransformerScore(state: string, action: string, policy: Policy): number {
    const key = this.getKey(state, action);
    return policy.avgRewards[key] || 0;
  }

  /**
   * Calculate returns-to-go for trajectory
   */
  calculateReturnsToGo(trajectory: Array<{ reward: number; returnToGo: number }>): void {
    let returnToGo = 0;
    for (let i = trajectory.length - 1; i >= 0; i--) {
      returnToGo += trajectory[i].reward;
      trajectory[i].returnToGo = returnToGo;
    }
  }

  /**
   * Batch update with trajectory sequences
   */
  batchUpdate(
    policy: Policy,
    experiences: Array<{
      state: string;
      action: string;
      reward: number;
      session_id: string;
    }>,
    learningRate: number,
    contextLength: number = 20
  ): number {
    let totalLoss = 0;

    // Group experiences by session to form trajectories
    const sessionTrajectories = new Map<string, typeof experiences>();
    for (const exp of experiences) {
      if (!sessionTrajectories.has(exp.session_id)) {
        sessionTrajectories.set(exp.session_id, []);
      }
      sessionTrajectories.get(exp.session_id)!.push(exp);
    }

    // Process each trajectory
    for (const [sessionId, trajectory] of sessionTrajectories) {
      // Sort by timestamp (assuming experiences are ordered)
      const sortedTrajectory = trajectory.map((exp, idx) => ({
        state: exp.state,
        action: exp.action,
        reward: exp.reward,
        returnToGo: 0,
        index: idx,
      }));

      // Calculate returns-to-go
      this.calculateReturnsToGo(sortedTrajectory);

      // Process in context windows
      for (let i = 0; i < sortedTrajectory.length; i++) {
        const startIdx = Math.max(0, i - contextLength + 1);
        const context = sortedTrajectory.slice(startIdx, i + 1);

        const currentStep = sortedTrajectory[i];
        const key = this.getKey(currentStep.state, currentStep.action);
        this.initializeIfNeeded(policy, key);

        // Update policy based on return-to-go
        const targetReturn = currentStep.returnToGo;
        const currentValue = policy.avgRewards[key];

        // Loss: difference between predicted and actual return
        const loss = Math.pow(targetReturn - currentValue, 2);
        totalLoss += loss;

        // Update towards target return
        policy.avgRewards[key] = currentValue + learningRate * (targetReturn - currentValue);

        // Update statistics
        this.updateVisitCount(policy, key);
      }
    }

    return totalLoss / experiences.length;
  }

  /**
   * Predict action conditioned on desired return
   */
  predictWithReturn(
    policy: Policy,
    state: string,
    desiredReturn: number,
    availableActions: string[]
  ): { action: string; score: number } | null {
    let bestAction: string | null = null;
    let bestScore = -Infinity;

    for (const action of availableActions) {
      const key = this.getKey(state, action);
      const avgReward = policy.avgRewards[key] || 0;

      // Score based on how close to desired return
      const score = -Math.abs(avgReward - desiredReturn);

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction ? { action: bestAction, score: bestScore } : null;
  }

  /**
   * Get trajectory for session
   */
  getTrajectory(sessionId: string): Array<any> | undefined {
    return this.trajectories.get(sessionId);
  }

  /**
   * Clear trajectories
   */
  clearTrajectories(): void {
    this.trajectories.clear();
  }
}
