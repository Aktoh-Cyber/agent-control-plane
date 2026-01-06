/**
 * Embedding generation for semantic similarity
 * Uses local transformers.js - no API key required!
 */

import { env, pipeline } from '@xenova/transformers';
import { loadConfig } from './config.js';

// Configure transformers.js to use WASM backend only (avoid ONNX runtime issues)
// The native ONNX runtime causes "DefaultLogger not registered" errors in Node.js
env.backends.onnx.wasm.proxy = false; // Disable ONNX runtime proxy
env.backends.onnx.wasm.numThreads = 1; // Single thread for stability

let embeddingPipeline: any = null;
let isInitializing = false;
const embeddingCache = new Map<string, Float32Array>();

/**
 * Initialize the embedding pipeline (lazy load)
 */
async function initializeEmbeddings(): Promise<void> {
  if (embeddingPipeline) return;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  // Detect npx environment (known transformer initialization issues)
  const isNpxEnv =
    process.env.npm_lifecycle_event === 'npx' ||
    process.env.npm_execpath?.includes('npx') ||
    process.cwd().includes('/_npx/') ||
    process.cwd().includes('\\_npx\\');

  if (isNpxEnv && !process.env.FORCE_TRANSFORMERS) {
    console.log('[Embeddings] NPX environment detected - using hash-based embeddings');
    console.log('[Embeddings] For semantic search, install globally: npm install -g claude-flow');
    isInitializing = false;
    return;
  }

  isInitializing = true;
  console.log('[Embeddings] Initializing local embedding model (Xenova/all-MiniLM-L6-v2)...');
  console.log('[Embeddings] First run will download ~23MB model...');

  try {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true } // Smaller, faster
    );
    console.log('[Embeddings] Local model ready! (384 dimensions)');
  } catch (error: any) {
    console.error('[Embeddings] Failed to initialize:', error?.message || error);
    console.warn('[Embeddings] Falling back to hash-based embeddings');
  } finally {
    isInitializing = false;
  }
}

/**
 * Compute semantic embedding vector for text using local transformer model
 *
 * @description Uses Xenova/all-MiniLM-L6-v2 transformer model running locally via
 * transformers.js (WASM-based, no API key required). Automatically downloads model
 * on first use (~23MB). Falls back to deterministic hash-based embeddings in npx
 * environments or when model initialization fails.
 *
 * @param {string} text - Input text to embed (any length, will be truncated if needed)
 *
 * @returns {Promise<Float32Array>} 384-dimensional normalized embedding vector
 *
 * @example
 * ```typescript
 * // Generate embedding for a code snippet
 * const code = "function authenticate(user, password) { ... }";
 * const embedding = await computeEmbedding(code);
 *
 * console.log(embedding.length); // 384
 * console.log(embedding[0]); // 0.0234... (normalized values)
 * ```
 *
 * @example
 * ```typescript
 * // Compare semantic similarity
 * const query = "how to optimize database queries";
 * const doc1 = "use connection pooling for better performance";
 * const doc2 = "implement user authentication with JWT";
 *
 * const queryEmb = await computeEmbedding(query);
 * const doc1Emb = await computeEmbedding(doc1);
 * const doc2Emb = await computeEmbedding(doc2);
 *
 * const sim1 = cosineSimilarity(queryEmb, doc1Emb); // 0.82 (high)
 * const sim2 = cosineSimilarity(queryEmb, doc2Emb); // 0.23 (low)
 * ```
 *
 * @throws {Error} Never throws - falls back to hash-based embeddings on error
 *
 * @since 1.8.0
 *
 * @remarks
 * Features:
 * - No API key required (runs locally)
 * - Automatic model caching (~23MB download on first use)
 * - LRU cache for computed embeddings (max 1000 entries)
 * - TTL-based cache expiration (default 1 hour)
 * - Deterministic hash fallback for npx/CI environments
 *
 * Model details:
 * - Model: all-MiniLM-L6-v2 (sentence-transformers)
 * - Dimensions: 384
 * - Backend: WASM via transformers.js
 * - Pooling: Mean pooling
 * - Normalization: L2 normalized (unit vectors)
 *
 * Environment variables:
 * - FORCE_TRANSFORMERS: Force transformer model in npx environments
 */
