/**
 * Module Loader Service - Dependency Injection for Dynamic Imports
 *
 * This service provides a clean abstraction for dynamic module loading,
 * replacing runtime patches and direct require() calls throughout AgentDB.
 *
 * Benefits:
 * - Testable: Easy to mock in unit tests
 * - Type-safe: Proper TypeScript types
 * - Flexible: Can swap implementations
 * - Clean: No runtime patching or monkey patching
 */

import * as fsSync from 'fs';
import * as fs from 'fs/promises';

export interface ModuleLoaderConfig {
  // Allow custom module resolution for testing
  customResolvers?: Map<string, () => Promise<any>>;
}

/**
 * Interface for loaded modules with common patterns
 */
export interface LoadedModule<T = any> {
  module: T;
  isAvailable: boolean;
  error?: Error;
}

/**
 * Module Loader Service
 *
 * Provides dependency injection for all dynamic imports and require() calls
 */
export class ModuleLoader {
  private config: ModuleLoaderConfig;
  private moduleCache: Map<string, LoadedModule> = new Map();

  constructor(config: ModuleLoaderConfig = {}) {
    this.config = config;
  }

  /**
   * Load a module dynamically with error handling
   *
   * @param moduleName - NPM package name or module path
   * @param options - Loading options
   * @returns LoadedModule with status and error info
   */
  async loadModule<T = any>(
    moduleName: string,
    options: {
      cache?: boolean;
      required?: boolean;
      fallback?: T;
    } = {}
  ): Promise<LoadedModule<T>> {
    const { cache = true, required = false, fallback } = options;

    // Check cache first
    if (cache && this.moduleCache.has(moduleName)) {
      return this.moduleCache.get(moduleName) as LoadedModule<T>;
    }

    // Check custom resolvers
    if (this.config.customResolvers?.has(moduleName)) {
      try {
        const resolver = this.config.customResolvers.get(moduleName)!;
        const module = await resolver();
        const result: LoadedModule<T> = {
          module,
          isAvailable: true,
        };

        if (cache) {
          this.moduleCache.set(moduleName, result);
        }

        return result;
      } catch (error) {
        const result: LoadedModule<T> = {
          module: fallback as T,
          isAvailable: false,
          error: error as Error,
        };

        if (required) {
          throw error;
        }

        return result;
      }
    }

    // Try dynamic import
    try {
      const module = await import(moduleName);
      const result: LoadedModule<T> = {
        module,
        isAvailable: true,
      };

      if (cache) {
        this.moduleCache.set(moduleName, result);
      }

      return result;
    } catch (error) {
      const result: LoadedModule<T> = {
        module: fallback as T,
        isAvailable: false,
        error: error as Error,
      };

      if (required) {
        throw new Error(
          `Required module '${moduleName}' could not be loaded: ${(error as Error).message}`
        );
      }

      if (cache) {
        this.moduleCache.set(moduleName, result);
      }

      return result;
    }
  }

  /**
   * Check if a module is available without loading it
   *
   * @param moduleName - Module to check
   * @returns true if module can be loaded
   */
  async isModuleAvailable(moduleName: string): Promise<boolean> {
    // Check cache first
    if (this.moduleCache.has(moduleName)) {
      return this.moduleCache.get(moduleName)!.isAvailable;
    }

    // Check custom resolvers
    if (this.config.customResolvers?.has(moduleName)) {
      return true;
    }

    // Try to load (will be cached)
    const result = await this.loadModule(moduleName, { cache: true });
    return result.isAvailable;
  }

  /**
   * Load multiple modules in parallel
   *
   * @param moduleNames - Array of module names
   * @returns Map of module names to LoadedModule results
   */
  async loadModules<T = any>(
    moduleNames: string[],
    options: { cache?: boolean; required?: boolean } = {}
  ): Promise<Map<string, LoadedModule<T>>> {
    const results = await Promise.all(moduleNames.map((name) => this.loadModule<T>(name, options)));

    const map = new Map<string, LoadedModule<T>>();
    moduleNames.forEach((name, index) => {
      map.set(name, results[index]);
    });

    return map;
  }

  /**
   * Check if a file exists (replaces fs.existsSync)
   *
   * @param filePath - Path to check
   * @returns true if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Synchronous file exists check (use sparingly)
   *
   * @param filePath - Path to check
   * @returns true if file exists
   */
  fileExistsSync(filePath: string): boolean {
    return fsSync.existsSync(filePath);
  }

  /**
   * Clear module cache
   */
  clearCache(): void {
    this.moduleCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    available: number;
    unavailable: number;
  } {
    const stats = {
      size: this.moduleCache.size,
      available: 0,
      unavailable: 0,
    };

    for (const result of this.moduleCache.values()) {
      if (result.isAvailable) {
        stats.available++;
      } else {
        stats.unavailable++;
      }
    }

    return stats;
  }
}

/**
 * Singleton instance for convenience
 */
let defaultLoader: ModuleLoader | null = null;

/**
 * Get default module loader instance
 */
export function getDefaultLoader(): ModuleLoader {
  if (!defaultLoader) {
    defaultLoader = new ModuleLoader();
  }
  return defaultLoader;
}

/**
 * Set custom default loader (useful for testing)
 */
export function setDefaultLoader(loader: ModuleLoader): void {
  defaultLoader = loader;
}

/**
 * Reset default loader
 */
export function resetDefaultLoader(): void {
  defaultLoader = null;
}
