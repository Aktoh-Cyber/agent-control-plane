/**
 * ModuleLoader Test Suite
 *
 * Tests dependency injection for module loading
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  ModuleLoader,
  getDefaultLoader,
  resetDefaultLoader,
  setDefaultLoader,
} from '../../src/services/ModuleLoader.js';

describe('ModuleLoader', () => {
  let loader: ModuleLoader;

  beforeEach(() => {
    loader = new ModuleLoader();
    resetDefaultLoader();
  });

  describe('loadModule', () => {
    it('should load a valid module successfully', async () => {
      const result = await loader.loadModule('fs', { cache: false });

      expect(result.isAvailable).toBe(true);
      expect(result.module).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid module', async () => {
      const result = await loader.loadModule('non-existent-module-xyz', {
        cache: false,
        required: false,
      });

      expect(result.isAvailable).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error for required module that fails', async () => {
      await expect(
        loader.loadModule('non-existent-module-xyz', { required: true })
      ).rejects.toThrow('Required module');
    });

    it('should use fallback when module not available', async () => {
      const fallback = { custom: 'fallback' };
      const result = await loader.loadModule('non-existent-module', {
        required: false,
        fallback,
      });

      expect(result.isAvailable).toBe(false);
      expect(result.module).toBe(fallback);
    });

    it('should cache loaded modules', async () => {
      // First load
      const result1 = await loader.loadModule('path', { cache: true });
      expect(result1.isAvailable).toBe(true);

      // Second load (should use cache)
      const result2 = await loader.loadModule('path', { cache: true });
      expect(result2).toBe(result1); // Same object reference
    });

    it('should not cache when cache option is false', async () => {
      const result1 = await loader.loadModule('path', { cache: false });
      const result2 = await loader.loadModule('path', { cache: false });

      // Different calls, but both should succeed
      expect(result1.isAvailable).toBe(true);
      expect(result2.isAvailable).toBe(true);
    });
  });

  describe('isModuleAvailable', () => {
    it('should return true for available modules', async () => {
      const available = await loader.isModuleAvailable('fs');
      expect(available).toBe(true);
    });

    it('should return false for unavailable modules', async () => {
      const available = await loader.isModuleAvailable('non-existent-module-xyz');
      expect(available).toBe(false);
    });

    it('should cache availability checks', async () => {
      // First check
      const available1 = await loader.isModuleAvailable('path');
      expect(available1).toBe(true);

      // Second check (should use cache)
      const available2 = await loader.isModuleAvailable('path');
      expect(available2).toBe(true);
    });
  });

  describe('loadModules', () => {
    it('should load multiple modules in parallel', async () => {
      const moduleNames = ['fs', 'path', 'crypto'];
      const results = await loader.loadModules(moduleNames);

      expect(results.size).toBe(3);

      for (const name of moduleNames) {
        const result = results.get(name);
        expect(result).toBeDefined();
        expect(result!.isAvailable).toBe(true);
      }
    });

    it('should handle mixed success and failure', async () => {
      const moduleNames = ['fs', 'non-existent-module-xyz'];
      const results = await loader.loadModules(moduleNames, { required: false });

      expect(results.size).toBe(2);
      expect(results.get('fs')!.isAvailable).toBe(true);
      expect(results.get('non-existent-module-xyz')!.isAvailable).toBe(false);
    });
  });

  describe('custom resolvers', () => {
    it('should use custom resolver when provided', async () => {
      const customModule = { custom: 'data' };
      const customLoader = new ModuleLoader({
        customResolvers: new Map([['test-module', async () => customModule]]),
      });

      const result = await customLoader.loadModule('test-module');

      expect(result.isAvailable).toBe(true);
      expect(result.module).toBe(customModule);
    });

    it('should prioritize custom resolver over actual import', async () => {
      const customModule = { custom: 'override' };
      const customLoader = new ModuleLoader({
        customResolvers: new Map([['fs', async () => customModule]]),
      });

      const result = await customLoader.loadModule('fs');

      expect(result.isAvailable).toBe(true);
      expect(result.module).toBe(customModule);
    });

    it('should handle errors in custom resolvers', async () => {
      const customLoader = new ModuleLoader({
        customResolvers: new Map([
          [
            'error-module',
            async () => {
              throw new Error('Custom error');
            },
          ],
        ]),
      });

      const result = await customLoader.loadModule('error-module', {
        required: false,
      });

      expect(result.isAvailable).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Custom error');
    });
  });

  describe('file operations', () => {
    it('should check file existence asynchronously', async () => {
      const exists = await loader.fileExists(__filename);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const exists = await loader.fileExists('/non/existent/file.txt');
      expect(exists).toBe(false);
    });

    it('should check file existence synchronously', () => {
      const exists = loader.fileExistsSync(__filename);
      expect(exists).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Load a module to populate cache
      await loader.loadModule('path', { cache: true });

      let stats = loader.getCacheStats();
      expect(stats.size).toBe(1);

      // Clear cache
      loader.clearCache();

      stats = loader.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      // Load some modules
      await loader.loadModule('fs', { cache: true });
      await loader.loadModule('path', { cache: true });
      await loader.loadModule('non-existent', { cache: true, required: false });

      const stats = loader.getCacheStats();

      expect(stats.size).toBe(3);
      expect(stats.available).toBe(2);
      expect(stats.unavailable).toBe(1);
    });
  });

  describe('singleton pattern', () => {
    it('should return same default loader', () => {
      const loader1 = getDefaultLoader();
      const loader2 = getDefaultLoader();

      expect(loader1).toBe(loader2);
    });

    it('should allow setting custom default loader', () => {
      const customLoader = new ModuleLoader();
      setDefaultLoader(customLoader);

      const retrieved = getDefaultLoader();
      expect(retrieved).toBe(customLoader);
    });

    it('should reset default loader', () => {
      const loader1 = getDefaultLoader();
      resetDefaultLoader();
      const loader2 = getDefaultLoader();

      expect(loader1).not.toBe(loader2);
    });
  });

  describe('backwards compatibility', () => {
    it('should work as drop-in replacement for require()', async () => {
      // Old pattern: require('fs')
      const oldWay = require('fs');

      // New pattern: await loader.loadModule('fs')
      const result = await loader.loadModule('fs');

      expect(result.isAvailable).toBe(true);
      expect(result.module).toBeDefined();
      // Should have same properties as require()
      expect(result.module.existsSync).toBeDefined();
      expect(result.module.readFileSync).toBeDefined();
    });

    it('should work as drop-in replacement for dynamic import()', async () => {
      // Old pattern: await import('path')
      const oldWay = await import('path');

      // New pattern: await loader.loadModule('path')
      const result = await loader.loadModule('path');

      expect(result.isAvailable).toBe(true);
      expect(result.module).toBeDefined();
      // Should have same properties as import()
      expect(result.module.join).toBeDefined();
      expect(result.module.resolve).toBeDefined();
    });

    it('should handle ESM modules correctly', async () => {
      const result = await loader.loadModule('fs/promises');

      expect(result.isAvailable).toBe(true);
      expect(result.module).toBeDefined();
      expect(result.module.readFile).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should provide detailed error messages', async () => {
      const result = await loader.loadModule('non-existent-module', {
        required: false,
      });

      expect(result.error).toBeDefined();
      // Error message may vary between Node.js versions and module systems
      expect(result.error!.message).toMatch(
        /(Cannot find module|Failed to load|Does the file exist)/
      );
    });

    it('should preserve original error for debugging', async () => {
      const result = await loader.loadModule('invalid-module-path', {
        required: false,
      });

      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('performance', () => {
    it('should cache results for better performance', async () => {
      const startTime = Date.now();

      // First load (uncached)
      await loader.loadModule('crypto', { cache: true });
      const firstLoadTime = Date.now() - startTime;

      const cacheStartTime = Date.now();

      // Second load (cached)
      await loader.loadModule('crypto', { cache: true });
      const cacheLoadTime = Date.now() - cacheStartTime;

      // Cached load should be faster or equal (may be instant on fast systems)
      expect(cacheLoadTime).toBeLessThanOrEqual(firstLoadTime);
    });
  });
});
