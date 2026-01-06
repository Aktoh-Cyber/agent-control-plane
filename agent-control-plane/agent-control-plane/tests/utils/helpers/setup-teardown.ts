/**
 * Setup and Teardown Helpers
 * Utilities for test lifecycle management
 */

type SetupFn = () => void | Promise<void>;
type TeardownFn = () => void | Promise<void>;

export class TestLifecycle {
  private setupFns: SetupFn[] = [];
  private teardownFns: TeardownFn[] = [];
  private resources: Map<string, any> = new Map();

  /**
   * Register setup function
   */
  beforeEach(fn: SetupFn): this {
    this.setupFns.push(fn);
    return this;
  }

  /**
   * Register teardown function
   */
  afterEach(fn: TeardownFn): this {
    this.teardownFns.push(fn);
    return this;
  }

  /**
   * Run all setup functions
   */
  async runSetup(): Promise<void> {
    for (const fn of this.setupFns) {
      await fn();
    }
  }

  /**
   * Run all teardown functions
   */
  async runTeardown(): Promise<void> {
    // Run teardown in reverse order
    for (const fn of [...this.teardownFns].reverse()) {
      await fn();
    }
  }

  /**
   * Store resource for cleanup
   */
  addResource(name: string, resource: any): void {
    this.resources.set(name, resource);
  }

  /**
   * Get stored resource
   */
  getResource<T>(name: string): T | undefined {
    return this.resources.get(name);
  }

  /**
   * Clear all resources
   */
  clearResources(): void {
    this.resources.clear();
  }

  /**
   * Reset lifecycle
   */
  reset(): void {
    this.setupFns = [];
    this.teardownFns = [];
    this.resources.clear();
  }
}

/**
 * Create isolated test environment
 */
export function createTestEnvironment() {
  const lifecycle = new TestLifecycle();
  const cleanup: TeardownFn[] = [];

  const env = {
    /**
     * Add cleanup function
     */
    addCleanup(fn: TeardownFn): void {
      cleanup.push(fn);
    },

    /**
     * Run all cleanup functions
     */
    async cleanup(): Promise<void> {
      for (const fn of [...cleanup].reverse()) {
        await fn();
      }
      cleanup.length = 0;
    },

    /**
     * Set environment variable
     */
    setEnv(key: string, value: string): void {
      const original = process.env[key];
      process.env[key] = value;

      this.addCleanup(() => {
        if (original !== undefined) {
          process.env[key] = original;
        } else {
          delete process.env[key];
        }
      });
    },

    /**
     * Mock global object
     */
    mockGlobal<T>(name: string, value: T): void {
      const original = (global as any)[name];
      (global as any)[name] = value;

      this.addCleanup(() => {
        if (original !== undefined) {
          (global as any)[name] = original;
        } else {
          delete (global as any)[name];
        }
      });
    },

    /**
     * Store value for test
     */
    store<T>(key: string, value: T): void {
      lifecycle.addResource(key, value);
    },

    /**
     * Retrieve stored value
     */
    get<T>(key: string): T | undefined {
      return lifecycle.getResource<T>(key);
    },
  };

  return env;
}

/**
 * Create temporary directory for tests
 */
export async function createTempDir(): Promise<string> {
  const os = await import('os');
  const path = await import('path');
  const fs = await import('fs/promises');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));

  return tmpDir;
}

/**
 * Cleanup temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  const fs = await import('fs/promises');

  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors during cleanup
  }
}

/**
 * Setup database for testing
 */
export interface DatabaseTestConfig {
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  seed?: () => Promise<void>;
  clear?: () => Promise<void>;
}

export function setupDatabase(config: DatabaseTestConfig = {}) {
  return {
    async beforeAll(): Promise<void> {
      if (config.setup) {
        await config.setup();
      }
    },

    async beforeEach(): Promise<void> {
      if (config.clear) {
        await config.clear();
      }
      if (config.seed) {
        await config.seed();
      }
    },

    async afterEach(): Promise<void> {
      if (config.clear) {
        await config.clear();
      }
    },

    async afterAll(): Promise<void> {
      if (config.teardown) {
        await config.teardown();
      }
    },
  };
}

/**
 * Setup utilities object
 */
export const setupUtils = {
  createTestEnvironment,
  createTempDir,
  cleanupTempDir,
  setupDatabase,
  TestLifecycle,
};