export async function computeEmbedding(text: string): Promise<Float32Array> {
  const config = loadConfig();

  // Check cache
  const cacheKey = `local:${text}`;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  let embedding: Float32Array;

  // Initialize if needed
  await initializeEmbeddings();

  if (embeddingPipeline) {
    try {
      // Use transformers.js for real embeddings
      const output = await embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
      });
      embedding = new Float32Array(output.data);
    } catch (error: any) {
      console.error('[Embeddings] Generation failed:', error?.message || error);
      embedding = hashEmbed(text, 384); // Fallback
    }
  } else {
    // Fallback to hash-based embeddings
    const dims = config?.embeddings?.dimensions || 384;
    embedding = hashEmbed(text, dims);
  }

  // Cache with LRU (limit 1000 entries)
  if (embeddingCache.size > 1000) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) {
      embeddingCache.delete(firstKey);
    }
  }
  embeddingCache.set(cacheKey, embedding);

  // Set TTL for cache entry
  const ttl = config?.embeddings?.cache_ttl_seconds || 3600;
  setTimeout(() => embeddingCache.delete(cacheKey), ttl * 1000);

  return embedding;
}

/**
 * Batch compute embeddings for multiple texts (more efficient than individual calls)
 *
 * @description Processes multiple texts in parallel to generate embeddings efficiently.
 * Leverages Promise.all for concurrent processing and benefits from embedding cache.
 *
 * @param {string[]} texts - Array of texts to embed
 *
 * @returns {Promise<Float32Array[]>} Array of 384-dimensional embedding vectors
 *
 * @example
 * ```typescript
 * // Batch embed multiple documents
 * const documents = [
 *   "Implement JWT authentication",
 *   "Add database connection pooling",
 *   "Optimize API response caching",
 *   "Setup CI/CD pipeline"
 * ];
 *
 * const embeddings = await computeEmbeddingBatch(documents);
 * console.log(`Generated ${embeddings.length} embeddings`); // 4
 *
 * // Find most similar pair
 * let maxSim = 0;
 * for (let i = 0; i < embeddings.length; i++) {
 *   for (let j = i + 1; j < embeddings.length; j++) {
 *     const sim = cosineSimilarity(embeddings[i], embeddings[j]);
 *     if (sim > maxSim) maxSim = sim;
 *   }
 * }
 * ```
 *
 * @throws {Error} Never throws - individual failures use hash-based fallback
 *
 * @since 1.8.0
 */
export async function computeEmbeddingBatch(texts: string[]): Promise<Float32Array[]> {
  return Promise.all(texts.map((text) => computeEmbedding(text)));
}

/**
 * Get embedding dimensions
 */
export function getEmbeddingDimensions(): number {
  return 384; // all-MiniLM-L6-v2 uses 384 dimensions
}

/**
 * Deterministic hash-based embedding (fallback)
 */
function hashEmbed(text: string, dims: number): Float32Array {
  const hash = simpleHash(text);
  const vec = new Float32Array(dims);

  // Generate deterministic pseudo-random vector from hash
  for (let i = 0; i < dims; i++) {
    vec[i] = Math.sin(hash * (i + 1) * 0.01) + Math.cos(hash * i * 0.02);
  }

  return normalize(vec);
}

/**
 * Simple string hash function
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Normalize vector to unit length
 */
function normalize(vec: Float32Array): Float32Array {
  let mag = 0;
  for (let i = 0; i < vec.length; i++) {
    mag += vec[i] * vec[i];
  }
  mag = Math.sqrt(mag);

  if (mag === 0) return vec;

  for (let i = 0; i < vec.length; i++) {
    vec[i] /= mag;
  }
  return vec;
}

/**
 * Clear the in-memory embedding cache
 *
 * @description Removes all cached embeddings from memory. Useful for testing,
 * memory management, or when switching embedding models.
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Clear cache before tests
 * clearEmbeddingCache();
 *
 * // Generate fresh embeddings
 * const emb = await computeEmbedding("test");
 * ```
 *
 * @since 1.8.0
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}
