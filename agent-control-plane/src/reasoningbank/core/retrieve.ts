/**
 * Memory Retrieval with MMR diversity
 * Algorithm 1 from ReasoningBank paper
 */

import * as db from '../db/queries.js';
import { loadConfig } from '../utils/config.js';
import { computeEmbedding } from '../utils/embeddings.js';
import { cosineSimilarity, mmrSelection } from '../utils/mmr.js';

export interface RetrievedMemory {
  id: string;
  title: string;
  description: string;
  content: string;
  score: number;
  components: {
    similarity: number;
    recency: number;
    reliability: number;
  };
}

/**
 * Retrieve top-k memories with MMR (Maximal Marginal Relevance) diversity
 *
 * Implements Algorithm 1 from the ReasoningBank paper (arXiv:2509.25140).
 * Retrieves the most relevant memories using a multi-factor scoring system
 * with diversity optimization to avoid redundant results.
 *
 * @description Performs semantic memory retrieval with intelligent ranking that balances
 * similarity, recency, and reliability. Uses MMR selection to ensure diverse results.
 *
 * @param {string} query - The semantic query text to match against stored memories
 * @param {Object} options - Optional retrieval configuration
 * @param {number} [options.k] - Number of memories to retrieve (default from config, typically 5-10)
 * @param {string} [options.domain] - Filter memories by domain (e.g., 'coding', 'data-analysis')
 * @param {string} [options.agent] - Filter memories by agent ID
 *
 * @returns {Promise<RetrievedMemory[]>} Array of retrieved memories with relevance scores
 *
 * @example
 * ```typescript
 * // Retrieve coding-related memories
 * const memories = await retrieveMemories("how to optimize database queries", {
 *   k: 5,
 *   domain: "database"
 * });
 *
 * // Access memory content and scores
 * memories.forEach(mem => {
 *   console.log(`Title: ${mem.title} (score: ${mem.score.toFixed(2)})`);
 *   console.log(`Similarity: ${mem.components.similarity.toFixed(2)}`);
 *   console.log(`Content: ${mem.content}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Retrieve agent-specific memories
 * const agentMemories = await retrieveMemories("debug authentication flow", {
 *   agent: "backend-agent-123",
 *   k: 3
 * });
 * ```
 *
 * @throws {Error} If embedding generation fails or database connection error occurs
 *
 * @since 1.8.0
 *
 * @remarks
 * Scoring formula: score = α·similarity + β·recency + γ·reliability - δ·diversityPenalty
 * - similarity: Cosine similarity to query embedding (0-1)
 * - recency: exp(-age_days / half_life) exponential decay
 * - reliability: min(confidence, 1.0) from past usage
 * - diversityPenalty: MMR penalty to reduce redundancy
 *
 * Default weights (configurable via ReasoningBank config):
 * - α (alpha): 0.7 - Similarity weight
 * - β (beta): 0.2 - Recency weight
 * - γ (gamma): 0.1 - Reliability weight
 * - δ (delta): 0.5 - Diversity penalty
 */
export async function retrieveMemories(
  query: string,
  options: { k?: number; domain?: string; agent?: string } = {}
): Promise<RetrievedMemory[]> {
  const config = loadConfig();
  const k = options.k || config.retrieve.k;
  const startTime = Date.now();

  console.log(`[INFO] Retrieving memories for query: ${query.substring(0, 100)}...`);

  // 1. Embed query
  const queryEmbed = await computeEmbedding(query);

  // 2. Fetch candidates from database
  const candidates = db.fetchMemoryCandidates({
    domain: options.domain,
    agent: options.agent,
    minConfidence: config.retrieve.min_score,
  });

  if (candidates.length === 0) {
    console.log('[INFO] No memory candidates found');
    return [];
  }

  console.log(`[INFO] Found ${candidates.length} candidates`);

  // 3. Score each candidate with 4-factor model
  const scored = candidates.map((item) => {
    const similarity = cosineSimilarity(queryEmbed, item.embedding);
    const recency = Math.exp(-item.age_days / config.retrieve.recency_half_life_days);
    const reliability = Math.min(item.confidence, 1.0);

    const baseScore =
      config.retrieve.alpha * similarity +
      config.retrieve.beta * recency +
      config.retrieve.gamma * reliability;

    return {
      ...item,
      score: baseScore,
      components: { similarity, recency, reliability },
    };
  });

  // 4. MMR selection for diversity
  const selected = mmrSelection(scored, queryEmbed, k, config.retrieve.delta);

  // 5. Record usage for selected memories
  for (const mem of selected) {
    db.incrementUsage(mem.id);
  }

  const duration = Date.now() - startTime;
  console.log(`[INFO] Retrieval complete: ${selected.length} memories in ${duration}ms`);
  db.logMetric('rb.retrieve.latency_ms', duration);

  return selected.map((item) => ({
    id: item.id,
    title: item.pattern_data.title,
    description: item.pattern_data.description,
    content: item.pattern_data.content,
    score: item.score,
    components: item.components,
  }));
}

/**
 * Format retrieved memories for injection into LLM system prompts
 *
 * @description Converts memory objects into a structured markdown format suitable
 * for LLM consumption. Creates a well-formatted section with memory titles,
 * descriptions, strategies, and confidence scores.
 *
 * @param {RetrievedMemory[]} memories - Array of memories to format
 *
 * @returns {string} Markdown-formatted text ready for prompt injection, or empty string if no memories
 *
 * @example
 * ```typescript
 * const memories = await retrieveMemories("optimize API performance");
 * const promptSection = formatMemoriesForPrompt(memories);
 *
 * const systemPrompt = `
 * You are an expert developer.
 * ${promptSection}
 *
 * Use the above memories to inform your response.
 * `;
 * ```
 *
 * @example
 * ```typescript
 * // Output format example:
 * // ## Relevant Memories from Past Experience
 * //
 * // ### Memory 1: Database Query Optimization
 * //
 * // Use connection pooling to reduce overhead
 * //
 * // **Strategy:**
 * // Implement connection pooling with max 10 connections...
 * //
 * // *Confidence: 85.2% | Similarity: 92.3%*
 * ```
 *
 * @since 1.8.0
 */
export function formatMemoriesForPrompt(memories: RetrievedMemory[]): string {
  if (memories.length === 0) {
    return '';
  }

  let formatted = '\n## Relevant Memories from Past Experience\n\n';

  for (let i = 0; i < memories.length; i++) {
    const mem = memories[i];
    formatted += `### Memory ${i + 1}: ${mem.title}\n\n`;
    formatted += `${mem.description}\n\n`;
    formatted += `**Strategy:**\n${mem.content}\n\n`;
    formatted += `*Confidence: ${(mem.score * 100).toFixed(1)}% | `;
    formatted += `Similarity: ${(mem.components.similarity * 100).toFixed(1)}%*\n\n`;
    formatted += '---\n\n';
  }

  return formatted;
}
