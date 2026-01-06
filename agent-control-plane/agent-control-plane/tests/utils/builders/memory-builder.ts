/**
 * Memory Builder - Test Data Factory
 * Fluent API for creating test memory entries with realistic defaults
 */

export interface Memory {
  id: string;
  key: string;
  namespace: string;
  value: any;
  type: 'short_term' | 'long_term' | 'episodic' | 'semantic' | 'procedural';
  context?: string;
  embedding?: number[];
  metadata: {
    source?: string;
    confidence?: number;
    importance?: number;
    accessCount?: number;
    lastAccessed?: Date;
  };
  ttl?: number; // Time to live in seconds
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class MemoryBuilder {
  private data: Partial<Memory>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `mem-${MemoryBuilder.idCounter++}`,
      key: `test-key-${MemoryBuilder.idCounter}`,
      namespace: 'default',
      value: { test: true },
      type: 'short_term',
      metadata: {
        confidence: 0.9,
        importance: 0.5,
        accessCount: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Set memory ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set memory key
   */
  withKey(key: string): this {
    this.data.key = key;
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
   * Set value
   */
  withValue(value: any): this {
    this.data.value = value;
    return this;
  }

  /**
   * Set memory type
   */
  withType(type: Memory['type']): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set context
   */
  withContext(context: string): this {
    this.data.context = context;
    return this;
  }

  /**
   * Set embedding
   */
  withEmbedding(embedding: number[]): this {
    this.data.embedding = embedding;
    return this;
  }

  /**
   * Set source
   */
  fromSource(source: string): this {
    this.data.metadata = { ...this.data.metadata, source };
    return this;
  }

  /**
   * Set confidence
   */
  withConfidence(confidence: number): this {
    this.data.metadata = { ...this.data.metadata, confidence };
    return this;
  }

  /**
   * Set importance
   */
  withImportance(importance: number): this {
    this.data.metadata = { ...this.data.metadata, importance };
    return this;
  }

  /**
   * Set access count
   */
  withAccessCount(count: number): this {
    this.data.metadata = { ...this.data.metadata, accessCount: count };
    return this;
  }

  /**
   * Set TTL
   */
  withTTL(seconds: number): this {
    this.data.ttl = seconds;
    this.data.expiresAt = new Date(Date.now() + seconds * 1000);
    return this;
  }

  /**
   * Create long-term memory
   */
  asLongTerm(): this {
    this.data.type = 'long_term';
    this.data.metadata = {
      ...this.data.metadata,
      importance: 0.9,
    };
    return this;
  }

  /**
   * Create episodic memory
   */
  asEpisodic(): this {
    this.data.type = 'episodic';
    this.data.context = 'Episode context';
    return this;
  }

  /**
   * Create semantic memory
   */
  asSemantic(): this {
    this.data.type = 'semantic';
    this.data.metadata = {
      ...this.data.metadata,
      confidence: 0.95,
    };
    return this;
  }

  /**
   * Create procedural memory
   */
  asProcedural(): this {
    this.data.type = 'procedural';
    this.data.value = { steps: ['step1', 'step2', 'step3'] };
    return this;
  }

  /**
   * Create high importance memory
   */
  asHighImportance(): this {
    this.data.metadata = {
      ...this.data.metadata,
      importance: 0.95,
    };
    return this;
  }

  /**
   * Create frequently accessed memory
   */
  asFrequentlyAccessed(): this {
    this.data.metadata = {
      ...this.data.metadata,
      accessCount: 100,
      lastAccessed: new Date(),
    };
    return this;
  }

  /**
   * Create expiring memory
   */
  asExpiring(): this {
    this.data.ttl = 3600; // 1 hour
    this.data.expiresAt = new Date(Date.now() + 3600000);
    return this;
  }

  /**
   * Build the memory object
   */
  build(): Memory {
    return this.data as Memory;
  }

  /**
   * Create multiple memories
   */
  buildMany(count: number): Memory[] {
    const memories: Memory[] = [];
    for (let i = 0; i < count; i++) {
      memories.push(new MemoryBuilder().build());
    }
    return memories;
  }

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    MemoryBuilder.idCounter = 1;
  }
}

/**
 * Factory function for creating a memory builder
 */
export function aMemory(): MemoryBuilder {
  return new MemoryBuilder();
}

/**
 * Quick builder functions
 */
export const memoryBuilders = {
  shortTerm: () => aMemory().build(),
  longTerm: () => aMemory().asLongTerm().build(),
  episodic: () => aMemory().asEpisodic().build(),
  semantic: () => aMemory().asSemantic().build(),
  procedural: () => aMemory().asProcedural().build(),
  highImportance: () => aMemory().asHighImportance().build(),
  frequentlyAccessed: () => aMemory().asFrequentlyAccessed().build(),
  expiring: () => aMemory().asExpiring().build(),
  default: () => aMemory().build(),
};
