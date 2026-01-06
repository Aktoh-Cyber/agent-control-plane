/**
 * Memory Test Fixtures
 * Pre-configured memory and vector scenarios
 */

import { aMemory, aVector } from '../builders';

/**
 * Sample memories for testing
 */
export const sampleMemories = {
  shortTerm: () =>
    aMemory()
      .inNamespace('session')
      .withKey('current-task')
      .withValue({ task: 'coding', status: 'in_progress' })
      .withTTL(3600)
      .build(),

  longTerm: () =>
    aMemory()
      .asLongTerm()
      .inNamespace('persistent')
      .withKey('user-preferences')
      .withValue({ theme: 'dark', language: 'typescript' })
      .withImportance(0.95)
      .build(),

  episodic: () =>
    aMemory()
      .asEpisodic()
      .inNamespace('episodes')
      .withKey('project-milestone')
      .withValue({ milestone: 'v1.0.0', completed: true })
      .withContext('Project completion episode')
      .build(),

  semantic: () =>
    aMemory()
      .asSemantic()
      .inNamespace('knowledge')
      .withKey('concept-definition')
      .withValue({
        concept: 'closure',
        definition: 'A function bundled with references to its surrounding state',
      })
      .withConfidence(0.98)
      .build(),

  procedural: () =>
    aMemory()
      .asProcedural()
      .inNamespace('procedures')
      .withKey('deploy-process')
      .withValue({
        steps: ['build', 'test', 'deploy', 'verify'],
        order: 'sequential',
      })
      .build(),

  expiring: () =>
    aMemory()
      .asExpiring()
      .inNamespace('cache')
      .withKey('api-response')
      .withValue({ data: 'cached response', timestamp: Date.now() })
      .withTTL(300)
      .build(),
};

/**
 * Sample vectors for testing
 */
export const sampleVectors = {
  codeSnippet: () =>
    aVector()
      .fromText('function add(a, b) { return a + b; }')
      .withMetadata('type', 'code')
      .withMetadata('language', 'javascript')
      .inNamespace('code')
      .build(),

  documentation: () =>
    aVector()
      .fromText('This function adds two numbers and returns the result')
      .withMetadata('type', 'documentation')
      .withMetadata('category', 'reference')
      .inNamespace('docs')
      .build(),

  userQuery: () =>
    aVector()
      .fromText('How do I implement authentication in my app?')
      .withMetadata('type', 'query')
      .withMetadata('user', 'user-123')
      .inNamespace('queries')
      .build(),

  similar: () => {
    const base = aVector()
      .fromText('Machine learning algorithms')
      .withMetadata('topic', 'ml')
      .build();

    const similar = aVector().similarTo(base).withMetadata('topic', 'ml').build();

    return { base, similar };
  },
};

/**
 * Memory collection for testing
 */
export function createMemoryCollection(count: number = 10) {
  return Array.from({ length: count }, (_, i) =>
    aMemory()
      .withKey(`memory-${i + 1}`)
      .withValue({ index: i, data: `test-data-${i}` })
      .withImportance(Math.random())
      .build()
  );
}

/**
 * Vector collection for testing
 */
export function createVectorCollection(count: number = 10) {
  return Array.from({ length: count }, (_, i) =>
    aVector()
      .fromText(`Test document ${i + 1}`)
      .withMetadata('index', i)
      .build()
  );
}

/**
 * Memory namespace scenarios
 */
export const memoryNamespaces = {
  session: () => ({
    namespace: 'session',
    memories: [
      aMemory().withKey('current-user').withValue({ id: 'user-123' }).build(),
      aMemory().withKey('current-session').withValue({ started: Date.now() }).build(),
      aMemory().withKey('active-tasks').withValue(['task-1', 'task-2']).build(),
    ],
  }),

  persistent: () => ({
    namespace: 'persistent',
    memories: [
      aMemory().asLongTerm().withKey('user-profile').withValue({ name: 'Test User' }).build(),
      aMemory().asLongTerm().withKey('preferences').withValue({ theme: 'dark' }).build(),
      aMemory().asLongTerm().withKey('history').withValue([]).build(),
    ],
  }),

  cache: () => ({
    namespace: 'cache',
    memories: [
      aMemory().asExpiring().withKey('api-cache-1').withValue({ data: 'response' }).build(),
      aMemory().asExpiring().withKey('api-cache-2').withValue({ data: 'response' }).build(),
    ],
  }),
};

/**
 * Vector search scenarios
 */
export const vectorSearchScenarios = {
  /**
   * Similar code snippets
   */
  codeSearch: () => {
    const query = aVector().fromText('function to sort an array').build();

    const vectors = [
      aVector().fromText('function sortArray(arr) { return arr.sort(); }').withScore(0.95).build(),
      aVector().fromText('const sort = (arr) => arr.sort();').withScore(0.92).build(),
      aVector()
        .fromText('function reverseArray(arr) { return arr.reverse(); }')
        .withScore(0.45)
        .build(),
    ];

    return { query, vectors };
  },

  /**
   * Documentation search
   */
  docSearch: () => {
    const query = aVector().fromText('How to handle errors in async functions').build();

    const vectors = [
      aVector().fromText('Error handling in async/await with try-catch').withScore(0.98).build(),
      aVector().fromText('Promise error handling with .catch()').withScore(0.85).build(),
      aVector().fromText('Debugging async code').withScore(0.65).build(),
    ];

    return { query, vectors };
  },

  /**
   * Semantic search
   */
  semanticSearch: () => {
    const query = aVector().fromText('neural network architecture').build();

    const vectors = [
      aVector().fromText('Deep learning model architecture').withScore(0.94).build(),
      aVector().fromText('Convolutional neural networks').withScore(0.89).build(),
      aVector().fromText('Network topology design').withScore(0.55).build(),
    ];

    return { query, vectors };
  },
};

/**
 * Memory consolidation scenario
 */
export function createMemoryConsolidationScenario() {
  const shortTermMemories = Array.from({ length: 20 }, (_, i) =>
    aMemory()
      .withKey(`short-term-${i}`)
      .withValue({ event: `event-${i}`, timestamp: Date.now() - i * 1000 })
      .withImportance(Math.random())
      .withAccessCount(Math.floor(Math.random() * 10))
      .build()
  );

  const longTermMemories = Array.from({ length: 5 }, (_, i) =>
    aMemory()
      .asLongTerm()
      .withKey(`long-term-${i}`)
      .withValue({ summary: `important-event-${i}` })
      .withImportance(0.9 + Math.random() * 0.1)
      .asFrequentlyAccessed()
      .build()
  );

  return {
    shortTerm: shortTermMemories,
    longTerm: longTermMemories,
    shouldConsolidate: shortTermMemories.filter((m) => m.metadata.importance! > 0.7),
    shouldDiscard: shortTermMemories.filter((m) => m.metadata.importance! < 0.3),
  };
}
