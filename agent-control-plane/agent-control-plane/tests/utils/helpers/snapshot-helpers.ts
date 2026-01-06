/**
 * Snapshot Testing Helpers
 * Utilities for snapshot-based testing
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface SnapshotOptions {
  snapshotDir?: string;
  updateSnapshots?: boolean;
  serializer?: (value: any) => string;
}

export class SnapshotManager {
  private snapshotDir: string;
  private updateSnapshots: boolean;
  private serializer: (value: any) => string;
  private snapshots: Map<string, any> = new Map();

  constructor(options: SnapshotOptions = {}) {
    this.snapshotDir = options.snapshotDir || './__snapshots__';
    this.updateSnapshots = options.updateSnapshots || false;
    this.serializer = options.serializer || this.defaultSerializer;
  }

  /**
   * Default serializer
   */
  private defaultSerializer(value: any): string {
    return JSON.stringify(value, null, 2);
  }

  /**
   * Get snapshot file path
   */
  private getSnapshotPath(testName: string): string {
    return path.join(this.snapshotDir, `${testName}.snap`);
  }

  /**
   * Load snapshot from file
   */
  private async loadSnapshot(testName: string): Promise<any> {
    const filePath = this.getSnapshotPath(testName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save snapshot to file
   */
  private async saveSnapshot(testName: string, value: any): Promise<void> {
    const filePath = this.getSnapshotPath(testName);

    await fs.mkdir(this.snapshotDir, { recursive: true });
    await fs.writeFile(filePath, this.serializer(value), 'utf-8');
  }

  /**
   * Match value against snapshot
   */
  async toMatchSnapshot(testName: string, value: any): Promise<boolean> {
    const snapshot = await this.loadSnapshot(testName);

    if (snapshot === null || this.updateSnapshots) {
      await this.saveSnapshot(testName, value);
      return true;
    }

    const serialized = this.serializer(value);
    const expected = this.serializer(snapshot);

    return serialized === expected;
  }

  /**
   * Assert value matches snapshot
   */
  async assertMatchesSnapshot(testName: string, value: any): Promise<void> {
    const matches = await this.toMatchSnapshot(testName, value);

    if (!matches) {
      const snapshot = await this.loadSnapshot(testName);
      throw new Error(
        `Snapshot mismatch for "${testName}":\n` +
          `Expected:\n${this.serializer(snapshot)}\n` +
          `Received:\n${this.serializer(value)}`
      );
    }
  }

  /**
   * Clear all snapshots
   */
  async clearSnapshots(): Promise<void> {
    try {
      await fs.rm(this.snapshotDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Get snapshot count
   */
  async getSnapshotCount(): Promise<number> {
    try {
      const files = await fs.readdir(this.snapshotDir);
      return files.filter((f) => f.endsWith('.snap')).length;
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Create inline snapshot matcher
 */
export function createInlineSnapshot() {
  let snapshots: Record<string, any> = {};

  return {
    /**
     * Match against inline snapshot
     */
    match(key: string, value: any): boolean {
      if (!(key in snapshots)) {
        snapshots[key] = value;
        return true;
      }

      return JSON.stringify(snapshots[key]) === JSON.stringify(value);
    },

    /**
     * Update snapshot
     */
    update(key: string, value: any): void {
      snapshots[key] = value;
    },

    /**
     * Clear all snapshots
     */
    clear(): void {
      snapshots = {};
    },

    /**
     * Get all snapshots
     */
    getAll(): Record<string, any> {
      return { ...snapshots };
    },
  };
}

/**
 * Snapshot utilities object
 */
export const snapshotUtils = {
  SnapshotManager,
  createInlineSnapshot,
};
