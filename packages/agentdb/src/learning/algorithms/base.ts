/**
 * Base Learning Algorithm Classes
 * Abstract base classes for RL algorithms
 */

import type { Database } from '../../types/database.js';
import type { ActionFeedback, LearningSession, Policy } from '../types.js';

export interface AlgorithmContext {
  db: Database;
  session: LearningSession;
  policy: Policy;
}

/**
 * Abstract base class for learning algorithms
 */
export abstract class BaseLearningAlgorithm {
  protected db: Database;
  protected session: LearningSession;

  constructor(db: Database, session: LearningSession) {
    this.db = db;
    this.session = session;
  }

  /**
   * Calculate action score for this algorithm
   */
  abstract calculateScore(state: string, action: string, policy: Policy): number;

  /**
   * Update policy incrementally with feedback
   */
  abstract updateIncremental(policy: Policy, feedback: ActionFeedback): void;

  /**
   * Get learning rate from config
   */
  protected get learningRate(): number {
    return this.session.config.learningRate;
  }

  /**
   * Get discount factor from config
   */
  protected get discountFactor(): number {
    return this.session.config.discountFactor;
  }

  /**
   * Get exploration rate from config
   */
  protected get explorationRate(): number {
    return this.session.config.explorationRate || 0.1;
  }

  /**
   * Initialize Q-value if not exists
   */
  protected initializeIfNeeded(policy: Policy, key: string): void {
    if (!policy.qValues[key]) {
      policy.qValues[key] = 0;
      policy.visitCounts[key] = 0;
      policy.avgRewards[key] = 0;
    }
  }

  /**
   * Get state-action key
   */
  protected getKey(state: string, action: string): string {
    return `${state}|${action}`;
  }

  /**
   * Get maximum Q-value for next state
   */
  protected getMaxNextQ(policy: Policy, nextState: string): number {
    const nextActions = Object.keys(policy.qValues).filter((k) => k.startsWith(nextState + '|'));
    return Math.max(...nextActions.map((k) => policy.qValues[k]), 0);
  }

  /**
   * Update visit count for state-action pair
   */
  protected updateVisitCount(policy: Policy, key: string): void {
    policy.visitCounts[key] = (policy.visitCounts[key] || 0) + 1;
  }

  /**
   * Update average reward for state-action pair
   */
  protected updateAvgReward(policy: Policy, key: string, reward: number): void {
    const n = policy.visitCounts[key];
    policy.avgRewards[key] += (reward - policy.avgRewards[key]) / n;
  }
}

/**
 * Base class for value-based algorithms (Q-Learning, SARSA, DQN)
 */
export abstract class ValueBasedAlgorithm extends BaseLearningAlgorithm {
  calculateScore(state: string, action: string, policy: Policy): number {
    const key = this.getKey(state, action);
    return policy.qValues[key] || 0;
  }

  /**
   * Calculate TD target
   */
  protected calculateTDTarget(reward: number, nextQ: number): number {
    return reward + this.discountFactor * nextQ;
  }

  /**
   * Calculate TD error
   */
  protected calculateTDError(target: number, current: number): number {
    return target - current;
  }

  /**
   * Update Q-value using TD learning
   */
  protected updateQValue(policy: Policy, key: string, target: number): void {
    const current = policy.qValues[key];
    const tdError = this.calculateTDError(target, current);
    policy.qValues[key] = current + this.learningRate * tdError;
  }
}

/**
 * Base class for policy-based algorithms (Policy Gradient, Actor-Critic, PPO)
 */
export abstract class PolicyBasedAlgorithm extends BaseLearningAlgorithm {
  calculateScore(state: string, action: string, policy: Policy): number {
    const key = this.getKey(state, action);
    return policy.avgRewards[key] || 0;
  }

  /**
   * Update policy with reward
   */
  protected updatePolicyReward(policy: Policy, key: string, reward: number): void {
    this.updateVisitCount(policy, key);
    this.updateAvgReward(policy, key, reward);
  }
}
