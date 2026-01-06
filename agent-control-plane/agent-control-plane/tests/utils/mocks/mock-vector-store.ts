/**
 * Mock Vector Store
 * In-memory vector database mock for testing
 */

export interface VectorRecord {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export class MockVectorStore {
  private vectors: Map<string, VectorRecord> = new Map();
  private namespaces: Map<string, Set<string>> = new Map();

  /**
   * Insert vector
   */
  async insert(
    id: string,
    embedding: number[],
    metadata: Record<string, any> = {},
    namespace: string = 'default'
  ): Promise<void> {
    this.vectors.set(id, { id, embedding, metadata });

    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Set());
    }

    this.namespaces.get(namespace)!.add(id);
  }

  /**
   * Insert batch of vectors
   */
  async insertBatch(
    vectors: Array<{ id: string; embedding: number[]; metadata?: Record<string, any> }>,
    namespace: string = 'default'
  ): Promise<void> {
    for (const vector of vectors) {
      await this.insert(vector.id, vector.embedding, vector.metadata || {}, namespace);
    }
  }

  /**
   * Search for similar vectors
   */
  async search(
    query: number[],
    options: {
      limit?: number;
      namespace?: string;
      filter?: Record<string, any>;
      minScore?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, namespace = 'default', filter, minScore = 0 } = options;

    const namespaceIds = this.namespaces.get(namespace);
    if (!namespaceIds) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const id of namespaceIds) {
      const vector = this.vectors.get(id);
      if (!vector) continue;

      // Apply metadata filter
      if (filter && !this.matchesFilter(vector.metadata, filter)) {
        continue;
      }

      const score = this.cosineSimilarity(query, vector.embedding);

      if (score >= minScore) {
        results.push({
          id: vector.id,
          score,
          metadata: vector.metadata,
        });
      }
    }

    // Sort by score descending and limit
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Get vector by ID
   */
  async get(id: string): Promise<VectorRecord | null> {
    return this.vectors.get(id) || null;
  }

  /**
   * Delete vector
   */
  async delete(id: string, namespace: string = 'default'): Promise<boolean> {
    const deleted = this.vectors.delete(id);

    const namespaceIds = this.namespaces.get(namespace);
    if (namespaceIds) {
      namespaceIds.delete(id);
    }

    return deleted;
  }

  /**
   * Delete all vectors in namespace
   */
  async deleteNamespace(namespace: string): Promise<number> {
    const namespaceIds = this.namespaces.get(namespace);

    if (!namespaceIds) {
      return 0;
    }

    let count = 0;
    for (const id of namespaceIds) {
      if (this.vectors.delete(id)) {
        count++;
      }
    }

    this.namespaces.delete(namespace);
    return count;
  }

  /**
   * Update vector metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<boolean> {
    const vector = this.vectors.get(id);

    if (!vector) {
      return false;
    }

    vector.metadata = { ...vector.metadata, ...metadata };
    return true;
  }

  /**
   * Count vectors in namespace
   */
  async count(namespace: string = 'default'): Promise<number> {
    const namespaceIds = this.namespaces.get(namespace);
    return namespaceIds ? namespaceIds.size : 0;
  }

  /**
   * List all namespaces
   */
  async listNamespaces(): Promise<string[]> {
    return Array.from(this.namespaces.keys());
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
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

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Check if metadata matches filter
   */
  private matchesFilter(metadata: Record<string, any>, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        return JSON.stringify(metadata[key]) === JSON.stringify(value);
      }
      return metadata[key] === value;
    });
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.vectors.clear();
    this.namespaces.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalVectors: this.vectors.size,
      namespaceCount: this.namespaces.size,
      vectorsByNamespace: Array.from(this.namespaces.entries()).reduce(
        (acc, [namespace, ids]) => {
          acc[namespace] = ids.size;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}

/**
 * Factory function for creating a mock vector store
 */
export function createMockVectorStore(): MockVectorStore {
  return new MockVectorStore();
}
