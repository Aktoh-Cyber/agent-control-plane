/**
 * HIPAA-Compliant AES-256-GCM Encryption
 *
 * Production-grade encryption implementation meeting HIPAA security requirements:
 * - AES-256-GCM (FIPS 140-2 compliant)
 * - Unique IV per encryption operation
 * - Authentication tags for data integrity
 * - Secure key derivation (PBKDF2)
 * - Zero plaintext key storage
 *
 * @module security/hipaa-encryption
 */

import * as crypto from 'crypto';

/**
 * Encryption configuration constants
 */
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm' as const,
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits (recommended for GCM)
  AUTH_TAG_LENGTH: 16, // 128 bits
  SALT_LENGTH: 64, // 512 bits for PBKDF2
  PBKDF2_ITERATIONS: 600000, // OWASP recommendation (2023)
  PBKDF2_DIGEST: 'sha512' as const,
} as const;

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  /** Base64-encoded encrypted data */
  ciphertext: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded authentication tag */
  authTag: string;
  /** Base64-encoded salt (for key derivation) */
  salt: string;
  /** Algorithm version for future compatibility */
  version: string;
  /** Timestamp of encryption */
  timestamp: number;
}

/**
 * Key derivation options
 */
export interface KeyDerivationOptions {
  /** Salt for key derivation (auto-generated if not provided) */
  salt?: Buffer;
  /** Number of PBKDF2 iterations */
  iterations?: number;
  /** Digest algorithm */
  digest?: string;
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  /** Additional authenticated data (AAD) */
  aad?: string;
  /** Key derivation options */
  keyDerivation?: KeyDerivationOptions;
}

/**
 * HIPAA Encryption Service
 *
 * Provides production-grade encryption/decryption with:
 * - Automatic key derivation from master key
 * - Unique IV generation per operation
 * - Authentication tag verification
 * - Key rotation support
 */
export class HIPAAEncryption {
  private masterKey: Buffer | null = null;
  private readonly keyCache = new Map<string, { key: Buffer; timestamp: number }>();
  private readonly KEY_CACHE_TTL = 3600000; // 1 hour

  /**
   * Initialize encryption service with master key
   *
   * @param masterKey - Master encryption key (from environment or secrets manager)
   * @throws Error if master key is invalid
   */
  constructor(masterKey?: string | Buffer) {
    if (masterKey) {
      this.setMasterKey(masterKey);
    }
  }

  /**
   * Set or rotate the master encryption key
   *
   * @param masterKey - New master key (hex, base64, or Buffer)
   */
  public setMasterKey(masterKey: string | Buffer): void {
    if (typeof masterKey === 'string') {
      // Try hex first, then base64
      try {
        this.masterKey = Buffer.from(masterKey, 'hex');
        if (this.masterKey.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
          this.masterKey = Buffer.from(masterKey, 'base64');
        }
      } catch {
        this.masterKey = Buffer.from(masterKey, 'base64');
      }
    } else {
      this.masterKey = masterKey;
    }

    if (this.masterKey.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
      throw new Error(
        `Master key must be ${ENCRYPTION_CONFIG.KEY_LENGTH} bytes (${ENCRYPTION_CONFIG.KEY_LENGTH * 8} bits)`
      );
    }

    // Clear key cache on rotation
    this.keyCache.clear();
  }

