/**
 * Migration Utilities
 *
 * Tools for migrating from legacy encryption to HIPAA-compliant AES-256-GCM
 *
 * @module security/migration
 */

import { EncryptedData, HIPAAEncryption } from './hipaa-encryption';

/**
 * Legacy encrypted data format (base64 placeholder)
 */
export interface LegacyEncryptedData {
  data: string; // Base64 encoded
  encoding?: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Migration success status */
  success: boolean;
  /** Number of records migrated */
  migrated: number;
  /** Number of records failed */
  failed: number;
  /** Error details */
  errors: Array<{ record: string; error: string }>;
  /** Migration duration (ms) */
  duration: number;
}

/**
 * Migration Utility for upgrading legacy encryption
 */
export class MigrationUtility {
  private readonly encryption: HIPAAEncryption;

  constructor(masterKey: string | Buffer) {
    this.encryption = new HIPAAEncryption(masterKey);
  }

  /**
   * Detect if data is using legacy base64 encryption
   *
   * @param data - Data to check
   * @returns True if legacy format detected
   */
  public static isLegacyFormat(data: unknown): data is LegacyEncryptedData {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Legacy format has simple 'data' field with base64
    // New format has ciphertext, iv, authTag, salt, version
    return (
      'data' in obj &&
      typeof obj.data === 'string' &&
      !('ciphertext' in obj) &&
      !('iv' in obj) &&
      !('authTag' in obj)
    );
  }

  /**
   * Decrypt legacy base64-encoded data
   *
   * @param legacyData - Legacy encrypted data
   * @returns Decrypted plaintext
   */
  public decryptLegacy(legacyData: LegacyEncryptedData): string {
    try {
      // Legacy format was just base64 encoding, not real encryption
      const decoded = Buffer.from(legacyData.data, 'base64').toString('utf8');
      return decoded;
    } catch (error) {
      throw new Error(
        `Failed to decrypt legacy data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Migrate single record from legacy to HIPAA encryption
   *
   * @param legacyData - Legacy encrypted data
   * @returns New encrypted data
   */
  public migrateSingle(legacyData: LegacyEncryptedData): EncryptedData {
    const plaintext = this.decryptLegacy(legacyData);
    return this.encryption.encrypt(plaintext);
  }

  /**
   * Migrate multiple records in batch
   *
   * @param records - Array of legacy encrypted records
   * @param onProgress - Progress callback
   * @returns Migration result
   */
  public async migrateBatch(
    records: Array<{ id: string; data: LegacyEncryptedData }>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrated: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        this.migrateSingle(record.data);
        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          record: record.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      if (onProgress) {
        onProgress(i + 1, records.length);
      }
    }

    result.duration = Date.now() - startTime;
    result.success = result.failed === 0;

    return result;
  }

  /**
   * Migrate data with automatic format detection
   *
   * @param data - Data to migrate (auto-detects format)
   * @returns Encrypted data (migrated or passed through)
   */
  public autoMigrate(data: unknown): EncryptedData {
    if (MigrationUtility.isLegacyFormat(data)) {
      return this.migrateSingle(data);
    }

    if (this.isNewFormat(data)) {
      return data;
    }

    throw new Error('Unknown data format - cannot migrate');
  }

  /**
   * Check if data is in new HIPAA format
   */
  private isNewFormat(data: unknown): data is EncryptedData {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;

    return (
      'ciphertext' in obj && 'iv' in obj && 'authTag' in obj && 'salt' in obj && 'version' in obj
    );
  }

  /**
   * Generate migration report
   *
   * @param records - Records to analyze
   * @returns Report of legacy vs new format counts
   */
  public static analyzeMigrationNeeds(records: unknown[]): {
    total: number;
    legacy: number;
    migrated: number;
    unknown: number;
  } {
    const report = {
      total: records.length,
      legacy: 0,
      migrated: 0,
      unknown: 0,
    };

    for (const record of records) {
      if (MigrationUtility.isLegacyFormat(record)) {
        report.legacy++;
      } else if (typeof record === 'object' && record !== null && 'ciphertext' in record) {
        report.migrated++;
      } else {
        report.unknown++;
      }
    }

    return report;
  }

  /**
   * Create migration script for database
   *
   * @param tableName - Database table name
   * @param columnName - Column containing encrypted data
   * @returns SQL migration script
   */
  public static generateMigrationSQL(tableName: string, columnName: string): string {
    return `
-- HIPAA Encryption Migration Script
-- Generated: ${new Date().toISOString()}
-- Table: ${tableName}
-- Column: ${columnName}

-- Step 1: Create backup table
CREATE TABLE ${tableName}_backup AS SELECT * FROM ${tableName};

-- Step 2: Add migration status column
ALTER TABLE ${tableName} ADD COLUMN migration_status VARCHAR(20) DEFAULT 'pending';

-- Step 3: Add new encrypted data column
ALTER TABLE ${tableName} ADD COLUMN ${columnName}_new TEXT;

-- Step 4: Migration will be performed by application code
-- Use MigrationUtility.migrateBatch() to process records

-- Step 5: After successful migration, verify all records
-- SELECT COUNT(*) FROM ${tableName} WHERE migration_status = 'completed';

-- Step 6: Rename columns (after verification)
-- ALTER TABLE ${tableName} DROP COLUMN ${columnName};
-- ALTER TABLE ${tableName} RENAME COLUMN ${columnName}_new TO ${columnName};
-- ALTER TABLE ${tableName} DROP COLUMN migration_status;

-- Step 7: Drop backup table (after final verification)
-- DROP TABLE ${tableName}_backup;
`.trim();
  }

  /**
   * Cleanup and destroy encryption instance
   */
  public destroy(): void {
    this.encryption.destroy();
  }
}

export default MigrationUtility;
