/**
 * Test Context Manager
 * Provides context and state management for tests
 */

import type { TestContext } from '../../../src/types/test-helpers.js';

export type { TestContext };

export class TestContextManager {
  private contexts: Map<string, TestContext> = new Map();
  private currentContext: TestContext | null = null;

  /**
   * Create new test context
   */
  createContext(
    name: string,
    metadata: import('../../../src/types/utilities.js').TypedRecord<
      string,
      import('../../../src/types/utilities.js').JsonValue
    > = {}
  ): TestContext {
    const context: TestContext = {
      name,
      metadata,
      data: new Map(),
      cleanup: [],
    };

    this.contexts.set(name, context);
    this.currentContext = context;

    return context;
  }

  /**
   * Get context by name
   */
  getContext(name: string): TestContext | undefined {
    return this.contexts.get(name);
  }

  /**
   * Get current context
   */
  getCurrentContext(): TestContext | null {
    return this.currentContext;
  }

  /**
   * Set current context
   */
  setCurrentContext(name: string): void {
    const context = this.contexts.get(name);

    if (!context) {
      throw new Error(`Context not found: ${name}`);
    }

    this.currentContext = context;
  }

  /**
   * Store data in current context
   */
  set<T>(key: string, value: T): void {
    if (!this.currentContext) {
      throw new Error('No current context');
    }

    this.currentContext.data.set(key, value);
  }

  /**
   * Retrieve data from current context
   */
  get<T>(key: string): T | undefined {
    if (!this.currentContext) {
      throw new Error('No current context');
    }

    return this.currentContext.data.get(key);
  }

  /**
   * Add cleanup function to current context
   */
  addCleanup(fn: () => void | Promise<void>): void {
    if (!this.currentContext) {
      throw new Error('No current context');
    }

    this.currentContext.cleanup.push(fn);
  }

  /**
   * Run cleanup for context
   */
  async cleanupContext(name: string): Promise<void> {
    const context = this.contexts.get(name);

    if (!context) {
      return;
    }

    // Run cleanup functions in reverse order
    for (const fn of [...context.cleanup].reverse()) {
      await fn();
    }

    context.cleanup = [];
    context.data.clear();
  }

  /**
   * Remove context
   */
  async removeContext(name: string): Promise<void> {
    await this.cleanupContext(name);
    this.contexts.delete(name);

    if (this.currentContext?.name === name) {
      this.currentContext = null;
    }
  }

  /**
   * Clear all contexts
   */
  async clearAll(): Promise<void> {
    for (const name of this.contexts.keys()) {
      await this.removeContext(name);
    }
  }

  /**
   * Get all context names
   */
  getContextNames(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get context count
   */
  getContextCount(): number {
    return this.contexts.size;
  }
}

/**
 * Create scoped test context
 */
export async function withContext<T>(
  name: string,
  fn: (context: TestContext) => T | Promise<T>,
  metadata: import('../../../src/types/utilities.js').TypedRecord<
    string,
    import('../../../src/types/utilities.js').JsonValue
  > = {}
): Promise<T> {
  const manager = new TestContextManager();
  const context = manager.createContext(name, metadata);

  try {
    return await fn(context);
  } finally {
    await manager.cleanupContext(name);
  }
}

/**
 * Create test suite context
 */
export function createTestSuite(suiteName: string) {
  const manager = new TestContextManager();
  const suiteContext = manager.createContext(suiteName);

  return {
    /**
     * Run test with context
     */
    async test<T>(testName: string, fn: (context: TestContext) => T | Promise<T>): Promise<T> {
      const testContext = manager.createContext(`${suiteName}:${testName}`, { parent: suiteName });

      try {
        return await fn(testContext);
      } finally {
        await manager.cleanupContext(testContext.name);
      }
    },

    /**
     * Setup suite
     */
    async beforeAll(fn: (context: TestContext) => void | Promise<void>): Promise<void> {
      await fn(suiteContext);
    },

    /**
     * Teardown suite
     */
    async afterAll(): Promise<void> {
      await manager.cleanupContext(suiteName);
    },

    /**
     * Get suite context
     */
    getContext(): TestContext {
      return suiteContext;
    },

    /**
     * Store suite-level data
     */
    setSuiteData<T>(key: string, value: T): void {
      suiteContext.data.set(key, value);
    },

    /**
     * Get suite-level data
     */
    getSuiteData<T>(key: string): T | undefined {
      return suiteContext.data.get(key);
    },
  };
}

/**
 * Context utilities object
 */
export const contextUtils = {
  TestContextManager,
  withContext,
  createTestSuite,
};
