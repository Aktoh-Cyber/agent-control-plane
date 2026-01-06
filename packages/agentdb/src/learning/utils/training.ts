/**
 * Training Utilities
 * Batch processing, shuffling, and training helpers
 */

import type { Database } from '../../types/database.js';

/**
 * Shuffle array in-place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Process experiences in batches
 */
export function* batchIterator<T>(items: T[], batchSize: number): Generator<T[], void, unknown> {
  for (let i = 0; i < items.length; i += batchSize) {
    yield items.slice(i, i + batchSize);
  }
}

/**
 * Calculate convergence rate from policy versions
 */
export function calculateConvergenceRate(
  db: Database,
  sessionId: string,
  windowSize: number = 10
): number {
  // Get recent policy versions
  const versions = db
    .prepare(
      `
    SELECT version, q_values FROM learning_policies
    WHERE session_id = ?
    ORDER BY version DESC
    LIMIT ?
  `
    )
    .all(sessionId, windowSize) as any[];

  if (versions.length < 2) return 0;

  // Calculate rate of change between versions
  let totalChange = 0;
  for (let i = 0; i < versions.length - 1; i++) {
    const qValues1 = JSON.parse(versions[i].q_values);
    const qValues2 = JSON.parse(versions[i + 1].q_values);

    // Calculate mean absolute difference
    const keys = new Set([...Object.keys(qValues1), ...Object.keys(qValues2)]);
    let diff = 0;
    keys.forEach((key) => {
      diff += Math.abs((qValues1[key] || 0) - (qValues2[key] || 0));
    });
    totalChange += diff / keys.size;
  }

  // Lower change = higher convergence
  const avgChange = totalChange / (versions.length - 1);
  return Math.max(0, 1 - avgChange);
}

/**
 * Get all experiences for a session
 */
export function getExperiences(
  db: Database,
  sessionId: string
): Array<{
  id: number;
  session_id: string;
  state: string;
  action: string;
  reward: number;
  next_state: string | null;
  success: number;
  timestamp: number;
  metadata: string | null;
}> {
  return db
    .prepare(
      `
    SELECT * FROM learning_experiences
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `
    )
    .all(sessionId) as any[];
}

/**
 * Calculate training metrics
 */
export interface TrainingMetrics {
  totalLoss: number;
  avgLoss: number;
  avgReward: number;
  batchCount: number;
}

export function initializeMetrics(): TrainingMetrics {
  return {
    totalLoss: 0,
    avgLoss: 0,
    avgReward: 0,
    batchCount: 0,
  };
}

export function updateMetrics(
  metrics: TrainingMetrics,
  batchLoss: number,
  batchReward: number
): void {
  metrics.totalLoss += batchLoss;
  metrics.avgReward += batchReward;
  metrics.batchCount++;
  metrics.avgLoss = metrics.totalLoss / metrics.batchCount;
}

/**
 * Log training progress
 */
export function logProgress(
  epoch: number,
  totalEpochs: number,
  metrics: TrainingMetrics,
  logInterval: number = 10
): void {
  if ((epoch + 1) % logInterval === 0) {
    console.log(
      `  Epoch ${epoch + 1}/${totalEpochs} - Loss: ${metrics.avgLoss.toFixed(4)}, ` +
        `Avg Reward: ${(metrics.avgReward / metrics.batchCount).toFixed(3)}`
    );
  }
}
