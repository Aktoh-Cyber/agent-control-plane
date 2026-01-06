/**
 * Migration Utility Tests
 *
 * Test suite for migrating from legacy to HIPAA encryption
 */

import { HIPAAEncryption } from '../../src/security/hipaa-encryption';
import { MigrationUtility, type LegacyEncryptedData } from '../../src/security/migration';

describe('MigrationUtility', () => {
  let migration: MigrationUtility;
  let masterKey: string;

  beforeEach(() => {
    masterKey = HIPAAEncryption.generateMasterKey();
    migration = new MigrationUtility(masterKey);
  });

  afterEach(() => {
    migration.destroy();
  });

  describe('Legacy Format Detection', () => {
    it('should detect legacy format', () => {
      const legacy: LegacyEncryptedData = {
        data: Buffer.from('test').toString('base64'),
      };

      expect(MigrationUtility.isLegacyFormat(legacy)).toBe(true);
    });

    it('should detect new format', () => {
      const encryption = new HIPAAEncryption(masterKey);
      const newFormat = encryption.encrypt('test');

      expect(MigrationUtility.isLegacyFormat(newFormat)).toBe(false);

      encryption.destroy();
    });

    it('should reject invalid formats', () => {
      expect(MigrationUtility.isLegacyFormat(null)).toBe(false);
      expect(MigrationUtility.isLegacyFormat(undefined)).toBe(false);
      expect(MigrationUtility.isLegacyFormat('string')).toBe(false);
      expect(MigrationUtility.isLegacyFormat(123)).toBe(false);
      expect(MigrationUtility.isLegacyFormat({})).toBe(false);
    });
  });

  describe('Legacy Decryption', () => {
    it('should decrypt legacy base64 data', () => {
      const plaintext = 'Sensitive patient data';
      const legacy: LegacyEncryptedData = {
        data: Buffer.from(plaintext).toString('base64'),
      };

      const decrypted = migration.decryptLegacy(legacy);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle Unicode in legacy data', () => {
      const plaintext = '你好 Patient Record 🏥';
      const legacy: LegacyEncryptedData = {
        data: Buffer.from(plaintext).toString('base64'),
      };

      const decrypted = migration.decryptLegacy(legacy);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty legacy data', () => {
      const legacy: LegacyEncryptedData = {
        data: Buffer.from('').toString('base64'),
      };

      const decrypted = migration.decryptLegacy(legacy);

      expect(decrypted).toBe('');
    });
  });

  describe('Single Record Migration', () => {
    it('should migrate legacy record to new format', () => {
      const plaintext = 'Patient medical record';
      const legacy: LegacyEncryptedData = {
        data: Buffer.from(plaintext).toString('base64'),
      };

      const migrated = migration.migrateSingle(legacy);

      expect(migrated).toHaveProperty('ciphertext');
      expect(migrated).toHaveProperty('iv');
      expect(migrated).toHaveProperty('authTag');
      expect(migrated).toHaveProperty('salt');
      expect(migrated).toHaveProperty('version');
    });

    it('should preserve data integrity during migration', () => {
      const plaintext = 'Critical health information';
      const legacy: LegacyEncryptedData = {
        data: Buffer.from(plaintext).toString('base64'),
      };

      const migrated = migration.migrateSingle(legacy);

      const encryption = new HIPAAEncryption(masterKey);
      const decrypted = encryption.decrypt(migrated);

      expect(decrypted).toBe(plaintext);

      encryption.destroy();
    });
  });

  describe('Batch Migration', () => {
    it('should migrate multiple records', async () => {
      const records = [
        {
          id: 'patient-1',
          data: { data: Buffer.from('Record 1').toString('base64') },
        },
        {
          id: 'patient-2',
          data: { data: Buffer.from('Record 2').toString('base64') },
        },
        {
          id: 'patient-3',
          data: { data: Buffer.from('Record 3').toString('base64') },
        },
      ];

      const result = await migration.migrateBatch(records);

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should track progress during migration', async () => {
      const records = Array.from({ length: 10 }, (_, i) => ({
        id: `record-${i}`,
        data: { data: Buffer.from(`Data ${i}`).toString('base64') },
      }));

      const progress: number[] = [];
      const result = await migration.migrateBatch(records, (processed, total) => {
        progress.push(processed);
      });

      expect(progress).toHaveLength(10);
      expect(progress[progress.length - 1]).toBe(10);
      expect(result.migrated).toBe(10);
    });

    it('should handle partial failures', async () => {
      const records = [
        {
          id: 'valid-1',
          data: { data: Buffer.from('Valid').toString('base64') },
        },
        {
          id: 'invalid',
          data: { data: 'invalid-base64!!!' },
        },
        {
          id: 'valid-2',
          data: { data: Buffer.from('Valid').toString('base64') },
        },
      ];

      const result = await migration.migrateBatch(records);

      expect(result.success).toBe(false);
      expect(result.migrated).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].record).toBe('invalid');
    });

    it('should measure migration duration', async () => {
      const records = [
        {
          id: 'test-1',
          data: { data: Buffer.from('Test').toString('base64') },
        },
      ];

      const result = await migration.migrateBatch(records);

      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(1000); // Should be fast
    });
  });

  describe('Auto-Migration', () => {
    it('should auto-detect and migrate legacy format', () => {
      const legacy: LegacyEncryptedData = {
        data: Buffer.from('Test data').toString('base64'),
      };

      const result = migration.autoMigrate(legacy);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
    });

    it('should pass through new format unchanged', () => {
      const encryption = new HIPAAEncryption(masterKey);
      const newFormat = encryption.encrypt('Test data');

      const result = migration.autoMigrate(newFormat);

      expect(result).toEqual(newFormat);

      encryption.destroy();
    });

    it('should reject unknown formats', () => {
      expect(() => migration.autoMigrate({ unknown: 'format' })).toThrow(/Unknown data format/);
    });
  });

  describe('Migration Analysis', () => {
    it('should analyze migration needs', () => {
      const records = [
        { data: Buffer.from('Legacy 1').toString('base64') }, // Legacy
        { data: Buffer.from('Legacy 2').toString('base64') }, // Legacy
        {
          ciphertext: 'abc',
          iv: 'def',
          authTag: 'ghi',
          salt: 'jkl',
          version: '1.0',
          timestamp: Date.now(),
        }, // New
        { unknown: 'format' }, // Unknown
      ];

      const report = MigrationUtility.analyzeMigrationNeeds(records);

      expect(report.total).toBe(4);
      expect(report.legacy).toBe(2);
      expect(report.migrated).toBe(1);
      expect(report.unknown).toBe(1);
    });

    it('should handle empty record set', () => {
      const report = MigrationUtility.analyzeMigrationNeeds([]);

      expect(report.total).toBe(0);
      expect(report.legacy).toBe(0);
      expect(report.migrated).toBe(0);
      expect(report.unknown).toBe(0);
    });
  });

  describe('SQL Migration Script Generation', () => {
    it('should generate SQL migration script', () => {
      const sql = MigrationUtility.generateMigrationSQL('patients', 'medical_data');

      expect(sql).toContain('CREATE TABLE patients_backup');
      expect(sql).toContain('ALTER TABLE patients');
      expect(sql).toContain('medical_data');
      expect(sql).toContain('migration_status');
      expect(sql).toContain('medical_data_new');
    });

    it('should include all migration steps', () => {
      const sql = MigrationUtility.generateMigrationSQL('records', 'encrypted_field');

      expect(sql).toContain('Step 1: Create backup');
      expect(sql).toContain('Step 2: Add migration status');
      expect(sql).toContain('Step 3: Add new encrypted data column');
      expect(sql).toContain('Step 4: Migration will be performed');
      expect(sql).toContain('Step 5: After successful migration');
      expect(sql).toContain('Step 6: Rename columns');
      expect(sql).toContain('Step 7: Drop backup table');
    });

    it('should include timestamp', () => {
      const sql = MigrationUtility.generateMigrationSQL('test', 'data');

      expect(sql).toContain('Generated:');
      expect(sql).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
    });
  });

  describe('Memory Cleanup', () => {
    it('should cleanup migration utility', () => {
      const util = new MigrationUtility(masterKey);
      util.destroy();

      // Should not throw - just cleanup
      expect(() => util.destroy()).not.toThrow();
    });
  });
});
