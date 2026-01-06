/**
 * Key Manager Tests
 *
 * Test suite for key generation, rotation, and management
 */

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { HIPAAEncryption } from '../../src/security/hipaa-encryption';
import { KeyManager, generateKey } from '../../src/security/key-manager';

describe('KeyManager', () => {
  let keyManager: KeyManager;
  let tempDir: string;
  let kek: string;

  beforeEach(async () => {
    // Create temporary directory for key storage
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'key-manager-test-'));
    keyManager = new KeyManager(tempDir, {
      maxKeyAge: 24 * 60 * 60 * 1000, // 1 day for testing
      autoRotate: false,
      gracePeriod: 60 * 60 * 1000, // 1 hour
    });

    // Generate KEK for testing
    kek = HIPAAEncryption.generateMasterKey();
  });

  afterEach(async () => {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Key Generation', () => {
    it('should generate new master key', async () => {
      const { key, metadata } = await keyManager.generateKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes hex = 64 chars
      expect(metadata.keyId).toBeDefined();
      expect(metadata.version).toBe(1);
      expect(metadata.active).toBe(true);
    });

    it('should generate unique key IDs', async () => {
      const { metadata: meta1 } = await keyManager.generateKey();
      const { metadata: meta2 } = await keyManager.generateKey();

      expect(meta1.keyId).not.toBe(meta2.keyId);
    });

    it('should include metadata', async () => {
      const { metadata } = await keyManager.generateKey({
        purpose: 'production-encryption',
      });

      expect(metadata.purpose).toBe('production-encryption');
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.lastRotated).toBeDefined();
    });

    it('should set expiration based on rotation policy', async () => {
      const { metadata } = await keyManager.generateKey();

      expect(metadata.expiresAt).toBeDefined();
      const expectedExpiration = metadata.createdAt + 24 * 60 * 60 * 1000;
      expect(metadata.expiresAt).toBeCloseTo(expectedExpiration, -2);
    });
  });

  describe('Key Storage', () => {
    it('should store key securely', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const files = await fs.readdir(tempDir);
      expect(files).toContain(`${metadata.keyId}.json`);
    });

    it('should encrypt key at rest', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const filePath = path.join(tempDir, `${metadata.keyId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const stored = JSON.parse(content);

      expect(stored.encryptedKey).toHaveProperty('ciphertext');
      expect(stored.encryptedKey).toHaveProperty('iv');
      expect(stored.encryptedKey).toHaveProperty('authTag');
      expect(content).not.toContain(key); // Key should not be plaintext
    });

    it('should store key metadata', async () => {
      const { key, metadata } = await keyManager.generateKey({
        purpose: 'test-key',
      });
      await keyManager.storeKey(key, metadata, kek);

      const filePath = path.join(tempDir, `${metadata.keyId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const stored = JSON.parse(content);

      expect(stored.metadata).toEqual(metadata);
    });

    it('should set restrictive file permissions', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const filePath = path.join(tempDir, `${metadata.keyId}.json`);
      const stats = await fs.stat(filePath);
      const mode = stats.mode & 0o777;

      expect(mode).toBe(0o600); // Owner read/write only
    });

    it('should include checksum for integrity', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const filePath = path.join(tempDir, `${metadata.keyId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const stored = JSON.parse(content);

      expect(stored.checksum).toBeDefined();
      expect(stored.checksum.length).toBe(64); // SHA-256 hex
    });
  });

  describe('Key Loading', () => {
    it('should load stored key', async () => {
      const { key: originalKey, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(originalKey, metadata, kek);

      const { key: loadedKey, metadata: loadedMetadata } = await keyManager.loadKey(
        metadata.keyId,
        kek
      );

      expect(loadedKey).toBe(originalKey);
      expect(loadedMetadata).toEqual(metadata);
    });

    it('should verify checksum on load', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      // Tamper with stored data
      const filePath = path.join(tempDir, `${metadata.keyId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const stored = JSON.parse(content);
      stored.checksum = 'invalid-checksum';
      await fs.writeFile(filePath, JSON.stringify(stored));

      await expect(keyManager.loadKey(metadata.keyId, kek)).rejects.toThrow(
        /integrity check failed/
      );
    });

    it('should fail with wrong KEK', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const wrongKek = HIPAAEncryption.generateMasterKey();
      await expect(keyManager.loadKey(metadata.keyId, wrongKek)).rejects.toThrow();
    });

    it('should fail for non-existent key', async () => {
      await expect(keyManager.loadKey('non-existent', kek)).rejects.toThrow();
    });
  });

  describe('Key Listing', () => {
    it('should list all stored keys', async () => {
      const { key: key1, metadata: meta1 } = await keyManager.generateKey();
      const { key: key2, metadata: meta2 } = await keyManager.generateKey();

      await keyManager.storeKey(key1, meta1, kek);
      await keyManager.storeKey(key2, meta2, kek);

      const keys = await keyManager.listKeys();

      expect(keys).toHaveLength(2);
      expect(keys.map((k) => k.keyId)).toContain(meta1.keyId);
      expect(keys.map((k) => k.keyId)).toContain(meta2.keyId);
    });

    it('should sort keys by creation date', async () => {
      const keys = [];

      for (let i = 0; i < 3; i++) {
        const { key, metadata } = await keyManager.generateKey();
        await keyManager.storeKey(key, metadata, kek);
        keys.push(metadata);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const listed = await keyManager.listKeys();

      expect(listed[0].createdAt).toBeGreaterThanOrEqual(listed[1].createdAt);
      expect(listed[1].createdAt).toBeGreaterThanOrEqual(listed[2].createdAt);
    });

    it('should return empty array for empty directory', async () => {
      const keys = await keyManager.listKeys();
      expect(keys).toEqual([]);
    });
  });

  describe('Active Key Management', () => {
    it('should get active key', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const activeKey = await keyManager.getActiveKey();

      expect(activeKey).toBeDefined();
      expect(activeKey?.keyId).toBe(metadata.keyId);
      expect(activeKey?.active).toBe(true);
    });

    it('should return null when no active key exists', async () => {
      const activeKey = await keyManager.getActiveKey();
      expect(activeKey).toBeNull();
    });

    it('should return most recent active key', async () => {
      const { key: key1, metadata: meta1 } = await keyManager.generateKey();
      await keyManager.storeKey(key1, meta1, kek);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const { key: key2, metadata: meta2 } = await keyManager.generateKey();
      await keyManager.storeKey(key2, meta2, kek);

      const activeKey = await keyManager.getActiveKey();

      expect(activeKey?.keyId).toBe(meta2.keyId);
    });
  });

  describe('Key Rotation', () => {
    it('should rotate key', async () => {
      const { key: oldKey, metadata: oldMeta } = await keyManager.generateKey();
      await keyManager.storeKey(oldKey, oldMeta, kek);

      const { key: newKey, metadata: newMeta } = await keyManager.rotateKey(kek);

      expect(newKey).not.toBe(oldKey);
      expect(newMeta.version).toBe(oldMeta.version + 1);
      expect(newMeta.active).toBe(true);

      // Old key should be deactivated
      const { metadata: loadedOldMeta } = await keyManager.loadKey(oldMeta.keyId, kek);
      expect(loadedOldMeta.active).toBe(false);
    });

    it('should detect when rotation is needed', async () => {
      const { key, metadata } = await keyManager.generateKey();

      // Set expiration to past
      metadata.expiresAt = Date.now() - 1000;
      await keyManager.storeKey(key, metadata, kek);

      expect(keyManager.needsRotation(metadata)).toBe(true);
    });

    it('should detect when rotation is not needed', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      expect(keyManager.needsRotation(metadata)).toBe(false);
    });
  });

  describe('Key Cleanup', () => {
    it('should cleanup old expired keys', async () => {
      const { key, metadata } = await keyManager.generateKey();

      // Set expiration way in the past
      metadata.expiresAt = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      metadata.active = false;
      await keyManager.storeKey(key, metadata, kek);

      const deleted = await keyManager.cleanupOldKeys(kek);

      expect(deleted).toBe(1);

      const keys = await keyManager.listKeys();
      expect(keys).toHaveLength(0);
    });

    it('should not cleanup keys in grace period', async () => {
      const { key, metadata } = await keyManager.generateKey();

      // Set expiration recent (within grace period)
      metadata.expiresAt = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      metadata.active = false;
      await keyManager.storeKey(key, metadata, kek);

      const deleted = await keyManager.cleanupOldKeys(kek);

      expect(deleted).toBe(0);
    });

    it('should not cleanup active keys', async () => {
      const { key, metadata } = await keyManager.generateKey();

      // Active key even if expired
      metadata.expiresAt = Date.now() - 10 * 24 * 60 * 60 * 1000;
      metadata.active = true;
      await keyManager.storeKey(key, metadata, kek);

      const deleted = await keyManager.cleanupOldKeys(kek);

      expect(deleted).toBe(0);
    });
  });

  describe('Key Backup/Import', () => {
    it('should export key for backup', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const backupPassword = 'secure-backup-password';
      const backup = await keyManager.exportKeyForBackup(metadata.keyId, kek, backupPassword);

      expect(backup).toBeDefined();
      expect(() => JSON.parse(backup)).not.toThrow();
    });

    it('should import key from backup', async () => {
      const { key, metadata } = await keyManager.generateKey({
        purpose: 'backup-test',
      });
      await keyManager.storeKey(key, metadata, kek);

      const backupPassword = 'secure-backup-password';
      const backup = await keyManager.exportKeyForBackup(metadata.keyId, kek, backupPassword);

      // Create new key manager with different storage
      const newTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'key-import-test-'));
      const newManager = new KeyManager(newTempDir);

      const imported = await newManager.importKeyFromBackup(backup, backupPassword, kek);

      expect(imported.keyId).toBe(metadata.keyId);
      expect(imported.purpose).toBe('backup-test');

      await fs.rm(newTempDir, { recursive: true, force: true });
    });

    it('should fail import with wrong password', async () => {
      const { key, metadata } = await keyManager.generateKey();
      await keyManager.storeKey(key, metadata, kek);

      const backup = await keyManager.exportKeyForBackup(metadata.keyId, kek, 'correct-password');

      await expect(keyManager.importKeyFromBackup(backup, 'wrong-password', kek)).rejects.toThrow();
    });
  });
});

describe('generateKey Convenience Function', () => {
  it('should generate key with defaults', async () => {
    const { key, metadata } = await generateKey();

    expect(key).toBeDefined();
    expect(metadata.keyId).toBeDefined();
    expect(metadata.version).toBe(1);
  });

  it('should accept custom metadata', async () => {
    const { metadata } = await generateKey({ purpose: 'test-purpose' });

    expect(metadata.purpose).toBe('test-purpose');
  });
});
