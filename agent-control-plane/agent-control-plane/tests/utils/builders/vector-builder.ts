/**
 * Vector Builder - Test Data Factory
 * Fluent API for creating test vectors and embeddings with realistic defaults
 */

export interface Vector {
  id: string;
  embedding: number[];
  dimensions: number;
  metadata: {
    text?: string;
    type?: string;
    source?: string;
    timestamp?: Date;
    [key: string]: any;
  };
  namespace?: string;
  score?: number; // similarity score for search results
}

export class VectorBuilder {
  private data: Partial<Vector>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `vec-${VectorBuilder.idCounter++}`,
      embedding: this.generateRandomEmbedding(384),
      dimensions: 384,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * Generate random embedding
   */
  private generateRandomEmbedding(dimensions: number): number[] {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  }

  /**
   * Generate embedding from text (simple hash-based)
   */
  private generateEmbeddingFromText(text: string, dimensions: number): number[] {
    const embedding = new Array(dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (i * 7 + charCode) % dimensions;
      embedding[index] = Math.sin(charCode + i) * 0.5;
    }
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / norm);
  }

  /**
   * Set vector ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set embedding directly
   */
  withEmbedding(embedding: number[]): this {
    this.data.embedding = embedding;
    this.data.dimensions = embedding.length;
    return this;
  }

  /**
   * Generate embedding from text
   */
  fromText(text: string): this {
    this.data.embedding = this.generateEmbeddingFromText(text, this.data.dimensions || 384);
    this.data.metadata = {
      ...this.data.metadata,
      text,
    };
    return this;
  }

  /**
   * Set dimensions
   */
  withDimensions(dimensions: number): this {
    this.data.dimensions = dimensions;
    this.data.embedding = this.generateRandomEmbedding(dimensions);
    return this;
  }

  /**
   * Set namespace
   */
  inNamespace(namespace: string): this {
    this.data.namespace = namespace;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(key: string, value: any): this {
    this.data.metadata = { ...this.data.metadata, [key]: value };
    return this;
  }

  /**
   * Set text metadata
   */
  withText(text: string): this {
    this.data.metadata = { ...this.data.metadata, text };
    return this;
  }

  /**
   * Set type metadata
   */
  withType(type: string): this {
    this.data.metadata = { ...this.data.metadata, type };
    return this;
  }

  /**
   * Set source metadata
   */
  fromSource(source: string): this {
    this.data.metadata = { ...this.data.metadata, source };
    return this;
  }

  /**
   * Set similarity score
   */
  withScore(score: number): this {
    this.data.score = score;
    return this;
  }

  /**
   * Create OpenAI-compatible embedding (1536 dimensions)
   */
  asOpenAIEmbedding(): this {
    this.data.dimensions = 1536;
    this.data.embedding = this.generateRandomEmbedding(1536);
    this.data.metadata = {
      ...this.data.metadata,
      type: 'openai',
    };
    return this;
  }

  /**
   * Create small embedding (384 dimensions)
   */
  asSmallEmbedding(): this {
    this.data.dimensions = 384;
    this.data.embedding = this.generateRandomEmbedding(384);
    return this;
  }

  /**
   * Create large embedding (4096 dimensions)
   */
  asLargeEmbedding(): this {
    this.data.dimensions = 4096;
    this.data.embedding = this.generateRandomEmbedding(4096);
    return this;
  }

  /**
   * Create normalized embedding
   */
  asNormalized(): this {
    const norm = Math.sqrt(this.data.embedding!.reduce((sum, val) => sum + val * val, 0));
    this.data.embedding = this.data.embedding!.map((val) => val / norm);
    return this;
  }

  /**
   * Create similar vector (cosine similarity > 0.8)
   */
  similarTo(vector: Vector): this {
    // Create embedding similar to reference vector
    const noise = 0.2;
    this.data.embedding = vector.embedding.map((val) => val + (Math.random() * 2 - 1) * noise);
    this.data.dimensions = vector.dimensions;
    return this.asNormalized();
  }

  /**
   * Build the vector object
   */
  build(): Vector {
    return this.data as Vector;
  }

  /**
   * Create multiple vectors
   */
  buildMany(count: number): Vector[] {
    const vectors: Vector[] = [];
    for (let i = 0; i < count; i++) {
      vectors.push(new VectorBuilder().build());
    }
    return vectors;
  }

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    VectorBuilder.idCounter = 1;
  }
}

/**
 * Factory function for creating a vector builder
 */
export function aVector(): VectorBuilder {
  return new VectorBuilder();
}

/**
 * Quick builder functions
 */
export const vectorBuilders = {
  openai: () => aVector().asOpenAIEmbedding().build(),
  small: () => aVector().asSmallEmbedding().build(),
  large: () => aVector().asLargeEmbedding().build(),
  normalized: () => aVector().asNormalized().build(),
  default: () => aVector().build(),
};

/**
 * Vector similarity utilities
 */
export const vectorUtils = {
  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    return normA === 0 || normB === 0 ? 0 : dotProduct / (normA * normB);
  },

  /**
   * Calculate Euclidean distance between two vectors
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  },
};
