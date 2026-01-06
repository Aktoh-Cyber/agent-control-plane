/**
 * Learning System Types
 * Shared interfaces and types for reinforcement learning
 */

export type SessionType =
  | 'q-learning'
  | 'sarsa'
  | 'dqn'
  | 'policy-gradient'
  | 'actor-critic'
  | 'ppo'
  | 'decision-transformer'
  | 'mcts'
  | 'model-based';
export type SessionStatus = 'active' | 'completed' | 'failed';
export type RewardFunction = 'standard' | 'sparse' | 'dense' | 'shaped';
export type ExplainDepth = 'summary' | 'detailed' | 'full';
export type TransferType = 'episodes' | 'skills' | 'causal_edges' | 'all';
export type GroupBy = 'task' | 'session' | 'skill';

export interface LearningSession {
  id: string;
  userId: string;
  sessionType: SessionType;
  config: LearningConfig;
  startTime: number;
  endTime?: number;
  status: SessionStatus;
  metadata?: Record<string, any>;
}

export interface LearningConfig {
  learningRate: number;
  discountFactor: number;
  explorationRate?: number;
  batchSize?: number;
  targetUpdateFrequency?: number;
}

export interface ActionPrediction {
  action: string;
  confidence: number;
  qValue?: number;
  alternatives: Array<{ action: string; confidence: number; qValue?: number }>;
}

export interface ActionFeedback {
  sessionId: string;
  action: string;
  state: string;
  reward: number;
  nextState?: string;
  success: boolean;
  timestamp: number;
}

export interface TrainingResult {
  epochsCompleted: number;
  finalLoss: number;
  avgReward: number;
  convergenceRate: number;
  trainingTimeMs: number;
}

export interface Policy {
  stateActionPairs: Record<string, any>;
  qValues: Record<string, number>;
  visitCounts: Record<string, number>;
  avgRewards: Record<string, number>;
}

export interface ActionScore {
  action: string;
  score: number;
}

export interface MetricsOptions {
  sessionId?: string;
  timeWindowDays?: number;
  includeTrends?: boolean;
  groupBy?: GroupBy;
}

export interface TransferOptions {
  sourceSession?: string;
  targetSession?: string;
  sourceTask?: string;
  targetTask?: string;
  minSimilarity?: number;
  transferType?: TransferType;
  maxTransfers?: number;
}

export interface ExplainOptions {
  query: string;
  k?: number;
  explainDepth?: ExplainDepth;
  includeConfidence?: boolean;
  includeEvidence?: boolean;
  includeCausal?: boolean;
}

export interface RecordExperienceOptions {
  sessionId: string;
  toolName: string;
  action: string;
  stateBefore?: any;
  stateAfter?: any;
  outcome: string;
  reward: number;
  success: boolean;
  latencyMs?: number;
  metadata?: any;
}

export interface RewardOptions {
  episodeId?: number;
  success: boolean;
  targetAchieved?: boolean;
  efficiencyScore?: number;
  qualityScore?: number;
  timeTakenMs?: number;
  expectedTimeMs?: number;
  includeCausal?: boolean;
  rewardFunction?: RewardFunction;
}
