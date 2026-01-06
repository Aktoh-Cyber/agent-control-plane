/**
 * Maximal Marginal Relevance (MMR) for diversity in retrieval
 * Balances relevance and diversity in top-k selection
 */

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (denominator === 0) return 0;

  return dot / denominator;
}

/**
 * Maximal Marginal Relevance (MMR) selection for diversity-aware top-k retrieval
 *
 * @description Implements MMR algorithm to balance relevance and diversity in search results.
 * Iteratively selects items that are relevant to the query while being dissimilar to
 * already selected items, avoiding redundant results.
 *
 * @template T - Candidate type with score and embedding properties
 * @param {T[]} candidates - Scored candidates with embeddings
 * @param {Float32Array} queryEmbed - Query embedding for relevance scoring
 * @param {number} k - Number of items to select
 * @param {number} [lambda=0.5] - Balance between relevance (1.0) and diversity (0.0)
 *
 * @returns {T[]} Selected items with maximum marginal relevance
 *
 * @example
 * ```typescript
 * const candidates = [
 *   { id: 1, score: 0.95, embedding: emb1, title: "Connection pooling" },
 *   { id: 2, score: 0.93, embedding: emb2, title: "Database pooling" },  // Similar to #1
 *   { id: 3, score: 0.85, embedding: emb3, title: "Caching strategy" },  // Different topic
 *   { id: 4, score: 0.80, embedding: emb4, title: "Load balancing" }     // Different topic
 * ];
 *
 * // High relevance focus (lambda = 0.9)
 * const relevant = mmrSelection(candidates, queryEmb, 3, 0.9);
 * // Returns: [#1, #2, #3] - mostly by relevance score
 *
 * // Balanced relevance and diversity (lambda = 0.5)
 * const balanced = mmrSelection(candidates, queryEmb, 3, 0.5);
 * // Returns: [#1, #3, #4] - skips #2 (too similar to #1)
 *
 * // High diversity focus (lambda = 0.1)
 * const diverse = mmrSelection(candidates, queryEmb, 3, 0.1);
 * // Returns: [#1, #4, #3] - maximizes diversity
 * ```
 *
 * @since 1.8.0
 *
 * @remarks
 * MMR Formula: score = λ × relevance - (1-λ) × max_similarity
 * - λ (lambda) = 1.0: Pure relevance ranking (ignores diversity)
 * - λ (lambda) = 0.0: Pure diversity (ignores relevance)
 * - λ (lambda) = 0.5: Balanced approach (recommended)
 *
 * Algorithm:
 * 1. Start with top-scoring candidate
 * 2. For each iteration, select candidate that maximizes:
 *    λ × (relevance to query) - (1-λ) × (max similarity to selected items)
 * 3. Continue until k items selected or candidates exhausted
 *
 * Use cases:
 * - Search result diversification
 * - Recommendation systems
 * - Memory retrieval for LLMs
 * - Document summarization
 */
export function mmrSelection<T extends { score: number; embedding: Float32Array }>(
  candidates: T[],
  queryEmbed: Float32Array,
  k: number,
  lambda: number = 0.5
): T[] {
  if (candidates.length === 0) return [];
  if (k <= 0) return [];
  if (k >= candidates.length) return [...candidates];

  const selected: T[] = [];
  const remaining = [...candidates].sort((a, b) => b.score - a.score);

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];

      // Calculate max similarity to already selected items
      let maxSimilarity = 0;
      for (const sel of selected) {
        const sim = cosineSimilarity(item.embedding, sel.embedding);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }

      // MMR score balances relevance and diversity
      const mmrScore = lambda * item.score - (1 - lambda) * maxSimilarity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

export { cosineSimilarity };
