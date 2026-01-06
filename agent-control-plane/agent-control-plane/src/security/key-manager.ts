/**
 * Key Management Utilities
 *
 * Secure key generation, rotation, and storage utilities for HIPAA compliance
 *
 * @module security/key-manager
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EncryptedData, HIPAAEncryption } from './hipaa-encryption';

/**
 * Key metadata
 */
export interface KeyMetadata {
  /** Unique key identifier */
  keyId: string;
  /** Key version number */
  version: number;
  /** Creation timestamp */
  createdAt: number;
  /** Expiration timestamp (optional) */
  expiresAt?: number;
  /** Whether key is currently active */
  active: boolean;
  /** Key purpose/description */
  purpose?: string;
  /** Last rotation timestamp */
  lastRotated?: number;
}

/**
 * Key storage format (encrypted)
 */
export interface KeyStorage {
  /** Key metadata */
  metadata: KeyMetadata;
  /** Encrypted key data */
  encryptedKey: EncryptedData;
  /** Key checksum for integrity */
  checksum: string;
}

/**
 * Key rotation policy
 */
export interface KeyRotationPolicy {
  /** Maximum key age in milliseconds */
  maxKeyAge: number;
  /** Automatic rotation enabled */
  autoRotate: boolean;
  /** Grace period for old keys (milliseconds) */
  gracePeriod: number;
}

/**
 * Key Manager for HIPAA Encryption
 *
 * Manages master key lifecycle:
 * - Key generation with cryptographic randomness
 * - Secure key storage (encrypted at rest)
 * - Key rotation with grace periods
 * - Key versioning and metadata
 * - Integration with secrets managers
 */
export class KeyManager {
  private readonly keyStoragePath: string;
  private readonly rotationPolicy: KeyRotationPolicy;

  constructor(keyStoragePath: string = './.keys', rotationPolicy: Partial<KeyRotationPolicy> = {}) {
    this.keyStoragePath = keyStoragePath;
    this.rotationPolicy = {
      maxKeyAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      autoRotate: false,
      gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...rotationPolicy,
    };
  }

  /**
   * Generate a new cryptographically secure master key
   *
   * @param metadata - Key metadata
   * @returns Generated key (hex-encoded) and metadata
   */
  public async generateKey(
    metadata: Partial<KeyMetadata> = {}
  ): Promise<{ key: string; metadata: KeyMetadata }> {
    const key = HIPAAEncryption.generateMasterKey();

    const keyMetadata: KeyMetadata = {
      keyId: this.generateKeyId(),
      version: 1,
      createdAt: Date.now(),
      active: true,
      lastRotated: Date.now(),
      ...metadata,
    };

    if (this.rotationPolicy.maxKeyAge > 0) {
      keyMetadata.expiresAt = Date.now() + this.rotationPolicy.maxKeyAge;
    }

    return { key, metadata: keyMetadata };
  }

