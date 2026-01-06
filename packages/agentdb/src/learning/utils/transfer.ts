/**
 * Transfer Learning Utilities
 * Knowledge transfer between sessions and tasks
 */

import { EmbeddingService } from '../../controllers/EmbeddingService.js';
import type { Database } from '../../types/database.js';
import type { TransferOptions } from '../types.js';
import { getLatestPolicy, savePolicy } from './policy.js';

/**
 * Calculate cosine similarity between embeddings
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Transfer learning between sessions or tasks
 */
export async function transferLearning(
  db: Database,
  embedder: EmbeddingService,
  options: TransferOptions
): Promise<any> {
  const {
    sourceSession,
    targetSession,
    sourceTask,
    targetTask,
    minSimilarity = 0.7,
    transferType = 'all',
    maxTransfers = 10,
  } = options;

  if (!sourceSession && !sourceTask) {
    throw new Error('Must specify either sourceSession or sourceTask');
  }

  if (!targetSession && !targetTask) {
    throw new Error('Must specify either targetSession or targetTask');
  }

  const transferred: any = {
    episodes: 0,
    skills: 0,
    causalEdges: 0,
    details: [],
  };

  // Transfer episodes
  if (transferType === 'episodes' || transferType === 'all') {
    const episodesTransferred = await transferEpisodes(
      db,
      embedder,
      sourceSession,
      sourceTask,
      targetSession,
      targetTask,
      minSimilarity,
      maxTransfers
    );
    transferred.episodes = episodesTransferred.count;
    transferred.details.push(...episodesTransferred.details);
  }

  // Transfer policy/Q-values
  if (sourceSession && targetSession && (transferType === 'all' || transferType === 'skills')) {
    const skillsTransferred = await transferSkills(
      db,
      embedder,
      sourceSession,
      targetSession,
      targetTask,
      minSimilarity
    );
    transferred.skills = skillsTransferred;
  }

  return {
    success: true,
    transferred,
    source: { session: sourceSession, task: sourceTask },
    target: { session: targetSession, task: targetTask },
    minSimilarity,
    transferType,
  };
}

async function transferEpisodes(
  db: Database,
  embedder: EmbeddingService,
  sourceSession: string | undefined,
  sourceTask: string | undefined,
  targetSession: string | undefined,
  targetTask: string | undefined,
  minSimilarity: number,
  maxTransfers: number
): Promise<{ count: number; details: any[] }> {
  const sourceEpisodes = db
    .prepare(
      `
    SELECT * FROM learning_experiences
    WHERE ${sourceSession ? 'session_id = ?' : 'state LIKE ?'}
    ORDER BY reward DESC
    LIMIT ?
  `
    )
    .all(sourceSession || `%${sourceTask}%`, maxTransfers) as any[];

  let count = 0;
  const details: any[] = [];

  for (const episode of sourceEpisodes) {
    // Check similarity if transferring between tasks
    if (sourceTask && targetTask) {
      const sourceEmbed = await embedder.embed(episode.state);
      const targetEmbed = await embedder.embed(targetTask);
      const similarity = cosineSimilarity(sourceEmbed, targetEmbed);

      if (similarity < minSimilarity) {
        continue;
      }

      details.push({
        type: 'episode',
        id: episode.id,
        similarity,
      });
    }

    // Insert transferred episode
    db.prepare(
      `
      INSERT INTO learning_experiences (
        session_id, state, action, reward, next_state, success, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      targetSession || episode.session_id,
      targetTask || episode.state,
      episode.action,
      episode.reward,
      episode.next_state,
      episode.success,
      Date.now(),
      JSON.stringify({ transferred_from: episode.id })
    );

    count++;
  }

  return { count, details };
}

async function transferSkills(
  db: Database,
  embedder: EmbeddingService,
  sourceSession: string,
  targetSession: string,
  targetTask: string | undefined,
  minSimilarity: number
): Promise<number> {
  const sourcePolicy = getLatestPolicy(db, sourceSession);
  const targetPolicy = getLatestPolicy(db, targetSession);

  let transferredQValues = 0;

  for (const [key, qValue] of Object.entries(sourcePolicy.qValues)) {
    const [state, action] = key.split('|');

    // Check if target has similar state
    if (targetTask) {
      const stateEmbed = await embedder.embed(state);
      const targetEmbed = await embedder.embed(targetTask);
      const similarity = cosineSimilarity(stateEmbed, targetEmbed);

      if (similarity >= minSimilarity) {
        const targetKey = `${targetTask}|${action}`;
        targetPolicy.qValues[targetKey] = qValue as number;
        transferredQValues++;
      }
    }
  }

  if (transferredQValues > 0) {
    savePolicy(db, targetSession, targetPolicy);
  }

  return transferredQValues;
}
