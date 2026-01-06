/**
 * Algorithm Factory
 * Create and manage learning algorithm instances
 */

import type { Database } from '../../types/database.js';
import { ActorCriticAlgorithm } from '../algorithms/actor-critic.js';
import { BaseLearningAlgorithm } from '../algorithms/base.js';
import { DecisionTransformerAlgorithm } from '../algorithms/decision-transformer.js';
import { DQNAlgorithm } from '../algorithms/dqn.js';
import { PPOAlgorithm } from '../algorithms/ppo.js';
import { QLearningAlgorithm } from '../algorithms/q-learning.js';
import { SARSAAlgorithm } from '../algorithms/sarsa.js';
import type { LearningSession } from '../types.js';

/**
 * Create algorithm instance based on session type
 */
export function createAlgorithm(db: Database, session: LearningSession): BaseLearningAlgorithm {
  switch (session.sessionType) {
    case 'q-learning':
      return new QLearningAlgorithm(db, session);

    case 'sarsa':
      return new SARSAAlgorithm(db, session);

    case 'dqn':
      return new DQNAlgorithm(db, session);

    case 'actor-critic':
      return new ActorCriticAlgorithm(db, session);

    case 'ppo':
      return new PPOAlgorithm(db, session);

    case 'decision-transformer':
      return new DecisionTransformerAlgorithm(db, session);

    case 'policy-gradient':
      return new ActorCriticAlgorithm(db, session);

    case 'mcts':
      return new QLearningAlgorithm(db, session);

    case 'model-based':
      return new QLearningAlgorithm(db, session);

    default:
      throw new Error(`Unsupported algorithm type: ${session.sessionType}`);
  }
}

/**
 * Calculate MCTS UCB1 score
 */
export function calculateMCTSScore(state: string, action: string, policy: any): number {
  const key = `${state}|${action}`;
  const q = policy.avgRewards[key] || 0;
  const n = policy.visitCounts[key] || 1;
  const N = Object.values(policy.visitCounts).reduce((sum: number, val: any) => sum + val, 0) || 1;
  const exploration = Math.sqrt((2 * Math.log(N)) / n);
  return q + exploration;
}

/**
 * Calculate model-based score
 */
export function calculateModelScore(state: string, action: string, policy: any): number {
  const key = `${state}|${action}`;
  return policy.avgRewards[key] || 0;
}
