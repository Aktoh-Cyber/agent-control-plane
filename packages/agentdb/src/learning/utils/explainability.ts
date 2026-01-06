/**
 * Explainability Utilities
 * XAI (Explainable AI) for learning systems
 */

import { EmbeddingService } from '../../controllers/EmbeddingService.js';
import type { Database } from '../../types/database.js';
import type { ExplainOptions } from '../types.js';
import { cosineSimilarity } from './transfer.js';

/**
 * Explain action recommendations with XAI
 */
export async function explainAction(
  db: Database,
  embedder: EmbeddingService,
  options: ExplainOptions
): Promise<any> {
  const {
    query,
    k = 5,
    explainDepth = 'detailed',
    includeConfidence = true,
    includeEvidence = true,
    includeCausal = true,
  } = options;

  // Get query embedding
  const queryEmbed = await embedder.embed(query);

  // Find similar past experiences
  const allExperiences = db
    .prepare(
      `
    SELECT * FROM learning_experiences
    ORDER BY timestamp DESC
    LIMIT 100
  `
    )
    .all() as any[];

  const rankedExperiences: any[] = [];
  for (const exp of allExperiences) {
    const stateEmbed = await getStateEmbedding(db, embedder, exp.session_id, exp.state);
    const similarity = cosineSimilarity(queryEmbed, stateEmbed);

    rankedExperiences.push({
      ...exp,
      similarity,
    });
  }

  rankedExperiences.sort((a, b) => b.similarity - a.similarity);
  const topExperiences = rankedExperiences.slice(0, k);

  // Aggregate recommendations
  const actionScores = aggregateRecommendations(topExperiences, includeEvidence);

  // Calculate final scores
  const recommendations = Object.entries(actionScores).map(([action, data]) => ({
    action,
    confidence: data.count / topExperiences.length,
    avgReward: data.avgReward / data.count,
    successRate: data.successRate / data.count,
    supportingExamples: data.count,
    evidence: includeEvidence ? data.evidence.slice(0, 3) : undefined,
  }));

  recommendations.sort((a, b) => b.confidence - a.confidence);

  // Causal reasoning chains
  let causalChains: any[] = [];
  if (includeCausal) {
    causalChains = db
      .prepare(
        `
      SELECT * FROM causal_edges
      ORDER BY uplift DESC
      LIMIT 5
    `
      )
      .all() as any[];
  }

  const response: any = {
    query,
    recommendations: recommendations.slice(0, k),
    explainDepth,
  };

  if (explainDepth === 'detailed' || explainDepth === 'full') {
    response.reasoning = {
      similarExperiencesFound: topExperiences.length,
      avgSimilarity:
        topExperiences.reduce((sum, e) => sum + e.similarity, 0) / topExperiences.length,
      uniqueActions: recommendations.length,
    };
  }

  if (explainDepth === 'full') {
    response.causalChains = causalChains;
    response.allEvidence = topExperiences;
  }

  return response;
}

function aggregateRecommendations(
  experiences: any[],
  includeEvidence: boolean
): Record<string, { count: number; avgReward: number; successRate: number; evidence: any[] }> {
  const actionScores: Record<
    string,
    { count: number; avgReward: number; successRate: number; evidence: any[] }
  > = {};

  for (const exp of experiences) {
    if (!actionScores[exp.action]) {
      actionScores[exp.action] = {
        count: 0,
        avgReward: 0,
        successRate: 0,
        evidence: [],
      };
    }

    const score = actionScores[exp.action];
    score.count++;
    score.avgReward += exp.reward;
    score.successRate += exp.success ? 1 : 0;

    if (includeEvidence) {
      score.evidence.push({
        episodeId: exp.id,
        state: exp.state,
        reward: exp.reward,
        success: exp.success,
        similarity: exp.similarity,
        timestamp: exp.timestamp,
      });
    }
  }

  return actionScores;
}

async function getStateEmbedding(
  db: Database,
  embedder: EmbeddingService,
  sessionId: string,
  state: string
): Promise<Float32Array> {
  const existing = db
    .prepare(
      `
    SELECT embedding FROM learning_state_embeddings
    WHERE session_id = ? AND state = ?
  `
    )
    .get(sessionId, state) as any;

  if (existing) {
    return new Float32Array(existing.embedding.buffer);
  }

  const embedding = await embedder.embed(state);

  db.prepare(
    `
    INSERT INTO learning_state_embeddings (session_id, state, embedding)
    VALUES (?, ?, ?)
  `
  ).run(sessionId, state, Buffer.from(embedding.buffer));

  return embedding;
}
