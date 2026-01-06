/**
 * Evaluation Utilities
 * Metrics calculation and performance evaluation
 */

import type { Database } from '../../types/database.js';
import type { GroupBy, MetricsOptions } from '../types.js';

/**
 * Get learning performance metrics
 */
export async function getMetrics(db: Database, options: MetricsOptions): Promise<any> {
  const { sessionId, timeWindowDays = 7, includeTrends = true, groupBy = 'task' } = options;

  const cutoffTimestamp = Date.now() - timeWindowDays * 24 * 60 * 60 * 1000;

  // Base query filters
  let whereClause = 'WHERE timestamp >= ?';
  const params: any[] = [cutoffTimestamp];

  if (sessionId) {
    whereClause += ' AND session_id = ?';
    params.push(sessionId);
  }

  // Overall metrics
  const overallStats = db
    .prepare(
      `
    SELECT
      COUNT(*) as total_episodes,
      AVG(reward) as avg_reward,
      AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
      MIN(reward) as min_reward,
      MAX(reward) as max_reward,
      AVG(CASE WHEN metadata IS NOT NULL THEN json_extract(metadata, '$.latency_ms') END) as avg_latency_ms
    FROM learning_experiences
    ${whereClause}
  `
    )
    .get(...params) as any;

  // Group by metrics
  const groupedMetrics = getGroupedMetrics(db, whereClause, params, groupBy);

  // Trend analysis
  const trends = includeTrends ? getTrends(db, whereClause, params) : [];

  // Policy improvement metrics
  const policyImprovement = sessionId
    ? calculatePolicyImprovement(db, sessionId)
    : { versions: 0, qValueImprovement: 0 };

  return {
    timeWindow: {
      days: timeWindowDays,
      startTimestamp: cutoffTimestamp,
      endTimestamp: Date.now(),
    },
    overall: {
      totalEpisodes: overallStats.total_episodes || 0,
      avgReward: overallStats.avg_reward || 0,
      successRate: overallStats.success_rate || 0,
      minReward: overallStats.min_reward || 0,
      maxReward: overallStats.max_reward || 0,
      avgLatencyMs: overallStats.avg_latency_ms || 0,
    },
    groupedMetrics,
    trends,
    policyImprovement,
  };
}

function getGroupedMetrics(
  db: Database,
  whereClause: string,
  params: any[],
  groupBy: GroupBy
): any[] {
  let groupedMetrics: any[] = [];

  if (groupBy === 'task') {
    groupedMetrics = db
      .prepare(
        `
      SELECT
        state as group_key,
        COUNT(*) as count,
        AVG(reward) as avg_reward,
        AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
      FROM learning_experiences
      ${whereClause}
      GROUP BY state
      ORDER BY count DESC
      LIMIT 20
    `
      )
      .all(...params) as any[];
  } else if (groupBy === 'session') {
    groupedMetrics = db
      .prepare(
        `
      SELECT
        session_id as group_key,
        COUNT(*) as count,
        AVG(reward) as avg_reward,
        AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
      FROM learning_experiences
      ${whereClause}
      GROUP BY session_id
      ORDER BY count DESC
      LIMIT 20
    `
      )
      .all(...params) as any[];
  }

  return groupedMetrics.map((g) => ({
    key: g.group_key,
    count: g.count,
    avgReward: g.avg_reward,
    successRate: g.success_rate,
  }));
}

function getTrends(db: Database, whereClause: string, params: any[]): any[] {
  const trends = db
    .prepare(
      `
    SELECT
      DATE(timestamp / 1000, 'unixepoch') as date,
      COUNT(*) as count,
      AVG(reward) as avg_reward,
      AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
    FROM learning_experiences
    ${whereClause}
    GROUP BY date
    ORDER BY date ASC
  `
    )
    .all(...params) as any[];

  return trends.map((t) => ({
    date: t.date,
    count: t.count,
    avgReward: t.avg_reward,
    successRate: t.success_rate,
  }));
}

function calculatePolicyImprovement(
  db: Database,
  sessionId: string
): {
  versions: number;
  qValueImprovement: number;
} {
  const policyVersions = db
    .prepare(
      `
    SELECT version, created_at, q_values
    FROM learning_policies
    WHERE session_id = ?
    ORDER BY version ASC
  `
    )
    .all(sessionId) as any[];

  if (policyVersions.length < 2) {
    return { versions: policyVersions.length, qValueImprovement: 0 };
  }

  const firstPolicy = JSON.parse(policyVersions[0].q_values);
  const latestPolicy = JSON.parse(policyVersions[policyVersions.length - 1].q_values);

  const commonKeys = Object.keys(firstPolicy).filter((k) => latestPolicy[k] !== undefined);
  if (commonKeys.length === 0) {
    return { versions: policyVersions.length, qValueImprovement: 0 };
  }

  const avgFirst = commonKeys.reduce((sum, k) => sum + firstPolicy[k], 0) / commonKeys.length;
  const avgLatest = commonKeys.reduce((sum, k) => sum + latestPolicy[k], 0) / commonKeys.length;

  return {
    versions: policyVersions.length,
    qValueImprovement: avgLatest - avgFirst,
  };
}

/**
 * Calculate reward with shaping
 */
export function calculateReward(
  options: {
    episodeId?: number;
    success: boolean;
    targetAchieved?: boolean;
    efficiencyScore?: number;
    qualityScore?: number;
    timeTakenMs?: number;
    expectedTimeMs?: number;
    includeCausal?: boolean;
    rewardFunction?: 'standard' | 'sparse' | 'dense' | 'shaped';
  },
  db?: Database
): number {
  const {
    episodeId,
    success,
    targetAchieved = true,
    efficiencyScore = 0.5,
    qualityScore = 0.5,
    timeTakenMs,
    expectedTimeMs,
    includeCausal = true,
    rewardFunction = 'standard',
  } = options;

  let reward = 0;

  switch (rewardFunction) {
    case 'sparse':
      reward = success && targetAchieved ? 1.0 : 0.0;
      break;

    case 'dense':
      reward = success ? 1.0 : 0.0;
      reward += targetAchieved ? 0.5 : 0.0;
      reward += qualityScore * 0.3;
      reward += efficiencyScore * 0.2;
      break;

    case 'shaped':
      reward = success ? 1.0 : -0.5;
      if (targetAchieved) reward += 0.3;

      if (timeTakenMs && expectedTimeMs) {
        const timeRatio = timeTakenMs / expectedTimeMs;
        const timeBonus = Math.max(0, 1 - timeRatio) * 0.2;
        reward += timeBonus;
      }

      reward += (qualityScore - 0.5) * 0.3;
      reward += (efficiencyScore - 0.5) * 0.2;
      break;

    case 'standard':
    default:
      reward = success ? 0.6 : 0.0;
      reward += targetAchieved ? 0.2 : 0.0;
      reward += qualityScore * 0.1;
      reward += efficiencyScore * 0.1;
      break;
  }

  // Causal impact adjustment
  if (includeCausal && episodeId && db) {
    const causalEdges = db
      .prepare(
        `
      SELECT AVG(uplift) as avg_uplift
      FROM causal_edges
      WHERE from_memory_id = ? OR to_memory_id = ?
    `
      )
      .get(episodeId, episodeId) as any;

    if (causalEdges?.avg_uplift) {
      reward += causalEdges.avg_uplift * 0.1;
    }
  }

  return Math.max(0, Math.min(1, reward));
}