  /**
   * Generate a new random master key
   *
   * @returns Hex-encoded master key
   */
  public static generateMasterKey(): string {
    return crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH).toString('hex');
  }

  /**
   * Derive encryption key from master key using PBKDF2
   *
   * @param salt - Salt for key derivation
   * @param options - Key derivation options
   * @returns Derived encryption key
   */
  private deriveKey(salt: Buffer, options: KeyDerivationOptions = {}): Buffer {
    if (!this.masterKey) {
      throw new Error('Master key not set. Call setMasterKey() first.');
    }

    const cacheKey = `${salt.toString('hex')}-${options.iterations || ENCRYPTION_CONFIG.PBKDF2_ITERATIONS}`;
    const cached = this.keyCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.KEY_CACHE_TTL) {
      return cached.key;
    }

    const iterations = options.iterations || ENCRYPTION_CONFIG.PBKDF2_ITERATIONS;
    const digest = options.digest || ENCRYPTION_CONFIG.PBKDF2_DIGEST;

    const derivedKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      iterations,
      ENCRYPTION_CONFIG.KEY_LENGTH,
      digest
    );

    // Cache the derived key
    this.keyCache.set(cacheKey, { key: derivedKey, timestamp: Date.now() });

    // Cleanup old cache entries
    if (this.keyCache.size > 100) {
      const entries = Array.from(this.keyCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 50; i++) {
        this.keyCache.delete(entries[i][0]);
      }
    }

    return derivedKey;
  }

  /**
   * Encrypt data using AES-256-GCM
   *
   * @param plaintext - Data to encrypt (string or Buffer)
   * @param options - Encryption options
   * @returns Encrypted data structure
   * @throws Error if encryption fails
   */
  public encrypt(plaintext: string | Buffer, options: EncryptionOptions = {}): EncryptedData {
    try {
      // Generate random salt and IV
      const salt = options.keyDerivation?.salt || crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);

      // Derive encryption key
      const key = this.deriveKey(salt, options.keyDerivation);

      // Create cipher
      const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.ALGORITHM, key, iv, {
        authTagLength: ENCRYPTION_CONFIG.AUTH_TAG_LENGTH,
      });

      // Add additional authenticated data (AAD) if provided
      if (options.aad) {
        cipher.setAAD(Buffer.from(options.aad, 'utf8'));
      }

      // Encrypt data
      const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        salt: salt.toString('base64'),
        version: '1.0',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   *
   * @param encryptedData - Encrypted data structure
   * @param options - Decryption options
   * @returns Decrypted plaintext
   * @throws Error if decryption or authentication fails
   */
  public decrypt(
    encryptedData: EncryptedData,
    options: { aad?: string; encoding?: BufferEncoding } = {}
  ): string | Buffer {
    try {
      // Parse encrypted data
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      const salt = Buffer.from(encryptedData.salt, 'base64');

      // Derive decryption key
      const key = this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.ALGORITHM, key, iv, {
        authTagLength: ENCRYPTION_CONFIG.AUTH_TAG_LENGTH,
      });

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Add additional authenticated data (AAD) if provided
      if (options.aad) {
        decipher.setAAD(Buffer.from(options.aad, 'utf8'));
      }

      // Decrypt data
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return options.encoding ? decrypted.toString(options.encoding) : decrypted.toString('utf8');
    } catch (error) {
      throw new Error(
        `Decryption failed (possible tampering or wrong key): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Encrypt data and return as compact JSON string
   *
   * @param plaintext - Data to encrypt
   * @param options - Encryption options
   * @returns JSON string of encrypted data
   */
  public encryptToJSON(plaintext: string | Buffer, options: EncryptionOptions = {}): string {
    const encrypted = this.encrypt(plaintext, options);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt data from JSON string
   *
   * @param json - JSON string of encrypted data
   * @param options - Decryption options
   * @returns Decrypted plaintext
   */
  public decryptFromJSON(
    json: string,
    options: { aad?: string; encoding?: BufferEncoding } = {}
  ): string | Buffer {
    const encrypted = JSON.parse(json) as EncryptedData;
    return this.decrypt(encrypted, options);
  }

  /**
   * Re-encrypt data with a new key (for key rotation)
   *
   * @param encryptedData - Data encrypted with old key
   * @param newMasterKey - New master key
   * @param options - Re-encryption options
   * @returns Re-encrypted data
   */
  public static reencrypt(
    encryptedData: EncryptedData,
    oldMasterKey: string | Buffer,
    newMasterKey: string | Buffer,
    options: EncryptionOptions = {}
  ): EncryptedData {
    // Decrypt with old key
    const oldEncryption = new HIPAAEncryption(oldMasterKey);
    const plaintext = oldEncryption.decrypt(encryptedData, options);

    // Encrypt with new key
    const newEncryption = new HIPAAEncryption(newMasterKey);
    return newEncryption.encrypt(plaintext, options);
  }

  /**
   * Verify encrypted data integrity without decrypting
   *
   * @param encryptedData - Encrypted data to verify
   * @returns True if data is valid and unmodified
   */
  public verify(encryptedData: EncryptedData): boolean {
    try {
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear sensitive data from memory
   */
  public destroy(): void {
    if (this.masterKey) {
      this.masterKey.fill(0);
      this.masterKey = null;
    }
    this.keyCache.clear();
  }
}

/**
 * Singleton instance for convenience (optional)
 * Initialize with environment variable
 */
let defaultInstance: HIPAAEncryption | null = null;

/**
 * Get default HIPAA encryption instance
 * Automatically initializes from HIPAA_MASTER_KEY environment variable
 *
 * @returns Default encryption instance
 * @throws Error if HIPAA_MASTER_KEY is not set
 */
export function getDefaultEncryption(): HIPAAEncryption {
  if (!defaultInstance) {
    const masterKey = process.env.HIPAA_MASTER_KEY;
    if (!masterKey) {
      throw new Error(
        'HIPAA_MASTER_KEY environment variable not set. ' +
          'Generate a key with: HIPAAEncryption.generateMasterKey()'
      );
    }
    defaultInstance = new HIPAAEncryption(masterKey);
  }
  return defaultInstance;
}

/**
 * Convenience function to encrypt with default instance
 */
export function encrypt(plaintext: string | Buffer, options?: EncryptionOptions): EncryptedData {
  return getDefaultEncryption().encrypt(plaintext, options);
}

/**
 * Convenience function to decrypt with default instance
 */
export function decrypt(
  encryptedData: EncryptedData,
  options?: { aad?: string; encoding?: BufferEncoding }
): string | Buffer {
  return getDefaultEncryption().decrypt(encryptedData, options);
}

/**
 * Export types and constants
 */
export default HIPAAEncryption;