  /**
   * Generate unique key identifier
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Calculate key checksum for integrity verification
   */
  private calculateChecksum(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Store key securely (encrypted with KEK - Key Encryption Key)
   *
   * @param key - Master key to store
   * @param metadata - Key metadata
   * @param kek - Key Encryption Key (from environment or HSM)
   */
  public async storeKey(key: string, metadata: KeyMetadata, kek: string): Promise<void> {
    try {
      await fs.mkdir(this.keyStoragePath, { recursive: true, mode: 0o700 });

      const encryption = new HIPAAEncryption(kek);
      const encryptedKey = encryption.encrypt(key);
      const checksum = this.calculateChecksum(key);

      const keyStorage: KeyStorage = {
        metadata,
        encryptedKey,
        checksum,
      };

      const filePath = path.join(this.keyStoragePath, `${metadata.keyId}.json`);
      await fs.writeFile(filePath, JSON.stringify(keyStorage, null, 2), { mode: 0o600 });

      encryption.destroy();
    } catch (error) {
      throw new Error(
        `Failed to store key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load key from secure storage
   *
   * @param keyId - Key identifier
   * @param kek - Key Encryption Key
   * @returns Decrypted master key and metadata
   */
  public async loadKey(
    keyId: string,
    kek: string
  ): Promise<{ key: string; metadata: KeyMetadata }> {
    try {
      const filePath = path.join(this.keyStoragePath, `${keyId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const keyStorage: KeyStorage = JSON.parse(data);

      const encryption = new HIPAAEncryption(kek);
      const key = encryption.decrypt(keyStorage.encryptedKey) as string;
      encryption.destroy();

      // Verify checksum
      const checksum = this.calculateChecksum(key);
      if (checksum !== keyStorage.checksum) {
        throw new Error('Key integrity check failed - possible corruption');
      }

      return { key, metadata: keyStorage.metadata };
    } catch (error) {
      throw new Error(
        `Failed to load key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List all stored keys
   *
   * @returns Array of key metadata
   */
  public async listKeys(): Promise<KeyMetadata[]> {
    try {
      const files = await fs.readdir(this.keyStoragePath);
      const keys: KeyMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.keyStoragePath, file), 'utf8');
          const keyStorage: KeyStorage = JSON.parse(data);
          keys.push(keyStorage.metadata);
        }
      }

      return keys.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get active key
   *
   * @returns Active key metadata or null
   */
  public async getActiveKey(): Promise<KeyMetadata | null> {
    const keys = await this.listKeys();
    return keys.find((k) => k.active) || null;
  }

  /**
   * Check if key needs rotation
   *
   * @param metadata - Key metadata
   * @returns True if rotation is needed
   */
  public needsRotation(metadata: KeyMetadata): boolean {
    if (!metadata.expiresAt) {
      return false;
    }

    const now = Date.now();
    return now >= metadata.expiresAt - this.rotationPolicy.gracePeriod;
  }

  /**
   * Rotate master key
   *
   * @param kek - Key Encryption Key
   * @returns New key and metadata
   */
  public async rotateKey(kek: string): Promise<{ key: string; metadata: KeyMetadata }> {
    const activeKey = await this.getActiveKey();

    if (activeKey) {
      // Deactivate old key but keep it available during grace period
      const filePath = path.join(this.keyStoragePath, `${activeKey.keyId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const keyStorage: KeyStorage = JSON.parse(data);
      keyStorage.metadata.active = false;
      await fs.writeFile(filePath, JSON.stringify(keyStorage, null, 2));
    }

    // Generate new key
    const { key, metadata } = await generateKey({
      version: activeKey ? activeKey.version + 1 : 1,
      purpose: activeKey?.purpose,
    });

    // Store new key
    await this.storeKey(key, metadata, kek);

    return { key, metadata };
  }

  /**
   * Delete old keys beyond grace period
   *
   * @param kek - Key Encryption Key (for verification)
   */
  public async cleanupOldKeys(kek: string): Promise<number> {
    const keys = await this.listKeys();
    const now = Date.now();
    let deleted = 0;

    for (const metadata of keys) {
      if (!metadata.active && metadata.expiresAt) {
        const gracePeriodExpired = now > metadata.expiresAt + this.rotationPolicy.gracePeriod;

        if (gracePeriodExpired) {
          const filePath = path.join(this.keyStoragePath, `${metadata.keyId}.json`);
          await fs.unlink(filePath);
          deleted++;
        }
      }
    }

    return deleted;
  }

  /**
   * Export key for backup (encrypted)
   *
   * @param keyId - Key identifier
   * @param kek - Key Encryption Key
   * @param backupPassword - Password for backup encryption
   * @returns Encrypted backup data
   */
  public async exportKeyForBackup(
    keyId: string,
    kek: string,
    backupPassword: string
  ): Promise<string> {
    const { key, metadata } = await this.loadKey(keyId, kek);

    const backupEncryption = new HIPAAEncryption(
      crypto.scryptSync(backupPassword, 'backup-salt', 32)
    );

    const backupData = {
      key,
      metadata,
      exportedAt: Date.now(),
    };

    const encrypted = backupEncryption.encrypt(JSON.stringify(backupData));
    backupEncryption.destroy();

    return JSON.stringify(encrypted);
  }

  /**
   * Import key from backup
   *
   * @param backupData - Encrypted backup data
   * @param backupPassword - Password for backup decryption
   * @param kek - Key Encryption Key for storage
   */
  public async importKeyFromBackup(
    backupData: string,
    backupPassword: string,
    kek: string
  ): Promise<KeyMetadata> {
    const backupEncryption = new HIPAAEncryption(
      crypto.scryptSync(backupPassword, 'backup-salt', 32)
    );

    const encrypted = JSON.parse(backupData);
    const decrypted = backupEncryption.decrypt(encrypted) as string;
    backupEncryption.destroy();

    const { key, metadata } = JSON.parse(decrypted);

    // Store imported key
    await this.storeKey(key, metadata, kek);

    return metadata;
  }
}

/**
 * Generate a new master key (convenience function)
 */
export async function generateKey(
  metadata?: Partial<KeyMetadata>
): Promise<{ key: string; metadata: KeyMetadata }> {
  const manager = new KeyManager();
  return manager.generateKey(metadata);
}

/**
 * Generate KEK from environment or secrets manager
 * This should integrate with your secrets management solution
 */
export function getKEK(): string {
  const kek = process.env.HIPAA_KEK || process.env.KEY_ENCRYPTION_KEY;

  if (!kek) {
    throw new Error(
      'KEK (Key Encryption Key) not found. Set HIPAA_KEK environment variable.\n' +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  return kek;
}

export default KeyManager;
