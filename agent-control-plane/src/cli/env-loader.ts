/**
 * Environment loader - handles .env file loading
 */

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve as pathResolve } from 'path';

export class EnvLoader {
  /**
   * Load .env from current directory, or search up the directory tree
   */
  static loadRecursive(startPath: string = process.cwd()): boolean {
    let currentPath = startPath;
    const root = pathResolve('/');

    while (currentPath !== root) {
      const envPath = pathResolve(currentPath, '.env');
      if (existsSync(envPath)) {
        dotenv.config({ path: envPath });
        return true;
      }
      currentPath = pathResolve(currentPath, '..');
    }

    // Fallback to default behavior
    dotenv.config();
    return false;
  }
}
